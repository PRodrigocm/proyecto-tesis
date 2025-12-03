import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notificarCambioAsistencia, notificarInasistencia } from '@/lib/notifications'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

/**
 * GET - Obtener lista de asistencias con filtros
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const fecha = url.searchParams.get('fecha')
    const grado = url.searchParams.get('grado')
    const seccion = url.searchParams.get('seccion')
    const estado = url.searchParams.get('estado')
    const sesion = url.searchParams.get('sesion')
    let ieId = url.searchParams.get('ieId')

    // Si no viene ieId, intentar obtenerlo del token
    if (!ieId) {
      const authHeader = request.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7)
          const decoded = jwt.verify(token, JWT_SECRET) as any
          ieId = decoded.ieId?.toString() || '1'
        } catch {
          ieId = '1'
        }
      } else {
        ieId = '1'
      }
    }

    const whereClause: any = {}

    if (fecha) {
      const fechaDate = new Date(fecha)
      whereClause.fecha = {
        gte: new Date(fechaDate.setHours(0, 0, 0, 0)),
        lt: new Date(new Date(fecha).setHours(23, 59, 59, 999))
      }
    }

    if (estado && estado !== 'TODOS') {
      whereClause.estado = estado
    }

    // Buscar en AsistenciaIE (asistencia a la institución)
    const asistenciasIE = await prisma.asistenciaIE.findMany({
      where: {
        ...whereClause,
        idIe: parseInt(ieId || '1')
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
    }) as any[]

    // Filtrar por grado y sección si se especifican
    const filteredAsistencias = asistenciasIE.filter(asistencia => {
      const gradoMatch = !grado || asistencia.estudiante.gradoSeccion?.grado?.nombre === grado
      const seccionMatch = !seccion || asistencia.estudiante.gradoSeccion?.seccion?.nombre === seccion
      return gradoMatch && seccionMatch
    })

    const transformedAsistencias = filteredAsistencias.map(asistencia => ({
      id: asistencia.idAsistenciaIE.toString(),
      fecha: asistencia.fecha.toISOString(),
      estado: asistencia.estado || 'PRESENTE',
      horaEntrada: asistencia.horaIngreso?.toISOString() || null,
      horaSalida: asistencia.horaSalida?.toISOString() || null,
      estudiante: {
        id: asistencia.estudiante.idEstudiante.toString(),
        nombre: asistencia.estudiante.usuario?.nombre || '',
        apellido: asistencia.estudiante.usuario?.apellido || '',
        dni: asistencia.estudiante.usuario?.dni || '',
        grado: asistencia.estudiante.gradoSeccion?.grado?.nombre || '',
        seccion: asistencia.estudiante.gradoSeccion?.seccion?.nombre || ''
      }
    }))

    return NextResponse.json({
      data: transformedAsistencias,
      total: transformedAsistencias.length
    })

  } catch (error) {
    console.error('Error fetching asistencias:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST - Crear o actualizar asistencia
 */
