import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

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

    // Obtener estudiantes del apoderado
    const estudiantesApoderado = await prisma.estudianteApoderado.findMany({
      where: {
        idApoderado: decoded.userId
      },
      include: {
        estudiante: true
      }
    })

    const estudianteIds = estudiantesApoderado.map(ea => ea.estudiante.idEstudiante)
    const totalEstudiantes = estudianteIds.length

    // Obtener retiros pendientes
    const retirosPendientes = await prisma.retiro.count({
      where: {
        idEstudiante: {
          in: estudianteIds
        },
        estado: {
          in: ['SOLICITADO', 'EN_REVISION']
        }
      }
    })

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
