import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Guardando asistencias QR del docente...')

    console.log('📝 Procesando asistencias del docente...')

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

    if (!userInfo || !['DOCENTE', 'ADMINISTRATIVO'].includes(decoded.rol)) {
      return NextResponse.json({ error: 'Sin permisos de docente' }, { status: 403 })
    }

    const body = await request.json()
    console.log('📥 Body recibido:', JSON.stringify(body, null, 2))
    
    const { asistencias } = body

    if (!asistencias || !Array.isArray(asistencias) || asistencias.length === 0) {
      console.log('❌ Lista de asistencias inválida:', { asistencias, isArray: Array.isArray(asistencias) })
      return NextResponse.json({ error: 'Lista de asistencias requerida' }, { status: 400 })
    }

    console.log('📋 Procesando', asistencias.length, 'asistencias')
    console.log('📋 Primera asistencia:', JSON.stringify(asistencias[0], null, 2))

    const fechaHoy = new Date()
    const resultados = []

    for (const asistencia of asistencias) {
      const { estudianteId, estado, horaLlegada, fecha, claseId } = asistencia
      
      // La fuente será la clase específica donde se registra (se actualizará después de validar)
      let fuenteRegistro = claseId || 'CLASE_NO_ESPECIFICADA'
      
      console.log('🔍 Procesando asistencia:', {
        estudianteId,
        estado,
        horaLlegada,
        fecha,
        claseId,
        fuenteRegistro,
        tipos: {
          estudianteId: typeof estudianteId,
          estado: typeof estado,
          fecha: typeof fecha
        }
      })

      if (!estudianteId || !estado || !fecha) {
        console.log('⚠️ Asistencia incompleta:', asistencia)
        continue
      }

      try {
        // Buscar el estudiante y verificar que pertenezca a la clase
        let estudiante
        try {
          estudiante = await prisma.estudiante.findFirst({
            where: {
              idEstudiante: parseInt(estudianteId),
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
        } catch (dbError) {
          console.error('❌ Error de base de datos al buscar estudiante:', dbError)
          continue
        }

        if (!estudiante) {
          console.log('❌ Estudiante no encontrado:', estudianteId)
          continue
        }

        // Verificar que el estudiante pertenezca a la clase especificada
        if (claseId && estudiante.gradoSeccion) {
          // claseId es el idDocenteAula, necesitamos verificar que el estudiante pertenezca a esa clase
          let docenteAula
          try {
            docenteAula = await prisma.docenteAula.findUnique({
              where: { idDocenteAula: parseInt(claseId) },
              include: {
                gradoSeccion: {
                  include: {
                    grado: true,
                    seccion: true
                  }
                }
              }
            })
          } catch (dbError) {
            console.error('❌ Error de base de datos al buscar docenteAula:', dbError)
            continue
          }
          
          if (!docenteAula) {
            console.log(`❌ No se encontró la clase con ID: ${claseId}`)
            continue
          }
          
          const claseEstudiante = `${estudiante.gradoSeccion.grado.nombre}° ${estudiante.gradoSeccion.seccion.nombre}`
          const claseDocente = `${docenteAula.gradoSeccion.grado.nombre}° ${docenteAula.gradoSeccion.seccion.nombre}`
          
          console.log('🔍 Validando clase del estudiante:', {
            estudianteId,
            claseEstudiante,
            claseDocente,
            idDocenteAula: claseId,
            gradoSeccionEstudiante: estudiante.gradoSeccion.idGradoSeccion,
            gradoSeccionDocente: docenteAula.gradoSeccion.idGradoSeccion
          })
          
          // Comparar por idGradoSeccion que es más preciso
          if (estudiante.gradoSeccion.idGradoSeccion !== docenteAula.gradoSeccion.idGradoSeccion) {
            console.log(`⚠️ Estudiante ${estudiante.usuario.nombre} ${estudiante.usuario.apellido} no pertenece a la clase ${claseDocente}. Su clase es: ${claseEstudiante}`)
            
            // Si solo hay una asistencia y no pertenece a la clase, devolver error específico
            if (asistencias.length === 1) {
              return NextResponse.json({
                error: 'Estudiante no pertenece a esta clase',
                message: `El estudiante ${estudiante.usuario.nombre} ${estudiante.usuario.apellido} pertenece a ${claseEstudiante}, no a ${claseDocente}`,
                claseEstudiante: claseEstudiante,
                claseSeleccionada: claseDocente
              }, { status: 400 })
            }
            continue
          }
          console.log(`✅ Estudiante ${estudiante.usuario.nombre} ${estudiante.usuario.apellido} pertenece a la clase ${claseDocente}`)
          
          // Actualizar la fuente con el nombre de la clase
          fuenteRegistro = claseDocente
        }

        const fechaAsistencia = new Date(fecha)
        fechaAsistencia.setHours(0, 0, 0, 0)

        // Verificar si ya existe una asistencia para este estudiante en esta fecha
        let asistenciaExistente
        try {
          asistenciaExistente = await prisma.asistencia.findFirst({
            where: {
              idEstudiante: estudiante.idEstudiante,
              fecha: fechaAsistencia
            }
          })
        } catch (dbError) {
          console.error('❌ Error de base de datos al buscar asistencia existente:', dbError)
          continue
        }

        let asistenciaGuardada

        // Buscar el estado de asistencia correspondiente
        let estadoAsistencia
        try {
          estadoAsistencia = await prisma.estadoAsistencia.findFirst({
            where: { codigo: estado.toUpperCase() }
          })

          // Si no existe el estado, crearlo
          if (!estadoAsistencia) {
            estadoAsistencia = await prisma.estadoAsistencia.create({
              data: {
                codigo: estado.toUpperCase(),
                nombreEstado: estado.charAt(0).toUpperCase() + estado.slice(1)
              }
            })
          }
        } catch (dbError) {
          console.error('❌ Error de base de datos al buscar/crear estado de asistencia:', dbError)
          continue
        }

        try {
          if (asistenciaExistente) {
            // Actualizar asistencia existente
            asistenciaGuardada = await prisma.asistencia.update({
              where: {
                idAsistencia: asistenciaExistente.idAsistencia
              },
              data: {
                horaEntrada: horaLlegada ? new Date(`${fecha}T${horaLlegada}:00`) : fechaHoy,
                sesion: 'MAÑANA',
                idEstadoAsistencia: estadoAsistencia?.idEstadoAsistencia,
                fuente: fuenteRegistro,
                observaciones: `Actualizado por QR - Docente: ${userInfo.nombre} ${userInfo.apellido} - Estado: ${estado.toUpperCase()} - Clase: ${fuenteRegistro}`,
                registradoPor: userInfo.idUsuario
              }
            })
          } else {
            // Crear nueva asistencia
            asistenciaGuardada = await prisma.asistencia.create({
              data: {
                idEstudiante: estudiante.idEstudiante,
                idIe: userInfo.idIe!,
                fecha: fechaAsistencia,
                horaEntrada: horaLlegada ? new Date(`${fecha}T${horaLlegada}:00`) : fechaHoy,
                sesion: 'MAÑANA',
                idEstadoAsistencia: estadoAsistencia?.idEstadoAsistencia,
                fuente: fuenteRegistro,
                observaciones: `Registrado por QR - Docente: ${userInfo.nombre} ${userInfo.apellido} - Estado: ${estado.toUpperCase()} - Clase: ${fuenteRegistro}`,
                registradoPor: userInfo.idUsuario
              }
            })
          }
        } catch (dbError) {
          console.error('❌ Error de base de datos al guardar asistencia:', dbError)
          continue
        }

        resultados.push({
          estudiante: {
            id: estudiante.idEstudiante,
            nombre: estudiante.usuario.nombre,
            apellido: estudiante.usuario.apellido,
            dni: estudiante.usuario.dni
          },
          estado: estado,
          accion: asistenciaExistente ? 'actualizada' : 'creada',
          asistenciaId: asistenciaGuardada.idAsistencia
        })

        console.log(`✅ Asistencia ${asistenciaExistente ? 'actualizada' : 'creada'} para ${estudiante.usuario.nombre} ${estudiante.usuario.apellido} - Estado: ${estado}`)

      } catch (error) {
        console.error(`❌ Error procesando asistencia para estudiante ${estudianteId}:`, error)
      }
    }

    console.log(`🎉 Procesamiento completado: ${resultados.length} asistencias guardadas`)

    return NextResponse.json({
      success: true,
      message: `${resultados.length} asistencias guardadas correctamente`,
      resultados,
      timestamp: fechaHoy.toISOString()
    })

  } catch (error) {
    console.error('❌ Error al guardar asistencias QR:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
