import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// PUT /api/justificaciones/[id]/revisar - Aprobar o rechazar justificación
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const justificacionId = parseInt(id)

    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Verificar que sea docente o administrador
    if (!['DOCENTE', 'ADMINISTRATIVO'].includes(decoded.rol)) {
      return NextResponse.json({ error: 'No tienes permisos para revisar justificaciones' }, { status: 403 })
    }

    const body = await request.json()
    const { accion, observacionesRevision } = body

    // Validar acción
    if (!['APROBAR', 'RECHAZAR'].includes(accion)) {
      return NextResponse.json({ error: 'Acción inválida. Debe ser APROBAR o RECHAZAR' }, { status: 400 })
    }

    console.log(`📋 Revisando justificación ${justificacionId}: ${accion}`)

    // Verificar que la justificación existe y está pendiente
    const justificacionExistente = await prisma.justificacion.findUnique({
      where: { idJustificacion: justificacionId },
      include: {
        estadoJustificacion: true,
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
        tipoJustificacion: true
      }
    })

    if (!justificacionExistente) {
      return NextResponse.json({ error: 'Justificación no encontrada' }, { status: 404 })
    }

    // Permitir revisar justificaciones en estado PENDIENTE o EN_REVISION
    const estadosRevisables = ['PENDIENTE', 'EN_REVISION']
    if (!estadosRevisables.includes(justificacionExistente.estadoJustificacion.codigo)) {
      return NextResponse.json({ 
        error: `La justificación ya fue ${justificacionExistente.estadoJustificacion.nombre.toLowerCase()}` 
      }, { status: 400 })
    }

    // Obtener el nuevo estado
    const codigoNuevoEstado = accion === 'APROBAR' ? 'APROBADA' : 'RECHAZADA'
    const nuevoEstado = await prisma.estadoJustificacion.findFirst({
      where: { codigo: codigoNuevoEstado }
    })

    if (!nuevoEstado) {
      return NextResponse.json({ 
        error: `Estado ${codigoNuevoEstado} no configurado en el sistema` 
      }, { status: 500 })
    }

    // Actualizar la justificación
    const justificacionActualizada = await prisma.justificacion.update({
      where: { idJustificacion: justificacionId },
      data: {
        idEstadoJustificacion: nuevoEstado.idEstadoJustificacion,
        revisadoPor: decoded.idUsuario,
        fechaRevision: new Date(),
        observacionesRevision: observacionesRevision || null
      },
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
        usuarioRevisor: {
          select: {
            nombre: true,
            apellido: true
          }
        },
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

    // Si se aprobó la justificación, actualizar las asistencias relacionadas
    if (accion === 'APROBAR') {
      console.log('✅ Justificación aprobada, actualizando asistencias...')
      
      // Buscar asistencias en el rango de fechas que necesiten justificación
      const asistenciasPorJustificar = await prisma.asistencia.findMany({
        where: {
          idEstudiante: justificacionExistente.idEstudiante,
          fecha: {
            gte: justificacionExistente.fechaInicio,
            lte: justificacionExistente.fechaFin
          },
          estadoAsistencia: {
            requiereJustificacion: true
          }
        }
      })

      console.log(`📊 Encontradas ${asistenciasPorJustificar.length} asistencias para justificar`)

      // Obtener el estado "JUSTIFICADA"
      const estadoJustificada = await prisma.estadoAsistencia.findFirst({
        where: { codigo: 'JUSTIFICADA' }
      })

      if (estadoJustificada && asistenciasPorJustificar.length > 0) {
        // Actualizar las asistencias a estado JUSTIFICADA
        await prisma.asistencia.updateMany({
          where: {
            idAsistencia: {
              in: asistenciasPorJustificar.map(a => a.idAsistencia)
            }
          },
          data: {
            idEstadoAsistencia: estadoJustificada.idEstadoAsistencia
          }
        })

        // Verificar cuáles registros ya existen en AsistenciaJustificacion
        const existentes = await prisma.asistenciaJustificacion.findMany({
          where: {
            idJustificacion: justificacionId,
            idAsistencia: {
              in: asistenciasPorJustificar.map(a => a.idAsistencia)
            }
          },
          select: { idAsistencia: true }
        })

        const idsExistentes = new Set(existentes.map(e => e.idAsistencia))
        const asistenciasNuevas = asistenciasPorJustificar.filter(
          a => !idsExistentes.has(a.idAsistencia)
        )

        // Crear solo los registros que no existen
        if (asistenciasNuevas.length > 0) {
          await prisma.asistenciaJustificacion.createMany({
            data: asistenciasNuevas.map(asistencia => ({
              idAsistencia: asistencia.idAsistencia,
              idJustificacion: justificacionId,
              aplicadoPor: decoded.idUsuario
            })),
            skipDuplicates: true
          })
        }

        console.log(`✅ ${asistenciasPorJustificar.length} asistencias actualizadas a JUSTIFICADA (${asistenciasNuevas.length} nuevos registros)`)
      }
    }

    console.log(`✅ Justificación ${accion === 'APROBAR' ? 'aprobada' : 'rechazada'} exitosamente`)

    return NextResponse.json({
      success: true,
      data: justificacionActualizada,
      message: `Justificación ${accion === 'APROBAR' ? 'aprobada' : 'rechazada'} exitosamente`
    })

  } catch (error) {
    console.error('❌ Error al revisar justificación:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
