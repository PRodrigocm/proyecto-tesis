import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { notificarCambioAsistencia } from '@/lib/notifications'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

/**
 * POST /api/docentes/asistencia/validar
 * 
 * El docente VALIDA la presencia de estudiantes en el aula.
 * Este endpoint recibe la lista de estudiantes con su estado confirmado.
 * 
 * Estados posibles:
 * - PRESENTE: Estudiante presente en el aula (confirma ingreso de portería)
 * - TARDANZA: Llegó tarde al aula
 * - AUSENTE: No está en el aula (aunque haya ingresado por portería = posible evasión)
 * - JUSTIFICADO: Tiene justificación previa
 * 
 * Incidencias:
 * - EVASION_CLASE: Ingresó a la IE pero no está en el aula
 */
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

    if (!['DOCENTE', 'ADMINISTRATIVO'].includes(decoded.rol)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { idClase, fecha, asistencias } = body

    if (!asistencias || !Array.isArray(asistencias) || asistencias.length === 0) {
      return NextResponse.json({ error: 'Se requiere lista de asistencias' }, { status: 400 })
    }

    const fechaValidacion = fecha ? new Date(fecha) : new Date()
    fechaValidacion.setHours(0, 0, 0, 0)

    // Obtener docente y usuario que modifica
    const docente = await prisma.docente.findFirst({
      where: { idUsuario: decoded.userId },
      include: { usuario: true }
    })
    
    const modificadoPor = docente?.usuario 
      ? `${docente.usuario.nombre} ${docente.usuario.apellido}` 
      : 'Docente'

    // Obtener estados de asistencia
    const estadosAsistencia = await prisma.estadoAsistencia.findMany()
    const estadoMap = new Map(estadosAsistencia.map(e => [e.codigo, e.idEstadoAsistencia]))

    const resultados: any[] = []
    const incidencias: any[] = []

    for (const asist of asistencias) {
      const { idEstudiante, estado, observaciones, esEvasion } = asist

      // Verificar si el estudiante ingresó por portería
      const ingresoPorteria = await prisma.asistenciaIE.findFirst({
        where: {
          idEstudiante,
          fecha: fechaValidacion
        }
      })

      // Determinar si hay evasión de clase
      const hayEvasion = ingresoPorteria && estado === 'AUSENTE'

      // Obtener o crear registro de asistencia
      const idEstadoAsistencia = estadoMap.get(estado) || estadoMap.get('AUSENTE')

      // Buscar CUALQUIER registro de asistencia existente para este estudiante+fecha
      // Primero buscar con idHorarioClase, luego sin él
      let asistenciaExistente = await prisma.asistencia.findFirst({
        where: {
          idEstudiante,
          fecha: fechaValidacion,
          ...(idClase && { idHorarioClase: parseInt(idClase) })
        }
      })

      // Si no se encontró con idHorarioClase, buscar sin él
      if (!asistenciaExistente) {
        asistenciaExistente = await prisma.asistencia.findFirst({
          where: {
            idEstudiante,
            fecha: fechaValidacion
          }
        })
      }

      let asistenciaGuardada
      let estadoAnterior: string | null = null
      let estadoAnteriorId: number | null = null

      if (asistenciaExistente) {
        // Obtener estado anterior para histórico y notificación
        const estadoAnteriorObj = estadosAsistencia.find(e => e.idEstadoAsistencia === asistenciaExistente!.idEstadoAsistencia)
        estadoAnterior = estadoAnteriorObj?.codigo || null
        estadoAnteriorId = asistenciaExistente.idEstadoAsistencia

        console.log(`📝 Actualizando asistencia existente ID=${asistenciaExistente.idAsistencia}: ${estadoAnterior} → ${estado}`)
        
        // ACTUALIZAR el registro existente (NO crear uno nuevo)
        asistenciaGuardada = await prisma.asistencia.update({
          where: { idAsistencia: asistenciaExistente.idAsistencia },
          data: {
            idEstadoAsistencia,
            observaciones: observaciones || asistenciaExistente.observaciones,
            // Actualizar idHorarioClase si se proporciona
            ...(idClase && { idHorarioClase: parseInt(idClase) }),
            updatedAt: new Date()
          }
        })
        
        // CREAR registro en HistoricoEstadoAsistencia si el estado cambió
        if (estadoAnteriorId && estadoAnteriorId !== idEstadoAsistencia) {
          await prisma.historicoEstadoAsistencia.create({
            data: {
              idAsistencia: asistenciaExistente.idAsistencia,
              idEstadoAsistencia: idEstadoAsistencia!, // Estado nuevo
              fechaCambio: new Date(),
              cambiadoPor: decoded.userId
            }
          })
          console.log(`📜 Histórico creado: Asistencia ${asistenciaExistente.idAsistencia}, Estado anterior: ${estadoAnterior}, Estado nuevo: ${estado}`)
        }
        
        // NOTIFICAR AL APODERADO SI EL ESTADO CAMBIÓ
        if (estadoAnterior && estadoAnterior !== estado) {
          try {
            const estudiante = await prisma.estudiante.findUnique({
              where: { idEstudiante },
              include: {
                usuario: true,
                gradoSeccion: {
                  include: { grado: true, seccion: true }
                },
                apoderados: {
                  include: {
                    apoderado: { include: { usuario: true } }
                  }
                }
              }
            })

            if (estudiante && estudiante.apoderados.length > 0) {
              const apoderado = estudiante.apoderados[0].apoderado
              
              await notificarCambioAsistencia({
                estudianteId: estudiante.idEstudiante,
                estudianteNombre: estudiante.usuario.nombre || '',
                estudianteApellido: estudiante.usuario.apellido || '',
                estudianteDNI: estudiante.usuario.dni,
                grado: estudiante.gradoSeccion?.grado?.nombre || '',
                seccion: estudiante.gradoSeccion?.seccion?.nombre || '',
                estadoAnterior,
                estadoNuevo: estado,
                fecha: fechaValidacion.toISOString(),
                observaciones: observaciones || undefined,
                modificadoPor,
                emailApoderado: apoderado.usuario.email || '',
                telefonoApoderado: apoderado.usuario.telefono || '',
                apoderadoUsuarioId: apoderado.usuario.idUsuario
              })
            }
          } catch (notifError) {
            console.error('⚠️ Error al enviar notificación:', notifError)
          }
        }
      } else {
        console.log(`📝 Creando nueva asistencia para estudiante ${idEstudiante}, fecha ${fechaValidacion.toISOString()}`)
        
        // Crear nueva asistencia SOLO si no existe ningún registro
        asistenciaGuardada = await prisma.asistencia.create({
          data: {
            idEstudiante,
            idHorarioClase: idClase ? parseInt(idClase) : null,
            fecha: fechaValidacion,
            idEstadoAsistencia: idEstadoAsistencia!,
            horaRegistro: new Date(),
            observaciones,
            registradoPor: decoded.userId
          }
        })

        // Crear registro inicial en histórico
        await prisma.historicoEstadoAsistencia.create({
          data: {
            idAsistencia: asistenciaGuardada.idAsistencia,
            idEstadoAsistencia: idEstadoAsistencia!,
            fechaCambio: new Date(),
            cambiadoPor: decoded.userId
          }
        })
        console.log(`📜 Histórico inicial creado para nueva asistencia ${asistenciaGuardada.idAsistencia}`)
      }

      // Actualizar estado en AsistenciaIE si existe
      if (ingresoPorteria) {
        await prisma.asistenciaIE.update({
          where: { idAsistenciaIE: ingresoPorteria.idAsistenciaIE },
          data: {
            estado: hayEvasion ? 'EVASION' : 'EN_CLASE'
          }
        })
      }

      // Registrar incidencia si hay evasión
      if (hayEvasion || esEvasion) {
        const estudiante = await prisma.estudiante.findUnique({
          where: { idEstudiante },
          include: { usuario: true }
        })

        incidencias.push({
          idEstudiante,
          estudiante: `${estudiante?.usuario?.apellido}, ${estudiante?.usuario?.nombre}`,
          tipo: 'EVASION_CLASE',
          descripcion: `Estudiante ingresó a la IE a las ${ingresoPorteria?.horaIngreso?.toLocaleTimeString()} pero no se presentó al aula`,
          horaIngreso: ingresoPorteria?.horaIngreso,
          observaciones
        })
      }

      resultados.push({
        idEstudiante,
        estado,
        validado: true,
        ingresoPorteria: !!ingresoPorteria,
        esEvasion: hayEvasion
      })
    }

    // Log de la validación
    console.log(`✅ Docente ${decoded.userId} validó ${resultados.length} asistencias. Incidencias: ${incidencias.length}`)

    return NextResponse.json({
      success: true,
      message: `Se validaron ${resultados.length} asistencias`,
      fecha: fechaValidacion.toISOString().split('T')[0],
      validadoPor: decoded.userId,
      resultados,
      incidencias: incidencias.length > 0 ? incidencias : null,
      resumen: {
        total: resultados.length,
        presentes: resultados.filter(r => r.estado === 'PRESENTE').length,
        tardanzas: resultados.filter(r => r.estado === 'TARDANZA').length,
        ausentes: resultados.filter(r => r.estado === 'AUSENTE').length,
        evasiones: incidencias.length
      }
    })

  } catch (error) {
    console.error('Error al validar asistencia:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
