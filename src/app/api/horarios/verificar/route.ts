import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const userInfo = verifyToken(token)
    if (!userInfo) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const url = new URL(request.url)
    const claseId = url.searchParams.get('claseId')
    const diaSemana = url.searchParams.get('diaSemana')

    if (!claseId || !diaSemana) {
      return NextResponse.json({ 
        error: 'Parámetros requeridos: claseId, diaSemana' 
      }, { status: 400 })
    }

    console.log('🔍 Verificando horario:', { claseId, diaSemana })

    // Obtener el docente con su usuario
    const docente = await prisma.docente.findFirst({
      where: { idUsuario: userInfo.userId },
      include: { usuario: true }
    })

    if (!docente) {
      return NextResponse.json({ 
        error: 'Usuario no es docente' 
      }, { status: 403 })
    }

    // Verificar que la clase pertenece al docente
    const docenteAula = await prisma.docenteAula.findFirst({
      where: { 
        idDocenteAula: parseInt(claseId),
        idDocente: docente.idDocente
      }
    })

    if (!docenteAula) {
      return NextResponse.json({ 
        error: 'Clase no encontrada o no autorizada' 
      }, { status: 403 })
    }

    // Convertir día de semana a número
    const diasSemana: { [key: string]: number } = {
      'DOMINGO': 0,
      'LUNES': 1,
      'MARTES': 2,
      'MIERCOLES': 3,
      'JUEVES': 4,
      'VIERNES': 5,
      'SABADO': 6
    }
    
    const diaSemanaNum = diasSemana[diaSemana]
    
    if (diaSemanaNum === undefined) {
      return NextResponse.json({ 
        error: 'Día de semana inválido' 
      }, { status: 400 })
    }

    // Buscar si hay horario para ese día de la semana
    // Primero buscar por idGradoSeccion y diaSemana
    let horarioClase = await prisma.horarioClase.findFirst({
      where: {
        idGradoSeccion: docenteAula.idGradoSeccion,
        diaSemana: diaSemanaNum,
        activo: true
      }
    })

    // Si no se encuentra, buscar cualquier horario activo para ese grado/sección
    if (!horarioClase) {
      horarioClase = await prisma.horarioClase.findFirst({
        where: {
          idGradoSeccion: docenteAula.idGradoSeccion,
          activo: true
        }
      })
      console.log('⚠️ No se encontró horario para el día específico, usando horario general:', horarioClase?.idHorarioClase)
    }

    // Si aún no hay horario, usar la configuración de la IE
    if (!horarioClase) {
      const configuracion = await prisma.configuracionIE.findFirst({
        where: { idIe: docente.usuario?.idIe || 1 }
      })
      
      if (configuracion) {
        // Crear un horario virtual basado en la configuración
        const [horaInicioH, horaInicioM] = (configuracion.horaIngreso || '07:30').split(':').map(Number)
        const [horaFinH, horaFinM] = (configuracion.horaSalida || '13:00').split(':').map(Number)
        
        console.log(`📅 Usando configuración IE: ingreso=${configuracion.horaIngreso}, salida=${configuracion.horaSalida}`)
        
        return NextResponse.json({
          success: true,
          hayClase: true,
          diaSemana,
          idHorarioClase: null,
          idGradoSeccion: docenteAula.idGradoSeccion,
          horaInicio: new Date(Date.UTC(2000, 0, 1, horaInicioH, horaInicioM)).toISOString(),
          horaFin: new Date(Date.UTC(2000, 0, 1, horaFinH, horaFinM)).toISOString(),
          horario: `${configuracion.horaIngreso} - ${configuracion.horaSalida}`,
          fuenteHorario: 'configuracion_ie'
        })
      }
    }

    const hayClase = horarioClase !== null

    // Formatear horario para mostrar
    let horarioStr = 'No programado'
    if (horarioClase) {
      const horaInicioDate = new Date(horarioClase.horaInicio)
      const horaFinDate = new Date(horarioClase.horaFin)
      const formatHora = (d: Date) => {
        const h = d.getUTCHours()
        const m = d.getUTCMinutes()
        const periodo = h >= 12 ? 'pm' : 'am'
        const hora12 = h > 12 ? h - 12 : (h === 0 ? 12 : h)
        return `${hora12}:${String(m).padStart(2, '0')} ${periodo}`
      }
      horarioStr = `${formatHora(horaInicioDate)} - ${formatHora(horaFinDate)}`
    }

    console.log('✅ Verificación de horario:', { 
      diaSemana, 
      hayClase, 
      horario: horarioStr,
      idHorarioClase: horarioClase?.idHorarioClase
    })

    return NextResponse.json({
      success: true,
      hayClase,
      diaSemana,
      idHorarioClase: horarioClase?.idHorarioClase || null,
      idGradoSeccion: docenteAula.idGradoSeccion,
      horaInicio: horarioClase?.horaInicio || null,
      horaFin: horarioClase?.horaFin || null,
      horario: horarioStr
    })

  } catch (error) {
    console.error('❌ Error al verificar horario:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
