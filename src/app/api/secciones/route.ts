import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const gradoId = url.searchParams.get('gradoId')
    const ieId = url.searchParams.get('ieId')

    // Si se proporciona gradoId, filtrar por grado específico
    if (gradoId) {
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

      const secciones = gradoSecciones.map(gs => ({
        id: gs.seccion.idSeccion.toString(),
        idSeccion: gs.seccion.idSeccion,
        nombre: gs.seccion.nombre
      }))

      return NextResponse.json({
        secciones: secciones,
        data: secciones,
        total: secciones.length
      })
    }

    // Si se proporciona ieId, obtener todas las secciones de la institución
    if (ieId) {
      const gradoSecciones = await prisma.gradoSeccion.findMany({
        where: {
          grado: {
            nivel: {
              idIe: parseInt(ieId)
            }
          }
        },
        include: {
          seccion: true
        },
        orderBy: {
          seccion: {
            nombre: 'asc'
          }
        }
      })

      // Extraer secciones únicas
      const seccionesMap = new Map()
      gradoSecciones.forEach(gs => {
        if (!seccionesMap.has(gs.seccion.idSeccion)) {
          seccionesMap.set(gs.seccion.idSeccion, gs.seccion)
        }
      })
      
      const seccionesArray = Array.from(seccionesMap.values()).map((s: any) => ({
        id: s.idSeccion.toString(),
        idSeccion: s.idSeccion,
        nombre: s.nombre
      }))

      return NextResponse.json({
        secciones: seccionesArray,
        data: seccionesArray,
        total: seccionesArray.length
      })
    }

    // Si no se proporciona ningún parámetro, obtener todas las secciones
    const seccionesDB = await prisma.seccion.findMany({
      orderBy: {
        nombre: 'asc'
      }
    })

    const secciones = seccionesDB.map(s => ({
      id: s.idSeccion.toString(),
      idSeccion: s.idSeccion,
      nombre: s.nombre
    }))

    return NextResponse.json({
      secciones: secciones,
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
