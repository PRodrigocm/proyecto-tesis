import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { notificarInasistencia } from '@/lib/notifications'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

/**
 * POST - Marcar inasistencias automáticas para estudiantes que no registraron asistencia
 * Se ejecuta automáticamente cuando termina el horario de clases
 * También envía notificaciones a los padres de familia
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Iniciando marcado automático de inasistencias...')
    
    // Obtener información del token
    const authHeader = request.headers.get('authorization')
    let ieId = 1
    let userId: number | null = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, JWT_SECRET) as any
        ieId = decoded.ieId || 1
        userId = decoded.userId || null
      } catch {
        // Continuar con valores por defecto
      }
    }

    const body = await request.json()
    const { 
      fecha, 
      idGradoSeccion, 
      idHorarioClase,
      idDocenteAula, // ID de la clase del docente (DocenteAula)
      forzar = false // Si es true, marca inasistencia sin verificar hora
    } = body

    if (!fecha) {
      return NextResponse.json({ error: 'Fecha es requerida' }, { status: 400 })
    }

    // Parsear la fecha correctamente para evitar problemas de zona horaria
    // fecha viene como "YYYY-MM-DD", la parseamos manualmente
    const [anio, mes, dia] = fecha.split('-').map(Number)
    const fechaAsistencia = new Date(anio, mes - 1, dia, 0, 0, 0, 0)
    
    console.log(`📅 Fecha recibida: ${fecha}, Fecha parseada: ${fechaAsistencia.toLocaleDateString()}`)
    
    // Obtener hora actual en Perú (UTC-5)
    const ahora = new Date()
    const horaActualPeru = new Date(ahora.getTime() - (5 * 60 * 60 * 1000))
    const horaActualMinutos = horaActualPeru.getHours() * 60 + horaActualPeru.getMinutes()

    // Si hay horario de clase específico, verificar que ya pasó la hora fin
    let horaFinClase: number | null = null
    if (idHorarioClase && !forzar) {
      const horario = await prisma.horarioClase.findUnique({
        where: { idHorarioClase: parseInt(idHorarioClase) }
      })
      
      if (horario?.horaFin) {
        const horaFin = new Date(horario.horaFin)
        horaFinClase = horaFin.getUTCHours() * 60 + horaFin.getUTCMinutes()
        
        // Si aún no ha terminado la clase, no marcar inasistencias
        if (horaActualMinutos < horaFinClase) {
          return NextResponse.json({
            success: false,
            message: 'La clase aún no ha terminado',
            horaActual: `${Math.floor(horaActualMinutos/60)}:${horaActualMinutos%60}`,
            horaFinClase: `${Math.floor(horaFinClase/60)}:${horaFinClase%60}`
          })
        }
      }
    }

    // Determinar el idGradoSeccion a usar
    let gradoSeccionId: number | null = null
    
    if (idGradoSeccion) {
      gradoSeccionId = parseInt(idGradoSeccion)
    } else if (idDocenteAula || idHorarioClase) {
      // Obtener idGradoSeccion desde DocenteAula o HorarioClase
      if (idDocenteAula) {
        const docenteAula = await prisma.docenteAula.findUnique({
          where: { idDocenteAula: parseInt(idDocenteAula) }
        })
        if (docenteAula) {
          gradoSeccionId = docenteAula.idGradoSeccion
          console.log(`📚 GradoSeccion obtenido de DocenteAula: ${gradoSeccionId}`)
        }
      } else if (idHorarioClase) {
        const horarioClase = await prisma.horarioClase.findUnique({
          where: { idHorarioClase: parseInt(idHorarioClase) }
        })
        if (horarioClase) {
          gradoSeccionId = horarioClase.idGradoSeccion
          console.log(`📚 GradoSeccion obtenido de HorarioClase: ${gradoSeccionId}`)
        }
      }
    }

    if (!gradoSeccionId) {
      return NextResponse.json({ 
        error: 'No se pudo determinar el grado/sección. Proporcione idGradoSeccion, idDocenteAula o idHorarioClase válido.' 
      }, { status: 400 })
    }

    // Obtener todos los estudiantes del grado/sección
    const whereEstudiantes: any = {
      idGradoSeccion: gradoSeccionId,
      usuario: {
        idIe: ieId,
        estado: 'ACTIVO'
      }
    }

    const estudiantes = await prisma.estudiante.findMany({
      where: whereEstudiantes,
      include: {
        usuario: true,
        gradoSeccion: {
          include: {
            grado: true,
            seccion: true
          }
        },
        // Incluir apoderados para enviar notificaciones
        apoderados: {
          include: {
            apoderado: {
              include: {
                usuario: true
              }
            }
          }
        }
      }
    })

    console.log(`📋 Encontrados ${estudiantes.length} estudiantes para verificar`)

    // Buscar o crear estado INASISTENCIA
    let estadoInasistencia = await prisma.estadoAsistencia.findFirst({
      where: { codigo: 'INASISTENCIA' }
    })

    if (!estadoInasistencia) {
      estadoInasistencia = await prisma.estadoAsistencia.create({
        data: {
          codigo: 'INASISTENCIA',
          nombreEstado: 'Inasistencia',
          requiereJustificacion: true,
          afectaAsistencia: true,
          activo: true
        }
      })
    }

    let marcados = 0
    let yaRegistrados = 0
    const estudiantesMarcados: {
      id: number
      nombre: string
      dni: string
      grado: string
      seccion: string
      apoderados: any[]
    }[] = []

    // Crear rango de fechas para la consulta (inicio y fin del día)
    const fechaInicio = new Date(anio, mes - 1, dia, 0, 0, 0, 0)
    const fechaFin = new Date(anio, mes - 1, dia, 23, 59, 59, 999)
    
    console.log(`🔍 Buscando asistencias en tabla Asistencia entre ${fechaInicio.toISOString()} y ${fechaFin.toISOString()}`)

    for (const estudiante of estudiantes) {
      // Verificar si ya tiene asistencia registrada en tabla Asistencia (usando rango de fechas)
      const asistenciaExistente = await prisma.asistencia.findFirst({
        where: {
          idEstudiante: estudiante.idEstudiante,
          fecha: {
            gte: fechaInicio,
            lte: fechaFin
          }
        },
        include: {
          estadoAsistencia: true
        }
      })

      if (asistenciaExistente) {
        console.log(`⚠️ ${estudiante.usuario?.nombre} ya tiene registro en Asistencia: estado=${asistenciaExistente.estadoAsistencia?.codigo}, fecha=${asistenciaExistente.fecha}`)
        yaRegistrados++
        continue // Ya tiene registro, no marcar inasistencia
      }

      // Marcar como INASISTENCIA en tabla Asistencia
      const nuevaAsistencia = await prisma.asistencia.create({
        data: {
          idEstudiante: estudiante.idEstudiante,
          fecha: fechaAsistencia,
          idEstadoAsistencia: estadoInasistencia.idEstadoAsistencia,
          idHorarioClase: idHorarioClase ? parseInt(idHorarioClase) : null,
          registradoPor: userId,
          observaciones: 'Inasistencia marcada automáticamente por el sistema al finalizar la clase'
        }
      })

      // Guardar en histórico
      await prisma.historicoEstadoAsistencia.create({
        data: {
          idAsistencia: nuevaAsistencia.idAsistencia,
          idEstadoAsistencia: estadoInasistencia.idEstadoAsistencia,
          cambiadoPor: userId,
          fechaCambio: new Date()
        }
      })

      marcados++
      estudiantesMarcados.push({
        id: estudiante.idEstudiante,
        nombre: `${estudiante.usuario?.nombre} ${estudiante.usuario?.apellido}`,
        dni: estudiante.usuario?.dni || '',
        grado: estudiante.gradoSeccion?.grado?.nombre || '',
        seccion: estudiante.gradoSeccion?.seccion?.nombre || '',
        apoderados: estudiante.apoderados || []
      })
      
      console.log(`❌ Inasistencia marcada: ${estudiante.usuario?.nombre} ${estudiante.usuario?.apellido}`)
    }

    console.log(`✅ Proceso completado: ${marcados} inasistencias marcadas, ${yaRegistrados} ya tenían registro`)

    // FASE 2: Enviar notificaciones a los padres de familia (después de marcar todas las inasistencias)
    let notificacionesEnviadas = 0
    let notificacionesFallidas = 0

    if (marcados > 0) {
      console.log(`📧 Iniciando envío de notificaciones a padres de familia...`)
      
      for (const estData of estudiantesMarcados) {
        if (estData.apoderados && estData.apoderados.length > 0) {
          for (const relacion of estData.apoderados) {
            const apoderado = relacion.apoderado
            if (apoderado?.usuario) {
              try {
                await notificarInasistencia({
                  estudianteId: estData.id,
                  estudianteNombre: estData.nombre.split(' ')[0] || '',
                  estudianteApellido: estData.nombre.split(' ').slice(1).join(' ') || '',
                  estudianteDNI: estData.dni,
                  grado: estData.grado,
                  seccion: estData.seccion,
                  fecha: fechaAsistencia.toISOString(),
                  emailApoderado: apoderado.usuario.email || '',
                  telefonoApoderado: apoderado.usuario.telefono || '',
                  apoderadoUsuarioId: apoderado.usuario.idUsuario
                })
                notificacionesEnviadas++
                console.log(`📧 Notificación enviada a: ${apoderado.usuario.nombre} ${apoderado.usuario.apellido}`)
              } catch (notifError) {
                notificacionesFallidas++
                console.error(`❌ Error enviando notificación a apoderado:`, notifError)
              }
            }
          }
        }
      }
      
      console.log(`📧 Notificaciones: ${notificacionesEnviadas} enviadas, ${notificacionesFallidas} fallidas`)
    }

    return NextResponse.json({
      success: true,
      message: `Inasistencias marcadas automáticamente`,
      marcados,
      yaRegistrados,
      notificacionesEnviadas,
      notificacionesFallidas,
      total: estudiantes.length,
      estudiantesMarcados: estudiantesMarcados.slice(0, 10).map(e => e.nombre),
      fecha: fechaAsistencia.toISOString().split('T')[0]
    })

  } catch (error) {
    console.error('Error marcando inasistencias:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

/**
 * GET - Verificar estudiantes sin asistencia para una fecha/clase
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const fecha = url.searchParams.get('fecha')
    const idGradoSeccion = url.searchParams.get('idGradoSeccion')
    
    // Obtener ieId del token
    const authHeader = request.headers.get('authorization')
    let ieId = 1
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, JWT_SECRET) as any
        ieId = decoded.ieId || 1
      } catch {
        // Continuar con valor por defecto
      }
    }

    if (!fecha) {
      return NextResponse.json({ error: 'Fecha es requerida' }, { status: 400 })
    }

    const fechaAsistencia = new Date(fecha)
    fechaAsistencia.setHours(0, 0, 0, 0)

    // Obtener estudiantes
    const whereEstudiantes: any = {
      usuario: {
        idIe: ieId,
        estado: 'ACTIVO'
      }
    }
    
    if (idGradoSeccion) {
      whereEstudiantes.idGradoSeccion = parseInt(idGradoSeccion)
    }

    const estudiantes = await prisma.estudiante.findMany({
      where: whereEstudiantes,
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

    // Verificar cuáles no tienen asistencia
    const sinAsistencia: any[] = []
    const conAsistencia: any[] = []

    for (const estudiante of estudiantes) {
      const asistencia = await prisma.asistenciaIE.findFirst({
        where: {
          idEstudiante: estudiante.idEstudiante,
          fecha: fechaAsistencia
        }
      })

      const info = {
        id: estudiante.idEstudiante,
        nombre: estudiante.usuario?.nombre || '',
        apellido: estudiante.usuario?.apellido || '',
        dni: estudiante.usuario?.dni || '',
        grado: estudiante.gradoSeccion?.grado?.nombre || '',
        seccion: estudiante.gradoSeccion?.seccion?.nombre || ''
      }

      if (asistencia) {
        conAsistencia.push({ ...info, estado: asistencia.estado })
      } else {
        sinAsistencia.push(info)
      }
    }

    return NextResponse.json({
      fecha: fechaAsistencia.toISOString().split('T')[0],
      total: estudiantes.length,
      sinAsistencia: sinAsistencia.length,
      conAsistencia: conAsistencia.length,
      estudiantesSinAsistencia: sinAsistencia,
      estudiantesConAsistencia: conAsistencia
    })

  } catch (error) {
    console.error('Error verificando asistencias:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
