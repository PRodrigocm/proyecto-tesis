import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

// PUT - Actualizar evento específico
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔄 PUT /api/calendario-escolar/[id] - Iniciando actualización')
    
    const params = await context.params
    const eventoId = parseInt(params.id)
    const body = await request.json()
    console.log('📋 Body recibido:', body)
    console.log('🆔 ID del evento:', eventoId)

    const { fechaInicio, fechaFin, tipoDia, descripcion } = body

    // Verificar token
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const ieId = decoded.ieId || 1

    // Validar que el evento existe
    const eventoExistente = await prisma.calendarioEscolar.findUnique({
      where: { idCalendario: eventoId }
    })

    if (!eventoExistente) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
    }

    // Validar que pertenece a la misma IE
    if (eventoExistente.idIe !== ieId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Actualizar el evento
    const eventoActualizado = await prisma.calendarioEscolar.update({
      where: { idCalendario: eventoId },
      data: {
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        tipoDia,
        descripcion
      }
    })

    console.log('✅ Evento actualizado exitosamente:', eventoActualizado)

    return NextResponse.json({
      success: true,
      message: 'Evento actualizado exitosamente',
      data: eventoActualizado
    })

  } catch (error) {
    console.error('❌ Error actualizando evento:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar evento específico
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🗑️ DELETE /api/calendario-escolar/[id] - Iniciando eliminación')
    
    const params = await context.params
    const eventoId = parseInt(params.id)

    // Verificar token
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const ieId = decoded.ieId || 1

    // Validar que el evento existe
    const eventoExistente = await prisma.calendarioEscolar.findUnique({
      where: { idCalendario: eventoId }
    })

    if (!eventoExistente) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
    }

    // Validar que pertenece a la misma IE
    if (eventoExistente.idIe !== ieId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Eliminar el evento
    await prisma.calendarioEscolar.delete({
      where: { idCalendario: eventoId }
    })

    console.log('✅ Evento eliminado exitosamente')

    return NextResponse.json({
      success: true,
      message: 'Evento eliminado exitosamente'
    })

  } catch (error) {
    console.error('❌ Error eliminando evento:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
