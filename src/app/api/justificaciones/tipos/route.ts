import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET /api/justificaciones/tipos - Obtener tipos de justificación
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const tipos = await prisma.tipoJustificacion.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: tipos
    })

  } catch (error) {
    console.error('Error obteniendo tipos de justificación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/justificaciones/tipos - Crear nuevo tipo de justificación
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const body = await request.json()
    const { nombre, codigo, requiereDocumento, diasMaximos } = body

    if (!nombre || !codigo) {
      return NextResponse.json(
        { error: 'Nombre y código son requeridos' },
        { status: 400 }
      )
    }

    const nuevoTipo = await prisma.tipoJustificacion.create({
      data: {
        nombre,
        codigo: codigo.toUpperCase(),
        requiereDocumento: requiereDocumento || false,
        diasMaximos
      }
    })

    return NextResponse.json({
      success: true,
      data: nuevoTipo,
      message: 'Tipo de justificación creado exitosamente'
    })

  } catch (error) {
    console.error('Error creando tipo de justificación:', error)
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Ya existe un tipo con ese nombre o código' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
