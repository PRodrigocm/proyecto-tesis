import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { marcarComoLeida } from '@/lib/notificaciones-utils'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    const idNotificacion = parseInt(params.id)
    if (isNaN(idNotificacion)) {
      return NextResponse.json(
        { error: 'ID de notificación inválido' },
        { status: 400 }
      )
    }

    // Verificar que la notificación pertenece al usuario
    const notificacion = await prisma.notificacion.findUnique({
      where: { idNotificacion }
    })

    if (!notificacion) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      )
    }

    if (notificacion.idUsuario !== decoded.userId) {
      return NextResponse.json(
        { error: 'No tiene permisos para modificar esta notificación' },
        { status: 403 }
      )
    }

    // Marcar como leída
    const notificacionActualizada = await marcarComoLeida(idNotificacion)

    return NextResponse.json({
      success: true,
      message: 'Notificación marcada como leída',
      notificacion: {
        id: notificacionActualizada.idNotificacion,
        leida: notificacionActualizada.leida,
        fechaLectura: notificacionActualizada.fechaLectura?.toISOString()
      }
    })

  } catch (error) {
    console.error('Error en PUT /api/notificaciones/[id]:', error)
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    const idNotificacion = parseInt(params.id)
    if (isNaN(idNotificacion)) {
      return NextResponse.json(
        { error: 'ID de notificación inválido' },
        { status: 400 }
      )
    }

    // Verificar que la notificación pertenece al usuario
    const notificacion = await prisma.notificacion.findUnique({
      where: { idNotificacion }
    })

    if (!notificacion) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      )
    }

    if (notificacion.idUsuario !== decoded.userId) {
      return NextResponse.json(
        { error: 'No tiene permisos para eliminar esta notificación' },
        { status: 403 }
      )
    }

    // Eliminar notificación
    await prisma.notificacion.delete({
      where: { idNotificacion }
    })

    return NextResponse.json({
      success: true,
      message: 'Notificación eliminada correctamente'
    })

  } catch (error) {
    console.error('Error en DELETE /api/notificaciones/[id]:', error)
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
