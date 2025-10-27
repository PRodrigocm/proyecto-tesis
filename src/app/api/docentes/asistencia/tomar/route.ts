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

    // 3. BUSCAR ESTUDIANTE POR CÓDIGO QR
    const codigoLimpio = qrCode.trim()
    const estudiante = await prisma.estudiante.findFirst({
      where: {
        AND: [
          { idGradoSeccion: docenteAula.idGradoSeccion }, // Solo estudiantes de esta clase
          { codigoQR: codigoLimpio }
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

    // 4. OBTENER HORARIO DE CLASE ACTUAL
    const ahora = new Date()
    const diaSemana = ahora.getDay() === 0 ? 7 : ahora.getDay()
    const horaActual = ahora.toTimeString().slice(0, 5)
    
    const horarioClase = await prisma.horarioClase.findFirst({
      where: {
        idGradoSeccion: docenteAula.idGradoSeccion,
        diaSemana: diaSemana,
        activo: true
      }
    })

    if (!horarioClase) {
      return NextResponse.json({ 
        error: 'No hay horario de clase activo',
        details: 'No se encontró un horario de clase para el día actual'
      }, { status: 404 })
    }

    console.log('📅 Horario de clase encontrado:', horarioClase.materia)

    // 5. VERIFICAR SI YA TIENE ASISTENCIA EN ESTA CLASE HOY
    const fechaAsistencia = new Date(fechaSeleccionada)
    const asistenciaExistente = await prisma.asistencia.findFirst({
      where: {
        idEstudiante: estudiante.idEstudiante,
        idHorarioClase: horarioClase.idHorarioClase,
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
          codigo: estudiante.codigoQR || estudiante.usuario.dni,
          grado: estudiante.gradoSeccion?.grado?.nombre || 'Sin grado',
          seccion: estudiante.gradoSeccion?.seccion?.nombre || 'Sin sección'
        },
        asistencia: {
          estado: asistenciaExistente.estadoAsistencia?.codigo || 'REGISTRADO',
          horaRegistro: asistenciaExistente.horaRegistro?.toISOString() || asistenciaExistente.createdAt.toISOString()
        }
      })
    }

    // 6. DETERMINAR ESTADO SEGÚN LA HORA Y TOLERANCIA
    const horaInicioClase = new Date(fechaAsistencia)
    const [horas, minutos] = horarioClase.horaInicio.toTimeString().slice(0, 5).split(':')
    horaInicioClase.setHours(parseInt(horas), parseInt(minutos), 0, 0)
    
    const toleranciaMin = horarioClase.toleranciaMin || 10
    const horaLimiteTolerancia = new Date(horaInicioClase.getTime() + (toleranciaMin * 60 * 1000))
    
    let estadoCodigo = 'PRESENTE'
    if (ahora > horaLimiteTolerancia) {
      estadoCodigo = 'TARDANZA'
    }

    // 7. BUSCAR O CREAR ESTADO DE ASISTENCIA
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

    // 8. CREAR ASISTENCIA EN AULA
    const nuevaAsistencia = await prisma.asistencia.create({
      data: {
        idEstudiante: estudiante.idEstudiante,
        idHorarioClase: horarioClase.idHorarioClase,
        fecha: fechaAsistencia,
        horaRegistro: ahora,
        idEstadoAsistencia: estadoAsistencia.idEstadoAsistencia,
        observaciones: `Registrado por docente en ${horarioClase.materia || 'clase'} - ${estadoCodigo}`,
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
        codigo: estudiante.codigoQR || estudiante.usuario.dni,
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
        codigo: estudiante.codigoQR || estudiante.usuario.dni, // Usar codigoQR del estudiante
        estado: asistenciaDelDia?.estadoAsistencia?.codigo.toLowerCase() || 'pendiente',
        horaLlegada: asistenciaDelDia?.horaRegistro ? 
          asistenciaDelDia.horaRegistro.toLocaleTimeString('es-ES', { 
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
