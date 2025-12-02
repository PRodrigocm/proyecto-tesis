import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { notificarInasistencia } from '@/lib/notifications'

/**
 * GET - Obtener detalle de una asistencia
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }

    const asistencia = await prisma.asistenciaIE.findUnique({
      where: { idAsistenciaIE: id },
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
        }
      }
    })

    if (!asistencia) {
      return NextResponse.json(
        { error: 'Asistencia no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: asistencia
    })

  } catch (error) {
    console.error('Error obteniendo asistencia:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Editar asistencia manualmente (para docentes)
 * Permite justificar faltas o corregir errores
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const id = parseInt(params.id)
    const body = await request.json()

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }

    // Obtener usuario del token
    let userId = 1
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
        userId = decoded.userId || 1
      } catch {
        console.log('Token inválido')
      }
    }

    const { estado, observaciones, justificacion } = body

    // Verificar que existe la asistencia
    const asistenciaExistente = await prisma.asistenciaIE.findUnique({
      where: { idAsistenciaIE: id }
    })

    if (!asistenciaExistente) {
      return NextResponse.json(
        { error: 'Asistencia no encontrada' },
        { status: 404 }
      )
    }

    // Actualizar asistencia
    const updateData: any = {}
    
    if (estado) {
      updateData.estado = estado
    }

    const asistenciaActualizada = await prisma.asistenciaIE.update({
      where: { idAsistenciaIE: id },
      data: updateData,
      include: {
        estudiante: {
          include: {
            usuario: true
          }
        }
      }
    })

    // Si hay justificación, crear registro de justificación
    if (justificacion && observaciones) {
      // Buscar o crear tipo de justificación
      let tipoJustificacion = await prisma.tipoJustificacion.findFirst({
        where: { codigo: justificacion }
      })

      if (!tipoJustificacion) {
        tipoJustificacion = await prisma.tipoJustificacion.create({
          data: {
            nombre: justificacion,
            codigo: justificacion.toUpperCase().replace(/\s+/g, '_')
          }
        })
      }

      // Buscar estado de justificación APROBADA
      let estadoJustificacion = await prisma.estadoJustificacion.findFirst({
        where: { codigo: 'APROBADA' }
      })

      if (!estadoJustificacion) {
        estadoJustificacion = await prisma.estadoJustificacion.create({
          data: {
            nombre: 'Aprobada',
            codigo: 'APROBADA'
          }
        })
      }

      // Crear justificación
      await prisma.justificacion.create({
        data: {
          idEstudiante: asistenciaExistente.idEstudiante,
          idIe: asistenciaExistente.idIe,
          idTipoJustificacion: tipoJustificacion.idTipoJustificacion,
          idEstadoJustificacion: estadoJustificacion.idEstadoJustificacion,
          fechaInicio: asistenciaExistente.fecha,
          fechaFin: asistenciaExistente.fecha,
          motivo: observaciones,
          presentadoPor: userId,
          revisadoPor: userId,
          fechaRevision: new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Asistencia actualizada correctamente',
      data: asistenciaActualizada
    })

  } catch (error) {
    console.error('Error actualizando asistencia:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * POST - Crear asistencia manual (para marcar ausencias o registros tardíos)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const estudianteId = parseInt(params.id)
    const body = await request.json()

    if (isNaN(estudianteId)) {
      return NextResponse.json(
        { error: 'ID de estudiante inválido' },
        { status: 400 }
      )
    }

    // Obtener usuario del token
    let userId = 1
    let ieId = 1
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
        userId = decoded.userId || 1
        ieId = decoded.ieId || 1
      } catch {
        console.log('Token inválido')
      }
    }

    const { fecha, estado, observaciones } = body

    const fechaAsistencia = fecha ? new Date(fecha) : new Date()
    fechaAsistencia.setHours(0, 0, 0, 0)

    // Verificar si ya existe asistencia para ese día
    const asistenciaExistente = await prisma.asistenciaIE.findFirst({
      where: {
        idEstudiante: estudianteId,
        fecha: fechaAsistencia
      }
    })

    if (asistenciaExistente) {
      return NextResponse.json(
        { error: 'Ya existe un registro de asistencia para este estudiante en esta fecha' },
        { status: 400 }
      )
    }

    // Crear registro de asistencia
    const nuevaAsistencia = await prisma.asistenciaIE.create({
      data: {
        idEstudiante: estudianteId,
        idIe: ieId,
        fecha: fechaAsistencia,
        estado: estado || 'AUSENTE',
        registradoIngresoPor: userId
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
        }
      }
    })

    // Si es AUSENTE, notificar al apoderado
    const estadoFinal = estado || 'AUSENTE'
    if (estadoFinal === 'AUSENTE' || estadoFinal === 'FALTA') {
      try {
        console.log(`📧 Buscando apoderado para notificar inasistencia del estudiante ID: ${estudianteId}`)
        
        const apoderado = await prisma.apoderado.findFirst({
          where: {
            estudiantes: {
              some: {
                idEstudiante: estudianteId
              }
            }
          },
          include: {
            usuario: true
          }
        })

        if (apoderado && apoderado.usuario.email) {
          console.log(`📧 Enviando notificación de inasistencia al apoderado: ${apoderado.usuario.email}`)
          
          await notificarInasistencia({
            estudianteId: estudianteId,
            estudianteNombre: nuevaAsistencia.estudiante?.usuario?.nombre || '',
            estudianteApellido: nuevaAsistencia.estudiante?.usuario?.apellido || '',
            estudianteDNI: nuevaAsistencia.estudiante?.usuario?.dni || '',
            grado: nuevaAsistencia.estudiante?.gradoSeccion?.grado?.nombre || '',
            seccion: nuevaAsistencia.estudiante?.gradoSeccion?.seccion?.nombre || '',
            fecha: fechaAsistencia.toISOString(),
            emailApoderado: apoderado.usuario.email,
            telefonoApoderado: apoderado.usuario.telefono || '',
            apoderadoUsuarioId: apoderado.idUsuario
          })
        } else {
          console.log(`⚠️ No se encontró apoderado con email para el estudiante ID: ${estudianteId}`)
        }
      } catch (notifError) {
        console.error(`⚠️ Error al enviar notificación de inasistencia (no crítico):`, notifError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Asistencia registrada correctamente',
      data: nuevaAsistencia
    })

  } catch (error) {
    console.error('Error creando asistencia:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: String(error) },
      { status: 500 }
    )
  }
}
