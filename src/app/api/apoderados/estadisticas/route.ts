import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { getEstudiantesDelApoderado, getEstadosRetiroIds, inicializarEstadosRetiro } from '@/lib/retiros-utils'

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

    // Obtener justificaciones pendientes (inasistencias sin justificar)
    let justificacionesPendientes = 0
    if (estudianteIds.length > 0) {
      // Buscar el estado "AUSENTE" o "INASISTENCIA"
      const estadoAusente = await prisma.estadoAsistencia.findFirst({
        where: {
          OR: [
            { codigo: 'AUSENTE' },
            { codigo: 'INASISTENCIA' }
          ]
        }
      })

      if (estadoAusente) {
        // Contar inasistencias sin justificación
        const inasistencias = await prisma.asistencia.findMany({
          where: {
            idEstudiante: {
              in: estudianteIds
            },
            idEstadoAsistencia: estadoAusente.idEstadoAsistencia
          },
          include: {
            justificacionesAfectadas: true
          }
        })

        // Filtrar las que no tienen justificación
        justificacionesPendientes = inasistencias.filter(
          asist => asist.justificacionesAfectadas.length === 0
        ).length
      }
    }

    // Calcular asistencia promedio real
    let asistenciaPromedio = 0
    if (estudianteIds.length > 0) {
      // Obtener estados de asistencia positivos (PRESENTE, TARDANZA)
      const estadosPositivos = await prisma.estadoAsistencia.findMany({
        where: {
          OR: [
            { codigo: 'PRESENTE' },
            { codigo: 'TARDANZA' }
          ]
        }
      })

      const estadosPositivosIds = estadosPositivos.map(e => e.idEstadoAsistencia)

      // Contar asistencias totales
      const totalAsistencias = await prisma.asistencia.count({
        where: {
          idEstudiante: {
            in: estudianteIds
          }
        }
      })

      // Contar asistencias positivas
      const asistenciasPositivas = await prisma.asistencia.count({
        where: {
          idEstudiante: {
            in: estudianteIds
          },
          idEstadoAsistencia: {
            in: estadosPositivosIds
          }
        }
      })

      // Calcular porcentaje
      if (totalAsistencias > 0) {
        asistenciaPromedio = Math.round((asistenciasPositivas / totalAsistencias) * 100 * 10) / 10
      }
    }

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
  }
}
