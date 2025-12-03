import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

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

    // Función para formatear hora en zona horaria local (Lima/Peru)
    const formatearHora = (fecha: Date | null): string => {
      if (!fecha) return ''
      return fecha.toLocaleTimeString('es-PE', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/Lima'
      })
    }

    // Ahora buscar asistencias IE (entrada/salida) y retiros por separado para cada estudiante
    const estudiantesConEstado = await Promise.all(
      estudiantes.map(async (estudiante) => {
        // Buscar AsistenciaIE del día (entrada/salida de la institución - registrado por auxiliar)
        const asistenciaIE = await prisma.asistenciaIE.findFirst({
          where: {
            idEstudiante: estudiante.idEstudiante,
            fecha: fechaBusqueda
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
        let horaEntrada: string | null = null
        let horaSalida: string | null = null

        // Determinar estado basado en AsistenciaIE (entrada/salida de portería)
        if (asistenciaIE) {
          // Si tiene hora de ingreso
          if (asistenciaIE.horaIngreso) {
            horaEntrada = formatearHora(asistenciaIE.horaIngreso)
            estadoFinal = 'PRESENTE'
          }
          
          // Si tiene hora de salida
          if (asistenciaIE.horaSalida) {
            horaSalida = formatearHora(asistenciaIE.horaSalida)
            estadoFinal = 'RETIRADO'
          }
          
          // Usar estado de la BD si existe
          if (asistenciaIE.estado) {
            if (asistenciaIE.estado === 'TARDANZA') {
              estadoFinal = 'TARDANZA'
            } else if (asistenciaIE.estado === 'RETIRADO' || asistenciaIE.estado === 'EVASION') {
              estadoFinal = 'RETIRADO'
            }
          }
        }

        // Si hay retiro, sobrescribir
        if (retiro && retiro.hora) {
          estadoFinal = 'RETIRADO'
          horaSalida = formatearHora(retiro.hora)
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
            horaInicio: formatearHora(horarioClase.horaInicio),
            horaFin: formatearHora(horarioClase.horaFin),
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
  }
}
