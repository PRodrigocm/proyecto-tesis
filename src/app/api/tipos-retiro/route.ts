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
        { nombre: 'Cita médica' },
        { nombre: 'Emergencia familiar' },
        { nombre: 'Malestar del estudiante' },
        { nombre: 'Retiro temprano autorizado' },
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

    // Filtrar tipos duplicados o similares - mantener solo los principales
    // Mapeo de tipos a consolidar (variantes -> tipo principal)
    const tiposConsolidados = new Map<string, { id: string; nombre: string }>()
    
    // Función para normalizar y categorizar tipos
    const categorizarTipo = (nombre: string): string => {
      const nombreLower = nombre.toLowerCase()
      
      if (nombreLower.includes('médic') || nombreLower.includes('medic') || nombreLower.includes('cita')) {
        return 'Cita médica'
      }
      if (nombreLower.includes('emergencia') && !nombreLower.includes('familiar')) {
        return 'Emergencia familiar'
      }
      if (nombreLower.includes('familiar') || nombreLower.includes('emergencia')) {
        return 'Emergencia familiar'
      }
      if (nombreLower.includes('malestar')) {
        return 'Malestar del estudiante'
      }
      if (nombreLower.includes('temprano') || nombreLower.includes('autorizado')) {
        return 'Retiro temprano autorizado'
      }
      if (nombreLower.includes('personal')) {
        return 'Personal'
      }
      if (nombreLower.includes('extracurricular') || nombreLower.includes('actividad')) {
        return 'Actividad extracurricular'
      }
      if (nombreLower === 'otro' || nombreLower === 'otros') {
        return 'Otro'
      }
      
      // Si no coincide con ninguna categoría, mantener el nombre original
      return nombre
    }
    
    // Consolidar tipos
    for (const tipo of tiposRetiro) {
      const categoria = categorizarTipo(tipo.nombre)
      
      // Solo agregar si no existe ya esta categoría
      if (!tiposConsolidados.has(categoria)) {
        tiposConsolidados.set(categoria, {
          id: tipo.idTipoRetiro.toString(),
          nombre: categoria
        })
      }
    }
    
    // Convertir a array y ordenar
    const tiposFiltrados = Array.from(tiposConsolidados.values())
      .sort((a, b) => a.nombre.localeCompare(b.nombre))

    return NextResponse.json({
      success: true,
      data: tiposFiltrados
    })

  } catch (error) {
    console.error('Error fetching tipos retiro:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
