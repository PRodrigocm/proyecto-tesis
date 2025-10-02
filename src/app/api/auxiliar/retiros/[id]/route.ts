import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('📋 Obteniendo retiro específico...')

    const { id } = await params

    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    } catch (jwtError) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const userId = decoded.userId
    const userInfo = await prisma.usuario.findUnique({
      where: { idUsuario: userId },
      include: { ie: true }
    })

    if (!userInfo || !['AUXILIAR', 'ADMINISTRATIVO'].includes(decoded.rol)) {
      return NextResponse.json({ error: 'Sin permisos de auxiliar' }, { status: 403 })
    }

    // Obtener el retiro
    const retiro = await prisma.retiro.findUnique({
      where: { idRetiro: parseInt(id) },
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
        apoderadoQueRetira: {
          include: {
            usuario: true
          }
        },
        autorizadoPorUsuario: {
          include: {
            usuario: true
          }
        }
      }
    })

    if (!retiro) {
      return NextResponse.json({ error: 'Retiro no encontrado' }, { status: 404 })
    }

    // Verificar que pertenece a la IE del auxiliar
    if (retiro.estudiante.usuario.idIe !== userInfo.idIe) {
      return NextResponse.json({ error: 'Sin permisos para ver este retiro' }, { status: 403 })
    }

    const retiroTransformado = {
      id: retiro.idRetiro.toString(),
      estudiante: {
        id: retiro.estudiante.idEstudiante,
        nombre: retiro.estudiante.usuario.nombre || '',
        apellido: retiro.estudiante.usuario.apellido || '',
        dni: retiro.estudiante.usuario.dni,
        grado: retiro.estudiante.gradoSeccion?.grado?.nombre || '',
        seccion: retiro.estudiante.gradoSeccion?.seccion?.nombre || ''
      },
      tipoRetiro: {
        id: retiro.tipoRetiro?.idTipoRetiro,
        nombre: retiro.tipoRetiro?.nombre || 'Sin especificar'
      },
      fechaRetiro: retiro.fechaRetiro.toISOString().split('T')[0],
      horaRetiro: retiro.horaRetiro || '',
      motivo: retiro.motivo || '',
      estado: retiro.estado,
      apoderadoQueRetira: retiro.apoderadoQueRetira ? {
        id: retiro.apoderadoQueRetira.idApoderado,
        nombre: `${retiro.apoderadoQueRetira.usuario.nombre} ${retiro.apoderadoQueRetira.usuario.apellido}`
      } : null,
      autorizadoPor: retiro.autorizadoPorUsuario ? {
        id: retiro.autorizadoPorUsuario.idUsuario,
        nombre: `${retiro.autorizadoPorUsuario.usuario.nombre} ${retiro.autorizadoPorUsuario.usuario.apellido}`
      } : null,
      observaciones: retiro.observaciones,
      fechaCreacion: retiro.createdAt?.toISOString(),
      fechaAutorizacion: retiro.fechaAutorizacion?.toISOString()
    }

    return NextResponse.json({
      success: true,
      retiro: retiroTransformado
    })

  } catch (error) {
    console.error('❌ Error al obtener retiro:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('✏️ Actualizando retiro...')

    const { id } = await params

    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    } catch (jwtError) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const userId = decoded.userId
    const userInfo = await prisma.usuario.findUnique({
      where: { idUsuario: userId },
      include: { ie: true }
    })

    if (!userInfo || !['AUXILIAR', 'ADMINISTRATIVO'].includes(decoded.rol)) {
      return NextResponse.json({ error: 'Sin permisos de auxiliar' }, { status: 403 })
    }

    // Verificar que el retiro existe y pertenece a la IE
    const retiroExistente = await prisma.retiro.findUnique({
      where: { idRetiro: parseInt(id) },
      include: {
        estudiante: {
          include: { usuario: true }
        }
      }
    })

    if (!retiroExistente) {
      return NextResponse.json({ error: 'Retiro no encontrado' }, { status: 404 })
    }

    if (retiroExistente.estudiante.usuario.idIe !== userInfo.idIe) {
      return NextResponse.json({ error: 'Sin permisos para editar este retiro' }, { status: 403 })
    }

    // Solo se pueden editar retiros pendientes o autorizados
    if (!['PENDIENTE', 'AUTORIZADO'].includes(retiroExistente.estado)) {
      return NextResponse.json({ 
        error: 'Solo se pueden editar retiros pendientes o autorizados' 
      }, { status: 400 })
    }

    const body = await request.json()
    const {
      tipoRetiroId,
      fechaRetiro,
      horaRetiro,
      motivo,
      apoderadoQueRetiraId,
      observaciones,
      estado
    } = body

    // Preparar datos de actualización
    const updateData: any = {}

    if (tipoRetiroId !== undefined) updateData.idTipoRetiro = parseInt(tipoRetiroId)
    if (fechaRetiro !== undefined) updateData.fechaRetiro = new Date(fechaRetiro)
    if (horaRetiro !== undefined) updateData.horaRetiro = horaRetiro
    if (motivo !== undefined) updateData.motivo = motivo
    if (observaciones !== undefined) updateData.observaciones = observaciones
    if (apoderadoQueRetiraId !== undefined) {
      updateData.idApoderadoQueRetira = apoderadoQueRetiraId ? parseInt(apoderadoQueRetiraId) : null
    }

    // Si se está autorizando o completando el retiro
    if (estado && estado !== retiroExistente.estado) {
      updateData.estado = estado
      if (['AUTORIZADO', 'COMPLETADO'].includes(estado)) {
        updateData.autorizadoPor = userId
        updateData.fechaAutorizacion = new Date()
      }
    }

    // Actualizar el retiro
    const retiroActualizado = await prisma.retiro.update({
      where: { idRetiro: parseInt(id) },
      data: updateData,
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
        tipoRetiro: true
      }
    })

    console.log('✅ Retiro actualizado exitosamente:', retiroActualizado.idRetiro)

    return NextResponse.json({
      success: true,
      message: 'Retiro actualizado exitosamente',
      retiro: {
        id: retiroActualizado.idRetiro,
        estudiante: {
          nombre: retiroActualizado.estudiante.usuario.nombre,
          apellido: retiroActualizado.estudiante.usuario.apellido,
          grado: retiroActualizado.estudiante.gradoSeccion?.grado?.nombre,
          seccion: retiroActualizado.estudiante.gradoSeccion?.seccion?.nombre
        },
        tipoRetiro: retiroActualizado.tipoRetiro?.nombre,
        fechaRetiro: retiroActualizado.fechaRetiro.toISOString().split('T')[0],
        horaRetiro: retiroActualizado.horaRetiro,
        estado: retiroActualizado.estado
      }
    })

  } catch (error) {
    console.error('❌ Error al actualizar retiro:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🗑️ Eliminando retiro...')

    const { id } = await params

    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    } catch (jwtError) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const userId = decoded.userId
    const userInfo = await prisma.usuario.findUnique({
      where: { idUsuario: userId },
      include: { ie: true }
    })

    if (!userInfo || !['AUXILIAR', 'ADMINISTRATIVO'].includes(decoded.rol)) {
      return NextResponse.json({ error: 'Sin permisos de auxiliar' }, { status: 403 })
    }

    // Verificar que el retiro existe y pertenece a la IE
    const retiroExistente = await prisma.retiro.findUnique({
      where: { idRetiro: parseInt(id) },
      include: {
        estudiante: {
          include: { usuario: true }
        }
      }
    })

    if (!retiroExistente) {
      return NextResponse.json({ error: 'Retiro no encontrado' }, { status: 404 })
    }

    if (retiroExistente.estudiante.usuario.idIe !== userInfo.idIe) {
      return NextResponse.json({ error: 'Sin permisos para eliminar este retiro' }, { status: 403 })
    }

    // Solo se pueden eliminar retiros pendientes
    if (retiroExistente.estado !== 'PENDIENTE') {
      return NextResponse.json({ 
        error: 'Solo se pueden eliminar retiros pendientes' 
      }, { status: 400 })
    }

    // Eliminar el retiro
    await prisma.retiro.delete({
      where: { idRetiro: parseInt(id) }
    })

    console.log('✅ Retiro eliminado exitosamente:', id)

    return NextResponse.json({
      success: true,
      message: 'Retiro eliminado exitosamente'
    })

  } catch (error) {
    console.error('❌ Error al eliminar retiro:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
