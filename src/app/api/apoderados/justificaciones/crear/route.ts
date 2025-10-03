import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    if (decoded.rol !== 'APODERADO') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Obtener datos del formulario
    const formData = await request.formData()
    const inasistenciaId = formData.get('inasistenciaId') as string
    const motivo = formData.get('motivo') as string
    const descripcion = formData.get('descripcion') as string
    const tipoJustificacion = formData.get('tipoJustificacion') as string
    const documento = formData.get('documento') as File | null

    // Validaciones
    if (!inasistenciaId || !motivo || !descripcion || !tipoJustificacion) {
      return NextResponse.json(
        { error: 'Todos los campos requeridos deben ser proporcionados' },
        { status: 400 }
      )
    }

    // TODO: Implementar tabla de justificaciones en el esquema de Prisma
    // Por ahora simulamos la creación exitosa
    
    // Si hay documento, procesarlo (simulado)
    let documentoPath = null
    if (documento && documento.size > 0) {
      // TODO: Implementar guardado de archivos
      documentoPath = `/uploads/justificaciones/${Date.now()}_${documento.name}`
    }

    // Simular creación de justificación
    const nuevaJustificacion = {
      id: Date.now().toString(),
      inasistenciaId,
      motivo,
      descripcion,
      tipoJustificacion,
      documentoPath,
      estado: 'EN_REVISION',
      fechaCreacion: new Date().toISOString(),
      creadoPor: decoded.userId
    }

    return NextResponse.json({
      success: true,
      message: 'Justificación enviada exitosamente',
      justificacion: nuevaJustificacion
    })

  } catch (error) {
    console.error('Error creating justificación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
