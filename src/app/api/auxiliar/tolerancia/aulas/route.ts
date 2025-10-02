import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    console.log('🏫 Obteniendo aulas con tolerancia...')

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

    // Obtener horarios de clases con información de tolerancia
    const horariosClase = await prisma.horarioClase.findMany({
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
        activo: true,
        diaSemana: {
          in: [1, 2, 3, 4, 5] // Solo días de semana
        }
      },
      include: {
        gradoSeccion: {
          include: {
            grado: {
              include: {
                nivel: true
              }
            },
            seccion: true,
            estudiantes: {
              where: {
                usuario: {
                  estado: 'ACTIVO'
                }
              }
            },
            docenteAulas: {
              include: {
                docente: {
                  include: {
                    usuario: true
                  }
                }
              },
              take: 1
            }
          }
        }
      },
      orderBy: [
        { gradoSeccion: { grado: { nombre: 'asc' } } },
        { gradoSeccion: { seccion: { nombre: 'asc' } } }
      ]
    })

    // Agrupar por grado-sección para evitar duplicados
    const aulasMap = new Map()

    horariosClase.forEach(horario => {
      const key = `${horario.gradoSeccion.grado.nombre}-${horario.gradoSeccion.seccion.nombre}`
      
      if (!aulasMap.has(key)) {
        // Función para formatear tiempo desde la BD sin conversiones de zona horaria
        const formatTimeFromDB = (dateTime: Date): string => {
          const hours = dateTime.getUTCHours().toString().padStart(2, '0')
          const minutes = dateTime.getUTCMinutes().toString().padStart(2, '0')
          return `${hours}:${minutes}`
        }

        aulasMap.set(key, {
          id: horario.gradoSeccion.idGradoSeccion.toString(),
          grado: horario.gradoSeccion.grado.nombre,
          seccion: horario.gradoSeccion.seccion.nombre,
          nivel: horario.gradoSeccion.grado.nivel.nombre,
          toleranciaActual: horario.toleranciaMin || 10,
          horarioInicio: formatTimeFromDB(horario.horaInicio),
          horarioFin: formatTimeFromDB(horario.horaFin),
          totalEstudiantes: horario.gradoSeccion.estudiantes.length,
          docenteAsignado: horario.gradoSeccion.docenteAulas[0] 
            ? `${horario.gradoSeccion.docenteAulas[0].docente.usuario.nombre} ${horario.gradoSeccion.docenteAulas[0].docente.usuario.apellido}`
            : undefined
        })
      }
    })

    const aulas = Array.from(aulasMap.values())

    // Calcular tolerancia promedio
    const toleranciaPromedio = aulas.length > 0 
      ? Math.round(aulas.reduce((sum, aula) => sum + aula.toleranciaActual, 0) / aulas.length)
      : 10

    console.log(`✅ ${aulas.length} aulas obtenidas con tolerancia promedio: ${toleranciaPromedio} min`)

    return NextResponse.json({
      success: true,
      aulas,
      toleranciaPromedio,
      total: aulas.length
    })

  } catch (error) {
    console.error('❌ Error al obtener aulas con tolerancia:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
