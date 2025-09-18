import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

// Helper function to get user info from token
async function getUserFromToken(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return null
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const user = await prisma.usuario.findUnique({
      where: { idUsuario: decoded.id },
      select: { idUsuario: true, idIe: true }
    })
    
    return user
  } catch (error) {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user's institution from token or localStorage (for now, we'll use a default)
    // In production, this should come from the authenticated user's session
    const userIe = 1 // This should be dynamic based on logged user

    const salones = await prisma.gradoSeccion.findMany({
      where: {
        grado: {
          nivel: {
            idIe: userIe
          }
        }
      },
      include: {
        grado: {
          include: {
            nivel: true
          }
        },
        seccion: true,
        estudiantes: {
          select: {
            _count: true
          }
        }
      },
      orderBy: [
        { grado: { nivel: { nombre: 'asc' } } },
        { grado: { nombre: 'asc' } },
        { seccion: { nombre: 'asc' } }
      ]
    })

    const transformedSalones = salones.map(salon => ({
      id: salon.idGradoSeccion,
      nivel: salon.grado.nivel.nombre,
      grado: salon.grado.nombre,
      seccion: salon.seccion.nombre,
      nombre: `${salon.grado.nivel.nombre} - ${salon.grado.nombre} "${salon.seccion.nombre}"`,
      cantidadEstudiantes: salon.estudiantes.length,
      createdAt: salon.createdAt
    }))

    return NextResponse.json(transformedSalones)

  } catch (error) {
    console.error('Error fetching salones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nivelId, gradoNombre, seccionNombre } = body

    // Validate required fields
    if (!nivelId || !gradoNombre || !seccionNombre) {
      return NextResponse.json(
        { error: 'Nivel, grado y sección son obligatorios' },
        { status: 400 }
      )
    }

    // Get user's institution (should be from authenticated user)
    const userIe = 1 // This should be dynamic

    // Check if grado exists, if not create it
    let grado = await prisma.grado.findFirst({
      where: {
        idNivel: parseInt(nivelId),
        nombre: gradoNombre
      }
    })

    if (!grado) {
      grado = await prisma.grado.create({
        data: {
          idNivel: parseInt(nivelId),
          nombre: gradoNombre
        }
      })
    }

    // Check if seccion exists, if not create it
    let seccion = await prisma.seccion.findFirst({
      where: { nombre: seccionNombre }
    })

    if (!seccion) {
      seccion = await prisma.seccion.create({
        data: { nombre: seccionNombre }
      })
    }

    // Check if this grado-seccion combination already exists
    const existingSalon = await prisma.gradoSeccion.findFirst({
      where: {
        idGrado: grado.idGrado,
        idSeccion: seccion.idSeccion
      }
    })

    if (existingSalon) {
      return NextResponse.json(
        { error: 'Este salón ya existe' },
        { status: 400 }
      )
    }

    // Create the salon (grado-seccion)
    const newSalon = await prisma.gradoSeccion.create({
      data: {
        idGrado: grado.idGrado,
        idSeccion: seccion.idSeccion
      },
      include: {
        grado: {
          include: {
            nivel: true
          }
        },
        seccion: true
      }
    })

    return NextResponse.json({
      message: 'Salón creado exitosamente',
      salon: {
        id: newSalon.idGradoSeccion,
        nivel: newSalon.grado.nivel.nombre,
        grado: newSalon.grado.nombre,
        seccion: newSalon.seccion.nombre,
        nombre: `${newSalon.grado.nivel.nombre} - ${newSalon.grado.nombre} "${newSalon.seccion.nombre}"`
      }
    })

  } catch (error) {
    console.error('Error creating salon:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
