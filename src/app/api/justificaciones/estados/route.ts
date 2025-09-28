import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET /api/justificaciones/estados - Obtener estados de justificación
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const estados = await prisma.estadoJustificacion.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: estados
    })

  } catch (error) {
    console.error('Error obteniendo estados de justificación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
