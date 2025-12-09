import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

interface JWTPayload {
  userId: number
  email: string
  rol: string
  ieId?: number
}

function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as JWTPayload
    return decoded
  } catch (error) {
    console.error('Error verifying token:', error)
    return null
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const body = await request.json()
    const { idGradoSeccion, horarios } = body

    console.log('🔄 Actualizando horarios para GradoSeccion:', idGradoSeccion)
    console.log('📋 Horarios a actualizar:', horarios.length)
    console.log('📋 Datos completos recibidos:', JSON.stringify(horarios, null, 2))

    if (!idGradoSeccion || !horarios || !Array.isArray(horarios)) {
      return NextResponse.json({ 
        error: 'idGradoSeccion y horarios son requeridos' 
      }, { status: 400 })
    }

    const ieId = user.ieId || 1

    // Modo TODOS: actualizar todos los grados-secciones
    if (idGradoSeccion === 'TODOS') {
      console.log('🏫 Modo TODOS: Actualizando todos los grados-secciones')
      
      // Obtener todos los grados-secciones de la IE
      const todosGradosSecciones = await prisma.gradoSeccion.findMany({
        where: {
          grado: {
            nivel: {
              idIe: ieId
            }
          }
        },
        include: {
          grado: { include: { nivel: true } },
          seccion: true
        }
      })

      console.log(`📋 Total de grados-secciones a actualizar: ${todosGradosSecciones.length}`)
      console.log(`📋 Horarios recibidos: ${horarios.length}`)

      // Usar transacción para actualizar todos los grados-secciones
      await prisma.$transaction(async (tx) => {
        let totalCreados = 0
        
        for (const gs of todosGradosSecciones) {
          // Eliminar horarios existentes
          await tx.horarioClase.deleteMany({
            where: { idGradoSeccion: gs.idGradoSeccion }
          })
          
          // Crear nuevos horarios para este grado-sección
          // Agrupar por día y hora para evitar duplicados
          const horariosUnicos = new Map()
          for (const horario of horarios) {
            const key = `${horario.diaSemana}-${horario.horaInicio}`
            if (!horariosUnicos.has(key)) {
              horariosUnicos.set(key, horario)
            }
          }
          
          for (const horario of horariosUnicos.values()) {
            const horaInicioDateTime = new Date(`1970-01-01T${horario.horaInicio}:00.000Z`)
            const horaFinDateTime = new Date(`1970-01-01T${horario.horaFin}:00.000Z`)
            
            await tx.horarioClase.create({
              data: {
                idGradoSeccion: gs.idGradoSeccion,
                diaSemana: horario.diaSemana,
                horaInicio: horaInicioDateTime,
                horaFin: horaFinDateTime,
                aula: horario.aula || `Aula ${gs.grado.nombre}° ${gs.seccion.nombre}`,
                tipoActividad: horario.tipoActividad || 'CLASE_REGULAR',
                idDocente: null
              }
            })
            totalCreados++
          }
        }
        
        console.log(`✅ Total de horarios creados: ${totalCreados}`)
      })

      return NextResponse.json({
        success: true,
        message: `Horarios actualizados para ${todosGradosSecciones.length} grados-secciones`,
        data: {
          gradoSeccion: 'TODOS',
          count: todosGradosSecciones.length
        }
      })
    }

    // Modo INDIVIDUAL: actualizar un grado-sección específico
    const gradoSeccion = await prisma.gradoSeccion.findUnique({
      where: { idGradoSeccion: parseInt(idGradoSeccion) },
      include: {
        grado: { include: { nivel: true } },
        seccion: true
      }
    })

    if (!gradoSeccion) {
      return NextResponse.json({ 
        error: 'Grado-sección no encontrado' 
      }, { status: 404 })
    }

    // Verificar que pertenece a la IE del usuario
    if (gradoSeccion.grado.nivel.idIe !== ieId) {
      return NextResponse.json({ 
        error: 'No tienes permisos para editar este grado-sección' 
      }, { status: 403 })
    }

    // Usar transacción para actualizar horarios
    const result = await prisma.$transaction(async (tx) => {
      // Eliminar horarios existentes para este grado-sección
      await tx.horarioClase.deleteMany({
        where: { idGradoSeccion: parseInt(idGradoSeccion) }
      })

      console.log('🗑️ Horarios existentes eliminados')

      // Crear nuevos horarios
      const horariosCreados: any[] = []
      console.log(`🔄 Iniciando creación de ${horarios.length} horarios`)
      
      for (let i = 0; i < horarios.length; i++) {
        const horario = horarios[i]
        console.log(`📝 Procesando horario ${i + 1}/${horarios.length}:`, horario)
        console.log(`📅 Día de la semana: ${horario.diaSemana}, Horas: ${horario.horaInicio} - ${horario.horaFin}`)

        // Validar formato de horas
        if (!horario.horaInicio || !horario.horaFin) {
          throw new Error(`Horario ${i + 1}: horaInicio y horaFin son requeridos`)
        }

        // Validar formato HH:mm
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
        if (!timeRegex.test(horario.horaInicio)) {
          throw new Error(`Horario ${i + 1}: horaInicio debe estar en formato HH:mm (${horario.horaInicio})`)
        }
        if (!timeRegex.test(horario.horaFin)) {
          throw new Error(`Horario ${i + 1}: horaFin debe estar en formato HH:mm (${horario.horaFin})`)
        }

        // Buscar el docente por nombre si está especificado
        let idDocente: number | null = null
        if (horario.docente && horario.docente.trim() !== '') {
          const [nombre, apellido] = horario.docente.split(' ')
          console.log(`🔍 Buscando docente: ${nombre} ${apellido || ''}`)
          
          const docente = await tx.docente.findFirst({
            where: {
              usuario: {
                nombre: nombre,
                apellido: apellido || ''
              }
            }
          })
          if (docente) {
            idDocente = docente.idDocente
            console.log(`✅ Docente encontrado: ID ${idDocente}`)
          } else {
            console.log(`⚠️ Docente no encontrado: ${nombre} ${apellido || ''}`)
          }
        }

        // Convertir horas a formato DateTime para Prisma usando UTC para evitar zona horaria
        const horaInicioDateTime = new Date(`1970-01-01T${horario.horaInicio}:00.000Z`)
        const horaFinDateTime = new Date(`1970-01-01T${horario.horaFin}:00.000Z`)

        console.log(`⏰ Horas convertidas: ${horario.horaInicio} → ${horaInicioDateTime.toISOString()}, ${horario.horaFin} → ${horaFinDateTime.toISOString()}`)

        const dataToCreate = {
          idGradoSeccion: parseInt(idGradoSeccion),
          idDocente: idDocente,
          diaSemana: parseInt(horario.diaSemana),
          horaInicio: horaInicioDateTime,
          horaFin: horaFinDateTime,
          aula: horario.aula || null,
          tipoActividad: horario.tipoActividad || 'CLASE_REGULAR',
          activo: true
        }

        console.log(`💾 Creando horario con datos:`, dataToCreate)

        const nuevoHorario = await tx.horarioClase.create({
          data: dataToCreate
        })

        console.log(`✅ Horario creado con ID: ${nuevoHorario.idHorarioClase}, Día: ${horario.diaSemana}`)
        horariosCreados.push(nuevoHorario)
      }

      console.log('✅ Nuevos horarios creados:', horariosCreados.length)
      console.log('📊 Resumen de días creados:', horariosCreados.map(h => `Día ${h.diaSemana}: ${h.horaInicio.toISOString()} - ${h.horaFin.toISOString()}`))
      return horariosCreados
    })

    return NextResponse.json({
      success: true,
      message: `Horarios actualizados exitosamente para ${gradoSeccion.grado.nombre}° ${gradoSeccion.seccion.nombre}`,
      data: {
        gradoSeccion: `${gradoSeccion.grado.nombre}° ${gradoSeccion.seccion.nombre}`,
        horariosActualizados: result.length
      }
    })

  } catch (error) {
    console.error('Error updating horarios:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

/**
 * DELETE - Eliminar todos los horarios de clases
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const body = await request.json()
    const { deleteAll, idGradoSeccion } = body

    const ieId = user.ieId || 1

    if (deleteAll) {
      // Eliminar TODOS los horarios de la IE
      console.log('🗑️ Eliminando TODOS los horarios de la IE:', ieId)
      
      // Obtener todos los grados-secciones de la IE
      const gradosSecciones = await prisma.gradoSeccion.findMany({
        where: {
          grado: {
            nivel: {
              idIe: ieId
            }
          }
        },
        select: { idGradoSeccion: true }
      })

      const idsGradoSeccion = gradosSecciones.map(gs => gs.idGradoSeccion)

      // Eliminar todos los horarios de estos grados-secciones
      const result = await prisma.horarioClase.deleteMany({
        where: {
          idGradoSeccion: {
            in: idsGradoSeccion
          }
        }
      })

      console.log(`✅ ${result.count} horarios eliminados`)

      return NextResponse.json({
        success: true,
        message: `Se eliminaron ${result.count} horarios de ${gradosSecciones.length} grados-secciones`,
        data: {
          horariosEliminados: result.count,
          gradosSeccionesAfectados: gradosSecciones.length
        }
      })
    } else if (idGradoSeccion) {
      // Eliminar horarios de un grado-sección específico
      console.log('🗑️ Eliminando horarios del grado-sección:', idGradoSeccion)
      
      const gradoSeccion = await prisma.gradoSeccion.findUnique({
        where: { idGradoSeccion: parseInt(idGradoSeccion) },
        include: {
          grado: { include: { nivel: true } },
          seccion: true
        }
      })

      if (!gradoSeccion) {
        return NextResponse.json({ error: 'Grado-sección no encontrado' }, { status: 404 })
      }

      // Verificar permisos
      if (gradoSeccion.grado.nivel.idIe !== ieId) {
        return NextResponse.json({ error: 'No tienes permisos para eliminar estos horarios' }, { status: 403 })
      }

      const result = await prisma.horarioClase.deleteMany({
        where: { idGradoSeccion: parseInt(idGradoSeccion) }
      })

      console.log(`✅ ${result.count} horarios eliminados para ${gradoSeccion.grado.nombre}° ${gradoSeccion.seccion.nombre}`)

      return NextResponse.json({
        success: true,
        message: `Se eliminaron ${result.count} horarios de ${gradoSeccion.grado.nombre}° ${gradoSeccion.seccion.nombre}`,
        data: {
          horariosEliminados: result.count,
          gradoSeccion: `${gradoSeccion.grado.nombre}° ${gradoSeccion.seccion.nombre}`
        }
      })
    } else {
      return NextResponse.json({ 
        error: 'Debe especificar deleteAll: true o idGradoSeccion' 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Error deleting horarios:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
