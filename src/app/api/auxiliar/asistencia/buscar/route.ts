import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Buscando estudiantes con filtros...')

    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    } catch (jwtError) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const userId = decoded.userId
    const userInfo = await prisma.usuario.findUnique({
      where: { idUsuario: userId },
      include: { ie: true }
    })

    if (!userInfo || !['AUXILIAR', 'ADMINISTRATIVO'].includes(decoded.rol)) {
      return NextResponse.json({ error: 'Sin permisos de auxiliar' }, { status: 403 })
    }

    const ieId = userInfo.idIe
    if (!ieId) {
      return NextResponse.json({ error: 'Usuario sin IE asignada' }, { status: 400 })
    }

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const grado = searchParams.get('grado') || ''
    const seccion = searchParams.get('seccion') || ''
    const estado = searchParams.get('estado') || ''
    const fecha = searchParams.get('fecha') || new Date().toISOString().split('T')[0]

    console.log('📋 Parámetros de búsqueda:', { search, grado, seccion, estado, fecha })

    // Convertir fecha string a Date object
    const fechaBusqueda = new Date(fecha)

    // Construir filtros dinámicos
    const whereConditions: any = {
      usuario: {
        idIe: ieId,
        estado: 'ACTIVO'
      }
    }

    // Filtro por texto (nombre, apellido, DNI, código QR)
    if (search) {
      whereConditions.OR = [
        {
          usuario: {
            nombre: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          usuario: {
            apellido: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          usuario: {
            dni: {
              contains: search
            }
          }
        },
        {
          codigoQR: {
            contains: search
          }
        }
      ]
    }

    // Filtro por grado
    if (grado) {
      whereConditions.gradoSeccion = {
        grado: {
          nombre: grado
        }
      }
    }

    // Filtro por sección
    if (seccion) {
      if (whereConditions.gradoSeccion) {
        whereConditions.gradoSeccion.seccion = {
          nombre: seccion
        }
      } else {
        whereConditions.gradoSeccion = {
          seccion: {
            nombre: seccion
          }
        }
      }
    }

    // Buscar estudiantes
    const estudiantes = await prisma.estudiante.findMany({
      where: whereConditions,
      include: {
        usuario: true,
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
      },
      orderBy: [
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

    // Ahora buscar asistencias y retiros por separado para cada estudiante
    const estudiantesConEstado = await Promise.all(
      estudiantes.map(async (estudiante) => {
        // Buscar asistencia del día
        const asistencia = await prisma.asistencia.findFirst({
          where: {
            idEstudiante: estudiante.idEstudiante,
            fecha: fechaBusqueda
          },
          include: {
            estadoAsistencia: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        // Buscar retiro del día
        const retiro = await prisma.retiro.findFirst({
          where: {
            idEstudiante: estudiante.idEstudiante,
            fecha: fechaBusqueda
          }
        })

        // Buscar horario de clases del día actual
        let horarioClase = null
        if (estudiante.idGradoSeccion) {
          const diaSemana = fechaBusqueda.getDay() === 0 ? 7 : fechaBusqueda.getDay() // Domingo = 7
          horarioClase = await prisma.horarioClase.findFirst({
            where: {
              idGradoSeccion: estudiante.idGradoSeccion,
              diaSemana: diaSemana,
              activo: true
            },
            orderBy: {
              horaInicio: 'asc'
            }
          })
        }

        let estadoFinal = 'AUSENTE'
        let horaEntrada = null
        let horaSalida = null

        // Determinar estado
        if (retiro) {
          estadoFinal = 'RETIRADO'
          horaSalida = retiro.hora?.toTimeString().slice(0, 5) || ''
        } else if (asistencia) {
          // Determinar estado basado en asistencia
          estadoFinal = asistencia.estadoAsistencia?.nombreEstado || 'PRESENTE'
        }

        return {
          id: estudiante.idEstudiante.toString(),
          nombre: estudiante.usuario.nombre || '',
          apellido: estudiante.usuario.apellido || '',
          dni: estudiante.usuario.dni,
          grado: estudiante.gradoSeccion?.grado?.nombre || '',
          seccion: estudiante.gradoSeccion?.seccion?.nombre || '',
          nivel: estudiante.gradoSeccion?.grado?.nivel?.nombre || '',
          qr: estudiante.codigoQR || '',
          estado: estadoFinal,
          horaEntrada,
          horaSalida,
          horarioClase: horarioClase ? {
            horaInicio: horarioClase.horaInicio?.toTimeString().slice(0, 5) || '',
            horaFin: horarioClase.horaFin?.toTimeString().slice(0, 5) || '',
            materia: horarioClase.materia || 'Clases generales'
          } : null
        }
      })
    )

    // Filtrar por estado si se especifica
    let estudiantesFiltrados = estudiantesConEstado
    if (estado) {
      estudiantesFiltrados = estudiantesConEstado.filter(est => est.estado === estado)
    }

    console.log(`✅ Encontrados ${estudiantesFiltrados.length} estudiantes`)

    return NextResponse.json({
      success: true,
      estudiantes: estudiantesFiltrados,
      total: estudiantesFiltrados.length,
      filtros: {
        search,
        grado,
        seccion,
        estado,
        fecha
      }
    })

  } catch (error) {
    console.error('❌ Error al buscar estudiantes:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
