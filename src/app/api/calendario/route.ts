import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const mes = url.searchParams.get('mes')
    const año = url.searchParams.get('año')
    const tipo = url.searchParams.get('tipo')
    const prioridad = url.searchParams.get('prioridad')
    const visible = url.searchParams.get('visible')
    const ieId = url.searchParams.get('ieId')

    if (!ieId) {
      return NextResponse.json(
        { error: 'Institution ID is required' },
        { status: 400 }
      )
    }

    const whereClause: any = {
      idIe: parseInt(ieId)
    }

    if (tipo) whereClause.tipo = tipo
    if (prioridad) whereClause.prioridad = prioridad
    if (visible !== null) whereClause.visible = visible === 'true'

    // Filtro por mes y año
    if (mes && año) {
      const startDate = new Date(parseInt(año), parseInt(mes) - 1, 1)
      const endDate = new Date(parseInt(año), parseInt(mes), 0)
      
      whereClause.fecha = {
        gte: startDate,
        lte: endDate
      }
    }

    const eventos = await prisma.calendarioEscolar.findMany({
      where: whereClause,
      include: {
        ie: true
      },
      orderBy: {
        fecha: 'asc'
      }
    })

    const transformedEventos = eventos.map(evento => ({
      id: evento.idCal.toString(),
      titulo: evento.motivo || 'Evento Escolar',
      descripcion: evento.motivo || '',
      fechaInicio: evento.fecha.toISOString(),
      fechaFin: evento.fecha.toISOString(),
      horaInicio: '',
      horaFin: '',
      tipo: 'ACADEMICO',
      prioridad: 'MEDIA',
      todoDia: true,
      color: evento.esLectivo ? '#10B981' : '#EF4444',
      visible: true,
      institucionId: evento.idIe.toString(),
      creadoPor: 'Sistema',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))

    return NextResponse.json({
      data: transformedEventos,
      total: transformedEventos.length
    })

  } catch (error) {
    console.error('Error fetching eventos:', error)
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
      titulo,
      descripcion,
      fechaInicio,
      fechaFin,
      horaInicio,
      horaFin,
      tipo,
      prioridad,
      todoDia,
      color
    } = body

    const nuevoEvento = await prisma.calendarioEscolar.create({
      data: {
        idIe: 1, // IE por defecto
        fecha: new Date(fechaInicio),
        esLectivo: tipo === 'ACADEMICO',
        motivo: titulo
      }
    })

    return NextResponse.json({
      message: 'Evento creado exitosamente',
      id: nuevoEvento.idCal
    })

  } catch (error) {
    console.error('Error creating evento:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
