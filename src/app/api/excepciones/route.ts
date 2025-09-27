import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET - Obtener todas las excepciones y feriados
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const ieId = searchParams.get('ieId')
    const fecha = searchParams.get('fecha')
    const tipo = searchParams.get('tipo')

    if (!ieId) {
      return NextResponse.json({ error: 'IE ID requerido' }, { status: 400 })
    }

    // Construir filtros
    const where: any = {
      idIe: parseInt(ieId),
      activo: true
    }

    if (fecha) {
      where.fecha = new Date(fecha)
    }

    if (tipo) {
      where.tipoExcepcion = tipo
    }

    const excepciones = await prisma.excepcionHorario.findMany({
      where,
      include: {
        ie: {
          select: {
            nombre: true
          }
        }
      },
      orderBy: [
        { fecha: 'asc' }
      ]
    })

    const excepcionesTransformadas = excepciones.map(excepcion => ({
      id: excepcion.idExcepcion.toString(),
      fecha: excepcion.fecha.toISOString().split('T')[0], // YYYY-MM-DD
      tipoExcepcion: excepcion.tipoExcepcion,
      tipoHorario: excepcion.tipoHorario,
      motivo: excepcion.motivo || '',
      descripcion: excepcion.descripcion || '',
      horaInicioAlt: excepcion.horaInicioAlt?.toISOString().slice(11, 16) || null, // HH:MM
      horaFinAlt: excepcion.horaFinAlt?.toISOString().slice(11, 16) || null, // HH:MM
      activo: excepcion.activo,
      institucion: excepcion.ie.nombre,
      createdAt: excepcion.createdAt.toISOString()
    }))

    return NextResponse.json({
      success: true,
      data: excepcionesTransformadas,
      total: excepcionesTransformadas.length
    })

  } catch (error) {
    console.error('Error fetching excepciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva excepción o feriado
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const body = await request.json()
    const {
      ieId,
      fecha,
      tipoExcepcion,
      tipoHorario = 'AMBOS',
      motivo,
      descripcion,
      horaInicioAlt,
      horaFinAlt
    } = body

    if (!ieId || !fecha || !tipoExcepcion || !motivo) {
      return NextResponse.json({
        error: 'IE ID, fecha, tipo de excepción y motivo son requeridos'
      }, { status: 400 })
    }

    // Verificar que la IE existe
    const ie = await prisma.ie.findUnique({
      where: { idIe: parseInt(ieId) }
    })

    if (!ie) {
      return NextResponse.json({
        error: 'Institución educativa no encontrada'
      }, { status: 404 })
    }

    // Verificar si ya existe una excepción para esta fecha
    const excepcionExistente = await prisma.excepcionHorario.findFirst({
      where: {
        idIe: parseInt(ieId),
        fecha: new Date(fecha),
        activo: true
      }
    })

    if (excepcionExistente) {
      return NextResponse.json({
        error: 'Ya existe una excepción para esta fecha'
      }, { status: 409 })
    }

    // Crear la excepción
    const nuevaExcepcion = await prisma.excepcionHorario.create({
      data: {
        idIe: parseInt(ieId),
        fecha: new Date(fecha),
        tipoExcepcion: tipoExcepcion,
        tipoHorario: tipoHorario,
        motivo: motivo,
        descripcion: descripcion || null,
        horaInicioAlt: horaInicioAlt ? new Date(`1970-01-01T${horaInicioAlt}:00.000Z`) : null,
        horaFinAlt: horaFinAlt ? new Date(`1970-01-01T${horaFinAlt}:00.000Z`) : null,
        activo: true
      },
      include: {
        ie: {
          select: {
            nombre: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `${tipoExcepcion === 'FERIADO' ? 'Feriado' : 'Excepción'} creado exitosamente`,
      data: {
        id: nuevaExcepcion.idExcepcion.toString(),
        fecha: nuevaExcepcion.fecha.toISOString().split('T')[0],
        tipoExcepcion: nuevaExcepcion.tipoExcepcion,
        motivo: nuevaExcepcion.motivo,
        institucion: nuevaExcepcion.ie.nombre
      }
    })

  } catch (error) {
    console.error('Error creating excepción:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar excepción existente
export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID de excepción requerido' }, { status: 400 })
    }

    const body = await request.json()
    const {
      fecha,
      tipoExcepcion,
      tipoHorario,
      motivo,
      descripcion,
      horaInicioAlt,
      horaFinAlt
    } = body

    // Verificar que la excepción existe
    const excepcionExistente = await prisma.excepcionHorario.findUnique({
      where: { idExcepcion: parseInt(id) }
    })

    if (!excepcionExistente) {
      return NextResponse.json({
        error: 'Excepción no encontrada'
      }, { status: 404 })
    }

    // Actualizar la excepción
    const excepcionActualizada = await prisma.excepcionHorario.update({
      where: { idExcepcion: parseInt(id) },
      data: {
        fecha: fecha ? new Date(fecha) : undefined,
        tipoExcepcion: tipoExcepcion || undefined,
        tipoHorario: tipoHorario || undefined,
        motivo: motivo || undefined,
        descripcion: descripcion !== undefined ? descripcion : undefined,
        horaInicioAlt: horaInicioAlt ? new Date(`1970-01-01T${horaInicioAlt}:00.000Z`) : undefined,
        horaFinAlt: horaFinAlt ? new Date(`1970-01-01T${horaFinAlt}:00.000Z`) : undefined,
        updatedAt: new Date()
      },
      include: {
        ie: {
          select: {
            nombre: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Excepción actualizada exitosamente',
      data: {
        id: excepcionActualizada.idExcepcion.toString(),
        fecha: excepcionActualizada.fecha.toISOString().split('T')[0],
        tipoExcepcion: excepcionActualizada.tipoExcepcion,
        motivo: excepcionActualizada.motivo
      }
    })

  } catch (error) {
    console.error('Error updating excepción:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Desactivar excepción
export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID de excepción requerido' }, { status: 400 })
    }

    // Verificar que la excepción existe
    const excepcionExistente = await prisma.excepcionHorario.findUnique({
      where: { idExcepcion: parseInt(id) }
    })

    if (!excepcionExistente) {
      return NextResponse.json({
        error: 'Excepción no encontrada'
      }, { status: 404 })
    }

    // Desactivar la excepción (soft delete)
    await prisma.excepcionHorario.update({
      where: { idExcepcion: parseInt(id) },
      data: {
        activo: false,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Excepción desactivada exitosamente'
    })

  } catch (error) {
    console.error('Error deleting excepción:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
