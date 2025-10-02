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
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    // Obtener datos completos del usuario
    const usuario = await prisma.usuario.findUnique({
      where: {
        idUsuario: decoded.userId
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

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Construir respuesta con datos completos
    const userData = {
      id: usuario.idUsuario,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      dni: usuario.dni,
      email: usuario.email,
      telefono: usuario.telefono,
      estado: usuario.estado,
      rol: usuario.roles[0]?.rol?.nombre || 'USER',
      ie: usuario.ie ? {
        id: usuario.ie.idIe,
        nombre: usuario.ie.nombre,
        codigo: usuario.ie.codigoIe,
        direccion: usuario.ie.direccion,
        telefono: usuario.ie.telefono,
        email: usuario.ie.email
      } : null,
      roles: usuario.roles.map(ur => ur.rol.nombre)
    }

    return NextResponse.json({
      success: true,
      user: userData
    })

  } catch (error) {
    console.error('Error getting user data:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
