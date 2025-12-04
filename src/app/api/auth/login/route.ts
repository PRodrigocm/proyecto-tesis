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

    // Buscar usuario por email (sin filtros de IE o Rol)
    const user = await prisma.usuario.findFirst({
      where: {
        email: email
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

    // Verificar que el usuario esté activo
    if (user.estado !== 'ACTIVO') {
      console.log(`🚫 Login rechazado - Usuario inactivo: ${user.email} (estado: ${user.estado})`)
      return NextResponse.json(
        { error: 'Tu cuenta está desactivada. Contacta al administrador.' },
        { status: 403 }
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

    // Obtener el primer rol del usuario (el principal)
    const userRole = user.roles[0]?.rol?.nombre || 'USUARIO'

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
      rol: userRole,
      institucion: user.ie?.nombre || null,
      ieId: user.idIe
    }

    console.log('🔍 Login API - User found:', {
      id: user.idUsuario,
      email: user.email,
      roles: user.roles.map(r => r.rol.nombre),
      finalRole: userData.rol
    })

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
