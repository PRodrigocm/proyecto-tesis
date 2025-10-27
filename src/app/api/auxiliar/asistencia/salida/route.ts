import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { notificarEntradaSalida } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    console.log('🚪 Registrando salida de estudiante...')

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

    if (estudiante.usuario.idIe !== userInfo.idIe) {
      return NextResponse.json({ error: 'Estudiante no pertenece a esta IE' }, { status: 403 })
    }

    // Obtener fecha y hora actual
    const ahora = new Date()
    const fechaHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())

    console.log('📅 Registrando salida para:', estudiante.usuario.nombre, estudiante.usuario.apellido)
    console.log('🕐 Hora de salida:', ahora.toTimeString().slice(0, 8))

    // Verificar si tiene entrada registrada hoy en AsistenciaIE
    const asistenciaHoy = await prisma.asistenciaIE.findFirst({
      where: {
        idEstudiante: estudiante.idEstudiante,
        fecha: {
          gte: fechaHoy,
          lt: new Date(fechaHoy.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    })

    if (!asistenciaHoy || !asistenciaHoy.horaIngreso) {
      return NextResponse.json({ 
        error: 'El estudiante no tiene entrada registrada hoy' 
      }, { status: 400 })
    }

    // Registrar salida en AsistenciaIE
    const asistenciaActualizada = await prisma.asistenciaIE.update({
      where: { idAsistenciaIE: asistenciaHoy.idAsistenciaIE },
      data: {
        horaSalida: ahora,
        estado: 'RETIRADO',
        registradoSalidaPor: userInfo.idUsuario
      }
    })

    console.log('✅ Salida registrada manualmente')

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
        console.log(`📧 Enviando notificación de salida al apoderado...`)
        
        await notificarEntradaSalida({
          estudianteNombre: estudiante.usuario.nombre || '',
          estudianteApellido: estudiante.usuario.apellido || '',
          estudianteDNI: estudiante.usuario.dni,
          grado: estudiante.gradoSeccion?.grado?.nombre || '',
          seccion: estudiante.gradoSeccion?.seccion?.nombre || '',
          accion: 'salida',
          hora: ahora.toISOString(),
          fecha: fechaHoy.toISOString(),
          emailApoderado: apoderado.usuario.email,
          telefonoApoderado: apoderado.usuario.telefono || ''
        })
      }
    } catch (notifError) {
      console.error(`⚠️ Error al enviar notificación:`, notifError)
    }

    return NextResponse.json({
      success: true,
      message: 'Salida registrada exitosamente',
      estudiante: {
        id: estudiante.idEstudiante,
        nombre: estudiante.usuario.nombre,
        apellido: estudiante.usuario.apellido,
        grado: estudiante.gradoSeccion?.grado?.nombre,
        seccion: estudiante.gradoSeccion?.seccion?.nombre
      },
      asistencia: {
        id: asistenciaActualizada.idAsistenciaIE,
        estado: asistenciaActualizada.estado,
        horaSalida: asistenciaActualizada.horaSalida?.toTimeString().slice(0, 5)
      }
    })

  } catch (error) {
    console.error('❌ Error al registrar salida:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
