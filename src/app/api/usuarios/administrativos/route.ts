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

    const administrativos = await prisma.usuario.findMany({
      where: {
        idIe: parseInt(ieId),
        roles: {
          some: {
            rol: {
              nombre: 'ADMINISTRATIVO'
            }
          }
        }
      },
      include: {
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

    const transformedAdministrativos = administrativos.map(admin => ({
      id: admin.idUsuario,
      nombre: admin.nombre,
      apellido: admin.apellido,
      dni: admin.dni,
      email: admin.email,
      telefono: admin.telefono,
      cargo: 'Administrativo',
      departamento: 'Administración',
      fechaIngreso: admin.createdAt.toISOString(),
      institucionEducativa: admin.ie?.nombre || 'Sin institución',
      estado: admin.estado as 'ACTIVO' | 'INACTIVO',
      fechaRegistro: admin.createdAt.toISOString(),
      roles: admin.roles || []
    }))

    return NextResponse.json({
      data: transformedAdministrativos,
      total: transformedAdministrativos.length
    })

  } catch (error) {
    console.error('Error fetching administrativos:', error)
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
      cargo, 
      departamento,
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

    // Buscar o crear rol administrativo
    let rolAdministrativo = await prisma.rol.findFirst({
      where: { nombre: 'ADMINISTRATIVO' }
    })

    if (!rolAdministrativo) {
      rolAdministrativo = await prisma.rol.create({
        data: { nombre: 'ADMINISTRATIVO' }
      })
    }

    // Crear usuario administrativo
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

    // Asignar rol administrativo
    await prisma.usuarioRol.create({
      data: {
        idUsuario: newUser.idUsuario,
        idRol: rolAdministrativo.idRol
      }
    })

    return NextResponse.json({ 
      message: 'Administrativo creado exitosamente',
      id: newUser.idUsuario 
    })

  } catch (error) {
    console.error('Error creating administrativo:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
