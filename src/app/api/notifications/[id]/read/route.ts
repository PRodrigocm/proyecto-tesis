import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔔 POST /api/notifications/[id]/read - Marcando notificación como leída')
    
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const resolvedParams = await params
    const notificationId = resolvedParams.id

    console.log('📝 Marcando notificación como leída:', notificationId)

    // Por ahora, como las notificaciones son generadas dinámicamente,
    // simplemente retornamos éxito. En una implementación completa,
    // aquí guardaríamos el estado en una tabla de notificaciones.
    
    return NextResponse.json({
      success: true,
      message: 'Notificación marcada como leída'
    })

  } catch (error) {
    console.error('❌ Error marking notification as read:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
