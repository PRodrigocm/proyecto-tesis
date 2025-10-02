import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    console.log('📱 Procesando escaneo de código QR...')

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
    const { qrCode, accion: tipoAccion } = body

    if (!qrCode) {
      return NextResponse.json({ error: 'Código QR requerido' }, { status: 400 })
    }

    if (!tipoAccion || !['entrada', 'salida'].includes(tipoAccion)) {
      return NextResponse.json({ error: 'Acción requerida (entrada o salida)' }, { status: 400 })
    }

    console.log('🔍 Buscando estudiante con código QR:', qrCode)

    // Buscar estudiante por código QR
    const estudiante = await prisma.estudiante.findFirst({
      where: {
        qr: qrCode,
        usuario: {
          idIe: userInfo.idIe,
          estado: 'ACTIVO'
        }
      },
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
      return NextResponse.json({ 
        error: 'Código QR no válido o estudiante no encontrado' 
      }, { status: 404 })
    }

    // Obtener fecha actual
    const ahora = new Date()
    const fechaHoy = new Date(ahora.toISOString().split('T')[0])

    // Verificar estado actual del estudiante
    const asistenciaHoy = await prisma.asistencia.findFirst({
      where: {
        idEstudiante: estudiante.idEstudiante,
        fecha: fechaHoy
      }
    })

    const retiroHoy = await prisma.retiro.findFirst({
      where: {
        idEstudiante: estudiante.idEstudiante,
        fecha: fechaHoy
      }
    })

    let accion = ''
    let resultado: any = {}

    // Procesar según la acción seleccionada
    if (tipoAccion === 'entrada') {
      // Validar que no tenga entrada ya registrada
      if (asistenciaHoy) {
        return NextResponse.json({ 
          error: 'El estudiante ya tiene entrada registrada hoy' 
        }, { status: 400 })
      }
      // Registrar entrada
      console.log('📥 Registrando entrada automática por QR')
      
      // Obtener horario para determinar si es tardanza
      let horarioClase = null
      if (estudiante.idGradoSeccion) {
        horarioClase = await prisma.horarioClase.findFirst({
          where: {
            idGradoSeccion: estudiante.idGradoSeccion,
            diaSemana: ahora.getDay() === 0 ? 7 : ahora.getDay(),
            activo: true
          }
        })
      }

      let estado = 'PRESENTE'
      let toleranciaMin = 10

      if (horarioClase) {
        toleranciaMin = horarioClase.toleranciaMin || 10
        
        const horaInicioHorario = new Date(fechaHoy)
        const [horas, minutos] = horarioClase.horaInicio.toTimeString().slice(0, 5).split(':')
        horaInicioHorario.setHours(parseInt(horas), parseInt(minutos), 0, 0)
        
        const horaLimiteTolerancia = new Date(horaInicioHorario.getTime() + (toleranciaMin * 60 * 1000))
        
        if (ahora > horaLimiteTolerancia) {
          estado = 'TARDANZA'
        }
      }

      const nuevaAsistencia = await prisma.asistencia.create({
        data: {
          idEstudiante: estudiante.idEstudiante,
          idIe: userInfo.idIe!,
          fecha: fechaHoy,
          horaEntrada: ahora,
          sesion: 'MAÑANA',
          observaciones: `Entrada por QR - Auxiliar: ${userInfo.nombre} ${userInfo.apellido}`,
          registradoPor: userInfo.idUsuario
        }
      })

      accion = `Entrada registrada (${estado})`
      resultado = {
        tipo: 'entrada',
        estado: estado,
        horaEntrada: nuevaAsistencia.horaEntrada?.toTimeString().slice(0, 5),
        toleranciaMin
      }

    } else if (tipoAccion === 'salida') {
      // Validar que tenga entrada registrada
      if (!asistenciaHoy || !asistenciaHoy.horaEntrada) {
        return NextResponse.json({ 
          error: 'El estudiante debe tener entrada registrada para poder registrar salida' 
        }, { status: 400 })
      }

      // Validar que no tenga salida ya registrada
      if (retiroHoy) {
        return NextResponse.json({ 
          error: 'El estudiante ya tiene salida registrada hoy' 
        }, { status: 400 })
      }

      // Registrar salida
      console.log('📤 Registrando salida por QR')
      
      const nuevoRetiro = await prisma.retiro.create({
        data: {
          idEstudiante: estudiante.idEstudiante,
          idIe: userInfo.idIe!,
          fecha: fechaHoy,
          hora: ahora.toTimeString().slice(0, 5),
          observaciones: `Salida por QR - Auxiliar: ${userInfo.nombre} ${userInfo.apellido}`
        }
      })

      accion = 'Salida registrada'
      resultado = {
        tipo: 'salida',
        hora: nuevoRetiro.hora,
        fecha: nuevoRetiro.fecha.toISOString().split('T')[0]
      }

    } else {
      return NextResponse.json({ 
        error: 'Acción no válida' 
      }, { status: 400 })
    }

    console.log(`✅ ${accion} - ${estudiante.usuario.nombre} ${estudiante.usuario.apellido}`)

    return NextResponse.json({
      success: true,
      accion,
      estudiante: {
        id: estudiante.idEstudiante,
        nombre: estudiante.usuario.nombre,
        apellido: estudiante.usuario.apellido,
        dni: estudiante.usuario.dni,
        grado: estudiante.gradoSeccion?.grado?.nombre,
        seccion: estudiante.gradoSeccion?.seccion?.nombre,
        codigoQR: estudiante.qr
      },
      resultado,
      timestamp: ahora.toISOString()
    })

  } catch (error) {
    console.error('❌ Error al procesar código QR:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
