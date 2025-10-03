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

    // Obtener estudiantes del apoderado
    const estudiantesApoderado = await prisma.estudianteApoderado.findMany({
      where: {
        idApoderado: decoded.userId,
        ...(estudianteId && { idEstudiante: parseInt(estudianteId) })
      },
      include: {
        estudiante: true
      }
    })

    const estudianteIds = estudiantesApoderado.map(ea => ea.estudiante.idEstudiante)

    // Obtener inasistencias sin justificar (simulado por ahora)
    // TODO: Implementar tabla de asistencias y justificaciones
    // Por ahora devolvemos datos simulados
    const inasistenciasPendientes = [
      {
        id: '1',
        fecha: '2024-10-01',
        sesion: 'MAÑANA',
        estudiante: {
          id: '1',
          nombre: 'Juan',
          apellido: 'Pérez',
          dni: '12345678',
          grado: '3',
          seccion: 'A'
        },
        estado: 'INASISTENCIA',
        fechaRegistro: '2024-10-01T08:00:00Z'
      }
    ]

    return NextResponse.json({
      success: true,
      inasistencias: inasistenciasPendientes
    })

  } catch (error) {
    console.error('Error fetching inasistencias pendientes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
