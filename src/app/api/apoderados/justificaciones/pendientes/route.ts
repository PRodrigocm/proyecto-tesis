import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { fechaUTCaLima, claveEstudianteFecha } from '@/lib/date-utils'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as any

    if (decoded.rol !== 'APODERADO') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const url = new URL(request.url)
    const estudianteId = url.searchParams.get('estudianteId')

    // Obtener el ID del usuario
    const apoderadoUserId = decoded.userId || decoded.idUsuario || decoded.id

    // Buscar el apoderado
    const apoderado = await prisma.apoderado.findFirst({
      where: {
        idUsuario: apoderadoUserId
      }
    })

    if (!apoderado) {
      return NextResponse.json({ 
        error: 'No se encontró el apoderado'
      }, { status: 404 })
    }

    // Obtener estudiantes del apoderado (solo los vinculados a este apoderado)
    const estudiantesApoderado = await prisma.estudianteApoderado.findMany({
      where: {
        idApoderado: apoderado.idApoderado,
        ...(estudianteId && { idEstudiante: parseInt(estudianteId) })
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
      }
    })

    const estudianteIds = estudiantesApoderado.map((ea) => ea.estudiante.idEstudiante)

    if (estudianteIds.length === 0) {
      return NextResponse.json({
        success: true,
        inasistencias: []
      })
    }

    // Buscar todos los estados de asistencia para logging
    const todosEstados = await prisma.estadoAsistencia.findMany()
    console.log('📋 Estados de asistencia disponibles:', todosEstados.map(e => ({ id: e.idEstadoAsistencia, codigo: e.codigo })))

    // Buscar solo estados que representan INASISTENCIA SIN JUSTIFICAR
    // Excluir: PRESENTE, TARDANZA, JUSTIFICADO, JUSTIFICADA, RETIRO, etc.
    const estadosAusente = todosEstados.filter(e => {
      const codigo = e.codigo.toUpperCase()
      // Solo incluir estados que son realmente inasistencias sin justificar
      return codigo === 'AUSENTE' || 
             codigo === 'INASISTENCIA' || 
             codigo === 'FALTA' ||
             codigo === 'SIN_REGISTRAR'
    })

    console.log('🔍 Estados considerados como inasistencia pendiente:', estadosAusente.map(e => e.codigo))

    const estadoAusenteIds = estadosAusente.map(e => e.idEstadoAsistencia)

    if (estadoAusenteIds.length === 0) {
      console.log('⚠️ No se encontraron estados de ausencia en la BD')
      return NextResponse.json({
        success: true,
        inasistencias: []
      })
    }

    // Obtener TODOS los retiros de los estudiantes (sin importar estado)
    // para excluir esas fechas de las inasistencias justificables
    const retiros = await prisma.retiro.findMany({
      where: {
        idEstudiante: { in: estudianteIds }
      },
      select: {
        idEstudiante: true,
        fecha: true
      }
    })

    // Crear un Set de fechas con retiros por estudiante para búsqueda rápida
    // IMPORTANTE: Usar fecha en zona horaria de Lima para evitar inconsistencias
    const fechasConRetiro = new Map<number, Set<string>>()
    retiros.forEach(retiro => {
      const fechaStr = fechaUTCaLima(retiro.fecha)
      if (!fechasConRetiro.has(retiro.idEstudiante)) {
        fechasConRetiro.set(retiro.idEstudiante, new Set())
      }
      fechasConRetiro.get(retiro.idEstudiante)!.add(fechaStr)
    })

    // Obtener justificaciones existentes para excluirlas
    const justificacionesExistentes = await prisma.justificacion.findMany({
      where: {
        idEstudiante: { in: estudianteIds }
      },
      include: {
        asistenciasAfectadas: true
      }
    })

    // Crear Set de IDs de asistencias ya justificadas
    const asistenciasYaJustificadas = new Set<number>()
    justificacionesExistentes.forEach(just => {
      just.asistenciasAfectadas.forEach(asist => {
        asistenciasYaJustificadas.add(asist.idAsistencia)
      })
    })

    // También obtener IDs de estados que NO son inasistencia (para doble verificación)
    const estadosNoInasistencia = todosEstados.filter(e => {
      const codigo = e.codigo.toUpperCase()
      return codigo === 'PRESENTE' || 
             codigo === 'TARDANZA' || 
             codigo === 'JUSTIFICADO' || 
             codigo === 'JUSTIFICADA' ||
             codigo === 'RETIRO' ||
             codigo === 'RETIRADO'
    })
    const estadosNoInasistenciaIds = new Set(estadosNoInasistencia.map(e => e.idEstadoAsistencia))
    console.log('🔍 Estados que NO son inasistencia:', estadosNoInasistencia.map(e => e.codigo))

    // IMPORTANTE: Obtener TODAS las asistencias con estados válidos (PRESENTE, JUSTIFICADA, etc.)
    // para excluir esas fechas de las inasistencias pendientes
    const asistenciasConEstadoValido = await prisma.asistencia.findMany({
      where: {
        idEstudiante: { in: estudianteIds },
        idEstadoAsistencia: { in: Array.from(estadosNoInasistenciaIds) }
      },
      select: {
        idEstudiante: true,
        fecha: true,
        idEstadoAsistencia: true
      }
    })

    // Crear un Set de estudiante+fecha que ya tienen estado válido
    // IMPORTANTE: Usar fecha en zona horaria de Lima para evitar inconsistencias
    const fechasConEstadoValido = new Set<string>()
    asistenciasConEstadoValido.forEach(asist => {
      const key = claveEstudianteFecha(asist.idEstudiante, asist.fecha)
      fechasConEstadoValido.add(key)
      console.log(`✅ Fecha con estado válido: ${key}`)
    })

    console.log(`📋 Total de fechas con estado válido (no requieren justificación): ${fechasConEstadoValido.size}`)

    // Obtener inasistencias de la BD
    const inasistencias = await prisma.asistencia.findMany({
      where: {
        idEstudiante: { in: estudianteIds },
        idEstadoAsistencia: { in: estadoAusenteIds }
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
        },
        horarioClase: true,
        estadoAsistencia: true
      },
      orderBy: {
        fecha: 'desc'
      }
    })

    // Filtrar inasistencias:
    // 1. Excluir las que ya tienen otro registro con estado válido (PRESENTE, JUSTIFICADA, etc.)
    // 2. Excluir las que ya tienen justificación
    // 3. Excluir las que tienen retiro en esa fecha
    // 4. Eliminar duplicados por estudiante+fecha
    const fechasVistas = new Map<string, boolean>()
    
    console.log(`📊 Total de asistencias con estado ausente encontradas: ${inasistencias.length}`)
    
    const inasistenciasFiltradas = inasistencias.filter(asist => {
      // Obtener fecha en zona horaria de Lima (no UTC)
      const fechaLimaStr = fechaUTCaLima(asist.fecha)
      const keyEstudianteFecha = claveEstudianteFecha(asist.idEstudiante, asist.fecha)
      
      console.log(`🔍 Evaluando asistencia ${asist.idAsistencia}: estudiante=${asist.idEstudiante}, fechaUTC=${asist.fecha.toISOString()}, fechaLima=${fechaLimaStr}`)
      
      // CRÍTICO: Excluir si existe OTRA asistencia con estado válido para este estudiante+fecha
      // Esto cubre el caso donde el docente actualizó el estado en otro registro
      if (fechasConEstadoValido.has(keyEstudianteFecha)) {
        console.log(`⏭️ Excluida asistencia ${asist.idAsistencia}: existe otro registro con estado válido para ${keyEstudianteFecha}`)
        return false
      }
      
      // Excluir si ya tiene justificación
      if (asistenciasYaJustificadas.has(asist.idAsistencia)) {
        console.log(`⏭️ Excluida asistencia ${asist.idAsistencia}: ya tiene justificación`)
        return false
      }

      // Excluir si hay retiro en esa fecha para ese estudiante
      const retirosEstudiante = fechasConRetiro.get(asist.idEstudiante)
      if (retirosEstudiante && retirosEstudiante.has(fechaLimaStr)) {
        console.log(`⏭️ Excluida asistencia ${asist.idAsistencia}: tiene retiro en esa fecha`)
        return false
      }

      // Evitar duplicados por estudiante+fecha
      if (fechasVistas.has(keyEstudianteFecha)) {
        return false
      }
      fechasVistas.set(keyEstudianteFecha, true)

      return true
    })
    
    console.log(`✅ Inasistencias pendientes después de filtrar: ${inasistenciasFiltradas.length}`)
    
    // Log detallado de las inasistencias que se van a devolver
    inasistenciasFiltradas.forEach(asist => {
      const fechaLima = fechaUTCaLima(asist.fecha)
      console.log(`📌 PENDIENTE: ID=${asist.idAsistencia}, Estudiante=${asist.estudiante.usuario.nombre} ${asist.estudiante.usuario.apellido}, FechaUTC=${asist.fecha.toISOString()}, FechaLima=${fechaLima}, Estado=${asist.estadoAsistencia?.codigo}`)
    })

    // Transformar a formato esperado por el frontend
    const inasistenciasPendientes = inasistenciasFiltradas.map((inasistencia) => {
      // Determinar sesión basada en la hora de registro
      let sesion = 'Sin especificar'
      if (inasistencia.horaRegistro) {
        const hora = inasistencia.horaRegistro.getHours()
        if (hora < 13) {
          sesion = 'MAÑANA'
        } else {
          sesion = 'TARDE'
        }
      }

      // Convertir fecha a formato local de Lima para mostrar correctamente
      const fechaLimaStr = fechaUTCaLima(inasistencia.fecha)
      
      return {
        id: inasistencia.idAsistencia.toString(),
        fecha: `${fechaLimaStr}T00:00:00.000Z`, // Fecha normalizada en Lima
        sesion,
        estudiante: {
          id: inasistencia.estudiante.idEstudiante.toString(),
          nombre: inasistencia.estudiante.usuario.nombre || '',
          apellido: inasistencia.estudiante.usuario.apellido || '',
          dni: inasistencia.estudiante.usuario.dni,
          grado: inasistencia.estudiante.gradoSeccion?.grado.nombre || 'Sin grado',
          seccion: inasistencia.estudiante.gradoSeccion?.seccion.nombre || 'Sin sección'
        },
        estado: 'INASISTENCIA',
        fechaRegistro: inasistencia.createdAt.toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      inasistencias: inasistenciasPendientes
    })

  } catch (error) {
    console.error('Error fetching inasistencias pendientes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
