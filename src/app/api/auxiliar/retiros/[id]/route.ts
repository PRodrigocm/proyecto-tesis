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
        estadoRetiro: true,
        apoderadoRetira: {
          include: {
            usuario: true
          }
        },
        usuarioVerificador: true
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
      fecha: retiro.fecha.toISOString().split('T')[0],
      hora: retiro.hora.toTimeString().slice(0, 5),
      observaciones: retiro.observaciones || '',
      estado: retiro.estadoRetiro?.nombre || 'Pendiente',
      apoderadoQueRetira: retiro.apoderadoRetira ? {
        id: retiro.apoderadoRetira.idApoderado,
        nombre: `${retiro.apoderadoRetira.usuario.nombre} ${retiro.apoderadoRetira.usuario.apellido}`
      } : null,
      verificadoPor: retiro.usuarioVerificador ? {
        id: retiro.usuarioVerificador.idUsuario,
        nombre: `${retiro.usuarioVerificador.nombre} ${retiro.usuarioVerificador.apellido}`
      } : null,
      fechaCreacion: retiro.createdAt?.toISOString()
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

    // Verificación de estado eliminada - permitir edición de cualquier retiro

    const body = await request.json()
    const {
      tipoRetiroId,
      fecha,
      hora,
      apoderadoQueRetiraId,
      observaciones,
      idEstadoRetiro
    } = body

    // Preparar datos de actualización
    const updateData: any = {}

    if (tipoRetiroId !== undefined) updateData.idTipoRetiro = parseInt(tipoRetiroId)
    if (fecha !== undefined) updateData.fecha = new Date(fecha)
    if (hora !== undefined) updateData.hora = new Date(`1970-01-01T${hora}`)
    if (observaciones !== undefined) updateData.observaciones = observaciones
    if (idEstadoRetiro !== undefined) updateData.idEstadoRetiro = parseInt(idEstadoRetiro)
    if (apoderadoQueRetiraId !== undefined) {
      updateData.idApoderadoQueRetira = apoderadoQueRetiraId ? parseInt(apoderadoQueRetiraId) : null
    }

    // Lógica de autorización eliminada - usar idEstadoRetiro directamente

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
        fecha: retiroActualizado.fecha.toISOString().split('T')[0],
        hora: retiroActualizado.hora.toTimeString().slice(0, 5),
        observaciones: retiroActualizado.observaciones
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

    // Verificación de estado eliminada - permitir eliminar cualquier retiro

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
