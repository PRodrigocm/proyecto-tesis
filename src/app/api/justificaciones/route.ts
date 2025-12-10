import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET /api/justificaciones - Listar justificaciones
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const decoded = verifyToken(token) as any
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Obtener información del usuario para filtrar por IE
    const usuario = await prisma.usuario.findUnique({
      where: { idUsuario: decoded.userId || decoded.idUsuario },
      select: { idIe: true }
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const rolUsuario = decoded.rol || ''
    console.log(`📋 Cargando justificaciones para usuario ${decoded.userId}, IE: ${usuario.idIe}, rol: ${rolUsuario}`)

    const { searchParams } = new URL(request.url)
    const estudianteId = searchParams.get('estudianteId')
    const estado = searchParams.get('estado')
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Construir filtros - IMPORTANTE: filtrar por IE del usuario
    const where: any = {}
    
    // Filtrar por IE del usuario (docentes y auxiliares solo ven su IE)
    if (usuario.idIe && ['DOCENTE', 'AUXILIAR', 'ADMINISTRATIVO'].includes(rolUsuario)) {
      where.idIe = usuario.idIe
    }
    
    if (estudianteId) {
      where.idEstudiante = parseInt(estudianteId)
    }
    
    if (estado) {
      where.estadoJustificacion = {
        codigo: estado
      }
    }
    
    if (fechaInicio && fechaFin) {
      where.OR = [
        {
          fechaInicio: {
            gte: new Date(fechaInicio),
            lte: new Date(fechaFin)
          }
        },
        {
          fechaFin: {
            gte: new Date(fechaInicio),
            lte: new Date(fechaFin)
          }
        }
      ]
    }

    // Obtener justificaciones con paginación
    const [justificaciones, total] = await Promise.all([
      prisma.justificacion.findMany({
        where,
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
          estadoAsistencia: true,
          usuarioPresentador: true,
          usuarioRevisor: true,
          documentos: true,
          asistenciasAfectadas: {
            include: {
              asistencia: true
            }
          }
        },
        orderBy: {
          fechaPresentacion: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.justificacion.count({ where })
    ])

    console.log(`✅ Justificaciones encontradas: ${justificaciones.length} de ${total} total`)

    return NextResponse.json({
      success: true,
      data: justificaciones,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error obteniendo justificaciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/justificaciones - Crear nueva justificación
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const body = await request.json()
    const {
      idEstudiante,
      idIe,
      idTipoJustificacion,
      fechaInicio,
      fechaFin,
      motivo,
      observaciones,
      asistenciasIds = []
    } = body

    // Validaciones
    if (!idEstudiante || !idIe || !idTipoJustificacion || !fechaInicio || !fechaFin || !motivo) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Verificar que las fechas sean válidas
    const fechaInicioDate = new Date(fechaInicio)
    const fechaFinDate = new Date(fechaFin)
    
    if (fechaInicioDate > fechaFinDate) {
      return NextResponse.json(
        { error: 'La fecha de inicio no puede ser posterior a la fecha de fin' },
        { status: 400 }
      )
    }

    // Obtener el estado inicial (PENDIENTE)
    const estadoPendiente = await prisma.estadoJustificacion.findFirst({
      where: { codigo: 'PENDIENTE' }
    })

    if (!estadoPendiente) {
      return NextResponse.json(
        { error: 'Estado de justificación no configurado' },
        { status: 500 }
      )
    }

    // Crear la justificación
    const justificacion = await prisma.justificacion.create({
      data: {
        idEstudiante,
        idIe,
        idTipoJustificacion,
        idEstadoJustificacion: estadoPendiente.idEstadoJustificacion,
        fechaInicio: fechaInicioDate,
        fechaFin: fechaFinDate,
        motivo,
        observaciones,
        presentadoPor: (decoded as any).idUsuario
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
        },
        tipoJustificacion: true,
        estadoJustificacion: true
      }
    })

    // Si se especificaron asistencias, vincularlas
    if (asistenciasIds.length > 0) {
      await prisma.asistenciaJustificacion.createMany({
        data: asistenciasIds.map((idAsistencia: number) => ({
          idAsistencia,
          idJustificacion: justificacion.idJustificacion,
          aplicadoPor: (decoded as any).idUsuario
        }))
      })
    }

    return NextResponse.json({
      success: true,
      data: justificacion,
      message: 'Justificación creada exitosamente'
    })

  } catch (error) {
    console.error('Error creando justificación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
