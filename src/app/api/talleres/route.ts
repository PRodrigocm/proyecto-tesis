import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const ieId = url.searchParams.get('ieId')
    const activo = url.searchParams.get('activo')

    // Obtener ieId del usuario si no se proporciona
    let finalIeId = ieId
    if (!finalIeId) {
      // Por defecto usar IE 1
      finalIeId = '1'
    }

    const whereClause: any = {
      idIe: parseInt(finalIeId)
    }

    if (activo !== null && activo !== undefined) {
      whereClause.activo = activo === 'true'
    }

    const talleres = await prisma.taller.findMany({
      where: whereClause,
      include: {
        ie: {
          select: {
            idIe: true,
            nombre: true
          }
        }
      },
      orderBy: [
        { nombre: 'asc' }
      ]
    })

    const transformedData = talleres.map(taller => ({
      idTaller: taller.idTaller,
      nombre: taller.nombre,
      descripcion: taller.descripcion || '',
      instructor: taller.instructor || '',
      capacidadMaxima: taller.capacidadMaxima || 0,
      activo: taller.activo,
      ie: {
        id: taller.ie.idIe.toString(),
        nombre: taller.ie.nombre
      },
      createdAt: taller.createdAt?.toISOString() || '',
      updatedAt: taller.updatedAt?.toISOString() || null
    }))

    return NextResponse.json({
      data: transformedData,
      total: transformedData.length
    })

  } catch (error) {
    console.error('Error fetching talleres:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      nombre,
      descripcion,
      instructor,
      capacidadMaxima,
      ieId
    } = body

    if (!nombre || !ieId) {
      return NextResponse.json(
        { error: 'Nombre e ieId son requeridos' },
        { status: 400 }
      )
    }

    const nuevoTaller = await prisma.taller.create({
      data: {
        nombre,
        descripcion: descripcion || null,
        instructor: instructor || null,
        capacidadMaxima: capacidadMaxima || 20,
        idIe: parseInt(ieId),
        activo: true
      }
    })

    return NextResponse.json({
      message: 'Taller creado exitosamente',
      id: nuevoTaller.idTaller
    })

  } catch (error) {
    console.error('Error creating taller:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
