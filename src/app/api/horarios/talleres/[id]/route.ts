import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const horarioId = parseInt(params.id)
    if (isNaN(horarioId)) {
      return NextResponse.json(
        { error: 'ID de horario inválido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { diaSemana, horaInicio, horaFin, lugar, toleranciaMin, activo } = body

    // Verificar que el horario existe
    const horarioExistente = await prisma.horarioTaller.findUnique({
      where: { idHorarioTaller: horarioId },
      include: { taller: true }
    })

    if (!horarioExistente) {
      return NextResponse.json(
        { error: 'Horario no encontrado' },
        { status: 404 }
      )
    }

    // Preparar datos para actualizar
    const updateData: any = {}

    if (diaSemana !== undefined) {
      if (diaSemana < 1 || diaSemana > 7) {
        return NextResponse.json(
          { error: 'Día de la semana debe estar entre 1 (Lunes) y 7 (Domingo)' },
          { status: 400 }
        )
      }
      updateData.diaSemana = parseInt(diaSemana)
    }

    if (horaInicio !== undefined) {
      updateData.horaInicio = new Date(`1970-01-01T${horaInicio}:00.000Z`)
    }

    if (horaFin !== undefined) {
      updateData.horaFin = new Date(`1970-01-01T${horaFin}:00.000Z`)
    }

    if (lugar !== undefined) {
      updateData.lugar = lugar
    }

    if (toleranciaMin !== undefined) {
      updateData.toleranciaMin = parseInt(toleranciaMin)
    }

    if (activo !== undefined) {
      updateData.activo = Boolean(activo)
    }

    // Si se están actualizando horarios, verificar conflictos
    if (diaSemana !== undefined || horaInicio !== undefined || horaFin !== undefined) {
      const nuevoDiaSemana = diaSemana !== undefined ? parseInt(diaSemana) : horarioExistente.diaSemana
      const nuevaHoraInicio = horaInicio !== undefined ? horaInicio : horarioExistente.horaInicio.toISOString().split('T')[1].substring(0, 5)
      const nuevaHoraFin = horaFin !== undefined ? horaFin : horarioExistente.horaFin.toISOString().split('T')[1].substring(0, 5)

      const conflicto = await prisma.horarioTaller.findFirst({
        where: {
          idTaller: horarioExistente.idTaller,
          diaSemana: nuevoDiaSemana,
          idHorarioTaller: { not: horarioId }, // Excluir el horario actual
          OR: [
            {
              AND: [
                { horaInicio: { lte: new Date(`1970-01-01T${nuevaHoraInicio}:00.000Z`) } },
                { horaFin: { gt: new Date(`1970-01-01T${nuevaHoraInicio}:00.000Z`) } }
              ]
            },
            {
              AND: [
                { horaInicio: { lt: new Date(`1970-01-01T${nuevaHoraFin}:00.000Z`) } },
                { horaFin: { gte: new Date(`1970-01-01T${nuevaHoraFin}:00.000Z`) } }
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
    }

    // Actualizar el horario
    const horarioActualizado = await prisma.horarioTaller.update({
      where: { idHorarioTaller: horarioId },
      data: updateData,
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
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Horario actualizado exitosamente',
      horario: {
        id: horarioActualizado.idHorarioTaller.toString(),
        idTaller: horarioActualizado.idTaller,
        taller: {
          id: horarioActualizado.taller.idTaller,
          nombre: horarioActualizado.taller.nombre,
          instructor: horarioActualizado.taller.instructor
        },
        diaSemana: horarioActualizado.diaSemana,
        horaInicio: horarioActualizado.horaInicio.toISOString().split('T')[1].substring(0, 5),
        horaFin: horarioActualizado.horaFin.toISOString().split('T')[1].substring(0, 5),
        lugar: horarioActualizado.lugar,
        toleranciaMin: horarioActualizado.toleranciaMin,
        activo: horarioActualizado.activo,
        inscripciones: horarioActualizado.taller.inscripciones.length
      }
    })

  } catch (error) {
    console.error('Error en PUT /api/horarios/talleres/[id]:', error)
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const horarioId = parseInt(params.id)
    if (isNaN(horarioId)) {
      return NextResponse.json(
        { error: 'ID de horario inválido' },
        { status: 400 }
      )
    }

    // Verificar que el horario existe
    const horarioExistente = await prisma.horarioTaller.findUnique({
      where: { idHorarioTaller: horarioId }
    })

    if (!horarioExistente) {
      return NextResponse.json(
        { error: 'Horario no encontrado' },
        { status: 404 }
      )
    }

    // En lugar de eliminar físicamente, marcar como inactivo
    await prisma.horarioTaller.update({
      where: { idHorarioTaller: horarioId },
      data: { activo: false }
    })

    return NextResponse.json({
      success: true,
      message: 'Horario desactivado exitosamente'
    })

  } catch (error) {
    console.error('Error en DELETE /api/horarios/talleres/[id]:', error)
    
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
