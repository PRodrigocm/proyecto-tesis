import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== INICIO ACTUALIZACIÓN DE APODERADO ===')
    const { id } = await params
    const body = await request.json()
    console.log('ID del apoderado:', id)
    console.log('Datos recibidos:', JSON.stringify(body, null, 2))

    const {
      nombre,
      apellido,
      email,
      telefono,
      dni,
      direccion,
      estado,
      estudiantesIds = [],
      estudiantesRelaciones = {}
    } = body

    // Validar campos requeridos
    if (!nombre || !apellido || !email || !telefono || !dni) {
      return NextResponse.json(
        { message: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    const apoderadoId = parseInt(id)

    // Verificar que el apoderado existe
    const existingApoderado = await prisma.apoderado.findUnique({
      where: { idApoderado: apoderadoId },
      include: {
        usuario: true,
        estudiantes: {
          include: {
            estudiante: true
          }
        }
      }
    })

    if (!existingApoderado) {
      return NextResponse.json(
        { message: 'Apoderado no encontrado' },
        { status: 404 }
      )
    }

    console.log('Apoderado existente encontrado:', existingApoderado.idApoderado)
    console.log('Estudiantes actuales:', existingApoderado.estudiantes.map(e => e.estudiante.idEstudiante))
    console.log('Nuevos estudiantes:', estudiantesIds)

    // Actualizar el apoderado usando una transacción
    const updatedApoderado = await prisma.$transaction(async (tx) => {
      // 1. Actualizar datos básicos del usuario asociado al apoderado
      await tx.usuario.update({
        where: { idUsuario: existingApoderado.idUsuario },
        data: {
          nombre,
          apellido,
          email,
          telefono,
          dni,
          estado
        }
      })

      // 2. Actualizar datos específicos del apoderado (incluyendo direccion)
      await tx.apoderado.update({
        where: { idApoderado: apoderadoId },
        data: {
          direccion
        }
      })

      // 3. Eliminar todas las relaciones actuales de estudiante-apoderado
      await tx.estudianteApoderado.deleteMany({
        where: { idApoderado: apoderadoId }
      })

      // 4. Crear nuevas relaciones estudiante-apoderado
      if (estudiantesIds.length > 0) {
        const estudiantesIdsInt = estudiantesIds.map((id: string) => parseInt(id))
        
        for (const estudianteId of estudiantesIdsInt) {
          const estudianteIdStr = estudianteId.toString()
          const relacion = estudiantesRelaciones[estudianteIdStr] || 'Padre/Madre'
          
          await tx.estudianteApoderado.create({
            data: {
              idEstudiante: estudianteId,
              idApoderado: apoderadoId,
              relacion: relacion,
              esTitular: true,
              puedeRetirar: true
            }
          })
        }
      }

      // 5. Obtener el apoderado actualizado con sus estudiantes
      return await tx.apoderado.findUnique({
        where: { idApoderado: apoderadoId },
        include: {
          usuario: true,
          estudiantes: {
            include: {
              estudiante: {
                include: {
                  usuario: true
                }
              }
            }
          }
        }
      })
    })

    console.log('Apoderado actualizado exitosamente:', updatedApoderado?.idApoderado)
    console.log('Estudiantes finales:', updatedApoderado?.estudiantes.map(e => e.estudiante.idEstudiante))

    return NextResponse.json({
      message: 'Apoderado actualizado exitosamente',
      data: updatedApoderado
    })

  } catch (error) {
    console.error('Error actualizando apoderado:', error)
    return NextResponse.json(
      { 
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
