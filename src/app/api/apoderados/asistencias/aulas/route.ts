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

    // Obtener asistencias de clases/aulas desde la BD
    const asistencias = await prisma.asistencia.findMany({
      where: {
        idEstudiante: parseInt(estudianteId),
        fecha: {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin)
        }
      },
      include: {
        estadoAsistencia: true,
        horarioClase: true,
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

    // Formatear asistencias
    const asistenciasFormateadas = asistencias.map(asistencia => ({
      id: asistencia.idAsistencia.toString(),
      fecha: asistencia.fecha.toISOString(),
      hora: asistencia.horaRegistro?.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }) || 'N/A',
      materia: asistencia.horarioClase?.materia || 'Sin especificar',
      aula: asistencia.horarioClase?.aula || 'Sin especificar',
      estado: asistencia.estadoAsistencia?.codigo || 'PENDIENTE',
      estudiante: {
        id: asistencia.estudiante.idEstudiante.toString(),
        nombre: asistencia.estudiante.usuario.nombre || '',
        apellido: asistencia.estudiante.usuario.apellido || '',
        dni: asistencia.estudiante.usuario.dni,
        grado: asistencia.estudiante.gradoSeccion?.grado.nombre || 'Sin grado',
        seccion: asistencia.estudiante.gradoSeccion?.seccion.nombre || 'Sin sección'
      }
    }))

    return NextResponse.json({
      success: true,
      asistencias: asistenciasFormateadas
    })

  } catch (error) {
    console.error('Error fetching asistencias aulas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
