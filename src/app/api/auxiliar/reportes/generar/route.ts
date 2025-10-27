import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    if (!['AUXILIAR', 'ADMINISTRATIVO'].includes(decoded.rol)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Obtener parámetros de la URL
    const { searchParams } = new URL(request.url)
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')
    const tipoReporte = searchParams.get('tipoReporte')
    const grado = searchParams.get('grado')
    const seccion = searchParams.get('seccion')

    if (!fechaInicio || !fechaFin) {
      return NextResponse.json({ error: 'Fechas de inicio y fin son requeridas' }, { status: 400 })
    }

    // Construir filtros para estudiantes
    const estudiantesWhere: any = {
      idIe: decoded.ieId
    }

    if (grado || seccion) {
      estudiantesWhere.gradoSeccion = {}
      if (grado) {
        estudiantesWhere.gradoSeccion.grado = { nombre: grado }
      }
      if (seccion) {
        estudiantesWhere.gradoSeccion.seccion = { nombre: seccion }
      }
    }

    // Obtener estudiantes
    const estudiantes = await prisma.estudiante.findMany({
      where: estudiantesWhere,
      include: {
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
        },
        asistencias: {
          where: {
            fecha: {
              gte: new Date(fechaInicio),
              lte: new Date(fechaFin)
            }
          },
          include: {
            estadoAsistencia: true
          },
          orderBy: {
            fecha: 'asc'
          }
        }
      }
    })

    // Procesar datos para el reporte
    const reportes = estudiantes.map(estudiante => {
      const asistencias = estudiante.asistencias.map((asistencia: any) => ({
        fecha: asistencia.fecha.toISOString().split('T')[0],
        estado: asistencia.estadoAsistencia?.nombreEstado || 'PRESENTE' as 'PRESENTE' | 'AUSENTE' | 'TARDANZA' | 'RETIRADO'
      }))

      // Calcular estadísticas
      const totalDias = asistencias.length
      const diasPresente = asistencias.filter((a: any) => a.estado === 'PRESENTE').length
      const diasAusente = asistencias.filter((a: any) => a.estado === 'AUSENTE').length
      const diasTardanza = asistencias.filter((a: any) => a.estado === 'TARDANZA').length
      const diasRetirado = asistencias.filter((a: any) => a.estado === 'RETIRADO').length
      
      const porcentajeAsistencia = totalDias > 0 
        ? ((diasPresente + diasTardanza) / totalDias) * 100 
        : 0

      return {
        estudiante: {
          id: estudiante.idEstudiante.toString(),
          nombre: estudiante.usuario.nombre || '',
          apellido: estudiante.usuario.apellido || '',
          dni: estudiante.usuario.dni,
          grado: estudiante.gradoSeccion?.grado?.nombre || '',
          seccion: estudiante.gradoSeccion?.seccion?.nombre || ''
        },
        asistencias,
        resumen: {
          totalDias,
          diasPresente,
          diasAusente,
          diasTardanza,
          diasRetirado,
          porcentajeAsistencia
        }
      }
    })

    // Calcular estadísticas generales
    const totalEstudiantes = reportes.length
    const promedioAsistencia = totalEstudiantes > 0 
      ? reportes.reduce((sum, r) => sum + r.resumen.porcentajeAsistencia, 0) / totalEstudiantes 
      : 0
    const estudiantesConBajaAsistencia = reportes.filter(r => r.resumen.porcentajeAsistencia < 70).length
    
    // Calcular días únicos analizados
    const fechasUnicas = new Set()
    reportes.forEach(reporte => {
      reporte.asistencias.forEach(asistencia => {
        fechasUnicas.add(asistencia.fecha)
      })
    })
    const diasAnalizados = fechasUnicas.size

    const estadisticas = {
      totalEstudiantes,
      promedioAsistencia,
      estudiantesConBajaAsistencia,
      diasAnalizados
    }

    return NextResponse.json({
      success: true,
      reportes,
      estadisticas,
      filtros: {
        fechaInicio,
        fechaFin,
        tipoReporte,
        grado: grado || 'Todos',
        seccion: seccion || 'Todas'
      }
    })

  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
