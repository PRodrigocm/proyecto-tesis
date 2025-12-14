import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    console.log('📚 Obteniendo estudiantes para control de asistencia...')

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

    const ieId = userInfo.idIe
    if (!ieId) {
      return NextResponse.json({ error: 'Usuario sin IE asignada' }, { status: 400 })
    }

    // Obtener parámetro de fecha de la URL o usar fecha actual
    const { searchParams } = new URL(request.url)
    const fechaParam = searchParams.get('fecha')
    
    let fechaBusqueda: Date
    let fechaHoy: string
    
    if (fechaParam) {
      // Usar la fecha proporcionada
      fechaBusqueda = new Date(fechaParam + 'T00:00:00')
      fechaHoy = fechaParam
    } else {
      // Usar fecha actual
      const hoy = new Date()
      fechaBusqueda = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
      fechaHoy = fechaBusqueda.toISOString().split('T')[0]
    }

    console.log('📅 Obteniendo estudiantes para fecha:', fechaHoy)
    console.log('🔍 Fecha de búsqueda:', fechaBusqueda)
    console.log('🏫 IE del auxiliar:', ieId)

    // Obtener todos los estudiantes activos de la IE
    // Buscar por idIe del estudiante O por idIe del usuario
    const estudiantes = await prisma.estudiante.findMany({
      where: {
        AND: [
          {
            usuario: {
              estado: 'ACTIVO'
            }
          },
          {
            OR: [
              { idIe: ieId },
              { usuario: { idIe: ieId } }
            ]
          }
        ]
      },
      select: {
        idEstudiante: true,
        idGradoSeccion: true,
        idIe: true,
        codigoQR: true,
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
        }
      },
      orderBy: [
        { gradoSeccion: { grado: { nombre: 'asc' } } },
        { gradoSeccion: { seccion: { nombre: 'asc' } } },
        { usuario: { apellido: 'asc' } },
        { usuario: { nombre: 'asc' } }
      ]
    })

    console.log(`📊 Estudiantes encontrados en BD: ${estudiantes.length}`)

    // OPTIMIZACIÓN: Obtener todas las asistencias IE y retiros en batch (1 query cada uno)
    const idsEstudiantes = estudiantes.map(e => e.idEstudiante)
    
    const [asistenciasIE, retirosAutorizados] = await Promise.all([
      // Obtener todas las asistencias IE del día en una sola query
      prisma.asistenciaIE.findMany({
        where: {
          idEstudiante: { in: idsEstudiantes },
          fecha: fechaBusqueda
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      // Obtener todos los retiros autorizados del día en una sola query
      prisma.retiro.findMany({
        where: {
          idEstudiante: { in: idsEstudiantes },
          fecha: fechaBusqueda,
          estadoRetiro: {
            codigo: 'AUTORIZADO'
          }
        },
        include: {
          estadoRetiro: true
        }
      })
    ])

    console.log(`📋 Asistencias IE encontradas: ${asistenciasIE.length}`)
    console.log(`🚪 Retiros autorizados encontrados: ${retirosAutorizados.length}`)

    // Crear mapas para acceso rápido O(1)
    const asistenciasMap = new Map(
      asistenciasIE.map(a => [a.idEstudiante, a])
    )
    const retirosMap = new Map(
      retirosAutorizados.map(r => [r.idEstudiante, r])
    )

    // Función para formatear hora en zona horaria local (Lima/Peru)
    const formatearHora = (fecha: Date | null): string => {
      if (!fecha) return ''
      return fecha.toLocaleTimeString('es-PE', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/Lima'
      })
    }

    // Mapear estudiantes con su estado (procesamiento en memoria, sin queries adicionales)
    const estudiantesConEstado = estudiantes.map((estudiante) => {
      const asistenciaIE = asistenciasMap.get(estudiante.idEstudiante)
      const retiroAutorizado = retirosMap.get(estudiante.idEstudiante)

      let estado: 'PRESENTE' | 'AUSENTE' | 'RETIRADO' | 'TARDANZA' = 'AUSENTE'
      let horaEntrada: string | undefined
      let horaSalida: string | undefined

      // PRIMERO: Verificar si hay un retiro AUTORIZADO - tiene máxima prioridad
      if (retiroAutorizado) {
        estado = 'RETIRADO'
        horaEntrada = asistenciaIE?.horaIngreso ? formatearHora(asistenciaIE.horaIngreso) : undefined
        horaSalida = retiroAutorizado.hora ? formatearHora(retiroAutorizado.hora) : undefined
      }
      // SEGUNDO: Determinar estado basado en AsistenciaIE
      else if (asistenciaIE) {
        // Si tiene hora de ingreso
        if (asistenciaIE.horaIngreso) {
          horaEntrada = formatearHora(asistenciaIE.horaIngreso)
          
          // Si tiene hora de salida SIN retiro autorizado, sigue siendo PRESENTE (salida normal)
          if (asistenciaIE.horaSalida) {
            horaSalida = formatearHora(asistenciaIE.horaSalida)
          }
          
          // Determinar estado según el estado guardado
          if (asistenciaIE.estado === 'TARDANZA') {
            estado = 'TARDANZA'
          } else {
            estado = 'PRESENTE'
          }
        }
      }

      return {
        id: estudiante.idEstudiante.toString(),
        nombre: estudiante.usuario.nombre || '',
        apellido: estudiante.usuario.apellido || '',
        dni: estudiante.usuario.dni,
        grado: estudiante.gradoSeccion?.grado?.nombre || '',
        seccion: estudiante.gradoSeccion?.seccion?.nombre || '',
        nivel: estudiante.gradoSeccion?.grado?.nivel?.nombre || '',
        codigo: estudiante.codigoQR || estudiante.usuario.dni,
        codigoQR: estudiante.codigoQR || estudiante.usuario.dni,
        estado,
        horaEntrada,
        horaSalida
      }
    })

    console.log(`✅ ${estudiantesConEstado.length} estudiantes procesados`)
    const conAsistencia = estudiantesConEstado.filter(e => e.estado !== 'AUSENTE').length
    console.log(`📊 Resumen: ${conAsistencia} con asistencia, ${estudiantesConEstado.length - conAsistencia} ausentes`)

    return NextResponse.json({
      success: true,
      estudiantes: estudiantesConEstado,
      fecha: fechaHoy,
      fechaBusqueda: fechaBusqueda.toISOString(),
      total: estudiantesConEstado.length
    })

  } catch (error) {
    console.error('❌ Error al obtener estudiantes:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
