import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 Obteniendo estudiantes del aula...')
    
    // Verificar autenticación
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const userInfo = verifyToken(token)
    if (!userInfo) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { id } = await params
    const aulaId = parseInt(id)

    console.log('🏫 ID del aula:', aulaId)

    // Obtener el aula (DocenteAula) y su grado-sección
    const docenteAula = await prisma.docenteAula.findFirst({
      where: { idDocenteAula: aulaId },
      include: {
        gradoSeccion: {
          include: {
            grado: true,
            seccion: true
          }
        }
      }
    })

    if (!docenteAula) {
      console.log('❌ No se encontró el aula con ID:', aulaId)
      return NextResponse.json({ error: 'Aula no encontrada' }, { status: 404 })
    }

    // Obtener estudiantes que pertenecen a este grado-sección
    const estudiantesData = await prisma.estudiante.findMany({
      where: {
        idGradoSeccion: docenteAula.idGradoSeccion
      },
      include: {
        usuario: true
      }
    })

    const estudiantes = estudiantesData.map(estudiante => {
      const usuario = estudiante.usuario
      
      return {
        id: estudiante.idEstudiante,
        nombre: usuario.nombre || 'Sin nombre',
        apellido: usuario.apellido || 'Sin apellido',
        dni: usuario.dni || 'Sin DNI',
        email: usuario.email || undefined,
        telefono: usuario.telefono || undefined,
        estado: 'activo' as const // Por defecto activo, se puede agregar campo en BD si es necesario
      }
    })

    console.log('👥 Estudiantes encontrados:', estudiantes.length)
    console.log('📋 Lista de estudiantes:', estudiantes.map((e: any) => `${e.nombre} ${e.apellido}`))

    return NextResponse.json({
      success: true,
      data: estudiantes,
      aula: {
        id: aulaId,
        grado: docenteAula.gradoSeccion.grado.nombre,
        seccion: docenteAula.gradoSeccion.seccion.nombre,
        nombre: `${docenteAula.gradoSeccion.grado.nombre}° ${docenteAula.gradoSeccion.seccion.nombre}`
      }
    })

  } catch (error) {
    console.error('❌ Error al obtener estudiantes del aula:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
