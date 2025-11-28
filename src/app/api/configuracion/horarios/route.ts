import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

/**
 * GET /api/configuracion/horarios
 * Obtiene la configuración de horarios de la institución
 */
export async function GET(request: NextRequest) {
  try {
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

    const ieId = decoded.ieId || 1

    // Buscar configuración en la base de datos
    let configuracion = await prisma.configuracionIE.findUnique({
      where: { idIe: ieId }
    })

    // Si no existe, crear una configuración por defecto
    if (!configuracion) {
      configuracion = await prisma.configuracionIE.create({
        data: {
          idIe: ieId,
          horaIngreso: '07:30',
          horaFinIngreso: '08:00',
          horaSalida: '13:00',
          toleranciaMinutos: 15,
          diasLaborables: ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']
        }
      })
    }

    return NextResponse.json({
      success: true,
      configuracion: {
        horaIngreso: configuracion.horaIngreso || '07:30',
        horaFinIngreso: configuracion.horaFinIngreso || '08:00',
        horaSalida: configuracion.horaSalida || '13:00',
        toleranciaMinutos: configuracion.toleranciaMinutos,
        diasLaborables: configuracion.diasLaborables
      }
    })

  } catch (error) {
    console.error('Error al obtener configuración de horarios:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

/**
 * PUT /api/configuracion/horarios
 * Actualiza la configuración de horarios de la institución
 */
export async function PUT(request: NextRequest) {
  try {
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

    // Solo administrativos pueden cambiar horarios
    if (!['ADMINISTRATIVO', 'AUXILIAR'].includes(decoded.rol)) {
      return NextResponse.json({ error: 'No autorizado para modificar horarios' }, { status: 403 })
    }

    const ieId = decoded.ieId || 1
    const body = await request.json()

    const {
      horaIngreso,
      horaFinIngreso,
      horaSalida,
      toleranciaMinutos,
      diasLaborables
    } = body

    // Guardar en la base de datos usando upsert
    const configuracionActualizada = await prisma.configuracionIE.upsert({
      where: { idIe: ieId },
      update: {
        horaIngreso: horaIngreso || '07:30',
        horaFinIngreso: horaFinIngreso || '08:00',
        horaSalida: horaSalida || '13:00',
        toleranciaMinutos: toleranciaMinutos || 15,
        diasLaborables: diasLaborables || ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']
      },
      create: {
        idIe: ieId,
        horaIngreso: horaIngreso || '07:30',
        horaFinIngreso: horaFinIngreso || '08:00',
        horaSalida: horaSalida || '13:00',
        toleranciaMinutos: toleranciaMinutos || 15,
        diasLaborables: diasLaborables || ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']
      }
    })

    // Actualizar tolerancia en todos los horarios de clase de la IE
    if (toleranciaMinutos) {
      await prisma.horarioClase.updateMany({
        where: {
          gradoSeccion: {
            grado: {
              nivel: {
                idIe: ieId
              }
            }
          }
        },
        data: {
          toleranciaMin: toleranciaMinutos
        }
      })
    }

    console.log(`✅ Configuración guardada en BD para IE ${ieId} por usuario ${decoded.userId}`)

    return NextResponse.json({
      success: true,
      message: 'Configuración de horarios actualizada correctamente',
      configuracion: {
        horaIngreso: configuracionActualizada.horaIngreso,
        horaFinIngreso: configuracionActualizada.horaFinIngreso,
        horaSalida: configuracionActualizada.horaSalida,
        toleranciaMinutos: configuracionActualizada.toleranciaMinutos,
        diasLaborables: configuracionActualizada.diasLaborables
      }
    })

  } catch (error) {
    console.error('Error al actualizar configuración de horarios:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
