import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { notificarEntradaSalida } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    console.log('🚪 Registrando entrada de estudiante...')

    // Verificar autenticación
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

    const userId = decoded.userId
    const userInfo = await prisma.usuario.findUnique({
      where: { idUsuario: userId },
      include: { ie: true }
    })

    if (!userInfo || !['AUXILIAR', 'ADMINISTRATIVO'].includes(decoded.rol)) {
      return NextResponse.json({ error: 'Sin permisos de auxiliar' }, { status: 403 })
    }

    const body = await request.json()
    const { estudianteId } = body

    if (!estudianteId) {
      return NextResponse.json({ error: 'ID de estudiante requerido' }, { status: 400 })
    }

    // Obtener información del estudiante
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
      return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 })
    }

    const ieId = userInfo.idIe
    if (!ieId) {
      return NextResponse.json({ error: 'Usuario sin IE asignada' }, { status: 400 })
    }

    if (estudiante.usuario.idIe !== ieId) {
      return NextResponse.json({ error: 'Estudiante no pertenece a esta IE' }, { status: 403 })
    }

    // Obtener fecha y hora actual
    const ahora = new Date()
    const fechaHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
    const horaActual = ahora.toTimeString().slice(0, 5) // HH:MM

    console.log('📅 Registrando entrada para:', estudiante.usuario.nombre, estudiante.usuario.apellido)
    console.log('🕐 Hora de entrada:', ahora.toTimeString().slice(0, 8))

    // Obtener configuración de horarios de la IE
    const configuracion = await prisma.configuracionIE.findUnique({
      where: { idIe: ieId }
    })

    // Obtener valores de configuración
    const horaIngreso = configuracion?.horaIngreso || '07:30'
    const toleranciaMinutos = configuracion?.toleranciaMinutos || 15

    // Calcular hora límite: hora de ingreso + tolerancia
    // La tolerancia se aplica DESDE la hora de ingreso
    const [horaIng, minIng] = horaIngreso.split(':').map(Number)
    const fechaIngreso = new Date(ahora)
    fechaIngreso.setHours(horaIng, minIng, 0, 0)
    
    const fechaLimiteConTolerancia = new Date(fechaIngreso.getTime() + toleranciaMinutos * 60 * 1000)
    const horaLimiteConTolerancia = fechaLimiteConTolerancia.toTimeString().slice(0, 5)

    // Determinar estado según la hora:
    // - PRESENTE: llegó antes o igual a la hora de ingreso + tolerancia
    // - TARDANZA: llegó después de la hora de ingreso + tolerancia
    let estadoAsistencia: string
    let esTardanza = false

    if (horaActual <= horaLimiteConTolerancia) {
      estadoAsistencia = 'PRESENTE'
    } else {
      estadoAsistencia = 'TARDANZA'
      esTardanza = true
    }

    console.log(`⏰ Hora ingreso: ${horaIngreso}, Tolerancia: ${toleranciaMinutos}min, Límite: ${horaLimiteConTolerancia}`)
    console.log(`⏰ Hora actual: ${horaActual}, Estado: ${estadoAsistencia}`)

    // Verificar si ya tiene entrada registrada hoy en AsistenciaIE
    const asistenciaExistente = await prisma.asistenciaIE.findFirst({
      where: {
        idEstudiante: estudiante.idEstudiante,
        fecha: {
          gte: fechaHoy,
          lt: new Date(fechaHoy.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    })

    if (asistenciaExistente && asistenciaExistente.horaIngreso) {
      return NextResponse.json({ 
        error: 'El estudiante ya tiene entrada registrada hoy',
        horaIngreso: asistenciaExistente.horaIngreso.toTimeString().slice(0, 5)
      }, { status: 400 })
    }

    // Registrar entrada en AsistenciaIE con estado automático (PRESENTE o TARDANZA)
    let nuevaAsistenciaIE
    if (asistenciaExistente) {
      // Actualizar registro existente
      nuevaAsistenciaIE = await prisma.asistenciaIE.update({
        where: { idAsistenciaIE: asistenciaExistente.idAsistenciaIE },
        data: {
          horaIngreso: ahora,
          estado: estadoAsistencia,
          registradoIngresoPor: userInfo.idUsuario
        }
      })
    } else {
      // Crear nuevo registro
      nuevaAsistenciaIE = await prisma.asistenciaIE.create({
        data: {
          idEstudiante: estudiante.idEstudiante,
          idIe: ieId,
          fecha: fechaHoy,
          horaIngreso: ahora,
          estado: estadoAsistencia,
          registradoIngresoPor: userInfo.idUsuario
        }
      })
    }

    console.log(`✅ Entrada registrada automáticamente como: ${estadoAsistencia}`)

    // Enviar notificaciones al apoderado
    try {
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

      if (apoderado && apoderado.usuario.email) {
        console.log(`📧 Enviando notificación de ${estadoAsistencia} al apoderado...`)
        
        // Texto personalizado según el estado
        const textoEstado = esTardanza 
          ? `⚠️ TARDANZA - Ingreso a las ${horaActual} (límite: ${horaLimiteConTolerancia})`
          : `✅ PRESENTE - Ingreso puntual a las ${horaActual}`
        
        await notificarEntradaSalida({
          estudianteNombre: estudiante.usuario.nombre || '',
          estudianteApellido: estudiante.usuario.apellido || '',
          estudianteDNI: estudiante.usuario.dni,
          grado: estudiante.gradoSeccion?.grado?.nombre || '',
          seccion: estudiante.gradoSeccion?.seccion?.nombre || '',
          accion: 'entrada',
          hora: ahora.toISOString(),
          fecha: fechaHoy.toISOString(),
          emailApoderado: apoderado.usuario.email,
          telefonoApoderado: apoderado.usuario.telefono || '',
          textoPersonalizado: textoEstado
        })

        // Si es tardanza, crear notificación adicional en el sistema
        if (esTardanza) {
          await prisma.notificacion.create({
            data: {
              idUsuario: apoderado.usuario.idUsuario,
              titulo: '⚠️ Tardanza Registrada',
              mensaje: `Su hijo/a ${estudiante.usuario.nombre} ${estudiante.usuario.apellido} llegó tarde hoy a las ${horaActual}. El horario de ingreso es ${horaIngreso} con tolerancia de ${toleranciaMinutos} minutos (límite: ${horaLimiteConTolerancia}).`,
              tipo: 'ALERTA',
              leida: false
            }
          })
        }
      }
    } catch (notifError) {
      console.error(`⚠️ Error al enviar notificación:`, notifError)
    }

    // Mensaje de respuesta según el estado
    const mensajeRespuesta = esTardanza 
      ? `⚠️ Tardanza registrada - ${estudiante.usuario.nombre} llegó a las ${horaActual}`
      : `✅ Asistencia registrada - ${estudiante.usuario.nombre} llegó puntual`

    return NextResponse.json({
      success: true,
      message: mensajeRespuesta,
      estudiante: {
        id: estudiante.idEstudiante,
        nombre: estudiante.usuario.nombre,
        apellido: estudiante.usuario.apellido,
        grado: estudiante.gradoSeccion?.grado?.nombre,
        seccion: estudiante.gradoSeccion?.seccion?.nombre
      },
      asistencia: {
        id: nuevaAsistenciaIE.idAsistenciaIE,
        estado: estadoAsistencia,
        horaIngreso: nuevaAsistenciaIE.horaIngreso?.toTimeString().slice(0, 5),
        esTardanza,
        horaLimite: horaLimiteConTolerancia,
        toleranciaMinutos
      }
    })

  } catch (error) {
    console.error('❌ Error al registrar entrada:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
