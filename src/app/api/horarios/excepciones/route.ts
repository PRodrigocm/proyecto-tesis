import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

// Verificar token JWT
function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
  } catch (error) {
    return null
  }
}

// GET - Obtener excepciones de horario
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const ieId = searchParams.get('ieId')
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')

    if (!ieId) {
      return NextResponse.json({ error: 'ieId es requerido' }, { status: 400 })
    }

    // Los filtros se aplican directamente en la consulta de calendarioEscolar

    // Obtener excepciones del calendario escolar
    const excepciones = await prisma.calendarioEscolar.findMany({
      where: {
        idIe: parseInt(ieId),
        ...(fechaInicio && fechaFin ? {
          fechaInicio: {
            gte: new Date(fechaInicio),
            lte: new Date(fechaFin)
          }
        } : fechaInicio ? {
          fechaInicio: {
            gte: new Date(fechaInicio)
          }
        } : fechaFin ? {
          fechaInicio: {
            lte: new Date(fechaFin)
          }
        } : {})
      },
      orderBy: {
        fechaInicio: 'desc'
      }
    })

    // Formatear datos
    const excepcionesFormateadas = excepciones.map((excepcion: any) => ({
      id: excepcion.idCalendario.toString(),
      fecha: excepcion.fechaInicio.toISOString().split('T')[0],
      tipoExcepcion: excepcion.tipoDia,
      tipoHorario: 'AMBOS', // Por defecto
      motivo: excepcion.descripcion || '',
      descripcion: excepcion.descripcion || '',
      horaInicioAlt: null,
      horaFinAlt: null,
      horarioClase: null,
      activo: true
    }))

    return NextResponse.json({
      success: true,
      data: excepcionesFormateadas
    })

  } catch (error) {
    console.error('Error al obtener excepciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva excepción de horario
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      fecha,
      tipoExcepcion,
      tipoHorario,
      motivo,
      descripcion,
      horaInicioAlt,
      horaFinAlt,
      idHorarioClase,
      ieId
    } = body

    // Validaciones
    if (!fecha || !tipoExcepcion || !tipoHorario || !ieId) {
      return NextResponse.json(
        { error: 'Campos requeridos: fecha, tipoExcepcion, tipoHorario, ieId' },
        { status: 400 }
      )
    }

    // Crear excepción en calendario escolar
    const nuevaExcepcion = await prisma.calendarioEscolar.create({
      data: {
        fechaInicio: new Date(fecha),
        fechaFin: new Date(fecha),
        tipoDia: tipoExcepcion,
        descripcion: descripcion || motivo || null,
        idIe: parseInt(ieId),
        creadoEn: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: nuevaExcepcion.idCalendario.toString(),
        message: 'Excepción creada exitosamente'
      }
    })

  } catch (error) {
    console.error('Error al crear excepción:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar excepción de horario
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 })
    }

    // Preparar datos de actualización
    const dataToUpdate: any = {}

    if (updateData.fecha) {
      dataToUpdate.fechaInicio = new Date(updateData.fecha)
      dataToUpdate.fechaFin = new Date(updateData.fecha)
    }
    if (updateData.tipoExcepcion) dataToUpdate.tipoDia = updateData.tipoExcepcion
    if (updateData.descripcion !== undefined || updateData.motivo !== undefined) {
      dataToUpdate.descripcion = updateData.descripcion || updateData.motivo || null
    }

    // Actualizar excepción
    const excepcionActualizada = await prisma.calendarioEscolar.update({
      where: {
        idCalendario: parseInt(id)
      },
      data: dataToUpdate
    })

    return NextResponse.json({
      success: true,
      data: {
        id: excepcionActualizada.idCalendario.toString(),
        message: 'Excepción actualizada exitosamente'
      }
    })

  } catch (error) {
    console.error('Error al actualizar excepción:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar excepción de horario
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 })
    }

    // Eliminar excepción (hard delete ya que CalendarioEscolar no tiene campo activo)
    await prisma.calendarioEscolar.delete({
      where: {
        idCalendario: parseInt(id)
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Excepción eliminada exitosamente'
    })

  } catch (error) {
    console.error('Error al eliminar excepción:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
