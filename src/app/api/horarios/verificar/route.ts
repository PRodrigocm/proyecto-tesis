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

    // Obtener el docente
    const docente = await prisma.docente.findFirst({
      where: { idUsuario: userInfo.userId }
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
    const horarioClase = await prisma.horarioClase.findFirst({
      where: {
        idGradoSeccion: docenteAula.idGradoSeccion,
        diaSemana: diaSemanaNum,
        activo: true
      }
    })

    const hayClase = horarioClase !== null

    console.log('✅ Verificación de horario:', { 
      diaSemana, 
      hayClase, 
      horario: horarioClase ? `${horarioClase.horaInicio} - ${horarioClase.horaFin}` : 'No programado'
    })

    return NextResponse.json({
      success: true,
      hayClase,
      diaSemana,
      horario: horarioClase ? {
        horaInicio: horarioClase.horaInicio,
        horaFin: horarioClase.horaFin
      } : null
    })

  } catch (error) {
    console.error('❌ Error al verificar horario:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
