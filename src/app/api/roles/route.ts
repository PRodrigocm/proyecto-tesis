import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const roles = await prisma.rol.findMany({
      select: {
        idRol: true,
        nombre: true
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    const transformedRoles = roles.map(rol => ({
      id: rol.idRol.toString(),
      name: rol.nombre,
      nombre: rol.nombre
    }))

    return NextResponse.json(transformedRoles)

  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
