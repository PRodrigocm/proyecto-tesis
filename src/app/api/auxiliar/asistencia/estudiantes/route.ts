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
    estudiantes.forEach(e => {
      console.log(`  - ${e.usuario.nombre} ${e.usuario.apellido} (idIe usuario: ${e.usuario.idIe})`)
    })

    // Buscar asistencias IE (entrada/salida) para cada estudiante
    const estudiantesConEstado = await Promise.all(
      estudiantes.map(async (estudiante) => {
        // Buscar asistencia IE del día (entrada/salida de la institución)
        const asistenciaIE = await prisma.asistenciaIE.findFirst({
          where: {
            idEstudiante: estudiante.idEstudiante,
            fecha: {
              gte: fechaBusqueda,
              lt: new Date(fechaBusqueda.getTime() + 24 * 60 * 60 * 1000)
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

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

        if (asistenciaIE) {
          console.log(`📋 Asistencia encontrada para ${estudiante.usuario.nombre}:`, {
            fecha: asistenciaIE.fecha,
            horaIngreso: asistenciaIE.horaIngreso,
            horaSalida: asistenciaIE.horaSalida,
            estado: asistenciaIE.estado
          })
        }

        let estado: 'PRESENTE' | 'AUSENTE' | 'RETIRADO' | 'TARDANZA' = 'AUSENTE'
        let horaEntrada: string | undefined
        let horaSalida: string | undefined

        // Determinar estado basado en AsistenciaIE
        if (asistenciaIE) {
          if (asistenciaIE.horaSalida) {
            estado = 'RETIRADO'
            horaSalida = formatearHora(asistenciaIE.horaSalida)
          }
          
          if (asistenciaIE.horaIngreso) {
            horaEntrada = formatearHora(asistenciaIE.horaIngreso)
            // Si tiene hora de ingreso pero no salida, está presente
            if (!asistenciaIE.horaSalida) {
              // Verificar si el estado guardado es TARDANZA
              if (asistenciaIE.estado === 'TARDANZA') {
                estado = 'TARDANZA'
              } else {
                estado = 'PRESENTE'
              }
            }
          }
        }
        // Si no tiene AsistenciaIE, el estado es AUSENTE (sin registro de entrada)

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
    )

    console.log(`✅ ${estudiantesConEstado.length} estudiantes obtenidos`)
    console.log('🕐 Ejemplo de estudiante con horarios:', estudiantesConEstado.find(e => e.horaEntrada || e.horaSalida))

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
