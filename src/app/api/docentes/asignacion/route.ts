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

    if (!gradoSeccionId) {
      return NextResponse.json({ error: 'gradoSeccionId es requerido' }, { status: 400 })
    }

    console.log('🔍 Buscando docente asignado para GradoSeccion:', gradoSeccionId)

    // Buscar el docente asignado a este grado-sección
    const docenteAula = await prisma.docenteAula.findFirst({
      where: {
        idGradoSeccion: parseInt(gradoSeccionId)
      },
      include: {
        docente: {
          include: {
            usuario: true
          }
        },
        gradoSeccion: {
          include: {
            grado: true,
            seccion: true
          }
        },
        tipoAsignacion: true
      }
    })

    if (!docenteAula) {
      console.log('⚠️ No se encontró docente asignado para este grado-sección')
      return NextResponse.json({
        success: true,
        docente: null,
        message: 'No hay docente asignado a este grado-sección'
      })
    }

    const docenteInfo = {
      id: docenteAula.docente.idDocente,
      nombre: docenteAula.docente.usuario.nombre,
      apellido: docenteAula.docente.usuario.apellido,
      especialidad: docenteAula.docente.especialidad,
      tipoAsignacion: docenteAula.tipoAsignacion.nombre,
      gradoSeccion: {
        grado: docenteAula.gradoSeccion.grado.nombre,
        seccion: docenteAula.gradoSeccion.seccion.nombre
      }
    }

    console.log('✅ Docente encontrado:', `${docenteInfo.nombre} ${docenteInfo.apellido}`)

    return NextResponse.json({
      success: true,
      docente: docenteInfo,
      message: 'Docente asignado encontrado exitosamente'
    })

  } catch (error) {
    console.error('Error loading docente asignacion:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
