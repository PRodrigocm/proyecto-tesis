import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    if (decoded.rol !== 'APODERADO') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Obtener estudiantes del apoderado
    const estudiantesApoderado = await prisma.estudianteApoderado.findMany({
      where: {
        idApoderado: decoded.userId
      },
      include: {
        estudiante: true
      }
    })

    // Por ahora simulamos las configuraciones ya que no existe la tabla en el esquema
    // TODO: Crear tabla de configuraciones de notificaciones
    const configuracionesSimuladas = estudiantesApoderado.map(ea => ({
      estudianteId: ea.estudiante.idEstudiante.toString(),
      entradaIE: {
        email: true,
        telefono: false
      },
      salidaIE: {
        email: true,
        telefono: true
      },
      asistenciaAulas: {
        email: false,
        telefono: false
      },
      asistenciaTalleres: {
        email: false,
        telefono: false
      }
    }))

    return NextResponse.json({
      success: true,
      configuraciones: configuracionesSimuladas
    })

  } catch (error) {
    console.error('Error fetching notification config:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    if (decoded.rol !== 'APODERADO') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { estudianteId, entradaIE, salidaIE, asistenciaAulas, asistenciaTalleres } = body

    // Verificar que el estudiante pertenece al apoderado
    const estudianteApoderado = await prisma.estudianteApoderado.findFirst({
      where: {
        idApoderado: decoded.userId,
        idEstudiante: parseInt(estudianteId)
      }
    })

    if (!estudianteApoderado) {
      return NextResponse.json(
        { error: 'No tiene permisos para configurar notificaciones de este estudiante' },
        { status: 403 }
      )
    }

    // TODO: Implementar guardado real en base de datos
    // Por ahora simulamos que se guardó correctamente
    console.log('Configuración de notificaciones actualizada:', {
      apoderadoId: decoded.userId,
      estudianteId,
      entradaIE,
      salidaIE,
      asistenciaAulas,
      asistenciaTalleres
    })

    return NextResponse.json({
      success: true,
      message: 'Configuración de notificaciones actualizada exitosamente'
    })

  } catch (error) {
    console.error('Error updating notification config:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
