import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

/**
 * GET - Obtener detalle completo de asistencia de un estudiante en una fecha
 * Incluye: quién tomó asistencia de aula, quién tomó asistencia IE, historial de cambios
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const estudianteId = url.searchParams.get('estudianteId')
    const fecha = url.searchParams.get('fecha')

    if (!estudianteId || !fecha) {
      return NextResponse.json(
        { error: 'estudianteId y fecha son requeridos' },
        { status: 400 }
      )
    }

    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    try {
      jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Parsear fecha correctamente
    const [anio, mes, dia] = fecha.split('-').map(Number)
    const fechaInicio = new Date(anio, mes - 1, dia, 0, 0, 0, 0)
    const fechaFin = new Date(anio, mes - 1, dia, 23, 59, 59, 999)

    // Obtener información del estudiante
    const estudiante = await prisma.estudiante.findUnique({
      where: { idEstudiante: parseInt(estudianteId) },
      include: {
        usuario: true,
        gradoSeccion: {
          include: {
            grado: true,
            seccion: true
          }
        }
      }
    })

    if (!estudiante) {
      return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 })
    }

    // Obtener asistencia de AULA (tabla Asistencia) - tomada por docente
    const asistenciaAula = await prisma.asistencia.findFirst({
      where: {
        idEstudiante: parseInt(estudianteId),
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      include: {
        estadoAsistencia: true,
        usuarioRegistrador: {
          include: {
            docente: true
          }
        },
        historicoEstados: {
          include: {
            estadoAsistencia: true,
            usuario: true
          },
          orderBy: {
            fechaCambio: 'desc'
          }
        }
      }
    })

    // Obtener asistencia de IE (tabla AsistenciaIE) - tomada por auxiliar
    const asistenciaIE = await prisma.asistenciaIE.findFirst({
      where: {
        idEstudiante: parseInt(estudianteId),
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      include: {
        usuarioIngreso: true,
        usuarioSalida: true
      }
    })

    // Formatear respuesta
    const detalle = {
      estudiante: {
        id: estudiante.idEstudiante,
        nombre: estudiante.usuario?.nombre || '',
        apellido: estudiante.usuario?.apellido || '',
        dni: estudiante.usuario?.dni || '',
        grado: estudiante.gradoSeccion?.grado?.nombre || '',
        seccion: estudiante.gradoSeccion?.seccion?.nombre || ''
      },
      fecha: fecha,
      
      // Asistencia de Aula (tomada por docente)
      asistenciaAula: asistenciaAula ? {
        id: asistenciaAula.idAsistencia,
        estado: asistenciaAula.estadoAsistencia?.codigo || asistenciaAula.estadoAsistencia?.nombreEstado || 'PRESENTE',
        estadoNombre: asistenciaAula.estadoAsistencia?.nombreEstado || asistenciaAula.estadoAsistencia?.codigo || 'Presente',
        horaRegistro: asistenciaAula.horaRegistro 
          ? new Date(asistenciaAula.horaRegistro).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })
          : null,
        fechaRegistro: asistenciaAula.createdAt 
          ? new Date(asistenciaAula.createdAt).toLocaleString('es-PE', { 
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit', hour12: false 
            })
          : null,
        registradoPor: asistenciaAula.usuarioRegistrador ? {
          id: asistenciaAula.usuarioRegistrador.idUsuario,
          nombre: asistenciaAula.usuarioRegistrador.nombre || '',
          apellido: asistenciaAula.usuarioRegistrador.apellido || '',
          rol: asistenciaAula.usuarioRegistrador.docente ? 'Docente' : 'Usuario'
        } : null,
        observaciones: asistenciaAula.observaciones
      } : null,

      // Asistencia de IE (tomada por auxiliar)
      asistenciaIE: asistenciaIE ? {
        id: asistenciaIE.idAsistenciaIE,
        estado: asistenciaIE.estado || 'INGRESADO',
        horaIngreso: asistenciaIE.horaIngreso 
          ? new Date(asistenciaIE.horaIngreso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })
          : null,
        horaSalida: asistenciaIE.horaSalida 
          ? new Date(asistenciaIE.horaSalida).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })
          : null,
        fechaRegistroIngreso: asistenciaIE.createdAt 
          ? new Date(asistenciaIE.createdAt).toLocaleString('es-PE', { 
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit', hour12: false 
            })
          : null,
        registradoIngresoPor: asistenciaIE.usuarioIngreso ? {
          id: asistenciaIE.usuarioIngreso.idUsuario,
          nombre: asistenciaIE.usuarioIngreso.nombre || '',
          apellido: asistenciaIE.usuarioIngreso.apellido || '',
          rol: 'Auxiliar'
        } : null,
        registradoSalidaPor: asistenciaIE.usuarioSalida ? {
          id: asistenciaIE.usuarioSalida.idUsuario,
          nombre: asistenciaIE.usuarioSalida.nombre || '',
          apellido: asistenciaIE.usuarioSalida.apellido || '',
          rol: 'Auxiliar'
        } : null
      } : null,

      // Historial de cambios/ediciones
      historialCambios: asistenciaAula?.historicoEstados?.map(h => ({
        id: h.idHistorico,
        estadoAnterior: h.estadoAsistencia?.nombreEstado || h.estadoAsistencia?.codigo || 'Desconocido',
        estadoCodigo: h.estadoAsistencia?.codigo || 'DESCONOCIDO',
        fechaCambio: new Date(h.fechaCambio).toLocaleString('es-PE', { 
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit', hour12: false 
        }),
        cambiadoPor: h.usuario ? {
          id: h.usuario.idUsuario,
          nombre: h.usuario.nombre || '',
          apellido: h.usuario.apellido || ''
        } : null
      })) || [],

      // Resumen
      tieneAsistenciaAula: !!asistenciaAula,
      tieneAsistenciaIE: !!asistenciaIE,
      fueEditada: (asistenciaAula?.historicoEstados?.length || 0) > 0
    }

    return NextResponse.json({
      success: true,
      data: detalle
    })

  } catch (error) {
    console.error('Error obteniendo detalle de asistencia:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: String(error) },
      { status: 500 }
    )
  }
}
