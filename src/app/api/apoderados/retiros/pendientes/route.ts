import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { getEstudiantesDelApoderado, getEstadosRetiroIds, inicializarEstadosRetiro } from '@/lib/retiros-utils'

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

    // Si no hay estudiantes asociados, retornar lista vacía
    if (estudianteIds.length === 0) {
      return NextResponse.json({
        success: true,
        retiros: []
      })
    }

    // Obtener los IDs de estados pendientes
    const estadosPendientesIds = await getEstadosRetiroIds(['SOLICITADO', 'EN_REVISION'])

    // Obtener retiros pendientes de aprobación
    const retirosPendientes = await prisma.retiro.findMany({
      where: {
        idEstudiante: {
          in: estudianteIds
        },
        idEstadoRetiro: {
          in: estadosPendientesIds
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
        tipoRetiro: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const retiros = retirosPendientes.map((retiro: typeof retirosPendientes[number]) => ({
      id: retiro.idRetiro.toString(),
      fecha: retiro.fecha.toISOString().split('T')[0],
      hora: retiro.hora.toISOString().split('T')[1].substring(0, 5), // Formato HH:MM
      observaciones: retiro.observaciones || '',
      tipoRetiro: retiro.tipoRetiro?.nombre || 'No especificado',
      estado: retiro.estadoRetiro?.nombre || 'Sin estado',
      estadoCodigo: retiro.estadoRetiro?.codigo || '',
      estudiante: {
        id: retiro.estudiante.idEstudiante.toString(),
        nombre: retiro.estudiante.usuario.nombre || '',
        apellido: retiro.estudiante.usuario.apellido || '',
        dni: retiro.estudiante.usuario.dni,
        grado: retiro.estudiante.gradoSeccion?.grado.nombre || 'Sin grado',
        seccion: retiro.estudiante.gradoSeccion?.seccion.nombre || 'Sin sección'
      },
      fechaSolicitud: retiro.createdAt.toISOString(),
      origen: retiro.origen || 'Sistema'
    }))

    return NextResponse.json({
      success: true,
      retiros
    })

  } catch (error) {
    console.error('Error fetching retiros pendientes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
