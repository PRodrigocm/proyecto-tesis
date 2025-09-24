import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const eventoId = parseInt(params.id)
    const body = await request.json()

    if (isNaN(eventoId)) {
      return NextResponse.json(
        { error: 'ID de evento inválido' },
        { status: 400 }
      )
    }

    const eventoActualizado = await prisma.calendarioEscolar.update({
      where: { idCal: eventoId },
      data: {
        ...(body.fechaInicio && { fecha: new Date(body.fechaInicio) }),
        ...(body.titulo && { motivo: body.titulo }),
        ...(body.tipo && { esLectivo: body.tipo === 'ACADEMICO' })
      }
    })

    return NextResponse.json({
      message: 'Evento actualizado exitosamente',
      data: eventoActualizado
    })

  } catch (error) {
    console.error('Error updating evento:', error)
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
    const eventoId = parseInt(params.id)

    if (isNaN(eventoId)) {
      return NextResponse.json(
        { error: 'ID de evento inválido' },
        { status: 400 }
      )
    }

    await prisma.calendarioEscolar.delete({
      where: { idCal: eventoId }
    })

    return NextResponse.json({
      message: 'Evento eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error deleting evento:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