export async function POST(request: NextRequest) {
  try {
    // Obtener información del usuario que modifica
    const authHeader = request.headers.get('authorization')
    let userId = 1
    let ieId = 1
    let modificadoPor = 'Sistema'
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, JWT_SECRET) as any
        userId = decoded.userId || 1
        ieId = decoded.ieId || 1
        
        const usuario = await prisma.usuario.findUnique({
          where: { idUsuario: decoded.userId }
        })
        if (usuario) {
          modificadoPor = `${usuario.nombre} ${usuario.apellido}`
        }
      } catch {
        // Si falla la verificación del token, continuar con valores por defecto
      }
    }

    const body = await request.json()
    const {
      estudianteId,
      fecha,
      estado,
      observaciones,
      horaLlegada
    } = body

    const fechaAsistencia = new Date(fecha)
    fechaAsistencia.setHours(0, 0, 0, 0)

    // Verificar si ya existe asistencia para este estudiante en esta fecha
    const existingAsistencia = await prisma.asistenciaIE.findFirst({
      where: {
        idEstudiante: parseInt(estudianteId),
        fecha: fechaAsistencia
      }
    })

    if (existingAsistencia) {
      // Guardar estado anterior para la notificación
      const estadoAnterior = existingAsistencia.estado || 'Sin estado'
      
      // Preparar hora de ingreso si se proporciona
      let horaIngresoDate: Date | undefined = undefined
      if (horaLlegada) {
        // horaLlegada viene en formato "HH:mm", convertir a DateTime
        const [horas, minutos] = horaLlegada.split(':').map(Number)
        horaIngresoDate = new Date(fechaAsistencia)
        horaIngresoDate.setHours(horas, minutos, 0, 0)
      }

      // Actualizar asistencia existente
      const updatedAsistencia = await prisma.asistenciaIE.update({
        where: { idAsistenciaIE: existingAsistencia.idAsistenciaIE },
        data: {
          estado: estado,
          ...(horaIngresoDate && { horaIngreso: horaIngresoDate })
        }
      })

      // NOTIFICAR AL APODERADO SI EL ESTADO CAMBIÓ
      if (estadoAnterior !== estado) {
        try {
          // Obtener datos del estudiante y apoderado
          const estudiante = await prisma.estudiante.findUnique({
            where: { idEstudiante: parseInt(estudianteId) },
            include: {
              usuario: true,
              gradoSeccion: {
                include: {
                  grado: true,
                  seccion: true
                }
              },
              apoderados: {
                include: {
                  apoderado: {
                    include: {
                      usuario: true
                    }
                  }
                }
              }
            }
          })

          if (estudiante && estudiante.apoderados.length > 0) {
            const apoderado = estudiante.apoderados[0].apoderado
            
            await notificarCambioAsistencia({
              estudianteId: estudiante.idEstudiante,
              estudianteNombre: estudiante.usuario?.nombre || '',
              estudianteApellido: estudiante.usuario?.apellido || '',
              estudianteDNI: estudiante.usuario?.dni || '',
              grado: estudiante.gradoSeccion?.grado?.nombre || '',
              seccion: estudiante.gradoSeccion?.seccion?.nombre || '',
              estadoAnterior,
              estadoNuevo: estado,
              fecha: fecha,
              observaciones: observaciones || undefined,
              modificadoPor,
              emailApoderado: apoderado.usuario?.email || '',
              telefonoApoderado: apoderado.usuario?.telefono || '',
              apoderadoUsuarioId: apoderado.usuario?.idUsuario
            })
          }
        } catch (notifError) {
          console.error('Error al enviar notificación:', notifError)
        }
      }

      return NextResponse.json({
        message: 'Asistencia actualizada exitosamente',
        id: updatedAsistencia.idAsistenciaIE,
        notificacionEnviada: estadoAnterior !== estado
      })
    } else {
      // Preparar hora de ingreso si se proporciona (para nueva asistencia)
      let horaIngresoNueva: Date | undefined = undefined
      if (horaLlegada) {
        const [horas, minutos] = horaLlegada.split(':').map(Number)
        horaIngresoNueva = new Date(fechaAsistencia)
        horaIngresoNueva.setHours(horas, minutos, 0, 0)
      }

      // Crear nueva asistencia
      const nuevaAsistencia = await prisma.asistenciaIE.create({
        data: {
          idEstudiante: parseInt(estudianteId),
          idIe: ieId,
          fecha: fechaAsistencia,
          estado: estado || 'PRESENTE',
          registradoIngresoPor: userId,
          ...(horaIngresoNueva && { horaIngreso: horaIngresoNueva })
        }
      })

      // Si es AUSENTE/INASISTENCIA, notificar al apoderado
      const estadoFinal = estado || 'PRESENTE'
      if (estadoFinal === 'AUSENTE' || estadoFinal === 'FALTA' || estadoFinal === 'INASISTENCIA') {
        try {
          // Obtener datos del estudiante y apoderado
          const estudiante = await prisma.estudiante.findUnique({
            where: { idEstudiante: parseInt(estudianteId) },
            include: {
              usuario: true,
              gradoSeccion: {
                include: {
                  grado: true,
                  seccion: true
                }
              },
              apoderados: {
                include: {
                  apoderado: {
                    include: {
                      usuario: true
                    }
                  }
                }
              }
            }
          })

          if (estudiante && estudiante.apoderados.length > 0) {
            const apoderado = estudiante.apoderados[0].apoderado
            
            console.log(`📧 Enviando notificación de inasistencia al apoderado: ${apoderado.usuario?.email}`)
            
            await notificarInasistencia({
              estudianteId: estudiante.idEstudiante,
              estudianteNombre: estudiante.usuario?.nombre || '',
              estudianteApellido: estudiante.usuario?.apellido || '',
              estudianteDNI: estudiante.usuario?.dni || '',
              grado: estudiante.gradoSeccion?.grado?.nombre || '',
              seccion: estudiante.gradoSeccion?.seccion?.nombre || '',
              fecha: fecha,
              emailApoderado: apoderado.usuario?.email || '',
              telefonoApoderado: apoderado.usuario?.telefono || '',
              apoderadoUsuarioId: apoderado.usuario?.idUsuario
            })
          }
        } catch (notifError) {
          console.error('Error al enviar notificación de inasistencia:', notifError)
        }
      }

      return NextResponse.json({
        message: 'Asistencia registrada exitosamente',
        id: nuevaAsistencia.idAsistenciaIE,
        notificacionEnviada: estadoFinal === 'AUSENTE' || estadoFinal === 'FALTA' || estadoFinal === 'INASISTENCIA'
      })
    }

  } catch (error) {
    console.error('Error creating/updating asistencia:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
