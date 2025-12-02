import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    let ieId = url.searchParams.get('ieId')

    // Si no viene ieId en query, intentar obtenerlo del token
    if (!ieId) {
      const authHeader = request.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7)
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
          ieId = decoded.ieId?.toString() || '1'
        } catch {
          ieId = '1' // Default fallback
        }
      } else {
        ieId = '1' // Default fallback
      }
    }

    // Obtener grados que tienen GradoSeccion en la institución
    const gradoSecciones = await prisma.gradoSeccion.findMany({
      where: {
        grado: {
          nivel: {
            idIe: parseInt(ieId || '1')
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

    // Extraer grados únicos y formatear para el frontend
    const gradosMap = new Map()
    gradoSecciones.forEach(gs => {
      if (!gradosMap.has(gs.grado.idGrado)) {
        gradosMap.set(gs.grado.idGrado, {
          id: gs.grado.idGrado.toString(),
          idGrado: gs.grado.idGrado,
          nombre: gs.grado.nombre,
          nivel: gs.grado.nivel?.nombre || ''
        })
      }
    })
    
    const grados = Array.from(gradosMap.values())

    return NextResponse.json({
      grados: grados,
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
