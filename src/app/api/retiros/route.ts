import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { 
  notificarRetiroCreadoPorApoderado, 
  notificarRetiroCreadoPorDocente 
} from '@/lib/retiro-notifications'

// Función helper para construir observaciones con persona que recoge
function construirObservaciones(observaciones?: string, personaRecoge?: string, dniPersonaRecoge?: string): string | null {
  const partes: string[] = []
  
  if (observaciones?.trim()) {
    partes.push(observaciones.trim())
  }
  
  if (personaRecoge?.trim()) {
    let personaInfo = `Persona que recoge: ${personaRecoge.trim()}`
    if (dniPersonaRecoge?.trim()) {
      personaInfo += ` (DNI: ${dniPersonaRecoge.trim()})`
    }
    partes.push(personaInfo)
  }
  
  return partes.length > 0 ? partes.join(' | ') : null
}

// Función helper para extraer persona que recoge de observaciones
function extraerPersonaRecoge(observaciones?: string | null): { personaRecoge: string, dniPersonaRecoge: string } {
  if (!observaciones) return { personaRecoge: '', dniPersonaRecoge: '' }
  
  // Buscar patrón "Persona que recoge: Nombre (DNI: 12345678)"
  const matchConDNI = observaciones.match(/Persona que recoge:\s*([^(|]+?)(?:\s*\(DNI:\s*(\d+)\))?(?:\s*\||$)/)
  
  if (matchConDNI) {
    return {
      personaRecoge: matchConDNI[1]?.trim() || '',
      dniPersonaRecoge: matchConDNI[2]?.trim() || ''
    }
  }
  
  return { personaRecoge: '', dniPersonaRecoge: '' }
}

// Función para actualizar la asistencia cuando se crea un retiro
async function actualizarAsistenciaPorRetiro(tx: any, params: {
  estudianteId: number
  ieId: number
  fecha: Date
  horaRetiro: Date
  userId: number | null
}) {
  const { estudianteId, ieId, fecha, horaRetiro, userId } = params
  
  console.log('🔄 Actualizando asistencia por retiro:', { estudianteId, ieId, fecha: fecha.toISOString().split('T')[0] })
  
  // Determinar el estado de asistencia basado en la hora del retiro
  const horaRetiroHours = horaRetiro.getHours()
  const horaRetiroMinutes = horaRetiro.getMinutes()
  const totalMinutos = horaRetiroHours * 60 + horaRetiroMinutes
  
  // Lógica para determinar el estado:
  // - Si se retira antes de las 10:00 AM (600 minutos): TARDANZA (amarillo)
  // - Si se retira después de las 10:00 AM: PRESENTE (verde) - asistió parte del día
  // - Si se retira muy temprano (antes de las 8:30 AM): INASISTENCIA (rojo)
  let codigoEstado: string
  let observacionesAsistencia: string
  
  if (totalMinutos < 510) { // Antes de 8:30 AM
    codigoEstado = 'INASISTENCIA'
    observacionesAsistencia = `Retiro muy temprano (${horaRetiro.toTimeString().slice(0, 5)}) - No asistió`
  } else if (totalMinutos < 600) { // Entre 8:30 AM y 10:00 AM
    codigoEstado = 'TARDANZA'
    observacionesAsistencia = `Retiro temprano (${horaRetiro.toTimeString().slice(0, 5)}) - Asistencia parcial`
  } else { // Después de 10:00 AM
    codigoEstado = 'PRESENTE'
    observacionesAsistencia = `Retiro autorizado (${horaRetiro.toTimeString().slice(0, 5)}) - Asistió parcialmente`
  }
  
  console.log(`📊 Estado determinado: ${codigoEstado} - ${observacionesAsistencia}`)
  
  // Buscar o crear el estado de asistencia
  let estadoAsistencia = await tx.estadoAsistencia.findFirst({
    where: { codigo: codigoEstado }
  })
  
  if (!estadoAsistencia) {
    // Crear estados básicos si no existen
    const estadosBasicos = [
      { codigo: 'PRESENTE', nombreEstado: 'Presente', requiereJustificacion: false, afectaAsistencia: true },
      { codigo: 'TARDANZA', nombreEstado: 'Tardanza', requiereJustificacion: false, afectaAsistencia: true },
      { codigo: 'INASISTENCIA', nombreEstado: 'Inasistencia', requiereJustificacion: true, afectaAsistencia: true }
    ]
    
    for (const estado of estadosBasicos) {
      await tx.estadoAsistencia.upsert({
        where: { codigo: estado.codigo },
        update: {},
        create: estado
      })
    }
    
    estadoAsistencia = await tx.estadoAsistencia.findFirst({
      where: { codigo: codigoEstado }
    })
  }
  
  // Buscar asistencia existente para ese día
  const fechaSoloFecha = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
  
  const asistenciaExistente = await tx.asistencia.findFirst({
    where: {
      idEstudiante: estudianteId,
      fecha: fechaSoloFecha
    }
  })
  
  if (asistenciaExistente) {
    // Actualizar asistencia existente
    await tx.asistencia.update({
      where: { idAsistencia: asistenciaExistente.idAsistencia },
      data: {
        idEstadoAsistencia: estadoAsistencia?.idEstadoAsistencia,
        observaciones: observacionesAsistencia,
        registradoPor: userId
      }
    })
    
    console.log('✅ Asistencia existente actualizada por retiro')
  } else {
    // Crear nueva asistencia
    await tx.asistencia.create({
      data: {
        idEstudiante: estudianteId,
        fecha: fechaSoloFecha,
        idEstadoAsistencia: estadoAsistencia?.idEstadoAsistencia,
        observaciones: observacionesAsistencia,
        registradoPor: userId
      }
    })
    
    console.log('✅ Nueva asistencia creada por retiro')
  }
}


export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/retiros - Iniciando consulta de retiros')
    
    // Obtener ieId del token de usuario
    const authHeader = request.headers.get('authorization')
    let ieId = 1 // Default
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
        ieId = decoded.ieId || 1
        console.log('✅ Token decodificado, ieId:', ieId)
      } catch (error) {
        console.log('⚠️ Error decoding token, using default ieId:', ieId)
      }
    } else {
      console.log('⚠️ No auth header, using default ieId:', ieId)
    }

    const url = new URL(request.url)
    const fecha = url.searchParams.get('fecha')
    const grado = url.searchParams.get('grado')
    const estado = url.searchParams.get('estado')
    const search = url.searchParams.get('search')

    console.log('📋 Parámetros de consulta:', { fecha, grado, estado, search })

    const whereClause: any = {
      idIe: ieId
    }

    // Solo aplicar filtro de fecha si se especifica explícitamente
    if (fecha && fecha !== new Date().toISOString().split('T')[0]) {
      const fechaDate = new Date(fecha)
      whereClause.fecha = {
        gte: new Date(fechaDate.setHours(0, 0, 0, 0)),
        lt: new Date(fechaDate.setHours(23, 59, 59, 999))
      }
      console.log('📅 Filtro por fecha aplicado:', whereClause.fecha)
    } else {
      console.log('📅 Sin filtro de fecha - mostrando todos los retiros')
    }

    // Solo aplicar filtro de estado si no es TODOS
    if (estado && estado !== 'TODOS') {
      whereClause.estadoRetiro = {
        codigo: estado
      }
      console.log('🏷️ Filtro por estado aplicado:', estado)
    } else {
      console.log('🏷️ Sin filtro de estado - mostrando todos los estados')
    }

    console.log('🔍 Cláusula WHERE final:', JSON.stringify(whereClause, null, 2))

    // Primero verificar si hay retiros en la BD para esta IE
    const totalRetiros = await prisma.retiro.count({
      where: { idIe: ieId }
    })
    console.log(`📊 Total de retiros en BD para IE ${ieId}: ${totalRetiros}`)

    // Si no hay retiros, verificar todas las IEs
    if (totalRetiros === 0) {
      const totalTodasIEs = await prisma.retiro.count()
      console.log(`📊 Total de retiros en toda la BD: ${totalTodasIEs}`)
    }

    const retiros = await prisma.retiro.findMany({
      where: whereClause,
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
        estadoRetiro: true,
        tipoRetiro: true,
        apoderadoRetira: {
          include: {
            usuario: true
          }
        },
        usuarioVerificador: {
          select: {
            nombre: true,
            apellido: true
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    })

    console.log(`📊 Retiros encontrados en BD: ${retiros.length}`)

    // Filtrar por grado y búsqueda si se especifican
    const filteredRetiros = retiros.filter(retiro => {
      const gradoMatch = !grado || retiro.estudiante.gradoSeccion?.grado?.nombre === grado
      const searchMatch = !search || 
        `${retiro.estudiante.usuario.nombre} ${retiro.estudiante.usuario.apellido}`
          .toLowerCase().includes(search.toLowerCase()) ||
        retiro.estudiante.usuario.dni.includes(search) ||
        (retiro.tipoRetiro?.nombre || '').toLowerCase().includes(search.toLowerCase())
      
      return gradoMatch && searchMatch
    })

    console.log(`🔍 Retiros después de filtros: ${filteredRetiros.length}`)

    const transformedRetiros = filteredRetiros.map(retiro => {
      // Obtener persona que recoge desde múltiples fuentes
      let personaRecoge = ''
      let dniPersonaRecoge = retiro.dniVerificado || ''
      
      // 1. Primero intentar desde la relación apoderadoRetira
      if (retiro.apoderadoRetira?.usuario) {
        personaRecoge = `${retiro.apoderadoRetira.usuario.nombre || ''} ${retiro.apoderadoRetira.usuario.apellido || ''}`.trim()
        // Si el apoderado tiene DNI, usarlo
        if (retiro.apoderadoRetira.usuario.dni) {
          dniPersonaRecoge = dniPersonaRecoge || retiro.apoderadoRetira.usuario.dni
        }
      }
      
      // 2. Si no hay apoderado, extraer de observaciones
      if (!personaRecoge) {
        const extraido = extraerPersonaRecoge(retiro.observaciones)
        personaRecoge = extraido.personaRecoge
        dniPersonaRecoge = dniPersonaRecoge || extraido.dniPersonaRecoge
      }
      
      // Limpiar observaciones para no mostrar la parte de "Persona que recoge"
      let observacionesLimpias = retiro.observaciones || ''
      observacionesLimpias = observacionesLimpias.replace(/\s*\|\s*Persona que recoge:[^|]*/g, '').trim()
      observacionesLimpias = observacionesLimpias.replace(/^Persona que recoge:[^|]*\s*\|?\s*/g, '').trim()

      return {
        id: retiro.idRetiro.toString(),
        fecha: retiro.fecha.toISOString(),
        horaRetiro: retiro.hora.toTimeString().slice(0, 5),
        motivo: retiro.tipoRetiro?.nombre || 'Retiro',
        observaciones: observacionesLimpias,
        personaRecoge: personaRecoge,
        dniPersonaRecoge: dniPersonaRecoge,
        estado: retiro.estadoRetiro?.nombre || 'PENDIENTE',
        autorizado: retiro.estadoRetiro?.codigo === 'AUTORIZADO',
        fechaAutorizacion: retiro.updatedAt?.toISOString() || '',
        observacionesAutorizacion: retiro.observaciones || '',
        estudiante: {
          id: retiro.estudiante.idEstudiante.toString(),
          nombre: retiro.estudiante.usuario.nombre,
          apellido: retiro.estudiante.usuario.apellido,
          dni: retiro.estudiante.usuario.dni,
          grado: retiro.estudiante.gradoSeccion?.grado?.nombre || '',
          seccion: retiro.estudiante.gradoSeccion?.seccion?.nombre || ''
        },
        autorizadoPor: retiro.usuarioVerificador ? {
          nombre: retiro.usuarioVerificador.nombre,
          apellido: retiro.usuarioVerificador.apellido
        } : null
      }
    })

    console.log(`✅ Enviando ${transformedRetiros.length} retiros al frontend`)

    return NextResponse.json({
      data: transformedRetiros,
      total: transformedRetiros.length
    })

  } catch (error) {
    console.error('Error fetching retiros:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📝 POST /api/retiros - Creando nuevo retiro')
    
    // Obtener ieId y userId del token de usuario
    const authHeader = request.headers.get('authorization')
    let ieId = 1 // Default
    let userId = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
        ieId = decoded.ieId || 1
        userId = decoded.userId
        console.log('✅ Token decodificado, ieId:', ieId, 'userId:', userId)
      } catch (error) {
        console.log('⚠️ Error decoding token, using defaults')
      }
    }
    
    const body = await request.json()
    const {
      estudianteId,
      idGradoSeccion,
      fecha,
      motivo,
      horaRetiro,
      observaciones,
      personaRecoge,
      dniPersonaRecoge,
      origen,
      medioContacto,
      apoderadoContactado,
      apoderadoQueRetira,
      horaContacto,
      verificadoPor,
      esAdministrativo = false // Nuevo campo para identificar si viene del panel admin
    } = body
    
    console.log('📋 Datos del retiro recibidos:', {
      estudianteId, 
      idGradoSeccion, 
      fecha, 
      motivo, 
      horaRetiro,
      personaRecoge: personaRecoge || '(no enviado)',
      dniPersonaRecoge: dniPersonaRecoge || '(no enviado)',
      observaciones: observaciones || '(no enviado)',
      origen, 
      medioContacto, 
      apoderadoContactado, 
      apoderadoQueRetira,
      horaContacto,
      verificadoPor, 
      esAdministrativo
    })

    // Buscar o crear tipo de retiro
    let tipoRetiro = await prisma.tipoRetiro.findFirst({
      where: { nombre: motivo }
    })

    if (!tipoRetiro) {
      tipoRetiro = await prisma.tipoRetiro.create({
        data: { nombre: motivo }
      })
    }

    // TODOS los retiros se crean como PENDIENTE
    // Solo el apoderado puede autorizarlos
    const codigoEstado = 'PENDIENTE'
    let estadoRetiro = await prisma.estadoRetiro.findFirst({
      where: { codigo: codigoEstado }
    })

    if (!estadoRetiro) {
      estadoRetiro = await prisma.estadoRetiro.create({
        data: { 
          codigo: 'PENDIENTE',
          nombre: 'Pendiente',
          orden: 1
        }
      })
    }
    
    console.log(`🏷️ Estado del retiro: ${estadoRetiro.nombre} (${estadoRetiro.codigo})`)

    // Validar y parsear fecha
    const fechaRetiro = fecha ? new Date(fecha) : new Date()
    if (isNaN(fechaRetiro.getTime())) {
      return NextResponse.json(
        { error: 'Fecha inválida proporcionada' },
        { status: 400 }
      )
    }

    // Validar y parsear hora
    if (!horaRetiro || !/^\d{2}:\d{2}$/.test(horaRetiro)) {
      return NextResponse.json(
        { error: 'Hora inválida. Formato requerido: HH:MM' },
        { status: 400 }
      )
    }

    const [horas, minutos] = horaRetiro.split(':').map(Number)
    const horaRetiroDate = new Date()
    horaRetiroDate.setHours(horas, minutos, 0, 0)

    // Obtener el grado-sección del estudiante si no se proporciona
    let gradoSeccionId = idGradoSeccion ? parseInt(idGradoSeccion) : null
    
    if (!gradoSeccionId) {
      const estudiante = await prisma.estudiante.findUnique({
        where: { idEstudiante: parseInt(estudianteId) },
        include: { gradoSeccion: true }
      })
      
      if (estudiante?.gradoSeccion) {
        gradoSeccionId = estudiante.gradoSeccion.idGradoSeccion
        console.log(`🎯 Grado-sección obtenido del estudiante: ${gradoSeccionId}`)
      }
    }
    
    // Preparar hora de contacto
    // Si se proporciona medioContacto pero no horaContacto, usar hora actual
    let horaContactoDate: Date | null = null
    if (horaContacto) {
      horaContactoDate = new Date(horaContacto)
      if (isNaN(horaContactoDate.getTime())) {
        horaContactoDate = new Date() // Usar hora actual si es inválida
      }
    } else if (medioContacto) {
      // Si hay medio de contacto pero no hora, usar hora actual
      horaContactoDate = new Date()
    }
    
    // Usar transacción para crear retiro y actualizar asistencia
    const resultado = await prisma.$transaction(async (tx) => {
      // Crear el retiro
      const nuevoRetiro = await tx.retiro.create({
        data: {
          idEstudiante: parseInt(estudianteId),
          idIe: ieId,
          idGradoSeccion: gradoSeccionId,
          fecha: fechaRetiro,
          hora: horaRetiroDate,
          idTipoRetiro: tipoRetiro.idTipoRetiro,
          origen: origen || (esAdministrativo ? 'PANEL_ADMINISTRATIVO' : 'SOLICITUD_APODERADO'),
          apoderadoContactado: apoderadoContactado ? parseInt(apoderadoContactado) : null,
          horaContacto: horaContactoDate,
          medioContacto: medioContacto || (esAdministrativo ? 'PRESENCIAL' : null),
          apoderadoQueRetira: apoderadoQueRetira ? parseInt(apoderadoQueRetira) : null,
          dniVerificado: dniPersonaRecoge || null,
          verificadoPor: verificadoPor ? parseInt(verificadoPor) : (esAdministrativo && userId ? userId : null),
          idEstadoRetiro: estadoRetiro.idEstadoRetiro,
          observaciones: observaciones || null // Solo observaciones, sin concatenar persona
        }
      })
      
      console.log(`✅ Retiro creado exitosamente:`, {
        id: nuevoRetiro.idRetiro,
        apoderadoQueRetira: nuevoRetiro.apoderadoQueRetira,
        dniVerificado: nuevoRetiro.dniVerificado,
        observaciones: nuevoRetiro.observaciones,
        medioContacto: nuevoRetiro.medioContacto,
        horaContacto: nuevoRetiro.horaContacto,
        verificadoPor: nuevoRetiro.verificadoPor
      })
      
      // Actualizar o crear asistencia del estudiante para ese día
      await actualizarAsistenciaPorRetiro(tx, {
        estudianteId: parseInt(estudianteId),
        ieId: ieId,
        fecha: fechaRetiro,
        horaRetiro: horaRetiroDate,
        userId: userId
      })
      
      return nuevoRetiro
    })
    
    console.log(`✅ Retiro y asistencia procesados exitosamente`)

    // Obtener información del estudiante para notificaciones
    const estudianteInfo = await prisma.estudiante.findUnique({
      where: { idEstudiante: parseInt(estudianteId) },
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

    // Obtener información del creador
    let creadorInfo = null
    let creadorRol = 'DESCONOCIDO'
    if (userId) {
      const creador = await prisma.usuario.findUnique({
        where: { idUsuario: userId },
        include: {
          roles: {
            include: { rol: true }
          }
        }
      })
      if (creador) {
        creadorInfo = {
          id: creador.idUsuario,
          nombre: creador.nombre || '',
          apellido: creador.apellido || '',
          rol: creador.roles[0]?.rol?.nombre || 'USUARIO',
          email: creador.email || undefined
        }
        creadorRol = creador.roles[0]?.rol?.nombre || 'USUARIO'
      }
    }

    // Enviar notificaciones según quién creó el retiro
    if (estudianteInfo && creadorInfo) {
      const notificationData = {
        retiroId: resultado.idRetiro,
        estudianteNombre: estudianteInfo.usuario.nombre || '',
        estudianteApellido: estudianteInfo.usuario.apellido || '',
        estudianteDNI: estudianteInfo.usuario.dni,
        grado: estudianteInfo.gradoSeccion?.grado?.nombre || '',
        seccion: estudianteInfo.gradoSeccion?.seccion?.nombre || '',
        fecha: fechaRetiro.toISOString(),
        horaRetiro: horaRetiro,
        motivo: motivo,
        observaciones: observaciones,
        personaRecoge: personaRecoge,
        ieId: ieId
      }

      // Flujo de aprobación cruzada
      if (creadorRol === 'APODERADO') {
        // Si crea el apoderado -> notificar a docentes y admin
        console.log('📧 Notificando retiro creado por APODERADO...')
        await notificarRetiroCreadoPorApoderado(notificationData, creadorInfo)
      } else if (creadorRol === 'DOCENTE' || creadorRol === 'AUXILIAR') {
        // Si crea el docente -> notificar a apoderados y admin
        console.log('📧 Notificando retiro creado por DOCENTE/AUXILIAR...')
        await notificarRetiroCreadoPorDocente(notificationData, creadorInfo)
      }
    }

    const mensaje = esAdministrativo 
      ? 'Retiro aprobado y asistencia actualizada exitosamente'
      : 'Retiro solicitado y asistencia actualizada exitosamente'
    
    return NextResponse.json({
      success: true,
      message: mensaje,
      data: {
        id: resultado.idRetiro,
        estado: estadoRetiro.nombre,
        codigo: estadoRetiro.codigo
      }
    })

  } catch (error) {
    console.error('Error creating retiro:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
