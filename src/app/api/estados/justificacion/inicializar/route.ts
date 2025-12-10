import { NextRequest, NextResponse } from 'next/server'
import { inicializarEstadosJustificacion, inicializarTiposJustificacion } from '@/lib/justificaciones-utils'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

/**
 * POST /api/estados/justificacion/inicializar
 * Inicializa los estados y tipos de justificación en la BD
 * Solo accesible por administradores
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: any
    
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Verificar que sea administrador
    if (decoded.rol !== 'ADMINISTRATIVO') {
      return NextResponse.json({ 
        error: 'Solo los administradores pueden inicializar estados' 
      }, { status: 403 })
    }

    console.log('🚀 Iniciando inicialización de estados y tipos de justificación...')

    // Primero, obtener todos los estados para mostrar qué hay
    const estadosAntesRaw = await prisma.estadoJustificacion.findMany()
    console.log('📊 Estados ANTES de limpiar:', estadosAntesRaw.map(e => `${e.codigo} (${e.nombre}) - activo: ${e.activo}`))

    // Inicializar estados (esto desactiva duplicados y crea los correctos)
    await inicializarEstadosJustificacion()

    // Inicializar tipos
    await inicializarTiposJustificacion()

    // Mostrar estados después
    const estadosDespues = await prisma.estadoJustificacion.findMany({
      where: { activo: true }
    })
    console.log('✅ Estados DESPUÉS de limpiar:', estadosDespues.map(e => `${e.codigo} (${e.nombre})`))

    return NextResponse.json({
      success: true,
      message: 'Estados y tipos de justificación inicializados correctamente',
      data: {
        estadosActivos: estadosDespues.length,
        estados: estadosDespues.map(e => ({ codigo: e.codigo, nombre: e.nombre }))
      }
    })

  } catch (error) {
    console.error('❌ Error al inicializar estados:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
