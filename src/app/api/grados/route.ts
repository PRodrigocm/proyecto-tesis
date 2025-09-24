import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const ieId = url.searchParams.get('ieId')

    if (!ieId) {
      return NextResponse.json(
        { error: 'Institution ID is required' },
        { status: 400 }
      )
    }

    // Obtener grados que tienen GradoSeccion en la institución
    const gradoSecciones = await prisma.gradoSeccion.findMany({
      where: {
        grado: {
          nivel: {
            idIe: parseInt(ieId)
          }
        }
      },
      include: {
        grado: {
          include: {
            nivel: true
          }
        }
      },
      orderBy: {
        grado: {
          nombre: 'asc'
        }
      }
    })

    // Extraer grados únicos
    const gradosMap = new Map()
    gradoSecciones.forEach(gs => {
      if (!gradosMap.has(gs.grado.idGrado)) {
        gradosMap.set(gs.grado.idGrado, gs.grado)
      }
    })
    
    const grados = Array.from(gradosMap.values())

    return NextResponse.json({
      data: grados,
      total: grados.length
    })

  } catch (error) {
    console.error('Error fetching grados:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
