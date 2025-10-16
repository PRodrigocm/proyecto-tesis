import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

interface JWTPayload {
  userId: number
  email: string
  rol: string
  ieId?: number
}

function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as JWTPayload
    return decoded
  } catch (error) {
    console.error('Error verifying token:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const body = await request.json()
    const { retiroId, accion, observaciones } = body

    if (!retiroId || !accion) {
      return NextResponse.json({ 
        error: 'retiroId y accion son requeridos' 
      }, { status: 400 })
    }

    // Verificar que el retiro existe
    const retiro = await prisma.retiro.findUnique({
      where: { idRetiro: parseInt(retiroId) },
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
        estadoRetiro: true
      }
    })

    if (!retiro) {
      return NextResponse.json({ 
        error: 'Retiro no encontrado' 
      }, { status: 404 })
    }

    // Buscar o crear el estado correspondiente
    let nuevoEstado
    if (accion === 'AUTORIZAR') {
      nuevoEstado = await prisma.estadoRetiro.findFirst({
        where: { codigo: 'AUTORIZADO' }
      })
      
      if (!nuevoEstado) {
        nuevoEstado = await prisma.estadoRetiro.create({
          data: {
            codigo: 'AUTORIZADO',
            nombre: 'Autorizado',
            orden: 2,
            esFinal: false
          }
        })
      }
    } else if (accion === 'RECHAZAR') {
      nuevoEstado = await prisma.estadoRetiro.findFirst({
        where: { codigo: 'RECHAZADO' }
      })
      
      if (!nuevoEstado) {
        nuevoEstado = await prisma.estadoRetiro.create({
          data: {
            codigo: 'RECHAZADO',
            nombre: 'Rechazado',
            orden: 3,
            esFinal: true
          }
        })
      }
    } else {
      return NextResponse.json({ 
        error: 'Acción inválida. Use AUTORIZAR o RECHAZAR' 
      }, { status: 400 })
    }

    // Usar transacción para actualizar retiro y asistencia
    const resultado = await prisma.$transaction(async (tx) => {
      // Actualizar el retiro
      const retiroActualizado = await tx.retiro.update({
        where: { idRetiro: parseInt(retiroId) },
        data: {
          idEstadoRetiro: nuevoEstado.idEstadoRetiro,
          verificadoPor: user.userId,
          observaciones: observaciones || retiro.observaciones,
          updatedAt: new Date()
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
          estadoRetiro: true,
          usuarioVerificador: {
            select: {
              nombre: true,
              apellido: true
            }
          }
        }
      })

      // Si el retiro fue AUTORIZADO, actualizar la asistencia del día
      if (accion === 'AUTORIZAR') {
        console.log('🔄 Retiro autorizado, actualizando asistencia del estudiante...')
        
        // Buscar o crear el estado de asistencia "RETIRADO"
        let estadoRetirado = await tx.estadoAsistencia.findFirst({
          where: { codigo: 'RETIRADO' }
        })
        
        if (!estadoRetirado) {
          estadoRetirado = await tx.estadoAsistencia.create({
            data: {
              codigo: 'RETIRADO',
              nombreEstado: 'Retirado',
              requiereJustificacion: false,
              afectaAsistencia: true,
              activo: true
            }
          })
        }

        // Buscar la asistencia del día del retiro
        const fechaRetiro = new Date(retiro.fecha)
        fechaRetiro.setHours(0, 0, 0, 0)

        const asistenciaExistente = await tx.asistencia.findFirst({
          where: {
            idEstudiante: retiro.idEstudiante,
            fecha: fechaRetiro
          }
        })

        if (asistenciaExistente) {
          // Actualizar asistencia existente
          await tx.asistencia.update({
            where: { idAsistencia: asistenciaExistente.idAsistencia },
            data: {
              idEstadoAsistencia: estadoRetirado.idEstadoAsistencia,
              horaSalida: new Date(`${retiro.fecha.toISOString().split('T')[0]}T${retiro.hora}:00`),
              observaciones: `${asistenciaExistente.observaciones || ''} - RETIRADO: ${retiro.observaciones || 'Retiro autorizado'}`.trim(),
              fuente: 'RETIRO_AUTORIZADO'
            }
          })
          console.log('✅ Asistencia existente actualizada a RETIRADO')
        } else {
          // Crear nueva asistencia marcada como retirado
          await tx.asistencia.create({
            data: {
              idEstudiante: retiro.idEstudiante,
              idIe: retiro.idIe,
              fecha: fechaRetiro,
              horaEntrada: new Date(`${retiro.fecha.toISOString().split('T')[0]}T08:00:00`), // Hora de entrada por defecto
              horaSalida: new Date(`${retiro.fecha.toISOString().split('T')[0]}T${retiro.hora}:00`),
              sesion: 'MAÑANA',
              idEstadoAsistencia: estadoRetirado.idEstadoAsistencia,
              observaciones: `RETIRADO: ${retiro.observaciones || 'Retiro autorizado'}`,
              fuente: 'RETIRO_AUTORIZADO',
              registradoPor: user.userId
            }
          })
          console.log('✅ Nueva asistencia creada marcada como RETIRADO')
        }
      }

      return retiroActualizado
    })

    const retiroActualizado = resultado

    console.log(`✅ Retiro ${accion.toLowerCase()} por ${user.email}:`, {
      retiroId: retiroActualizado.idRetiro,
      estudiante: `${retiroActualizado.estudiante.usuario.nombre} ${retiroActualizado.estudiante.usuario.apellido}`,
      estado: retiroActualizado.estadoRetiro?.nombre,
      verificadoPor: retiroActualizado.usuarioVerificador
    })

    return NextResponse.json({
      success: true,
      message: `Retiro ${accion.toLowerCase()} exitosamente`,
      data: {
        id: retiroActualizado.idRetiro,
        estado: retiroActualizado.estadoRetiro?.nombre,
        autorizadoPor: retiroActualizado.usuarioVerificador,
        fechaAutorizacion: retiroActualizado.updatedAt?.toISOString(),
        observaciones: retiroActualizado.observaciones
      }
    })

  } catch (error) {
    console.error('Error autorizando retiro:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
