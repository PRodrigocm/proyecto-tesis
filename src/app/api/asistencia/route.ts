import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notificarCambioAsistencia, notificarInasistencia } from '@/lib/notifications'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

/**
 * GET - Obtener lista de asistencias con filtros
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const fecha = url.searchParams.get('fecha')
    const grado = url.searchParams.get('grado')
    const seccion = url.searchParams.get('seccion')
    const estado = url.searchParams.get('estado')
    const sesion = url.searchParams.get('sesion')
    let ieId = url.searchParams.get('ieId')

    // Si no viene ieId, intentar obtenerlo del token
    if (!ieId) {
      const authHeader = request.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7)
          const decoded = jwt.verify(token, JWT_SECRET) as any
          ieId = decoded.ieId?.toString() || '1'
        } catch {
          ieId = '1'
        }
      } else {
        ieId = '1'
      }
    }

    const whereClause: any = {}

    if (fecha) {
      const fechaDate = new Date(fecha)
      whereClause.fecha = {
        gte: new Date(fechaDate.setHours(0, 0, 0, 0)),
        lt: new Date(new Date(fecha).setHours(23, 59, 59, 999))
      }
    }

    if (estado && estado !== 'TODOS') {
      whereClause.estado = estado
    }

    // Buscar en AsistenciaIE (asistencia a la institución)
    const asistenciasIE = await prisma.asistenciaIE.findMany({
      where: {
        ...whereClause,
        idIe: parseInt(ieId || '1')
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
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    }) as any[]

    // Filtrar por grado y sección si se especifican
    const filteredAsistencias = asistenciasIE.filter(asistencia => {
      const gradoMatch = !grado || asistencia.estudiante.gradoSeccion?.grado?.nombre === grado
      const seccionMatch = !seccion || asistencia.estudiante.gradoSeccion?.seccion?.nombre === seccion
      return gradoMatch && seccionMatch
    })

    const transformedAsistencias = filteredAsistencias.map(asistencia => ({
      id: asistencia.idAsistenciaIE.toString(),
      fecha: asistencia.fecha.toISOString(),
      estado: asistencia.estado || 'PRESENTE',
      horaEntrada: asistencia.horaIngreso?.toISOString() || null,
      horaSalida: asistencia.horaSalida?.toISOString() || null,
      estudiante: {
        id: asistencia.estudiante.idEstudiante.toString(),
        nombre: asistencia.estudiante.usuario?.nombre || '',
        apellido: asistencia.estudiante.usuario?.apellido || '',
        dni: asistencia.estudiante.usuario?.dni || '',
        grado: asistencia.estudiante.gradoSeccion?.grado?.nombre || '',
        seccion: asistencia.estudiante.gradoSeccion?.seccion?.nombre || ''
      }
    }))

    return NextResponse.json({
      data: transformedAsistencias,
      total: transformedAsistencias.length
    })

  } catch (error) {
    console.error('Error fetching asistencias:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST - Crear o actualizar asistencia
 */
