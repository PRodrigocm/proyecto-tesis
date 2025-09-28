import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/retiros - Iniciando consulta de retiros')
    
    // Obtener ieId del token de usuario
    const authHeader = request.headers.get('authorization')
    let ieId = 1 // Default
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
        ieId = decoded.ieId || 1
        console.log('✅ Token decodificado, ieId:', ieId)
      } catch (error) {
        console.log('⚠️ Error decoding token, using default ieId:', ieId)
      }
    } else {
      console.log('⚠️ No auth header, using default ieId:', ieId)
    }

    const url = new URL(request.url)
    const fecha = url.searchParams.get('fecha')
    const grado = url.searchParams.get('grado')
    const estado = url.searchParams.get('estado')
    const search = url.searchParams.get('search')

    console.log('📋 Parámetros de consulta:', { fecha, grado, estado, search })

    const whereClause: any = {
      idIe: ieId
    }

    // Solo aplicar filtro de fecha si se especifica explícitamente
    if (fecha && fecha !== new Date().toISOString().split('T')[0]) {
      const fechaDate = new Date(fecha)
      whereClause.fecha = {
        gte: new Date(fechaDate.setHours(0, 0, 0, 0)),
        lt: new Date(fechaDate.setHours(23, 59, 59, 999))
      }
      console.log('📅 Filtro por fecha aplicado:', whereClause.fecha)
    } else {
      console.log('📅 Sin filtro de fecha - mostrando todos los retiros')
    }

    // Solo aplicar filtro de estado si no es TODOS
    if (estado && estado !== 'TODOS') {
      whereClause.estadoRetiro = {
        codigo: estado
      }
      console.log('🏷️ Filtro por estado aplicado:', estado)
    } else {
      console.log('🏷️ Sin filtro de estado - mostrando todos los estados')
    }

    console.log('🔍 Cláusula WHERE final:', JSON.stringify(whereClause, null, 2))

    // Primero verificar si hay retiros en la BD para esta IE
    const totalRetiros = await prisma.retiro.count({
      where: { idIe: ieId }
    })
    console.log(`📊 Total de retiros en BD para IE ${ieId}: ${totalRetiros}`)

    // Si no hay retiros, verificar todas las IEs
    if (totalRetiros === 0) {
      const totalTodasIEs = await prisma.retiro.count()
      console.log(`📊 Total de retiros en toda la BD: ${totalTodasIEs}`)
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

    console.log(`📊 Retiros encontrados en BD: ${retiros.length}`)

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

    console.log(`🔍 Retiros después de filtros: ${filteredRetiros.length}`)

    const transformedRetiros = filteredRetiros.map(retiro => {
      // Extraer persona que recoge de las observaciones si existe
      const observaciones = retiro.observaciones || ''
      const personaRecogeMatch = observaciones.match(/Persona que recoge: ([^|]+)/)
      const personaRecoge = personaRecogeMatch ? personaRecogeMatch[1].trim() : ''
      const observacionesLimpias = observaciones.replace(/\s*\|\s*Persona que recoge: [^|]+/, '').trim()

      return {
        id: retiro.idRetiro.toString(),
        fecha: retiro.fecha.toISOString(),
        horaRetiro: retiro.hora.toTimeString().slice(0, 5),
        motivo: retiro.tipoRetiro?.nombre || 'Retiro',
        observaciones: observacionesLimpias,
        personaRecoge: personaRecoge,
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
      }
    })

    console.log(`✅ Enviando ${transformedRetiros.length} retiros al frontend`)

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
      idGradoSeccion,
      fecha,
      motivo,
      horaRetiro,
      observaciones,
      personaRecoge,
      dniPersonaRecoge,
      origen,
      medioContacto,
      apoderadoContactado,
      apoderadoQueRetira
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
        idGradoSeccion: idGradoSeccion ? parseInt(idGradoSeccion) : null,
        fecha: new Date(fecha),
        hora: new Date(`1970-01-01T${horaRetiro}:00`),
        idTipoRetiro: tipoRetiro.idTipoRetiro,
        origen: origen || null,
        medioContacto: medioContacto || null,
        apoderadoContactado: apoderadoContactado ? parseInt(apoderadoContactado) : null,
        apoderadoQueRetira: apoderadoQueRetira ? parseInt(apoderadoQueRetira) : null,
        observaciones: observaciones ? `${observaciones}${personaRecoge ? ` | Persona que recoge: ${personaRecoge}` : ''}` : (personaRecoge ? `Persona que recoge: ${personaRecoge}` : undefined),
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
