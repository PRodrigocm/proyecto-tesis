import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Buscar usuario admin
    const user = await prisma.usuario.findFirst({
      where: {
        email: email,
        roles: {
          some: {
            rol: {
              nombre: 'ADMIN'
            }
          }
        }
      },
      include: {
        ie: true,
        roles: {
          include: {
            rol: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.passwordHash || '')
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Obtener el rol del usuario
    const userRole = user.roles[0]?.rol?.nombre || 'ADMIN'

    // Generar JWT
    const token = jwt.sign(
      { 
        userId: user.idUsuario, 
        email: user.email, 
        rol: userRole,
        ieId: user.idIe
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    )

    const userData = {
      id: user.idUsuario,
      email: user.email,
      nombres: user.nombre,
      apellidos: user.apellido,
      rol: 'ADMIN',
      idIe: user.idIe,
      institucion: user.ie?.nombre || null
    }

    return NextResponse.json({
      data: {
        token,
        user: userData
      }
    })

  } catch (error) {
    console.error('Error en admin login:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
