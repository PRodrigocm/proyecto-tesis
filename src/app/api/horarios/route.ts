import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const grado = url.searchParams.get('grado')
    const seccion = url.searchParams.get('seccion')
    const diaSemana = url.searchParams.get('diaSemana')
    const sesion = url.searchParams.get('sesion')
    const docente = url.searchParams.get('docente')
    const ieId = url.searchParams.get('ieId')

    if (!ieId) {
      return NextResponse.json(
        { error: 'Institution ID is required' },
        { status: 400 }
      )
    }

    const whereClause: any = {
      gradoSeccion: {
        grado: {
          idIe: parseInt(ieId)
        }
      }
    }

    if (diaSemana) whereClause.diaSemana = diaSemana
    if (sesion && sesion !== 'TODOS') whereClause.sesiones = sesion

    const horarios = await prisma.horarioGradoSeccion.findMany({
      where: whereClause,
      include: {
        gradoSeccion: {
          include: {
            grado: true,
            seccion: true
          }
        }
      },
      orderBy: [
        { diaSemana: 'asc' },
        { horaEntrada: 'asc' }
      ]
    })

    // Filtrar por grado y sección si se especifican
    const filteredHorarios = horarios.filter(horario => {
      const gradoMatch = !grado || horario.gradoSeccion?.grado?.nombre === grado
      const seccionMatch = !seccion || horario.gradoSeccion?.seccion?.nombre === seccion
      // El filtro de docente no aplica para HorarioGradoSeccion
      return gradoMatch && seccionMatch
    })

    const transformedHorarios = filteredHorarios.map(horario => ({
      id: horario.idHorario.toString(),
      grado: horario.gradoSeccion?.grado?.nombre || '',
      seccion: horario.gradoSeccion?.seccion?.nombre || '',
      diaSemana: horario.diaSemana.toString(),
      horaInicio: horario.horaEntrada.toTimeString().slice(0, 5),
      horaFin: horario.horaSalida.toTimeString().slice(0, 5),
      materia: 'Horario General',
      docenteId: '',
      docente: {
        nombre: '',
        apellido: '',
        especialidad: ''
      },
      aula: '',
      sesion: horario.sesiones || 'AM',
      activo: true
    }))

    return NextResponse.json({
      data: transformedHorarios,
      total: transformedHorarios.length
    })

  } catch (error) {
    console.error('Error fetching horarios:', error)
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
      grado,
      seccion,
      diaSemana,
      horaInicio,
      horaFin,
      materia,
      docenteId,
      aula,
      sesion,
      ieId
    } = body

    if (!ieId) {
      return NextResponse.json(
        { error: 'Institution ID is required' },
        { status: 400 }
      )
    }

    // Buscar el grado-sección correspondiente en la institución
    const gradoSeccion = await prisma.gradoSeccion.findFirst({
      where: {
        grado: { 
          nombre: grado,
          idIe: parseInt(ieId)
        },
        seccion: { nombre: seccion }
      }
    })

    if (!gradoSeccion) {
      return NextResponse.json(
        { error: 'Grado-sección no encontrado' },
        { status: 400 }
      )
    }

    const nuevoHorario = await prisma.horarioGradoSeccion.create({
      data: {
        idGradoSeccion: gradoSeccion.idGradoSeccion,
        diaSemana: parseInt(diaSemana),
        horaEntrada: new Date(`1970-01-01T${horaInicio}:00`),
        horaSalida: new Date(`1970-01-01T${horaFin}:00`),
        sesiones: sesion
      }
    })

    return NextResponse.json({
      message: 'Horario creado exitosamente',
      id: nuevoHorario.idHorario
    })

  } catch (error) {
    console.error('Error creating horario:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
