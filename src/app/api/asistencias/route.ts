import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notificarCambioAsistencia } from '@/lib/notifications'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const fecha = url.searchParams.get('fecha')
    const grado = url.searchParams.get('grado')
    const seccion = url.searchParams.get('seccion')
    const estado = url.searchParams.get('estado')
    const sesion = url.searchParams.get('sesion')
    const ieId = url.searchParams.get('ieId')

    if (!ieId) {
      return NextResponse.json(
        { error: 'Institution ID is required' },
        { status: 400 }
      )
    }

    const whereClause: any = {
      idIe: parseInt(ieId)
    }

    if (fecha) {
      const fechaDate = new Date(fecha)
      whereClause.fecha = {
        gte: new Date(fechaDate.setHours(0, 0, 0, 0)),
        lt: new Date(fechaDate.setHours(23, 59, 59, 999))
      }
    }

    if (estado && estado !== 'TODOS') {
      whereClause.estado = estado
    }

    if (sesion && sesion !== 'TODOS') {
      whereClause.sesion = sesion
    }

    const asistencias = await prisma.asistencia.findMany({
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
        estadoAsistencia: true
      },
      orderBy: [
        { estudiante: { usuario: { apellido: 'asc' } } },
        { estudiante: { usuario: { nombre: 'asc' } } }
      ]
    })

    // Filtrar por grado y sección si se especifican
    const filteredAsistencias = asistencias.filter(asistencia => {
      const gradoMatch = !grado || asistencia.estudiante.gradoSeccion?.grado?.nombre === grado
      const seccionMatch = !seccion || asistencia.estudiante.gradoSeccion?.seccion?.nombre === seccion
      return gradoMatch && seccionMatch
    })

    const transformedAsistencias = filteredAsistencias.map(asistencia => ({
      id: asistencia.idAsistencia.toString(),
      fecha: asistencia.fecha.toISOString(),
      estado: asistencia.estadoAsistencia?.nombreEstado || 'PRESENTE',
      observaciones: asistencia.observaciones || '',
      estudiante: {
        id: asistencia.estudiante.idEstudiante.toString(),
        nombre: asistencia.estudiante.usuario.nombre,
        apellido: asistencia.estudiante.usuario.apellido,
        dni: asistencia.estudiante.usuario.dni,
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

export async function POST(request: NextRequest) {
  try {
    // Obtener información del usuario que modifica
    const authHeader = request.headers.get('authorization')
    let modificadoPor = 'Sistema'
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, JWT_SECRET) as any
        const usuario = await prisma.usuario.findUnique({
          where: { idUsuario: decoded.userId }
        })
        if (usuario) {
          modificadoPor = `${usuario.nombre} ${usuario.apellido}`
        }
      } catch {
        // Si falla la verificación del token, continuar con "Sistema"
      }
    }

    const body = await request.json()
    const {
      estudianteId,
      fecha,
      estado,
      observaciones,
      sesion = 'AM'
    } = body

    // Buscar o crear estado de asistencia
    let estadoAsistencia = await prisma.estadoAsistencia.findFirst({
      where: { nombreEstado: estado }
    })

    if (!estadoAsistencia) {
      // Si no existe el estado, usar el estado por defecto "PRESENTE"
      estadoAsistencia = await prisma.estadoAsistencia.findFirst({
        where: { codigo: 'PRESENTE' }
      })
      
      if (!estadoAsistencia) {
        return NextResponse.json(
          { error: 'Estado de asistencia no configurado en el sistema' },
          { status: 500 }
        )
      }
    }

    // Verificar si ya existe asistencia para este estudiante en esta fecha
    const existingAsistencia = await prisma.asistencia.findFirst({
      where: {
        idEstudiante: parseInt(estudianteId),
        fecha: new Date(fecha)
      },
      include: {
        estadoAsistencia: true
      }
    })

    if (existingAsistencia) {
      // Guardar estado anterior para la notificación
      const estadoAnterior = existingAsistencia.estadoAsistencia?.nombreEstado || 'Sin estado'
      
      // Actualizar asistencia existente
      const updatedAsistencia = await prisma.asistencia.update({
        where: { idAsistencia: existingAsistencia.idAsistencia },
        data: {
          idEstadoAsistencia: estadoAsistencia.idEstadoAsistencia,
          observaciones
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
            
            console.log(`📧 Notificando cambio de asistencia al apoderado de ${estudiante.usuario.nombre}...`)
            
            await notificarCambioAsistencia({
              estudianteId: estudiante.idEstudiante,
              estudianteNombre: estudiante.usuario.nombre || '',
              estudianteApellido: estudiante.usuario.apellido || '',
              estudianteDNI: estudiante.usuario.dni,
              grado: estudiante.gradoSeccion?.grado?.nombre || '',
              seccion: estudiante.gradoSeccion?.seccion?.nombre || '',
              estadoAnterior,
              estadoNuevo: estado,
              fecha: fecha,
              observaciones: observaciones || undefined,
              modificadoPor,
              emailApoderado: apoderado.usuario.email || '',
              telefonoApoderado: apoderado.usuario.telefono || '',
              apoderadoUsuarioId: apoderado.usuario.idUsuario
            })
          }
        } catch (notifError) {
          console.error('⚠️ Error al enviar notificación (no crítico):', notifError)
          // No fallar la actualización si la notificación falla
        }
      }

      return NextResponse.json({
        message: 'Asistencia actualizada exitosamente',
        id: updatedAsistencia.idAsistencia,
        notificacionEnviada: estadoAnterior !== estado
      })
    } else {
      // Crear nueva asistencia
      const nuevaAsistencia = await prisma.asistencia.create({
        data: {
          idEstudiante: parseInt(estudianteId),
          fecha: new Date(fecha),
          idEstadoAsistencia: estadoAsistencia.idEstadoAsistencia,
          observaciones
        }
      })

      return NextResponse.json({
        message: 'Asistencia registrada exitosamente',
        id: nuevaAsistencia.idAsistencia
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
