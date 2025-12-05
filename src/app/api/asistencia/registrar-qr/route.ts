import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

/**
 * POST - Registrar asistencia mediante escaneo de QR
 * 
 * Input: codigoQR (ID del estudiante), fecha, accion (entrada/salida)
 * Procesamiento: 
 *   - Captura fecha/hora actual
 *   - Asigna estado automático: PRESENTE, TARDANZA o AUSENTE según hora de entrada
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { codigoQR, fecha, accion = 'entrada' } = body

    if (!codigoQR) {
      return NextResponse.json(
        { error: 'Código QR es requerido' },
        { status: 400 }
      )
    }

    // Obtener usuario del token
    let userId = 1
    let ieId = 1
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
        userId = decoded.userId || 1
        ieId = decoded.ieId || 1
      } catch {
        console.log('Token inválido')
      }
    }

    // Buscar estudiante por código QR o por ID
    const estudiante = await prisma.estudiante.findFirst({
      where: {
        OR: [
          { codigoQR: codigoQR },
          { idEstudiante: parseInt(codigoQR) || 0 }
        ]
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
      return NextResponse.json(
        { error: 'Estudiante no encontrado', codigoQR },
        { status: 404 }
      )
    }

    const ahora = new Date()
    const fechaAsistencia = fecha ? new Date(fecha) : new Date()
    fechaAsistencia.setHours(0, 0, 0, 0)

    // Obtener configuración de horarios de la IE
    let configuracion = await prisma.configuracionIE.findUnique({
      where: { idIe: ieId }
    })

    // Si no existe configuración, usar valores por defecto
    const horaSalidaConfig = configuracion?.horaSalida || '13:00'
    
    // Validar que no se haya pasado la hora de salida
    const horaActualStr = ahora.toTimeString().slice(0, 5) // HH:MM
    if (horaActualStr > horaSalidaConfig) {
      return NextResponse.json(
        { 
          error: 'No se puede registrar asistencia después de la hora de salida',
          horaSalida: horaSalidaConfig,
          horaActual: horaActualStr
        },
        { status: 400 }
      )
    }

    // Verificar si ya existe asistencia IE para hoy
    const asistenciaIEExistente = await prisma.asistenciaIE.findFirst({
      where: {
        idEstudiante: estudiante.idEstudiante,
        fecha: fechaAsistencia
      }
    })

    // Determinar estado de asistencia basado en la hora
    const estadoAsistencia = await determinarEstadoAsistencia(ahora)

    if (accion === 'entrada') {
      if (asistenciaIEExistente) {
        // Ya tiene registro de entrada - posible duplicado
        return NextResponse.json({
          success: true,
          message: 'Asistencia ya registrada',
          duplicado: true,
          estudiante: formatearEstudiante(estudiante, asistenciaIEExistente, accion, estadoAsistencia),
          mensajeDuplicado: `${estudiante.usuario?.nombre} ${estudiante.usuario?.apellido} ya tiene registro de entrada`
        })
      }

      // Crear nuevo registro de asistencia IE (ingreso a la institución)
      const nuevaAsistenciaIE = await prisma.asistenciaIE.create({
        data: {
          idEstudiante: estudiante.idEstudiante,
          idIe: ieId,
          fecha: fechaAsistencia,
          horaIngreso: ahora,
          estado: estadoAsistencia.codigo === 'TARDANZA' ? 'TARDANZA' : 'INGRESADO',
          registradoIngresoPor: userId
        }
      })

      return NextResponse.json({
        success: true,
        message: `Entrada registrada: ${estadoAsistencia.nombreEstado}`,
        estudiante: formatearEstudiante(estudiante, nuevaAsistenciaIE, accion, estadoAsistencia),
        estado: estadoAsistencia.nombreEstado
      })

    } else if (accion === 'salida') {
      if (!asistenciaIEExistente) {
        return NextResponse.json(
          { error: 'No hay registro de entrada para este estudiante' },
          { status: 400 }
        )
      }

      if (asistenciaIEExistente.horaSalida) {
        return NextResponse.json({
          success: true,
          message: 'Salida ya registrada',
          duplicado: true,
          estudiante: formatearEstudiante(estudiante, asistenciaIEExistente, accion, estadoAsistencia),
          mensajeDuplicado: `${estudiante.usuario?.nombre} ${estudiante.usuario?.apellido} ya tiene registro de salida`
        })
      }

      // Actualizar con hora de salida
      const asistenciaActualizada = await prisma.asistenciaIE.update({
        where: { idAsistenciaIE: asistenciaIEExistente.idAsistenciaIE },
        data: {
          horaSalida: ahora,
          registradoSalidaPor: userId
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Salida registrada correctamente',
        estudiante: formatearEstudiante(estudiante, asistenciaActualizada, accion, estadoAsistencia)
      })
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error registrando asistencia QR:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * Determina el estado de asistencia basado en la hora actual
 * - Antes de hora límite: PRESENTE
 * - Después de hora límite: TARDANZA
 */
async function determinarEstadoAsistencia(hora: Date) {
  // Valores por defecto
  const horaLimitePuntual = '08:00'
  const horaLimiteTardanza = '08:30'

  const horaActual = hora.toTimeString().slice(0, 5) // HH:MM

  let estadoCodigo = 'PRESENTE'
  
  if (horaActual > horaLimiteTardanza) {
    estadoCodigo = 'TARDANZA'
  } else if (horaActual > horaLimitePuntual) {
    estadoCodigo = 'TARDANZA'
  }

  // Buscar el estado de asistencia
  let estado = await prisma.estadoAsistencia.findFirst({
    where: { codigo: estadoCodigo }
  })

  if (!estado) {
    // Crear estado si no existe
    estado = await prisma.estadoAsistencia.create({
      data: {
        codigo: estadoCodigo,
        nombreEstado: estadoCodigo === 'PRESENTE' ? 'Presente' : 'Tardanza'
      }
    })
  }

  return estado
}

/**
 * Formatea los datos del estudiante para la respuesta
 */
function formatearEstudiante(estudiante: any, asistencia: any, accion: string, estado: any) {
  const hora = accion === 'entrada' 
    ? asistencia.horaIngreso 
    : asistencia.horaSalida

  return {
    id: estudiante.idEstudiante.toString(),
    nombre: estudiante.usuario?.nombre || '',
    apellido: estudiante.usuario?.apellido || '',
    dni: estudiante.usuario?.dni || '',
    grado: estudiante.gradoSeccion?.grado?.nombre || '',
    seccion: estudiante.gradoSeccion?.seccion?.nombre || '',
    accion: accion,
    hora: hora ? new Date(hora).toLocaleTimeString('es-PE', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    }) : '',
    estado: estado?.nombreEstado || 'PRESENTE',
    codigo: estudiante.codigoQR
  }
}
