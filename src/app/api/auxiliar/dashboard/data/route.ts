import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Obteniendo datos completos del dashboard auxiliar...')

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

    // Obtener fecha actual
    const hoy = new Date()
    const fechaHoy = new Date(hoy.toISOString().split('T')[0])

    console.log('📅 Calculando estadísticas para fecha:', fechaHoy.toISOString().split('T')[0])

    // 1. RESUMEN DEL DÍA
    const totalEstudiantes = await prisma.estudiante.count({
      where: {
        usuario: {
          idIe: ieId,
          estado: 'ACTIVO'
        }
      }
    })

    const estudiantesPresentes = await prisma.asistencia.count({
      where: {
        fecha: fechaHoy,
        estado: 'PRESENTE',
        estudiante: {
          usuario: {
            idIe: ieId,
            estado: 'ACTIVO'
          }
        }
      }
    })

    const estudiantesTardanza = await prisma.asistencia.count({
      where: {
        fecha: fechaHoy,
        estado: 'TARDANZA',
        estudiante: {
          usuario: {
            idIe: ieId,
            estado: 'ACTIVO'
          }
        }
      }
    })

    const estudiantesAusentes = await prisma.asistencia.count({
      where: {
        fecha: fechaHoy,
        estado: 'INASISTENCIA',
        estudiante: {
          usuario: {
            idIe: ieId,
            estado: 'ACTIVO'
          }
        }
      }
    })

    const retirosCompletados = await prisma.retiro.count({
      where: {
        fechaRetiro: fechaHoy,
        estado: 'COMPLETADO',
        estudiante: {
          usuario: {
            idIe: ieId,
            estado: 'ACTIVO'
          }
        }
      }
    })

    // Estudiantes actualmente en IE (presentes pero no retirados)
    const estudiantesEnIE = await prisma.asistencia.count({
      where: {
        fecha: fechaHoy,
        estado: {
          in: ['PRESENTE', 'TARDANZA']
        },
        estudiante: {
          usuario: {
            idIe: ieId,
            estado: 'ACTIVO'
          },
          retiros: {
            none: {
              fechaRetiro: fechaHoy,
              estado: 'COMPLETADO'
            }
          }
        }
      }
    })

    // 2. ESTADÍSTICAS POR GRADO
    const gradosConEstadisticas = await prisma.grado.findMany({
      where: {
        nivel: {
          ie: {
            idIe: ieId
          }
        }
      },
      include: {
        nivel: true,
        gradoSecciones: {
          include: {
            estudiantes: {
              where: {
                usuario: {
                  estado: 'ACTIVO'
                }
              },
              include: {
                asistencias: {
                  where: {
                    fecha: fechaHoy
                  }
                },
                retiros: {
                  where: {
                    fechaRetiro: fechaHoy,
                    estado: 'COMPLETADO'
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    const estadisticasPorGrado = gradosConEstadisticas.map(grado => {
      const estudiantes = grado.gradoSecciones.flatMap(gs => gs.estudiantes)
      const totalEstudiantes = estudiantes.length
      
      let presentes = 0
      let ausentes = 0
      let tardanzas = 0
      let retiros = 0

      estudiantes.forEach(estudiante => {
        const asistenciaHoy = estudiante.asistencias[0]
        const retiroHoy = estudiante.retiros[0]

        if (retiroHoy) {
          retiros++
        } else if (asistenciaHoy) {
          switch (asistenciaHoy.estado) {
            case 'PRESENTE':
              presentes++
              break
            case 'TARDANZA':
              tardanzas++
              break
            case 'INASISTENCIA':
              ausentes++
              break
          }
        } else {
          ausentes++
        }
      })

      const porcentajeAsistencia = totalEstudiantes > 0 
        ? Math.round(((presentes + tardanzas) / totalEstudiantes) * 100)
        : 0

      return {
        grado: grado.nombre,
        nivel: grado.nivel.nombre,
        totalEstudiantes,
        presentes,
        ausentes,
        tardanzas,
        retiros,
        porcentajeAsistencia
      }
    })

    // 3. RETIROS RECIENTES (últimos 10)
    const retirosRecientes = await prisma.retiro.findMany({
      where: {
        fechaRetiro: fechaHoy,
        estudiante: {
          usuario: {
            idIe: ieId,
            estado: 'ACTIVO'
          }
        }
      },
      include: {
        estudiante: {
          include: {
            usuario: true,
            gradoSeccion: {
              include: {
                grado: true,
                seccion: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    const retirosRecientesTransformados = retirosRecientes.map(retiro => ({
      id: retiro.idRetiro.toString(),
      estudiante: `${retiro.estudiante.usuario.apellido}, ${retiro.estudiante.usuario.nombre}`,
      grado: `${retiro.estudiante.gradoSeccion?.grado?.nombre}° ${retiro.estudiante.gradoSeccion?.seccion?.nombre}`,
      horaRetiro: retiro.horaRetiro || '',
      motivo: retiro.motivo || '',
      estado: retiro.estado
    }))

    // 4. ALERTAS DE TOLERANCIA (estudiantes con tardanza excesiva)
    const asistenciasTardanza = await prisma.asistencia.findMany({
      where: {
        fecha: fechaHoy,
        estado: 'TARDANZA',
        horaEntrada: {
          not: null
        },
        estudiante: {
          usuario: {
            idIe: ieId,
            estado: 'ACTIVO'
          }
        }
      },
      include: {
        estudiante: {
          include: {
            usuario: true,
            gradoSeccion: {
              include: {
                grado: true,
                seccion: true,
                horarioClases: {
                  where: {
                    diaSemana: hoy.getDay() === 0 ? 7 : hoy.getDay(),
                    activo: true
                  },
                  take: 1
                }
              }
            }
          }
        }
      }
    })

    const alertasTolerancia = asistenciasTardanza
      .map(asistencia => {
        const horario = asistencia.estudiante.gradoSeccion?.horarioClases[0]
        if (!horario || !asistencia.horaEntrada) return null

        const horaInicio = new Date(fechaHoy)
        const [horas, minutos] = horario.horaInicio.toTimeString().slice(0, 5).split(':')
        horaInicio.setHours(parseInt(horas), parseInt(minutos), 0, 0)

        const tolerancia = horario.toleranciaMin || 10
        const horaLimite = new Date(horaInicio.getTime() + (tolerancia * 60 * 1000))

        const minutosRetraso = Math.round((asistencia.horaEntrada.getTime() - horaLimite.getTime()) / (1000 * 60))

        if (minutosRetraso > 5) { // Solo alertas con más de 5 minutos de retraso adicional
          return {
            estudiante: `${asistencia.estudiante.usuario.apellido}, ${asistencia.estudiante.usuario.nombre}`,
            grado: `${asistencia.estudiante.gradoSeccion?.grado?.nombre}° ${asistencia.estudiante.gradoSeccion?.seccion?.nombre}`,
            minutosRetraso,
            horaLlegada: asistencia.horaEntrada.toTimeString().slice(0, 5)
          }
        }
        return null
      })
      .filter(Boolean)
      .slice(0, 10)

    // 5. HORARIOS PICO (agrupación por horas)
    const asistenciasHoy = await prisma.asistencia.findMany({
      where: {
        fecha: fechaHoy,
        horaEntrada: {
          not: null
        },
        estudiante: {
          usuario: {
            idIe: ieId,
            estado: 'ACTIVO'
          }
        }
      },
      select: {
        horaEntrada: true
      }
    })

    const retirosHoy = await prisma.retiro.findMany({
      where: {
        fechaRetiro: fechaHoy,
        horaRetiro: {
          not: null
        },
        estudiante: {
          usuario: {
            idIe: ieId,
            estado: 'ACTIVO'
          }
        }
      },
      select: {
        horaRetiro: true
      }
    })

    // Agrupar por horas
    const horariosMap = new Map()

    asistenciasHoy.forEach(asistencia => {
      if (asistencia.horaEntrada) {
        const hora = asistencia.horaEntrada.getHours()
        const horaKey = `${hora.toString().padStart(2, '0')}:00`
        
        if (!horariosMap.has(horaKey)) {
          horariosMap.set(horaKey, { hora: horaKey, entradas: 0, salidas: 0 })
        }
        horariosMap.get(horaKey).entradas++
      }
    })

    retirosHoy.forEach(retiro => {
      if (retiro.horaRetiro) {
        const [horaStr] = retiro.horaRetiro.split(':')
        const hora = parseInt(horaStr)
        const horaKey = `${hora.toString().padStart(2, '0')}:00`
        
        if (!horariosMap.has(horaKey)) {
          horariosMap.set(horaKey, { hora: horaKey, entradas: 0, salidas: 0 })
        }
        horariosMap.get(horaKey).salidas++
      }
    })

    const horariosPico = Array.from(horariosMap.values())
      .filter(h => h.entradas > 0 || h.salidas > 0)
      .sort((a, b) => (b.entradas + b.salidas) - (a.entradas + a.salidas))
      .slice(0, 8)

    const dashboard = {
      resumenHoy: {
        estudiantesPresentes,
        estudiantesAusentes,
        estudiantesTardanza,
        retirosCompletados,
        estudiantesEnIE,
        totalEstudiantes
      },
      estadisticasPorGrado,
      retirosRecientes: retirosRecientesTransformados,
      alertasTolerancia,
      horariosPico
    }

    console.log('✅ Dashboard data calculado exitosamente')

    return NextResponse.json({
      success: true,
      dashboard,
      fecha: fechaHoy.toISOString().split('T')[0],
      ie: {
        id: ieId,
        nombre: userInfo.ie?.nombre
      }
    })

  } catch (error) {
    console.error('❌ Error al obtener datos del dashboard auxiliar:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
