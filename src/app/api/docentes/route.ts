import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get user's IE from query params or headers
    const url = new URL(request.url)
    const ieId = url.searchParams.get('ieId')
    
    if (!ieId) {
      return NextResponse.json(
        { error: 'Institution ID is required' },
        { status: 400 }
      )
    }

    const docentes = await prisma.docente.findMany({
      where: {
        usuario: {
          idIe: parseInt(ieId)
        }
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

    const transformedDocentes = docentes.map(docente => ({
      id: docente.idDocente.toString(),
      nombre: docente.usuario.nombre,
      apellido: docente.usuario.apellido,
      email: docente.usuario.email || '',
      telefono: docente.usuario.telefono || '',
      dni: docente.usuario.dni,
      especialidad: docente.especialidad || '',
      institucionEducativa: docente.usuario.ie.nombre,
      fechaRegistro: docente.usuario.createdAt.toISOString(),
      estado: docente.usuario.estado as 'ACTIVO' | 'INACTIVO'
    }))

    return NextResponse.json({
      data: transformedDocentes,
      total: transformedDocentes.length
    })

  } catch (error) {
    console.error('Error fetching docentes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const docenteId = url.searchParams.get('id')
    const body = await request.json()
    const { estado } = body

    if (!docenteId) {
      return NextResponse.json(
        { error: 'Docente ID is required' },
        { status: 400 }
      )
    }

    const docente = await prisma.docente.findUnique({
      where: { idDocente: parseInt(docenteId) },
      include: { usuario: true }
    })

    if (!docente) {
      return NextResponse.json(
        { error: 'Docente not found' },
        { status: 404 }
      )
    }

    await prisma.usuario.update({
      where: { idUsuario: docente.usuario.idUsuario },
      data: { estado }
    })

    return NextResponse.json({ message: 'Estado actualizado exitosamente' })

  } catch (error) {
    console.error('Error updating docente:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
