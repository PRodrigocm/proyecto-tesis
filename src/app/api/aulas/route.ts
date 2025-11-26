import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

interface JWTPayload {
  userId: number
  email: string
  rol: string
  ieId?: number
}

function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as JWTPayload
    return decoded
  } catch (error) {
    console.error('Error verifying token:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const gradoSeccionId = searchParams.get('gradoSeccionId')
    const ieId = user.ieId || 1 // Fallback para testing

    console.log('🏫 Cargando aulas para IE:', ieId, 'GradoSeccion:', gradoSeccionId)

    // Cargar grados-secciones como aulas
    const gradosSecciones = await prisma.gradoSeccion.findMany({
      where: {
        grado: {
          nivel: {
            idIe: ieId
          }
        }
      },
      include: {
        grado: true,
        seccion: true
      },
      orderBy: [
        { grado: { nombre: 'asc' } },
        { seccion: { nombre: 'asc' } }
      ]
    })

    // Convertir grados-secciones a formato de aulas
    const aulas = gradosSecciones.map(gs => ({
      idAula: gs.idGradoSeccion,
      nombre: `Aula ${gs.grado.nombre}° ${gs.seccion.nombre}`,
      capacidad: 30,
      tipo: 'Aula Regular',
      ubicacion: `Grado ${gs.grado.nombre}°`,
      equipamiento: 'Pizarra, proyector, mobiliario escolar'
    }))

    // Agregar aulas especiales
    const aulasEspeciales = [
      { idAula: 9001, nombre: 'Laboratorio de Ciencias', capacidad: 25, tipo: 'Laboratorio', ubicacion: 'Primer Piso', equipamiento: 'Microscopios, material de laboratorio' },
      { idAula: 9002, nombre: 'Laboratorio de Cómputo', capacidad: 25, tipo: 'Laboratorio', ubicacion: 'Segundo Piso', equipamiento: '25 computadoras, proyector' },
      { idAula: 9003, nombre: 'Biblioteca', capacidad: 40, tipo: 'Biblioteca', ubicacion: 'Primer Piso', equipamiento: 'Libros, mesas de estudio' },
      { idAula: 9004, nombre: 'Auditorio', capacidad: 100, tipo: 'Auditorio', ubicacion: 'Planta Baja', equipamiento: 'Sistema de sonido, proyector' },
      { idAula: 9005, nombre: 'Gimnasio', capacidad: 50, tipo: 'Gimnasio', ubicacion: 'Planta Baja', equipamiento: 'Equipos deportivos' },
      { idAula: 9006, nombre: 'Sala de Música', capacidad: 20, tipo: 'Taller', ubicacion: 'Tercer Piso', equipamiento: 'Instrumentos musicales, piano' },
      { idAula: 9007, nombre: 'Sala de Arte', capacidad: 20, tipo: 'Taller', ubicacion: 'Tercer Piso', equipamiento: 'Materiales de arte, caballetes' },
      { idAula: 9008, nombre: 'Patio Principal', capacidad: 200, tipo: 'Área Abierta', ubicacion: 'Exterior', equipamiento: 'Espacio abierto' }
    ]

    const todasLasAulas = [...aulas, ...aulasEspeciales]

    console.log('📋 Aulas encontradas en BD:', todasLasAulas.length)

    // Si se proporciona un gradoSeccionId, marcar el aula recomendada
    if (gradoSeccionId) {
      const gradoSeccion = await prisma.gradoSeccion.findUnique({
        where: { idGradoSeccion: parseInt(gradoSeccionId) },
        include: {
          grado: true,
          seccion: true
        }
      })

      if (!gradoSeccion) {
        return NextResponse.json({
          success: false,
          error: 'Grado-sección no encontrado'
        }, { status: 404 })
      }

      // Buscar el aula principal para este grado-sección
      const aulaRecomendada = `Aula ${gradoSeccion.grado.nombre}° ${gradoSeccion.seccion.nombre}`
      
      const aulasConRecomendacion = todasLasAulas.map((aula: any) => ({
        idAula: aula.idAula,
        nombre: aula.nombre,
        capacidad: aula.capacidad,
        tipo: aula.tipo,
        ubicacion: aula.ubicacion,
        equipamiento: aula.equipamiento,
        recomendada: aula.nombre === aulaRecomendada
      }))

      console.log('✅ Aulas con recomendación para', aulaRecomendada)

      return NextResponse.json({
        success: true,
        data: aulasConRecomendacion,
        message: `Aulas para ${gradoSeccion.grado.nombre}° ${gradoSeccion.seccion.nombre} cargadas exitosamente`
      })
    }

    // Sin grado-sección específico, devolver todas las aulas
    const aulasGenerales = todasLasAulas.map((aula: any) => ({
      idAula: aula.idAula,
      nombre: aula.nombre,
      capacidad: aula.capacidad,
      tipo: aula.tipo,
      ubicacion: aula.ubicacion,
      equipamiento: aula.equipamiento,
      recomendada: false
    }))

    return NextResponse.json({
      success: true,
      data: aulasGenerales,
      message: 'Aulas cargadas exitosamente desde la base de datos'
    })

  } catch (error) {
    console.error('Error loading aulas:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}