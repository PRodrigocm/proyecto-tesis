import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

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

    // Verificar que el grado-sección existe
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
    const ieId = user.ieId || 1
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
      const horariosCreados = []
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
        let idDocente = null
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
