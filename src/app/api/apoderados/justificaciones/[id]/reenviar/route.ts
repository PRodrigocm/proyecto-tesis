import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params
    const justificacionId = parseInt(id)

    // Obtener la justificación existente
    const justificacionExistente = await prisma.justificacion.findUnique({
      where: { idJustificacion: justificacionId },
      include: {
        estadoJustificacion: true,
        estudiante: true
      }
    })

    if (!justificacionExistente) {
      return NextResponse.json({ error: 'Justificación no encontrada' }, { status: 404 })
    }

    // Verificar que esté rechazada
    if (justificacionExistente.estadoJustificacion?.codigo !== 'RECHAZADA') {
      return NextResponse.json({ 
        error: 'Solo se pueden reenviar justificaciones rechazadas' 
      }, { status: 400 })
    }

    // Verificar que el apoderado tenga acceso a este estudiante
    const apoderado = await prisma.apoderado.findFirst({
      where: { idUsuario: decoded.userId }
    })

    if (!apoderado) {
      return NextResponse.json({ error: 'Apoderado no encontrado' }, { status: 404 })
    }

    const tieneAcceso = await prisma.estudianteApoderado.findFirst({
      where: {
        idApoderado: apoderado.idApoderado,
        idEstudiante: justificacionExistente.idEstudiante
      }
    })

    if (!tieneAcceso) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Obtener datos del formulario
    const formData = await request.formData()
    const motivo = formData.get('motivo') as string
    const descripcion = formData.get('descripcion') as string
    const tipoJustificacion = formData.get('tipoJustificacion') as string
    const documento = formData.get('documento') as File | null

    if (!motivo || !descripcion) {
      return NextResponse.json({ 
        error: 'Motivo y descripción son requeridos' 
      }, { status: 400 })
    }

    // Buscar estado PENDIENTE
    const estadoPendiente = await prisma.estadoJustificacion.findFirst({
      where: { codigo: 'PENDIENTE' }
    })

    if (!estadoPendiente) {
      return NextResponse.json({ error: 'Estado pendiente no encontrado' }, { status: 500 })
    }

    // Buscar tipo de justificación
    let tipoJustificacionId = justificacionExistente.idTipoJustificacion
    if (tipoJustificacion) {
      const tipo = await prisma.tipoJustificacion.findFirst({
        where: { codigo: tipoJustificacion }
      })
      if (tipo) {
        tipoJustificacionId = tipo.idTipoJustificacion
      }
    }

    // Actualizar la justificación a estado PENDIENTE con nuevos datos
    const justificacionActualizada = await prisma.justificacion.update({
      where: { idJustificacion: justificacionId },
      data: {
        motivo: motivo,
        observaciones: descripcion,
        idTipoJustificacion: tipoJustificacionId,
        idEstadoJustificacion: estadoPendiente.idEstadoJustificacion,
        fechaPresentacion: new Date(),
        // Limpiar datos de revisión anterior
        revisadoPor: null,
        fechaRevision: null,
        observacionesRevision: null
      }
    })

    // Si hay documento nuevo, guardarlo
    if (documento && documento.size > 0) {
      // Guardar archivo en el sistema de archivos
      const fs = await import('fs/promises')
      const path = await import('path')
      
      const uploadsDir = path.join(process.cwd(), 'uploads', 'justificaciones')
      await fs.mkdir(uploadsDir, { recursive: true })
      
      const fileName = `${Date.now()}_${documento.name}`
      const filePath = path.join(uploadsDir, fileName)
      
      const bytes = await documento.arrayBuffer()
      await fs.writeFile(filePath, Buffer.from(bytes))
      
      await prisma.documentoJustificacion.create({
        data: {
          idJustificacion: justificacionId,
          nombreArchivo: documento.name,
          rutaArchivo: `/uploads/justificaciones/${fileName}`,
          tipoArchivo: documento.type,
          tamanioBytes: documento.size,
          subidoPor: decoded.userId
        }
      })
    }

    console.log(`✅ Justificación ${justificacionId} reenviada exitosamente`)

    return NextResponse.json({
      success: true,
      message: 'Justificación reenviada exitosamente',
      data: justificacionActualizada
    })

  } catch (error) {
    console.error('Error reenviando justificación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
