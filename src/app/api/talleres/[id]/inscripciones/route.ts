import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🔍 GET /api/talleres/[id]/inscripciones - Obteniendo inscripciones del taller:', id)

    // Obtener ieId del token de usuario
    const authHeader = request.headers.get('authorization')
    let ieId = 1 // Default
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
        ieId = decoded.ieId || 1
      } catch (error) {
        console.log('⚠️ Error decoding token, using default ieId:', ieId)
      }
    }

    // Verificar que el taller existe y pertenece a la IE
    const taller = await prisma.taller.findFirst({
      where: {
        idTaller: parseInt(id),
        idIe: ieId
      }
    })

    if (!taller) {
      return NextResponse.json(
        { error: 'Taller no encontrado' },
        { status: 404 }
      )
    }

    const inscripciones = await prisma.inscripcionTaller.findMany({
      where: {
        idTaller: parseInt(id)
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
      },
      orderBy: [
        { fechaInscripcion: 'desc' }
      ]
    })

    const transformedData = inscripciones.map(inscripcion => ({
      id: inscripcion.estudiante.idEstudiante.toString(),
      nombre: inscripcion.estudiante.usuario.nombre,
      apellido: inscripcion.estudiante.usuario.apellido,
      dni: inscripcion.estudiante.usuario.dni,
      grado: inscripcion.estudiante.gradoSeccion?.grado?.nombre || '',
      seccion: inscripcion.estudiante.gradoSeccion?.seccion?.nombre || '',
      fechaInscripcion: inscripcion.fechaInscripcion.toISOString(),
      estado: inscripcion.estado,
      anio: inscripcion.anio
    }))

    console.log(`✅ Enviando ${transformedData.length} inscripciones`)

    return NextResponse.json({
      success: true,
      data: transformedData,
      total: transformedData.length
    })

  } catch (error) {
    console.error('Error fetching inscripciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('📝 POST /api/talleres/[id]/inscripciones - Inscribiendo estudiante al taller:', id)

    // Obtener ieId del token de usuario
    const authHeader = request.headers.get('authorization')
    let ieId = 1 // Default
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
        ieId = decoded.ieId || 1
      } catch (error) {
        console.log('⚠️ Error decoding token, using default ieId:', ieId)
      }
    }

    const body = await request.json()
    const { estudianteId } = body

    if (!estudianteId) {
      return NextResponse.json(
        { error: 'El ID del estudiante es requerido' },
        { status: 400 }
      )
    }

    // Verificar que el taller existe y pertenece a la IE
    const taller = await prisma.taller.findFirst({
      where: {
        idTaller: parseInt(id),
        idIe: ieId,
        activo: true
      },
      include: {
        inscripciones: {
          where: {
            estado: 'activa'
          }
        }
      }
    })

    if (!taller) {
      return NextResponse.json(
        { error: 'Taller no encontrado o inactivo' },
        { status: 404 }
      )
    }

    // Verificar capacidad máxima
    if (taller.capacidadMaxima && taller.inscripciones.length >= taller.capacidadMaxima) {
      return NextResponse.json(
        { error: 'El taller ha alcanzado su capacidad máxima' },
        { status: 400 }
      )
    }

    // Verificar que el estudiante existe y pertenece a la IE
    const estudiante = await prisma.estudiante.findFirst({
      where: {
        idEstudiante: parseInt(estudianteId),
        usuario: {
          idIe: ieId
        }
      },
      include: {
        usuario: true
      }
    })

    if (!estudiante) {
      return NextResponse.json(
        { error: 'Estudiante no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si ya está inscrito
    const inscripcionExistente = await prisma.inscripcionTaller.findFirst({
      where: {
        idEstudiante: parseInt(estudianteId),
        idTaller: parseInt(id),
        anio: new Date().getFullYear(),
        estado: 'activa'
      }
    })

    if (inscripcionExistente) {
      return NextResponse.json(
        { error: 'El estudiante ya está inscrito en este taller' },
        { status: 400 }
      )
    }

    // Crear la inscripción
    const nuevaInscripcion = await prisma.inscripcionTaller.create({
      data: {
        idEstudiante: parseInt(estudianteId),
        idTaller: parseInt(id),
        anio: new Date().getFullYear(),
        fechaInscripcion: new Date(),
        estado: 'activa'
      }
    })

    console.log('✅ Estudiante inscrito exitosamente:', nuevaInscripcion.idInscripcion)

    return NextResponse.json({
      success: true,
      message: `Estudiante ${estudiante.usuario.nombre} ${estudiante.usuario.apellido} inscrito exitosamente`,
      data: {
        inscripcionId: nuevaInscripcion.idInscripcion.toString(),
        estudianteId: estudianteId,
        tallerId: id
      }
    })

  } catch (error) {
    console.error('❌ Error inscribiendo estudiante:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
