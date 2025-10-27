import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

/**
 * Verificar si se puede tomar asistencia en una fecha específica
 * 
 * Reglas:
 * - CLASES: Se puede tomar asistencia ✅
 * - FERIADO: NO se puede tomar asistencia ❌
 * - VACACIONES: NO se puede tomar asistencia ❌
 * - EVENTO: Depende del evento (por defecto SÍ) ✅
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const ieId = decoded.ieId || 1

    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get('fecha')

    if (!fecha) {
      return NextResponse.json({
        error: 'Fecha requerida (formato: YYYY-MM-DD)'
      }, { status: 400 })
    }

    const fechaBusqueda = new Date(fecha)
    
    // Buscar eventos que cubran esta fecha
    const eventos = await prisma.calendarioEscolar.findMany({
      where: {
        idIe: ieId,
        fechaInicio: { lte: fechaBusqueda },
        fechaFin: { gte: fechaBusqueda }
      },
      orderBy: {
        creadoEn: 'desc' // El más reciente tiene prioridad
      }
    })

    // Si no hay eventos, por defecto es día de clases
    if (eventos.length === 0) {
      return NextResponse.json({
        success: true,
        puedeTomarAsistencia: true,
        tipoDia: 'CLASES',
        mensaje: 'Día de clases normal',
        eventos: []
      })
    }

    // Tomar el evento más reciente (mayor prioridad)
    const eventoActivo = eventos[0]

    // Determinar si se puede tomar asistencia según el tipo
    let puedeTomarAsistencia = false
    let mensaje = ''

    switch (eventoActivo.tipoDia) {
      case 'CLASES':
        puedeTomarAsistencia = true
        mensaje = 'Día de clases normal'
        break
      
      case 'FERIADO':
        puedeTomarAsistencia = false
        mensaje = `Feriado: ${eventoActivo.descripcion || 'No se puede tomar asistencia'}`
        break
      
      case 'VACACIONES':
        puedeTomarAsistencia = false
        mensaje = `Vacaciones: ${eventoActivo.descripcion || 'No se puede tomar asistencia'}`
        break
      
      case 'EVENTO':
        puedeTomarAsistencia = true
        mensaje = `Evento especial: ${eventoActivo.descripcion || 'Se puede tomar asistencia'}`
        break
      
      default:
        puedeTomarAsistencia = true
        mensaje = 'Día normal'
    }

    return NextResponse.json({
      success: true,
      puedeTomarAsistencia,
      tipoDia: eventoActivo.tipoDia,
      mensaje,
      evento: {
        id: eventoActivo.idCalendario,
        fechaInicio: eventoActivo.fechaInicio,
        fechaFin: eventoActivo.fechaFin,
        tipoDia: eventoActivo.tipoDia,
        descripcion: eventoActivo.descripcion
      },
      eventos: eventos.map(e => ({
        id: e.idCalendario,
        tipoDia: e.tipoDia,
        descripcion: e.descripcion
      }))
    })

  } catch (error) {
    console.error('Error verificando asistencia:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
