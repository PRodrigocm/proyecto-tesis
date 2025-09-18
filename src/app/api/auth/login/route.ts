import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { email, password, institucionEducativa, rol } = await request.json()

    if (!email || !password || !institucionEducativa || !rol) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Buscar usuario con el rol y institución especificados
    const user = await prisma.usuario.findFirst({
      where: {
        email: email,
        idIe: parseInt(institucionEducativa),
        roles: {
          some: {
            rol: {
              nombre: rol
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

    // Generar JWT
    const token = jwt.sign(
      { 
        userId: user.idUsuario, 
        email: user.email, 
        rol: user.rol,
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
      rol: user.roles[0]?.rol?.nombre || rol,
      institucion: user.ie?.nombre || null
    }

    return NextResponse.json({
      data: {
        token,
        user: userData
      }
    })

  } catch (error) {
    console.error('Error en login:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
