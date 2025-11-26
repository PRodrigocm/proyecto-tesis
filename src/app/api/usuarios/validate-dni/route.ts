import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

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

    const { searchParams } = new URL(request.url)
    const dni = searchParams.get('dni')

    if (!dni) {
      return NextResponse.json({ error: 'DNI es requerido' }, { status: 400 })
    }

    // Buscar usuario con este DNI
    const existingUser = await prisma.usuario.findUnique({
      where: { dni },
      select: {
        idUsuario: true,
        nombre: true,
        apellido: true,
        dni: true,
        email: true
      }
    })

    return NextResponse.json({
      exists: !!existingUser
    })

  } catch (error) {
    console.error('Error validating DNI:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
