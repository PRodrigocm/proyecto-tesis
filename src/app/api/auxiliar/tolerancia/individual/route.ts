import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function PUT(request: NextRequest) {
  try {
    console.log('🎯 Actualizando tolerancia individual...')

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
    const { aulaId, toleranciaMinutos } = body

    if (!aulaId) {
      return NextResponse.json({ 
        error: 'ID de aula requerido' 
      }, { status: 400 })
    }

    if (toleranciaMinutos === undefined || toleranciaMinutos < 0 || toleranciaMinutos > 60) {
      return NextResponse.json({ 
        error: 'Tolerancia debe estar entre 0 y 60 minutos' 
      }, { status: 400 })
    }

    const gradoSeccionId = parseInt(aulaId)
    if (isNaN(gradoSeccionId)) {
      return NextResponse.json({ 
        error: 'ID de aula inválido' 
      }, { status: 400 })
    }

    console.log(`🕐 Aplicando tolerancia ${toleranciaMinutos} minutos al aula ID: ${gradoSeccionId}`)

    // Verificar que el aula pertenece a la IE del auxiliar
    const aulaValida = await prisma.gradoSeccion.findUnique({
      where: { idGradoSeccion: gradoSeccionId },
      include: {
        grado: {
          include: {
            nivel: true
          }
        },
        seccion: true
      }
    })

    if (!aulaValida || aulaValida.grado.nivel.idIe !== ieId) {
      return NextResponse.json({ 
        error: 'Aula no encontrada o no pertenece a esta IE' 
      }, { status: 404 })
    }

    // Actualizar tolerancia de los horarios del aula específica
    const updateResult = await prisma.horarioClase.updateMany({
      where: {
        idGradoSeccion: gradoSeccionId,
        activo: true
      },
      data: {
        toleranciaMin: toleranciaMinutos,
        updatedAt: new Date()
      }
    })

    console.log(`✅ Tolerancia actualizada en ${updateResult.count} horarios del aula ${aulaValida.grado.nombre}° ${aulaValida.seccion.nombre}`)

    return NextResponse.json({
      success: true,
      message: `Tolerancia actualizada a ${toleranciaMinutos} minutos`,
      aula: {
        id: aulaValida.idGradoSeccion,
        grado: aulaValida.grado.nombre,
        seccion: aulaValida.seccion.nombre,
        nivel: aulaValida.grado.nivel.nombre
      },
      horariosActualizados: updateResult.count,
      toleranciaMinutos,
      actualizadoPor: {
        id: userInfo.idUsuario,
        nombre: `${userInfo.nombre} ${userInfo.apellido}`
      },
      fechaActualizacion: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error al actualizar tolerancia individual:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
