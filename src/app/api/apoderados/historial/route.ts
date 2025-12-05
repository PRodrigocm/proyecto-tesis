import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { getEstudiantesDelApoderado, inicializarEstadosRetiro } from '@/lib/retiros-utils'

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

    // Inicializar estados de retiro si no existen
    await inicializarEstadosRetiro()

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
    const estudianteIds = await getEstudiantesDelApoderado(apoderado.idApoderado)

    // Si no hay estudiantes, retornar historial vacío
    if (estudianteIds.length === 0) {
      return NextResponse.json({
        success: true,
        historial: []
      })
    }

    // Obtener historial de retiros
    const retiros = await prisma.retiro.findMany({
      where: {
        idEstudiante: {
          in: estudianteIds
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
        },
        estadoRetiro: true,
        tipoRetiro: true,
        usuarioVerificador: true,
        docenteReportador: {
          include: {
            usuario: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Convertir retiros al formato del historial
    const historialRetiros = retiros.map((retiro: typeof retiros[number]) => ({
      id: `retiro_${retiro.idRetiro}`,
      tipo: 'RETIRO' as const,
      fecha: retiro.fecha.toISOString(),
      estudiante: {
        nombre: retiro.estudiante.usuario.nombre || '',
        apellido: retiro.estudiante.usuario.apellido || '',
        grado: retiro.estudiante.gradoSeccion?.grado.nombre || 'Sin grado',
        seccion: retiro.estudiante.gradoSeccion?.seccion.nombre || 'Sin sección'
      },
      estado: retiro.estadoRetiro?.codigo || 'PENDIENTE',
      motivo: retiro.tipoRetiro?.nombre || 'Retiro',
      descripcion: retiro.observaciones || '',
      fechaCreacion: retiro.createdAt.toISOString(),
      fechaAprobacion: retiro.updatedAt?.toISOString(),
      aprobadoPor: retiro.usuarioVerificador ? 
        `${retiro.usuarioVerificador.nombre} ${retiro.usuarioVerificador.apellido}` : 
        undefined,
      creadoPor: retiro.docenteReportador ? 
        `${retiro.docenteReportador.usuario.nombre} ${retiro.docenteReportador.usuario.apellido}` : 
        undefined
    }))

    // Obtener historial de justificaciones
    const justificaciones = await prisma.justificacion.findMany({
      where: {
        idEstudiante: {
          in: estudianteIds
        }
      },
      include: {
        asistenciasAfectadas: {
          include: {
            asistencia: {
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
            }
          }
        },
        estadoJustificacion: true,
        usuarioRevisor: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Convertir justificaciones al formato del historial
    const historialJustificaciones = justificaciones.map((justificacion: typeof justificaciones[number]) => {
      // Obtener el primer estudiante afectado
      const primeraAsistencia = justificacion.asistenciasAfectadas[0]?.asistencia
      
      return {
        id: `justificacion_${justificacion.idJustificacion}`,
        tipo: 'JUSTIFICACION' as const,
        fecha: primeraAsistencia?.fecha.toISOString() || justificacion.createdAt.toISOString(),
        estudiante: {
          nombre: primeraAsistencia?.estudiante.usuario.nombre || '',
          apellido: primeraAsistencia?.estudiante.usuario.apellido || '',
          grado: primeraAsistencia?.estudiante.gradoSeccion?.grado.nombre || 'Sin grado',
          seccion: primeraAsistencia?.estudiante.gradoSeccion?.seccion.nombre || 'Sin sección'
        },
        estado: justificacion.estadoJustificacion?.codigo || 'PENDIENTE',
        motivo: justificacion.motivo || 'Justificación',
        descripcion: justificacion.observaciones || '',
        fechaCreacion: justificacion.createdAt.toISOString(),
        fechaAprobacion: justificacion.fechaRevision?.toISOString(),
        aprobadoPor: justificacion.usuarioRevisor ? 
          `${justificacion.usuarioRevisor.nombre} ${justificacion.usuarioRevisor.apellido}` : 
          undefined
      }
    })

    // Combinar y ordenar todo el historial
    const historialCompleto = [...historialRetiros, ...historialJustificaciones]
      .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime())

    return NextResponse.json({
      success: true,
      historial: historialCompleto
    })

  } catch (error) {
    console.error('Error fetching historial del apoderado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
