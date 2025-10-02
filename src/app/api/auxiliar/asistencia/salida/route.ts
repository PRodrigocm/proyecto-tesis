import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

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
    const fechaHoy = new Date(ahora.toISOString().split('T')[0])

    console.log('📅 Registrando salida para:', estudiante.usuario.nombre, estudiante.usuario.apellido)
    console.log('🕐 Hora de salida:', ahora.toTimeString().slice(0, 8))

    // Verificar si tiene asistencia registrada hoy
    const asistenciaHoy = await prisma.asistencia.findFirst({
      where: {
        idEstudiante: estudiante.idEstudiante,
        fecha: fechaHoy
      }
    })

    if (!asistenciaHoy) {
      return NextResponse.json({ 
        error: 'El estudiante no tiene entrada registrada hoy' 
      }, { status: 400 })
    }

    if (!['PRESENTE', 'TARDANZA'].includes(asistenciaHoy.estado)) {
      return NextResponse.json({ 
        error: 'El estudiante no está presente en la IE' 
      }, { status: 400 })
    }

    // Verificar si ya tiene un retiro completado hoy
    const retiroExistente = await prisma.retiro.findFirst({
      where: {
        idEstudiante: estudiante.idEstudiante,
        fechaRetiro: fechaHoy,
        estado: 'COMPLETADO'
      }
    })

    if (retiroExistente) {
      return NextResponse.json({ 
        error: 'El estudiante ya tiene salida registrada hoy' 
      }, { status: 400 })
    }

    // Crear registro de retiro (salida normal)
    const nuevoRetiro = await prisma.retiro.create({
      data: {
        idEstudiante: estudiante.idEstudiante,
        idTipoRetiro: 1, // Asumiendo que 1 es "Salida Normal"
        fechaRetiro: fechaHoy,
        horaRetiro: ahora.toTimeString().slice(0, 5),
        motivo: 'Salida normal de la IE',
        observaciones: `Salida registrada por auxiliar: ${userInfo.nombre} ${userInfo.apellido}`,
        estado: 'COMPLETADO',
        autorizadoPor: userInfo.idUsuario,
        fechaAutorizacion: ahora
      }
    })

    console.log('✅ Salida registrada exitosamente')

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
      retiro: {
        id: nuevoRetiro.idRetiro,
        horaRetiro: nuevoRetiro.horaRetiro,
        fechaRetiro: nuevoRetiro.fechaRetiro.toISOString().split('T')[0]
      }
    })

  } catch (error) {
    console.error('❌ Error al registrar salida:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
