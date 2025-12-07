import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// GET /api/docentes/estudiantes - Obtener estudiantes de los salones que enseña el docente
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

    // Verificar que sea docente o administrador
    if (!['DOCENTE', 'ADMINISTRATIVO'].includes(decoded.rol)) {
      return NextResponse.json({ error: 'No tienes permisos para acceder a esta información' }, { status: 403 })
    }

    console.log('🔍 Buscando estudiantes para docente:', decoded.idUsuario)

    // Si es administrador, mostrar todos los estudiantes de la IE
    if (decoded.rol === 'ADMINISTRATIVO') {
      const ieId = decoded.ieId
      
      if (!ieId) {
        return NextResponse.json({ error: 'IE no encontrada en el token' }, { status: 400 })
      }
      
      const estudiantes = await prisma.estudiante.findMany({
        include: {
          usuario: true,
          gradoSeccion: {
            include: {
              grado: true,
              seccion: true
            }
          },
          apoderados: {
            where: {
              esTitular: true // Solo apoderado titular
            },
            include: {
              apoderado: {
                include: {
                  usuario: true
                }
              }
            }
          }
        },
        where: {
          idIe: ieId, // Filtrar por IE
          usuario: {
            estado: 'ACTIVO'
          }
        },
        orderBy: [
          { gradoSeccion: { grado: { nombre: 'asc' } } },
          { gradoSeccion: { seccion: { nombre: 'asc' } } },
          { usuario: { apellido: 'asc' } }
        ]
      })

      const estudiantesTransformados = estudiantes.map(estudiante => {
        const apoderadoTitular = estudiante.apoderados.find(a => a.esTitular)
        
        return {
          id: estudiante.idEstudiante.toString(),
          nombre: estudiante.usuario.nombre,
          apellido: estudiante.usuario.apellido,
          dni: estudiante.usuario.dni,
          grado: estudiante.gradoSeccion?.grado?.nombre || '',
          seccion: estudiante.gradoSeccion?.seccion?.nombre || '',
          apoderadoTitular: apoderadoTitular ? {
            id: apoderadoTitular.apoderado.idApoderado.toString(),
            nombre: apoderadoTitular.apoderado.usuario.nombre,
            apellido: apoderadoTitular.apoderado.usuario.apellido,
            dni: apoderadoTitular.apoderado.usuario.dni,
            telefono: apoderadoTitular.apoderado.usuario.telefono || '',
            email: apoderadoTitular.apoderado.usuario.email
          } : null
        }
      })

      return NextResponse.json({
        success: true,
        estudiantes: estudiantesTransformados,
        total: estudiantesTransformados.length
      })
    }

    // Obtener IE del usuario docente
    const usuarioDocente = await prisma.usuario.findUnique({
      where: { idUsuario: decoded.userId || decoded.idUsuario },
      select: { idIe: true }
    })
    
    const docenteIeId = usuarioDocente?.idIe || decoded.ieId

    // Para docentes, primero obtener el ID del docente
    const docente = await prisma.docente.findFirst({
      where: { idUsuario: decoded.userId || decoded.idUsuario }
    })

    if (!docente) {
      return NextResponse.json({ error: 'Docente no encontrado' }, { status: 404 })
    }

    // Buscar los salones donde enseña el docente
    const docenteAulas = await prisma.docenteAula.findMany({
      where: {
        idDocente: docente.idDocente
      },
      include: {
        gradoSeccion: {
          include: {
            grado: true,
            seccion: true,
            estudiantes: {
              include: {
                usuario: true,
                apoderados: {
                  where: {
                    esTitular: true // Solo apoderado titular
                  },
                  include: {
                    apoderado: {
                      include: {
                        usuario: true
                      }
                    }
                  }
                }
              },
              where: {
                usuario: {
                  estado: 'ACTIVO'
                },
                // Filtrar por IE del docente
                ...(docenteIeId && {
                  OR: [
                    { idIe: docenteIeId },
                    { usuario: { idIe: docenteIeId } }
                  ]
                })
              }
            }
          }
        }
      }
    })

    console.log(`📚 Docente enseña en ${docenteAulas.length} salones`)

    // Extraer todos los estudiantes de los salones del docente
    const todosEstudiantes: any[] = []
    
    docenteAulas.forEach(aula => {
      if (aula.gradoSeccion?.estudiantes) {
        aula.gradoSeccion.estudiantes.forEach(estudiante => {
          const apoderadoTitular = estudiante.apoderados.find(a => a.esTitular)
          
          todosEstudiantes.push({
            id: estudiante.idEstudiante.toString(),
            nombre: estudiante.usuario.nombre,
            apellido: estudiante.usuario.apellido,
            dni: estudiante.usuario.dni,
            grado: aula.gradoSeccion.grado?.nombre || '',
            seccion: aula.gradoSeccion.seccion?.nombre || '',
            apoderadoTitular: apoderadoTitular ? {
              id: apoderadoTitular.apoderado.idApoderado.toString(),
              nombre: apoderadoTitular.apoderado.usuario.nombre,
              apellido: apoderadoTitular.apoderado.usuario.apellido,
              dni: apoderadoTitular.apoderado.usuario.dni,
              telefono: apoderadoTitular.apoderado.usuario.telefono || '',
              email: apoderadoTitular.apoderado.usuario.email
            } : null
          })
        })
      }
    })

    // Eliminar duplicados por ID de estudiante
    const estudiantesUnicos = todosEstudiantes.filter((estudiante, index, self) => 
      index === self.findIndex(e => e.id === estudiante.id)
    )

    // Ordenar por grado, sección y apellido
    estudiantesUnicos.sort((a, b) => {
      if (a.grado !== b.grado) return a.grado.localeCompare(b.grado)
      if (a.seccion !== b.seccion) return a.seccion.localeCompare(b.seccion)
      return a.apellido.localeCompare(b.apellido)
    })

    console.log(`✅ Encontrados ${estudiantesUnicos.length} estudiantes únicos`)

    // Si no hay estudiantes, devolver lista vacía
    if (estudiantesUnicos.length === 0) {
      console.log('⚠️ No se encontraron estudiantes para este docente')
      return NextResponse.json({
        success: true,
        estudiantes: [],
        total: 0,
        message: 'No tienes estudiantes asignados. Verifica que tengas aulas asignadas.'
      })
    }

    return NextResponse.json({
      success: true,
      estudiantes: estudiantesUnicos,
      total: estudiantesUnicos.length
    })

  } catch (error) {
    console.error('❌ Error obteniendo estudiantes del docente:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
