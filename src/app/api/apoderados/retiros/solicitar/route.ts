import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    if (decoded.rol !== 'APODERADO') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { estudianteId, fecha, hora, motivo, observaciones, tipoRetiro } = body

    // Validaciones
    if (!estudianteId || !fecha || !hora || !motivo || !tipoRetiro) {
      return NextResponse.json(
        { error: 'Todos los campos requeridos deben ser proporcionados' },
        { status: 400 }
      )
    }

    // Verificar que el estudiante pertenece al apoderado
    const estudianteApoderado = await prisma.estudianteApoderado.findFirst({
      where: {
        idApoderado: decoded.userId,
        idEstudiante: parseInt(estudianteId)
      }
    })

    if (!estudianteApoderado) {
      return NextResponse.json(
        { error: 'No tiene permisos para solicitar retiro de este estudiante' },
        { status: 403 }
      )
    }

    // Verificar que no haya otro retiro pendiente para la misma fecha
    const retiroExistente = await prisma.retiro.findFirst({
      where: {
        idEstudiante: parseInt(estudianteId),
        fecha: new Date(fecha),
        estado: {
          in: ['SOLICITADO', 'EN_REVISION', 'APROBADO']
        }
      }
    })

    if (retiroExistente) {
      return NextResponse.json(
        { error: 'Ya existe una solicitud de retiro para esta fecha' },
        { status: 400 }
      )
    }

    // Crear la solicitud de retiro
    const nuevoRetiro = await prisma.retiro.create({
      data: {
        idEstudiante: parseInt(estudianteId),
        fecha: new Date(fecha),
        hora: hora,
        motivo: motivo,
        observaciones: observaciones || null,
        tipoRetiro: tipoRetiro,
        estado: 'SOLICITADO',
        idSolicitadoPor: decoded.userId,
        fechaSolicitud: new Date()
      },
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
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Solicitud de retiro creada exitosamente',
      retiro: {
        id: nuevoRetiro.idRetiro.toString(),
        fecha: nuevoRetiro.fecha.toISOString().split('T')[0],
        hora: nuevoRetiro.hora,
        motivo: nuevoRetiro.motivo,
        estudiante: `${nuevoRetiro.estudiante.usuario.apellido}, ${nuevoRetiro.estudiante.usuario.nombre}`,
        grado: `${nuevoRetiro.estudiante.gradoSeccion.grado.nombre}° ${nuevoRetiro.estudiante.gradoSeccion.seccion.nombre}`
      }
    })

  } catch (error) {
    console.error('Error creating solicitud de retiro:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
