import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔄 Actualizando horarios de clase...')
    
    // Await params antes de usarlos
    const resolvedParams = await params
    
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
      console.log('🔐 Token decodificado:', {
        userId: decoded.userId,
        idUsuario: decoded.idUsuario,
        rol: decoded.rol
      })
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { horaInicio, horaFin } = await request.json()

    console.log('📝 Datos recibidos para actualización:')
    console.log(`ID del horario: ${resolvedParams.id}`)
    console.log(`Hora inicio: ${horaInicio}`)
    console.log(`Hora fin: ${horaFin}`)

    // Validar datos
    if (!horaInicio || !horaFin) {
      return NextResponse.json({ 
        error: 'Hora de inicio y fin son requeridas' 
      }, { status: 400 })
    }

    // Validar formato de horas (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(horaInicio) || !timeRegex.test(horaFin)) {
      return NextResponse.json({ 
        error: 'Formato de hora inválido. Use HH:MM' 
      }, { status: 400 })
    }

    // Validar que hora inicio sea menor que hora fin
    const [inicioHora, inicioMin] = horaInicio.split(':').map(Number)
    const [finHora, finMin] = horaFin.split(':').map(Number)
    const inicioMinutos = inicioHora * 60 + inicioMin
    const finMinutos = finHora * 60 + finMin

    if (inicioMinutos >= finMinutos) {
      return NextResponse.json({ 
        error: 'La hora de inicio debe ser menor que la hora de fin' 
      }, { status: 400 })
    }

    // Verificar permisos según el rol del usuario
    const idUsuario = decoded.userId || decoded.idUsuario
    const rolUsuario = decoded.rol
    
    console.log('👤 Verificando permisos para usuario:', idUsuario, 'con rol:', rolUsuario)
    
    let horario: any
    
    if (rolUsuario === 'ADMINISTRATIVO') {
      // Los administrativos pueden editar cualquier horario
      console.log('🔑 Usuario administrativo: puede editar cualquier horario')
      
      horario = await prisma.horarioClase.findFirst({
        where: {
          idHorarioClase: parseInt(resolvedParams.id)
        },
        include: {
          docente: true,
          gradoSeccion: {
            include: {
              grado: true,
              seccion: true
            }
          }
        }
      })
      
      if (!horario) {
        console.log('❌ Horario no encontrado en la base de datos')
        return NextResponse.json({ 
          error: 'Horario no encontrado' 
        }, { status: 404 })
      }
      
    } else {
      // Para docentes, verificar que el horario les pertenece
      console.log('👨‍🏫 Usuario docente: verificando permisos específicos')
      
      const docente = await prisma.docente.findFirst({
        where: {
          idUsuario: idUsuario
        }
      })
      
      if (!docente) {
        console.log('❌ No se encontró información de docente para este usuario')
        return NextResponse.json({ 
          error: 'Usuario no es un docente válido' 
        }, { status: 403 })
      }
      
      console.log('✅ Docente encontrado:', docente.idDocente)
      
      horario = await prisma.horarioClase.findFirst({
        where: {
          idHorarioClase: parseInt(resolvedParams.id),
          idDocente: docente.idDocente
        },
        include: {
          docente: true,
          gradoSeccion: {
            include: {
              grado: true,
              seccion: true
            }
          }
        }
      })
    }

    if (!horario) {
      console.log('❌ Horario no encontrado con esos criterios')
      
      // Buscar si el horario existe pero con otro docente
      const horarioExiste = await prisma.horarioClase.findFirst({
        where: {
          idHorarioClase: parseInt(resolvedParams.id)
        },
        include: {
          docente: true
        }
      })
      
      if (horarioExiste) {
        console.log(`⚠️ El horario existe pero pertenece al docente ID: ${horarioExiste.idDocente}`)
      } else {
        console.log('❌ El horario no existe en la base de datos')
      }
      
      return NextResponse.json({ 
        error: 'Horario no encontrado o no tienes permisos para modificarlo' 
      }, { status: 404 })
    }

    console.log('✅ Horario encontrado:')
    console.log(`Día: ${horario.diaSemana}, Docente ID: ${horario.idDocente}`)

    // Convertir horas de string a Date para las comparaciones de Prisma
    const convertirHoraADate = (hora: string): Date => {
      const [horas, minutos] = hora.split(':').map(Number)
      const date = new Date()
      date.setUTCHours(horas, minutos, 0, 0)
      return date
    }

    const horaInicioDate = convertirHoraADate(horaInicio)
    const horaFinDate = convertirHoraADate(horaFin)

    console.log('🕐 Conversión de horas para validación:')
    console.log(`${horaInicio} → ${horaInicioDate.toISOString()}`)
    console.log(`${horaFin} → ${horaFinDate.toISOString()}`)

    // Verificar conflictos de horarios en el mismo día y aula (mismo grado-sección)
    const conflictos = await prisma.horarioClase.findMany({
      where: {
        diaSemana: horario.diaSemana,
        idGradoSeccion: horario.idGradoSeccion,
        idHorarioClase: {
          not: parseInt(resolvedParams.id)
        },
        activo: true,
        OR: [
          {
            AND: [
              { horaInicio: { lte: horaInicioDate } },
              { horaFin: { gt: horaInicioDate } }
            ]
          },
          {
            AND: [
              { horaInicio: { lt: horaFinDate } },
              { horaFin: { gte: horaFinDate } }
            ]
          },
          {
            AND: [
              { horaInicio: { gte: horaInicioDate } },
              { horaFin: { lte: horaFinDate } }
            ]
          }
        ]
      },
      include: {
        docente: true,
        gradoSeccion: {
          include: {
            grado: true,
            seccion: true
          }
        }
      }
    })

    if (conflictos.length > 0) {
      const conflicto = conflictos[0]
      return NextResponse.json({ 
        error: `Conflicto de horarios: Ya existe una clase de ${conflicto.horaInicio} a ${conflicto.horaFin} el día ${conflicto.diaSemana} para ${conflicto.gradoSeccion.grado.nombre}° ${conflicto.gradoSeccion.seccion.nombre}` 
      }, { status: 409 })
    }

    // Verificar conflictos de horarios del docente (solo si no es administrativo)
    if (rolUsuario !== 'ADMINISTRATIVO') {
      const conflictosDocente = await prisma.horarioClase.findMany({
        where: {
          diaSemana: horario.diaSemana,
          idDocente: horario.idDocente,
          idHorarioClase: {
            not: parseInt(resolvedParams.id)
          },
          activo: true,
          OR: [
            {
              AND: [
                { horaInicio: { lte: horaInicioDate } },
                { horaFin: { gt: horaInicioDate } }
              ]
            },
            {
              AND: [
                { horaInicio: { lt: horaFinDate } },
                { horaFin: { gte: horaFinDate } }
              ]
            },
            {
              AND: [
                { horaInicio: { gte: horaInicioDate } },
                { horaFin: { lte: horaFinDate } }
              ]
            }
          ]
        },
        include: {
          gradoSeccion: {
            include: {
              grado: true,
              seccion: true
            }
          }
        }
      })

      if (conflictosDocente.length > 0) {
        const conflicto = conflictosDocente[0]
        return NextResponse.json({ 
          error: `Ya tienes una clase programada de ${conflicto.horaInicio} a ${conflicto.horaFin} el día ${conflicto.diaSemana} para ${conflicto.gradoSeccion.grado.nombre}° ${conflicto.gradoSeccion.seccion.nombre}` 
        }, { status: 409 })
      }
    }

    console.log('🔄 Antes de actualizar - Horario actual:')
    console.log(`Día: ${horario.diaSemana}, Hora actual: ${horario.horaInicio} - ${horario.horaFin}`)

    // Actualizar el horario
    const horarioActualizado = await prisma.horarioClase.update({
      where: {
        idHorarioClase: parseInt(resolvedParams.id)
      },
      data: {
        horaInicio: horaInicioDate,
        horaFin: horaFinDate
      },
      include: {
        docente: {
          include: {
            usuario: true
          }
        },
        gradoSeccion: {
          include: {
            grado: true,
            seccion: true
          }
        }
      }
    })

    console.log('✅ Después de actualizar - Nuevo horario:')
    console.log(`Día: ${horarioActualizado.diaSemana}, Nueva hora: ${horarioActualizado.horaInicio} - ${horarioActualizado.horaFin}`)

    console.log('✅ Horario actualizado exitosamente:', {
      id: horarioActualizado.idHorarioClase,
      horaInicio: horarioActualizado.horaInicio,
      horaFin: horarioActualizado.horaFin,
      grado: `${horarioActualizado.gradoSeccion.grado.nombre}° ${horarioActualizado.gradoSeccion.seccion.nombre}`
    })

    return NextResponse.json({
      message: 'Horario actualizado exitosamente',
      horario: {
        id: horarioActualizado.idHorarioClase.toString(),
        horaInicio: horarioActualizado.horaInicio,
        horaFin: horarioActualizado.horaFin,
        diaSemana: horarioActualizado.diaSemana,
        aula: horarioActualizado.aula || 'Sin aula',
        grado: `${horarioActualizado.gradoSeccion.grado.nombre}° ${horarioActualizado.gradoSeccion.seccion.nombre}`,
        updatedAt: horarioActualizado.updatedAt
      }
    })

  } catch (error) {
    console.error('❌ Error actualizando horario:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
