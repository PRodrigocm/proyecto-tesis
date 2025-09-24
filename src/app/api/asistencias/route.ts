import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
      horaEntrada: asistencia.horaEntrada?.toTimeString().slice(0, 5) || '',
      horaSalida: asistencia.horaSalida?.toTimeString().slice(0, 5) || '',
      observaciones: asistencia.observaciones || '',
      sesion: asistencia.sesion,
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
      // Crear estado si no existe
      estadoAsistencia = await prisma.estadoAsistencia.create({
        data: { nombreEstado: estado }
      })
    }

    // Verificar si ya existe asistencia para este estudiante en esta fecha
    const existingAsistencia = await prisma.asistencia.findFirst({
      where: {
        idEstudiante: parseInt(estudianteId),
        fecha: new Date(fecha),
        sesion
      }
    })

    if (existingAsistencia) {
      // Actualizar asistencia existente
      const updatedAsistencia = await prisma.asistencia.update({
        where: { idAsistencia: existingAsistencia.idAsistencia },
        data: {
          idEstadoAsistencia: estadoAsistencia.idEstadoAsistencia,
          observaciones,
          horaEntrada: estado === 'PRESENTE' || estado === 'TARDANZA' ? 
            new Date().toTimeString().slice(0, 8) : null
        }
      })

      return NextResponse.json({
        message: 'Asistencia actualizada exitosamente',
        id: updatedAsistencia.idAsistencia
      })
    } else {
      // Crear nueva asistencia
      const nuevaAsistencia = await prisma.asistencia.create({
        data: {
          idEstudiante: parseInt(estudianteId),
          fecha: new Date(fecha),
          idEstadoAsistencia: estadoAsistencia.idEstadoAsistencia,
          observaciones,
          sesion,
          horaEntrada: estado === 'PRESENTE' || estado === 'TARDANZA' ? 
            new Date().toTimeString().slice(0, 8) : null,
          idIe: 1 // IE por defecto
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
