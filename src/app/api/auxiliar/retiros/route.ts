import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Obteniendo retiros para auxiliar...')

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

    // Obtener retiros de la IE
    const retiros = await prisma.retiro.findMany({
      where: {
        estudiante: {
          usuario: {
            idIe: ieId
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
        },
        tipoRetiro: true,
        estadoRetiro: true,
        apoderadoRetira: {
          include: {
            usuario: true
          }
        },
        usuarioVerificador: true
      },
      orderBy: [
        { fecha: 'desc' },
        { hora: 'desc' }
      ]
    })

    // Transformar datos para el frontend
    const retirosTransformados = retiros.map(retiro => ({
      id: retiro.idRetiro.toString(),
      estudiante: {
        nombre: retiro.estudiante.usuario.nombre || '',
        apellido: retiro.estudiante.usuario.apellido || '',
        dni: retiro.estudiante.usuario.dni,
        grado: retiro.estudiante.gradoSeccion?.grado?.nombre || '',
        seccion: retiro.estudiante.gradoSeccion?.seccion?.nombre || ''
      },
      tipoRetiro: retiro.tipoRetiro?.nombre || 'Sin especificar',
      fecha: retiro.fecha.toISOString().split('T')[0],
      hora: retiro.hora.toTimeString().slice(0, 5),
      estado: retiro.estadoRetiro?.nombre || 'Pendiente',
      apoderadoQueRetira: retiro.apoderadoRetira 
        ? `${retiro.apoderadoRetira.usuario.nombre} ${retiro.apoderadoRetira.usuario.apellido}`
        : undefined,
      verificadoPor: retiro.usuarioVerificador
        ? `${retiro.usuarioVerificador.nombre} ${retiro.usuarioVerificador.apellido}`
        : undefined,
      observaciones: retiro.observaciones
    }))

    console.log(`✅ ${retirosTransformados.length} retiros obtenidos`)

    return NextResponse.json({
      success: true,
      retiros: retirosTransformados,
      total: retirosTransformados.length
    })

  } catch (error) {
    console.error('❌ Error al obtener retiros:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('➕ Creando nuevo retiro...')

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

    const body = await request.json()
    const {
      estudianteId,
      tipoRetiroId,
      fechaRetiro,
      horaRetiro,
      motivo,
      apoderadoQueRetiraId,
      observaciones
    } = body

    // Validaciones
    if (!estudianteId || !tipoRetiroId || !fechaRetiro || !horaRetiro || !motivo) {
      return NextResponse.json({ 
        error: 'Faltan campos requeridos' 
      }, { status: 400 })
    }

    // Verificar que el estudiante pertenece a la IE
    const estudiante = await prisma.estudiante.findUnique({
      where: { idEstudiante: parseInt(estudianteId) },
      include: { usuario: true }
    })

    if (!estudiante || estudiante.usuario.idIe !== userInfo.idIe) {
      return NextResponse.json({ 
        error: 'Estudiante no encontrado o no pertenece a esta IE' 
      }, { status: 404 })
    }

    // Crear el retiro
    const nuevoRetiro = await prisma.retiro.create({
      data: {
        idEstudiante: parseInt(estudianteId),
        idIe: userInfo.idIe || 1,
        idTipoRetiro: parseInt(tipoRetiroId),
        fecha: new Date(fechaRetiro),
        hora: new Date(`1970-01-01T${horaRetiro}`),
        observaciones,
        apoderadoQueRetira: apoderadoQueRetiraId ? parseInt(apoderadoQueRetiraId) : null
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
        tipoRetiro: true
      }
    })

    console.log('✅ Retiro creado exitosamente:', nuevoRetiro.idRetiro)

    return NextResponse.json({
      success: true,
      message: 'Retiro creado exitosamente',
      retiro: {
        id: nuevoRetiro.idRetiro,
        estudiante: {
          nombre: nuevoRetiro.estudiante.usuario.nombre,
          apellido: nuevoRetiro.estudiante.usuario.apellido,
          grado: nuevoRetiro.estudiante.gradoSeccion?.grado?.nombre,
          seccion: nuevoRetiro.estudiante.gradoSeccion?.seccion?.nombre
        },
        tipoRetiro: nuevoRetiro.tipoRetiro?.nombre,
        fecha: nuevoRetiro.fecha.toISOString().split('T')[0],
        hora: nuevoRetiro.hora.toTimeString().slice(0, 5),
        observaciones: nuevoRetiro.observaciones
      }
    })

  } catch (error) {
    console.error('❌ Error al crear retiro:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
