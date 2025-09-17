import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const instituciones = await prisma.ie.findMany({
      select: {
        idIe: true,
        nombre: true,
        codigoIe: true,
        direccion: true,
        telefono: true,
        email: true,
        created_at: true
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    // Transform to match expected interface
    const transformedData = instituciones.map(ie => ({
      id: ie.idIe,
      nombre: ie.nombre,
      codigo: ie.codigoIe,
      direccion: ie.direccion,
      telefono: ie.telefono,
      email: ie.email,
      created_at: ie.created_at
    }))

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('Error fetching instituciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombre, direccion, telefono, email } = body

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
        direccion,
        telefono,
        email,
        idModalidad: 1 // Default modalidad, you may want to make this configurable
      }
    })

    // Transform response to match expected interface
    const transformedResponse = {
      id: institucion.idIe,
      nombre: institucion.nombre,
      codigo: institucion.codigoIe,
      direccion: institucion.direccion,
      telefono: institucion.telefono,
      email: institucion.email,
      created_at: institucion.created_at
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
