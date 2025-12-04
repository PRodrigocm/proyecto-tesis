import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

/**
 * POST - Marcar inasistencias automáticas para estudiantes que no registraron asistencia
 * Se ejecuta cuando termina el horario de clases
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Iniciando marcado automático de inasistencias...')
    
    // Obtener información del token
    const authHeader = request.headers.get('authorization')
    let ieId = 1
    let userId: number | null = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, JWT_SECRET) as any
        ieId = decoded.ieId || 1
        userId = decoded.userId || null
      } catch {
        // Continuar con valores por defecto
      }
    }

    const body = await request.json()
    const { 
      fecha, 
      idGradoSeccion, 
      idHorarioClase,
      forzar = false // Si es true, marca inasistencia sin verificar hora
    } = body

    if (!fecha) {
      return NextResponse.json({ error: 'Fecha es requerida' }, { status: 400 })
    }

    const fechaAsistencia = new Date(fecha)
    fechaAsistencia.setHours(0, 0, 0, 0)
    
    // Obtener hora actual en Perú (UTC-5)
    const ahora = new Date()
    const horaActualPeru = new Date(ahora.getTime() - (5 * 60 * 60 * 1000))
    const horaActualMinutos = horaActualPeru.getHours() * 60 + horaActualPeru.getMinutes()

    // Si hay horario de clase específico, verificar que ya pasó la hora fin
    let horaFinClase: number | null = null
    if (idHorarioClase && !forzar) {
      const horario = await prisma.horarioClase.findUnique({
        where: { idHorarioClase: parseInt(idHorarioClase) }
      })
      
      if (horario?.horaFin) {
        const horaFin = new Date(horario.horaFin)
        horaFinClase = horaFin.getUTCHours() * 60 + horaFin.getUTCMinutes()
        
        // Si aún no ha terminado la clase, no marcar inasistencias
        if (horaActualMinutos < horaFinClase) {
          return NextResponse.json({
            success: false,
            message: 'La clase aún no ha terminado',
            horaActual: `${Math.floor(horaActualMinutos/60)}:${horaActualMinutos%60}`,
            horaFinClase: `${Math.floor(horaFinClase/60)}:${horaFinClase%60}`
          })
        }
      }
    }

    // Obtener todos los estudiantes del grado/sección o de la IE
    const whereEstudiantes: any = {
      usuario: {
        idIe: ieId,
        estado: 'ACTIVO'
      }
    }
    
    if (idGradoSeccion) {
      whereEstudiantes.idGradoSeccion = parseInt(idGradoSeccion)
    }

    const estudiantes = await prisma.estudiante.findMany({
      where: whereEstudiantes,
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

    console.log(`📋 Encontrados ${estudiantes.length} estudiantes para verificar`)

    // Buscar o crear estado INASISTENCIA
    let estadoInasistencia = await prisma.estadoAsistencia.findFirst({
      where: { codigo: 'INASISTENCIA' }
    })

    if (!estadoInasistencia) {
      estadoInasistencia = await prisma.estadoAsistencia.create({
        data: {
          codigo: 'INASISTENCIA',
          nombreEstado: 'Inasistencia',
          requiereJustificacion: true,
          afectaAsistencia: true,
          activo: true
        }
      })
    }

    let marcados = 0
    let yaRegistrados = 0
    const estudiantesMarcados: string[] = []

    for (const estudiante of estudiantes) {
      // Verificar si ya tiene asistencia registrada en AsistenciaIE
      const asistenciaExistente = await prisma.asistenciaIE.findFirst({
        where: {
          idEstudiante: estudiante.idEstudiante,
          fecha: fechaAsistencia
        }
      })

      if (asistenciaExistente) {
        yaRegistrados++
        continue // Ya tiene registro, no marcar inasistencia
      }

      // Marcar como INASISTENCIA en AsistenciaIE
      await prisma.asistenciaIE.create({
        data: {
          idEstudiante: estudiante.idEstudiante,
          idIe: ieId,
          fecha: fechaAsistencia,
          estado: 'INASISTENCIA',
          registradoIngresoPor: userId
        }
      })

      // También crear/actualizar en tabla Asistencia para el histórico
      let asistenciaParaHistorico = await prisma.asistencia.findFirst({
        where: {
          idEstudiante: estudiante.idEstudiante,
          fecha: fechaAsistencia
        }
      })

      if (!asistenciaParaHistorico) {
        asistenciaParaHistorico = await prisma.asistencia.create({
          data: {
            idEstudiante: estudiante.idEstudiante,
            fecha: fechaAsistencia,
            idEstadoAsistencia: estadoInasistencia.idEstadoAsistencia,
            idHorarioClase: idHorarioClase ? parseInt(idHorarioClase) : null,
            registradoPor: userId,
            observaciones: 'Inasistencia marcada automáticamente por el sistema'
          }
        })
      }

      // Guardar en histórico
      await prisma.historicoEstadoAsistencia.create({
        data: {
          idAsistencia: asistenciaParaHistorico.idAsistencia,
          idEstadoAsistencia: estadoInasistencia.idEstadoAsistencia,
          cambiadoPor: userId,
          fechaCambio: new Date()
        }
      })

      marcados++
      estudiantesMarcados.push(`${estudiante.usuario?.nombre} ${estudiante.usuario?.apellido}`)
      
      console.log(`❌ Inasistencia marcada: ${estudiante.usuario?.nombre} ${estudiante.usuario?.apellido}`)
    }

    console.log(`✅ Proceso completado: ${marcados} inasistencias marcadas, ${yaRegistrados} ya tenían registro`)

    return NextResponse.json({
      success: true,
      message: `Inasistencias marcadas automáticamente`,
      marcados,
      yaRegistrados,
      total: estudiantes.length,
      estudiantesMarcados: estudiantesMarcados.slice(0, 10), // Solo mostrar primeros 10
      fecha: fechaAsistencia.toISOString().split('T')[0]
    })

  } catch (error) {
    console.error('Error marcando inasistencias:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

/**
 * GET - Verificar estudiantes sin asistencia para una fecha/clase
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const fecha = url.searchParams.get('fecha')
    const idGradoSeccion = url.searchParams.get('idGradoSeccion')
    
    // Obtener ieId del token
    const authHeader = request.headers.get('authorization')
    let ieId = 1
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, JWT_SECRET) as any
        ieId = decoded.ieId || 1
      } catch {
        // Continuar con valor por defecto
      }
    }

    if (!fecha) {
      return NextResponse.json({ error: 'Fecha es requerida' }, { status: 400 })
    }

    const fechaAsistencia = new Date(fecha)
    fechaAsistencia.setHours(0, 0, 0, 0)

    // Obtener estudiantes
    const whereEstudiantes: any = {
      usuario: {
        idIe: ieId,
        estado: 'ACTIVO'
      }
    }
    
    if (idGradoSeccion) {
      whereEstudiantes.idGradoSeccion = parseInt(idGradoSeccion)
    }

    const estudiantes = await prisma.estudiante.findMany({
      where: whereEstudiantes,
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

    // Verificar cuáles no tienen asistencia
    const sinAsistencia = []
    const conAsistencia = []

    for (const estudiante of estudiantes) {
      const asistencia = await prisma.asistenciaIE.findFirst({
        where: {
          idEstudiante: estudiante.idEstudiante,
          fecha: fechaAsistencia
        }
      })

      const info = {
        id: estudiante.idEstudiante,
        nombre: estudiante.usuario?.nombre || '',
        apellido: estudiante.usuario?.apellido || '',
        dni: estudiante.usuario?.dni || '',
        grado: estudiante.gradoSeccion?.grado?.nombre || '',
        seccion: estudiante.gradoSeccion?.seccion?.nombre || ''
      }

      if (asistencia) {
        conAsistencia.push({ ...info, estado: asistencia.estado })
      } else {
        sinAsistencia.push(info)
      }
    }

    return NextResponse.json({
      fecha: fechaAsistencia.toISOString().split('T')[0],
      total: estudiantes.length,
      sinAsistencia: sinAsistencia.length,
      conAsistencia: conAsistencia.length,
      estudiantesSinAsistencia: sinAsistencia,
      estudiantesConAsistencia: conAsistencia
    })

  } catch (error) {
    console.error('Error verificando asistencias:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
