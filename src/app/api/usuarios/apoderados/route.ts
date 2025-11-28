import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const ieId = url.searchParams.get('ieId')
    const includeInactive = url.searchParams.get('includeInactive') === 'true'

    if (!ieId) {
      return NextResponse.json(
        { error: 'Institution ID is required' },
        { status: 400 }
      )
    }

    // Build where condition based on includeInactive parameter
    const whereCondition: any = {
      idIe: parseInt(ieId),
      roles: {
        some: {
          rol: {
            nombre: 'APODERADO'
          }
        }
      }
    }

    // Only filter by estado if includeInactive is false
    if (!includeInactive) {
      whereCondition.estado = 'ACTIVO'
    }

    const apoderados = await prisma.usuario.findMany({
      where: whereCondition,
      include: {
        apoderado: {
          include: {
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
          }
        },
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

    const transformedApoderados = apoderados.map(apoderado => {
      const apoderadoId = apoderado.apoderado?.idApoderado?.toString() || apoderado.idUsuario.toString()
      console.log(`Transformando usuario ${apoderado.idUsuario} -> apoderado ID: ${apoderadoId} (idApoderado: ${apoderado.apoderado?.idApoderado})`)
      
      return {
        id: apoderadoId,
      nombre: apoderado.nombre,
      apellido: apoderado.apellido,
      dni: apoderado.dni,
      email: apoderado.email,
      telefono: apoderado.telefono,
      direccion: apoderado.apoderado?.direccion || '',
      ocupacion: apoderado.apoderado?.ocupacion || '',
      estudiantes: apoderado.apoderado?.estudiantes?.map((ea: any) => ({
        id: ea.estudiante.idEstudiante,
        nombre: ea.estudiante.usuario.nombre,
        apellido: ea.estudiante.usuario.apellido,
        grado: ea.estudiante.gradoSeccion?.grado?.nombre || '',
        seccion: ea.estudiante.gradoSeccion?.seccion?.nombre || '',
        relacion: ea.relacion,
        esTitular: ea.esTitular
      })) || [],
      institucionEducativa: apoderado.ie?.nombre || 'Sin institución',
      estado: apoderado.estado as 'ACTIVO' | 'INACTIVO',
      fechaRegistro: apoderado.createdAt.toISOString(),
      roles: apoderado.roles || []
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      nombre, 
      apellido, 
      dni, 
      email, 
      telefono, 
      direccion, 
      ocupacion,
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

    // Buscar o crear rol apoderado
    let rolApoderado = await prisma.rol.findFirst({
      where: { nombre: 'APODERADO' }
    })

    if (!rolApoderado) {
      rolApoderado = await prisma.rol.create({
        data: { nombre: 'APODERADO' }
      })
    }

    // Crear usuario apoderado
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

    // Generar código único para el apoderado
    const codigoApoderado = `APO${String(newUser.idUsuario).padStart(4, '0')}`

    // Crear registro de apoderado
    await prisma.apoderado.create({
      data: {
        idUsuario: newUser.idUsuario,
        codigo: codigoApoderado,
        direccion,
        ocupacion
      }
    })

    // Asignar rol apoderado
    await prisma.usuarioRol.create({
      data: {
        idUsuario: newUser.idUsuario,
        idRol: rolApoderado.idRol
      }
    })

    return NextResponse.json({ 
      message: 'Apoderado creado exitosamente',
      id: newUser.idUsuario 
    })

  } catch (error) {
    console.error('Error creating apoderado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Actualizar estado de un apoderado
 */
export async function PATCH(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID del apoderado es requerido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { estado } = body

    if (!estado || !['ACTIVO', 'INACTIVO'].includes(estado)) {
      return NextResponse.json(
        { error: 'Estado inválido. Debe ser ACTIVO o INACTIVO' },
        { status: 400 }
      )
    }

    const apoderadoId = parseInt(id)

    // Buscar el apoderado
    const apoderado = await prisma.apoderado.findUnique({
      where: { idApoderado: apoderadoId },
      include: { usuario: true }
    })

    if (!apoderado) {
      return NextResponse.json(
        { error: 'Apoderado no encontrado' },
        { status: 404 }
      )
    }

    // Actualizar el estado del usuario asociado
    await prisma.usuario.update({
      where: { idUsuario: apoderado.idUsuario },
      data: { estado }
    })

    return NextResponse.json({
      success: true,
      message: 'Estado del apoderado actualizado exitosamente',
      id: apoderadoId,
      nuevoEstado: estado
    })

  } catch (error) {
    console.error('Error updating apoderado estado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * PUT - Actualizar datos completos de un apoderado
 */
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID del apoderado es requerido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { nombre, apellido, email, telefono, dni, direccion, ocupacion, estado } = body

    const apoderadoId = parseInt(id)

    // Buscar el apoderado
    const apoderado = await prisma.apoderado.findUnique({
      where: { idApoderado: apoderadoId },
      include: { usuario: true }
    })

    if (!apoderado) {
      return NextResponse.json(
        { error: 'Apoderado no encontrado' },
        { status: 404 }
      )
    }

    // Verificar DNI único
    if (dni && dni !== apoderado.usuario.dni) {
      const existingDni = await prisma.usuario.findFirst({
        where: { dni, idUsuario: { not: apoderado.idUsuario } }
      })
      if (existingDni) {
        return NextResponse.json(
          { error: 'El DNI ya está registrado por otro usuario' },
          { status: 400 }
        )
      }
    }

    // Verificar email único
    if (email && email !== apoderado.usuario.email) {
      const existingEmail = await prisma.usuario.findFirst({
        where: { email, idUsuario: { not: apoderado.idUsuario } }
      })
      if (existingEmail) {
        return NextResponse.json(
          { error: 'El email ya está registrado por otro usuario' },
          { status: 400 }
        )
      }
    }

    // Actualizar en transacción
    const updated = await prisma.$transaction(async (tx) => {
      // Actualizar usuario
      await tx.usuario.update({
        where: { idUsuario: apoderado.idUsuario },
        data: {
          ...(nombre && { nombre }),
          ...(apellido && { apellido }),
          ...(email && { email }),
          ...(telefono && { telefono }),
          ...(dni && { dni }),
          ...(estado && { estado })
        }
      })

      // Actualizar apoderado
      return await tx.apoderado.update({
        where: { idApoderado: apoderadoId },
        data: {
          ...(direccion !== undefined && { direccion }),
          ...(ocupacion !== undefined && { ocupacion })
        },
        include: {
          usuario: true
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Apoderado actualizado exitosamente',
      data: updated
    })

  } catch (error) {
    console.error('Error updating apoderado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
