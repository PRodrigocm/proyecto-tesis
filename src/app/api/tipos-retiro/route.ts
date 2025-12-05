import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

/**
 * GET - Obtener todos los tipos de retiro
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    
    try {
      jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    } catch (jwtError) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Obtener tipos de retiro
    const tiposRetiro = await prisma.tipoRetiro.findMany({
      orderBy: { nombre: 'asc' }
    })

    // Si no hay tipos de retiro, crear los predeterminados
    if (tiposRetiro.length === 0) {
      const tiposPredeterminados = [
        { nombre: 'Médico' },
        { nombre: 'Familiar' },
        { nombre: 'Personal' },
        { nombre: 'Emergencia' },
        { nombre: 'Otro' }
      ]

      for (const tipo of tiposPredeterminados) {
        await prisma.tipoRetiro.create({
          data: tipo
        })
      }

      // Volver a obtener los tipos creados
      const tiposCreados = await prisma.tipoRetiro.findMany({
        orderBy: { nombre: 'asc' }
      })

      return NextResponse.json({
        success: true,
        data: tiposCreados.map(t => ({
          id: t.idTipoRetiro.toString(),
          nombre: t.nombre
        }))
      })
    }

    return NextResponse.json({
      success: true,
      data: tiposRetiro.map(t => ({
        id: t.idTipoRetiro.toString(),
        nombre: t.nombre
      }))
    })

  } catch (error) {
    console.error('Error fetching tipos retiro:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
