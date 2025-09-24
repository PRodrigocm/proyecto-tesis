import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const horarioId = parseInt(params.id)
    const body = await request.json()

    if (isNaN(horarioId)) {
      return NextResponse.json(
        { error: 'ID de horario inválido' },
        { status: 400 }
      )
    }

    const horarioActualizado = await prisma.horarioGradoSeccion.update({
      where: { idHorario: horarioId },
      data: {
        ...(body.diaSemana && { diaSemana: parseInt(body.diaSemana) }),
        ...(body.horaInicio && { horaEntrada: new Date(`1970-01-01T${body.horaInicio}:00`) }),
        ...(body.horaFin && { horaSalida: new Date(`1970-01-01T${body.horaFin}:00`) }),
        ...(body.sesion && { sesiones: body.sesion })
      }
    })

    return NextResponse.json({
      message: 'Horario actualizado exitosamente',
      data: horarioActualizado
    })

  } catch (error) {
    console.error('Error updating horario:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { params } = context
    const horarioId = parseInt(params.id)

    if (isNaN(horarioId)) {
      return NextResponse.json(
        { error: 'ID de horario inválido' },
        { status: 400 }
      )
    }

    await prisma.horarioGradoSeccion.delete({
      where: { idHorario: horarioId }
    })

    return NextResponse.json({
      message: 'Horario eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error deleting horario:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
