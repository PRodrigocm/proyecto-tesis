/**
 * ⚠️ DEPRECADO: Esta API está obsoleta
 * 
 * Las notificaciones ahora se generan dinámicamente y no se guardan en BD.
 * Usar /api/notifications en su lugar para obtener notificaciones dinámicas.
 * 
 * Esta API se mantiene temporalmente para compatibilidad hacia atrás.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { 
  obtenerNotificacionesUsuario, 
  contarNotificacionesNoLeidas,
  marcarTodasComoLeidas,
  TipoNotificacion 
} from '@/lib/notificaciones-utils'

export async function GET(request: NextRequest) {
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

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const soloNoLeidas = searchParams.get('soloNoLeidas') === 'true'
    const limite = searchParams.get('limite') ? parseInt(searchParams.get('limite')!) : undefined
    const tipo = searchParams.get('tipo') as TipoNotificacion | undefined
    const accion = searchParams.get('accion')

    // Si es una solicitud para contar notificaciones no leídas
    if (accion === 'contar') {
      const count = await contarNotificacionesNoLeidas(decoded.userId)
      return NextResponse.json({
        success: true,
        count
      })
    }

    // Obtener notificaciones
    const notificaciones = await obtenerNotificacionesUsuario(decoded.userId, {
      soloNoLeidas,
      limite,
      tipo
    })

    return NextResponse.json({
      success: true,
      notificaciones: notificaciones.map(notif => ({
        id: notif.idNotificacion,
        titulo: notif.titulo,
        mensaje: notif.mensaje,
        tipo: notif.tipo,
        leida: notif.leida,
        fechaEnvio: notif.fechaEnvio.toISOString(),
        fechaLectura: notif.fechaLectura?.toISOString() || null,
        origen: notif.origen
      }))
    })

  } catch (error) {
    console.error('Error en GET /api/notificaciones:', error)
    
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
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { accion } = body

    if (accion === 'marcarTodasLeidas') {
      const resultado = await marcarTodasComoLeidas(decoded.userId)
      
      return NextResponse.json({
        success: true,
        message: 'Todas las notificaciones han sido marcadas como leídas',
        actualizadas: resultado.count
      })
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error en PUT /api/notificaciones:', error)
    
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
  }
}
