import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// POST /api/porteria/ingreso - Registrar ingreso de estudiante por QR en portería
export async function POST(request: NextRequest) {
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

    if (!['AUXILIAR', 'ADMINISTRATIVO'].includes(decoded.rol)) {
      return NextResponse.json({ error: 'No autorizado para registrar ingresos' }, { status: 403 })
    }

    const body = await request.json()
    const { codigoQR, dni } = body

    if (!codigoQR && !dni) {
      return NextResponse.json({ error: 'Se requiere código QR o DNI' }, { status: 400 })
    }

    // Buscar estudiante por código QR o por DNI del usuario
    let estudiante: any = null

    if (codigoQR) {
      estudiante = await prisma.estudiante.findFirst({
        where: { codigoQR: codigoQR },
        include: {
          usuario: true,
          gradoSeccion: {
            include: {
              grado: { include: { nivel: true } },
              seccion: true
            }
          }
        }
      })
    } else if (dni) {
      const usuario = await prisma.usuario.findFirst({
        where: { dni: dni }
      })
      if (usuario) {
        estudiante = await prisma.estudiante.findFirst({
          where: { idUsuario: usuario.idUsuario },
          include: {
            usuario: true,
            gradoSeccion: {
              include: {
                grado: { include: { nivel: true } },
                seccion: true
              }
            }
          }
        })
      }
    }

    if (!estudiante) {
      return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 })
    }

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const ahora = new Date()

    // Verificar si ya tiene registro de ingreso hoy
    const registroExistente = await prisma.asistenciaIE.findFirst({
      where: {
        idEstudiante: estudiante.idEstudiante,
        fecha: hoy
      }
    })

    if (registroExistente) {
      return NextResponse.json({
        success: false,
        message: 'El estudiante ya registró su ingreso hoy',
        data: {
          estudiante: {
            id: estudiante.idEstudiante,
            nombre: estudiante.usuario?.nombre,
            apellido: estudiante.usuario?.apellido,
            grado: estudiante.gradoSeccion?.grado?.nombre,
            seccion: estudiante.gradoSeccion?.seccion?.nombre
          },
          horaIngreso: registroExistente.horaIngreso,
          estado: registroExistente.estado
        }
      }, { status: 409 })
    }

    // Crear registro de ingreso en AsistenciaIE
    const nuevoIngreso = await prisma.asistenciaIE.create({
      data: {
        idEstudiante: estudiante.idEstudiante,
        idIe: decoded.ieId || 1,
        fecha: hoy,
        horaIngreso: ahora,
        estado: 'INGRESADO',
        registradoIngresoPor: decoded.userId
      }
    })

    console.log(`✅ Ingreso registrado: ${estudiante.usuario?.nombre} ${estudiante.usuario?.apellido} a las ${ahora.toLocaleTimeString()}`)

    return NextResponse.json({
      success: true,
      message: 'Ingreso registrado correctamente',
      data: {
        idAsistenciaIE: nuevoIngreso.idAsistenciaIE,
        estudiante: {
          id: estudiante.idEstudiante,
          nombre: estudiante.usuario?.nombre,
          apellido: estudiante.usuario?.apellido,
          dni: estudiante.usuario?.dni,
          codigo: estudiante.codigoQR,
          grado: estudiante.gradoSeccion?.grado?.nombre,
          seccion: estudiante.gradoSeccion?.seccion?.nombre,
          nivel: estudiante.gradoSeccion?.grado?.nivel?.nombre
        },
        horaIngreso: ahora,
        estado: 'INGRESADO',
        registradoPor: decoded.userId
      }
    })

  } catch (error) {
    console.error('Error al registrar ingreso:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: errorMessage 
    }, { status: 500 })
  }
}

// GET /api/porteria/ingreso - Obtener ingresos del día
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

    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get('fecha') || new Date().toISOString().split('T')[0]
    const grado = searchParams.get('grado')
    const seccion = searchParams.get('seccion')

    const fechaConsulta = new Date(fecha)
    fechaConsulta.setHours(0, 0, 0, 0)

    const whereClause: any = {
      fecha: fechaConsulta,
      idIe: decoded.ieId || 1
    }

    const ingresos = await prisma.asistenciaIE.findMany({
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
        usuarioIngreso: {
          select: { nombre: true, apellido: true }
        }
      },
      orderBy: { horaIngreso: 'desc' }
    })

    // Filtrar por grado/sección si se especifica
    let ingresosFiltrados = ingresos
    if (grado) {
      ingresosFiltrados = ingresosFiltrados.filter(
        i => i.estudiante.gradoSeccion?.grado?.nombre === grado
      )
    }
    if (seccion) {
      ingresosFiltrados = ingresosFiltrados.filter(
        i => i.estudiante.gradoSeccion?.seccion?.nombre === seccion
      )
    }

    return NextResponse.json({
      success: true,
      fecha: fecha,
      totalIngresos: ingresosFiltrados.length,
      ingresos: ingresosFiltrados.map(i => ({
        id: i.idAsistenciaIE,
        estudiante: {
          id: i.estudiante.idEstudiante,
          nombre: i.estudiante.usuario?.nombre,
          apellido: i.estudiante.usuario?.apellido,
          dni: i.estudiante.usuario?.dni,
          grado: i.estudiante.gradoSeccion?.grado?.nombre,
          seccion: i.estudiante.gradoSeccion?.seccion?.nombre
        },
        horaIngreso: i.horaIngreso,
        horaSalida: i.horaSalida,
        estado: i.estado,
        registradoPor: i.usuarioIngreso 
          ? `${i.usuarioIngreso.nombre} ${i.usuarioIngreso.apellido}`
          : null
      }))
    })

  } catch (error) {
    console.error('Error al obtener ingresos:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
