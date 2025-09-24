import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const ieId = url.searchParams.get('ieId')

    if (!ieId) {
      return NextResponse.json(
        { error: 'Institution ID is required' },
        { status: 400 }
      )
    }

    const whereClause: any = {
      idIe: parseInt(ieId),
      roles: {
        some: {
          rol: {
            nombre: 'DOCENTE'
          }
        }
      }
    }

    const docentes = await prisma.usuario.findMany({
      where: whereClause,
      include: {
        docente: true,
        ie: true,
        roles: {
          include: {
            rol: true
          }
        }
      },
      orderBy: [
        { apellido: 'asc' },
        { nombre: 'asc' }
      ]
    })

    const transformedDocentes = docentes.map(docente => ({
      id: docente.idUsuario,
      nombre: docente.nombre,
      apellido: docente.apellido,
      dni: docente.dni,
      email: docente.email,
      telefono: docente.telefono,
      especialidad: docente.docente?.especialidad || '',
      codigo: docente.docente?.codigo || '',
      fechaIngreso: docente.createdAt.toISOString(),
      institucionEducativa: docente.ie?.nombre || 'Sin institución',
      estado: docente.estado as 'ACTIVO' | 'INACTIVO',
      fechaRegistro: docente.createdAt.toISOString(),
      roles: docente.roles || []
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      nombre, 
      apellido, 
      dni, 
      email, 
      telefono, 
      especialidad, 
      codigo,
      fechaIngreso,
      password 
    } = body

    // Verificar si el DNI ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { dni }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este DNI' },
        { status: 400 }
      )
    }

    // Buscar o crear rol docente
    let rolDocente = await prisma.rol.findFirst({
      where: { nombre: 'DOCENTE' }
    })

    if (!rolDocente) {
      rolDocente = await prisma.rol.create({
        data: { nombre: 'DOCENTE' }
      })
    }

    // Crear usuario docente
    const newUser = await prisma.usuario.create({
      data: {
        nombre,
        apellido,
        dni,
        email,
        telefono,
        passwordHash: password, // En producción debería estar hasheado
        estado: 'ACTIVO',
        idIe: 1 // Asumiendo IE por defecto
      }
    })

    // Crear registro de docente
    await prisma.docente.create({
      data: {
        idUsuario: newUser.idUsuario,
        especialidad,
        codigo
      }
    })

    // Asignar rol docente
    await prisma.usuarioRol.create({
      data: {
        idUsuario: newUser.idUsuario,
        idRol: rolDocente.idRol
      }
    })

    return NextResponse.json({ 
      message: 'Docente creado exitosamente',
      id: newUser.idUsuario 
    })

  } catch (error) {
    console.error('Error creating docente:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
