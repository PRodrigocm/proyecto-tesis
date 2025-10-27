import { NextRequest, NextResponse } from 'next/server'
import { prisma, withPrismaConnection } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { notificarAsistenciaQR } from '@/lib/notifications'

/**
 * API simplificada para escaneo QR de asistencias
 * Maneja automáticamente la validación de duplicados por fecha y sesión
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 API QR Scan - Iniciando procesamiento')

    // 1. VERIFICAR AUTENTICACIÓN
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    } catch (jwtError) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // 2. OBTENER INFORMACIÓN DEL USUARIO
    const userInfo = await withPrismaConnection(() => 
      prisma.usuario.findUnique({
        where: { idUsuario: decoded.userId },
        include: { ie: true }
      })
    )

    if (!userInfo || !['DOCENTE', 'ADMINISTRATIVO'].includes(decoded.rol)) {
      return NextResponse.json({ error: 'Sin permisos de docente' }, { status: 403 })
    }

    // 3. OBTENER DATOS DEL BODY
    const body = await request.json()
    const { 
      qrCode, 
      sesion, 
      estado = 'PRESENTE',
      fecha = new Date().toISOString().split('T')[0] // Fecha actual por defecto
    } = body

    console.log('📋 Datos recibidos:', { qrCode, sesion, estado, fecha })

    if (!qrCode) {
      return NextResponse.json({ error: 'Código QR requerido' }, { status: 400 })
    }

    // 4. DETERMINAR SESIÓN AUTOMÁTICAMENTE
    const fechaHoy = new Date()
    const horaActual = fechaHoy.getHours()
    const sesionCalculada = sesion || (horaActual < 12 ? 'AM' : 'PM')

    console.log(`⏰ Sesión determinada: ${sesionCalculada} (hora actual: ${horaActual}:xx)`)

    // 5. BUSCAR ESTUDIANTE POR DNI, CÓDIGO O QR
    const codigoLimpio = qrCode.trim()
    console.log(`🔍 Buscando estudiante con código/DNI/QR: ${codigoLimpio}`)
    
    // Primero, vamos a ver qué estudiantes hay en la BD para debugging
    const todosEstudiantes = await withPrismaConnection(() =>
      prisma.estudiante.findMany({
        where: {
          usuario: {
            idIe: userInfo.idIe,
            estado: 'ACTIVO'
          }
        },
        include: {
          usuario: true
        },
        take: 5 // Solo los primeros 5 para no saturar logs
      })
    )
    
    console.log(`📊 Estudiantes disponibles en la IE (primeros 5):`)
    todosEstudiantes.forEach(est => {
      console.log(`  - ID: ${est.idEstudiante}, DNI: ${est.usuario.dni}, Código: ${est.codigo}, QR: ${est.qr}, Nombre: ${est.usuario.nombre}`)
    })
    
    const estudiante = await withPrismaConnection(() => 
      prisma.estudiante.findFirst({
        where: {
          OR: [
            // Buscar por DNI (exacto)
            {
              usuario: {
                dni: codigoLimpio,
                idIe: userInfo.idIe,
                estado: 'ACTIVO'
              }
            },
            // Buscar por código de estudiante (exacto)
            {
              codigo: codigoLimpio,
              usuario: {
                idIe: userInfo.idIe,
                estado: 'ACTIVO'
              }
            },
            // Buscar por campo QR (exacto)
            {
              qr: codigoLimpio,
              usuario: {
                idIe: userInfo.idIe,
                estado: 'ACTIVO'
              }
            },
            // Buscar por código insensible a mayúsculas
            {
              codigo: {
                equals: codigoLimpio,
                mode: 'insensitive'
              },
              usuario: {
                idIe: userInfo.idIe,
                estado: 'ACTIVO'
              }
            },
            // Buscar por QR insensible a mayúsculas
            {
              qr: {
                equals: codigoLimpio,
                mode: 'insensitive'
              },
              usuario: {
                idIe: userInfo.idIe,
                estado: 'ACTIVO'
              }
            }
          ]
        },
        include: {
          usuario: true,
          gradoSeccion: {
            include: {
              grado: true,
              seccion: true
            }
          }
        }
      })
    )
    
    console.log(`🎯 Resultado de búsqueda para "${codigoLimpio}":`, estudiante ? `Encontrado: ${estudiante.usuario.nombre}` : 'No encontrado')

    if (!estudiante) {
      console.log(`❌ Estudiante no encontrado con código/DNI: ${codigoLimpio}`)
      return NextResponse.json({ 
        error: 'Estudiante no encontrado',
        details: `No se encontró estudiante con código/DNI: ${codigoLimpio}. Verifica que el estudiante esté activo y pertenezca a esta institución.`
      }, { status: 404 })
    }

    console.log(`👤 Estudiante encontrado: ${estudiante.usuario.nombre} ${estudiante.usuario.apellido}`)

    // Verificar que el estudiante tenga grado y sección asignados
    if (!estudiante.gradoSeccion) {
      console.log(`❌ Estudiante sin grado/sección asignado: ${estudiante.usuario.nombre}`)
      return NextResponse.json({ 
        error: 'Estudiante sin grado/sección',
        details: `El estudiante ${estudiante.usuario.nombre} ${estudiante.usuario.apellido} no tiene grado y sección asignados.`
      }, { status: 400 })
    }

    // 6. PREPARAR FECHA SIN HORA
    const fechaAsistencia = new Date(fecha)
    fechaAsistencia.setHours(0, 0, 0, 0)

    // 7. VERIFICAR DUPLICADOS POR FECHA Y SESIÓN
    const asistenciaExistente = await withPrismaConnection(() =>
      prisma.asistencia.findFirst({
        where: {
          idEstudiante: estudiante.idEstudiante,
          fecha: fechaAsistencia,
          sesion: sesionCalculada
        },
        include: {
          estadoAsistencia: true
        }
      })
    )

    // 8. SI YA EXISTE, RETORNAR INFORMACIÓN
    if (asistenciaExistente) {
      const estadoActual = asistenciaExistente.estadoAsistencia
      
      console.log(`⚠️ Asistencia duplicada detectada para ${estudiante.usuario.nombre}`)
      
      return NextResponse.json({
        success: false,
        duplicado: true,
        mensaje: `✅ ${estudiante.usuario.nombre} ${estudiante.usuario.apellido} ya registró asistencia hoy en la sesión ${sesionCalculada}`,
        estudiante: {
          id: estudiante.idEstudiante,
          nombre: estudiante.usuario.nombre,
          apellido: estudiante.usuario.apellido,
          dni: estudiante.usuario.dni,
          grado: estudiante.gradoSeccion?.grado?.nombre || 'Sin grado',
          seccion: estudiante.gradoSeccion?.seccion?.nombre || 'Sin sección'
        },
        asistencia: {
          fecha: fechaAsistencia.toISOString().split('T')[0],
          sesion: sesionCalculada,
          estado: estadoActual?.codigo || 'REGISTRADO',
          horaRegistro: asistenciaExistente.horaEntrada?.toISOString() || asistenciaExistente.createdAt.toISOString()
        }
      })
    }

    // 9. BUSCAR O CREAR ESTADO DE ASISTENCIA
    let estadoAsistencia = await withPrismaConnection(() =>
      prisma.estadoAsistencia.findFirst({
        where: { codigo: estado.toUpperCase() }
      })
    )

    if (!estadoAsistencia) {
      estadoAsistencia = await withPrismaConnection(() =>
        prisma.estadoAsistencia.create({
          data: {
            codigo: estado.toUpperCase(),
            nombreEstado: estado.charAt(0).toUpperCase() + estado.slice(1),
            activo: true,
            afectaAsistencia: true,
            requiereJustificacion: estado.toUpperCase() === 'AUSENTE'
          }
        })
      )
    }

    // 10. CREAR NUEVA ASISTENCIA
    const nuevaAsistencia = await withPrismaConnection(() => 
      prisma.asistencia.create({
        data: {
          idEstudiante: estudiante.idEstudiante,
          idIe: userInfo.idIe,
          fecha: fechaAsistencia,
          horaEntrada: fechaHoy,
          sesion: sesionCalculada,
          idEstadoAsistencia: estadoAsistencia?.idEstadoAsistencia,
          fuente: 'QR_SCANNER',
          observaciones: `Registrado por QR - ${estado.toUpperCase()} - Sesión: ${sesionCalculada}`,
          registradoPor: userInfo.idUsuario
        }
      })
    )

    console.log(`✅ Asistencia creada exitosamente:`, {
      idAsistencia: nuevaAsistencia.idAsistencia,
      estudiante: `${estudiante.usuario.nombre} ${estudiante.usuario.apellido}`,
      sesion: sesionCalculada,
      fecha: fechaAsistencia.toISOString().split('T')[0]
    })

    // 10.5. ENVIAR NOTIFICACIONES (COMENTADO TEMPORALMENTE - REQUIERE CORRECCIÓN DE SCHEMA)
    /*
    const docente = await withPrismaConnection(() =>
      prisma.docente.findFirst({
        where: { idUsuario: userInfo.idUsuario },
        include: { usuario: true }
      })
    )

    const apoderado = await withPrismaConnection(() =>
      prisma.apoderado.findFirst({
        where: { 
          estudiantes: {
            some: { idEstudiante: estudiante.idEstudiante }
          }
        },
        include: { usuario: true }
      })
    )

    const horarioClase = await withPrismaConnection(() =>
      prisma.horarioClase.findFirst({
        where: {
          idGradoSeccion: estudiante.idGradoSeccion,
          idDocente: docente?.idDocente,
          activo: true
        }
      })
    )

    const aula = horarioClase?.aula || `Aula ${estudiante.gradoSeccion.grado.nombre}° ${estudiante.gradoSeccion.seccion.nombre}`

    if (apoderado && docente) {
      console.log('📧 Preparando notificaciones para el apoderado...')
      
      try {
        const resultadoNotificaciones = await notificarAsistenciaQR({
          estudianteNombre: estudiante.usuario.nombre,
          estudianteApellido: estudiante.usuario.apellido,
          estudianteDNI: estudiante.usuario.dni,
          grado: estudiante.gradoSeccion.grado.nombre,
          seccion: estudiante.gradoSeccion.seccion.nombre,
          aula: aula,
          estado: estado.toUpperCase(),
          hora: fechaHoy.toISOString(),
          fecha: fechaAsistencia.toISOString(),
          docenteNombre: docente.usuario.nombre,
          docenteApellido: docente.usuario.apellido,
          emailApoderado: apoderado.usuario.email,
          telefonoApoderado: apoderado.usuario.telefono || ''
        })

        console.log('📧 Resultado de notificaciones:', resultadoNotificaciones)
      } catch (notifError) {
        console.error('⚠️ Error al enviar notificaciones (no crítico):', notifError)
      }
    } else {
      console.log('⚠️ No se encontró apoderado o docente para enviar notificaciones')
    }
    */
    console.log('📧 Notificaciones deshabilitadas temporalmente - requiere corrección de schema')

    // 11. RESPUESTA EXITOSA
    return NextResponse.json({
      success: true,
      mensaje: `✅ Asistencia registrada exitosamente para ${estudiante.usuario.nombre} ${estudiante.usuario.apellido}`,
      estudiante: {
        id: estudiante.idEstudiante,
        nombre: estudiante.usuario.nombre,
        apellido: estudiante.usuario.apellido,
        dni: estudiante.usuario.dni,
        grado: estudiante.gradoSeccion.grado.nombre,
        seccion: estudiante.gradoSeccion.seccion.nombre
      },
      asistencia: {
        id: nuevaAsistencia.idAsistencia,
        fecha: fechaAsistencia.toISOString().split('T')[0],
        sesion: sesionCalculada,
        estado: estado.toUpperCase(),
        horaRegistro: fechaHoy.toISOString(),
        fuente: 'QR_SCANNER'
      },
      timestamp: fechaHoy.toISOString()
    })

  } catch (error) {
    console.error('❌ Error en QR Scan API:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

/**
 * Endpoint GET para obtener información de asistencias del día
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get('fecha') || new Date().toISOString().split('T')[0]
    const sesion = searchParams.get('sesion')

    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any

    const userInfo = await withPrismaConnection(() => 
      prisma.usuario.findUnique({
        where: { idUsuario: decoded.userId },
        include: { ie: true }
      })
    )

    if (!userInfo) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Preparar filtros
    const fechaAsistencia = new Date(fecha)
    fechaAsistencia.setHours(0, 0, 0, 0)

    const whereClause: any = {
      idIe: userInfo.idIe,
      fecha: fechaAsistencia
    }

    if (sesion) {
      whereClause.sesion = sesion
    }

    // Obtener asistencias del día
    const asistencias = await withPrismaConnection(() =>
      prisma.asistencia.findMany({
        where: whereClause,
        include: {
          estudiante: {
            include: {
              usuario: true,
              gradoSeccion: {
                include: {
                  grado: true,
                  seccion: true
                }
              }
            }
          },
          estadoAsistencia: true
        },
        orderBy: [
          { sesion: 'asc' },
          { horaEntrada: 'desc' }
        ]
      })
    )

    return NextResponse.json({
      success: true,
      fecha: fecha,
      sesion: sesion || 'TODAS',
      total: asistencias.length,
      asistencias: asistencias.map(asistencia => ({
        id: asistencia.idAsistencia,
        estudiante: {
          id: asistencia.estudiante.idEstudiante,
          nombre: asistencia.estudiante.usuario.nombre,
          apellido: asistencia.estudiante.usuario.apellido,
          dni: asistencia.estudiante.usuario.dni,
          grado: asistencia.estudiante.gradoSeccion?.grado?.nombre || 'Sin grado',
          seccion: asistencia.estudiante.gradoSeccion?.seccion?.nombre || 'Sin sección'
        },
        fecha: asistencia.fecha.toISOString().split('T')[0],
        sesion: asistencia.sesion,
        estado: asistencia.estadoAsistencia?.codigo || 'SIN_ESTADO',
        horaRegistro: asistencia.horaEntrada?.toISOString() || asistencia.createdAt.toISOString(),
        fuente: asistencia.fuente
      }))
    })

  } catch (error) {
    console.error('❌ Error en GET QR Scan API:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
