import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET - Obtener todos los estados de asistencia
 */
export async function GET(request: NextRequest) {
  try {
    const estados = await prisma.estadoAsistencia.findMany({
      where: {
        activo: true
      },
      orderBy: {
        nombreEstado: 'asc'
      }
    })

    // Formatear para el frontend
    const estadosFormateados = estados.map(e => ({
      id: e.idEstadoAsistencia.toString(),
      idEstadoAsistencia: e.idEstadoAsistencia,
      nombre: e.nombreEstado,
      codigo: e.codigo,
      afectaAsistencia: e.afectaAsistencia,
      requiereJustificacion: e.requiereJustificacion
    }))

    return NextResponse.json({
      estados: estadosFormateados,
      data: estadosFormateados,
      total: estadosFormateados.length
    })

  } catch (error) {
    console.error('Error fetching estados asistencia:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
