import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

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
        apoderadoQueRetira: {
          include: {
            usuario: true
          }
        },
        autorizadoPorUsuario: {
          include: {
            usuario: true
          }
        }
      },
      orderBy: [
        { fechaRetiro: 'desc' },
        { horaRetiro: 'desc' }
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
      fechaRetiro: retiro.fechaRetiro.toISOString().split('T')[0],
      horaRetiro: retiro.horaRetiro || '',
      motivo: retiro.motivo || '',
      estado: retiro.estado,
      apoderadoQueRetira: retiro.apoderadoQueRetira 
        ? `${retiro.apoderadoQueRetira.usuario.nombre} ${retiro.apoderadoQueRetira.usuario.apellido}`
        : undefined,
      autorizadoPor: retiro.autorizadoPorUsuario
        ? `${retiro.autorizadoPorUsuario.usuario.nombre} ${retiro.autorizadoPorUsuario.usuario.apellido}`
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
  } finally {
    await prisma.$disconnect()
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
        idTipoRetiro: parseInt(tipoRetiroId),
        fechaRetiro: new Date(fechaRetiro),
        horaRetiro,
        motivo,
        observaciones,
        estado: 'PENDIENTE',
        idApoderadoQueRetira: apoderadoQueRetiraId ? parseInt(apoderadoQueRetiraId) : null,
        creadoPor: userId
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
        fechaRetiro: nuevoRetiro.fechaRetiro.toISOString().split('T')[0],
        horaRetiro: nuevoRetiro.horaRetiro,
        estado: nuevoRetiro.estado
      }
    })

  } catch (error) {
    console.error('❌ Error al crear retiro:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
