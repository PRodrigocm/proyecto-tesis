import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const salonId = parseInt(params.id)
    
    if (isNaN(salonId)) {
      return NextResponse.json(
        { error: 'ID de salón inválido' },
        { status: 400 }
      )
    }

    // Obtener información del salón para conseguir el grado y sección
    const salon = await prisma.gradoSeccion.findUnique({
      where: { idGradoSeccion: salonId },
      include: {
        grado: {
          include: {
            nivel: true
          }
        },
        seccion: true
      }
    })

    if (!salon) {
      return NextResponse.json(
        { error: 'Salón no encontrado' },
        { status: 404 }
      )
    }

    // Obtener estudiantes del salón
    const estudiantes = await prisma.estudiante.findMany({
      where: {
        idGradoSeccion: salonId
      },
      include: {
        usuario: {
          select: {
            nombre: true,
            apellido: true,
            dni: true,
            email: true,
            telefono: true,
            estado: true
          }
        }
      },
      orderBy: [
        { usuario: { apellido: 'asc' } },
        { usuario: { nombre: 'asc' } }
      ]
    })

    // Formatear la respuesta
    const estudiantesFormateados = estudiantes.map(estudiante => ({
      id: estudiante.idEstudiante,
      dni: estudiante.usuario.dni,
      nombres: estudiante.usuario.nombre,
      apellidos: estudiante.usuario.apellido,
      email: estudiante.usuario.email,
      telefono: estudiante.usuario.telefono,
      fechaNacimiento: estudiante.fechaNacimiento,
      qr: estudiante.qr,
      codigo: estudiante.codigo,
      estado: estudiante.usuario.estado,
      createdAt: estudiante.createdAt
    }))

    return NextResponse.json({
      salon: {
        id: salon.idGradoSeccion,
        grado: salon.grado.nombre,
        seccion: salon.seccion.nombre,
        nivel: salon.grado.nivel.nombre
      },
      estudiantes: estudiantesFormateados,
      total: estudiantesFormateados.length
    })

  } catch (error) {
    console.error('Error al obtener estudiantes del salón:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
