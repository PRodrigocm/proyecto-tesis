import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

/**
 * PATCH - Registrar salida de un estudiante
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const asistenciaId = parseInt(params.id)

    if (isNaN(asistenciaId)) {
      return NextResponse.json(
        { error: 'ID de asistencia inválido' },
        { status: 400 }
      )
    }

    // Obtener usuario del token
    let userId = 1
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
        userId = decoded.userId || 1
      } catch {
        // Token inválido, usar valor por defecto
      }
    }

    // Buscar la asistencia
    const asistencia = await prisma.asistenciaIE.findUnique({
      where: { idAsistenciaIE: asistenciaId }
    })

    if (!asistencia) {
      return NextResponse.json(
        { error: 'Asistencia no encontrada' },
        { status: 404 }
      )
    }

    if (asistencia.horaSalida) {
      return NextResponse.json(
        { error: 'La salida ya fue registrada' },
        { status: 400 }
      )
    }

    // Registrar salida
    const asistenciaActualizada = await prisma.asistenciaIE.update({
      where: { idAsistenciaIE: asistenciaId },
      data: {
        horaSalida: new Date(),
        registradoSalidaPor: userId
      },
      include: {
        estudiante: {
          include: {
            usuario: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Salida registrada correctamente',
      data: asistenciaActualizada
    })

  } catch (error) {
    console.error('Error registering salida:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
