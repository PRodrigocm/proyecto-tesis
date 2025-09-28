import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const estudianteId = parseInt(params.id)

    if (!estudianteId || isNaN(estudianteId)) {
      return NextResponse.json(
        { error: 'ID de estudiante inválido' },
        { status: 400 }
      )
    }

    // Buscar las relaciones estudiante-apoderado
    const relaciones = await prisma.estudianteApoderado.findMany({
      where: {
        idEstudiante: estudianteId
      },
      include: {
        apoderado: {
          include: {
            usuario: true
          }
        }
      }
    })

    // Transformar los datos para el frontend
    const apoderados = relaciones.map(relacion => ({
      id: relacion.apoderado.idApoderado.toString(),
      nombre: relacion.apoderado.usuario.nombre || '',
      apellido: relacion.apoderado.usuario.apellido || '',
      dni: relacion.apoderado.usuario.dni,
      telefono: relacion.apoderado.usuario.telefono || '',
      relacion: relacion.relacion,
      esTitular: relacion.esTitular
    }))

    return NextResponse.json({
      success: true,
      apoderados
    })

  } catch (error) {
    console.error('Error fetching student apoderados:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
