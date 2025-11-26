import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { puedeGestionarEstudiante, inicializarEstadosRetiro, inicializarTiposRetiro } from '@/lib/retiros-utils'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    if (decoded.rol !== 'APODERADO') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Inicializar datos básicos
    await inicializarEstadosRetiro()
    await inicializarTiposRetiro()

    const body = await request.json()
    const { estudianteId, fecha, hora, observaciones, tipoRetiroNombre } = body

    // Validaciones
    if (!estudianteId || !fecha || !hora) {
      return NextResponse.json(
        { error: 'Estudiante, fecha y hora son campos requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el estudiante pertenece al apoderado
    const puedeGestionar = await puedeGestionarEstudiante(decoded.userId, parseInt(estudianteId))
    if (!puedeGestionar) {
      return NextResponse.json(
        { error: 'No tiene permisos para solicitar retiro de este estudiante' },
        { status: 403 }
      )
    }

    // Obtener el estado "SOLICITADO"
    const estadoSolicitado = await prisma.estadoRetiro.findFirst({
      where: { codigo: 'SOLICITADO' }
    })

    if (!estadoSolicitado) {
      return NextResponse.json(
        { error: 'Error de configuración: estado SOLICITADO no encontrado' },
        { status: 500 }
      )
    }

    // Obtener el tipo de retiro si se especificó
    let tipoRetiro = null
    if (tipoRetiroNombre) {
      tipoRetiro = await prisma.tipoRetiro.findFirst({
        where: { nombre: tipoRetiroNombre }
      })
    }

    // Obtener datos del estudiante para validaciones
    const estudiante = await prisma.estudiante.findUnique({
      where: { idEstudiante: parseInt(estudianteId) },
      include: {
        usuario: true,
        gradoSeccion: {
          include: {
            grado: true,
            seccion: true
          }
        }
      }
    })

    if (!estudiante) {
      return NextResponse.json(
        { error: 'Estudiante no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que no haya otro retiro pendiente para la misma fecha
    const retiroExistente = await prisma.retiro.findFirst({
      where: {
        idEstudiante: parseInt(estudianteId),
        fecha: new Date(fecha),
        idEstadoRetiro: {
          in: [estadoSolicitado.idEstadoRetiro] // Solo verificar estados activos
        }
      }
    })

    if (retiroExistente) {
      return NextResponse.json(
        { error: 'Ya existe una solicitud de retiro para esta fecha' },
        { status: 400 }
      )
    }

    // Crear la solicitud de retiro
    const nuevoRetiro = await prisma.retiro.create({
      data: {
        idEstudiante: parseInt(estudianteId),
        idIe: estudiante.idIe || 1, // Usar IE del estudiante o default
        fecha: new Date(fecha),
        hora: new Date(`1970-01-01T${hora}:00.000Z`), // Convertir hora a Time
        observaciones: observaciones || null,
        idTipoRetiro: tipoRetiro?.idTipoRetiro || null,
        idEstadoRetiro: estadoSolicitado.idEstadoRetiro,
        origen: 'APODERADO'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Solicitud de retiro creada exitosamente',
      retiro: {
        id: nuevoRetiro.idRetiro.toString(),
        fecha: nuevoRetiro.fecha.toISOString().split('T')[0],
        hora: nuevoRetiro.hora.toISOString().split('T')[1].substring(0, 5),
        observaciones: nuevoRetiro.observaciones || '',
        tipoRetiro: tipoRetiro?.nombre || 'No especificado',
        estado: estadoSolicitado.nombre,
        estudiante: `${estudiante.usuario.apellido}, ${estudiante.usuario.nombre}`,
        grado: estudiante.gradoSeccion ? 
          `${estudiante.gradoSeccion.grado.nombre}° ${estudiante.gradoSeccion.seccion.nombre}` : 
          'Sin grado asignado'
      }
    })

  } catch (error) {
    console.error('Error creating solicitud de retiro:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
