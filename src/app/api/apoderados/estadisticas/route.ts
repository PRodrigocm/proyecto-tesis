import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { getEstudiantesDelApoderado, getEstadosRetiroIds, inicializarEstadosRetiro } from '@/lib/retiros-utils'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    if (decoded.rol !== 'APODERADO') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Inicializar estados de retiro si no existen
    await inicializarEstadosRetiro()

    // Obtener estudiantes del apoderado
    const estudianteIds = await getEstudiantesDelApoderado(decoded.userId)
    const totalEstudiantes = estudianteIds.length

    // Si no hay estudiantes, retornar estadísticas vacías
    let retirosPendientes = 0
    if (estudianteIds.length > 0) {
      // Obtener los IDs de estados pendientes
      const estadosPendientesIds = await getEstadosRetiroIds(['SOLICITADO', 'EN_REVISION'])

      // Obtener retiros pendientes
      retirosPendientes = await prisma.retiro.count({
        where: {
          idEstudiante: {
            in: estudianteIds
          },
          idEstadoRetiro: {
            in: estadosPendientesIds
          }
        }
      })
    }

    // Obtener justificaciones pendientes (simulado por ahora)
    // TODO: Implementar tabla de justificaciones
    const justificacionesPendientes = 0

    // Calcular asistencia promedio (simulado por ahora)
    // TODO: Implementar cálculo real basado en asistencias
    const asistenciaPromedio = 85.5

    const estadisticas = {
      totalEstudiantes,
      retirosPendientes,
      justificacionesPendientes,
      asistenciaPromedio
    }

    return NextResponse.json({
      success: true,
      estadisticas
    })

  } catch (error) {
    console.error('Error fetching estadísticas del apoderado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
