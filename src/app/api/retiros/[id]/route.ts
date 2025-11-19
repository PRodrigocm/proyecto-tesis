import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

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

// PUT - Modificar retiro
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const params = await context.params
    const retiroId = parseInt(params.id)
    const body = await request.json()
    const {
      fecha,
      horaRetiro,
      motivo,
      observaciones,
      personaRecoge,
      dniPersonaRecoge,
      idEstadoRetiro
    } = body

    // Verificar que el retiro existe
    const retiroExistente = await prisma.retiro.findUnique({
      where: { idRetiro: retiroId },
      include: {
        estadoRetiro: true
      }
    })

    if (!retiroExistente) {
      return NextResponse.json({ 
        error: 'Retiro no encontrado' 
      }, { status: 404 })
    }

    // Verificar que el retiro no esté en estado final
    if (retiroExistente.estadoRetiro?.esFinal) {
      return NextResponse.json({ 
        error: 'No se puede modificar un retiro en estado final' 
      }, { status: 400 })
    }

    // Buscar o crear tipo de retiro si se cambió
    let tipoRetiroId = retiroExistente.idTipoRetiro
    if (motivo) {
      let tipoRetiro = await prisma.tipoRetiro.findFirst({
        where: { nombre: motivo }
      })

      if (!tipoRetiro) {
        tipoRetiro = await prisma.tipoRetiro.create({
          data: { nombre: motivo }
        })
      }
      tipoRetiroId = tipoRetiro.idTipoRetiro
    }

    // Preparar datos para actualizar
    const dataToUpdate: any = {
      updatedAt: new Date()
    }

    if (fecha) dataToUpdate.fecha = new Date(fecha)
    if (horaRetiro) dataToUpdate.hora = new Date(`1970-01-01T${horaRetiro}:00.000Z`)
    if (tipoRetiroId) dataToUpdate.idTipoRetiro = tipoRetiroId
    if (dniPersonaRecoge !== undefined) dataToUpdate.dniVerificado = dniPersonaRecoge
    if (idEstadoRetiro) dataToUpdate.idEstadoRetiro = parseInt(idEstadoRetiro)
    
    // Manejar observaciones y personaRecoge
    let observacionesFinales = observaciones || ''
    if (personaRecoge) {
      // Si hay persona que recoge, agregarla a las observaciones
      if (observacionesFinales && !observacionesFinales.includes('Persona que recoge:')) {
        observacionesFinales += ` | Persona que recoge: ${personaRecoge}`
      } else if (!observacionesFinales) {
        observacionesFinales = `Persona que recoge: ${personaRecoge}`
      } else {
        // Reemplazar persona que recoge existente
        observacionesFinales = observacionesFinales.replace(/\s*\|\s*Persona que recoge: [^|]+/, '')
        observacionesFinales += ` | Persona que recoge: ${personaRecoge}`
      }
    }
    if (observacionesFinales !== undefined) dataToUpdate.observaciones = observacionesFinales

    // Actualizar el retiro
    const retiroActualizado = await prisma.retiro.update({
      where: { idRetiro: retiroId },
      data: dataToUpdate,
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
        tipoRetiro: true,
        estadoRetiro: true,
        apoderadoRetira: {
          include: {
            usuario: true
          }
        },
        usuarioVerificador: {
          select: {
            nombre: true,
            apellido: true
          }
        }
      }
    })

    console.log(`✅ Retiro modificado por ${user.email}:`, {
      retiroId: retiroActualizado.idRetiro,
      estudiante: `${retiroActualizado.estudiante.usuario.nombre} ${retiroActualizado.estudiante.usuario.apellido}`,
      cambios: Object.keys(dataToUpdate)
    })

    return NextResponse.json({
      success: true,
      message: 'Retiro actualizado exitosamente',
      data: {
        id: retiroActualizado.idRetiro.toString(),
        fecha: retiroActualizado.fecha.toISOString(),
        horaRetiro: retiroActualizado.hora.toTimeString().slice(0, 5),
        motivo: retiroActualizado.tipoRetiro?.nombre || 'Retiro',
        observaciones: retiroActualizado.observaciones || '',
        personaRecoge: retiroActualizado.apoderadoRetira?.usuario ? 
          `${retiroActualizado.apoderadoRetira.usuario.nombre} ${retiroActualizado.apoderadoRetira.usuario.apellido}` : 
          (() => {
            const observaciones = retiroActualizado.observaciones || ''
            const personaRecogeMatch = observaciones.match(/Persona que recoge: ([^|]+)/)
            return personaRecogeMatch ? personaRecogeMatch[1].trim() : ''
          })(),
        dniPersonaRecoge: retiroActualizado.dniVerificado || '',
        estado: retiroActualizado.estadoRetiro?.nombre || 'PENDIENTE',
        idEstadoRetiro: retiroActualizado.idEstadoRetiro,
        estudiante: {
          id: retiroActualizado.estudiante.idEstudiante.toString(),
          nombre: retiroActualizado.estudiante.usuario.nombre,
          apellido: retiroActualizado.estudiante.usuario.apellido,
          dni: retiroActualizado.estudiante.usuario.dni,
          grado: retiroActualizado.estudiante.gradoSeccion?.grado?.nombre || '',
          seccion: retiroActualizado.estudiante.gradoSeccion?.seccion?.nombre || ''
        }
      }
    })

  } catch (error) {
    console.error('Error updating retiro:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

// DELETE - Eliminar retiro
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const params = await context.params
    const retiroId = parseInt(params.id)

    // Verificar que el retiro existe
    const retiroExistente = await prisma.retiro.findUnique({
      where: { idRetiro: retiroId },
      include: {
        estudiante: {
          include: {
            usuario: true
          }
        },
        estadoRetiro: true
      }
    })

    if (!retiroExistente) {
      return NextResponse.json({ 
        error: 'Retiro no encontrado' 
      }, { status: 404 })
    }

    // Verificar que el retiro no esté autorizado o en estado final
    if (retiroExistente.estadoRetiro?.codigo === 'AUTORIZADO' || retiroExistente.estadoRetiro?.esFinal) {
      return NextResponse.json({ 
        error: 'No se puede eliminar un retiro autorizado o en estado final' 
      }, { status: 400 })
    }

    // Eliminar el retiro
    await prisma.retiro.delete({
      where: { idRetiro: retiroId }
    })

    console.log(`🗑️ Retiro eliminado por ${user.email}:`, {
      retiroId,
      estudiante: `${retiroExistente.estudiante.usuario.nombre} ${retiroExistente.estudiante.usuario.apellido}`,
      estado: retiroExistente.estadoRetiro?.nombre
    })

    return NextResponse.json({
      success: true,
      message: 'Retiro eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error deleting retiro:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
