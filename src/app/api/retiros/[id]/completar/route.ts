import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const retiroId = parseInt(params.id)

    if (isNaN(retiroId)) {
      return NextResponse.json(
        { error: 'ID de retiro inválido' },
        { status: 400 }
      )
    }

    // Buscar o crear estado completado
    let estadoRetiro = await prisma.estadoRetiro.findFirst({
      where: { codigo: 'COMPLETADO' }
    })

    if (!estadoRetiro) {
      estadoRetiro = await prisma.estadoRetiro.create({
        data: { 
          codigo: 'COMPLETADO',
          nombre: 'Completado',
          orden: 4,
          esFinal: true
        }
      })
    }

    const retiroActualizado = await prisma.retiro.update({
      where: { idRetiro: retiroId },
      data: {
        idEstadoRetiro: estadoRetiro.idEstadoRetiro,
        hora: new Date() // Actualizar hora real de retiro
      }
    })

    return NextResponse.json({
      message: 'Retiro completado exitosamente',
      data: retiroActualizado
    })

  } catch (error) {
    console.error('Error completing retiro:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
