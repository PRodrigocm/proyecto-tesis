import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/docentes/dashboard - Obteniendo datos del dashboard')
    
    // Obtener userId del token de usuario
    const authHeader = request.headers.get('authorization')
    let userId = null
    let ieId = 1 // Default
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
        userId = decoded.userId
        ieId = decoded.ieId || 1
        console.log('✅ Token decodificado, userId:', userId, 'ieId:', ieId)
      } catch (error) {
        console.log('⚠️ Error decoding token, using defaults')
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Usuario no identificado' },
        { status: 401 }
      )
    }

    // Obtener información del docente
    const docente = await prisma.docente.findFirst({
      where: { idUsuario: userId },
      include: {
        usuario: true,
        docenteAulas: {
          include: {
            gradoSeccion: {
              include: {
                grado: true,
                seccion: true,
                estudiantes: true
              }
            }
          }
        }
      }
    })

    if (!docente) {
      return NextResponse.json(
        { error: 'Docente no encontrado' },
        { status: 404 }
      )
    }

    console.log('👨‍🏫 Docente encontrado:', docente.usuario.nombre, docente.usuario.apellido)

    // Fecha de hoy
    const hoy = new Date()
    const inicioDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
    const finDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59)

    // 1. Obtener clases de hoy (basado en horarios de clase)
    const clasesHoy = await prisma.horarioClase.findMany({
      where: {
        idDocente: docente.idDocente,
        activo: true
      },
      include: {
        gradoSeccion: {
          include: {
            grado: true,
            seccion: true,
            estudiantes: true
          }
        }
      }
    })

    // 2. Calcular total de estudiantes del docente
    const estudiantesTotal = docente.docenteAulas.reduce((total, docenteAula) => {
      return total + (docenteAula.gradoSeccion.estudiantes?.length || 0)
    }, 0)

    // 3. Calcular asistencia promedio del docente (últimos 7 días)
    const hace7Dias = new Date()
    hace7Dias.setDate(hace7Dias.getDate() - 7)

    const gradosSeccionesIds = docente.docenteAulas.map(da => da.idGradoSeccion)
    
    const asistenciasRecientes = await prisma.asistencia.findMany({
      where: {
        estudiante: {
          idGradoSeccion: {
            in: gradosSeccionesIds
          }
        },
        fecha: {
          gte: hace7Dias,
          lte: hoy
        }
      },
      include: {
        estadoAsistencia: true
      }
    })

    const totalAsistencias = asistenciasRecientes.length
    const asistenciasPresentes = asistenciasRecientes.filter(a => 
      a.estadoAsistencia?.codigo === 'PRESENTE'
    ).length

    const asistenciaPromedio = totalAsistencias > 0 
      ? Math.round((asistenciasPresentes / totalAsistencias) * 100 * 10) / 10
      : 0

    // 4. Justificaciones pendientes (usando el campo correcto)
    const justificacionesPendientes = await prisma.justificacion.count({
      where: {
        revisadoPor: docente.idDocente
        // TODO: Agregar filtro por estado cuando esté disponible en el modelo
      }
    })

    // 5. Retiros pendientes (del día de hoy)
    const retirosPendientes = await prisma.retiro.count({
      where: {
        fecha: {
          gte: inicioDelDia,
          lte: finDelDia
        },
        estudiante: {
          idGradoSeccion: {
            in: gradosSeccionesIds
          }
        },
        estadoRetiro: {
          codigo: 'PENDIENTE'
        }
      }
    })

    // 6. Próximas clases (horarios del docente)
    const proximasClases = clasesHoy.slice(0, 5).map(horario => ({
      id: horario.idHorarioClase,
      materia: horario.materia || 'Clase Regular',
      grado: `${horario.gradoSeccion.grado.nombre}° ${horario.gradoSeccion.seccion.nombre}`,
      hora: `${horario.horaInicio.toTimeString().slice(0, 5)} - ${horario.horaFin.toTimeString().slice(0, 5)}`,
      aula: horario.aula || `Aula ${horario.gradoSeccion.grado.nombre}° ${horario.gradoSeccion.seccion.nombre}`,
      estudiantes: horario.gradoSeccion.estudiantes?.length || 0,
      diaSemana: horario.diaSemana
    }))

    // 7. Actividad reciente (últimas asistencias, justificaciones y retiros)
    const actividadReciente: any[] = []

    // Últimas asistencias registradas
    const ultimasAsistencias = await prisma.asistencia.findMany({
      where: {
        registradoPor: userId,
        createdAt: {
          gte: hace7Dias
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
        createdAt: 'desc'
      },
      take: 3
    })

    ultimasAsistencias.forEach(asistencia => {
      if (asistencia.estudiante.gradoSeccion) {
        actividadReciente.push({
          id: `asistencia-${asistencia.idAsistencia}`,
          tipo: 'asistencia',
          descripcion: `Asistencia registrada para ${asistencia.estudiante.gradoSeccion.grado.nombre}° ${asistencia.estudiante.gradoSeccion.seccion.nombre}`,
          tiempo: getTimeAgo(asistencia.createdAt),
          icono: '✅'
        })
      }
    })

    // Últimas justificaciones revisadas
    const ultimasJustificaciones = await prisma.justificacion.findMany({
      where: {
        revisadoPor: docente.idDocente,
        updatedAt: {
          gte: hace7Dias
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
        updatedAt: 'desc'
      },
      take: 2
    })

    ultimasJustificaciones.forEach(justificacion => {
      actividadReciente.push({
        id: `justificacion-${justificacion.idJustificacion}`,
        tipo: 'justificacion',
        descripcion: `Justificación revisada de ${justificacion.estudiante.usuario.nombre}`,
        tiempo: getTimeAgo(justificacion.updatedAt || justificacion.createdAt),
        icono: '📋'
      })
    })

    // Últimos retiros
    const ultimosRetiros = await prisma.retiro.findMany({
      where: {
        estudiante: {
          idGradoSeccion: {
            in: gradosSeccionesIds
          }
        },
        createdAt: {
          gte: hace7Dias
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
      take: 2
    })

    ultimosRetiros.forEach(retiro => {
      actividadReciente.push({
        id: `retiro-${retiro.idRetiro}`,
        tipo: 'retiro',
        descripcion: `Retiro procesado para ${retiro.estudiante.usuario.nombre}`,
        tiempo: getTimeAgo(retiro.createdAt),
        icono: '🚪'
      })
    })

    // Ordenar actividad por tiempo (más reciente primero)
    actividadReciente.sort((a, b) => {
      // Ordenar por descripción del tiempo (esto es una aproximación)
      const timeA = parseTimeAgo(a.tiempo)
      const timeB = parseTimeAgo(b.tiempo)
      return timeA - timeB
    })

    const dashboardData = {
      stats: {
        clasesHoy: clasesHoy.length,
        estudiantesTotal,
        asistenciaPromedio,
        justificacionesPendientes,
        retirosPendientes
      },
      proximasClases: proximasClases.slice(0, 5),
      actividadReciente: actividadReciente.slice(0, 5),
      docente: {
        nombre: docente.usuario.nombre,
        apellido: docente.usuario.apellido,
        especialidad: docente.especialidad
      }
    }

    console.log('✅ Datos del dashboard obtenidos exitosamente')
    console.log('📊 Stats:', dashboardData.stats)

    return NextResponse.json({
      success: true,
      data: dashboardData
    })

  } catch (error) {
    console.error('❌ Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Función auxiliar para calcular tiempo transcurrido
function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Hace un momento'
  if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`
  return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`
}

// Función auxiliar para parsear tiempo (para ordenamiento)
function parseTimeAgo(timeStr: string): number {
  if (timeStr.includes('momento')) return 0
  if (timeStr.includes('minuto')) {
    const mins = parseInt(timeStr.match(/\d+/)?.[0] || '0')
    return mins
  }
  if (timeStr.includes('hora')) {
    const hours = parseInt(timeStr.match(/\d+/)?.[0] || '0')
    return hours * 60
  }
  if (timeStr.includes('día')) {
    const days = parseInt(timeStr.match(/\d+/)?.[0] || '0')
    return days * 24 * 60
  }
  return 0
}
