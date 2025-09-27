import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const ieId = url.searchParams.get('ieId')
    const fechaInicio = url.searchParams.get('fechaInicio')
    const fechaFin = url.searchParams.get('fechaFin')
    const activo = url.searchParams.get('activo')

    if (!ieId) {
      return NextResponse.json(
        { error: 'Institution ID is required' },
        { status: 400 }
      )
    }

    const whereClause: any = {
      idIe: parseInt(ieId)
    }

    if (activo !== null) {
      whereClause.activo = activo === 'true'
    }

    if (fechaInicio && fechaFin) {
      whereClause.OR = [
        {
          fechaInicio: {
            gte: new Date(fechaInicio),
            lte: new Date(fechaFin)
          }
        },
        {
          fechaFin: {
            gte: new Date(fechaInicio),
            lte: new Date(fechaFin)
          }
        },
        {
          AND: [
            { fechaInicio: { lte: new Date(fechaInicio) } },
            { fechaFin: { gte: new Date(fechaFin) } }
          ]
        }
      ]
    }

    const horariosSemanales = await prisma.horarioSemanal.findMany({
      where: whereClause,
      include: {
        ie: true,
        detalles: {
          include: {
            horarioBase: {
              include: {
                gradoSeccion: {
                  include: {
                    grado: true,
                    seccion: true
                  }
                }
              }
            }
          },
          orderBy: [
            { diaSemana: 'asc' },
            { horaInicio: 'asc' }
          ]
        }
      },
      orderBy: [
        { fechaInicio: 'desc' }
      ]
    })

    const transformedHorarios = horariosSemanales.map(horario => ({
      id: horario.idHorarioSemanal.toString(),
      nombre: horario.nombre,
      descripcion: horario.descripcion || '',
      fechaInicio: horario.fechaInicio.toISOString().split('T')[0],
      fechaFin: horario.fechaFin.toISOString().split('T')[0],
      activo: horario.activo,
      ie: {
        id: horario.ie.idIe.toString(),
        nombre: horario.ie.nombre
      },
      detalles: horario.detalles.map(detalle => ({
        id: detalle.idDetalle.toString(),
        diaSemana: detalle.diaSemana,
        diaNombre: getDiaNombre(detalle.diaSemana),
        horaInicio: detalle.horaInicio.toTimeString().slice(0, 5),
        horaFin: detalle.horaFin.toTimeString().slice(0, 5),
        materia: detalle.materia || '',
        docente: detalle.docente || '',
        aula: detalle.aula || '',
        tipoActividad: detalle.tipoActividad,
        tipoActividadLabel: getTipoActividadLabel(detalle.tipoActividad),
        observaciones: detalle.observaciones || '',
        grado: detalle.horarioBase.gradoSeccion?.grado?.nombre || '',
        seccion: detalle.horarioBase.gradoSeccion?.seccion?.nombre || '',
        activo: detalle.activo
      })),
      createdAt: horario.createdAt.toISOString(),
      updatedAt: horario.updatedAt?.toISOString() || null
    }))

    return NextResponse.json({
      data: transformedHorarios,
      total: transformedHorarios.length
    })

  } catch (error) {
    console.error('Error fetching horarios semanales:', error)
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
      ieId,
      nombre,
      descripcion,
      fechaInicio,
      fechaFin,
      detalles
    } = body

    if (!ieId || !nombre || !fechaInicio || !fechaFin || !detalles || detalles.length === 0) {
      return NextResponse.json(
        { error: 'ieId, nombre, fechaInicio, fechaFin y detalles son requeridos' },
        { status: 400 }
      )
    }

    const nuevoHorarioSemanal = await prisma.horarioSemanal.create({
      data: {
        idIe: parseInt(ieId),
        nombre,
        descripcion: descripcion || null,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        detalles: {
          create: detalles.map((detalle: any) => ({
            idHorarioBase: parseInt(detalle.idHorarioBase),
            diaSemana: parseInt(detalle.diaSemana),
            horaInicio: new Date(`1970-01-01T${detalle.horaInicio}:00`),
            horaFin: new Date(`1970-01-01T${detalle.horaFin}:00`),
            materia: detalle.materia || null,
            docente: detalle.docente || null,
            aula: detalle.aula || null,
            tipoActividad: detalle.tipoActividad || 'CLASE_REGULAR',
            observaciones: detalle.observaciones || null
          }))
        }
      }
    })

    return NextResponse.json({
      message: 'Horario semanal creado exitosamente',
      id: nuevoHorarioSemanal.idHorarioSemanal
    })

  } catch (error) {
    console.error('Error creating horario semanal:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

function getDiaNombre(diaSemana: number): string {
  const dias = {
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado',
    7: 'Domingo'
  }
  return dias[diaSemana as keyof typeof dias] || 'Desconocido'
}

function getTipoActividadLabel(tipo: string): string {
  const tipos = {
    'CLASE_REGULAR': 'Clase Regular',
    'REFORZAMIENTO': 'Reforzamiento',
    'RECUPERACION': 'Recuperación',
    'EVALUACION': 'Evaluación',
    'TALLER_EXTRA': 'Taller Extra'
  }
  return tipos[tipo as keyof typeof tipos] || tipo
}
