import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/talleres - Iniciando consulta de talleres')
    
    // Obtener ieId del token de usuario
    const authHeader = request.headers.get('authorization')
    let ieId = 1 // Default
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
        ieId = decoded.ieId || 1
        console.log('✅ Token decodificado, ieId:', ieId)
      } catch (error) {
        console.log('⚠️ Error decoding token, using default ieId:', ieId)
      }
    } else {
      console.log('⚠️ No auth header, using default ieId:', ieId)
    }

    const talleres = await prisma.taller.findMany({
      where: {
        idIe: ieId
      },
      include: {
        inscripciones: {
          where: {
            estado: 'activa'
          }
        },
        ie: {
          select: {
            idIe: true,
            nombre: true
          }
        }
      },
      orderBy: [
        { nombre: 'asc' }
      ]
    })

    console.log(`📊 Talleres encontrados: ${talleres.length}`)

    const transformedData = talleres.map(taller => ({
      id: taller.idTaller.toString(),
      codigo: taller.codigo || '',
      nombre: taller.nombre,
      descripcion: taller.descripcion || '',
      instructor: taller.instructor || '',
      capacidadMaxima: taller.capacidadMaxima || 0,
      activo: taller.activo,
      inscripciones: taller.inscripciones.length,
      fechaCreacion: taller.createdAt?.toISOString() || '',
      fechaActualizacion: taller.updatedAt?.toISOString() || null
    }))

    console.log(`✅ Enviando ${transformedData.length} talleres al frontend`)

    return NextResponse.json({
      data: transformedData,
      total: transformedData.length
    })

  } catch (error) {
    console.error('Error fetching talleres:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📝 POST /api/talleres - Creando nuevo taller')
    
    // Obtener ieId del token de usuario
    const authHeader = request.headers.get('authorization')
    let ieId = 1 // Default
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
        ieId = decoded.ieId || 1
        console.log('✅ Token decodificado, ieId:', ieId)
      } catch (error) {
        console.log('⚠️ Error decoding token, using default ieId:', ieId)
      }
    }

    const body = await request.json()
    const {
      nombre,
      descripcion,
      instructor,
      capacidadMaxima
    } = body

    console.log('📋 Datos del taller a crear:', { nombre, descripcion, instructor, capacidadMaxima, ieId })

    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre del taller es requerido' },
        { status: 400 }
      )
    }

    // Verificar si ya existe un taller con el mismo nombre en esta IE
    const tallerExistente = await prisma.taller.findFirst({
      where: {
        nombre: nombre,
        idIe: ieId
      }
    })

    if (tallerExistente) {
      return NextResponse.json(
        { error: 'Ya existe un taller con este nombre en la institución' },
        { status: 400 }
      )
    }

    // Generar código único para el taller
    const codigoTaller = `TALL${Date.now().toString().slice(-6)}`

    const nuevoTaller = await prisma.taller.create({
      data: {
        codigo: codigoTaller,
        nombre: nombre,
        descripcion: descripcion || null,
        instructor: instructor || null,
        capacidadMaxima: capacidadMaxima || 20,
        idIe: ieId,
        activo: true
      }
    })

    console.log('✅ Taller creado exitosamente:', nuevoTaller.idTaller)

    return NextResponse.json({
      success: true,
      message: 'Taller creado exitosamente',
      data: {
        id: nuevoTaller.idTaller.toString(),
        codigo: nuevoTaller.codigo,
        nombre: nuevoTaller.nombre
      }
    })

  } catch (error) {
    console.error('❌ Error creating taller:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