export async function POST(request: NextRequest) {
  try {
    // Obtener información del usuario que modifica
    const authHeader = request.headers.get('authorization')
    let userId = 1
    let ieId = 1
    let modificadoPor = 'Sistema'
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, JWT_SECRET) as any
        userId = decoded.userId || 1
        ieId = decoded.ieId || 1
        
        const usuario = await prisma.usuario.findUnique({
          where: { idUsuario: decoded.userId }
        })
        if (usuario) {
          modificadoPor = `${usuario.nombre} ${usuario.apellido}`
        }
      } catch {
        // Si falla la verificación del token, continuar con valores por defecto
      }
    }

    const body = await request.json()
    const {
      estudianteId,
      claseId,
      fecha,
      estado: estadoRaw,
      observaciones,
      horaLlegada
    } = body

    // Normalizar estado a mayúsculas para consistencia con la BD
    const estado = estadoRaw?.toUpperCase() || 'PRESENTE'
    
    console.log(`📝 ========== GUARDANDO ASISTENCIA ==========`)
    console.log(`📝 Datos recibidos: estudiante=${estudianteId}, claseId=${claseId}, fecha=${fecha}, estadoRaw=${estadoRaw}, estado=${estado}, horaLlegada=${horaLlegada}`)
    console.log(`📝 Usuario: userId=${userId}, ieId=${ieId}, modificadoPor=${modificadoPor}`)
    
    // Buscar el idHorarioClase basado en claseId (idDocenteAula) y el día de la semana
    let idHorarioClase: number | null = null
    if (claseId) {
      try {
        // Obtener el grado-sección del DocenteAula
        const docenteAula = await prisma.docenteAula.findUnique({
          where: { idDocenteAula: parseInt(claseId) },
          include: { gradoSeccion: true }
        })
        
        if (docenteAula) {
          // Calcular el día de la semana (0=Domingo, 1=Lunes, etc.)
          const [anioFecha, mesFecha, diaFecha] = fecha.split('-').map(Number)
          const fechaObj = new Date(anioFecha, mesFecha - 1, diaFecha)
          const diaSemana = fechaObj.getDay() // 0=Dom, 1=Lun, 2=Mar, etc.
          
          // Buscar el horario de clase para este grado-sección y día
          const horarioClase = await prisma.horarioClase.findFirst({
            where: {
              idGradoSeccion: docenteAula.idGradoSeccion,
              diaSemana: diaSemana,
              activo: true
            }
          })
          
          if (horarioClase) {
            idHorarioClase = horarioClase.idHorarioClase
            console.log(`📅 HorarioClase encontrado: ${idHorarioClase} (día ${diaSemana})`)
          } else {
            console.log(`⚠️ No se encontró HorarioClase para grado-sección ${docenteAula.idGradoSeccion}, día ${diaSemana}`)
          }
        }
      } catch (error) {
        console.error('Error buscando HorarioClase:', error)
      }
    }

    // Parsear fecha correctamente - usar UTC para evitar problemas de zona horaria
    const [anio, mes, dia] = fecha.split('-').map(Number)
    // Crear fecha en UTC (medianoche UTC del día especificado)
    const fechaAsistencia = new Date(Date.UTC(anio, mes - 1, dia, 0, 0, 0, 0))
    
    console.log(`📅 Fecha parseada (UTC): ${fechaAsistencia.toISOString()}`)

    // Crear rango de fechas para búsqueda (inicio y fin del día en UTC)
    const fechaInicio = new Date(Date.UTC(anio, mes - 1, dia, 0, 0, 0, 0))
    const fechaFin = new Date(Date.UTC(anio, mes - 1, dia, 23, 59, 59, 999))

    // Si el estado es "sin_registrar", eliminar SOLO de tabla Asistencia (NO de AsistenciaIE)
    if (estado === 'SIN_REGISTRAR') {
      // Solo eliminar de tabla Asistencia (asistencia de aula del docente)
      // NO tocar AsistenciaIE (registro de entrada a la institución)
      const existingAula = await prisma.asistencia.findFirst({
        where: {
          idEstudiante: parseInt(estudianteId),
          fecha: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      })
      
      if (existingAula) {
        // Primero eliminar el histórico asociado
        await prisma.historicoEstadoAsistencia.deleteMany({
          where: { idAsistencia: existingAula.idAsistencia }
        })
        // Luego eliminar la asistencia
        await prisma.asistencia.delete({
          where: { idAsistencia: existingAula.idAsistencia }
        })
        console.log(`🗑️ Asistencia de aula eliminada para estudiante ${estudianteId} (AsistenciaIE no modificada)`)
        return NextResponse.json({
          message: 'Asistencia de aula eliminada (sin registrar)',
          deleted: true
        })
      } else {
        return NextResponse.json({
          message: 'No había asistencia de aula registrada para eliminar',
          deleted: false
        })
      }
    }

    // Determinar el estado para AsistenciaIE
    // JUSTIFICADA debe aparecer como PRESENTE en AsistenciaIE
    const estadoParaAsistenciaIE = estado === 'JUSTIFICADA' || estado === 'JUSTIFICADO' ? 'PRESENTE' : estado

    // Verificar si ya existe asistencia para este estudiante en esta fecha
    const existingAsistencia = await prisma.asistenciaIE.findFirst({
      where: {
        idEstudiante: parseInt(estudianteId),
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        }
      }
    })

    if (existingAsistencia) {
      // Guardar estado anterior para la notificación
      const estadoAnterior = existingAsistencia.estado || 'Sin estado'
      
      // Preparar hora de ingreso si se proporciona
      let horaIngresoDate: Date | undefined = undefined
      if (horaLlegada) {
        // horaLlegada viene en formato "HH:mm", convertir a DateTime
        const [horas, minutos] = horaLlegada.split(':').map(Number)
        horaIngresoDate = new Date(fechaAsistencia)
        horaIngresoDate.setHours(horas, minutos, 0, 0)
      }

      // Actualizar asistencia existente en AsistenciaIE
      // Usar estadoParaAsistenciaIE (JUSTIFICADA → PRESENTE)
      const updatedAsistencia = await prisma.asistenciaIE.update({
        where: { idAsistenciaIE: existingAsistencia.idAsistenciaIE },
        data: {
          estado: estadoParaAsistenciaIE,
          ...(horaIngresoDate && { horaIngreso: horaIngresoDate })
        }
      })
      
      console.log(`✅ AsistenciaIE actualizada: ${existingAsistencia.idAsistenciaIE}, estado: ${estadoParaAsistenciaIE} (original: ${estado})`)

      // SIEMPRE actualizar también la tabla Asistencia (que es la que usa el docente)
      try {
        // Buscar el estado de asistencia correspondiente - intentar varios códigos
        let estadoAsistencia = await prisma.estadoAsistencia.findFirst({
          where: { codigo: estado }
        })
        
        // Si no encuentra, intentar con variantes comunes
        if (!estadoAsistencia) {
          const codigosAlternativos: { [key: string]: string[] } = {
            'INASISTENCIA': ['AUSENTE', 'FALTA', 'INASISTENTE', 'FALTÓ'],
            'AUSENTE': ['INASISTENCIA', 'FALTA', 'INASISTENTE', 'FALTÓ'],
            'PRESENTE': ['ASISTIO', 'ASISTENCIA', 'ASISTIÓ'],
            'TARDANZA': ['TARDE', 'RETRASO', 'TARDÍO'],
            'JUSTIFICADA': ['JUSTIFICADO', 'JUSTIF'],
            'JUSTIFICADO': ['JUSTIFICADA', 'JUSTIF'],
            'RETIRADO': ['RETIRO', 'RETIRÓ']
          }
          
          const alternativas = codigosAlternativos[estado] || []
          for (const alt of alternativas) {
            estadoAsistencia = await prisma.estadoAsistencia.findFirst({
              where: { codigo: alt }
            })
            if (estadoAsistencia) break
          }
        }
        
        // Si aún no encuentra, buscar por nombre similar
        if (!estadoAsistencia) {
          estadoAsistencia = await prisma.estadoAsistencia.findFirst({
            where: { 
              nombreEstado: { contains: estado, mode: 'insensitive' }
            }
          })
        }
        
        // Si aún no existe, crear el estado
        if (!estadoAsistencia) {
          console.log(`⚠️ Estado ${estado} no encontrado, creando...`)
          const nombresEstado: { [key: string]: string } = {
            'PRESENTE': 'Presente',
            'TARDANZA': 'Tardanza',
            'INASISTENCIA': 'Inasistencia',
            'AUSENTE': 'Ausente',
            'JUSTIFICADA': 'Justificada',
            'JUSTIFICADO': 'Justificado',
            'RETIRADO': 'Retirado'
          }
          
          estadoAsistencia = await prisma.estadoAsistencia.create({
            data: {
              nombreEstado: nombresEstado[estado] || estado,
              codigo: estado,
              activo: true,
              afectaAsistencia: estado !== 'PRESENTE' && estado !== 'JUSTIFICADA' && estado !== 'JUSTIFICADO',
              requiereJustificacion: estado === 'INASISTENCIA' || estado === 'AUSENTE'
            }
          })
          console.log(`✅ Estado ${estado} creado con ID: ${estadoAsistencia.idEstadoAsistencia}`)
        }
        
        if (estadoAsistencia) {
          // Buscar o crear registro en tabla Asistencia
          let asistenciaAula = await prisma.asistencia.findFirst({
            where: {
              idEstudiante: parseInt(estudianteId),
              fecha: {
                gte: fechaInicio,
                lte: fechaFin
              }
            }
          })
          
          if (!asistenciaAula) {
            // Crear registro en Asistencia si no existe
            asistenciaAula = await prisma.asistencia.create({
              data: {
                idEstudiante: parseInt(estudianteId),
                fecha: fechaAsistencia,
                idEstadoAsistencia: estadoAsistencia.idEstadoAsistencia,
                idHorarioClase: idHorarioClase,
                registradoPor: userId,
                horaRegistro: horaIngresoDate || new Date()
              }
            })
            console.log(`✅ Asistencia (aula) CREADA: ${asistenciaAula.idAsistencia}, estado: ${estadoAsistencia.codigo}, horario: ${idHorarioClase}`)
          } else {
            // Actualizar el estado en Asistencia
            await prisma.asistencia.update({
              where: { idAsistencia: asistenciaAula.idAsistencia },
              data: { 
                idEstadoAsistencia: estadoAsistencia.idEstadoAsistencia,
                idHorarioClase: idHorarioClase,
                ...(horaIngresoDate && { horaRegistro: horaIngresoDate })
              }
            })
            console.log(`✅ Asistencia (aula) ACTUALIZADA: ${asistenciaAula.idAsistencia}, estado: ${estadoAsistencia.codigo}, horario: ${idHorarioClase}`)
          }
          
          // Guardar en histórico si el estado cambió
          if (estadoAnterior !== estado) {
            await prisma.historicoEstadoAsistencia.create({
              data: {
                idAsistencia: asistenciaAula.idAsistencia,
                idEstadoAsistencia: estadoAsistencia.idEstadoAsistencia,
                cambiadoPor: userId,
                fechaCambio: new Date()
              }
            })
            console.log(`📝 Histórico guardado: Estudiante ${estudianteId}, ${estadoAnterior} -> ${estado}`)
          }
        } else {
          console.warn(`⚠️ No se encontró estado de asistencia para código: ${estado}`)
        }
      } catch (asistenciaError) {
        console.error('Error al actualizar tabla Asistencia:', asistenciaError)
        // No fallar la operación principal por esto
      }

      // NOTIFICAR AL APODERADO SI EL ESTADO CAMBIÓ
      if (estadoAnterior !== estado) {
        try {
          // Obtener datos del estudiante y apoderado
          const estudiante = await prisma.estudiante.findUnique({
            where: { idEstudiante: parseInt(estudianteId) },
            include: {
              usuario: true,
              gradoSeccion: {
                include: {
                  grado: true,
                  seccion: true
                }
              },
              apoderados: {
                include: {
                  apoderado: {
                    include: {
                      usuario: true
                    }
                  }
                }
              }
            }
          })

          if (estudiante && estudiante.apoderados.length > 0) {
            const apoderado = estudiante.apoderados[0].apoderado
            
            await notificarCambioAsistencia({
              estudianteId: estudiante.idEstudiante,
              estudianteNombre: estudiante.usuario?.nombre || '',
              estudianteApellido: estudiante.usuario?.apellido || '',
              estudianteDNI: estudiante.usuario?.dni || '',
              grado: estudiante.gradoSeccion?.grado?.nombre || '',
              seccion: estudiante.gradoSeccion?.seccion?.nombre || '',
              estadoAnterior,
              estadoNuevo: estado,
              fecha: fecha,
              observaciones: observaciones || undefined,
              modificadoPor,
              emailApoderado: apoderado.usuario?.email || '',
              telefonoApoderado: apoderado.usuario?.telefono || '',
              apoderadoUsuarioId: apoderado.usuario?.idUsuario
            })
          }
        } catch (notifError) {
          console.error('Error al enviar notificación:', notifError)
        }
      }

      return NextResponse.json({
        message: 'Asistencia actualizada exitosamente',
        id: updatedAsistencia.idAsistenciaIE,
        notificacionEnviada: estadoAnterior !== estado
      })
    } else {
      // Preparar hora de ingreso si se proporciona (para nueva asistencia)
      let horaIngresoNueva: Date | undefined = undefined
      if (horaLlegada) {
        const [horas, minutos] = horaLlegada.split(':').map(Number)
        horaIngresoNueva = new Date(fechaAsistencia)
        horaIngresoNueva.setHours(horas, minutos, 0, 0)
      }

      // Crear nueva asistencia en AsistenciaIE
      // Usar estadoParaAsistenciaIE (JUSTIFICADA → PRESENTE)
      const nuevaAsistencia = await prisma.asistenciaIE.create({
        data: {
          idEstudiante: parseInt(estudianteId),
          idIe: ieId,
          fecha: fechaAsistencia,
          estado: estadoParaAsistenciaIE || 'PRESENTE',
          registradoIngresoPor: userId,
          ...(horaIngresoNueva && { horaIngreso: horaIngresoNueva })
        }
      })
      
      console.log(`✅ AsistenciaIE CREADA: ${nuevaAsistencia.idAsistenciaIE}, estado: ${estadoParaAsistenciaIE} (original: ${estado})`)

      // TAMBIÉN crear en tabla Asistencia (que es la que usa el docente)
      try {
        let estadoAsistencia = await prisma.estadoAsistencia.findFirst({
          where: { codigo: estado }
        })
        
        // Si no encuentra, intentar con variantes comunes
        if (!estadoAsistencia) {
          const codigosAlternativos: { [key: string]: string[] } = {
            'INASISTENCIA': ['AUSENTE', 'FALTA', 'INASISTENTE', 'FALTÓ'],
            'AUSENTE': ['INASISTENCIA', 'FALTA', 'INASISTENTE', 'FALTÓ'],
            'PRESENTE': ['ASISTIO', 'ASISTENCIA', 'ASISTIÓ'],
            'TARDANZA': ['TARDE', 'RETRASO', 'TARDÍO'],
            'JUSTIFICADA': ['JUSTIFICADO', 'JUSTIF'],
            'JUSTIFICADO': ['JUSTIFICADA', 'JUSTIF'],
            'RETIRADO': ['RETIRO', 'RETIRÓ']
          }
          
          const alternativas = codigosAlternativos[estado] || []
          for (const alt of alternativas) {
            estadoAsistencia = await prisma.estadoAsistencia.findFirst({
              where: { codigo: alt }
            })
            if (estadoAsistencia) break
          }
        }
        
        // Si aún no encuentra, buscar por nombre similar
        if (!estadoAsistencia) {
          estadoAsistencia = await prisma.estadoAsistencia.findFirst({
            where: { 
              nombreEstado: { contains: estado, mode: 'insensitive' }
            }
          })
        }
        
        // Si aún no existe, crear el estado
        if (!estadoAsistencia) {
          console.log(`⚠️ Estado ${estado} no encontrado al crear, creando...`)
          const nombresEstado: { [key: string]: string } = {
            'PRESENTE': 'Presente',
            'TARDANZA': 'Tardanza',
            'INASISTENCIA': 'Inasistencia',
            'AUSENTE': 'Ausente',
            'JUSTIFICADA': 'Justificada',
            'JUSTIFICADO': 'Justificado',
            'RETIRADO': 'Retirado'
          }
          
          estadoAsistencia = await prisma.estadoAsistencia.create({
            data: {
              nombreEstado: nombresEstado[estado] || estado,
              codigo: estado,
              activo: true,
              afectaAsistencia: estado !== 'PRESENTE' && estado !== 'JUSTIFICADA' && estado !== 'JUSTIFICADO',
              requiereJustificacion: estado === 'INASISTENCIA' || estado === 'AUSENTE'
            }
          })
          console.log(`✅ Estado ${estado} creado con ID: ${estadoAsistencia.idEstadoAsistencia}`)
        }
        
        // Buscar si ya existe asistencia para este estudiante y fecha
        let asistenciaAula = await prisma.asistencia.findFirst({
          where: {
            idEstudiante: parseInt(estudianteId),
            fecha: {
              gte: fechaInicio,
              lte: fechaFin
            }
          }
        })
        
        if (asistenciaAula) {
          // Actualizar la existente
          await prisma.asistencia.update({
            where: { idAsistencia: asistenciaAula.idAsistencia },
            data: {
              idEstadoAsistencia: estadoAsistencia.idEstadoAsistencia,
              idHorarioClase: idHorarioClase,
              ...(horaIngresoNueva && { horaRegistro: horaIngresoNueva })
            }
          })
          console.log(`✅ Asistencia (aula) ACTUALIZADA: ${asistenciaAula.idAsistencia}, estado: ${estadoAsistencia.codigo}, horario: ${idHorarioClase}`)
        } else {
          // Crear nueva
          asistenciaAula = await prisma.asistencia.create({
            data: {
              idEstudiante: parseInt(estudianteId),
              fecha: fechaAsistencia,
              idEstadoAsistencia: estadoAsistencia.idEstadoAsistencia,
              idHorarioClase: idHorarioClase,
              registradoPor: userId,
              horaRegistro: horaIngresoNueva || new Date()
            }
          })
          console.log(`✅ Asistencia (aula) CREADA: ${asistenciaAula.idAsistencia}, estado: ${estadoAsistencia.codigo}, horario: ${idHorarioClase}`)
        }
      } catch (asistenciaError) {
        console.error('Error al crear en tabla Asistencia:', asistenciaError)
      }

      // Si es AUSENTE/INASISTENCIA, notificar al apoderado
      const estadoFinal = estado || 'PRESENTE'
      if (estadoFinal === 'AUSENTE' || estadoFinal === 'FALTA' || estadoFinal === 'INASISTENCIA') {
        try {
          // Obtener datos del estudiante y apoderado
          const estudiante = await prisma.estudiante.findUnique({
            where: { idEstudiante: parseInt(estudianteId) },
            include: {
              usuario: true,
              gradoSeccion: {
                include: {
                  grado: true,
                  seccion: true
                }
              },
              apoderados: {
                include: {
                  apoderado: {
                    include: {
                      usuario: true
                    }
                  }
                }
              }
            }
          })

          if (estudiante && estudiante.apoderados.length > 0) {
            const apoderado = estudiante.apoderados[0].apoderado
            
            console.log(`📧 Enviando notificación de inasistencia al apoderado: ${apoderado.usuario?.email}`)
            
            await notificarInasistencia({
              estudianteId: estudiante.idEstudiante,
              estudianteNombre: estudiante.usuario?.nombre || '',
              estudianteApellido: estudiante.usuario?.apellido || '',
              estudianteDNI: estudiante.usuario?.dni || '',
              grado: estudiante.gradoSeccion?.grado?.nombre || '',
              seccion: estudiante.gradoSeccion?.seccion?.nombre || '',
              fecha: fecha,
              emailApoderado: apoderado.usuario?.email || '',
              telefonoApoderado: apoderado.usuario?.telefono || '',
              apoderadoUsuarioId: apoderado.usuario?.idUsuario
            })
          }
        } catch (notifError) {
          console.error('Error al enviar notificación de inasistencia:', notifError)
        }
      }

      return NextResponse.json({
        message: 'Asistencia registrada exitosamente',
        id: nuevaAsistencia.idAsistenciaIE,
        notificacionEnviada: estadoFinal === 'AUSENTE' || estadoFinal === 'FALTA' || estadoFinal === 'INASISTENCIA'
      })
    }

  } catch (error) {
    console.error('Error creating/updating asistencia:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
