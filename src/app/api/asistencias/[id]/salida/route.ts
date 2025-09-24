import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const asistenciaId = parseInt(params.id)

    if (isNaN(asistenciaId)) {
      return NextResponse.json(
        { error: 'ID de asistencia inválido' },
        { status: 400 }
      )
    }

    const asistenciaActualizada = await prisma.asistencia.update({
      where: { idAsistencia: asistenciaId },
      data: {
        horaSalida: new Date()
      }
    })

    return NextResponse.json({
      message: 'Salida registrada exitosamente',
      data: asistenciaActualizada
    })

  } catch (error) {
    console.error('Error registering salida:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
