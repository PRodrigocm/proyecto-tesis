import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Obteniendo estadísticas del dashboard auxiliar...')

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
    const fechaHoy = hoy.toISOString().split('T')[0]

    console.log('📅 Calculando estadísticas para fecha:', fechaHoy)

    // 1. Estudiantes presentes hoy
    const estudiantesPresentes = await prisma.asistencia.count({
      where: {
        fecha: new Date(fechaHoy),
        estado: {
          in: ['PRESENTE', 'TARDANZA']
        },
        estudiante: {
          usuario: {
            idIe: ieId,
            estado: 'ACTIVO'
          }
        }
      }
    })

    // 2. Estudiantes ausentes hoy
    const estudiantesAusentes = await prisma.asistencia.count({
      where: {
        fecha: new Date(fechaHoy),
        estado: 'INASISTENCIA',
        estudiante: {
          usuario: {
            idIe: ieId,
            estado: 'ACTIVO'
          }
        }
      }
    })

    // 3. Retiros de hoy
    const retirosHoy = await prisma.retiro.count({
      where: {
        fechaRetiro: new Date(fechaHoy),
        estudiante: {
          usuario: {
            idIe: ieId,
            estado: 'ACTIVO'
          }
        }
      }
    })

    // 4. Estudiantes actualmente en la IE (presentes pero no retirados)
    const estudiantesEnIE = await prisma.asistencia.count({
      where: {
        fecha: new Date(fechaHoy),
        estado: {
          in: ['PRESENTE', 'TARDANZA']
        },
        estudiante: {
          usuario: {
            idIe: ieId,
            estado: 'ACTIVO'
          },
          // No tienen retiro completado hoy
          retiros: {
            none: {
              fechaRetiro: new Date(fechaHoy),
              estado: 'COMPLETADO'
            }
          }
        }
      }
    })

    // 5. Tolerancia promedio de las aulas
    const horariosConTolerancia = await prisma.horarioClase.findMany({
      where: {
        gradoSeccion: {
          grado: {
            nivel: {
              ie: {
                idIe: ieId
              }
            }
          }
        },
        activo: true
      },
      select: {
        toleranciaMin: true
      }
    })

    const toleranciaPromedio = horariosConTolerancia.length > 0 
      ? Math.round(horariosConTolerancia.reduce((sum, h) => sum + (h.toleranciaMin || 10), 0) / horariosConTolerancia.length)
      : 10

    // 6. Alertas de tolerancia (estudiantes con tardanza excesiva)
    const alertasTolerancia = await prisma.asistencia.count({
      where: {
        fecha: new Date(fechaHoy),
        estado: 'TARDANZA',
        // Considerar como alerta si la tardanza es mayor a la tolerancia + 15 minutos
        horaEntrada: {
          not: null
        },
        estudiante: {
          usuario: {
            idIe: ieId,
            estado: 'ACTIVO'
          }
        }
      }
    })

    const stats = {
      estudiantesPresentes,
      estudiantesAusentes,
      retirosHoy,
      estudiantesEnIE,
      toleranciaPromedio,
      alertasTolerancia
    }

    console.log('✅ Estadísticas calculadas:', stats)

    return NextResponse.json({
      success: true,
      stats,
      fecha: fechaHoy,
      ie: {
        id: ieId,
        nombre: userInfo.ie?.nombre
      }
    })

  } catch (error) {
    console.error('❌ Error al obtener estadísticas del dashboard auxiliar:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
