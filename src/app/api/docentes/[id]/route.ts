import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    
    try {
      jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const params = await context.params
    const docenteId = parseInt(params.id)

    if (isNaN(docenteId)) {
      return NextResponse.json({ error: 'ID de docente inválido' }, { status: 400 })
    }

    console.log('🔍 Buscando docente con ID:', docenteId)
    
    // Buscar el docente con toda su información
    const docente = await prisma.docente.findUnique({
      where: { idDocente: docenteId },
      include: {
        usuario: true,
        docenteAulas: {
          include: {
            tipoAsignacion: true,
            gradoSeccion: {
              include: {
                grado: {
                  include: {
                    nivel: true
                  }
                },
                seccion: true
              }
            }
          }
        }
      }
    })
    
    console.log('📋 DocenteAulas encontradas:', docente?.docenteAulas?.length || 0)

    if (!docente) {
      return NextResponse.json({ error: 'Docente no encontrado' }, { status: 404 })
    }

    // Obtener la primera asignación (puede haber múltiples)
    const primeraAsignacion = docente.docenteAulas[0]

    // Formatear la respuesta
    const docenteData = {
      id: docente.idDocente.toString(),
      nombre: docente.usuario.nombre,
      apellido: docente.usuario.apellido,
      email: docente.usuario.email,
      telefono: docente.usuario.telefono || '',
      dni: docente.usuario.dni,
      especialidad: docente.especialidad || '',
      estado: docente.usuario.estado,
      tipoAsignacion: primeraAsignacion?.tipoAsignacion ? {
        idTipoAsignacion: primeraAsignacion.tipoAsignacion.idTipoAsignacion,
        nombre: primeraAsignacion.tipoAsignacion.nombre
      } : null,
      grado: primeraAsignacion?.gradoSeccion?.grado ? {
        idGrado: primeraAsignacion.gradoSeccion.grado.idGrado,
        nombre: primeraAsignacion.gradoSeccion.grado.nombre,
        nivel: primeraAsignacion.gradoSeccion.grado.nivel?.nombre || ''
      } : null,
      seccion: primeraAsignacion?.gradoSeccion?.seccion ? {
        idSeccion: primeraAsignacion.gradoSeccion.seccion.idSeccion,
        nombre: primeraAsignacion.gradoSeccion.seccion.nombre
      } : null,
      // Incluir todas las asignaciones para referencia
      asignaciones: docente.docenteAulas.map(da => ({
        idDocenteAula: da.idDocenteAula,
        tipoAsignacion: {
          idTipoAsignacion: da.tipoAsignacion.idTipoAsignacion,
          nombre: da.tipoAsignacion.nombre
        },
        grado: {
          idGrado: da.gradoSeccion.grado.idGrado,
          nombre: da.gradoSeccion.grado.nombre,
          nivel: da.gradoSeccion.grado.nivel?.nombre || ''
        },
        seccion: {
          idSeccion: da.gradoSeccion.seccion.idSeccion,
          nombre: da.gradoSeccion.seccion.nombre
        }
      }))
    }

    return NextResponse.json({
      success: true,
      data: docenteData
    })

  } catch (error) {
    console.error('Error fetching docente:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
