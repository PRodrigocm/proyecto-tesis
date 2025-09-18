import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get user's IE from query params
    const url = new URL(request.url)
    const ieId = url.searchParams.get('ieId')
    
    if (!ieId) {
      return NextResponse.json(
        { error: 'Institution ID is required' },
        { status: 400 }
      )
    }

    const estudiantes = await prisma.estudiante.findMany({
      where: {
        idIe: parseInt(ieId)
      },
      include: {
        usuario: {
          include: {
            ie: true
          }
        }
      },
      orderBy: {
        usuario: {
          nombre: 'asc'
        }
      }
    })

    const transformedEstudiantes = estudiantes.map(estudiante => ({
      id: estudiante.idEstudiante.toString(),
      nombre: estudiante.usuario.nombre,
      apellido: estudiante.usuario.apellido,
      dni: estudiante.usuario.dni,
      fechaNacimiento: estudiante.fechaNacimiento?.toISOString() || '',
      grado: '', // Will need to add grado field to schema or get from another relation
      seccion: '', // Will need to add seccion field to schema or get from another relation
      institucionEducativa: estudiante.usuario.ie.nombre,
      apoderado: {
        id: '',
        nombre: '',
        apellido: '',
        telefono: '',
        email: ''
      }, // Will need to implement apoderado relation
      estado: estudiante.usuario.estado as 'ACTIVO' | 'INACTIVO' | 'RETIRADO',
      fechaRegistro: estudiante.usuario.createdAt.toISOString(),
      qrCode: estudiante.qr || ''
    }))

    return NextResponse.json({
      data: transformedEstudiantes,
      total: transformedEstudiantes.length
    })

  } catch (error) {
    console.error('Error fetching estudiantes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const estudianteId = url.searchParams.get('id')
    const body = await request.json()
    const { estado } = body

    if (!estudianteId) {
      return NextResponse.json(
        { error: 'Estudiante ID is required' },
        { status: 400 }
      )
    }

    const estudiante = await prisma.estudiante.findUnique({
      where: { idEstudiante: parseInt(estudianteId) },
      include: { usuario: true }
    })

    if (!estudiante) {
      return NextResponse.json(
        { error: 'Estudiante not found' },
        { status: 404 }
      )
    }

    await prisma.usuario.update({
      where: { idUsuario: estudiante.usuario.idUsuario },
      data: { estado }
    })

    return NextResponse.json({ message: 'Estado actualizado exitosamente' })

  } catch (error) {
    console.error('Error updating estudiante:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
