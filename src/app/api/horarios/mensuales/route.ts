import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const ieId = url.searchParams.get('ieId')
    const anio = url.searchParams.get('anio')
    const mes = url.searchParams.get('mes')
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

    if (anio) {
      whereClause.anio = parseInt(anio)
    }

    if (mes) {
      whereClause.mes = parseInt(mes)
    }

    if (activo !== null) {
      whereClause.activo = activo === 'true'
    }

    const horariosMensuales = await prisma.horarioMensual.findMany({
      where: whereClause,
      include: {
        ie: true,
        semanas: {
          include: {
            horarioSemanal: {
              include: {
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
              }
            }
          },
          orderBy: { numeroSemana: 'asc' }
        }
      },
      orderBy: [
        { anio: 'desc' },
        { mes: 'desc' }
      ]
    })

    const transformedHorarios = horariosMensuales.map(horario => ({
      id: horario.idHorarioMensual.toString(),
      anio: horario.anio,
      mes: horario.mes,
      mesNombre: getMesNombre(horario.mes),
      nombre: horario.nombre,
      descripcion: horario.descripcion || '',
      activo: horario.activo,
      ie: {
        id: horario.ie.idIe.toString(),
        nombre: horario.ie.nombre
      },
      semanas: horario.semanas.map(semana => ({
        id: semana.idSemana.toString(),
        numeroSemana: semana.numeroSemana,
        fechaInicio: semana.fechaInicio.toISOString().split('T')[0],
        fechaFin: semana.fechaFin.toISOString().split('T')[0],
        activo: semana.activo,
        horarioSemanal: {
          id: semana.horarioSemanal.idHorarioSemanal.toString(),
          nombre: semana.horarioSemanal.nombre,
          descripcion: semana.horarioSemanal.descripcion || '',
          detalles: semana.horarioSemanal.detalles.map(detalle => ({
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
          }))
        }
      })),
      createdAt: horario.createdAt.toISOString(),
      updatedAt: horario.updatedAt?.toISOString() || null
    }))

    return NextResponse.json({
      data: transformedHorarios,
      total: transformedHorarios.length
    })

  } catch (error) {
    console.error('Error fetching horarios mensuales:', error)
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
      anio,
      mes,
      nombre,
      descripcion,
      semanas
    } = body

    if (!ieId || !anio || !mes || !nombre || !semanas || semanas.length === 0) {
      return NextResponse.json(
        { error: 'ieId, anio, mes, nombre y semanas son requeridos' },
        { status: 400 }
      )
    }

    const nuevoHorarioMensual = await prisma.horarioMensual.create({
      data: {
        idIe: parseInt(ieId),
        anio: parseInt(anio),
        mes: parseInt(mes),
        nombre,
        descripcion: descripcion || null,
        semanas: {
          create: semanas.map((semana: any) => ({
            idHorarioSemanal: parseInt(semana.idHorarioSemanal),
            numeroSemana: parseInt(semana.numeroSemana),
            fechaInicio: new Date(semana.fechaInicio),
            fechaFin: new Date(semana.fechaFin)
          }))
        }
      }
    })

    return NextResponse.json({
      message: 'Horario mensual creado exitosamente',
      id: nuevoHorarioMensual.idHorarioMensual
    })

  } catch (error) {
    console.error('Error creating horario mensual:', error)
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

function getMesNombre(mes: number): string {
  const meses = {
    1: 'Enero',
    2: 'Febrero',
    3: 'Marzo',
    4: 'Abril',
    5: 'Mayo',
    6: 'Junio',
    7: 'Julio',
    8: 'Agosto',
    9: 'Septiembre',
    10: 'Octubre',
    11: 'Noviembre',
    12: 'Diciembre'
  }
  return meses[mes as keyof typeof meses] || 'Desconocido'
}
