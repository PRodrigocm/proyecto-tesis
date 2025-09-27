import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const tiposAsignacion = await prisma.tipoAsignacion.findMany({
      orderBy: {
        nombre: 'asc'
      }
    })

    const transformedTipos = tiposAsignacion.map(tipo => ({
      id: tipo.idTipoAsignacion.toString(),
      idTipoAsignacion: tipo.idTipoAsignacion,
      nombre: tipo.nombre
    }))

    return NextResponse.json({
      data: transformedTipos,
      total: transformedTipos.length
    })

  } catch (error) {
    console.error('Error fetching tipos de asignación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
