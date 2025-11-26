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
                esTitular: true // Solo apoderados titulares pueden aprobar
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
        { error: 'No tiene permisos para aprobar este retiro' },
        { status: 403 }
      )
    }

    // Aprobar el retiro
    const retiroAprobado = await prisma.retiro.update({
      where: {
        idRetiro: retiroId
      },
      data: {
        verificadoPor: decoded.userId,
        observaciones: 'Aprobado por apoderado'
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
      message: 'Retiro aprobado exitosamente',
      retiro: {
        id: retiroAprobado.idRetiro.toString(),
        fecha: retiroAprobado.fecha.toISOString().split('T')[0],
        hora: retiroAprobado.hora.toTimeString().slice(0, 5)
      }
    })

  } catch (error) {
    console.error('Error approving retiro:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
