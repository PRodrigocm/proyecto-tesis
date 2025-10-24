import { NextRequest, NextResponse } from 'next/server'
import { prisma, withPrismaConnection } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

// Sistema de control de concurrencia optimizado
const processingQueue = new Map<string, Promise<any>>()
const requestCache = new Map<string, { timestamp: number, data: any }>()
const CACHE_DURATION = 5000 // 5 segundos

function getLockKey(estudianteId: number, fecha: string): string {
  return `${estudianteId}-${fecha}`
}

function getCacheKey(userId: number, estudianteId: number, fecha: string): string {
  return `${userId}-${estudianteId}-${fecha}`
}

function getFromCache(key: string): any | null {
  const cached = requestCache.get(key)
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.data
  }
  requestCache.delete(key)
  return null
}

function setCache(key: string, data: any): void {
  requestCache.set(key, { timestamp: Date.now(), data })
  
  // Limpiar cache antiguo
  if (requestCache.size > 100) {
    const oldestKeys = Array.from(requestCache.entries())
      .sort(([,a], [,b]) => a.timestamp - b.timestamp)
      .slice(0, 50)
      .map(([key]) => key)
    
    oldestKeys.forEach(key => requestCache.delete(key))
  }
}

// Control de concurrencia
async function processWithConcurrencyControl<T>(
  lockKey: string, 
  operation: () => Promise<T>
): Promise<T> {
  if (processingQueue.has(lockKey)) {
    console.log(`⏳ Esperando: ${lockKey}`)
    return await processingQueue.get(lockKey)!
  }

  const processingPromise = operation()
  processingQueue.set(lockKey, processingPromise)

  try {
    return await processingPromise
  } finally {
    processingQueue.delete(lockKey)
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando procesamiento de asistencias QR')

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
    
    // Buscar usuario con reintentos
    const userInfo = await withPrismaConnection(() => 
      prisma.usuario.findUnique({
        where: { idUsuario: userId },
        include: { ie: true }
      })
    )

    if (!userInfo || !['DOCENTE', 'ADMINISTRATIVO'].includes(decoded.rol)) {
      return NextResponse.json({ error: 'Sin permisos de docente' }, { status: 403 })
    }

    const body = await request.json()
    const { asistencias } = body

    console.log(`📋 Procesando ${asistencias?.length || 0} asistencias`)

    if (!asistencias || !Array.isArray(asistencias) || asistencias.length === 0) {
      return NextResponse.json({ error: 'No se proporcionaron asistencias válidas' }, { status: 400 })
    }

    const fechaHoy = new Date()
    const resultados = []

    for (const asistencia of asistencias) {
      const { estudianteId, estado, horaLlegada, fecha, claseId, sesion } = asistencia
      
      // La fuente será la clase específica donde se registra
      let fuenteRegistro = claseId || 'ESCANEO_QR'
      
      // Determinar sesión automáticamente si no se proporciona
      const horaActual = fechaHoy.getHours()
      const sesionCalculada = sesion || (horaActual < 12 ? 'AM' : 'PM')
      
      console.log('🔍 Procesando asistencia:', {
        estudianteId,
        estado,
        horaLlegada,
        fecha,
        sesion: sesionCalculada,
        claseId,
        fuenteRegistro,
        horaActual,
        tipos: {
          estudianteId: typeof estudianteId,
          estado: typeof estado,
          fecha: typeof fecha,
          sesion: typeof sesionCalculada
        }
      })

      if (!estudianteId || !estado || !fecha) {
        console.log('⚠️ Asistencia incompleta:', asistencia)
        continue
      }

      try {
        // Control de concurrencia por estudiante-fecha-sesión
        const lockKey = `${getLockKey(parseInt(estudianteId), fecha)}-${sesionCalculada}`
        const cacheKey = `${getCacheKey(userInfo.idUsuario, parseInt(estudianteId), fecha)}-${sesionCalculada}`
        
        // Verificar cache primero
        const cachedResult = getFromCache(cacheKey)
        if (cachedResult) {
          console.log(`✅ Cache hit: ${estudianteId} - Sesión: ${sesionCalculada}`)
          resultados.push(cachedResult)
          continue
        }

        // Procesar con control de concurrencia
        const resultado = await processWithConcurrencyControl(lockKey, async () => {
          console.log(`🔄 Procesando: ${estudianteId} - Sesión: ${sesionCalculada}`)
          return await procesarAsistenciaEstudiante(
            estudianteId, 
            estado, 
            horaLlegada, 
            fecha, 
            fuenteRegistro, 
            userInfo, 
            fechaHoy, 
            sesionCalculada // ✅ Pasar sesión calculada
          )
        })

        resultados.push(resultado)
        setCache(cacheKey, resultado)

      } catch (error) {
        console.error(`❌ Error procesando estudiante ${estudianteId}:`, error)
        // Agregar información del error al resultado
        resultados.push({
          estudiante: { id: estudianteId, error: true },
          estado: 'error',
          mensaje: error instanceof Error ? error.message : 'Error desconocido',
          sesion: sesionCalculada,
          ignorado: true,
          razon: 'ERROR_PROCESAMIENTO'
        })
      }
    }

    console.log(`✅ Completado: ${resultados.length} asistencias`)
    return NextResponse.json({
      success: true,
      message: `${resultados.length} asistencias guardadas correctamente`,
      resultados,
      timestamp: fechaHoy.toISOString()
    })

  } catch (error) {
    console.error('❌ Error general:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

// Función separada para procesar cada asistencia con validación de duplicados
async function procesarAsistenciaEstudiante(
  estudianteId: string,
  estado: string,
  horaLlegada: string,
  fecha: string,
  fuenteRegistro: string,
  userInfo: any,
  fechaHoy: Date,
  sesion: string = 'AM' // Parámetro de sesión con valor por defecto
) {
  console.log(`🔍 Procesando asistencia - Estudiante: ${estudianteId}, Sesión: ${sesion}, Fecha: ${fecha}`)

  // 1. BUSCAR EL ESTUDIANTE
  const estudiante = await withPrismaConnection(() => 
    prisma.estudiante.findFirst({
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
  )

  if (!estudiante) {
    throw new Error(`Estudiante ${estudianteId} no encontrado`)
  }

  // 2. PREPARAR FECHA SIN HORA (solo día/mes/año)
  const fechaAsistencia = new Date(fecha)
  fechaAsistencia.setHours(0, 0, 0, 0)
  
  console.log(`📅 Fecha de asistencia normalizada: ${fechaAsistencia.toISOString().split('T')[0]}`)

  // 3. VERIFICAR DUPLICADOS POR FECHA Y SESIÓN (usando constraint único)
  const asistenciaExistente = await withPrismaConnection(() =>
    prisma.asistencia.findFirst({
      where: {
        idEstudiante: estudiante.idEstudiante,
        fecha: fechaAsistencia,
        sesion: sesion // ✅ Validación por sesión específica
      },
      include: {
        estadoAsistencia: true
      }
    })
  )

  // 4. SI YA EXISTE ASISTENCIA EN ESTA FECHA Y SESIÓN
  if (asistenciaExistente) {
    const estadoActual = asistenciaExistente.estadoAsistencia
    
    console.log(`⚠️ Asistencia duplicada detectada:`, {
      estudianteId: estudiante.idEstudiante,
      fecha: fechaAsistencia.toISOString().split('T')[0],
      sesion: sesion,
      estadoActual: estadoActual?.codigo || 'SIN_ESTADO'
    })

    // Si ya tiene un estado procesado (no pendiente), ignorar
    if (estadoActual && estadoActual.codigo !== 'PENDIENTE') {
      return {
        estudiante: {
          id: estudiante.idEstudiante,
          nombre: estudiante.usuario.nombre,
          apellido: estudiante.usuario.apellido,
          dni: estudiante.usuario.dni
        },
        estado: estadoActual.codigo.toLowerCase(),
        mensaje: `✅ Ya registró asistencia hoy en la sesión ${sesion} como ${estadoActual.nombreEstado}`,
        sesion: sesion,
        fechaRegistro: fechaAsistencia.toISOString().split('T')[0],
        ignorado: true,
        razon: 'DUPLICADO_FECHA_SESION'
      }
    }
  }

  // Buscar o crear estado de asistencia
  let estadoAsistencia = await withPrismaConnection(() =>
    prisma.estadoAsistencia.findFirst({
      where: { codigo: estado.toUpperCase() }
    })
  )

  if (!estadoAsistencia) {
    estadoAsistencia = await withPrismaConnection(() =>
      prisma.estadoAsistencia.create({
        data: {
          codigo: estado.toUpperCase(),
          nombreEstado: estado.charAt(0).toUpperCase() + estado.slice(1),
          activo: true,
          afectaAsistencia: true,
          requiereJustificacion: estado.toUpperCase() === 'AUSENTE'
        }
      })
    )
  }

  // 5. DETERMINAR SESIÓN AUTOMÁTICAMENTE BASADA EN LA HORA
  const horaActual = fechaHoy.getHours()
  const sesionAutomatica = horaActual < 12 ? 'AM' : 'PM'
  const sesionFinal = sesion || sesionAutomatica
  
  console.log(`⏰ Determinando sesión: Hora actual ${horaActual}:xx → Sesión: ${sesionFinal}`)

  // 6. BUSCAR O CREAR ESTADO DE ASISTENCIA
  console.log(`🔍 Buscando estado de asistencia para: ${estado.toUpperCase()}`)

  // 7. CREAR NUEVA ASISTENCIA (no existe duplicado)
  const asistenciaGuardada = await withPrismaConnection(() => 
    prisma.$transaction(async (tx) => {
      if (asistenciaExistente && asistenciaExistente.estadoAsistencia?.codigo === 'PENDIENTE') {
        // Actualizar asistencia pendiente existente
        console.log(`🔄 Actualizando asistencia pendiente existente`)
        return await tx.asistencia.update({
          where: { idAsistencia: asistenciaExistente.idAsistencia },
          data: {
            horaEntrada: horaLlegada ? new Date(`${fecha}T${horaLlegada}:00`) : fechaHoy,
            sesion: sesionFinal,
            idEstadoAsistencia: estadoAsistencia.idEstadoAsistencia,
            fuente: fuenteRegistro,
            observaciones: `Actualizado por QR - ${estado.toUpperCase()} - Sesión: ${sesionFinal}`,
            registradoPor: userInfo.idUsuario,
            updatedAt: fechaHoy
          }
        })
      } else {
        // Crear nueva asistencia
        console.log(`➕ Creando nueva asistencia para sesión: ${sesionFinal}`)
        return await tx.asistencia.create({
          data: {
            idEstudiante: estudiante.idEstudiante,
            idIe: userInfo.idIe,
            fecha: fechaAsistencia,
            horaEntrada: horaLlegada ? new Date(`${fecha}T${horaLlegada}:00`) : fechaHoy,
            sesion: sesionFinal, // ✅ Usar sesión determinada
            idEstadoAsistencia: estadoAsistencia.idEstadoAsistencia,
            fuente: fuenteRegistro,
            observaciones: `Registrado por QR - ${estado.toUpperCase()} - Sesión: ${sesionFinal}`,
            registradoPor: userInfo.idUsuario
          }
        })
      }
    })
  )

  console.log(`✅ Asistencia guardada exitosamente:`, {
    idAsistencia: asistenciaGuardada.idAsistencia,
    estudiante: `${estudiante.usuario.nombre} ${estudiante.usuario.apellido}`,
    sesion: sesionFinal,
    fecha: fechaAsistencia.toISOString().split('T')[0],
    estado: estado
  })

  return {
    estudiante: {
      id: estudiante.idEstudiante,
      nombre: estudiante.usuario.nombre,
      apellido: estudiante.usuario.apellido,
      dni: estudiante.usuario.dni
    },
    estado: estado,
    accion: asistenciaExistente ? 'actualizada' : 'creada',
    asistenciaId: asistenciaGuardada.idAsistencia
  }
}
