import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const gradoId = url.searchParams.get('gradoId')

    if (!gradoId) {
      return NextResponse.json(
        { error: 'Grado ID is required' },
        { status: 400 }
      )
    }

    // Obtener secciones que están vinculadas al grado específico
    const gradoSecciones = await prisma.gradoSeccion.findMany({
      where: {
        idGrado: parseInt(gradoId)
      },
      include: {
        seccion: true,
        grado: {
          include: {
            nivel: true
          }
        }
      },
      orderBy: {
        seccion: {
          nombre: 'asc'
        }
      }
    })

    // Extraer las secciones (ya están filtradas por el grado específico)
    const secciones = gradoSecciones.map(gs => gs.seccion)

    return NextResponse.json({
      data: secciones,
      total: secciones.length
    })

  } catch (error) {
    console.error('Error fetching secciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
