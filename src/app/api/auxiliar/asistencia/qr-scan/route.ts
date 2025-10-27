import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    console.log('📱 Validando código QR del auxiliar...')

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

    const body = await request.json()
    const { qrCode, accion: tipoAccion } = body

    if (!qrCode) {
      return NextResponse.json({ error: 'Código QR requerido' }, { status: 400 })
    }

    if (!tipoAccion || !['entrada', 'salida'].includes(tipoAccion)) {
      return NextResponse.json({ error: 'Acción requerida (entrada o salida)' }, { status: 400 })
    }

    console.log('🔍 Buscando estudiante con código QR:', qrCode)

    // Buscar estudiante por código QR
    const estudiante = await prisma.estudiante.findFirst({
      where: {
        codigoQR: qrCode,
        idIe: userInfo.idIe,
        usuario: {
          estado: 'ACTIVO'
        }
      },
      include: {
        usuario: true,
        gradoSeccion: {
          include: {
            grado: true,
            seccion: true
          }
        }
      }
    })

    if (!estudiante) {
      return NextResponse.json({ 
        error: 'Código QR no válido o estudiante no encontrado' 
      }, { status: 404 })
    }

    // Obtener fecha actual
    const ahora = new Date()
    const fechaHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())

    // Solo validar y retornar información del estudiante
    // NO guardar en la base de datos aquí
    console.log(`✅ Código QR válido - ${estudiante.usuario.nombre} ${estudiante.usuario.apellido}`)

    return NextResponse.json({
      success: true,
      mensaje: `✅ Código QR válido para ${estudiante.usuario.nombre} ${estudiante.usuario.apellido}`,
      estudiante: {
        id: estudiante.idEstudiante,
        nombre: estudiante.usuario.nombre,
        apellido: estudiante.usuario.apellido,
        dni: estudiante.usuario.dni,
        grado: estudiante.gradoSeccion?.grado?.nombre,
        seccion: estudiante.gradoSeccion?.seccion?.nombre,
        codigoQR: estudiante.codigoQR,
        accion: tipoAccion,
        hora: ahora.toTimeString().slice(0, 5)
      },
      timestamp: ahora.toISOString()
    })

  } catch (error) {
    console.error('❌ Error al validar código QR:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
