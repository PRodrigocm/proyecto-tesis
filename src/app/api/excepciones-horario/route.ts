import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

// GET - Obtener excepciones de horario
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const fecha = searchParams.get('fecha')

    // Verificar token
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const ieId = decoded.ieId || 1

    let whereClause: any = { 
      idIe: ieId,
      activo: true
    }

    if (year) {
      const startDate = new Date(`${year}-01-01`)
      const endDate = new Date(`${year}-12-31`)
      whereClause.fecha = {
        gte: startDate,
        lte: endDate
      }
    }

    if (fecha) {
      whereClause.fecha = new Date(fecha)
    }

    const excepciones = await prisma.excepcionHorario.findMany({
      where: whereClause,
      orderBy: { fecha: 'asc' }
    })

    const transformedExcepciones = excepciones.map(excepcion => ({
      id: excepcion.idExcepcion,
      fecha: excepcion.fecha.toISOString().split('T')[0],
      fechaFin: excepcion.fechaFin ? excepcion.fechaFin.toISOString().split('T')[0] : null,
      tipoExcepcion: excepcion.tipoExcepcion,
      tipoHorario: excepcion.tipoHorario,
      motivo: excepcion.motivo,
      descripcion: excepcion.descripcion,
      horaInicioAlt: excepcion.horaInicioAlt ? excepcion.horaInicioAlt.toISOString().substring(11, 16) : null,
      horaFinAlt: excepcion.horaFinAlt ? excepcion.horaFinAlt.toISOString().substring(11, 16) : null
    }))

    return NextResponse.json({
      success: true,
      data: transformedExcepciones
    })

  } catch (error) {
    console.error('Error fetching excepciones horario:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear excepción de horario
export async function POST(request: NextRequest) {
  try {
    console.log('⚠️ POST /api/excepciones-horario - Iniciando')
    const body = await request.json()
    console.log('📋 Body recibido:', body)
    const { 
      fecha, 
      fechaFin, 
      tipoExcepcion, 
      tipoHorario, 
      motivo, 
      descripcion,
      horaInicioAlt,
      horaFinAlt
    } = body

    // Verificar token
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    console.log('🔑 Token recibido:', token ? 'Sí' : 'No')
    if (!token) {
      console.log('❌ Token faltante')
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    console.log('🔐 JWT_SECRET disponible:', process.env.JWT_SECRET ? 'Sí' : 'No')
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const ieId = decoded.ieId || 1
    console.log('🏫 IE ID extraído:', ieId)

    // Validar campos requeridos
    if (!fecha || !tipoExcepcion || !tipoHorario) {
      return NextResponse.json({ 
        error: 'Fecha, tipo de excepción y tipo de horario son requeridos' 
      }, { status: 400 })
    }

    // Preparar datos para crear
    const excepcionData: any = {
      idIe: ieId,
      fecha: new Date(fecha),
      tipoExcepcion,
      tipoHorario,
      motivo: motivo || null,
      descripcion: descripcion || null,
      activo: true
    }

    // Agregar fecha fin si se proporciona
    if (fechaFin) {
      excepcionData.fechaFin = new Date(fechaFin)
    }

    // Agregar horas alternativas si se proporcionan
    if (horaInicioAlt) {
      excepcionData.horaInicioAlt = new Date(`1970-01-01T${horaInicioAlt}:00`)
    }
    if (horaFinAlt) {
      excepcionData.horaFinAlt = new Date(`1970-01-01T${horaFinAlt}:00`)
    }

    console.log('📝 Creando excepción de horario:', excepcionData)

    const nuevaExcepcion = await prisma.excepcionHorario.create({
      data: excepcionData
    })
    console.log('✅ Excepción creada exitosamente:', nuevaExcepcion)

    return NextResponse.json({
      success: true,
      message: 'Excepción de horario creada exitosamente',
      data: {
        id: nuevaExcepcion.idExcepcion,
        fecha: nuevaExcepcion.fecha.toISOString().split('T')[0],
        fechaFin: nuevaExcepcion.fechaFin ? nuevaExcepcion.fechaFin.toISOString().split('T')[0] : null,
        tipoExcepcion: nuevaExcepcion.tipoExcepcion,
        tipoHorario: nuevaExcepcion.tipoHorario,
        motivo: nuevaExcepcion.motivo,
        descripcion: nuevaExcepcion.descripcion
      }
    })

  } catch (error) {
    console.error('Error creating excepción horario:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar excepción de horario
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get('fecha')
    const id = searchParams.get('id')

    // Verificar token
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const ieId = decoded.ieId || 1

    if (id) {
      // Eliminar por ID específico
      await prisma.excepcionHorario.update({
        where: { idExcepcion: parseInt(id) },
        data: { activo: false }
      })
    } else if (fecha) {
      // Eliminar por fecha (desactivar todas las excepciones de esa fecha)
      await prisma.excepcionHorario.updateMany({
        where: {
          idIe: ieId,
          fecha: new Date(fecha)
        },
        data: { activo: false }
      })
    } else {
      return NextResponse.json({ error: 'ID o fecha es requerida' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Excepción eliminada exitosamente'
    })

  } catch (error) {
    console.error('Error deleting excepción horario:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
