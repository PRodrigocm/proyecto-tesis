import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    console.log('📱 Procesando escaneo QR del auxiliar...')

    // Para auxiliares, la fuente será genérica ya que pueden registrar cualquier clase
    const fuenteRegistro = 'AUXILIAR_QR'
    
    console.log('📝 Fuente de registro:', fuenteRegistro)

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

    // Obtener fecha actual
    const ahora = new Date()
    const fechaHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())

    // Verificar estado actual del estudiante en AsistenciaIE
    const asistenciaIEHoy = await prisma.asistenciaIE.findFirst({
      where: {
        idEstudiante: estudiante.idEstudiante,
        fecha: {
          gte: fechaHoy,
          lt: new Date(fechaHoy.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    })

    let accion = ''
    let resultado: any = {}

    // Procesar según la acción seleccionada
    if (tipoAccion === 'entrada') {
      // Validar que no tenga entrada ya registrada
      if (asistenciaIEHoy && asistenciaIEHoy.horaIngreso) {
        console.log('⚠️ Estudiante ya tiene entrada registrada, omitiendo silenciosamente')
        return NextResponse.json({ 
          duplicado: true,
          mensaje: `${estudiante.usuario.nombre} ${estudiante.usuario.apellido} ya tiene entrada registrada`,
          estudiante: {
            id: estudiante.idEstudiante,
            nombre: estudiante.usuario.nombre,
            apellido: estudiante.usuario.apellido,
            dni: estudiante.usuario.dni,
            grado: estudiante.gradoSeccion?.grado?.nombre,
            seccion: estudiante.gradoSeccion?.seccion?.nombre
          }
        }, { status: 200 })
      }
      
      // Registrar entrada en AsistenciaIE
      console.log('📥 Registrando entrada a la IE por QR')
      
      const nuevaAsistenciaIE = await prisma.asistenciaIE.create({
        data: {
          idEstudiante: estudiante.idEstudiante,
          idIe: userInfo.idIe!,
          fecha: fechaHoy,
          horaIngreso: ahora,
          estado: 'INGRESADO',
          registradoIngresoPor: userInfo.idUsuario
        }
      })

      accion = 'Entrada registrada'
      resultado = {
        tipo: 'entrada',
        horaIngreso: nuevaAsistenciaIE.horaIngreso?.toTimeString().slice(0, 5),
        estado: nuevaAsistenciaIE.estado
      }

    } else if (tipoAccion === 'salida') {
      // Validar que tenga entrada registrada
      if (!asistenciaIEHoy || !asistenciaIEHoy.horaIngreso) {
        console.log('⚠️ Estudiante no tiene entrada registrada, omitiendo silenciosamente')
        return NextResponse.json({ 
          duplicado: true,
          mensaje: `${estudiante.usuario.nombre} ${estudiante.usuario.apellido} no tiene entrada registrada`,
          estudiante: {
            id: estudiante.idEstudiante,
            nombre: estudiante.usuario.nombre,
            apellido: estudiante.usuario.apellido,
            dni: estudiante.usuario.dni,
            grado: estudiante.gradoSeccion?.grado?.nombre,
            seccion: estudiante.gradoSeccion?.seccion?.nombre
          }
        }, { status: 200 })
      }

      // Validar que no tenga salida ya registrada
      if (asistenciaIEHoy.horaSalida) {
        console.log('⚠️ Estudiante ya tiene salida registrada, omitiendo silenciosamente')
        return NextResponse.json({ 
          duplicado: true,
          mensaje: `${estudiante.usuario.nombre} ${estudiante.usuario.apellido} ya tiene salida registrada`,
          estudiante: {
            id: estudiante.idEstudiante,
            nombre: estudiante.usuario.nombre,
            apellido: estudiante.usuario.apellido,
            dni: estudiante.usuario.dni,
            grado: estudiante.gradoSeccion?.grado?.nombre,
            seccion: estudiante.gradoSeccion?.seccion?.nombre
          }
        }, { status: 200 })
      }

      // Registrar salida - Actualizar horaSalida en AsistenciaIE
      console.log('📤 Registrando salida de la IE por QR - Actualizando horaSalida')
      
      const asistenciaIEActualizada = await prisma.asistenciaIE.update({
        where: {
          idAsistenciaIE: asistenciaIEHoy.idAsistenciaIE
        },
        data: {
          horaSalida: ahora,
          estado: 'RETIRADO',
          registradoSalidaPor: userInfo.idUsuario
        }
      })

      accion = 'Salida registrada'
      resultado = {
        tipo: 'salida',
        horaSalida: asistenciaIEActualizada.horaSalida?.toTimeString().slice(0, 5),
        fecha: asistenciaIEActualizada.fecha.toISOString().split('T')[0],
        estado: asistenciaIEActualizada.estado
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
