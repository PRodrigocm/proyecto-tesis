import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

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
    const fechaHoy = new Date(ahora.toISOString().split('T')[0])
    const horaActual = ahora

    console.log('📅 Registrando entrada para:', estudiante.usuario.nombre, estudiante.usuario.apellido)
    console.log('🕐 Hora de entrada:', horaActual.toTimeString().slice(0, 8))

    // Verificar si ya tiene asistencia registrada hoy
    const asistenciaExistente = await prisma.asistencia.findFirst({
      where: {
        idEstudiante: estudiante.idEstudiante,
        fecha: fechaHoy
      }
    })

    if (asistenciaExistente) {
      return NextResponse.json({ 
        error: 'El estudiante ya tiene asistencia registrada hoy' 
      }, { status: 400 })
    }

    // Obtener horario del estudiante para determinar si es tardanza
    let horarioClase = null
    if (estudiante.idGradoSeccion) {
      horarioClase = await prisma.horarioClase.findFirst({
        where: {
          idGradoSeccion: estudiante.idGradoSeccion,
          diaSemana: ahora.getDay() === 0 ? 7 : ahora.getDay(), // Domingo = 7
          activo: true
        }
      })
    }

    let estado = 'PRESENTE'
    let toleranciaMin = 10 // Tolerancia por defecto

    if (horarioClase) {
      toleranciaMin = horarioClase.toleranciaMin || 10
      
      // Convertir hora de inicio del horario a Date para comparar
      const horaInicioHorario = new Date(fechaHoy)
      const [horas, minutos] = horarioClase.horaInicio.toTimeString().slice(0, 5).split(':')
      horaInicioHorario.setHours(parseInt(horas), parseInt(minutos), 0, 0)
      
      // Agregar tolerancia
      const horaLimiteTolerancia = new Date(horaInicioHorario.getTime() + (toleranciaMin * 60 * 1000))
      
      if (horaActual > horaLimiteTolerancia) {
        estado = 'TARDANZA'
      }
    }

    // Crear registro de asistencia
    const nuevaAsistencia = await prisma.asistencia.create({
      data: {
        idEstudiante: estudiante.idEstudiante,
        idIe: ieId,
        fecha: fechaHoy,
        horaEntrada: horaActual,
        sesion: 'MAÑANA', // Por defecto mañana
        observaciones: `Entrada registrada por auxiliar: ${userInfo.nombre} ${userInfo.apellido}`,
        registradoPor: userInfo.idUsuario
      }
    })

    console.log(`✅ Entrada registrada - Estado: ${estado}`)

    return NextResponse.json({
      success: true,
      message: `Entrada registrada como ${estado}`,
      estudiante: {
        id: estudiante.idEstudiante,
        nombre: estudiante.usuario.nombre,
        apellido: estudiante.usuario.apellido,
        grado: estudiante.gradoSeccion?.grado?.nombre,
        seccion: estudiante.gradoSeccion?.seccion?.nombre
      },
      asistencia: {
        id: nuevaAsistencia.idAsistencia,
        estado: estado,
        horaEntrada: nuevaAsistencia.horaEntrada?.toTimeString().slice(0, 5),
        toleranciaMin
      }
    })

  } catch (error) {
    console.error('❌ Error al registrar entrada:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
