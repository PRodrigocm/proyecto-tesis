import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

// GET - Obtener calendario escolar
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const fecha = searchParams.get('fecha')

    // Verificar token
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const ieId = decoded.ieId || 1

    let whereClause: any = { idIe: ieId }

    if (year) {
      const startDate = new Date(`${year}-01-01`)
      const endDate = new Date(`${year}-12-31`)
      whereClause.OR = [
        {
          fechaInicio: {
            gte: startDate,
            lte: endDate
          }
        },
        {
          fechaFin: {
            gte: startDate,
            lte: endDate
          }
        }
      ]
    }

    if (fecha) {
      const fechaBuscada = new Date(fecha)
      whereClause.AND = [
        { fechaInicio: { lte: fechaBuscada } },
        { fechaFin: { gte: fechaBuscada } }
      ]
    }

    const calendarioItems = await prisma.calendarioEscolar.findMany({
      where: whereClause,
      orderBy: { fechaInicio: 'asc' }
    })

    // Expandir rangos de fechas a días individuales
    const transformedItems: any[] = []
    calendarioItems.forEach(item => {
      const inicio = new Date(item.fechaInicio)
      const fin = new Date(item.fechaFin)
      
      // Determinar si es lectivo basado en tipoDia
      const esLectivo = item.tipoDia === 'CLASES' || item.tipoDia === 'EVENTO'
      
      // Iterar por cada día en el rango
      const currentDate = new Date(inicio)
      while (currentDate <= fin) {
        transformedItems.push({
          idCalendario: item.idCalendario,
          fecha: currentDate.toISOString().split('T')[0],
          esLectivo,
          motivo: item.descripcion || item.tipoDia,
          tipoDia: item.tipoDia
        })
        currentDate.setDate(currentDate.getDate() + 1)
      }
    })

    return NextResponse.json({
      success: true,
      data: transformedItems
    })

  } catch (error) {
    console.error('Error fetching calendario escolar:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear entrada en calendario escolar
export async function POST(request: NextRequest) {
  try {
    console.log('📅 POST /api/calendario-escolar - Iniciando')
    const body = await request.json()
    console.log('📋 Body recibido:', body)
    const { fecha, esLectivo, motivo } = body

    // Verificar token
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    console.log('🔑 Token recibido:', token ? 'Sí' : 'No')
    if (!token) {
      console.log('❌ Token faltante')
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    console.log('🔐 JWT_SECRET disponible:', process.env.JWT_SECRET ? 'Sí' : 'No')
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const ieId = decoded.ieId || 1
    console.log('🏫 IE ID extraído:', ieId)

    // Validar campos requeridos
    if (!fecha) {
      return NextResponse.json({ error: 'Fecha es requerida' }, { status: 400 })
    }

    // Verificar si ya existe una entrada para esta fecha
    console.log('🔍 Buscando entrada existente para fecha:', fecha, 'IE:', ieId)
    const fechaBusqueda = new Date(fecha)
    const existingEntry = await prisma.calendarioEscolar.findFirst({
      where: {
        idIe: ieId,
        fechaInicio: {
          lte: fechaBusqueda
        },
        fechaFin: {
          gte: fechaBusqueda
        }
      }
    })
    console.log('📋 Entrada existente encontrada:', existingEntry ? 'Sí' : 'No')

    if (existingEntry) {
      // Actualizar entrada existente
      console.log('🔄 Actualizando entrada existente con ID:', existingEntry.idCalendario)
      const updatedEntry = await prisma.calendarioEscolar.update({
        where: { idCalendario: existingEntry.idCalendario },
        data: {
          tipoDia: esLectivo ? 'CLASES' : 'FERIADO',
          descripcion: motivo || null
        }
      })
      console.log('✅ Entrada actualizada exitosamente:', updatedEntry)

      return NextResponse.json({
        success: true,
        message: 'Entrada actualizada exitosamente',
        data: {
          fechaInicio: updatedEntry.fechaInicio.toISOString().split('T')[0],
          fechaFin: updatedEntry.fechaFin.toISOString().split('T')[0],
          tipoDia: updatedEntry.tipoDia,
          descripcion: updatedEntry.descripcion
        }
      })
    } else {
      // Crear nueva entrada
      console.log('➕ Creando nueva entrada para:', { idIe: ieId, fecha: new Date(fecha), esLectivo: esLectivo ?? true, motivo })
      const fechaDate = new Date(fecha)
      const newEntry = await prisma.calendarioEscolar.create({
        data: {
          idIe: ieId,
          fechaInicio: fechaDate,
          fechaFin: fechaDate,
          tipoDia: esLectivo ? 'CLASES' : 'FERIADO',
          descripcion: motivo || null
        }
      })
      console.log('✅ Nueva entrada creada exitosamente:', newEntry)

      return NextResponse.json({
        success: true,
        message: 'Entrada creada exitosamente',
        data: {
          fechaInicio: newEntry.fechaInicio.toISOString().split('T')[0],
          fechaFin: newEntry.fechaFin.toISOString().split('T')[0],
          tipoDia: newEntry.tipoDia,
          descripcion: newEntry.descripcion
        }
      })
    }

  } catch (error) {
    console.error('Error creating calendario escolar entry:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar entrada del calendario escolar
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get('fecha')

    if (!fecha) {
      return NextResponse.json({ error: 'Fecha es requerida' }, { status: 400 })
    }

    // Verificar token
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const ieId = decoded.ieId || 1

    // Eliminar entrada
    const fechaDate = new Date(fecha)
    await prisma.calendarioEscolar.deleteMany({
      where: {
        idIe: ieId,
        fechaInicio: {
          lte: fechaDate
        },
        fechaFin: {
          gte: fechaDate
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Entrada eliminada exitosamente'
    })

  } catch (error) {
    console.error('Error deleting calendario escolar entry:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
