import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

// GET - Obtener eventos del calendario
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const ieId = decoded.ieId || 1

    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get('fecha')
    const mes = searchParams.get('mes')
    const año = searchParams.get('año')
    const tipoDia = searchParams.get('tipoDia')

    const where: any = { idIe: ieId }

    // Filtrar por fecha específica
    if (fecha) {
      const fechaBusqueda = new Date(fecha)
      where.fechaInicio = { lte: fechaBusqueda }
      where.fechaFin = { gte: fechaBusqueda }
    }

    // Filtrar por mes y año
    if (mes && año) {
      const startDate = new Date(parseInt(año), parseInt(mes) - 1, 1)
      const endDate = new Date(parseInt(año), parseInt(mes), 0)
      
      where.OR = [
        {
          fechaInicio: { gte: startDate, lte: endDate }
        },
        {
          fechaFin: { gte: startDate, lte: endDate }
        },
        {
          AND: [
            { fechaInicio: { lte: startDate } },
            { fechaFin: { gte: endDate } }
          ]
        }
      ]
    }

    // Filtrar por tipo de día
    if (tipoDia) {
      where.tipoDia = tipoDia
    }

    // Obtener eventos del calendario escolar
    const eventos = await prisma.calendarioEscolar.findMany({
      where,
      include: {
        ie: {
          select: {
            nombre: true
          }
        }
      },
      orderBy: {
        fechaInicio: 'asc'
      }
    })

    // Obtener reuniones del mismo período
    const whereReuniones: any = { idIe: ieId }
    
    if (mes && año) {
      const startDate = new Date(parseInt(año), parseInt(mes) - 1, 1)
      const endDate = new Date(parseInt(año), parseInt(mes), 0)
      
      whereReuniones.fecha = { gte: startDate, lte: endDate }
    }

    const reuniones = await prisma.reunion.findMany({
      where: whereReuniones,
      orderBy: {
        fecha: 'asc'
      }
    })

    // Transformar eventos del calendario
    const eventosTransformados = eventos.map(evento => ({
      id: evento.idCalendario.toString(),
      titulo: evento.descripcion || evento.tipoDia,
      descripcion: evento.descripcion || '',
      fechaInicio: evento.fechaInicio.toISOString().split('T')[0],
      fechaFin: evento.fechaFin.toISOString().split('T')[0],
      tipo: evento.tipoDia === 'FERIADO' ? 'FERIADO' : 'ACADEMICO',
      color: evento.tipoDia === 'FERIADO' ? '#EF4444' : '#10B981',
      esLectivo: evento.tipoDia !== 'FERIADO'
    }))

    // Transformar reuniones
    const reunionesTransformadas = reuniones.map(reunion => ({
      id: `reunion-${reunion.idReunion}`,
      titulo: reunion.titulo,
      descripcion: reunion.descripcion || '',
      fechaInicio: reunion.fecha.toISOString().split('T')[0],
      fechaFin: reunion.fecha.toISOString().split('T')[0],
      tipo: 'ESPECIAL' as const,
      color: '#3B82F6',
      esLectivo: false
    }))

    // Combinar eventos y reuniones
    const todosEventos = [...eventosTransformados, ...reunionesTransformadas]

    return NextResponse.json({
      success: true,
      data: todosEventos
    })

  } catch (error) {
    console.error('❌ Error fetching calendario:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

// POST - Crear evento en calendario
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const ieId = decoded.ieId || 1

    const body = await request.json()
    const {
      fechaInicio,
      fechaFin,
      tipoDia,
      descripcion
    } = body

    // Validar campos requeridos
    if (!fechaInicio || !fechaFin || !tipoDia) {
      return NextResponse.json({
        error: 'Campos requeridos: fechaInicio, fechaFin, tipoDia'
      }, { status: 400 })
    }

    // Validar tipo de día
    const tiposValidos = ['CLASES', 'FERIADO', 'VACACIONES', 'EVENTO']
    if (!tiposValidos.includes(tipoDia)) {
      return NextResponse.json({
        error: `tipoDia debe ser uno de: ${tiposValidos.join(', ')}`
      }, { status: 400 })
    }

    const nuevoEvento = await prisma.calendarioEscolar.create({
      data: {
        idIe: ieId,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        tipoDia,
        descripcion: descripcion || null
      },
      include: {
        ie: {
          select: {
            nombre: true
          }
        }
      }
    })

    // Enviar notificaciones a los apoderados
    try {
      const apoderados = await prisma.usuario.findMany({
        where: {
          idIe: ieId,
          roles: {
            some: {
              rol: {
                nombre: 'APODERADO'
              }
            }
          }
        },
        select: {
          idUsuario: true,
          nombre: true,
          apellido: true,
          email: true
        }
      })

      // Crear notificaciones para cada apoderado
      const notificaciones = apoderados.map(apoderado => ({
        idUsuario: apoderado.idUsuario,
        tipo: 'EVENTO_CALENDARIO' as const,
        titulo: `Nuevo evento: ${descripcion || tipoDia}`,
        mensaje: `Se ha registrado un evento en el calendario escolar del ${new Date(fechaInicio).toLocaleDateString('es-ES')} al ${new Date(fechaFin).toLocaleDateString('es-ES')}.`,
        leido: false
      }))

      if (notificaciones.length > 0) {
        await prisma.notificacion.createMany({
          data: notificaciones
        })
        console.log(`✅ ${notificaciones.length} notificaciones creadas para evento`)
      }
    } catch (notifError) {
      console.error('⚠️ Error al enviar notificaciones:', notifError)
      // No fallar la creación del evento si las notificaciones fallan
    }

    return NextResponse.json({
      success: true,
      message: 'Evento creado exitosamente',
      data: nuevoEvento
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating evento:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar evento
export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    await prisma.calendarioEscolar.delete({
      where: {
        idCalendario: parseInt(id)
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Evento eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error deleting evento:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
