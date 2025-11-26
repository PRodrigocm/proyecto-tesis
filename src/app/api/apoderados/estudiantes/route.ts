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

    console.log('🔍 Token decoded:', decoded)
    console.log('🔍 User ID:', decoded.userId || decoded.idUsuario || decoded.id)
    console.log('🔍 Rol:', decoded.rol)

    if (decoded.rol !== 'APODERADO') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Obtener el ID del usuario (puede venir como userId, idUsuario o id)
    const apoderadoUserId = decoded.userId || decoded.idUsuario || decoded.id

    console.log('🔍 Buscando apoderado con usuario ID:', apoderadoUserId)

    // Primero buscar el apoderado por idUsuario
    const apoderado = await prisma.apoderado.findFirst({
      where: {
        idUsuario: apoderadoUserId
      }
    })

    console.log('🔍 Apoderado encontrado:', apoderado)

    if (!apoderado) {
      return NextResponse.json({ 
        error: 'No se encontró el apoderado',
        debug: { apoderadoUserId, decoded }
      }, { status: 404 })
    }

    // Obtener estudiantes del apoderado
    const estudiantesApoderado = await prisma.estudianteApoderado.findMany({
      where: {
        idApoderado: apoderado.idApoderado
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
      grado: ea.estudiante.gradoSeccion?.grado.nombre,
      seccion: ea.estudiante.gradoSeccion?.seccion.nombre,
      codigoEstudiante: ea.estudiante.codigoQR || ea.estudiante.usuario.dni,
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
  }
}
