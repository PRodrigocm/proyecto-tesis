import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🔍 GET /api/talleres/[id] - Obteniendo taller:', id)

    // Obtener ieId del token de usuario
    const authHeader = request.headers.get('authorization')
    let ieId = 1 // Default
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
        ieId = decoded.ieId || 1
      } catch (error) {
        console.log('⚠️ Error decoding token, using default ieId:', ieId)
      }
    }

    const taller = await prisma.taller.findFirst({
      where: {
        idTaller: parseInt(id),
        idIe: ieId
      },
      include: {
        inscripciones: {
          where: {
            estado: 'activa'
          },
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
        },
        horarios: {
          where: {
            activo: true
          }
        }
      }
    })

    if (!taller) {
      return NextResponse.json(
        { error: 'Taller no encontrado' },
        { status: 404 }
      )
    }

    const transformedData = {
      id: taller.idTaller.toString(),
      codigo: taller.codigo || '',
      nombre: taller.nombre,
      descripcion: taller.descripcion || '',
      instructor: taller.instructor || '',
      capacidadMaxima: taller.capacidadMaxima || 0,
      activo: taller.activo,
      inscripciones: taller.inscripciones.length,
      fechaCreacion: taller.createdAt?.toISOString() || '',
      fechaActualizacion: taller.updatedAt?.toISOString() || null,
      estudiantes: taller.inscripciones.map(inscripcion => ({
        id: inscripcion.estudiante.idEstudiante.toString(),
        nombre: inscripcion.estudiante.usuario.nombre,
        apellido: inscripcion.estudiante.usuario.apellido,
        dni: inscripcion.estudiante.usuario.dni,
        grado: inscripcion.estudiante.gradoSeccion?.grado?.nombre || '',
        seccion: inscripcion.estudiante.gradoSeccion?.seccion?.nombre || '',
        fechaInscripcion: inscripcion.fechaInscripcion.toISOString(),
        estado: inscripcion.estado
      })),
      horarios: taller.horarios.map(horario => ({
        id: horario.idHorarioTaller.toString(),
        diaSemana: horario.diaSemana,
        horaInicio: horario.horaInicio.toTimeString().slice(0, 5),
        horaFin: horario.horaFin.toTimeString().slice(0, 5),
        lugar: horario.lugar || ''
      }))
    }

    return NextResponse.json({
      success: true,
      data: transformedData
    })

  } catch (error) {
    console.error('Error fetching taller:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('✏️ PUT /api/talleres/[id] - Actualizando taller:', id)

    // Obtener ieId del token de usuario
    const authHeader = request.headers.get('authorization')
    let ieId = 1 // Default
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
        ieId = decoded.ieId || 1
      } catch (error) {
        console.log('⚠️ Error decoding token, using default ieId:', ieId)
      }
    }

    const body = await request.json()
    const {
      nombre,
      descripcion,
      instructor,
      capacidadMaxima,
      activo
    } = body

    console.log('📋 Datos a actualizar:', { nombre, descripcion, instructor, capacidadMaxima, activo })

    // Verificar que el taller existe y pertenece a la IE
    const tallerExistente = await prisma.taller.findFirst({
      where: {
        idTaller: parseInt(id),
        idIe: ieId
      }
    })

    if (!tallerExistente) {
      return NextResponse.json(
        { error: 'Taller no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si el nuevo nombre ya existe (si se está cambiando)
    if (nombre && nombre !== tallerExistente.nombre) {
      const nombreExistente = await prisma.taller.findFirst({
        where: {
          nombre: nombre,
          idIe: ieId,
          idTaller: {
            not: parseInt(id)
          }
        }
      })

      if (nombreExistente) {
        return NextResponse.json(
          { error: 'Ya existe un taller con este nombre en la institución' },
          { status: 400 }
        )
      }
    }

    const tallerActualizado = await prisma.taller.update({
      where: {
        idTaller: parseInt(id)
      },
      data: {
        ...(nombre && { nombre }),
        ...(descripcion !== undefined && { descripcion: descripcion || null }),
        ...(instructor !== undefined && { instructor: instructor || null }),
        ...(capacidadMaxima !== undefined && { capacidadMaxima }),
        ...(activo !== undefined && { activo })
      }
    })

    console.log('✅ Taller actualizado exitosamente:', tallerActualizado.idTaller)

    return NextResponse.json({
      success: true,
      message: 'Taller actualizado exitosamente',
      data: {
        id: tallerActualizado.idTaller.toString(),
        nombre: tallerActualizado.nombre
      }
    })

  } catch (error) {
    console.error('❌ Error updating taller:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🗑️ DELETE /api/talleres/[id] - Eliminando taller:', id)

    // Obtener ieId del token de usuario
    const authHeader = request.headers.get('authorization')
    let ieId = 1 // Default
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
        ieId = decoded.ieId || 1
      } catch (error) {
        console.log('⚠️ Error decoding token, using default ieId:', ieId)
      }
    }

    // Verificar que el taller existe y pertenece a la IE
    const taller = await prisma.taller.findFirst({
      where: {
        idTaller: parseInt(id),
        idIe: ieId
      },
      include: {
        inscripciones: true
      }
    })

    if (!taller) {
      return NextResponse.json(
        { error: 'Taller no encontrado' },
        { status: 404 }
      )
    }

    // Si tiene inscripciones activas, solo desactivar
    if (taller.inscripciones.some(i => i.estado === 'activa')) {
      const tallerDesactivado = await prisma.taller.update({
        where: {
          idTaller: parseInt(id)
        },
        data: {
          activo: false
        }
      })

      console.log('⚠️ Taller desactivado (tiene inscripciones activas):', tallerDesactivado.idTaller)

      return NextResponse.json({
        success: true,
        message: 'Taller desactivado exitosamente (tiene inscripciones activas)',
        data: {
          id: tallerDesactivado.idTaller.toString(),
          activo: false
        }
      })
    } else {
      // Si no tiene inscripciones activas, eliminar completamente
      await prisma.taller.delete({
        where: {
          idTaller: parseInt(id)
        }
      })

      console.log('✅ Taller eliminado exitosamente:', id)

      return NextResponse.json({
        success: true,
        message: 'Taller eliminado exitosamente'
      })
    }

  } catch (error) {
    console.error('❌ Error deleting taller:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
