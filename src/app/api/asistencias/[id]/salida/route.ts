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

    // Este endpoint no es aplicable para Asistencia (asistencias de clase)
    // Las asistencias de clase no tienen hora de salida
    return NextResponse.json({
      error: 'Este endpoint no está implementado para asistencias de clase'
    }, { status: 501 })

  } catch (error) {
    console.error('Error registering salida:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
