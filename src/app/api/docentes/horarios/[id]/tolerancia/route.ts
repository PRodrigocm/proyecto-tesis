import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// PUT /api/docentes/horarios/[id]/tolerancia - Actualizar tolerancia de un horario
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const horarioId = parseInt(id)

    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Verificar que sea docente o administrador
    if (!['DOCENTE', 'ADMINISTRATIVO'].includes(decoded.rol)) {
      return NextResponse.json({ error: 'No tienes permisos para modificar horarios' }, { status: 403 })
    }

    const body = await request.json()
    const { toleranciaMin } = body

    // Validar tolerancia
    if (typeof toleranciaMin !== 'number' || toleranciaMin < 0 || toleranciaMin > 60) {
      return NextResponse.json({ 
        error: 'La tolerancia debe ser un número entre 0 y 60 minutos' 
      }, { status: 400 })
    }

    console.log(`⏰ Actualizando tolerancia del horario ${horarioId} a ${toleranciaMin} minutos`)

    // Verificar que el horario existe
    const horarioExistente = await prisma.horarioClase.findUnique({
      where: { idHorarioClase: horarioId },
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
        }
      }
    })

    if (!horarioExistente) {
      return NextResponse.json({ 
        error: 'Horario no encontrado' 
      }, { status: 404 })
    }

    // Si es docente, verificar que sea su horario
    if (decoded.rol === 'DOCENTE') {
      const docente = await prisma.docente.findFirst({
        where: { idUsuario: decoded.idUsuario }
      })

      if (!docente || horarioExistente.idDocente !== docente.idDocente) {
        return NextResponse.json({ 
          error: 'No tienes permisos para modificar este horario' 
        }, { status: 403 })
      }
    }

    // Actualizar la tolerancia
    const horarioActualizado = await prisma.horarioClase.update({
      where: { idHorarioClase: horarioId },
      data: { toleranciaMin },
      include: {
        gradoSeccion: {
          include: {
            grado: true,
            seccion: true
          }
        },
        docente: {
          include: {
            usuario: true
          }
        }
      }
    })

    console.log(`✅ Tolerancia actualizada exitosamente para ${horarioActualizado.gradoSeccion?.grado?.nombre}° ${horarioActualizado.gradoSeccion?.seccion?.nombre}`)

    return NextResponse.json({
      success: true,
      message: 'Tolerancia actualizada exitosamente',
      data: {
        id: horarioActualizado.idHorarioClase.toString(),
        grado: horarioActualizado.gradoSeccion?.grado?.nombre || '',
        seccion: horarioActualizado.gradoSeccion?.seccion?.nombre || '',
        materia: horarioActualizado.materia || 'Clase Regular',
        toleranciaMin: horarioActualizado.toleranciaMin,
        horaInicio: horarioActualizado.horaInicio.toTimeString().slice(0, 5),
        horaFin: horarioActualizado.horaFin.toTimeString().slice(0, 5)
      }
    })

  } catch (error) {
    console.error('❌ Error al actualizar tolerancia:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
