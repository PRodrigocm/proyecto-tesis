import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

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
    const whereClause: any = {
      idIe: ieId
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
      }
    })

    // Fecha para buscar asistencias
    const fechaInicio = new Date(fecha)
    fechaInicio.setHours(0, 0, 0, 0)
    const fechaFin = new Date(fecha)
    fechaFin.setHours(23, 59, 59, 999)

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

      if (asistencia) {
        estado = asistencia.estadoAsistencia?.codigo || asistencia.estadoAsistencia?.nombreEstado || 'PRESENTE'
        if (asistencia.horaRegistro) {
          horaEntrada = new Date(asistencia.horaRegistro).toLocaleTimeString('es-PE', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          })
        }
      }

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
