import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { notificarEntradaSalida } from '@/lib/notifications'

/**
 * POST - Verificar/Aprobar asistencia precargada por auxiliar
 * El docente aprueba o rechaza la asistencia que el auxiliar registró en la IE
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const userInfo = verifyToken(token)
    if (!userInfo) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const body = await request.json()
    const { estudianteId, fecha, accion, claseId } = body

    if (!estudianteId || !fecha || !accion) {
      return NextResponse.json({ 
        error: 'Parámetros requeridos: estudianteId, fecha, accion' 
      }, { status: 400 })
    }

    if (accion !== 'aprobar' && accion !== 'rechazar') {
      return NextResponse.json({ 
        error: 'Acción debe ser "aprobar" o "rechazar"' 
      }, { status: 400 })
    }

    // Obtener el docente
    const docente = await prisma.docente.findFirst({
      where: { idUsuario: userInfo.userId },
      include: { usuario: true }
    })

    if (!docente) {
      return NextResponse.json({ error: 'Usuario no es docente' }, { status: 403 })
    }

    // Parsear fecha
    const [anio, mes, dia] = fecha.split('-').map(Number)
    const fechaInicio = new Date(anio, mes - 1, dia, 0, 0, 0, 0)
    const fechaFin = new Date(anio, mes - 1, dia, 23, 59, 59, 999)
    const fechaAsistencia = new Date(anio, mes - 1, dia, 12, 0, 0, 0)

    // Verificar que existe asistencia IE para este estudiante
    const asistenciaIE = await prisma.asistenciaIE.findFirst({
      where: {
        idEstudiante: parseInt(estudianteId),
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        }
      }
    })

    if (!asistenciaIE) {
      return NextResponse.json({ 
        error: 'No se encontró asistencia IE para verificar' 
      }, { status: 404 })
    }

    // Verificar que no existe ya una asistencia en aula
    const asistenciaExistente = await prisma.asistencia.findFirst({
      where: {
        idEstudiante: parseInt(estudianteId),
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        }
      }
    })

    if (asistenciaExistente) {
      return NextResponse.json({ 
        error: 'El estudiante ya tiene asistencia registrada en el aula' 
      }, { status: 400 })
    }

    if (accion === 'rechazar') {
      // Si rechaza, simplemente no se crea registro en Asistencia
      // El estudiante quedará como "sin_registrar" y será marcado como inasistente al final
      console.log(`❌ Docente rechazó verificación de ${estudianteId}`)
      
      return NextResponse.json({
        success: true,
        message: 'Verificación rechazada. El estudiante quedará sin registro de asistencia.',
        accion: 'rechazar'
      })
    }

    // APROBAR: Determinar si es PRESENTE o TARDANZA según la hora de ingreso y el horario de clase
    const horaIngreso = asistenciaIE.horaIngreso
    let estadoCodigo = 'PRESENTE'

    console.log('🕐 Verificando hora de ingreso:', horaIngreso)

    if (horaIngreso && claseId) {
      // Obtener el horario de clase para determinar tardanza
      const docenteAula = await prisma.docenteAula.findFirst({
        where: { idDocenteAula: parseInt(claseId) }
      })

      if (docenteAula) {
        const horarioClase = await prisma.horarioClase.findFirst({
          where: {
            idGradoSeccion: docenteAula.idGradoSeccion,
            activo: true
          }
        })

        if (horarioClase?.horaInicio) {
          const horaInicioClase = new Date(horarioClase.horaInicio)
          const tolerancia = horarioClase.toleranciaMin || 15
          const horaIngresoDate = new Date(horaIngreso)

          // El horario de clase está guardado en UTC, usar getUTCHours/getUTCMinutes
          const horaInicioMinutos = horaInicioClase.getUTCHours() * 60 + horaInicioClase.getUTCMinutes()
          
          // La hora de ingreso está en UTC, convertir a hora de Perú para comparar
          const horaIngresoPeruStr = horaIngresoDate.toLocaleTimeString('es-PE', { 
            timeZone: 'America/Lima', 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          })
          const [horaStr, minStr] = horaIngresoPeruStr.split(':')
          const horaIngresoMinutos = parseInt(horaStr) * 60 + parseInt(minStr)
          
          const limiteTardanza = horaInicioMinutos + tolerancia

          console.log('🕐 Comparación de horas:', {
            horaIngreso: horaIngresoPeruStr,
            horaInicioClase: `${horaInicioClase.getUTCHours()}:${String(horaInicioClase.getUTCMinutes()).padStart(2, '0')}`,
            horaIngresoMinutos,
            horaInicioMinutos,
            tolerancia,
            limiteTardanza,
            esTardanza: horaIngresoMinutos > limiteTardanza
          })

          if (horaIngresoMinutos > limiteTardanza) {
            estadoCodigo = 'TARDANZA'
          }
        } else {
          // Si no hay horario de clase, usar hora de ingreso de la IE como referencia
          // Obtener configuración de la IE
          const configuracion = await prisma.configuracionIE.findFirst({
            where: { idIe: (userInfo as any).ieId || 1 }
          })
          
          if (configuracion?.horaFinIngreso) {
            const [horaFin, minFin] = configuracion.horaFinIngreso.split(':').map(Number)
            const horaIngresoDate = new Date(horaIngreso)
            const horaIngresoMinutos = horaIngresoDate.getHours() * 60 + horaIngresoDate.getMinutes()
            const horaFinIngresoMinutos = horaFin * 60 + minFin

            console.log('🕐 Usando configuración IE:', {
              horaFinIngreso: configuracion.horaFinIngreso,
              horaIngresoMinutos,
              horaFinIngresoMinutos,
              esTardanza: horaIngresoMinutos > horaFinIngresoMinutos
            })

            if (horaIngresoMinutos > horaFinIngresoMinutos) {
              estadoCodigo = 'TARDANZA'
            }
          }
        }
      }
    } else if (horaIngreso) {
      // Si no hay claseId, usar configuración de la IE
      const configuracion = await prisma.configuracionIE.findFirst({
        where: { idIe: (userInfo as any).ieId || 1 }
      })
      
      if (configuracion?.horaFinIngreso) {
        const [horaFin, minFin] = configuracion.horaFinIngreso.split(':').map(Number)
        const horaIngresoDate = new Date(horaIngreso)
        const horaIngresoMinutos = horaIngresoDate.getHours() * 60 + horaIngresoDate.getMinutes()
        const horaFinIngresoMinutos = horaFin * 60 + minFin

        console.log('🕐 Usando configuración IE (sin claseId):', {
          horaFinIngreso: configuracion.horaFinIngreso,
          horaIngresoMinutos,
          horaFinIngresoMinutos,
          esTardanza: horaIngresoMinutos > horaFinIngresoMinutos
        })

        if (horaIngresoMinutos > horaFinIngresoMinutos) {
          estadoCodigo = 'TARDANZA'
        }
      }
    }

    // Buscar o crear el estado de asistencia
    let estadoAsistencia = await prisma.estadoAsistencia.findFirst({
      where: { codigo: estadoCodigo }
    })

    if (!estadoAsistencia) {
      estadoAsistencia = await prisma.estadoAsistencia.create({
        data: {
          codigo: estadoCodigo,
          nombreEstado: estadoCodigo === 'PRESENTE' ? 'Presente' : 'Tardanza',
          requiereJustificacion: false,
          afectaAsistencia: estadoCodigo === 'TARDANZA',
          activo: true
        }
      })
    }

    // Crear registro en tabla Asistencia (asistencia de aula)
    const horaActual = new Date()
    const nuevaAsistencia = await prisma.asistencia.create({
      data: {
        idEstudiante: parseInt(estudianteId),
        fecha: fechaAsistencia,
        idEstadoAsistencia: estadoAsistencia.idEstadoAsistencia,
        horaRegistro: horaActual,
        registradoPor: userInfo.userId,
        observaciones: `Verificado por docente. Ingreso IE: ${asistenciaIE.horaIngreso ? new Date(asistenciaIE.horaIngreso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}`
      }
    })

    // Guardar en histórico
    await prisma.historicoEstadoAsistencia.create({
      data: {
        idAsistencia: nuevaAsistencia.idAsistencia,
        idEstadoAsistencia: estadoAsistencia.idEstadoAsistencia,
        cambiadoPor: userInfo.userId,
        fechaCambio: horaActual
      }
    })

    console.log(`✅ Docente aprobó verificación: estudiante=${estudianteId}, estado=${estadoCodigo}`)

    // ENVIAR NOTIFICACIÓN AL APODERADO (ASÍNCRONO - no bloquea la respuesta)
    setImmediate(async () => {
      try {
        // Obtener datos del estudiante
        const estudiante = await prisma.estudiante.findUnique({
          where: { idEstudiante: parseInt(estudianteId) },
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
          console.log('⚠️ No se encontró estudiante para notificación')
          return
        }

        // Buscar apoderado
        const apoderado = await prisma.apoderado.findFirst({
          where: {
            estudiantes: {
              some: {
                idEstudiante: parseInt(estudianteId)
              }
            }
          },
          include: {
            usuario: true
          }
        })

        if (apoderado && apoderado.usuario.email) {
          console.log(`📧 Enviando notificación de verificación al apoderado...`)
          
          // Formatear hora de ingreso del auxiliar para mostrar
          const horaIngresoFormateada = asistenciaIE.horaIngreso 
            ? new Date(asistenciaIE.horaIngreso).toLocaleTimeString('es-PE', { 
                timeZone: 'America/Lima',
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              })
            : 'N/A'

          await notificarEntradaSalida({
            estudianteNombre: estudiante.usuario.nombre || '',
            estudianteApellido: estudiante.usuario.apellido || '',
            estudianteDNI: estudiante.usuario.dni,
            grado: estudiante.gradoSeccion?.grado?.nombre || '',
            seccion: estudiante.gradoSeccion?.seccion?.nombre || '',
            accion: 'entrada',
            hora: asistenciaIE.horaIngreso?.toISOString() || horaActual.toISOString(),
            fecha: fechaAsistencia.toISOString(),
            emailApoderado: apoderado.usuario.email,
            telefonoApoderado: apoderado.usuario.telefono || '',
            textoPersonalizado: estadoCodigo === 'PRESENTE' 
              ? `✅ PRESENTE EN EL AULA - Ingreso: ${horaIngresoFormateada}` 
              : `⚠️ TARDANZA EN EL AULA - Ingreso: ${horaIngresoFormateada}`
          })
          console.log(`📧 Notificación de verificación enviada exitosamente`)
        } else {
          console.log('⚠️ No se encontró apoderado o email para notificación')
        }
      } catch (notifError) {
        console.error(`⚠️ Error al enviar notificación (no crítico):`, notifError)
      }
    })

    return NextResponse.json({
      success: true,
      message: `Asistencia verificada como ${estadoCodigo}`,
      accion: 'aprobar',
      estado: estadoCodigo.toLowerCase(),
      horaRegistro: horaActual.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    })

  } catch (error) {
    console.error('Error verificando asistencia:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
