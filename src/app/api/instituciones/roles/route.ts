import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all roles from the database
    const rolesFromDb = await prisma.rol.findMany({
      orderBy: { nombre: 'asc' }
    })

    const roles = rolesFromDb.map(rol => ({
      id: rol.nombre,
      nombre: rol.nombre === 'ADMINISTRATIVO' ? 'Administrativo' : 
              rol.nombre === 'DOCENTE' ? 'Docente' :
              rol.nombre === 'APODERADO' ? 'Apoderado' :
              rol.nombre === 'ESTUDIANTE' ? 'Estudiante' :
              rol.nombre
    }))

    return NextResponse.json(roles)
  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
