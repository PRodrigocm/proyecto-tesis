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
        idApoderado: apoderado.idApoderado
      },
      include: {
        estudiante: {
          include: {
            usuario: true
          }
        }
      }
    })

    const estudianteIds = estudiantesApoderado.map(ea => ea.estudiante.idEstudiante)

    if (estudianteIds.length === 0) {
      return NextResponse.json({
        success: true,
        notificaciones: []
      })
    }

    const notificaciones: any[] = []

    // 1. Retiros pendientes de aprobación
    const estadosSolicitado = await prisma.estadoRetiro.findMany({
      where: {
        codigo: {
          in: ['SOLICITADO', 'EN_REVISION']
        }
      }
    })

    const estadosSolicitadoIds = estadosSolicitado.map(e => e.idEstadoRetiro)

    const retirosPendientes = await prisma.retiro.findMany({
      where: {
        idEstudiante: {
          in: estudianteIds
        },
        idEstadoRetiro: {
          in: estadosSolicitadoIds
        }
      },
      include: {
        estudiante: {
          include: {
            usuario: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    retirosPendientes.forEach(retiro => {
      notificaciones.push({
        id: `retiro-${retiro.idRetiro}`,
        tipo: 'RETIRO_PENDIENTE',
        titulo: 'Retiro Pendiente de Aprobación',
        mensaje: `Solicitud de retiro para ${retiro.estudiante.usuario.nombre} ${retiro.estudiante.usuario.apellido}`,
        fecha: retiro.createdAt.toISOString(),
        leida: false,
        estudiante: `${retiro.estudiante.usuario.nombre} ${retiro.estudiante.usuario.apellido}`,
        urgente: true
      })
    })

    // 2. Inasistencias sin justificar
    const estadoAusente = await prisma.estadoAsistencia.findFirst({
      where: {
        OR: [
          { codigo: 'AUSENTE' },
          { codigo: 'INASISTENCIA' }
        ]
      }
    })

    if (estadoAusente) {
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
              usuario: true
            }
          }
        },
        orderBy: {
          fecha: 'desc'
        },
        take: 20
      })

      // Filtrar las que no tienen justificación
      const inasistenciasSinJustificar = inasistencias.filter(
        asist => asist.justificacionesAfectadas.length === 0
      )

      inasistenciasSinJustificar.slice(0, 10).forEach(inasistencia => {
        notificaciones.push({
          id: `inasistencia-${inasistencia.idAsistencia}`,
          tipo: 'JUSTIFICACION_REQUERIDA',
          titulo: 'Justificación Requerida',
          mensaje: `Inasistencia del ${inasistencia.fecha.toLocaleDateString('es-ES')} requiere justificación`,
          fecha: inasistencia.fecha.toISOString(),
          leida: false,
          estudiante: `${inasistencia.estudiante.usuario.nombre} ${inasistencia.estudiante.usuario.apellido}`,
          urgente: false
        })
      })
    }

    // Ordenar por fecha (más recientes primero)
    notificaciones.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

    return NextResponse.json({
      success: true,
      notificaciones: notificaciones.slice(0, 20) // Limitar a 20 notificaciones
    })

  } catch (error) {
    console.error('❌ Error fetching notificaciones del apoderado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
