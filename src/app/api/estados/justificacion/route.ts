import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

/**
 * GET /api/estados/justificacion
 * Obtiene todos los estados de justificación disponibles en la BD
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: any
    
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Obtener todos los estados de justificación activos
    const estados = await prisma.estadoJustificacion.findMany({
      where: {
        activo: true
      },
      orderBy: {
        idEstadoJustificacion: 'asc'
      }
    })

    console.log(`✅ Se encontraron ${estados.length} estados de justificación`)

    return NextResponse.json({
      success: true,
      data: estados
    })

  } catch (error) {
    console.error('❌ Error al obtener estados de justificación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
