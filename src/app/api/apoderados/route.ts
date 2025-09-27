import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get user's IE from query params
    const url = new URL(request.url)
    const ieId = url.searchParams.get('ieId')
    const includeInactive = url.searchParams.get('includeInactive') === 'true'
    
    if (!ieId) {
      return NextResponse.json(
        { error: 'Institution ID is required' },
        { status: 400 }
      )
    }

    const whereCondition: any = {
      usuario: {
        idIe: parseInt(ieId)
      }
    }

    // By default, only show active apoderados unless specifically requested
    if (!includeInactive) {
      whereCondition.usuario.estado = 'ACTIVO'
    }

    const apoderados = await prisma.apoderado.findMany({
      where: whereCondition,
      include: {
        usuario: {
          include: {
            ie: true
          }
        },
        estudiantes: {
          include: {
            estudiante: {
              include: {
                usuario: true,
                gradoSeccion: {
                  include: {
                    grado: true,
                    seccion: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        usuario: {
          nombre: 'asc'
        }
      }
    })

    console.log('Apoderados encontrados en BD:', apoderados.map(a => ({ 
      idApoderado: a.idApoderado, 
      idUsuario: a.idUsuario,
      nombre: a.usuario.nombre 
    })))

    const transformedApoderados = apoderados.map(apoderado => {
      const transformedId = apoderado.idApoderado.toString()
      console.log(`Transformando apoderado: idApoderado=${apoderado.idApoderado} -> id="${transformedId}"`)
      
      return {
        id: transformedId,
        nombre: apoderado.usuario.nombre,
        apellido: apoderado.usuario.apellido,
      email: apoderado.usuario.email || '',
      telefono: apoderado.usuario.telefono || '',
      dni: apoderado.usuario.dni,
      direccion: apoderado.direccion || '',
      fechaRegistro: apoderado.usuario.createdAt.toISOString(),
      fechaNacimiento: undefined, // Campo no existe en Usuario
      fechaCreacion: apoderado.usuario.createdAt.toISOString(),
      ocupacion: apoderado.ocupacion,
      estado: apoderado.usuario.estado as 'ACTIVO' | 'INACTIVO',
      estudiantes: apoderado.estudiantes.map(rel => ({
        id: rel.estudiante.idEstudiante.toString(),
        nombre: rel.estudiante.usuario.nombre,
        apellido: rel.estudiante.usuario.apellido,
        dni: rel.estudiante.usuario.dni,
        grado: rel.estudiante.gradoSeccion?.grado?.nombre || '',
        seccion: rel.estudiante.gradoSeccion?.seccion?.nombre || '',
        relacion: rel.relacion,
        esTitular: rel.esTitular
      }))
      }
    })

    return NextResponse.json({
      data: transformedApoderados,
      total: transformedApoderados.length
    })

  } catch (error) {
    console.error('Error fetching apoderados:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const apoderadoId = url.searchParams.get('id')
    const body = await request.json()
    const { estado } = body

    if (!apoderadoId) {
      return NextResponse.json(
        { error: 'Apoderado ID is required' },
        { status: 400 }
      )
    }

    const apoderado = await prisma.apoderado.findUnique({
      where: { idApoderado: parseInt(apoderadoId) },
      include: { usuario: true }
    })

    if (!apoderado) {
      return NextResponse.json(
        { error: 'Apoderado not found' },
        { status: 404 }
      )
    }

    await prisma.usuario.update({
      where: { idUsuario: apoderado.usuario.idUsuario },
      data: { estado }
    })

    return NextResponse.json({ message: 'Estado actualizado exitosamente' })

  } catch (error) {
    console.error('Error updating apoderado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
