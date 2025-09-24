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

    // Get estudiantes filtered by institution
    const estudiantes = await prisma.estudiante.findMany({
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
        },
        gradoSeccion: {
          include: {
            grado: true,
            seccion: true
          }
        }
      },
      orderBy: [
        { usuario: { apellido: 'asc' } },
        { usuario: { nombre: 'asc' } }
      ]
    })

    const transformedEstudiantes = estudiantes.map(estudiante => ({
      id: estudiante.idEstudiante.toString(),
      nombre: estudiante.usuario.nombre,
      apellido: estudiante.usuario.apellido,
      dni: estudiante.usuario.dni,
      fechaNacimiento: estudiante.fechaNacimiento?.toISOString() || '',
      grado: estudiante.gradoSeccion?.grado?.nombre || '',
      seccion: estudiante.gradoSeccion?.seccion?.nombre || '',
      institucionEducativa: estudiante.usuario.ie?.nombre || '',
      apoderado: {
        id: '',
        nombre: '',
        apellido: '',
        telefono: '',
        email: ''
      },
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      dni, 
      nombre, 
      apellido, 
      fechaNacimiento, 
      codigo, 
      gradoId, 
      seccionId, 
      apoderadosIds, 
      password,
      ieId 
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

    // Verificar que el grado y sección existan y estén relacionados
    const gradoSeccion = await prisma.gradoSeccion.findFirst({
      where: {
        idGrado: gradoId,
        idSeccion: seccionId
      }
    })

    if (!gradoSeccion) {
      return NextResponse.json(
        { error: 'La combinación de grado y sección no es válida' },
        { status: 400 }
      )
    }

    // Buscar o crear rol estudiante
    let rolEstudiante = await prisma.rol.findFirst({
      where: { nombre: 'ESTUDIANTE' }
    })

    if (!rolEstudiante) {
      rolEstudiante = await prisma.rol.create({
        data: { nombre: 'ESTUDIANTE' }
      })
    }

    // Crear usuario estudiante
    const newUser = await prisma.usuario.create({
      data: {
        nombre,
        apellido,
        dni,
        passwordHash: password, // En producción debería estar hasheado
        estado: 'ACTIVO',
        idIe: ieId
      }
    })

    // Crear registro de estudiante
    const newEstudiante = await prisma.estudiante.create({
      data: {
        idUsuario: newUser.idUsuario,
        idIe: ieId,
        idGradoSeccion: gradoSeccion.idGradoSeccion,
        codigo,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        qr: `EST-${newUser.idUsuario}-${Date.now()}` // Generar QR único
      }
    })

    // Asignar rol estudiante
    await prisma.usuarioRol.create({
      data: {
        idUsuario: newUser.idUsuario,
        idRol: rolEstudiante.idRol
      }
    })

    // Crear relaciones con apoderados si se proporcionaron
    if (apoderadosIds && apoderadosIds.length > 0) {
      for (const apoderadoId of apoderadosIds) {
        // Verificar que el apoderado existe
        const apoderado = await prisma.apoderado.findFirst({
          where: { idUsuario: apoderadoId }
        })

        if (apoderado) {
          await prisma.estudianteApoderado.create({
            data: {
              idEstudiante: newEstudiante.idEstudiante,
              idApoderado: apoderado.idApoderado,
              relacion: 'PADRE/MADRE' // Valor por defecto, se puede personalizar
            }
          })
        }
      }
    }

    return NextResponse.json({ 
      message: 'Estudiante creado exitosamente',
      id: newEstudiante.idEstudiante 
    })

  } catch (error) {
    console.error('Error creating estudiante:', error)
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
