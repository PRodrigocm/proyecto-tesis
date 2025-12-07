import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

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

    // Buscar todos los estados de ausencia/inasistencia
    const estadosAusente = await prisma.estadoAsistencia.findMany({
      where: {
        OR: [
          { codigo: 'AUSENTE' },
          { codigo: 'INASISTENCIA' }
        ]
      }
    })

    const estadoAusenteIds = estadosAusente.map(e => e.idEstadoAsistencia)

    if (estadoAusenteIds.length === 0) {
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
    const fechasConRetiro = new Map<number, Set<string>>()
    retiros.forEach(retiro => {
      const fechaStr = retiro.fecha.toISOString().split('T')[0]
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
        horarioClase: true
      },
      orderBy: {
        fecha: 'desc'
      }
    })

    // Filtrar inasistencias:
    // 1. Excluir las que ya tienen justificación
    // 2. Excluir las que tienen retiro en esa fecha (sin importar estado del retiro)
    // 3. Eliminar duplicados por estudiante+fecha
    const fechasVistas = new Map<string, boolean>()
    
    const inasistenciasFiltradas = inasistencias.filter(asist => {
      // Excluir si ya tiene justificación
      if (asistenciasYaJustificadas.has(asist.idAsistencia)) {
        return false
      }

      // Obtener fecha en formato local (evitar problemas de timezone)
      const fechaLocal = new Date(asist.fecha)
      const fechaStr = fechaLocal.toISOString().split('T')[0]
      
      // Excluir si hay retiro en esa fecha para ese estudiante
      const retirosEstudiante = fechasConRetiro.get(asist.idEstudiante)
      if (retirosEstudiante && retirosEstudiante.has(fechaStr)) {
        return false
      }

      // Evitar duplicados por estudiante+fecha
      const key = `${asist.idEstudiante}-${fechaStr}`
      if (fechasVistas.has(key)) {
        return false
      }
      fechasVistas.set(key, true)

      return true
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

      return {
        id: inasistencia.idAsistencia.toString(),
        fecha: inasistencia.fecha.toISOString(),
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
