import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const url = new URL(request.url)
    const estudianteId = url.searchParams.get('estudianteId')

    // Obtener el apoderado
    const apoderado = await prisma.apoderado.findFirst({
      where: { idUsuario: decoded.userId }
    })

    if (!apoderado) {
      return NextResponse.json({ error: 'Apoderado no encontrado' }, { status: 404 })
    }

    // Obtener estudiantes del apoderado
    const estudiantesApoderado = await prisma.estudianteApoderado.findMany({
      where: { idApoderado: apoderado.idApoderado },
      select: { idEstudiante: true }
    })

    const estudianteIds = estudiantesApoderado.map((e: { idEstudiante: number }) => e.idEstudiante)

    // Buscar estado RECHAZADA
    const estadoRechazada = await prisma.estadoJustificacion.findFirst({
      where: { codigo: 'RECHAZADA' }
    })

    if (!estadoRechazada) {
      return NextResponse.json({ justificaciones: [] })
    }

    // Obtener justificaciones rechazadas
    const whereClause: any = {
      idEstudiante: estudianteId ? parseInt(estudianteId) : { in: estudianteIds },
      idEstadoJustificacion: estadoRechazada.idEstadoJustificacion
    }

    const justificaciones = await prisma.justificacion.findMany({
      where: whereClause,
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
        tipoJustificacion: true,
        estadoJustificacion: true,
        usuarioRevisor: true,
        documentos: true
      },
      orderBy: { fechaPresentacion: 'desc' }
    })

    const justificacionesTransformadas = justificaciones.map(j => ({
      id: j.idJustificacion.toString(),
      fechaInicio: j.fechaInicio.toISOString(),
      fechaFin: j.fechaFin.toISOString(),
      motivo: j.motivo,
      observaciones: j.observaciones,
      fechaPresentacion: j.fechaPresentacion.toISOString(),
      fechaRevision: j.fechaRevision?.toISOString(),
      observacionesRevision: j.observacionesRevision,
      tipoJustificacion: j.tipoJustificacion?.nombre || 'Sin tipo',
      estado: j.estadoJustificacion?.nombre || 'Rechazada',
      estudiante: {
        id: j.estudiante.idEstudiante.toString(),
        nombre: j.estudiante.usuario?.nombre || '',
        apellido: j.estudiante.usuario?.apellido || '',
        dni: j.estudiante.usuario?.dni || '',
        grado: j.estudiante.gradoSeccion?.grado?.nombre || '',
        seccion: j.estudiante.gradoSeccion?.seccion?.nombre || ''
      },
      revisor: j.usuarioRevisor ? {
        nombre: j.usuarioRevisor.nombre,
        apellido: j.usuarioRevisor.apellido
      } : null,
      documentos: j.documentos.map(d => ({
        id: d.idDocumento,
        nombre: d.nombreArchivo
      }))
    }))

    return NextResponse.json({ justificaciones: justificacionesTransformadas })

  } catch (error) {
    console.error('Error obteniendo justificaciones rechazadas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
