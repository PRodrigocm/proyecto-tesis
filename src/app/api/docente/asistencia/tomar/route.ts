import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    console.log('🎓 API: Procesando asistencia de docente...')
    
    // Verificar autenticación
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const userInfo = verifyToken(token)
    if (!userInfo) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { qrCode, claseId, fechaSeleccionada } = await request.json()
    
    console.log('📋 Datos recibidos:', { qrCode, claseId, fechaSeleccionada, docenteId: userInfo.userId })

    if (!qrCode || !claseId || !fechaSeleccionada) {
      return NextResponse.json({ 
        error: 'Datos incompletos',
        required: ['qrCode', 'claseId', 'fechaSeleccionada']
      }, { status: 400 })
    }

    // 1. OBTENER EL ID DEL DOCENTE DESDE EL USUARIO
    const docente = await prisma.docente.findFirst({
      where: { idUsuario: userInfo.userId }
    })

    if (!docente) {
      return NextResponse.json({ 
        error: 'Usuario no es docente',
        details: 'El usuario logueado no tiene perfil de docente'
      }, { status: 403 })
    }

    console.log('👨‍🏫 Docente encontrado:', docente.idDocente)

    // 2. VERIFICAR QUE LA CLASE PERTENECE AL DOCENTE
    const docenteAula = await prisma.docenteAula.findFirst({
      where: { 
        idDocenteAula: parseInt(claseId),
        idDocente: docente.idDocente
      },
      include: {
        gradoSeccion: {
          include: {
            grado: true,
            seccion: true
          }
        }
      }
    })

    if (!docenteAula) {
      return NextResponse.json({ 
        error: 'Clase no encontrada o no autorizada',
        details: 'La clase no existe o no pertenece a este docente'
      }, { status: 403 })
    }

    console.log('✅ Clase verificada:', `${docenteAula.gradoSeccion.grado.nombre}° ${docenteAula.gradoSeccion.seccion.nombre}`)

    // 3. BUSCAR ESTUDIANTE POR QR/DNI/CÓDIGO
    const codigoLimpio = qrCode.trim()
    const estudiante = await prisma.estudiante.findFirst({
      where: {
        AND: [
          { idGradoSeccion: docenteAula.idGradoSeccion }, // Solo estudiantes de esta clase
          {
            OR: [
              { usuario: { dni: codigoLimpio } },
              { codigo: codigoLimpio },
              { qr: codigoLimpio }
            ]
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

    if (!estudiante) {
      return NextResponse.json({ 
        error: 'Estudiante no encontrado',
        details: `No se encontró estudiante con código ${codigoLimpio} en esta clase`
      }, { status: 404 })
    }

    console.log('👤 Estudiante encontrado:', `${estudiante.usuario.nombre} ${estudiante.usuario.apellido}`)

    // 4. VERIFICAR SI YA TIENE ASISTENCIA HOY
    const fechaAsistencia = new Date(fechaSeleccionada)
    const asistenciaExistente = await prisma.asistencia.findFirst({
      where: {
        idEstudiante: estudiante.idEstudiante,
        fecha: fechaAsistencia
      },
      include: {
        estadoAsistencia: true
      }
    })

    if (asistenciaExistente) {
      return NextResponse.json({
        success: false,
        duplicado: true,
        mensaje: `${estudiante.usuario.nombre} ${estudiante.usuario.apellido} ya tiene asistencia registrada como ${asistenciaExistente.estadoAsistencia?.codigo || 'REGISTRADO'}`,
        estudiante: {
          id: estudiante.idEstudiante,
          nombre: estudiante.usuario.nombre,
          apellido: estudiante.usuario.apellido,
          dni: estudiante.usuario.dni,
          codigo: estudiante.codigo || estudiante.qr || estudiante.usuario.dni,
          grado: estudiante.gradoSeccion?.grado?.nombre || 'Sin grado',
          seccion: estudiante.gradoSeccion?.seccion?.nombre || 'Sin sección'
        },
        asistencia: {
          estado: asistenciaExistente.estadoAsistencia?.codigo || 'REGISTRADO',
          horaRegistro: asistenciaExistente.horaEntrada?.toISOString() || asistenciaExistente.createdAt.toISOString()
        }
      })
    }

    // 5. DETERMINAR ESTADO SEGÚN LA HORA
    const ahora = new Date()
    const horaActual = ahora.getHours()
    const minutoActual = ahora.getMinutes()
    const totalMinutos = horaActual * 60 + minutoActual

    let estadoCodigo = 'PRESENTE'
    if (totalMinutos > 510) { // Después de 8:30 AM
      estadoCodigo = 'TARDANZA'
    }

    // 6. BUSCAR O CREAR ESTADO DE ASISTENCIA
    let estadoAsistencia = await prisma.estadoAsistencia.findFirst({
      where: { codigo: estadoCodigo }
    })

    if (!estadoAsistencia) {
      estadoAsistencia = await prisma.estadoAsistencia.create({
        data: {
          codigo: estadoCodigo,
          nombreEstado: estadoCodigo.charAt(0) + estadoCodigo.slice(1).toLowerCase(),
          activo: true,
          afectaAsistencia: true,
          requiereJustificacion: false
        }
      })
    }

    // 7. CREAR ASISTENCIA
    const nuevaAsistencia = await prisma.asistencia.create({
      data: {
        idEstudiante: estudiante.idEstudiante,
        idIe: userInfo.idIe || 1,
        fecha: fechaAsistencia,
        horaEntrada: ahora,
        idEstadoAsistencia: estadoAsistencia.idEstadoAsistencia,
        fuente: 'QR_DOCENTE',
        observaciones: `Registrado por docente - ${estadoCodigo}`,
        registradoPor: userInfo.userId
      }
    })

    console.log('✅ Asistencia creada exitosamente:', {
      idAsistencia: nuevaAsistencia.idAsistencia,
      estudiante: `${estudiante.usuario.nombre} ${estudiante.usuario.apellido}`,
      estado: estadoCodigo,
      hora: ahora.toLocaleTimeString()
    })

    return NextResponse.json({
      success: true,
      mensaje: `✅ Asistencia registrada: ${estudiante.usuario.nombre} ${estudiante.usuario.apellido} - ${estadoCodigo}`,
      estudiante: {
        id: estudiante.idEstudiante,
        nombre: estudiante.usuario.nombre,
        apellido: estudiante.usuario.apellido,
        dni: estudiante.usuario.dni,
        codigo: estudiante.codigo || estudiante.qr || estudiante.usuario.dni,
        grado: estudiante.gradoSeccion?.grado?.nombre || 'Sin grado',
        seccion: estudiante.gradoSeccion?.seccion?.nombre || 'Sin sección'
      },
      asistencia: {
        id: nuevaAsistencia.idAsistencia,
        estado: estadoCodigo,
        horaRegistro: ahora.toISOString(),
        fecha: fechaAsistencia.toISOString().split('T')[0]
      }
    })

  } catch (error) {
    console.error('❌ Error al procesar asistencia:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

// GET: Obtener estudiantes de una clase específica
export async function GET(request: NextRequest) {
  try {
    console.log('📋 API: Obteniendo estudiantes de clase...')
    
    // Verificar autenticación
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const userInfo = verifyToken(token)
    if (!userInfo) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const url = new URL(request.url)
    const claseId = url.searchParams.get('claseId')
    const fecha = url.searchParams.get('fecha')

    if (!claseId || !fecha) {
      return NextResponse.json({ 
        error: 'Parámetros requeridos: claseId, fecha' 
      }, { status: 400 })
    }

    // Obtener el ID del docente desde el usuario
    const docente = await prisma.docente.findFirst({
      where: { idUsuario: userInfo.userId }
    })

    if (!docente) {
      return NextResponse.json({ 
        error: 'Usuario no es docente' 
      }, { status: 403 })
    }

    // Verificar que la clase pertenece al docente
    const docenteAula = await prisma.docenteAula.findFirst({
      where: { 
        idDocenteAula: parseInt(claseId),
        idDocente: docente.idDocente
      },
      include: {
        gradoSeccion: {
          include: {
            grado: true,
            seccion: true
          }
        }
      }
    })

    if (!docenteAula) {
      return NextResponse.json({ 
        error: 'Clase no encontrada o no autorizada' 
      }, { status: 403 })
    }

    // Obtener estudiantes de la clase con sus asistencias del día
    const fechaConsulta = new Date(fecha)
    const estudiantes = await prisma.estudiante.findMany({
      where: {
        idGradoSeccion: docenteAula.idGradoSeccion
      },
      include: {
        usuario: true,
        asistencias: {
          where: {
            fecha: fechaConsulta
          },
          include: {
            estadoAsistencia: true
          }
        }
      },
      orderBy: [
        { usuario: { apellido: 'asc' } },
        { usuario: { nombre: 'asc' } }
      ]
    })

    // Transformar datos
    const estudiantesTransformados = estudiantes.map(estudiante => {
      const asistenciaDelDia = estudiante.asistencias[0]
      
      return {
        id: estudiante.idEstudiante,
        nombre: estudiante.usuario.nombre,
        apellido: estudiante.usuario.apellido,
        dni: estudiante.usuario.dni,
        codigo: estudiante.codigo || estudiante.qr || estudiante.usuario.dni,
        estado: asistenciaDelDia?.estadoAsistencia?.codigo.toLowerCase() || 'pendiente',
        horaLlegada: asistenciaDelDia?.horaEntrada ? 
          asistenciaDelDia.horaEntrada.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }) : null
      }
    })

    console.log(`✅ ${estudiantesTransformados.length} estudiantes obtenidos`)

    return NextResponse.json({
      success: true,
      estudiantes: estudiantesTransformados,
      clase: {
        id: docenteAula.idDocenteAula,
        nombre: `${docenteAula.gradoSeccion.grado.nombre}° ${docenteAula.gradoSeccion.seccion.nombre}`,
        fecha: fecha
      }
    })

  } catch (error) {
    console.error('❌ Error al obtener estudiantes:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
