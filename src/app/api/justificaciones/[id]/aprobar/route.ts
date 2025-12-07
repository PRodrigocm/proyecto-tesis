import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// POST /api/justificaciones/[id]/aprobar - Aprobar justificación
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const params = await context.params
    const id = parseInt(params.id)
    const body = await request.json()
    const { observacionesRevision, aplicarAAsistencias = true } = body

    // Verificar que la justificación existe y está pendiente
    const justificacion = await prisma.justificacion.findUnique({
      where: { idJustificacion: id },
      include: {
        estadoJustificacion: true,
        tipoJustificacion: true,
        estudiante: true
      }
    })

    if (!justificacion) {
      return NextResponse.json(
        { error: 'Justificación no encontrada' },
        { status: 404 }
      )
    }

    if (justificacion.estadoJustificacion.codigo !== 'PENDIENTE' && 
        justificacion.estadoJustificacion.codigo !== 'EN_REVISION') {
      return NextResponse.json(
        { error: 'La justificación no puede ser aprobada en su estado actual' },
        { status: 400 }
      )
    }

    // Obtener el estado APROBADA
    const estadoAprobada = await prisma.estadoJustificacion.findFirst({
      where: { codigo: 'APROBADA' }
    })

    if (!estadoAprobada) {
      return NextResponse.json(
        { error: 'Estado de justificación no configurado' },
        { status: 500 }
      )
    }

    // Iniciar transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Actualizar la justificación
      const justificacionAprobada = await tx.justificacion.update({
        where: { idJustificacion: id },
        data: {
          idEstadoJustificacion: estadoAprobada.idEstadoJustificacion,
          revisadoPor: (decoded as any).idUsuario,
          fechaRevision: new Date(),
          observacionesRevision
        }
      })

      // Si se debe aplicar a asistencias, actualizar los registros de asistencia
      if (aplicarAAsistencias) {
        // Obtener el estado JUSTIFICADA
        const estadoJustificada = await tx.estadoAsistencia.findFirst({
          where: { codigo: 'JUSTIFICADA' }
        })

        if (estadoJustificada) {
          // Buscar asistencias en el rango de fechas que estén marcadas como INASISTENCIA
          const estadoInasistencia = await tx.estadoAsistencia.findFirst({
            where: { codigo: 'INASISTENCIA' }
          })

          if (estadoInasistencia) {
            // Actualizar asistencias en el rango de fechas
            const asistenciasActualizadas = await tx.asistencia.updateMany({
              where: {
                idEstudiante: justificacion.idEstudiante,
                fecha: {
                  gte: justificacion.fechaInicio,
                  lte: justificacion.fechaFin
                },
                idEstadoAsistencia: estadoInasistencia.idEstadoAsistencia
              },
              data: {
                idEstadoAsistencia: estadoJustificada.idEstadoAsistencia
              }
            })

            // Crear registros en AsistenciaJustificacion para las asistencias afectadas
            const asistenciasAfectadas = await tx.asistencia.findMany({
              where: {
                idEstudiante: justificacion.idEstudiante,
                fecha: {
                  gte: justificacion.fechaInicio,
                  lte: justificacion.fechaFin
                },
                idEstadoAsistencia: estadoJustificada.idEstadoAsistencia
              }
            })

            // Crear las relaciones
            for (const asistencia of asistenciasAfectadas) {
              await tx.asistenciaJustificacion.upsert({
                where: {
                  idAsistencia_idJustificacion: {
                    idAsistencia: asistencia.idAsistencia,
                    idJustificacion: id
                  }
                },
                update: {
                  aplicadoPor: (decoded as any).idUsuario,
                  fechaAplicacion: new Date()
                },
                create: {
                  idAsistencia: asistencia.idAsistencia,
                  idJustificacion: id,
                  aplicadoPor: (decoded as any).idUsuario
                }
              })
            }
          }
        }
        
        // También actualizar AsistenciaIE (tabla del auxiliar) a JUSTIFICADO
        await tx.asistenciaIE.updateMany({
          where: {
            idEstudiante: justificacion.idEstudiante,
            fecha: {
              gte: justificacion.fechaInicio,
              lte: justificacion.fechaFin
            },
            estado: { in: ['AUSENTE', 'INASISTENCIA'] }
          },
          data: {
            estado: 'JUSTIFICADO'
          }
        })
        console.log('✅ AsistenciaIE actualizada a JUSTIFICADO')
      }

      return justificacionAprobada
    })

    // Obtener la justificación actualizada con todas las relaciones
    const justificacionCompleta = await prisma.justificacion.findUnique({
      where: { idJustificacion: id },
      include: {
        estudiante: {
          include: {
            usuario: true,
            gradoSeccion: {
              include: {
                grado: true,
                seccion: true
              }
            }
          }
        },
        tipoJustificacion: true,
        estadoJustificacion: true,
        usuarioRevisor: true,
        asistenciasAfectadas: {
          include: {
            asistencia: {
              include: {
                estadoAsistencia: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: justificacionCompleta,
      message: 'Justificación aprobada exitosamente'
    })

  } catch (error) {
    console.error('Error aprobando justificación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
