import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(request: NextRequest) {
  try {
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

    // Verificar que sea administrador
    if (decoded.rol !== 'ADMINISTRATIVO') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    console.log('🔍 Cargando estudiantes para códigos QR...')

    // Obtener estudiantes de la institución del usuario
    const estudiantes = await prisma.estudiante.findMany({
      where: {
        usuario: {
          idIe: decoded.idIe,
          estado: 'ACTIVO'
        }
      },
      include: {
        usuario: {
          select: {
            nombre: true,
            apellido: true,
            dni: true,
            estado: true
          }
        },
        gradoSeccion: {
          include: {
            grado: {
              select: {
                nombre: true
              }
            },
            seccion: {
              select: {
                nombre: true
              }
            }
          }
        }
      },
      orderBy: [
        {
          gradoSeccion: {
            grado: {
              nombre: 'asc'
            }
          }
        },
        {
          gradoSeccion: {
            seccion: {
              nombre: 'asc'
            }
          }
        },
        {
          usuario: {
            apellido: 'asc'
          }
        },
        {
          usuario: {
            nombre: 'asc'
          }
        }
      ]
    })

    console.log(`✅ ${estudiantes.length} estudiantes encontrados`)

    // Transformar datos para el generador de QR
    const estudiantesTransformados = estudiantes.map(estudiante => ({
      id: estudiante.idEstudiante.toString(),
      nombre: `${estudiante.usuario.nombre} ${estudiante.usuario.apellido}`,
      codigo: `EST${String(estudiante.idEstudiante).padStart(4, '0')}`, // Generar código basado en ID
      grado: estudiante.gradoSeccion?.grado?.nombre || '',
      seccion: estudiante.gradoSeccion?.seccion?.nombre || '',
      dni: estudiante.usuario.dni,
      estado: estudiante.usuario.estado
    }))

    return NextResponse.json({
      success: true,
      estudiantes: estudiantesTransformados,
      total: estudiantesTransformados.length
    })

  } catch (error) {
    console.error('❌ Error al obtener estudiantes:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
