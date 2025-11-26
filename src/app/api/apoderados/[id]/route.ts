import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== INICIO ACTUALIZACIÓN DE APODERADO ===')
    console.log('PUT function called successfully')
    
    const { id } = await params
    console.log('ID extraído de params:', id)
    
    if (!id) {
      console.log('Error: ID no proporcionado')
      return NextResponse.json(
        { message: 'ID del apoderado es requerido' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    console.log('ID del apoderado:', id)
    console.log('Datos recibidos:', JSON.stringify(body, null, 2))
    
    // Test simple para verificar que llegamos hasta aquí
    console.log('Punto de control 1: Datos recibidos correctamente')

    const {
      nombre,
      apellido,
      email,
      telefono,
      dni,
      direccion,
      estado,
      estudiantesIds = [],
      estudiantesRelaciones = {},
      estudiantesTitulares = {}
    } = body

    // Validar campos requeridos
    if (!nombre || !apellido || !email || !telefono || !dni) {
      return NextResponse.json(
        { message: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    const apoderadoId = parseInt(id)
    console.log('ID recibido como string:', id)
    console.log('ID convertido a número:', apoderadoId)
    console.log('Tipo de apoderadoId:', typeof apoderadoId)
    console.log('¿Es NaN?:', isNaN(apoderadoId))

    if (isNaN(apoderadoId)) {
      console.log('ID inválido, no es un número')
      return NextResponse.json(
        { message: 'ID de apoderado inválido' },
        { status: 400 }
      )
    }

    // Verificar que el apoderado existe
    console.log('Ejecutando consulta Prisma para ID:', apoderadoId)
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

    console.log('Resultado de búsqueda de apoderado:', existingApoderado)

    if (!existingApoderado) {
      console.log('Apoderado no encontrado con ID:', apoderadoId)
      
      // Buscar todos los apoderados para debugging
      const allApoderados = await prisma.apoderado.findMany({
        select: { idApoderado: true, idUsuario: true }
      })
      console.log('Todos los apoderados en BD:', allApoderados)
      
      // Intentar búsqueda alternativa
      const apoderadoSimple = await prisma.apoderado.findFirst({
        where: { idApoderado: apoderadoId }
      })
      console.log('Búsqueda simple sin includes:', apoderadoSimple)
      
      // Verificar si existe en la tabla usuario
      const usuarioRelacionado = await prisma.usuario.findMany({
        where: { 
          apoderado: {
            idApoderado: apoderadoId
          }
        },
        select: { idUsuario: true, nombre: true, apellido: true }
      })
      console.log('Usuario relacionado encontrado:', usuarioRelacionado)
      
      return NextResponse.json(
        { 
          message: 'Apoderado no encontrado',
          debug: {
            searchedId: apoderadoId,
            allApoderados: allApoderados,
            simpleSearch: apoderadoSimple,
            relatedUser: usuarioRelacionado
          }
        },
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
        // Eliminar duplicados y convertir a enteros
        const estudiantesIdsString: string[] = estudiantesIds.map((id: any) => String(id))
        const estudiantesIdsUnicos: number[] = [...new Set(estudiantesIdsString)].map((id: string) => parseInt(id)).filter((id: number) => !isNaN(id))
        console.log('IDs únicos de estudiantes:', estudiantesIdsUnicos)
        
        for (const estudianteId of estudiantesIdsUnicos) {
          const estudianteIdStr = estudianteId.toString()
          const relacion = estudiantesRelaciones[estudianteIdStr] || 'Padre/Madre'
          const esTitular = estudiantesTitulares[estudianteIdStr] !== undefined ? estudiantesTitulares[estudianteIdStr] : true
          
          console.log(`Creando relación para estudiante ${estudianteId}:`, {
            relacion,
            esTitular,
            apoderadoId
          })
          
          await tx.estudianteApoderado.create({
            data: {
              idEstudiante: estudianteId,
              idApoderado: apoderadoId,
              relacion: relacion,
              esTitular: esTitular,
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
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== GET APODERADO TEST ===')
    const { id } = await params
    console.log('GET ID:', id)
    
    return NextResponse.json({
      message: 'GET funcionando correctamente',
      id: id
    })
  } catch (error) {
    console.error('Error en GET:', error)
    return NextResponse.json(
      { error: 'Error en GET' },
      { status: 500 }
    )
  }
}
