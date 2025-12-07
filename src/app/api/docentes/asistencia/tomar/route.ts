import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { notificarEntradaSalida } from '@/lib/notifications'

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

    // 1. OBTENER EL ID DEL DOCENTE Y SU IE DESDE EL USUARIO
    const docente = await prisma.docente.findFirst({
      where: { idUsuario: userInfo.userId },
      include: {
        usuario: true
      }
    })

    if (!docente) {
      return NextResponse.json({ 
        error: 'Usuario no es docente',
        details: 'El usuario logueado no tiene perfil de docente'
      }, { status: 403 })
    }

    const docenteIeId = docente.usuario?.idIe
    console.log('👨‍🏫 Docente encontrado:', docente.idDocente, 'IE:', docenteIeId)

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
          { codigoQR: codigoLimpio },
          // Validar que el estudiante pertenece a la misma IE del docente
          {
            OR: [
              { idIe: docenteIeId },
              { usuario: { idIe: docenteIeId } }
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
      // Verificar si el código existe pero es de otra IE
      const estudianteOtraIE = await prisma.estudiante.findFirst({
        where: { codigoQR: codigoLimpio },
        include: { usuario: true }
      })
      
      if (estudianteOtraIE) {
        const esOtraIE = estudianteOtraIE.idIe !== docenteIeId && estudianteOtraIE.usuario?.idIe !== docenteIeId
        const esOtraClase = estudianteOtraIE.idGradoSeccion !== docenteAula.idGradoSeccion
        
        if (esOtraIE) {
          return NextResponse.json({ 
            error: 'Estudiante de otra institución',
            details: `El estudiante ${estudianteOtraIE.usuario?.nombre} ${estudianteOtraIE.usuario?.apellido} no pertenece a esta institución educativa`
          }, { status: 403 })
        }
        
        if (esOtraClase) {
          return NextResponse.json({ 
            error: 'Estudiante de otra clase',
            details: `El estudiante ${estudianteOtraIE.usuario?.nombre} ${estudianteOtraIE.usuario?.apellido} no pertenece a esta clase`
          }, { status: 403 })
        }
      }
      
      return NextResponse.json({ 
        error: 'Estudiante no encontrado',
        details: `No se encontró estudiante con código ${codigoLimpio}`
      }, { status: 404 })
    }

    console.log('👤 Estudiante encontrado:', `${estudiante.usuario.nombre} ${estudiante.usuario.apellido}`)

    // 4. OBTENER HORARIO DE CLASE PARA LA FECHA SELECCIONADA
    const ahora = new Date()
    
    // Parsear fecha correctamente para evitar problemas de zona horaria
    // fechaSeleccionada viene como "2025-12-03"
    const [year, month, day] = fechaSeleccionada.split('-').map(Number)
    const fechaAsistencia = new Date(year, month - 1, day) // month es 0-indexed
    
    // Usar el día de la semana de la FECHA SELECCIONADA
    // JavaScript: 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado
    // BD: 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado, 7=Domingo
    const diaSemanaJS = fechaAsistencia.getDay()
    const diaSemanaDB = diaSemanaJS === 0 ? 7 : diaSemanaJS
    
    console.log('📆 Buscando horario para:', {
      fechaSeleccionada,
      fechaParsed: fechaAsistencia.toISOString(),
      diaSemanaJS,
      diaSemanaDB,
      diaNombre: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][diaSemanaJS],
      idGradoSeccion: docenteAula.idGradoSeccion
    })
    
    const horarioClase = await prisma.horarioClase.findFirst({
      where: {
        idGradoSeccion: docenteAula.idGradoSeccion,
        diaSemana: diaSemanaDB,
        activo: true
      }
    })

    if (!horarioClase) {
      return NextResponse.json({ 
        error: 'No hay horario de clase activo',
        details: `No se encontró un horario de clase para el día ${['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][fechaAsistencia.getDay()]}`
      }, { status: 404 })
    }

    // Log del horario encontrado
    const horaInicioLog = new Date(horarioClase.horaInicio)
    const horaFinLog = new Date(horarioClase.horaFin)
    console.log('📅 Horario de clase encontrado:', {
      materia: horarioClase.materia,
      diaSemana: horarioClase.diaSemana,
      horaInicio: `${horaInicioLog.getUTCHours()}:${horaInicioLog.getUTCMinutes().toString().padStart(2, '0')}`,
      horaFin: `${horaFinLog.getUTCHours()}:${horaFinLog.getUTCMinutes().toString().padStart(2, '0')}`,
      toleranciaMin: horarioClase.toleranciaMin
    })

    // 5. VERIFICAR SI YA TIENE ASISTENCIA EN ESTA CLASE HOY
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
    // Extraer hora y minutos del horario de clase (tipo Time en PostgreSQL)
    // PostgreSQL Time se almacena como DateTime con fecha 1970-01-01
    // La hora se guarda TAL CUAL el usuario la configuró (ej: 14:48 = 2:48 PM)
    // Prisma lo devuelve en UTC, así que usamos getUTCHours/getUTCMinutes
    const horaInicioDate = new Date(horarioClase.horaInicio)
    const horasInicio = horaInicioDate.getUTCHours()
    const minutosInicio = horaInicioDate.getUTCMinutes()
    
    // Obtener hora actual del servidor (que está en hora de Perú)
    const horasActuales = ahora.getHours()
    const minutosActualesHora = ahora.getMinutes()
    
    const toleranciaMin = horarioClase.toleranciaMin || 10
    
    // Comparar usando minutos del día
    const minutosActuales = horasActuales * 60 + minutosActualesHora
    const minutosInicioClase = horasInicio * 60 + minutosInicio
    const minutosLimite = minutosInicioClase + toleranciaMin
    
    const esTardanza = minutosActuales > minutosLimite
    
    // Log para debug
    console.log('🔍 Debug horario:', {
      horaInicioRaw: horarioClase.horaInicio,
      horaInicioUTC: `${horasInicio}:${minutosInicio.toString().padStart(2, '0')}`,
      toleranciaMin
    })
    
    console.log('⏰ Cálculo de tolerancia:', {
      horaInicioClase: `${horasInicio}:${minutosInicio.toString().padStart(2, '0')}`,
      horaLimiteTolerancia: `${Math.floor(minutosLimite / 60)}:${(minutosLimite % 60).toString().padStart(2, '0')}`,
      horaActual: `${horasActuales}:${minutosActualesHora.toString().padStart(2, '0')}`,
      minutosActuales,
      minutosInicioClase,
      minutosLimite,
      esTardanza: esTardanza ? 'SÍ (llegó después del límite)' : 'NO (llegó a tiempo)'
    })
    
    let estadoCodigo = 'PRESENTE'
    if (esTardanza) {
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

    // ENVIAR NOTIFICACIÓN AL APODERADO
    try {
      console.log(`🔍 Buscando apoderado para estudiante ID: ${estudiante.idEstudiante}`)
      
      const apoderado = await prisma.apoderado.findFirst({
        where: {
          estudiantes: {
            some: {
              idEstudiante: estudiante.idEstudiante
            }
          }
        },
        include: {
          usuario: true
        }
      })

      console.log(`📋 Apoderado encontrado:`, apoderado ? 'SÍ' : 'NO')
      if (apoderado) {
        console.log(`   Email: ${apoderado.usuario.email || 'NO TIENE'}`)
        console.log(`   Teléfono: ${apoderado.usuario.telefono || 'NO TIENE'}`)
      }

      if (apoderado && apoderado.usuario.email) {
        console.log(`📧 Enviando notificación de asistencia al apoderado...`)
        
        const resultadoNotificacion = await notificarEntradaSalida({
          estudianteNombre: estudiante.usuario.nombre || '',
          estudianteApellido: estudiante.usuario.apellido || '',
          estudianteDNI: estudiante.usuario.dni,
          grado: estudiante.gradoSeccion?.grado?.nombre || '',
          seccion: estudiante.gradoSeccion?.seccion?.nombre || '',
          accion: 'entrada',
          hora: ahora.toISOString(),
          fecha: fechaAsistencia.toISOString(),
          emailApoderado: apoderado.usuario.email,
          telefonoApoderado: apoderado.usuario.telefono || '',
          textoPersonalizado: estadoCodigo === 'PRESENTE' ? 'PRESENTE EN EL AULA' : 'TARDANZA EN EL AULA'
        })

        console.log(`📧 Notificación enviada: Email=${resultadoNotificacion.emailEnviado}, SMS=${resultadoNotificacion.smsEnviado}`)
      } else {
        console.log(`⚠️ No se encontró apoderado con email para ${estudiante.usuario.nombre}`)
      }
    } catch (notifError) {
      console.error(`⚠️ Error al enviar notificación (no crítico):`, notifError)
      // No fallar el registro de asistencia si la notificación falla
    }

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

    // Obtener el ID del docente y su IE desde el usuario
    const docente = await prisma.docente.findFirst({
      where: { idUsuario: userInfo.userId },
      include: {
        usuario: true
      }
    })

    if (!docente) {
      return NextResponse.json({ 
        error: 'Usuario no es docente' 
      }, { status: 403 })
    }

    // Obtener el idIe del docente
    const docenteIeId = docente.usuario?.idIe

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

    // Obtener estudiantes ACTIVOS de la clase con sus asistencias del día
    // Parsear la fecha correctamente para evitar problemas de zona horaria
    // fecha viene como "YYYY-MM-DD", la parseamos manualmente
    const [anioConsulta, mesConsulta, diaConsulta] = fecha.split('-').map(Number)
    
    // Crear fechas en hora local (no UTC)
    const fechaConsulta = new Date(anioConsulta, mesConsulta - 1, diaConsulta, 0, 0, 0, 0)
    const fechaInicio = new Date(anioConsulta, mesConsulta - 1, diaConsulta, 0, 0, 0, 0)
    const fechaFin = new Date(anioConsulta, mesConsulta - 1, diaConsulta, 23, 59, 59, 999)
    
    console.log(`🔍 Buscando asistencias para fecha: ${fecha} (local: ${fechaConsulta.toLocaleDateString()})`)
    
    const estudiantes = await prisma.estudiante.findMany({
      where: {
        AND: [
          { idGradoSeccion: docenteAula.idGradoSeccion },
          { usuario: { estado: 'ACTIVO' } },
          // Filtrar por IE del docente - estudiantes deben pertenecer a la misma IE
          {
            OR: [
              { idIe: docenteIeId },
              { usuario: { idIe: docenteIeId } }
            ]
          }
        ]
      },
      include: {
        usuario: true,
        asistencias: {
          where: {
            fecha: {
              gte: fechaInicio,
              lte: fechaFin
            }
          },
          include: {
            estadoAsistencia: true
          }
        },
        // También incluir asistencias IE (institucionales) para ver faltas automáticas
        asistenciasIE: {
          where: {
            fecha: {
              gte: fechaInicio,
              lte: fechaFin
            }
          }
        },
        retiros: {
          where: {
            fecha: fechaConsulta
          },
          include: {
            estadoRetiro: true
          }
        }
      },
      orderBy: [
        { usuario: { apellido: 'asc' } },
        { usuario: { nombre: 'asc' } }
      ]
    })

    console.log(`📊 Estudiantes encontrados: ${estudiantes.length} (IE: ${docenteIeId}, GradoSeccion: ${docenteAula.idGradoSeccion})`)
    
    // Debug: consulta directa a tabla Asistencia para verificar
    const asistenciasDirectas = await prisma.asistencia.findMany({
      where: {
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        },
        idEstudiante: {
          in: estudiantes.map(e => e.idEstudiante)
        }
      },
      include: {
        estadoAsistencia: true,
        estudiante: {
          include: { usuario: true }
        }
      }
    })
    
    console.log(`🔍 Asistencias directas encontradas: ${asistenciasDirectas.length}`)
    asistenciasDirectas.forEach(a => {
      console.log(`  📋 ${a.estudiante?.usuario?.nombre}: estado=${a.estadoAsistencia?.codigo}, fecha=${a.fecha.toISOString()}`)
    })
    
    // Debug: mostrar asistencias encontradas via include
    estudiantes.forEach(est => {
      if (est.asistencias.length > 0) {
        console.log(`  📋 (include) ${est.usuario?.nombre}: asistencia=${est.asistencias[0]?.estadoAsistencia?.codigo || 'N/A'}`)
      }
    })

    // Crear mapa de asistencias directas por estudiante para acceso rápido
    const asistenciasPorEstudiante = new Map<number, typeof asistenciasDirectas[0]>()
    asistenciasDirectas.forEach(a => {
      asistenciasPorEstudiante.set(a.idEstudiante, a)
    })

    // Transformar datos
    const estudiantesTransformados = estudiantes.map(estudiante => {
      // Usar asistencia directa en lugar del include
      const asistenciaDelDia = asistenciasPorEstudiante.get(estudiante.idEstudiante)
      const asistenciaIEDelDia = estudiante.asistenciasIE?.[0]
      const retiroDelDia = estudiante.retiros?.[0]
      
      // Mapear estados de la BD al formato del frontend
      let estadoFrontend = 'sin_registrar'
      let horaLlegada: string | null = null
      let pendienteVerificacion = false
      let horaIngresoIE: string | null = null
      
      // PRIMERO: Verificar si hay un retiro AUTORIZADO para este día - tiene máxima prioridad
      if (retiroDelDia && retiroDelDia.estadoRetiro?.codigo === 'AUTORIZADO') {
        estadoFrontend = 'retirado'
        horaLlegada = retiroDelDia.hora ? 
          retiroDelDia.hora.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }) : null
      }
      // SEGUNDO: Verificar asistencia en aula (Asistencia)
      else if (asistenciaDelDia?.estadoAsistencia?.codigo) {
        const codigoEstado = asistenciaDelDia.estadoAsistencia.codigo.toUpperCase()
        switch (codigoEstado) {
          case 'PRESENTE':
            estadoFrontend = 'presente'
            break
          case 'TARDANZA':
            estadoFrontend = 'tardanza'
            break
          case 'AUSENTE':
          case 'INASISTENCIA':
            estadoFrontend = 'inasistencia'
            break
          case 'JUSTIFICADA':
          case 'JUSTIFICADO':
            estadoFrontend = 'justificada'
            break
          case 'RETIRO':
          case 'RETIRADO':
            estadoFrontend = 'retirado'
            break
          default:
            estadoFrontend = 'sin_registrar'
        }
        horaLlegada = asistenciaDelDia?.horaRegistro ? 
          asistenciaDelDia.horaRegistro.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }) : null
      }
      // SEGUNDO: Si no hay asistencia en aula pero SÍ hay asistencia IE
      else if (asistenciaIEDelDia) {
        // Si el estado de IE es RETIRO, mostrar como retirado
        if (asistenciaIEDelDia.estado === 'RETIRO') {
          estadoFrontend = 'retirado'
          horaLlegada = asistenciaIEDelDia.horaIngreso ? 
            new Date(asistenciaIEDelDia.horaIngreso).toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }) : null
        }
        // Si está precargado por auxiliar, marcar como pendiente de verificación
        else if (asistenciaIEDelDia.estado === 'INGRESADO' || asistenciaIEDelDia.estado === 'PRESENTE' || asistenciaIEDelDia.estado === 'TARDANZA') {
          pendienteVerificacion = true
          horaIngresoIE = asistenciaIEDelDia.horaIngreso ? 
            new Date(asistenciaIEDelDia.horaIngreso).toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }) : null
        }
      }
      
      return {
        id: estudiante.idEstudiante,
        nombre: `${estudiante.usuario.nombre} ${estudiante.usuario.apellido}`,
        apellido: estudiante.usuario.apellido,
        dni: estudiante.usuario.dni,
        codigo: estudiante.codigoQR || estudiante.usuario.dni,
        estado: estadoFrontend,
        horaLlegada: horaLlegada,
        // Campos para verificación de asistencia precargada
        pendienteVerificacion: pendienteVerificacion,
        horaIngresoIE: horaIngresoIE,
        tieneRetiro: !!retiroDelDia,
        retiro: retiroDelDia ? {
          id: retiroDelDia.idRetiro,
          motivo: retiroDelDia.observaciones || 'Sin motivo',
          hora: retiroDelDia.hora?.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }) || null,
          estado: retiroDelDia.estadoRetiro?.codigo || 'PENDIENTE'
        } : null,
        horaSalida: retiroDelDia?.hora ? 
          retiroDelDia.hora.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }) : null
      }
    })

    console.log(`✅ ${estudiantesTransformados.length} estudiantes obtenidos`)

    // Obtener horario de clase para saber hora de inicio y fin
    // Parsear la fecha correctamente para obtener el día de la semana
    const [year, month, day] = fecha.split('-').map(Number)
    const fechaLocal = new Date(year, month - 1, day)
    const diaSemanaJS = fechaLocal.getDay()
    
    // Mapear día de JavaScript (0=Domingo) a día de la BD (1=Lunes, 7=Domingo)
    const diasMap: { [key: number]: number } = {
      0: 7, // Domingo
      1: 1, // Lunes
      2: 2, // Martes
      3: 3, // Miércoles
      4: 4, // Jueves
      5: 5, // Viernes
      6: 6  // Sábado
    }
    const diaBD = diasMap[diaSemanaJS]

    const horarioClase = await prisma.horarioClase.findFirst({
      where: {
        idGradoSeccion: docenteAula.idGradoSeccion,
        diaSemana: diaBD
      }
    })

    return NextResponse.json({
      success: true,
      estudiantes: estudiantesTransformados,
      clase: {
        id: docenteAula.idDocenteAula,
        nombre: `${docenteAula.gradoSeccion.grado.nombre}° ${docenteAula.gradoSeccion.seccion.nombre}`,
        fecha: fecha,
        idGradoSeccion: docenteAula.idGradoSeccion,
        horaInicio: horarioClase?.horaInicio?.toISOString() || null,
        horaFin: horarioClase?.horaFin?.toISOString() || null
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
