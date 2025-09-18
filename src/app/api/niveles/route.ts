import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get user's institution (should be from authenticated user)
    const userIe = 1 // This should be dynamic based on logged user

    const niveles = await prisma.nivel.findMany({
      where: {
        idIe: userIe
      },
      select: {
        idNivel: true,
        nombre: true
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    const transformedNiveles = niveles.map(nivel => ({
      id: nivel.idNivel,
      nombre: nivel.nombre
    }))

    return NextResponse.json(transformedNiveles)

  } catch (error) {
    console.error('Error fetching niveles:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
