import { NextRequest, NextResponse } from 'next/server'
import { procesarFaltasAutomaticas } from '@/lib/auto-attendance'
import { prisma } from '@/lib/prisma'

/**
 * API para marcar faltas automáticas a estudiantes sin asistencia
 * Se ejecuta automáticamente después del horario de cierre de ingreso
 * 
 * El proceso es completamente automático:
 * - PRESENTE: Se marca cuando el estudiante escanea QR antes del cierre
 * - TARDANZA: Se marca cuando el estudiante escanea QR después del cierre
 * - FALTA: Se marca automáticamente si no hay registro de asistencia
 */

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Ejecutando proceso automático de faltas...')
    
    const body = await request.json().catch(() => ({}))
    const { ieId } = body

    // Ejecutar proceso automático
    const resultado = await procesarFaltasAutomaticas(ieId ? parseInt(ieId) : undefined)

    return NextResponse.json({
      success: true,
      mensaje: 'Proceso automático completado',
      resumen: {
        totalFaltasMarcadas: resultado.faltasMarcadas,
        totalNotificacionesEnviadas: resultado.notificacionesEnviadas
      },
      fecha: resultado.fecha
    })

  } catch (error) {
    console.error('❌ Error en proceso de faltas automáticas:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

/**
 * GET: Verificar estado del proceso y obtener estadísticas
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const fecha = url.searchParams.get('fecha')
    const ieId = url.searchParams.get('ieId')

    const fechaConsulta = fecha ? new Date(fecha) : new Date()
    fechaConsulta.setHours(0, 0, 0, 0)

    // Contar inasistencias del día
    const inasistencias = await prisma.asistenciaIE.count({
      where: {
        fecha: {
          gte: fechaConsulta,
          lt: new Date(fechaConsulta.getTime() + 24 * 60 * 60 * 1000)
        },
        estado: 'INASISTENCIA',
        ...(ieId ? {
          estudiante: {
            usuario: {
              idIe: parseInt(ieId)
            }
          }
        } : {})
      }
    })

    // Contar estudiantes sin registro
    const totalEstudiantes = await prisma.estudiante.count({
      where: {
        usuario: {
          estado: 'ACTIVO',
          ...(ieId ? { idIe: parseInt(ieId) } : {})
        }
      }
    })

    const conAsistencia = await prisma.asistenciaIE.count({
      where: {
        fecha: {
          gte: fechaConsulta,
          lt: new Date(fechaConsulta.getTime() + 24 * 60 * 60 * 1000)
        },
        ...(ieId ? {
          estudiante: {
            usuario: {
              idIe: parseInt(ieId)
            }
          }
        } : {})
      }
    })

    return NextResponse.json({
      success: true,
      fecha: fechaConsulta.toISOString().split('T')[0],
      estadisticas: {
        totalEstudiantes,
        conAsistencia,
        sinAsistencia: totalEstudiantes - conAsistencia,
        inasistenciasMarcadas: inasistencias
      }
    })

  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error)
    return NextResponse.json({
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
