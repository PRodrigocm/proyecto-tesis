import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// POST /api/justificaciones/[id]/rechazar - Rechazar justificación
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const params = await context.params
    const id = parseInt(params.id)
    const body = await request.json()
    const { observacionesRevision } = body

    if (!observacionesRevision) {
      return NextResponse.json(
        { error: 'Las observaciones de rechazo son requeridas' },
        { status: 400 }
      )
    }

    // Verificar que la justificación existe y está pendiente
    const justificacion = await prisma.justificacion.findUnique({
      where: { idJustificacion: id },
      include: {
        estadoJustificacion: true
      }
    })

    if (!justificacion) {
      return NextResponse.json(
        { error: 'Justificación no encontrada' },
        { status: 404 }
      )
    }

    if (justificacion.estadoJustificacion.codigo !== 'PENDIENTE' && 
        justificacion.estadoJustificacion.codigo !== 'EN_REVISION') {
      return NextResponse.json(
        { error: 'La justificación no puede ser rechazada en su estado actual' },
        { status: 400 }
      )
    }

    // Obtener el estado RECHAZADA
    const estadoRechazada = await prisma.estadoJustificacion.findFirst({
      where: { codigo: 'RECHAZADA' }
    })

    if (!estadoRechazada) {
      return NextResponse.json(
        { error: 'Estado de justificación no configurado' },
        { status: 500 }
      )
    }

    // Actualizar la justificación
    const justificacionRechazada = await prisma.justificacion.update({
      where: { idJustificacion: id },
      data: {
        idEstadoJustificacion: estadoRechazada.idEstadoJustificacion,
        revisadoPor: (decoded as any).idUsuario,
        fechaRevision: new Date(),
        observacionesRevision
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
        },
        tipoJustificacion: true,
        estadoJustificacion: true,
        usuarioRevisor: true
      }
    })

    return NextResponse.json({
      success: true,
      data: justificacionRechazada,
      message: 'Justificación rechazada'
    })

  } catch (error) {
    console.error('Error rechazando justificación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
