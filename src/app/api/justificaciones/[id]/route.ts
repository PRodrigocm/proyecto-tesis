import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET /api/justificaciones/[id] - Obtener justificación específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const id = parseInt(params.id)
    
    const justificacion = await prisma.justificacion.findUnique({
      where: { idJustificacion: id },
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
        estadoAsistencia: true,
        usuarioPresentador: true,
        usuarioRevisor: true,
        documentos: true,
        asistenciasAfectadas: {
          include: {
            asistencia: {
              include: {
                estadoAsistencia: true
              }
            }
          }
        }
      }
    })

    if (!justificacion) {
      return NextResponse.json(
        { error: 'Justificación no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: justificacion
    })

  } catch (error) {
    console.error('Error obteniendo justificación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/justificaciones/[id] - Actualizar justificación
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const id = parseInt(params.id)
    const body = await request.json()

    // Verificar que la justificación existe
    const justificacionExistente = await prisma.justificacion.findUnique({
      where: { idJustificacion: id }
    })

    if (!justificacionExistente) {
      return NextResponse.json(
        { error: 'Justificación no encontrada' },
        { status: 404 }
      )
    }

    // Actualizar la justificación
    const justificacionActualizada = await prisma.justificacion.update({
      where: { idJustificacion: id },
      data: {
        ...body,
        updatedAt: new Date()
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
        usuarioPresentador: true,
        usuarioRevisor: true
      }
    })

    return NextResponse.json({
      success: true,
      data: justificacionActualizada,
      message: 'Justificación actualizada exitosamente'
    })

  } catch (error) {
    console.error('Error actualizando justificación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/justificaciones/[id] - Eliminar justificación
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const id = parseInt(params.id)

    // Verificar que la justificación existe
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

    // Solo permitir eliminar si está en estado PENDIENTE
    if (justificacion.estadoJustificacion.codigo !== 'PENDIENTE') {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar justificaciones pendientes' },
        { status: 400 }
      )
    }

    // Eliminar relaciones primero
    await prisma.asistenciaJustificacion.deleteMany({
      where: { idJustificacion: id }
    })

    await prisma.documentoJustificacion.deleteMany({
      where: { idJustificacion: id }
    })

    // Eliminar la justificación
    await prisma.justificacion.delete({
      where: { idJustificacion: id }
    })

    return NextResponse.json({
      success: true,
      message: 'Justificación eliminada exitosamente'
    })

  } catch (error) {
    console.error('Error eliminando justificación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
