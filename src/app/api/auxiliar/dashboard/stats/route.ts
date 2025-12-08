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
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const ieId = decoded.ieId || decoded.idIe || 1

    // Obtener fecha de hoy en Perú (UTC-5)
    const ahoraUTC = new Date()
    const horaPeruParaCalculo = new Date(ahoraUTC.getTime() - (5 * 60 * 60 * 1000))
    const fechaHoy = new Date(horaPeruParaCalculo.getFullYear(), horaPeruParaCalculo.getMonth(), horaPeruParaCalculo.getDate())

    console.log('📊 Obteniendo stats del auxiliar para IE:', ieId, 'Fecha:', fechaHoy.toISOString())

    // Contar estudiantes totales de la IE
    const totalEstudiantes = await prisma.estudiante.count({
      where: {
        usuario: {
          idIe: ieId,
          estado: 'ACTIVO'
        }
      }
    })

    // Contar entradas de hoy (estudiantes que ingresaron a la IE)
    const estudiantesPresentes = await prisma.asistenciaIE.count({
      where: {
        fecha: fechaHoy,
        horaIngreso: { not: null },
        estudiante: {
          usuario: {
            idIe: ieId
          }
        }
      }
    })

    // Estudiantes en IE ahora (ingresaron pero no han salido)
    const estudiantesEnIE = await prisma.asistenciaIE.count({
      where: {
        fecha: fechaHoy,
        horaIngreso: { not: null },
        horaSalida: null,
        estudiante: {
          usuario: {
            idIe: ieId
          }
        }
      }
    })

    // Contar retiros de hoy
    const retirosHoy = await prisma.retiro.count({
      where: {
        fecha: fechaHoy,
        idIe: ieId
      }
    })

    // Obtener tolerancia promedio de los horarios de clase
    const horariosConTolerancia = await prisma.horarioClase.findMany({
      where: {
        gradoSeccion: {
          grado: {
            nivel: {
              idIe: ieId
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

    // Contar tardanzas de hoy (alertas de tolerancia)
    const estadoTardanza = await prisma.estadoAsistencia.findFirst({
      where: { codigo: 'TARDANZA' }
    })

    let alertasTolerancia = 0
    if (estadoTardanza) {
      alertasTolerancia = await prisma.asistencia.count({
        where: {
          fecha: fechaHoy,
          idEstadoAsistencia: estadoTardanza.idEstadoAsistencia,
          estudiante: {
            usuario: {
              idIe: ieId
            }
          }
        }
      })
    }

    // Calcular estudiantes ausentes (total - presentes)
    const estudiantesAusentes = totalEstudiantes - estudiantesPresentes

    console.log('📊 Stats calculados:', {
      totalEstudiantes,
      estudiantesPresentes,
      estudiantesAusentes,
      estudiantesEnIE,
      retirosHoy,
      toleranciaPromedio,
      alertasTolerancia
    })

    return NextResponse.json({
      success: true,
      stats: {
        estudiantesPresentes,
        estudiantesAusentes,
        retirosHoy,
        estudiantesEnIE,
        toleranciaPromedio,
        alertasTolerancia,
        totalEstudiantes,
        fecha: fechaHoy.toISOString().split('T')[0]
      }
    })

  } catch (error) {
    console.error('Error obteniendo stats del auxiliar:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
