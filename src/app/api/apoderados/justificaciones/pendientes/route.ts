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

    // Obtener estudiantes del apoderado
    const estudiantesApoderado = await prisma.estudianteApoderado.findMany({
      where: {
        idApoderado: apoderado.idApoderado,
        ...(estudianteId && { idEstudiante: parseInt(estudianteId) })
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
      }
    })

    const estudianteIds = estudiantesApoderado.map(ea => ea.estudiante.idEstudiante)

    if (estudianteIds.length === 0) {
      return NextResponse.json({
        success: true,
        inasistencias: []
      })
    }

    // Buscar el estado "AUSENTE" o "INASISTENCIA"
    const estadoAusente = await prisma.estadoAsistencia.findFirst({
      where: {
        OR: [
          { codigo: 'AUSENTE' },
          { codigo: 'INASISTENCIA' }
        ]
      }
    })

    if (!estadoAusente) {
      return NextResponse.json({
        success: true,
        inasistencias: []
      })
    }

    // Obtener inasistencias sin justificar de la BD
    const inasistencias = await prisma.asistencia.findMany({
      where: {
        idEstudiante: {
          in: estudianteIds
        },
        idEstadoAsistencia: estadoAusente.idEstadoAsistencia
      },
      include: {
        justificacionesAfectadas: true,
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
        horarioClase: true
      },
      orderBy: {
        fecha: 'desc'
      }
    })

    // Filtrar las que no tienen justificación
    const inasistenciasSinJustificar = inasistencias.filter(
      asist => asist.justificacionesAfectadas.length === 0
    )

    // Transformar a formato esperado por el frontend
    const inasistenciasPendientes = inasistenciasSinJustificar.map(inasistencia => {
      // Determinar sesión basada en la hora de registro
      let sesion = 'Sin especificar'
      if (inasistencia.horaRegistro) {
        const hora = inasistencia.horaRegistro.getHours()
        if (hora < 13) {
          sesion = 'MAÑANA'
        } else {
          sesion = 'TARDE'
        }
      }

      return {
        id: inasistencia.idAsistencia.toString(),
        fecha: inasistencia.fecha.toISOString(),
        sesion,
        estudiante: {
          id: inasistencia.estudiante.idEstudiante.toString(),
          nombre: inasistencia.estudiante.usuario.nombre || '',
          apellido: inasistencia.estudiante.usuario.apellido || '',
          dni: inasistencia.estudiante.usuario.dni,
          grado: inasistencia.estudiante.gradoSeccion?.grado.nombre || 'Sin grado',
          seccion: inasistencia.estudiante.gradoSeccion?.seccion.nombre || 'Sin sección'
        },
        estado: 'INASISTENCIA',
        fechaRegistro: inasistencia.createdAt.toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      inasistencias: inasistenciasPendientes
    })

  } catch (error) {
    console.error('Error fetching inasistencias pendientes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
