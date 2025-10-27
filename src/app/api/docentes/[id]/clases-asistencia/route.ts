import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// Función para convertir hora de 24h a 12h con AM/PM
function formatTo12Hour(hour24: number, minutes: number): string {
  const period = hour24 >= 12 ? 'pm' : 'am'
  const hour12 = hour24 % 12 || 12 // Convertir 0 a 12
  const minutesStr = String(minutes).padStart(2, '0')
  return `${hour12}:${minutesStr} ${period}`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 Obteniendo clases para asistencia...')
    
    // Verificar autenticación
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const userInfo = verifyToken(token)
    if (!userInfo) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { id } = await params
    const usuarioId = parseInt(id)

    console.log('👤 ID del usuario recibido:', usuarioId)

    // Buscar el docente por ID de usuario
    const docente = await prisma.docente.findFirst({
      where: { 
        idUsuario: usuarioId
      },
      include: {
        usuario: true
      }
    })

    if (!docente) {
      console.log('❌ No se encontró docente para usuario ID:', usuarioId)
      return NextResponse.json({ error: 'Docente no encontrado para este usuario' }, { status: 404 })
    }

    const docenteId = docente.idDocente
    console.log('👨‍🏫 ID del docente encontrado:', docenteId)

    // Obtener las aulas asignadas al docente
    const docenteAulas = await prisma.docenteAula.findMany({
      where: { idDocente: docenteId },
      include: {
        gradoSeccion: {
          include: {
            grado: true,
            seccion: true
          }
        },
        tipoAsignacion: true
      }
    })

    console.log('📚 Aulas encontradas para asistencia:', docenteAulas.length)

    // Transformar los datos para la respuesta con horarios
    const clases = await Promise.all(docenteAulas.map(async (docenteAula) => {
      const { gradoSeccion, tipoAsignacion } = docenteAula
      
      // Obtener el horario del grado-sección
      let horario = '8:30 am-1:30 pm' // Horario por defecto (8:30 a.m - 1:30 p.m)
      
      try {
        const horarioClase = await prisma.horarioClase.findFirst({
          where: {
            idGradoSeccion: gradoSeccion.idGradoSeccion,
            activo: true
          },
          orderBy: {
            diaSemana: 'asc'
          }
        })
        
        if (horarioClase) {
          // Log del objeto completo
          console.log('🔍 Objeto horarioClase completo:', horarioClase)
          
          // Extraer horas usando diferentes métodos para ver cuál funciona
          const horaInicioDate = new Date(horarioClase.horaInicio)
          const horaFinDate = new Date(horarioClase.horaFin)
          
          console.log('📅 Fechas completas:', {
            horaInicio: horarioClase.horaInicio,
            horaFin: horarioClase.horaFin,
            horaInicioDate,
            horaFinDate
          })
          
          // Método 1: toTimeString
          const metodo1Inicio = horarioClase.horaInicio.toTimeString().slice(0, 5)
          const metodo1Fin = horarioClase.horaFin.toTimeString().slice(0, 5)
          
          // Extraer horas y minutos en UTC
          const horaInicioHour = horaInicioDate.getUTCHours()
          const horaInicioMin = horaInicioDate.getUTCMinutes()
          const horaFinHour = horaFinDate.getUTCHours()
          const horaFinMin = horaFinDate.getUTCMinutes()
          
          console.log('🔧 Horas extraídas (UTC):', {
            inicio: `${horaInicioHour}:${horaInicioMin}`,
            fin: `${horaFinHour}:${horaFinMin}`
          })
          
          // Convertir a formato 12 horas con AM/PM
          const horaInicio12 = formatTo12Hour(horaInicioHour, horaInicioMin)
          const horaFin12 = formatTo12Hour(horaFinHour, horaFinMin)
          
          horario = `${horaInicio12}-${horaFin12}`
          console.log('✅ Horario FINAL asignado (12h):', horario)
        } else {
          console.log('⚠️ No se encontró horario en BD, usando default:', horario)
        }
      } catch (error) {
        console.error('Error obteniendo horario:', error)
      }
      
      return {
        id: docenteAula.idDocenteAula,
        nombre: `${tipoAsignacion.nombre} (${horario})`,
        grado: gradoSeccion.grado.nombre,
        seccion: gradoSeccion.seccion.nombre,
        tipoAsignacion: tipoAsignacion.nombre,
        horario: horario
      }
    }))

    console.log('✅ Clases para asistencia obtenidas exitosamente')
    return NextResponse.json({
      success: true,
      data: clases
    })

  } catch (error) {
    console.error('❌ Error al obtener clases para asistencia:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
