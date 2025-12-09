import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔄 Actualizando horarios de clase...')
    
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
      console.log('❌ Error de validación: hora inicio >= hora fin')
      console.log(`   Inicio: ${horaInicio} (${inicioMinutos} min)`)
      console.log(`   Fin: ${horaFin} (${finMinutos} min)`)
      return NextResponse.json({ 
        error: `La hora de inicio (${horaInicio}) debe ser menor que la hora de fin (${horaFin})` 
      }, { status: 400 })
    }

    // Verificar permisos según el rol del usuario
    const idUsuario = decoded.userId || decoded.idUsuario
    const rolUsuario = decoded.rol
    
    console.log('👤 Verificando permisos para usuario:', idUsuario, 'con rol:', rolUsuario)
    
    let horario: any
    
    if (rolUsuario === 'ADMINISTRATIVO') {
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
      console.log('👨‍🏫 Usuario docente: verificando permisos específicos')
      
      const docente = await prisma.docente.findFirst({
        where: {
          idUsuario: idUsuario
        },
        include: {
          docenteAulas: true
        }
      })
      
      if (!docente) {
        console.log('❌ No se encontró información de docente para este usuario')
        return NextResponse.json({ 
          error: 'Usuario no es un docente válido' 
        }, { status: 403 })
      }
      
      console.log('✅ Docente encontrado:', docente.idDocente)
      
      // Obtener los grados-secciones asignados al docente
      const gradosSeccionesAsignados = docente.docenteAulas.map(da => da.idGradoSeccion)
      console.log('📋 Grados-Secciones asignados:', gradosSeccionesAsignados)
      
      // Buscar el horario que pertenezca al docente O a sus grados-secciones asignados
      horario = await prisma.horarioClase.findFirst({
        where: {
          idHorarioClase: parseInt(resolvedParams.id),
          OR: [
            { idDocente: docente.idDocente },
            { idGradoSeccion: { in: gradosSeccionesAsignados } }
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
      
      console.log('🔍 Horario encontrado:', horario ? `ID ${horario.idHorarioClase}` : 'No encontrado')
    }

    if (!horario) {
      console.log('❌ Horario no encontrado con esos criterios')
      return NextResponse.json({ 
        error: 'Horario no encontrado o no tienes permisos para modificarlo' 
      }, { status: 404 })
    }

    console.log('✅ Horario encontrado:')
    console.log(`Día: ${horario.diaSemana}, Docente ID: ${horario.idDocente}`)

    // Convertir horas de string a Date
    const convertirHoraADate = (hora: string): Date => {
      const [horas, minutos] = hora.split(':').map(Number)
      const date = new Date()
      date.setUTCHours(horas, minutos, 0, 0)
      return date
    }

    const horaInicioDate = convertirHoraADate(horaInicio)
    const horaFinDate = convertirHoraADate(horaFin)

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
