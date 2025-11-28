import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

/**
 * GET /api/docentes/asistencia/precargada
 * 
 * Obtiene la lista de asistencia PRE-CARGADA desde el registro de portería.
 * El docente recibe los estudiantes que ya ingresaron a la institución,
 * y solo debe VALIDAR/VERIFICAR su presencia en el aula.
 * 
 * Flujo:
 * 1. Portería escanea QR → Se registra en AsistenciaIE (estado: INGRESADO)
 * 2. Docente consulta esta API → Recibe lista pre-cargada
 * 3. Docente valida presencia → Confirma o reporta incidencia
 */
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

    if (!['DOCENTE', 'ADMINISTRATIVO'].includes(decoded.rol)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const idClase = searchParams.get('idClase')
    const grado = searchParams.get('grado')
    const seccion = searchParams.get('seccion')
    const fecha = searchParams.get('fecha') || new Date().toISOString().split('T')[0]

    const fechaConsulta = new Date(fecha)
    fechaConsulta.setHours(0, 0, 0, 0)

    // Obtener el grado/sección de la clase o de los parámetros
    let gradoSeccion: any = null

    if (idClase) {
      const horarioClase = await prisma.horarioClase.findUnique({
        where: { idHorarioClase: parseInt(idClase) },
        include: {
          gradoSeccion: {
            include: {
              grado: true,
              seccion: true
            }
          }
        }
      })
      gradoSeccion = horarioClase?.gradoSeccion
    } else if (grado && seccion) {
      gradoSeccion = await prisma.gradoSeccion.findFirst({
        where: {
          grado: { nombre: grado },
          seccion: { nombre: seccion }
        },
        include: {
          grado: true,
          seccion: true
        }
      })
    }

    if (!gradoSeccion) {
      return NextResponse.json({ 
        error: 'Debe especificar una clase o grado/sección válidos' 
      }, { status: 400 })
    }

    // Obtener todos los estudiantes del aula
    const estudiantes = await prisma.estudiante.findMany({
      where: {
        idGradoSeccion: gradoSeccion.idGradoSeccion
      },
      include: {
        usuario: true
      },
      orderBy: {
        usuario: { apellido: 'asc' }
      }
    })

    // Obtener registros de ingreso del día (desde portería)
    const ingresosHoy = await prisma.asistenciaIE.findMany({
      where: {
        fecha: fechaConsulta,
        idEstudiante: { in: estudiantes.map(e => e.idEstudiante) }
      }
    })

    // Obtener asistencias ya validadas por el docente
    const asistenciasValidadas = await prisma.asistencia.findMany({
      where: {
        fecha: fechaConsulta,
        idEstudiante: { in: estudiantes.map(e => e.idEstudiante) }
      },
      include: {
        estadoAsistencia: true
      }
    })

    // Mapear datos para el docente
    const listaPrecargada = estudiantes.map(est => {
      const ingresoPorteria = ingresosHoy.find(i => i.idEstudiante === est.idEstudiante)
      const asistenciaValidada = asistenciasValidadas.find(a => a.idEstudiante === est.idEstudiante)

      // Determinar estado sugerido basado en ingreso de portería
      let estadoSugerido = 'AUSENTE'
      let requiereValidacion = true

      if (ingresoPorteria) {
        if (ingresoPorteria.estado === 'INGRESADO') {
          estadoSugerido = 'PRESENTE'
        } else if (ingresoPorteria.estado === 'TARDANZA') {
          estadoSugerido = 'TARDANZA'
        }
      }

      if (asistenciaValidada) {
        requiereValidacion = false
      }

      return {
        idEstudiante: est.idEstudiante,
        nombre: est.usuario?.nombre,
        apellido: est.usuario?.apellido,
        dni: est.usuario?.dni,
        codigo: est.codigoQR,
        
        // Datos de ingreso en portería
        ingresoPorteria: ingresoPorteria ? {
          horaIngreso: ingresoPorteria.horaIngreso,
          estado: ingresoPorteria.estado
        } : null,
        
        // Estado sugerido para el docente
        estadoSugerido,
        
        // Si ya fue validado por el docente
        validado: !requiereValidacion,
        asistenciaValidada: asistenciaValidada ? {
          estado: asistenciaValidada.estadoAsistencia?.codigo,
          horaRegistro: asistenciaValidada.createdAt,
          observaciones: asistenciaValidada.observaciones
        } : null,
        
        // Indicadores visuales
        indicadores: {
          ingresoRegistrado: !!ingresoPorteria,
          enAula: ingresoPorteria?.estado === 'EN_CLASE',
          posibleEvasion: ingresoPorteria && !asistenciaValidada && estadoSugerido === 'PRESENTE',
          requiereAtencion: !ingresoPorteria && !asistenciaValidada
        }
      }
    })

    // Estadísticas rápidas
    const stats = {
      totalEstudiantes: estudiantes.length,
      conIngresoPorteria: ingresosHoy.length,
      yaValidados: asistenciasValidadas.length,
      pendientesValidacion: estudiantes.length - asistenciasValidadas.length,
      sinIngreso: estudiantes.length - ingresosHoy.length
    }

    return NextResponse.json({
      success: true,
      fecha,
      aula: {
        grado: gradoSeccion.grado.nombre,
        seccion: gradoSeccion.seccion.nombre,
        idGradoSeccion: gradoSeccion.idGradoSeccion
      },
      estadisticas: stats,
      estudiantes: listaPrecargada,
      mensaje: stats.pendientesValidacion > 0 
        ? `${stats.conIngresoPorteria} estudiantes ingresaron por portería. Valide su presencia en el aula.`
        : 'Todos los estudiantes han sido validados.'
    })

  } catch (error) {
    console.error('Error al obtener asistencia precargada:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
