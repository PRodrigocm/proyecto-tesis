import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

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

    // Obtener el apoderado
    const apoderadoUserId = decoded.userId || decoded.idUsuario || decoded.id
    const apoderado = await prisma.apoderado.findFirst({
      where: { idUsuario: apoderadoUserId }
    })

    if (!apoderado) {
      return NextResponse.json(
        { error: 'Apoderado no encontrado' },
        { status: 404 }
      )
    }

    // Obtener la asistencia (inasistencia) para extraer datos necesarios
    const asistencia = await prisma.asistencia.findUnique({
      where: { idAsistencia: parseInt(inasistenciaId) },
      include: {
        estudiante: {
          include: {
            ie: true,
            apoderados: true
          }
        },
        justificacionesAfectadas: true
      }
    })

    if (!asistencia) {
      return NextResponse.json(
        { error: 'Asistencia no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que el estudiante pertenezca al apoderado
    const esEstudianteDelApoderado = asistencia.estudiante.apoderados.some(
      ea => ea.idApoderado === apoderado.idApoderado
    )

    if (!esEstudianteDelApoderado) {
      return NextResponse.json(
        { error: 'No tiene permisos para justificar esta inasistencia' },
        { status: 403 }
      )
    }

    // Verificar que no exista ya una justificación para esta asistencia
    if (asistencia.justificacionesAfectadas.length > 0) {
      return NextResponse.json(
        { error: 'Esta inasistencia ya tiene una justificación asociada' },
        { status: 400 }
      )
    }

    // Verificar que no exista un retiro para esta fecha y estudiante
    const fechaAsistencia = asistencia.fecha
    const retiroExistente = await prisma.retiro.findFirst({
      where: {
        idEstudiante: asistencia.idEstudiante,
        fecha: fechaAsistencia
      }
    })

    if (retiroExistente) {
      return NextResponse.json(
        { error: 'No se puede justificar una inasistencia que tiene un retiro asociado' },
        { status: 400 }
      )
    }

    // Buscar o crear tipo de justificación
    let tipoJust = await prisma.tipoJustificacion.findFirst({
      where: { codigo: tipoJustificacion }
    })

    if (!tipoJust) {
      // Crear tipo si no existe
      tipoJust = await prisma.tipoJustificacion.create({
        data: {
          nombre: tipoJustificacion,
          codigo: tipoJustificacion,
          requiereDocumento: tipoJustificacion === 'MEDICA',
          activo: true
        }
      })
    }

    // Buscar estado "EN_REVISION" o "PENDIENTE"
    let estadoJust = await prisma.estadoJustificacion.findFirst({
      where: {
        OR: [
          { codigo: 'EN_REVISION' },
          { codigo: 'PENDIENTE' }
        ]
      }
    })

    if (!estadoJust) {
      // Crear estado si no existe
      estadoJust = await prisma.estadoJustificacion.create({
        data: {
          nombre: 'En Revisión',
          codigo: 'EN_REVISION',
          esFinal: false,
          activo: true
        }
      })
    }

    // Crear la justificación en la BD (usando el apoderado ya obtenido arriba)
    const nuevaJustificacion = await prisma.justificacion.create({
      data: {
        idEstudiante: asistencia.idEstudiante,
        idIe: asistencia.estudiante.ie?.idIe || asistencia.estudiante.idIe || 1,
        idTipoJustificacion: tipoJust.idTipoJustificacion,
        idEstadoJustificacion: estadoJust.idEstadoJustificacion,
        fechaInicio: asistencia.fecha,
        fechaFin: asistencia.fecha,
        motivo: motivo,
        observaciones: descripcion,
        presentadoPor: decoded.userId || decoded.idUsuario || decoded.id
      }
    })

    // Vincular la justificación con la asistencia
    await prisma.asistenciaJustificacion.create({
      data: {
        idAsistencia: asistencia.idAsistencia,
        idJustificacion: nuevaJustificacion.idJustificacion,
        aplicadoPor: decoded.userId || decoded.idUsuario || decoded.id
      }
    })

    // Si hay documento, guardarlo
    if (documento && documento.size > 0) {
      // TODO: Implementar guardado físico de archivos
      const documentoPath = `/uploads/justificaciones/${Date.now()}_${documento.name}`
      
      await prisma.documentoJustificacion.create({
        data: {
          idJustificacion: nuevaJustificacion.idJustificacion,
          nombreArchivo: documento.name,
          rutaArchivo: documentoPath,
          tipoArchivo: documento.type,
          tamanioBytes: documento.size,
          subidoPor: decoded.userId || decoded.idUsuario || decoded.id
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Justificación enviada exitosamente',
      justificacion: {
        id: nuevaJustificacion.idJustificacion,
        motivo: nuevaJustificacion.motivo,
        estado: estadoJust.nombre,
        fechaCreacion: nuevaJustificacion.createdAt
      }
    })

  } catch (error) {
    console.error('❌ Error creating justificación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
