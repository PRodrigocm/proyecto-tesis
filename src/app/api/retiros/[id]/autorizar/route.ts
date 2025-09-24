import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const retiroId = parseInt(params.id)
    const body = await request.json()
    const { autorizado, observaciones } = body

    if (isNaN(retiroId)) {
      return NextResponse.json(
        { error: 'ID de retiro inválido' },
        { status: 400 }
      )
    }

    // Obtener usuario del token (simplificado)
    const autorizadoPorId = 1 // En producción obtener del JWT

    // Buscar o crear estado correspondiente
    const codigoEstado = autorizado ? 'AUTORIZADO' : 'RECHAZADO'
    let estadoRetiro = await prisma.estadoRetiro.findFirst({
      where: { codigo: codigoEstado }
    })

    if (!estadoRetiro) {
      estadoRetiro = await prisma.estadoRetiro.create({
        data: { 
          codigo: codigoEstado,
          nombre: autorizado ? 'Autorizado' : 'Rechazado',
          orden: autorizado ? 2 : 3
        }
      })
    }

    const retiroActualizado = await prisma.retiro.update({
      where: { idRetiro: retiroId },
      data: {
        idEstadoRetiro: estadoRetiro.idEstadoRetiro,
        observaciones: observaciones,
        verificadoPor: autorizadoPorId
      }
    })

    return NextResponse.json({
      message: `Retiro ${autorizado ? 'autorizado' : 'rechazado'} exitosamente`,
      data: retiroActualizado
    })

  } catch (error) {
    console.error('Error authorizing retiro:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
