import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

// Función para normalizar estados de asistencia a valores estándar
function normalizeEstado(estado: string): string {
  const estadoUpper = estado?.toUpperCase()?.trim() || 'SIN_REGISTRAR'
  
  // Mapeo de estados posibles a estados estándar
  const estadoMap: Record<string, string> = {
    // Presente
    'PRESENTE': 'PRESENTE',
    'INGRESADO': 'PRESENTE',
    'P': 'PRESENTE',
    // Tardanza
    'TARDANZA': 'TARDANZA',
    'TARDE': 'TARDANZA',
    'T': 'TARDANZA',
    // Ausente
    'AUSENTE': 'AUSENTE',
    'INASISTENCIA': 'AUSENTE',
    'FALTA': 'AUSENTE',
    'A': 'AUSENTE',
    'F': 'AUSENTE',
    // Retirado
    'RETIRADO': 'RETIRADO',
    'RETIRO': 'RETIRADO',
    'R': 'RETIRADO',
    // Justificado
    'JUSTIFICADO': 'JUSTIFICADO',
    'JUSTIFICADA': 'JUSTIFICADO',
    'J': 'JUSTIFICADO',
    // Sin registrar
    'SIN_REGISTRAR': 'SIN_REGISTRAR',
    'PENDIENTE': 'SIN_REGISTRAR',
    '': 'SIN_REGISTRAR'
  }
  
  return estadoMap[estadoUpper] || estadoUpper
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const fecha = url.searchParams.get('fecha') || new Date().toISOString().split('T')[0]
    const gradoId = url.searchParams.get('grado')
    const seccionId = url.searchParams.get('seccion')

    // Obtener ieId del token
    let ieId = 1
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
        ieId = decoded.ieId || 1
      } catch {
        console.log('Token inválido, usando ieId por defecto')
      }
    }

    // Construir filtro de estudiantes
    // Buscar por idIe del estudiante O por idIe del usuario asociado
    const whereClause: any = {
      OR: [
        { idIe: ieId },
        { usuario: { idIe: ieId } }
      ],
      usuario: {
        estado: 'ACTIVO'
      }
    }

    if (gradoId) {
      whereClause.gradoSeccion = {
        idGrado: parseInt(gradoId)
      }
    }

    if (seccionId) {
      whereClause.gradoSeccion = {
        ...whereClause.gradoSeccion,
        idSeccion: parseInt(seccionId)
      }
    }

    // Obtener estudiantes con su información
    const estudiantes = await prisma.estudiante.findMany({
      where: whereClause,
      include: {
        usuario: true,
        gradoSeccion: {
          include: {
            grado: true,
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
    
    console.log(`📊 Asistencia: Encontrados ${estudiantes.length} estudiantes para IE ${ieId}, fecha ${fecha}`)

    // Fecha para buscar asistencias
    // Parsear la fecha correctamente para evitar problemas de zona horaria
    // fecha viene como "YYYY-MM-DD", la parseamos manualmente
    const [anio, mes, dia] = fecha.split('-').map(Number)
    const fechaInicio = new Date(anio, mes - 1, dia, 0, 0, 0, 0)
    const fechaFin = new Date(anio, mes - 1, dia, 23, 59, 59, 999)

    // Obtener asistencias del día para estos estudiantes
    const estudianteIds = estudiantes.map(e => e.idEstudiante)
    
    const asistencias = await prisma.asistencia.findMany({
      where: {
        idEstudiante: { in: estudianteIds },
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      include: {
        estadoAsistencia: true
      }
    })

    // Obtener asistencias de aula (AsistenciaIE) del día
    const asistenciasIE = await prisma.asistenciaIE.findMany({
      where: {
        idEstudiante: { in: estudianteIds },
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        }
      }
    })

    // Crear mapa de asistencias por estudiante
    const asistenciaMap = new Map()
    asistencias.forEach(a => {
      asistenciaMap.set(a.idEstudiante, a)
    })

    // Crear mapa de asistencias IE por estudiante
    const asistenciaIEMap = new Map()
    asistenciasIE.forEach(a => {
      asistenciaIEMap.set(a.idEstudiante, a)
    })

    // Formatear respuesta
    const estudiantesFormateados = estudiantes.map(est => {
      const asistencia = asistenciaMap.get(est.idEstudiante)
      const asistenciaIE = asistenciaIEMap.get(est.idEstudiante)
      
      let estado: string = 'SIN_REGISTRAR'
      let horaEntrada: string | null = null
      let horaSalida: string | null = null

      // PRIMERO: Verificar asistencia en aula (Asistencia) - tiene prioridad
      if (asistencia) {
        // Normalizar el código del estado
        const codigoRaw = asistencia.estadoAsistencia?.codigo || asistencia.estadoAsistencia?.nombreEstado || 'PRESENTE'
        estado = normalizeEstado(codigoRaw)
        if (asistencia.horaRegistro) {
          horaEntrada = new Date(asistencia.horaRegistro).toLocaleTimeString('es-PE', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          })
        }
      }
      // SEGUNDO: Si no hay asistencia de aula, verificar asistencia IE (ingreso a institución)
      else if (asistenciaIE) {
        // Si tiene asistencia IE pero no de aula, mostrar el estado de IE
        const estadoIE = asistenciaIE.estado
        estado = normalizeEstado(estadoIE || 'PRESENTE')
      }
      // Si no hay ninguna asistencia, queda como SIN_REGISTRAR

      // Verificar asistencia al aula (AsistenciaIE)
      const asistenciaAula = asistenciaIE ? true : false
      if (asistenciaIE?.horaIngreso) {
        horaEntrada = new Date(asistenciaIE.horaIngreso).toLocaleTimeString('es-PE', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        })
      }
      if (asistenciaIE?.horaSalida) {
        horaSalida = new Date(asistenciaIE.horaSalida).toLocaleTimeString('es-PE', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        })
      }

      return {
        id: est.idEstudiante.toString(),
        idEstudiante: est.idEstudiante,
        nombre: est.usuario?.nombre || '',
        apellido: est.usuario?.apellido || '',
        dni: est.usuario?.dni || '',
        grado: est.gradoSeccion?.grado?.nombre || '',
        seccion: est.gradoSeccion?.seccion?.nombre || '',
        aula: `${est.gradoSeccion?.grado?.nombre || ''} ${est.gradoSeccion?.seccion?.nombre || ''}`.trim(),
        nivel: est.gradoSeccion?.grado?.nombre || '',
        codigoQR: est.codigoQR,
        estado: estado,
        horaEntrada: horaEntrada,
        horaSalida: horaSalida,
        asistenciaAula: asistenciaAula
      }
    })

    return NextResponse.json({
      estudiantes: estudiantesFormateados,
      total: estudiantesFormateados.length,
      fecha: fecha
    })

  } catch (error) {
    console.error('Error fetching estudiantes asistencia:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: String(error) },
      { status: 500 }
    )
  }
}
