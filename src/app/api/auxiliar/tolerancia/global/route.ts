import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function PUT(request: NextRequest) {
  try {
    console.log('🌐 Actualizando tolerancia global...')

    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    } catch (jwtError) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const userId = decoded.userId
    const userInfo = await prisma.usuario.findUnique({
      where: { idUsuario: userId },
      include: { ie: true }
    })

    if (!userInfo || !['AUXILIAR', 'ADMINISTRATIVO'].includes(decoded.rol)) {
      return NextResponse.json({ error: 'Sin permisos de auxiliar' }, { status: 403 })
    }

    const ieId = userInfo.idIe
    if (!ieId) {
      return NextResponse.json({ error: 'Usuario sin IE asignada' }, { status: 400 })
    }

    const body = await request.json()
    const { toleranciaMinutos } = body

    if (toleranciaMinutos === undefined || toleranciaMinutos < 0 || toleranciaMinutos > 60) {
      return NextResponse.json({ 
        error: 'Tolerancia debe estar entre 0 y 60 minutos' 
      }, { status: 400 })
    }

    console.log(`🕐 Aplicando tolerancia global: ${toleranciaMinutos} minutos`)

    // Actualizar todos los horarios de clase de la IE
    const updateResult = await prisma.horarioClase.updateMany({
      where: {
        gradoSeccion: {
          grado: {
            nivel: {
              ie: {
                idIe: ieId
              }
            }
          }
        },
        activo: true
      },
      data: {
        toleranciaMin: toleranciaMinutos,
        updatedAt: new Date()
      }
    })

    console.log(`✅ Tolerancia global actualizada en ${updateResult.count} horarios`)

    return NextResponse.json({
      success: true,
      message: `Tolerancia global actualizada a ${toleranciaMinutos} minutos`,
      aulasActualizadas: updateResult.count,
      toleranciaMinutos,
      actualizadoPor: {
        id: userInfo.idUsuario,
        nombre: `${userInfo.nombre} ${userInfo.apellido}`
      },
      fechaActualizacion: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error al actualizar tolerancia global:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
