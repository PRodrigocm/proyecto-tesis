import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as any

    if (decoded.rol !== 'APODERADO') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const url = new URL(request.url)
    const estudianteId = url.searchParams.get('estudianteId')
    const fechaInicio = url.searchParams.get('fechaInicio')
    const fechaFin = url.searchParams.get('fechaFin')

    if (!estudianteId || !fechaInicio || !fechaFin) {
      return NextResponse.json(
        { error: 'Parámetros requeridos: estudianteId, fechaInicio, fechaFin' },
        { status: 400 }
      )
    }

    // Obtener el ID del usuario
    const apoderadoUserId = decoded.userId || decoded.idUsuario || decoded.id

    // Buscar el apoderado
    const apoderado = await prisma.apoderado.findFirst({
      where: {
        idUsuario: apoderadoUserId
      }
    })

    if (!apoderado) {
      return NextResponse.json({ 
        error: 'No se encontró el apoderado'
      }, { status: 404 })
    }

    // Verificar que el estudiante pertenece al apoderado
    const estudianteApoderado = await prisma.estudianteApoderado.findFirst({
      where: {
        idApoderado: apoderado.idApoderado,
        idEstudiante: parseInt(estudianteId)
      }
    })

    if (!estudianteApoderado) {
      return NextResponse.json(
        { error: 'No tiene permisos para ver las asistencias de este estudiante' },
        { status: 403 }
      )
    }

    // Obtener asistencias de entrada/salida de la IE
    const asistencias = await prisma.asistenciaIE.findMany({
      where: {
        idEstudiante: parseInt(estudianteId),
        fecha: {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin)
        }
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
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    })

    const asistenciasFormateadas = asistencias.map(asistencia => ({
      id: asistencia.idAsistenciaIE.toString(),
      fecha: asistencia.fecha.toISOString().split('T')[0],
      horaEntrada: asistencia.horaIngreso?.toTimeString().slice(0, 5),
      horaSalida: asistencia.horaSalida?.toTimeString().slice(0, 5),
      estado: asistencia.estado,
      estudiante: {
        id: asistencia.estudiante.idEstudiante.toString(),
        nombre: asistencia.estudiante.usuario.nombre,
        apellido: asistencia.estudiante.usuario.apellido,
        dni: asistencia.estudiante.usuario.dni,
        grado: asistencia.estudiante.gradoSeccion?.grado.nombre,
        seccion: asistencia.estudiante.gradoSeccion?.seccion.nombre
      }
    }))

    return NextResponse.json({
      success: true,
      asistencias: asistenciasFormateadas
    })

  } catch (error) {
    console.error('Error fetching asistencias IE:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
