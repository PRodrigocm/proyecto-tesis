import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// GET /api/docentes/reportes - Generar reportes de asistencias y retiros
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Verificar que sea docente o administrador
    if (!['DOCENTE', 'ADMINISTRATIVO'].includes(decoded.rol)) {
      return NextResponse.json({ error: 'No tienes permisos para generar reportes' }, { status: 403 })
    }

    const url = new URL(request.url)
    const tipoReporte = url.searchParams.get('tipo') || 'semanal' // semanal, mensual
    const fechaInicio = url.searchParams.get('fechaInicio')
    const fechaFin = url.searchParams.get('fechaFin')
    const grado = url.searchParams.get('grado')
    const seccion = url.searchParams.get('seccion')

    console.log('🔍 Generando reporte:', { tipoReporte, fechaInicio, fechaFin, grado, seccion })

    // Calcular fechas si no se proporcionan
    let startDate: Date
    let endDate: Date

    if (fechaInicio && fechaFin) {
      startDate = new Date(fechaInicio)
      endDate = new Date(fechaFin)
    } else {
      const now = new Date()
      if (tipoReporte === 'semanal') {
        // Semana actual (lunes a domingo)
        const dayOfWeek = now.getDay()
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
        startDate = new Date(now)
        startDate.setDate(now.getDate() - daysToMonday)
        startDate.setHours(0, 0, 0, 0)
        
        endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + 6)
        endDate.setHours(23, 59, 59, 999)
      } else {
        // Mes actual
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      }
    }

    console.log('📅 Rango de fechas:', { startDate, endDate })

    // Buscar docente si no es administrador
    let docenteId: number | null = null
    if (decoded.rol === 'DOCENTE') {
      const docente = await prisma.docente.findFirst({
        where: { idUsuario: decoded.idUsuario }
      })
      if (!docente) {
        return NextResponse.json({ error: 'Docente no encontrado' }, { status: 404 })
      }
      docenteId = docente.idDocente
    }

    // Obtener estudiantes según el rol y filtros
    let whereClause: any = {}
    
    if (docenteId) {
      // Para docentes: solo estudiantes de sus clases
      whereClause = {
        gradoSeccion: {
          horariosClase: {
            some: {
              idDocente: docenteId
            }
          }
        }
      }
    }

    // Aplicar filtros adicionales
    if (grado || seccion) {
      whereClause.gradoSeccion = {
        ...whereClause.gradoSeccion,
        ...(grado && { grado: { nombre: grado } }),
        ...(seccion && { seccion: { nombre: seccion } })
      }
    }

    // Obtener estudiantes
    const estudiantes = await prisma.estudiante.findMany({
      where: whereClause,
      include: {
        usuario: true,
        gradoSeccion: {
          include: {
            grado: {
              include: {
                nivel: true
              }
            },
            seccion: true
          }
        },
        asistencias: {
          where: {
            fecha: {
              gte: startDate,
              lte: endDate
            }
          },
          include: {
            estadoAsistencia: true,
            usuarioRegistrador: true
          },
          orderBy: {
            fecha: 'asc'
          }
        },
        retiros: {
          where: {
            fecha: {
              gte: startDate,
              lte: endDate
            }
          },
          include: {
            tipoRetiro: true,
            estadoRetiro: true,
            apoderadoContacto: {
              include: {
                usuario: true
              }
            },
            apoderadoRetira: {
              include: {
                usuario: true
              }
            },
            docenteReportador: {
              include: {
                usuario: true
              }
            }
          },
          orderBy: {
            fecha: 'asc'
          }
        }
      },
      orderBy: [
        { gradoSeccion: { grado: { nombre: 'asc' } } },
        { gradoSeccion: { seccion: { nombre: 'asc' } } },
        { usuario: { apellido: 'asc' } },
        { usuario: { nombre: 'asc' } }
      ]
    })

    // Obtener estadísticas generales
    const totalEstudiantes = estudiantes.length
    const totalAsistencias = estudiantes.reduce((acc, est) => acc + est.asistencias.length, 0)
    const totalRetiros = estudiantes.reduce((acc, est) => acc + est.retiros.length, 0)

    // Calcular estadísticas por estado de asistencia
    const estadisticasAsistencia = {
      presente: 0,
      tardanza: 0,
      inasistencia: 0,
      justificada: 0
    }

    estudiantes.forEach(estudiante => {
      estudiante.asistencias.forEach(asistencia => {
        const codigo = asistencia.estadoAsistencia?.codigo?.toLowerCase()
        if (codigo === 'presente') estadisticasAsistencia.presente++
        else if (codigo === 'tardanza') estadisticasAsistencia.tardanza++
        else if (codigo === 'inasistencia') estadisticasAsistencia.inasistencia++
        else if (codigo === 'justificada') estadisticasAsistencia.justificada++
      })
    })

    // Calcular porcentajes
    const porcentajes = {
      asistencia: totalAsistencias > 0 ? ((estadisticasAsistencia.presente + estadisticasAsistencia.tardanza) / totalAsistencias * 100).toFixed(2) : '0',
      tardanzas: totalAsistencias > 0 ? (estadisticasAsistencia.tardanza / totalAsistencias * 100).toFixed(2) : '0',
      inasistencias: totalAsistencias > 0 ? (estadisticasAsistencia.inasistencia / totalAsistencias * 100).toFixed(2) : '0'
    }

    // Obtener información del docente/institución para el reporte
    const institucion = await prisma.ie.findFirst({
      where: { idIe: decoded.idIe || 1 },
      include: {
        modalidad: true
      }
    })

    let docenteInfo: { nombre: string; especialidad: string | null; codigo: string | null } | null = null
    if (docenteId) {
      const docente = await prisma.docente.findFirst({
        where: { idDocente: docenteId },
        include: {
          usuario: true
        }
      })
      docenteInfo = {
        nombre: `${docente?.usuario.nombre} ${docente?.usuario.apellido}`,
        especialidad: docente?.especialidad || null,
        codigo: docente?.codigo || null
      }
    }

    // Preparar datos del reporte
    const reporteData = {
      metadatos: {
        tipoReporte,
        fechaGeneracion: new Date().toISOString(),
        fechaInicio: startDate.toISOString(),
        fechaFin: endDate.toISOString(),
        generadoPor: docenteInfo || {
          nombre: `${decoded.nombre} ${decoded.apellido}`,
          rol: decoded.rol
        },
        institucion: {
          nombre: institucion?.nombre,
          codigo: institucion?.codigoIe,
          modalidad: institucion?.modalidad.nombre,
          direccion: institucion?.direccion,
          telefono: institucion?.telefono,
          email: institucion?.email
        },
        filtros: {
          grado,
          seccion
        }
      },
      resumenEjecutivo: {
        totalEstudiantes,
        totalAsistencias,
        totalRetiros,
        porcentajes,
        estadisticasAsistencia
      },
      estudiantes: estudiantes.map(estudiante => ({
        id: estudiante.idEstudiante,
        dni: estudiante.usuario.dni,
        nombre: estudiante.usuario.nombre,
        apellido: estudiante.usuario.apellido,
        grado: estudiante.gradoSeccion?.grado?.nombre,
        seccion: estudiante.gradoSeccion?.seccion?.nombre,
        nivel: estudiante.gradoSeccion?.grado?.nivel?.nombre,
        estadisticas: {
          totalAsistencias: estudiante.asistencias.length,
          presente: estudiante.asistencias.filter(a => a.estadoAsistencia?.codigo === 'PRESENTE').length,
          tardanza: estudiante.asistencias.filter(a => a.estadoAsistencia?.codigo === 'TARDANZA').length,
          inasistencia: estudiante.asistencias.filter(a => a.estadoAsistencia?.codigo === 'INASISTENCIA').length,
          justificada: estudiante.asistencias.filter(a => a.estadoAsistencia?.codigo === 'JUSTIFICADA').length,
          totalRetiros: estudiante.retiros.length
        },
        asistencias: estudiante.asistencias.map(asistencia => ({
          fecha: asistencia.fecha.toISOString().split('T')[0],
          estado: asistencia.estadoAsistencia?.nombreEstado,
          codigo: asistencia.estadoAsistencia?.codigo,
          observaciones: asistencia.observaciones,
          registradoPor: asistencia.usuarioRegistrador ? 
            `${asistencia.usuarioRegistrador.nombre} ${asistencia.usuarioRegistrador.apellido}` : null,
          fechaRegistro: asistencia.createdAt.toISOString()
        })),
        retiros: estudiante.retiros.map(retiro => ({
          fecha: retiro.fecha.toISOString().split('T')[0],
          hora: retiro.hora.toTimeString().slice(0, 8),
          tipoRetiro: retiro.tipoRetiro?.nombre,
          estado: retiro.estadoRetiro?.nombre,
          origen: retiro.origen,
          apoderadoContactado: retiro.apoderadoContacto ? 
            `${retiro.apoderadoContacto.usuario.nombre} ${retiro.apoderadoContacto.usuario.apellido}` : null,
          apoderadoQueRetira: retiro.apoderadoRetira ? 
            `${retiro.apoderadoRetira.usuario.nombre} ${retiro.apoderadoRetira.usuario.apellido}` : null,
          docenteReportador: retiro.docenteReportador ? 
            `${retiro.docenteReportador.usuario.nombre} ${retiro.docenteReportador.usuario.apellido}` : null,
          observaciones: retiro.observaciones,
          medioContacto: retiro.medioContacto,
          horaContacto: retiro.horaContacto?.toISOString()
        }))
      }))
    }

    console.log(`✅ Reporte generado: ${totalEstudiantes} estudiantes, ${totalAsistencias} asistencias, ${totalRetiros} retiros`)

    return NextResponse.json({
      success: true,
      data: reporteData
    })

  } catch (error) {
    console.error('❌ Error al generar reporte:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
