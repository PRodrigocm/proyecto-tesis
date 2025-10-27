import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('Fetching institutions from database...')
    console.log('Prisma client available:', !!prisma)
    console.log('Prisma ie model available:', !!prisma?.ie)
    
    const instituciones = await prisma.ie.findMany({
      select: {
        idIe: true,
        nombre: true,
        codigoIe: true,
        createdAt: true
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    console.log('Found institutions:', instituciones.length)

    const transformedData = instituciones.map(ie => ({
      id: ie.idIe,
      nombre: ie.nombre,
      codigo: ie.codigoIe,
      created_at: ie.createdAt
    }))

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('Error fetching instituciones:', error)
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombre } = body

    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    const institucion = await prisma.ie.create({
      data: {
        nombre,
        codigoIe: `IE-${Date.now()}`, // Generate a unique code
        idModalidad: 1 // Default modalidad, you may want to make this configurable
      }
    })

    // Transform response to match expected interface
    const transformedResponse = {
      id: institucion.idIe,
      nombre: institucion.nombre,
      codigo: institucion.codigoIe,
      created_at: institucion.createdAt
    }

    return NextResponse.json(transformedResponse, { status: 201 })
  } catch (error) {
    console.error('Error creating institucion:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
