import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    
    try {
      jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Obtener todos los estados de retiro
    const estados = await prisma.estadoRetiro.findMany({
      orderBy: {
        orden: 'asc'
      },
      select: {
        idEstadoRetiro: true,
        codigo: true,
        nombre: true,
        orden: true
      }
    })

    return NextResponse.json({
      success: true,
      estados
    })

  } catch (error) {
    console.error('Error fetching estados retiro:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
