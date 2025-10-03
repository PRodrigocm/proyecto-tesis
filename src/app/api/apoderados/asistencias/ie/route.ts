import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

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

    // Verificar que el estudiante pertenece al apoderado
    const estudianteApoderado = await prisma.estudianteApoderado.findFirst({
      where: {
        idApoderado: decoded.userId,
        idEstudiante: parseInt(estudianteId)
      }
    })

    if (!estudianteApoderado) {
      return NextResponse.json(
        { error: 'No tiene permisos para ver las asistencias de este estudiante' },
        { status: 403 }
      )
    }

    // Obtener asistencias de entrada/salida de la IE
    const asistencias = await prisma.asistencia.findMany({
      where: {
        idEstudiante: parseInt(estudianteId),
        fecha: {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin)
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
        fecha: 'desc'
      }
    })

    const asistenciasFormateadas = asistencias.map(asistencia => ({
      id: asistencia.idAsistencia.toString(),
      fecha: asistencia.fecha.toISOString().split('T')[0],
      horaEntrada: asistencia.horaEntrada,
      horaSalida: asistencia.horaSalida,
      estado: asistencia.estado,
      estudiante: {
        id: asistencia.estudiante.idEstudiante.toString(),
        nombre: asistencia.estudiante.usuario.nombre,
        apellido: asistencia.estudiante.usuario.apellido,
        dni: asistencia.estudiante.usuario.dni,
        grado: asistencia.estudiante.gradoSeccion.grado.nombre,
        seccion: asistencia.estudiante.gradoSeccion.seccion.nombre
      }
    }))

    return NextResponse.json({
      success: true,
      asistencias: asistenciasFormateadas
    })

  } catch (error) {
    console.error('Error fetching asistencias IE:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
