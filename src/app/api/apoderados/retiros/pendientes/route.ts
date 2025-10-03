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

    // Obtener retiros pendientes de aprobación
    const retirosPendientes = await prisma.retiro.findMany({
      where: {
        idEstudiante: {
          in: estudianteIds
        },
        estado: {
          in: ['SOLICITADO', 'EN_REVISION']
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
        solicitadoPorUsuario: true
      },
      orderBy: {
        fechaSolicitud: 'desc'
      }
    })

    const retiros = retirosPendientes.map(retiro => ({
      id: retiro.idRetiro.toString(),
      fecha: retiro.fecha.toISOString().split('T')[0],
      hora: retiro.hora,
      motivo: retiro.motivo,
      observaciones: retiro.observaciones || '',
      tipoRetiro: retiro.tipoRetiro,
      estado: retiro.estado,
      estudiante: {
        id: retiro.estudiante.idEstudiante.toString(),
        nombre: retiro.estudiante.usuario.nombre,
        apellido: retiro.estudiante.usuario.apellido,
        dni: retiro.estudiante.usuario.dni,
        grado: retiro.estudiante.gradoSeccion.grado.nombre,
        seccion: retiro.estudiante.gradoSeccion.seccion.nombre
      },
      solicitadoPor: `${retiro.solicitadoPorUsuario.nombre} ${retiro.solicitadoPorUsuario.apellido}`,
      fechaSolicitud: retiro.fechaSolicitud.toISOString()
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
  } finally {
    await prisma.$disconnect()
  }
}
