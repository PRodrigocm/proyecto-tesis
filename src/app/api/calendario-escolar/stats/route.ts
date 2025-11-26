import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

// GET - Obtener estadísticas del calendario escolar
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year') || new Date().getFullYear().toString()

    // Verificar token
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const ieId = decoded.ieId || 1

    const startDate = new Date(`${year}-01-01`)
    const endDate = new Date(`${year}-12-31`)

    // Contar días lectivos en calendario escolar
    const diasLectivos = await prisma.calendarioEscolar.count({
      where: {
        idIe: ieId,
        fechaInicio: {
          gte: startDate,
          lte: endDate
        },
        tipoDia: 'CLASES'
      }
    })

    // Contar feriados
    const feriados = await prisma.calendarioEscolar.count({
      where: {
        idIe: ieId,
        fechaInicio: {
          gte: startDate,
          lte: endDate
        },
        tipoDia: 'FERIADO'
      }
    })

    // Contar vacaciones
    const vacaciones = await prisma.calendarioEscolar.count({
      where: {
        idIe: ieId,
        fechaInicio: {
          gte: startDate,
          lte: endDate
        },
        tipoDia: 'VACACIONES'
      }
    })

    const suspensiones = 0 // No hay modelo de suspensiones

    // Calcular días totales del año
    const isLeapYear = (parseInt(year) % 4 === 0 && parseInt(year) % 100 !== 0) || (parseInt(year) % 400 === 0)
    const totalDias = isLeapYear ? 366 : 365

    // Calcular días de fin de semana
    let weekendDays = 0
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        weekendDays++
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Días hábiles potenciales (excluyendo fines de semana)
    const diasHabiles = totalDias - weekendDays

    // Días efectivos de clase (días hábiles - feriados - suspensiones)
    const diasEfectivos = Math.max(0, diasHabiles - feriados - suspensiones)

    const stats = {
      diasLectivos: diasLectivos || diasEfectivos, // Si no hay datos específicos, usar cálculo
      feriados,
      suspensiones,
      totalDias,
      diasHabiles,
      diasEfectivos,
      weekendDays,
      // Porcentajes
      porcentajeLectivos: diasHabiles > 0 ? Math.round((diasEfectivos / diasHabiles) * 100) : 0,
      // Información adicional
      vacaciones
    }

    console.log(`📊 Estadísticas calendario ${year}:`, stats)

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Error fetching calendario stats:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
