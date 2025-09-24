import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
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

    // Obtener docentes que enseñan en el salón
    const docentesAula = await prisma.docenteAula.findMany({
      where: {
        idGradoSeccion: salonId
      },
      include: {
        docente: {
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
          }
        },
        tipoAsignacion: true
      },
      orderBy: [
        { docente: { usuario: { apellido: 'asc' } } },
        { docente: { usuario: { nombre: 'asc' } } }
      ]
    })

    // Formatear la respuesta
    const docentesFormateados = docentesAula.map(docenteAula => ({
      id: docenteAula.idDocenteAula,
      docenteId: docenteAula.docente.idDocente,
      dni: docenteAula.docente.usuario.dni,
      nombres: docenteAula.docente.usuario.nombre,
      apellidos: docenteAula.docente.usuario.apellido,
      email: docenteAula.docente.usuario.email,
      telefono: docenteAula.docente.usuario.telefono,
      especialidad: docenteAula.docente.especialidad,
      codigo: docenteAula.docente.codigo,
      estado: docenteAula.docente.usuario.estado,
      tipoAsignacion: docenteAula.tipoAsignacion.nombre,
      fechaAsignacion: docenteAula.createdAt
    }))

    return NextResponse.json({
      salon: {
        id: salon.idGradoSeccion,
        grado: salon.grado.nombre,
        seccion: salon.seccion.nombre,
        nivel: salon.grado.nivel.nombre
      },
      docentes: docentesFormateados,
      total: docentesFormateados.length
    })

  } catch (error) {
    console.error('Error al obtener docentes del salón:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
