import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

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

    const estudianteIds = estudiantesApoderado.map(ea => ea.estudiante.idEstudiante)

    // Obtener historial de retiros
    const retiros = await prisma.retiro.findMany({
      where: {
        idEstudiante: {
          in: estudianteIds
        }
      },
      include: {
        estudiante: {
          include: {
            usuario: true,
            gradoSeccion: {
              include: {
                grado: true,
                seccion: true
              }
            }
          }
        },
        aprobadoPorUsuario: true
      },
      orderBy: {
        fechaSolicitud: 'desc'
      }
    })

    // Convertir retiros al formato del historial
    const historialRetiros = retiros.map(retiro => ({
      id: `retiro_${retiro.idRetiro}`,
      tipo: 'RETIRO' as const,
      fecha: retiro.fecha.toISOString().split('T')[0],
      estudiante: {
        nombre: retiro.estudiante.usuario.nombre,
        apellido: retiro.estudiante.usuario.apellido,
        grado: retiro.estudiante.gradoSeccion.grado.nombre,
        seccion: retiro.estudiante.gradoSeccion.seccion.nombre
      },
      estado: retiro.estado,
      motivo: retiro.motivo,
      descripcion: retiro.observaciones,
      fechaCreacion: retiro.fechaSolicitud.toISOString(),
      fechaAprobacion: retiro.fechaAprobacion?.toISOString(),
      aprobadoPor: retiro.aprobadoPorUsuario ? 
        `${retiro.aprobadoPorUsuario.nombre} ${retiro.aprobadoPorUsuario.apellido}` : 
        undefined
    }))

    // TODO: Agregar historial de justificaciones cuando se implemente la tabla
    const historialJustificaciones: any[] = []

    // Combinar y ordenar todo el historial
    const historialCompleto = [...historialRetiros, ...historialJustificaciones]
      .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime())

    return NextResponse.json({
      success: true,
      historial: historialCompleto
    })

  } catch (error) {
    console.error('Error fetching historial del apoderado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
