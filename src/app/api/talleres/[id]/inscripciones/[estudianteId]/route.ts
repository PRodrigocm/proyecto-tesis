import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; estudianteId: string }> }
) {
  try {
    const { id, estudianteId } = await params
    console.log('🗑️ DELETE /api/talleres/[id]/inscripciones/[estudianteId] - Desinscribiendo estudiante:', { tallerId: id, estudianteId })

    // Obtener ieId del token de usuario
    const authHeader = request.headers.get('authorization')
    let ieId = 1 // Default
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
        ieId = decoded.ieId || 1
      } catch (error) {
        console.log('⚠️ Error decoding token, using default ieId:', ieId)
      }
    }

    // Verificar que el taller existe y pertenece a la IE
    const taller = await prisma.taller.findFirst({
      where: {
        idTaller: parseInt(id),
        idIe: ieId
      }
    })

    if (!taller) {
      return NextResponse.json(
        { error: 'Taller no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el estudiante existe y pertenece a la IE
    const estudiante = await prisma.estudiante.findFirst({
      where: {
        idEstudiante: parseInt(estudianteId),
        usuario: {
          idIe: ieId
        }
      },
      include: {
        usuario: true
      }
    })

    if (!estudiante) {
      return NextResponse.json(
        { error: 'Estudiante no encontrado' },
        { status: 404 }
      )
    }

    // Buscar la inscripción activa
    const inscripcion = await prisma.inscripcionTaller.findFirst({
      where: {
        idEstudiante: parseInt(estudianteId),
        idTaller: parseInt(id),
        anio: new Date().getFullYear(),
        estado: 'activa'
      }
    })

    if (!inscripcion) {
      return NextResponse.json(
        { error: 'El estudiante no está inscrito en este taller' },
        { status: 404 }
      )
    }

    // Cambiar el estado a 'inactiva' en lugar de eliminar
    const inscripcionActualizada = await prisma.inscripcionTaller.update({
      where: {
        idInscripcion: inscripcion.idInscripcion
      },
      data: {
        estado: 'inactiva'
      }
    })

    console.log('✅ Estudiante desinscrito exitosamente:', inscripcionActualizada.idInscripcion)

    return NextResponse.json({
      success: true,
      message: `Estudiante ${estudiante.usuario.nombre} ${estudiante.usuario.apellido} desinscrito exitosamente`,
      data: {
        inscripcionId: inscripcionActualizada.idInscripcion.toString(),
        estudianteId: estudianteId,
        tallerId: id,
        estado: 'inactiva'
      }
    })

  } catch (error) {
    console.error('❌ Error desinscribiendo estudiante:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
