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
        },
        apoderados: {
          include: {
            apoderado: {
              include: {
                usuario: true
              }
            }
          }
        }
      },
      orderBy: [
        { usuario: { apellido: 'asc' } },
        { usuario: { nombre: 'asc' } }
      ]
    })

    const transformedEstudiantes = estudiantes.map(estudiante => {
      // Buscar apoderado titular
      const apoderadoTitular = estudiante.apoderados?.find(ap => ap.esTitular) || estudiante.apoderados?.[0]
      
      return {
        id: estudiante.idEstudiante.toString(),
        nombre: estudiante.usuario.nombre,
        apellido: estudiante.usuario.apellido,
        dni: estudiante.usuario.dni,
        fechaNacimiento: estudiante.fechaNacimiento?.toISOString() || '',
        grado: estudiante.gradoSeccion?.grado?.nombre || '',
        seccion: estudiante.gradoSeccion?.seccion?.nombre || '',
        institucionEducativa: estudiante.usuario.ie?.nombre || '',
        apoderado: {
          id: apoderadoTitular?.apoderado.usuario.idUsuario.toString() || '',
          nombre: apoderadoTitular?.apoderado.usuario.nombre || '',
          apellido: apoderadoTitular?.apoderado.usuario.apellido || '',
          telefono: apoderadoTitular?.apoderado.usuario.telefono || '',
          email: apoderadoTitular?.apoderado.usuario.email || '',
          relacion: apoderadoTitular?.relacion || '',
          esTitular: apoderadoTitular?.esTitular || false
        },
        estado: estudiante.usuario.estado as 'ACTIVO' | 'INACTIVO' | 'RETIRADO',
        fechaRegistro: estudiante.usuario.createdAt.toISOString(),
        qrCode: estudiante.qr || ''
      }
    })

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
      gradoId, 
      seccionId, 
      apoderadosIds, // Mantener para compatibilidad
      apoderadosRelaciones, // Nuevo formato con relaciones
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

    // Crear usuario estudiante (sin contraseña ya que no interactúa directamente)
    const newUser = await prisma.usuario.create({
      data: {
        nombre,
        apellido,
        dni,
        passwordHash: null, // Los estudiantes no necesitan contraseña
        estado: 'ACTIVO',
        idIe: ieId
      }
    })

    // Generar código único para el estudiante
    const codigoEstudiante = `EST${String(newUser.idUsuario).padStart(4, '0')}`
    
    // Crear registro de estudiante
    const newEstudiante = await prisma.estudiante.create({
      data: {
        idUsuario: newUser.idUsuario,
        idIe: ieId,
        idGradoSeccion: gradoSeccion.idGradoSeccion,
        codigo: codigoEstudiante,
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

    // Crear relaciones con apoderados
    const relacionesACrear = apoderadosRelaciones || (apoderadosIds ? apoderadosIds.map((id: number) => ({ apoderadoId: id, relacion: 'PADRE/MADRE' })) : [])
    
    if (relacionesACrear && relacionesACrear.length > 0) {
      for (const relacion of relacionesACrear) {
        // Verificar que el apoderado existe
        const apoderado = await prisma.apoderado.findFirst({
          where: { idUsuario: relacion.apoderadoId }
        })

        if (apoderado) {
          await prisma.estudianteApoderado.create({
            data: {
              idEstudiante: newEstudiante.idEstudiante,
              idApoderado: apoderado.idApoderado,
              relacion: relacion.relacion || 'PADRE/MADRE',
              esTitular: relacion.esTitular || false,
              puedeRetirar: relacion.esTitular || false
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
    const id = url.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID del estudiante es requerido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { estado } = body

    if (!estado || !['ACTIVO', 'INACTIVO', 'RETIRADO'].includes(estado)) {
      return NextResponse.json(
        { error: 'Estado inválido' },
        { status: 400 }
      )
    }

    // Buscar el estudiante
    const estudiante = await prisma.estudiante.findUnique({
      where: { idEstudiante: parseInt(id) },
      include: { usuario: true }
    })

    if (!estudiante) {
      return NextResponse.json(
        { error: 'Estudiante no encontrado' },
        { status: 404 }
      )
    }

    // Actualizar el estado del usuario
    await prisma.usuario.update({
      where: { idUsuario: estudiante.usuario.idUsuario },
      data: { estado }
    })

    return NextResponse.json({
      message: 'Estado actualizado exitosamente',
      id: id,
      nuevoEstado: estado
    })

  } catch (error) {
    console.error('Error updating estudiante:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID del estudiante es requerido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { dni, nombre, apellido, fechaNacimiento, gradoId, seccionId } = body

    // Buscar el estudiante
    const estudiante = await prisma.estudiante.findUnique({
      where: { idEstudiante: parseInt(id) },
      include: { usuario: true }
    })

    if (!estudiante) {
      return NextResponse.json(
        { error: 'Estudiante no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si el DNI ya existe (excluyendo el estudiante actual)
    if (dni !== estudiante.usuario.dni) {
      const existingUser = await prisma.usuario.findFirst({
        where: { 
          dni,
          idUsuario: { not: estudiante.usuario.idUsuario }
        }
      })

      if (existingUser) {
        return NextResponse.json(
          { error: `El DNI ${dni} ya está registrado por otro usuario` },
          { status: 400 }
        )
      }
    }

    // Verificar que la combinación grado-sección sea válida
    const gradoSeccionValida = await prisma.gradoSeccion.findFirst({
      where: {
        idGrado: gradoId,
        idSeccion: seccionId
      }
    })

    if (!gradoSeccionValida) {
      return NextResponse.json(
        { error: 'La combinación de grado y sección no es válida' },
        { status: 400 }
      )
    }

    // Actualizar usuario
    await prisma.usuario.update({
      where: { idUsuario: estudiante.usuario.idUsuario },
      data: {
        dni,
        nombre,
        apellido
      }
    })

    // Actualizar estudiante
    await prisma.estudiante.update({
      where: { idEstudiante: parseInt(id) },
      data: {
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        idGradoSeccion: gradoSeccionValida.idGradoSeccion
      }
    })

    return NextResponse.json({
      message: 'Estudiante actualizado exitosamente',
      id: id
    })

  } catch (error) {
    console.error('Error updating estudiante:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
