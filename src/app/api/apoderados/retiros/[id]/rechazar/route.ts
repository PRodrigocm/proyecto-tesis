import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const retiroId = parseInt(id)
    const body = await request.json()
    const { motivo } = body

    if (!motivo) {
      return NextResponse.json(
        { error: 'El motivo del rechazo es requerido' },
        { status: 400 }
      )
    }

    // Verificar que el retiro existe y pertenece a un estudiante del apoderado
    const retiro = await prisma.retiro.findFirst({
      where: {
        idRetiro: retiroId
      },
      include: {
        estudiante: {
          include: {
            apoderados: {
              where: {
                idApoderado: decoded.userId,
                esTitular: true // Solo apoderados titulares pueden rechazar
              }
            }
          }
        }
      }
    })

    if (!retiro) {
      return NextResponse.json(
        { error: 'Retiro no encontrado' },
        { status: 404 }
      )
    }

    if (retiro.estudiante.apoderados.length === 0) {
      return NextResponse.json(
        { error: 'No tiene permisos para rechazar este retiro' },
        { status: 403 }
      )
    }

    // Rechazar el retiro
    const retiroRechazado = await prisma.retiro.update({
      where: {
        idRetiro: retiroId
      },
      data: {
        observaciones: `${retiro.observaciones || ''}\n\nMotivo del rechazo: ${motivo}`.trim()
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
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Retiro rechazado',
      retiro: {
        id: retiroRechazado.idRetiro.toString(),
        fecha: retiroRechazado.fecha.toISOString().split('T')[0],
        hora: retiroRechazado.hora.toTimeString().slice(0, 5),
        motivo: motivo
      }
    })

  } catch (error) {
    console.error('Error rejecting retiro:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
