import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const fecha = url.searchParams.get('fecha')
    const grado = url.searchParams.get('grado')
    const estado = url.searchParams.get('estado')
    const search = url.searchParams.get('search')
    const ieId = url.searchParams.get('ieId')

    if (!ieId) {
      return NextResponse.json(
        { error: 'Institution ID is required' },
        { status: 400 }
      )
    }

    const whereClause: any = {
      idIe: parseInt(ieId)
    }

    if (fecha) {
      const fechaDate = new Date(fecha)
      whereClause.fecha = {
        gte: new Date(fechaDate.setHours(0, 0, 0, 0)),
        lt: new Date(fechaDate.setHours(23, 59, 59, 999))
      }
    }

    if (estado && estado !== 'TODOS') {
      whereClause.estado = estado
    }

    const retiros = await prisma.retiro.findMany({
      where: whereClause,
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
        },
        estadoRetiro: true,
        tipoRetiro: true,
        usuarioVerificador: {
          select: {
            nombre: true,
            apellido: true
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    })

    // Filtrar por grado y búsqueda si se especifican
    const filteredRetiros = retiros.filter(retiro => {
      const gradoMatch = !grado || retiro.estudiante.gradoSeccion?.grado?.nombre === grado
      const searchMatch = !search || 
        `${retiro.estudiante.usuario.nombre} ${retiro.estudiante.usuario.apellido}`
          .toLowerCase().includes(search.toLowerCase()) ||
        retiro.estudiante.usuario.dni.includes(search) ||
        (retiro.tipoRetiro?.nombre || '').toLowerCase().includes(search.toLowerCase())
      
      return gradoMatch && searchMatch
    })

    const transformedRetiros = filteredRetiros.map(retiro => ({
      id: retiro.idRetiro.toString(),
      fecha: retiro.fecha.toISOString(),
      horaRetiro: retiro.hora.toTimeString().slice(0, 5),
      motivo: retiro.tipoRetiro?.nombre || 'Retiro',
      observaciones: retiro.observaciones || '',
      personaRecoge: retiro.dniVerificado || '',
      dniPersonaRecoge: retiro.dniVerificado || '',
      estado: retiro.estadoRetiro?.nombre || 'PENDIENTE',
      autorizado: retiro.estadoRetiro?.codigo === 'AUTORIZADO',
      fechaAutorizacion: retiro.updatedAt?.toISOString() || '',
      observacionesAutorizacion: retiro.observaciones || '',
      estudiante: {
        id: retiro.estudiante.idEstudiante.toString(),
        nombre: retiro.estudiante.usuario.nombre,
        apellido: retiro.estudiante.usuario.apellido,
        dni: retiro.estudiante.usuario.dni,
        grado: retiro.estudiante.gradoSeccion?.grado?.nombre || '',
        seccion: retiro.estudiante.gradoSeccion?.seccion?.nombre || ''
      },
      autorizadoPor: retiro.usuarioVerificador ? {
        nombre: retiro.usuarioVerificador.nombre,
        apellido: retiro.usuarioVerificador.apellido
      } : null
    }))

    return NextResponse.json({
      data: transformedRetiros,
      total: transformedRetiros.length
    })

  } catch (error) {
    console.error('Error fetching retiros:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      estudianteId,
      fecha,
      motivo,
      horaRetiro,
      observaciones,
      personaRecoge,
      dniPersonaRecoge
    } = body

    // Buscar o crear tipo de retiro
    let tipoRetiro = await prisma.tipoRetiro.findFirst({
      where: { nombre: motivo }
    })

    if (!tipoRetiro) {
      tipoRetiro = await prisma.tipoRetiro.create({
        data: { nombre: motivo }
      })
    }

    // Buscar estado inicial
    let estadoRetiro = await prisma.estadoRetiro.findFirst({
      where: { codigo: 'PENDIENTE' }
    })

    if (!estadoRetiro) {
      estadoRetiro = await prisma.estadoRetiro.create({
        data: { 
          codigo: 'PENDIENTE',
          nombre: 'Pendiente',
          orden: 1
        }
      })
    }

    const nuevoRetiro = await prisma.retiro.create({
      data: {
        idEstudiante: parseInt(estudianteId),
        fecha: new Date(fecha),
        hora: new Date(`1970-01-01T${horaRetiro}:00`),
        idTipoRetiro: tipoRetiro.idTipoRetiro,
        observaciones,
        dniVerificado: dniPersonaRecoge,
        idEstadoRetiro: estadoRetiro.idEstadoRetiro,
        idIe: 1 // IE por defecto
      }
    })

    return NextResponse.json({
      message: 'Retiro solicitado exitosamente',
      id: nuevoRetiro.idRetiro
    })

  } catch (error) {
    console.error('Error creating retiro:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
