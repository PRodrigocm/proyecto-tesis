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

    // Obtener asistencias de clases/aulas
    // Nota: Esta consulta asume que existe una tabla de asistencias por clase
    // Por ahora simulamos datos ya que la estructura exacta puede variar
    
    // Simulación de datos de asistencia a clases
    const asistenciasSimuladas = [
      {
        id: '1',
        fecha: '2024-10-01',
        hora: '08:00',
        materia: 'Matemáticas',
        aula: 'Aula 101',
        estado: 'PRESENTE'
      },
      {
        id: '2',
        fecha: '2024-10-01',
        hora: '09:00',
        materia: 'Comunicación',
        aula: 'Aula 102',
        estado: 'PRESENTE'
      },
      {
        id: '3',
        fecha: '2024-10-02',
        hora: '08:00',
        materia: 'Matemáticas',
        aula: 'Aula 101',
        estado: 'TARDANZA'
      },
      {
        id: '4',
        fecha: '2024-10-02',
        hora: '10:00',
        materia: 'Ciencias',
        aula: 'Laboratorio',
        estado: 'AUSENTE'
      }
    ].filter(asistencia => {
      const fechaAsistencia = new Date(asistencia.fecha)
      const inicio = new Date(fechaInicio)
      const fin = new Date(fechaFin)
      return fechaAsistencia >= inicio && fechaAsistencia <= fin
    })

    // Obtener información del estudiante
    const estudiante = await prisma.estudiante.findUnique({
      where: {
        idEstudiante: parseInt(estudianteId)
      },
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

    const asistenciasFormateadas = asistenciasSimuladas.map(asistencia => ({
      ...asistencia,
      estudiante: {
        id: estudiante?.idEstudiante.toString(),
        nombre: estudiante?.usuario.nombre,
        apellido: estudiante?.usuario.apellido,
        dni: estudiante?.usuario.dni,
        grado: estudiante?.gradoSeccion.grado.nombre,
        seccion: estudiante?.gradoSeccion.seccion.nombre
      }
    }))

    return NextResponse.json({
      success: true,
      asistencias: asistenciasFormateadas
    })

  } catch (error) {
    console.error('Error fetching asistencias aulas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
