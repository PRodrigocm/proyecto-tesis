import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    console.log('📱 Validando código QR del auxiliar...')

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
        codigoQR: qrCode,
        idIe: userInfo.idIe,
        usuario: {
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

    // Obtener hora UTC real (para guardar en BD)
    const ahoraUTC = new Date()
    // Calcular fecha de hoy en Perú (UTC-5) para la fecha de asistencia
    const horaPeruParaCalculo = new Date(ahoraUTC.getTime() - (5 * 60 * 60 * 1000))
    const fechaHoy = new Date(horaPeruParaCalculo.getFullYear(), horaPeruParaCalculo.getMonth(), horaPeruParaCalculo.getDate())

    // NOTA: Se eliminó la validación de hora de salida que bloqueaba el registro
    // El registro de asistencia debe poder hacerse en cualquier momento
    // La validación de entrada/salida se hace en el frontend
    const horaPeruFormateada = ahoraUTC.toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hour12: true })
    console.log(`⏰ Registrando asistencia a las ${horaPeruFormateada} (hora Perú)`)

    // Función para formatear hora en zona horaria local (Lima/Peru)
    const formatearHora = (fecha: Date): string => {
      return fecha.toLocaleTimeString('es-PE', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/Lima'
      })
    }

    // Buscar si ya existe AsistenciaIE para hoy
    const asistenciaExistente = await prisma.asistenciaIE.findFirst({
      where: {
        idEstudiante: estudiante.idEstudiante,
        fecha: fechaHoy
      }
    })

    let asistenciaIE
    let mensaje = ''
    let duplicado = false

    if (tipoAccion === 'entrada') {
      if (asistenciaExistente?.horaIngreso) {
        // Ya tiene entrada registrada
        duplicado = true
        mensaje = `⚠️ ${estudiante.usuario.nombre} ${estudiante.usuario.apellido} ya tiene entrada registrada a las ${formatearHora(asistenciaExistente.horaIngreso)}`
        asistenciaIE = asistenciaExistente
      } else if (asistenciaExistente) {
        // Actualizar registro existente con hora de entrada
        asistenciaIE = await prisma.asistenciaIE.update({
          where: { idAsistenciaIE: asistenciaExistente.idAsistenciaIE },
          data: {
            horaIngreso: ahoraUTC, // Guardar hora UTC real
            estado: 'INGRESADO',
            registradoIngresoPor: userId
          }
        })
        mensaje = `✅ Entrada registrada para ${estudiante.usuario.nombre} ${estudiante.usuario.apellido}`
      } else {
        // Crear nuevo registro de entrada
        asistenciaIE = await prisma.asistenciaIE.create({
          data: {
            idEstudiante: estudiante.idEstudiante,
            idIe: userInfo.idIe || 1,
            fecha: fechaHoy,
            horaIngreso: ahoraUTC, // Guardar hora UTC real
            estado: 'INGRESADO',
            registradoIngresoPor: userId
          }
        })
        mensaje = `✅ Entrada registrada para ${estudiante.usuario.nombre} ${estudiante.usuario.apellido}`
      }
    } else {
      // Salida
      if (asistenciaExistente?.horaSalida) {
        // Ya tiene salida registrada
        duplicado = true
        mensaje = `⚠️ ${estudiante.usuario.nombre} ${estudiante.usuario.apellido} ya tiene salida registrada a las ${formatearHora(asistenciaExistente.horaSalida)}`
        asistenciaIE = asistenciaExistente
      } else if (asistenciaExistente) {
        // Actualizar registro existente con hora de salida
        asistenciaIE = await prisma.asistenciaIE.update({
          where: { idAsistenciaIE: asistenciaExistente.idAsistenciaIE },
          data: {
            horaSalida: ahoraUTC, // Guardar hora UTC real
            estado: 'RETIRADO',
            registradoSalidaPor: userId
          }
        })
        mensaje = `✅ Salida registrada para ${estudiante.usuario.nombre} ${estudiante.usuario.apellido}`
      } else {
        // Crear nuevo registro solo con salida (caso raro pero posible)
        asistenciaIE = await prisma.asistenciaIE.create({
          data: {
            idEstudiante: estudiante.idEstudiante,
            idIe: userInfo.idIe || 1,
            fecha: fechaHoy,
            horaSalida: ahoraUTC, // Guardar hora UTC real
            estado: 'RETIRADO',
            registradoSalidaPor: userId
          }
        })
        mensaje = `✅ Salida registrada para ${estudiante.usuario.nombre} ${estudiante.usuario.apellido}`
      }
    }

    console.log(`${duplicado ? '⚠️' : '✅'} ${mensaje}`)

    return NextResponse.json({
      success: true,
      duplicado,
      mensaje,
      estudiante: {
        id: estudiante.idEstudiante,
        nombre: estudiante.usuario.nombre,
        apellido: estudiante.usuario.apellido,
        dni: estudiante.usuario.dni,
        grado: estudiante.gradoSeccion?.grado?.nombre,
        seccion: estudiante.gradoSeccion?.seccion?.nombre,
        codigoQR: estudiante.codigoQR,
        accion: tipoAccion,
        hora: formatearHora(ahoraUTC)
      },
      asistenciaIE: {
        id: asistenciaIE.idAsistenciaIE,
        horaIngreso: asistenciaIE.horaIngreso ? formatearHora(asistenciaIE.horaIngreso) : null,
        horaSalida: asistenciaIE.horaSalida ? formatearHora(asistenciaIE.horaSalida) : null,
        estado: asistenciaIE.estado
      },
      timestamp: ahoraUTC.toISOString()
    })

  } catch (error: unknown) {
    console.error('❌ Error al validar código QR:', error)
    
    // Manejar diferentes tipos de errores
    let errorMessage = 'Error desconocido'
    let errorCode = 'UNKNOWN_ERROR'
    
    if (error instanceof Error) {
      errorMessage = error.message
      errorCode = error.name
    } else if (typeof error === 'string') {
      errorMessage = error
    } else if (error && typeof error === 'object') {
      errorMessage = JSON.stringify(error)
    }
    
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: errorMessage,
      code: errorCode
    }, { status: 500 })
  }
}
