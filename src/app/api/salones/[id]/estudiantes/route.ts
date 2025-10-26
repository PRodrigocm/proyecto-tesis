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
    const estudiantesFormateados = estudiantes.map(estudiante => {
      // @ts-ignore - Temporal workaround mientras se actualiza el cliente de Prisma
      const codigoQR = estudiante.codigoQR || estudiante.codigo || ''
      
      console.log(`Estudiante ${estudiante.idEstudiante}:`, {
        nombre: estudiante.usuario.nombre,
        codigoQR: codigoQR,
        tieneCodigoQR: !!codigoQR
      })
      
      return {
        id: estudiante.idEstudiante,
        dni: estudiante.usuario.dni,
        nombres: estudiante.usuario.nombre,
        apellidos: estudiante.usuario.apellido,
        email: estudiante.usuario.email,
        telefono: estudiante.usuario.telefono,
        fechaNacimiento: estudiante.fechaNacimiento,
        codigoQR: codigoQR,
        estado: estudiante.usuario.estado,
        createdAt: estudiante.createdAt
      }
    })

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

export async function PUT(
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

    const body = await request.json()
    const { estudiantesIds } = body

    // Validar que estudiantesIds sea un array
    if (!Array.isArray(estudiantesIds)) {
      return NextResponse.json(
        { error: 'estudiantesIds debe ser un array' },
        { status: 400 }
      )
    }

    // Verificar que el salón existe
    const salon = await prisma.gradoSeccion.findUnique({
      where: { idGradoSeccion: salonId }
    })

    if (!salon) {
      return NextResponse.json(
        { error: 'Salón no encontrado' },
        { status: 404 }
      )
    }

    // Validar que todos los estudiantes existen
    const estudiantes = await prisma.estudiante.findMany({
      where: {
        idEstudiante: {
          in: estudiantesIds
        }
      }
    })

    if (estudiantes.length !== estudiantesIds.length) {
      return NextResponse.json(
        { error: 'Algunos estudiantes no existen' },
        { status: 400 }
      )
    }

    // Actualizar todos los estudiantes: quitar del salón actual
    await prisma.estudiante.updateMany({
      where: {
        idGradoSeccion: salonId
      },
      data: {
        idGradoSeccion: null
      }
    })

    // Asignar los nuevos estudiantes al salón
    if (estudiantesIds.length > 0) {
      await prisma.estudiante.updateMany({
        where: {
          idEstudiante: {
            in: estudiantesIds
          }
        },
        data: {
          idGradoSeccion: salonId
        }
      })
    }

    console.log(`✅ Salón ${salonId} actualizado con ${estudiantesIds.length} estudiantes`)

    return NextResponse.json({
      message: 'Estudiantes actualizados exitosamente',
      salonId: salonId,
      totalEstudiantes: estudiantesIds.length
    })

  } catch (error) {
    console.error('Error al actualizar estudiantes del salón:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
