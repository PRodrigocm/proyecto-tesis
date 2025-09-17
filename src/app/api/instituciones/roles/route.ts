import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Get all roles from the enum in the database
    const roles = [
      { id: 'ADMIN', nombre: 'Administrador' },
      { id: 'ADMINISTRATIVO', nombre: 'Administrativo' },
      { id: 'DOCENTE', nombre: 'Docente' },
      { id: 'APODERADO', nombre: 'Apoderado' }
    ]

    return NextResponse.json(roles)
  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
