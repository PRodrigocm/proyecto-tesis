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

    const estudiantes = estudiantesApoderado.map(ea => ({
      id: ea.estudiante.idEstudiante.toString(),
      nombre: ea.estudiante.usuario.nombre,
      apellido: ea.estudiante.usuario.apellido,
      dni: ea.estudiante.usuario.dni,
      grado: ea.estudiante.gradoSeccion.grado.nombre,
      seccion: ea.estudiante.gradoSeccion.seccion.nombre,
      codigoEstudiante: ea.estudiante.codigoEstudiante,
      relacion: ea.relacion,
      esTitular: ea.esTitular
    }))

    return NextResponse.json({
      success: true,
      estudiantes
    })

  } catch (error) {
    console.error('Error fetching estudiantes del apoderado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
