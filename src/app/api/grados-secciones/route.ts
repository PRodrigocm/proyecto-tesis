import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const ieId = url.searchParams.get('ieId')

    // Obtener ieId del usuario si no se proporciona
    let finalIeId = ieId
    if (!finalIeId) {
      // Aquí podrías obtener el ieId del token del usuario
      finalIeId = '1' // Por defecto
    }

    const gradosSecciones = await prisma.gradoSeccion.findMany({
      where: {
        grado: {
          nivel: {
            idIe: parseInt(finalIeId)
            // Eliminamos el filtro por nombre para incluir todos los niveles
          }
        }
      },
      include: {
        grado: {
          include: {
            nivel: {
              select: {
                nombre: true
              }
            }
          }
        },
        seccion: {
          select: {
            idSeccion: true,
            nombre: true
          }
        }
      },
      orderBy: [
        { grado: { nivel: { nombre: 'asc' } } }, // Ordenar por nivel primero
        { grado: { nombre: 'asc' } },
        { seccion: { nombre: 'asc' } }
      ]
    })

    const transformedData = gradosSecciones.map(gs => ({
      idGradoSeccion: gs.idGradoSeccion,
      grado: {
        idGrado: gs.grado.idGrado,
        nombre: gs.grado.nombre,
        nivel: gs.grado.nivel.nombre
      },
      seccion: {
        idSeccion: gs.seccion.idSeccion,
        nombre: gs.seccion.nombre
      }
    }))

    return NextResponse.json({
      data: transformedData,
      total: transformedData.length
    })

  } catch (error) {
    console.error('Error fetching grados y secciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
