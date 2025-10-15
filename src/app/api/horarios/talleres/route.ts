import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    // Obtener horarios de talleres con información completa
    const horarios = await prisma.horarioTaller.findMany({
      include: {
        taller: {
          include: {
            inscripciones: {
              where: {
                estado: 'activa',
                anio: new Date().getFullYear()
              }
            }
          }
        }
      },
      orderBy: [
        { diaSemana: 'asc' },
        { horaInicio: 'asc' }
      ]
    })

    // Formatear los datos para el frontend
    const horariosFormateados = horarios.map(horario => ({
      id: horario.idHorarioTaller.toString(),
      idTaller: horario.idTaller,
      taller: {
        id: horario.taller.idTaller,
        nombre: horario.taller.nombre,
        instructor: horario.taller.instructor,
        descripcion: horario.taller.descripcion,
        capacidadMaxima: horario.taller.capacidadMaxima,
        activo: horario.taller.activo
      },
      diaSemana: horario.diaSemana,
      horaInicio: horario.horaInicio.toISOString().split('T')[1].substring(0, 5), // HH:MM
      horaFin: horario.horaFin.toISOString().split('T')[1].substring(0, 5), // HH:MM
      toleranciaMin: horario.toleranciaMin,
      lugar: horario.lugar,
      activo: horario.activo,
      inscripciones: horario.taller.inscripciones.length
    }))

    return NextResponse.json({
      success: true,
      horarios: horariosFormateados
    })

  } catch (error) {
    console.error('Error en GET /api/horarios/talleres:', error)
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    const body = await request.json()
    const { idTaller, diaSemana, horaInicio, horaFin, lugar, toleranciaMin } = body

    // Validaciones
    if (!idTaller || !diaSemana || !horaInicio || !horaFin) {
      return NextResponse.json(
        { error: 'Taller, día de la semana, hora de inicio y hora de fin son requeridos' },
        { status: 400 }
      )
    }

    if (diaSemana < 1 || diaSemana > 7) {
      return NextResponse.json(
        { error: 'Día de la semana debe estar entre 1 (Lunes) y 7 (Domingo)' },
        { status: 400 }
      )
    }

    // Verificar que el taller existe
    const taller = await prisma.taller.findUnique({
      where: { idTaller: parseInt(idTaller) }
    })

    if (!taller) {
      return NextResponse.json(
        { error: 'Taller no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que no haya conflicto de horarios
    const conflicto = await prisma.horarioTaller.findFirst({
      where: {
        idTaller: parseInt(idTaller),
        diaSemana: parseInt(diaSemana),
        OR: [
          {
            AND: [
              { horaInicio: { lte: new Date(`1970-01-01T${horaInicio}:00.000Z`) } },
              { horaFin: { gt: new Date(`1970-01-01T${horaInicio}:00.000Z`) } }
            ]
          },
          {
            AND: [
              { horaInicio: { lt: new Date(`1970-01-01T${horaFin}:00.000Z`) } },
              { horaFin: { gte: new Date(`1970-01-01T${horaFin}:00.000Z`) } }
            ]
          }
        ],
        activo: true
      }
    })

    if (conflicto) {
      return NextResponse.json(
        { error: 'Ya existe un horario que se superpone con el horario propuesto' },
        { status: 400 }
      )
    }

    // Crear el horario
    const nuevoHorario = await prisma.horarioTaller.create({
      data: {
        idTaller: parseInt(idTaller),
        diaSemana: parseInt(diaSemana),
        horaInicio: new Date(`1970-01-01T${horaInicio}:00.000Z`),
        horaFin: new Date(`1970-01-01T${horaFin}:00.000Z`),
        toleranciaMin: toleranciaMin || 10,
        lugar: lugar || null,
        activo: true
      },
      include: {
        taller: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Horario de taller creado exitosamente',
      horario: {
        id: nuevoHorario.idHorarioTaller.toString(),
        idTaller: nuevoHorario.idTaller,
        taller: {
          id: nuevoHorario.taller.idTaller,
          nombre: nuevoHorario.taller.nombre,
          instructor: nuevoHorario.taller.instructor
        },
        diaSemana: nuevoHorario.diaSemana,
        horaInicio: nuevoHorario.horaInicio.toISOString().split('T')[1].substring(0, 5),
        horaFin: nuevoHorario.horaFin.toISOString().split('T')[1].substring(0, 5),
        lugar: nuevoHorario.lugar,
        toleranciaMin: nuevoHorario.toleranciaMin,
        activo: nuevoHorario.activo
      }
    })

  } catch (error) {
    console.error('Error en POST /api/horarios/talleres:', error)
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
