import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function PUT(request: NextRequest) {
  try {
    console.log('🎯 Actualizando tolerancia de aulas seleccionadas...')

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
    const { aulaIds, toleranciaMinutos } = body

    if (!aulaIds || !Array.isArray(aulaIds) || aulaIds.length === 0) {
      return NextResponse.json({ 
        error: 'Debe proporcionar al menos un ID de aula' 
      }, { status: 400 })
    }

    if (toleranciaMinutos === undefined || toleranciaMinutos < 0 || toleranciaMinutos > 60) {
      return NextResponse.json({ 
        error: 'Tolerancia debe estar entre 0 y 60 minutos' 
      }, { status: 400 })
    }

    console.log(`🕐 Aplicando tolerancia ${toleranciaMinutos} minutos a ${aulaIds.length} aulas seleccionadas`)

    // Convertir IDs a números
    const gradoSeccionIds = aulaIds.map(id => parseInt(id)).filter(id => !isNaN(id))

    if (gradoSeccionIds.length === 0) {
      return NextResponse.json({ 
        error: 'IDs de aula inválidos' 
      }, { status: 400 })
    }

    // Verificar que las aulas pertenecen a la IE del auxiliar
    const aulasValidas = await prisma.gradoSeccion.findMany({
      where: {
        idGradoSeccion: {
          in: gradoSeccionIds
        },
        grado: {
          nivel: {
            ie: {
              idIe: ieId
            }
          }
        }
      },
      include: {
        grado: true,
        seccion: true
      }
    })

    if (aulasValidas.length !== gradoSeccionIds.length) {
      return NextResponse.json({ 
        error: 'Algunas aulas no pertenecen a esta IE o no existen' 
      }, { status: 403 })
    }

    // Actualizar tolerancia de los horarios de las aulas seleccionadas
    const updateResult = await prisma.horarioClase.updateMany({
      where: {
        idGradoSeccion: {
          in: gradoSeccionIds
        },
        activo: true
      },
      data: {
        toleranciaMin: toleranciaMinutos,
        updatedAt: new Date()
      }
    })

    console.log(`✅ Tolerancia actualizada en ${updateResult.count} horarios de ${aulasValidas.length} aulas`)

    // Obtener nombres de las aulas actualizadas para el log
    const aulasActualizadas = aulasValidas.map(aula => 
      `${aula.grado.nombre}° ${aula.seccion.nombre}`
    )

    return NextResponse.json({
      success: true,
      message: `Tolerancia actualizada a ${toleranciaMinutos} minutos en aulas seleccionadas`,
      aulasActualizadas: updateResult.count,
      toleranciaMinutos,
      aulas: aulasActualizadas,
      actualizadoPor: {
        id: userInfo.idUsuario,
        nombre: `${userInfo.nombre} ${userInfo.apellido}`
      },
      fechaActualizacion: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error al actualizar tolerancia de aulas seleccionadas:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
