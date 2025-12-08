import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { notificarEntradaSalida } from '@/lib/notifications'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Verificar que sea auxiliar o administrativo
    if (!['AUXILIAR', 'ADMINISTRATIVO'].includes(decoded.rol)) {
      return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 })
    }

    const body = await request.json()
    const { estudiantes, fecha } = body

    if (!estudiantes || !Array.isArray(estudiantes) || estudiantes.length === 0) {
      return NextResponse.json({ error: 'No hay estudiantes para guardar' }, { status: 400 })
    }

    console.log(`📝 Guardando asistencia para ${estudiantes.length} estudiantes`)

    const fechaAsistencia = new Date(fecha)
    fechaAsistencia.setHours(0, 0, 0, 0)

    // Obtener configuración de horarios de la IE para validar hora de salida
    const ieId = decoded.ieId || 1
    const configuracion = await prisma.configuracionIE.findUnique({
      where: { idIe: ieId }
    })
    const horaSalidaConfig = configuracion?.horaSalida || '13:00'
    
    console.log(`⏰ Hora de salida configurada: ${horaSalidaConfig}`)

    let guardados = 0
    let errores = 0
    const resultados: any[] = []

    // Buscar o crear estado de asistencia PRESENTE
    let estadoPresente = await prisma.estadoAsistencia.findFirst({
      where: { codigo: 'PRESENTE' }
    })

    if (!estadoPresente) {
      estadoPresente = await prisma.estadoAsistencia.create({
        data: {
          codigo: 'PRESENTE',
          nombreEstado: 'Presente',
          activo: true,
          afectaAsistencia: true,
          requiereJustificacion: false
        }
      })
    }

    for (const est of estudiantes) {
      try {
        // Buscar estudiante por DNI o código
        const estudiante = await prisma.estudiante.findFirst({
          where: {
            OR: [
              { usuario: { dni: est.dni } },
              { codigoQR: est.codigo }
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
          console.log(`❌ Estudiante no encontrado: ${est.dni}`)
          errores++
          resultados.push({
            dni: est.dni,
            nombre: est.nombre,
            exito: false,
            error: 'Estudiante no encontrado'
          })
          continue
        }

        // Verificar si ya existe asistencia para este día
        const asistenciaExistente = await prisma.asistenciaIE.findFirst({
          where: {
            idEstudiante: estudiante.idEstudiante,
            fecha: fechaAsistencia
          }
        })

        // Usar hora UTC real para el registro
        const ahoraUTC = new Date()
        let horaRegistro = ahoraUTC
        
        // Si se proporciona una hora espec\u00edfica (HH:MM), crear fecha con esa hora en UTC
        // La hora proporcionada se asume que es hora de Per\u00fa, as\u00ed que sumamos 5 horas para convertir a UTC
        if (est.hora && typeof est.hora === 'string') {
          const [horas, minutos] = est.hora.split(':').map(Number)
          horaRegistro = new Date(fechaAsistencia)
          // Sumar 5 horas para convertir hora Per\u00fa a UTC
          horaRegistro.setUTCHours(horas + 5, minutos, 0, 0)
        }

        // Si ya existe asistencia, actualizar según la acción
        if (asistenciaExistente) {
          console.log(`⚠️ Ya existe asistencia para: ${estudiante.usuario.nombre}, actualizando...`)
          
          // Actualizar según la acción
          if (est.accion === 'entrada' && !asistenciaExistente.horaIngreso) {
            await prisma.asistenciaIE.update({
              where: { idAsistenciaIE: asistenciaExistente.idAsistenciaIE },
              data: {
                horaIngreso: horaRegistro,
                estado: 'INGRESADO',
                registradoIngresoPor: decoded.userId
              }
            })
            console.log(`✅ Entrada actualizada: ${estudiante.usuario.nombre}`)
          } else if (est.accion === 'salida') {
            await prisma.asistenciaIE.update({
              where: { idAsistenciaIE: asistenciaExistente.idAsistenciaIE },
              data: {
                horaSalida: horaRegistro,
                estado: 'RETIRADO',
                registradoSalidaPor: decoded.userId
              }
            })
            console.log(`✅ Salida actualizada: ${estudiante.usuario.nombre}`)
          } else {
            console.log(`⚠️ ${est.accion} ya registrada para: ${estudiante.usuario.nombre}`)
            resultados.push({
              dni: est.dni,
              nombre: est.nombre,
              exito: false,
              error: `${est.accion} ya registrada`
            })
            continue
          }
        } else {
          // Crear nueva asistencia IE (entrada/salida)
          await prisma.asistenciaIE.create({
            data: {
              idEstudiante: estudiante.idEstudiante,
              idIe: decoded.ieId || 1,
              fecha: fechaAsistencia,
              horaIngreso: est.accion === 'entrada' ? horaRegistro : null,
              horaSalida: est.accion === 'salida' ? horaRegistro : null,
              estado: est.accion === 'entrada' ? 'INGRESADO' : 'RETIRADO',
              registradoIngresoPor: est.accion === 'entrada' ? decoded.userId : undefined,
              registradoSalidaPor: est.accion === 'salida' ? decoded.userId : undefined
            }
          })
          console.log(`✅ Asistencia creada: ${estudiante.usuario.nombre} - ${est.accion}`)
        }

        guardados++
        resultados.push({
          dni: est.dni,
          nombre: est.nombre,
          exito: true
        })

        // ENVIAR NOTIFICACIONES AL APODERADO
        try {
          // Buscar apoderado del estudiante
          const apoderado = await prisma.apoderado.findFirst({
            where: {
              estudiantes: {
                some: {
                  idEstudiante: estudiante.idEstudiante
                }
              }
            },
            include: {
              usuario: true
            }
          })

          if (apoderado && apoderado.usuario.email) {
            console.log(`📧 Enviando notificación de ${est.accion} al apoderado...`)
            
            const resultadoNotificacion = await notificarEntradaSalida({
              estudianteNombre: estudiante.usuario.nombre || '',
              estudianteApellido: estudiante.usuario.apellido || '',
              estudianteDNI: estudiante.usuario.dni,
              grado: estudiante.gradoSeccion?.grado?.nombre || '',
              seccion: estudiante.gradoSeccion?.seccion?.nombre || '',
              accion: est.accion,
              hora: horaRegistro.toISOString(),
              fecha: fechaAsistencia.toISOString(),
              emailApoderado: apoderado.usuario.email,
              telefonoApoderado: apoderado.usuario.telefono || ''
            })

            console.log(`📧 Notificación enviada: Email=${resultadoNotificacion.emailEnviado}, SMS=${resultadoNotificacion.smsEnviado}`)
          } else {
            console.log(`⚠️ No se encontró apoderado con email para ${estudiante.usuario.nombre}`)
          }
        } catch (notifError) {
          console.error(`⚠️ Error al enviar notificación (no crítico):`, notifError)
          // No fallar el guardado si la notificación falla
        }

      } catch (error) {
        console.error(`❌ Error guardando asistencia para ${est.dni}:`, error)
        errores++
        resultados.push({
          dni: est.dni,
          nombre: est.nombre,
          exito: false,
          error: 'Error al guardar'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Asistencia guardada: ${guardados} exitosos, ${errores} errores`,
      guardados,
      errores,
      resultados
    })

  } catch (error) {
    console.error('❌ Error guardando asistencia:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
