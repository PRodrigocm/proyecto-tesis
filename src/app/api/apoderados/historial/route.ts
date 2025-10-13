import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { getEstudiantesDelApoderado, inicializarEstadosRetiro } from '@/lib/retiros-utils'

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

    // Inicializar estados de retiro si no existen
    await inicializarEstadosRetiro()

    // Obtener estudiantes del apoderado
    const estudianteIds = await getEstudiantesDelApoderado(decoded.userId)

    // Si no hay estudiantes, retornar historial vacío
    if (estudianteIds.length === 0) {
      return NextResponse.json({
        success: true,
        historial: []
      })
    }

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
        estadoRetiro: true,
        tipoRetiro: true,
        usuarioVerificador: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Convertir retiros al formato del historial
    const historialRetiros = retiros.map(retiro => ({
      id: `retiro_${retiro.idRetiro}`,
      tipo: 'RETIRO' as const,
      fecha: retiro.fecha.toISOString().split('T')[0],
      hora: retiro.hora.toISOString().split('T')[1].substring(0, 5),
      estudiante: {
        nombre: retiro.estudiante.usuario.nombre || '',
        apellido: retiro.estudiante.usuario.apellido || '',
        grado: retiro.estudiante.gradoSeccion?.grado.nombre || 'Sin grado',
        seccion: retiro.estudiante.gradoSeccion?.seccion.nombre || 'Sin sección'
      },
      estado: retiro.estadoRetiro?.nombre || 'Sin estado',
      estadoCodigo: retiro.estadoRetiro?.codigo || '',
      tipoRetiro: retiro.tipoRetiro?.nombre || 'No especificado',
      descripcion: retiro.observaciones || '',
      origen: retiro.origen || 'Sistema',
      fechaCreacion: retiro.createdAt.toISOString(),
      fechaActualizacion: retiro.updatedAt?.toISOString(),
      verificadoPor: retiro.usuarioVerificador ? 
        `${retiro.usuarioVerificador.nombre} ${retiro.usuarioVerificador.apellido}` : 
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
