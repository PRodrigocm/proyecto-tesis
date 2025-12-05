import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// GET /api/apoderados/retiros - Listar retiros de los estudiantes del apoderado
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Obtener apoderado
    const apoderado = await prisma.apoderado.findFirst({
      where: { idUsuario: decoded.userId }
    })

    if (!apoderado) {
      return NextResponse.json({ error: 'Apoderado no encontrado' }, { status: 404 })
    }

    // Obtener estudiantes del apoderado
    const estudiantesApoderado = await prisma.estudianteApoderado.findMany({
      where: { idApoderado: apoderado.idApoderado },
      select: { idEstudiante: true }
    })

    const idsEstudiantes = estudiantesApoderado.map((e: typeof estudiantesApoderado[number]) => e.idEstudiante)

    // Obtener retiros de los estudiantes
    const retiros = await prisma.retiro.findMany({
      where: {
        idEstudiante: { in: idsEstudiantes }
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
        },
        estadoRetiro: true,
        tipoRetiro: true
      },
      orderBy: { fecha: 'desc' }
    })

    return NextResponse.json({
      success: true,
      retiros: retiros.map((r: typeof retiros[number]) => ({
        id: r.idRetiro.toString(),
        fecha: r.fecha.toISOString().split('T')[0],
        hora: r.hora.toISOString().split('T')[1].substring(0, 5),
        estudiante: {
          id: r.estudiante.idEstudiante,
          nombre: r.estudiante.usuario?.nombre || '',
          apellido: r.estudiante.usuario?.apellido || '',
          grado: r.estudiante.gradoSeccion?.grado?.nombre || '',
          seccion: r.estudiante.gradoSeccion?.seccion?.nombre || ''
        },
        motivo: r.tipoRetiro?.nombre || 'No especificado',
        tipoRetiro: r.tipoRetiro?.nombre || 'No especificado',
        estado: r.estadoRetiro?.codigo || 'PENDIENTE',
        estadoNombre: r.estadoRetiro?.nombre || 'Pendiente',
        observaciones: r.observaciones || '',
        origen: r.origen || 'AULA',
        personaRecoge: (r as any).personaRecoge || null,
        dniPersonaRecoge: (r as any).dniVerificado || null,
        creadoEn: r.fecha.toISOString()
      }))
    })

  } catch (error) {
    console.error('Error al obtener retiros:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST /api/apoderados/retiros - Crear solicitud de retiro (redirige a /solicitar)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    if (decoded.rol !== 'APODERADO') {
      return NextResponse.json({ error: 'Solo apoderados pueden solicitar retiros' }, { status: 403 })
    }

    const body = await request.json()
    const { idEstudiante, estudianteId, fecha, fechaRetiro, hora, horaRetiro, motivo, observaciones, tipoRetiro } = body

    const estudianteIdFinal = idEstudiante || estudianteId
    const fechaFinal = fecha || fechaRetiro
    const horaFinal = hora || horaRetiro

    if (!estudianteIdFinal || !fechaFinal) {
      return NextResponse.json({ error: 'Estudiante y fecha son requeridos' }, { status: 400 })
    }

    // Obtener apoderado
    const apoderado = await prisma.apoderado.findFirst({
      where: { idUsuario: decoded.userId }
    })

    if (!apoderado) {
      return NextResponse.json({ error: 'Apoderado no encontrado' }, { status: 404 })
    }

    // Verificar que el estudiante pertenece al apoderado
    const relacion = await prisma.estudianteApoderado.findFirst({
      where: {
        idApoderado: apoderado.idApoderado,
        idEstudiante: parseInt(estudianteIdFinal)
      }
    })

    if (!relacion) {
      return NextResponse.json({ error: 'No tiene permisos para este estudiante' }, { status: 403 })
    }

    // Obtener estudiante
    const estudiante = await prisma.estudiante.findUnique({
      where: { idEstudiante: parseInt(estudianteIdFinal) },
      include: {
        usuario: true,
        gradoSeccion: {
          include: { grado: true, seccion: true }
        }
      }
    })

    if (!estudiante) {
      return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 })
    }

    // Obtener estado PENDIENTE o SOLICITADO
    let estadoRetiro = await prisma.estadoRetiro.findFirst({
      where: { codigo: 'SOLICITADO' }
    })

    if (!estadoRetiro) {
      estadoRetiro = await prisma.estadoRetiro.findFirst({
        where: { codigo: 'PENDIENTE' }
      })
    }

    if (!estadoRetiro) {
      return NextResponse.json({ error: 'Estado de retiro no configurado' }, { status: 500 })
    }

    // Obtener tipo de retiro si se especificó
    let tipoRetiroDb: { idTipoRetiro: number } | null = null
    if (tipoRetiro) {
      tipoRetiroDb = await prisma.tipoRetiro.findFirst({
        where: { nombre: tipoRetiro }
      })
    }

    // Crear retiro
    const nuevoRetiro = await prisma.retiro.create({
      data: {
        idEstudiante: parseInt(estudianteIdFinal),
        idIe: estudiante.idIe || 1,
        idGradoSeccion: estudiante.idGradoSeccion,
        fecha: new Date(fechaFinal),
        hora: horaFinal ? new Date(`1970-01-01T${horaFinal}:00.000Z`) : new Date(),
        observaciones: motivo || observaciones || null,
        idTipoRetiro: tipoRetiroDb?.idTipoRetiro || null,
        idEstadoRetiro: estadoRetiro.idEstadoRetiro,
        origen: 'APODERADO'
      }
    })

    console.log(`✅ Retiro solicitado por apoderado ${decoded.userId} para estudiante ${estudianteIdFinal}`)

    return NextResponse.json({
      success: true,
      message: 'Solicitud de retiro creada exitosamente',
      retiro: {
        id: nuevoRetiro.idRetiro.toString(),
        fecha: nuevoRetiro.fecha.toISOString().split('T')[0],
        hora: nuevoRetiro.hora.toISOString().split('T')[1].substring(0, 5),
        estudiante: `${estudiante.usuario?.apellido}, ${estudiante.usuario?.nombre}`,
        grado: estudiante.gradoSeccion 
          ? `${estudiante.gradoSeccion.grado.nombre} ${estudiante.gradoSeccion.seccion.nombre}`
          : 'Sin asignar',
        estado: estadoRetiro.nombre
      }
    })

  } catch (error) {
    console.error('Error al crear retiro:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
