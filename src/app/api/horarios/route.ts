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
    const fecha = url.searchParams.get('fecha') // Para verificar excepciones en fecha específica

    if (!ieId) {
      return NextResponse.json(
        { error: 'Institution ID is required' },
        { status: 400 }
      )
    }

    const whereClause: any = {
      gradoSeccion: {
        grado: {
          nivel: {
            idIe: parseInt(ieId)
          }
        }
      }
    }

    if (diaSemana) {
      // Convertir nombre del día a número
      const diasSemana: { [key: string]: number } = {
        'LUNES': 1, 'MARTES': 2, 'MIERCOLES': 3, 'JUEVES': 4, 'VIERNES': 5,
        'SABADO': 6, 'DOMINGO': 0
      }
      const diaNumero = diasSemana[diaSemana.toUpperCase()]
      if (diaNumero !== undefined) {
        whereClause.diaSemana = diaNumero
      }
    }
    if (sesion && sesion !== 'TODOS') whereClause.sesiones = sesion

    const horarios = await prisma.horarioClase.findMany({
      where: whereClause,
      include: {
        gradoSeccion: {
          include: {
            grado: {
              include: {
                nivel: true
              }
            },
            seccion: true
          }
        },
        // excepciones: fecha ? {
        //   where: {
        //     fecha: new Date(fecha),
        //     activo: true
        //   }
        // } : false
      },
      orderBy: [
        { diaSemana: 'asc' },
        { horaInicio: 'asc' }
      ]
    })

    // Filtrar por grado y sección si se especifican
    const filteredHorarios = horarios.filter(horario => {
      const gradoMatch = !grado || horario.gradoSeccion?.grado?.nombre === grado
      const seccionMatch = !seccion || horario.gradoSeccion?.seccion?.nombre === seccion
      // El filtro de docente no aplica para HorarioGradoSeccion
      return gradoMatch && seccionMatch
    })

    // Simular horarios de clases basados en horarios generales
    const transformedHorarios: any[] = []
    
    filteredHorarios.forEach((horario: any) => {
      // Convertir número del día a nombre
      const diasSemana = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO']
      const nombreDia = diasSemana[horario.diaSemana] || horario.diaSemana.toString()
      
      // Simular materias comunes para cada grado
      const materiasPorGrado: { [key: string]: string[] } = {
        '1': ['Matemáticas', 'Comunicación', 'Personal Social', 'Ciencia y Tecnología', 'Arte', 'Educación Física'],
        '2': ['Matemáticas', 'Comunicación', 'Personal Social', 'Ciencia y Tecnología', 'Arte', 'Educación Física'],
        '3': ['Matemáticas', 'Comunicación', 'Personal Social', 'Ciencia y Tecnología', 'Arte', 'Educación Física'],
        '4': ['Matemáticas', 'Comunicación', 'Personal Social', 'Ciencia y Tecnología', 'Arte', 'Educación Física'],
        '5': ['Matemáticas', 'Comunicación', 'Personal Social', 'Ciencia y Tecnología', 'Arte', 'Educación Física'],
        '6': ['Matemáticas', 'Comunicación', 'Personal Social', 'Ciencia y Tecnología', 'Arte', 'Educación Física']
      }
      
      const grado = horario.gradoSeccion?.grado?.nombre || '1'
      const materias = materiasPorGrado[grado] || materiasPorGrado['1']
      
      // Crear horarios de clase simulados (dividir el tiempo en bloques de 45 minutos)
      const horaInicio = new Date(`1970-01-01T${horario.horaEntrada.toTimeString()}`)
      const horaFin = new Date(`1970-01-01T${horario.horaSalida.toTimeString()}`)
      const duracionMinutos = (horaFin.getTime() - horaInicio.getTime()) / (1000 * 60)
      const bloquesPorDia = Math.floor(duracionMinutos / 45) // 45 minutos por materia
      
      for (let i = 0; i < Math.min(bloquesPorDia, materias.length); i++) {
        const inicioBloque = new Date(horaInicio.getTime() + (i * 45 * 60 * 1000))
        const finBloque = new Date(horaInicio.getTime() + ((i + 1) * 45 * 60 * 1000))
        
        transformedHorarios.push({
          id: `${horario.idHorario}-${i}`,
          grado: horario.gradoSeccion?.grado?.nombre || '',
          seccion: horario.gradoSeccion?.seccion?.nombre || '',
          diaSemana: nombreDia,
          horaInicio: inicioBloque.toTimeString().slice(0, 5),
          horaFin: finBloque.toTimeString().slice(0, 5),
          materia: materias[i],
          docenteId: '',
          docente: {
            nombre: 'Por asignar',
            apellido: '',
            especialidad: materias[i]
          },
          aula: `${horario.gradoSeccion?.grado?.nombre || ''}° ${horario.gradoSeccion?.seccion?.nombre || ''}`,
          sesion: horario.sesiones?.toString() || 'AM',
          activo: true
        })
      }
    })

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
          nivel: {
            idIe: parseInt(ieId)
          }
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

    const horarioCreado = await prisma.horarioClase.create({
      data: {
        idGradoSeccion: gradoSeccion.idGradoSeccion,
        diaSemana: parseInt(diaSemana),
        horaInicio: new Date(`1970-01-01T${horaInicio}:00`),
        horaFin: new Date(`1970-01-01T${horaFin}:00`),
        sesiones: sesion
      }
    })

    return NextResponse.json({
      message: 'Horario creado exitosamente',
      id: horarioCreado.idHorarioClase
    })

  } catch (error) {
    console.error('Error creating horario:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
