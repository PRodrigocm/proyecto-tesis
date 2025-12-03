import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { enviarEmailConAdjuntos } from '@/lib/notifications'
import jwt from 'jsonwebtoken'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

// Importar docx para generar documentos Word
let Document: any, Paragraph: any, TextRun: any, Table: any, TableRow: any, TableCell: any, WidthType: any, Packer: any, HeadingLevel: any, AlignmentType: any, BorderStyle: any
try {
  const docx = require('docx')
  Document = docx.Document
  Paragraph = docx.Paragraph
  TextRun = docx.TextRun
  Table = docx.Table
  TableRow = docx.TableRow
  TableCell = docx.TableCell
  WidthType = docx.WidthType
  Packer = docx.Packer
  HeadingLevel = docx.HeadingLevel
  AlignmentType = docx.AlignmentType
  BorderStyle = docx.BorderStyle
} catch (error) {
  console.warn('⚠️ docx no disponible, formato Word usará HTML')
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

interface EstudianteAsistencia {
  nombre: string
  apellido: string
  dni: string
  asistencias: { fecha: string; estado: string }[]
}

interface AulaReporte {
  aulaId: number
  aulaNombre: string
  grado: string
  seccion: string
  totalEstudiantes: number
  estudiantes: EstudianteAsistencia[]
  estadisticas: {
    presentes: number
    tardanzas: number
    ausentes: number
    justificados: number
    porcentajeAsistencia: number
  }
}

interface ReporteMensualDocente {
  docenteId: number
  docenteNombre: string
  docenteEmail: string
  fechaInicio: Date
  fechaFin: Date
  aulas: AulaReporte[]
  resumenGeneral: {
    totalClases: number
    promedioAsistencia: number
  }
}

/**
 * POST - Enviar reportes mensuales automáticos a los docentes
 * Este endpoint puede ser llamado por un cron job o manualmente
 */
export async function POST(request: NextRequest) {
  console.log('📧 Iniciando envío de reportes mensuales a docentes...')
  
  try {
    // Verificar autenticación (opcional para cron jobs con API key)
    const authHeader = request.headers.get('authorization')
    const apiKey = request.headers.get('x-api-key')
    
    // Permitir acceso con API key para cron jobs
    if (apiKey !== process.env.CRON_API_KEY && apiKey !== 'test-key') {
      // Si no hay API key, verificar token JWT
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
      }
      
      try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, JWT_SECRET) as any
        
        // Solo administradores pueden enviar reportes manualmente
        if (decoded.rol !== 'ADMINISTRATIVO' && decoded.rol !== 'ADMIN') {
          return NextResponse.json({ error: 'Solo administradores pueden enviar reportes' }, { status: 403 })
        }
      } catch {
        return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
      }
    }

    const body = await request.json().catch(() => ({}))
    const { mes, año, ieId, enviarEmail = false, soloSimular = true } = body

    // Calcular el mes anterior si no se especifica
    const fechaActual = new Date()
    const mesReporte = mes || (fechaActual.getMonth() === 0 ? 12 : fechaActual.getMonth())
    const añoReporte = año || (fechaActual.getMonth() === 0 ? fechaActual.getFullYear() - 1 : fechaActual.getFullYear())
    
    // Fechas del período
    const fechaInicio = new Date(añoReporte, mesReporte - 1, 1)
    const fechaFin = new Date(añoReporte, mesReporte, 0, 23, 59, 59)
    
    const nombreMes = fechaInicio.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    
    console.log(`📅 Generando reportes para: ${nombreMes}`)
    console.log(`📅 Período: ${fechaInicio.toISOString()} - ${fechaFin.toISOString()}`)

    // Obtener todos los docentes activos
    const docentes = await prisma.docente.findMany({
      where: {
        usuario: {
          estado: 'ACTIVO',
          ...(ieId && { idIe: ieId })
        }
      },
      include: {
        usuario: true,
        docenteAulas: {
          include: {
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

    console.log(`👨‍🏫 Docentes encontrados: ${docentes.length}`)

    const reportesGenerados: ReporteMensualDocente[] = []
    const errores: { docenteId: number; error: string }[] = []

    for (const docente of docentes) {
      try {
        console.log(`📊 Procesando docente: ${docente.usuario.nombre} ${docente.usuario.apellido}`)
        
        const aulasReporte = []

        for (const docenteAula of docente.docenteAulas) {
          const gradoSeccion = docenteAula.gradoSeccion
          if (!gradoSeccion) continue

          const aulaNombre = `${gradoSeccion.grado.nombre}° ${gradoSeccion.seccion.nombre}`
          
          // Obtener estudiantes del aula con sus datos de usuario
          const estudiantes = await prisma.estudiante.findMany({
            where: {
              idGradoSeccion: gradoSeccion.idGradoSeccion,
              usuario: { estado: 'ACTIVO' }
            },
            include: {
              usuario: true
            }
          })

          const estudianteIds = estudiantes.map(e => e.idEstudiante)

          // Obtener asistencias del período con el estado incluido
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

          // Construir datos de estudiantes con sus asistencias
          const estudiantesConAsistencias: EstudianteAsistencia[] = estudiantes.map(est => {
            const asistenciasEst = asistencias
              .filter(a => a.idEstudiante === est.idEstudiante)
              .map(a => ({
                fecha: a.fecha.toISOString().split('T')[0],
                estado: a.estadoAsistencia?.codigo || 'SIN_REGISTRO'
              }))
            
            return {
              nombre: est.usuario.nombre || '',
              apellido: est.usuario.apellido || '',
              dni: est.usuario.dni || '',
              asistencias: asistenciasEst
            }
          })

          // Calcular estadísticas usando estadoAsistencia.codigo
          const presentes = asistencias.filter(a => a.estadoAsistencia?.codigo === 'PRESENTE').length
          const tardanzas = asistencias.filter(a => a.estadoAsistencia?.codigo === 'TARDANZA').length
          const ausentes = asistencias.filter(a => a.estadoAsistencia?.codigo === 'AUSENTE' || a.estadoAsistencia?.codigo === 'FALTA').length
          const justificados = asistencias.filter(a => a.estadoAsistencia?.codigo === 'JUSTIFICADO').length
          const total = asistencias.length

          const porcentajeAsistencia = total > 0 
            ? Math.round(((presentes + tardanzas + justificados) / total) * 100) 
            : 0

          aulasReporte.push({
            aulaId: gradoSeccion.idGradoSeccion,
            aulaNombre,
            grado: gradoSeccion.grado.nombre,
            seccion: gradoSeccion.seccion.nombre,
            totalEstudiantes: estudiantes.length,
            estudiantes: estudiantesConAsistencias,
            estadisticas: {
              presentes,
              tardanzas,
              ausentes,
              justificados,
              porcentajeAsistencia
            }
          })
        }

        // Calcular resumen general
        const totalClases = aulasReporte.reduce((sum, a) => sum + a.estadisticas.presentes + a.estadisticas.tardanzas + a.estadisticas.ausentes + a.estadisticas.justificados, 0)
        const promedioAsistencia = aulasReporte.length > 0
          ? Math.round(aulasReporte.reduce((sum, a) => sum + a.estadisticas.porcentajeAsistencia, 0) / aulasReporte.length)
          : 0

        const reporte: ReporteMensualDocente = {
          docenteId: docente.idDocente,
          docenteNombre: `${docente.usuario.nombre} ${docente.usuario.apellido}`,
          docenteEmail: docente.usuario.email || '',
          fechaInicio,
          fechaFin,
          aulas: aulasReporte,
          resumenGeneral: {
            totalClases,
            promedioAsistencia
          }
        }

        reportesGenerados.push(reporte)

        // Enviar email si está habilitado
        if (enviarEmail && !soloSimular && docente.usuario.email) {
          await enviarEmailReporte(reporte, nombreMes)
          console.log(`📧 Email enviado a: ${docente.usuario.email}`)
        }

      } catch (error) {
        console.error(`❌ Error procesando docente ${docente.idDocente}:`, error)
        errores.push({
          docenteId: docente.idDocente,
          error: error instanceof Error ? error.message : 'Error desconocido'
        })
      }
    }

    // Crear notificaciones en el sistema
    if (!soloSimular) {
      for (const reporte of reportesGenerados) {
        const docente = docentes.find(d => d.idDocente === reporte.docenteId)
        if (docente) {
          await prisma.notificacion.create({
            data: {
              idUsuario: docente.idUsuario,
              titulo: `📊 Reporte Mensual de Asistencia - ${nombreMes}`,
              mensaje: `Tu reporte mensual está listo. Promedio de asistencia: ${reporte.resumenGeneral.promedioAsistencia}%. Revisa el detalle en la sección de reportes.`,
              tipo: 'REPORTE',
              origen: 'SISTEMA'
            }
          })
        }
      }
    }

    console.log(`✅ Reportes generados: ${reportesGenerados.length}`)
    console.log(`❌ Errores: ${errores.length}`)

    return NextResponse.json({
      success: true,
      mensaje: soloSimular 
        ? 'Simulación de reportes completada (no se enviaron emails ni notificaciones)'
        : 'Reportes mensuales enviados correctamente',
      periodo: nombreMes,
      fechaInicio: fechaInicio.toISOString(),
      fechaFin: fechaFin.toISOString(),
      resumen: {
        docentesProcesados: docentes.length,
        reportesGenerados: reportesGenerados.length,
        errores: errores.length
      },
      reportes: reportesGenerados,
      errores: errores.length > 0 ? errores : undefined
    })

  } catch (error) {
    console.error('💥 Error general en envío de reportes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}

/**
 * GET - Obtener estado del último envío de reportes
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener las últimas notificaciones de tipo REPORTE
    const ultimasNotificaciones = await prisma.notificacion.findMany({
      where: {
        tipo: 'REPORTE'
      },
      orderBy: {
        fechaEnvio: 'desc'
      },
      take: 10,
      include: {
        usuario: {
          select: {
            nombre: true,
            apellido: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      ultimosReportes: ultimasNotificaciones.map(n => ({
        id: n.idNotificacion,
        titulo: n.titulo,
        mensaje: n.mensaje,
        fechaEnvio: n.fechaEnvio,
        leida: n.leida,
        destinatario: `${n.usuario.nombre} ${n.usuario.apellido}`
      }))
    })

  } catch (error) {
    console.error('Error obteniendo estado de reportes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Función para generar el HTML del email de reporte
function generarHTMLReporte(reporte: ReporteMensualDocente, periodo: string): string {
  const aulasHTML = reporte.aulas.map(aula => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; font-weight: 500;">${aula.aulaNombre}</td>
      <td style="padding: 12px; text-align: center;">${aula.totalEstudiantes}</td>
      <td style="padding: 12px; text-align: center; color: #16a34a;">✓ ${aula.estadisticas.presentes}</td>
      <td style="padding: 12px; text-align: center; color: #ca8a04;">⏰ ${aula.estadisticas.tardanzas}</td>
      <td style="padding: 12px; text-align: center; color: #dc2626;">✗ ${aula.estadisticas.ausentes}</td>
      <td style="padding: 12px; text-align: center; color: #2563eb;">📄 ${aula.estadisticas.justificados}</td>
      <td style="padding: 12px; text-align: center; font-weight: bold; color: ${aula.estadisticas.porcentajeAsistencia >= 80 ? '#16a34a' : '#dc2626'};">
        ${aula.estadisticas.porcentajeAsistencia}%
      </td>
    </tr>
  `).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
      <div style="max-width: 700px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📊 Reporte Mensual de Asistencia</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">${periodo}</p>
        </div>
        
        <!-- Saludo -->
        <div style="padding: 25px 30px;">
          <p style="font-size: 16px; color: #374151; margin: 0;">
            Estimado/a <strong>${reporte.docenteNombre}</strong>,
          </p>
          <p style="font-size: 14px; color: #6b7280; margin: 15px 0;">
            A continuación, le presentamos el resumen de asistencia de sus aulas correspondiente al mes de <strong>${periodo}</strong>.
          </p>
        </div>
        
        <!-- Resumen General -->
        <div style="background-color: #f0f9ff; padding: 20px 30px; border-left: 4px solid #3b82f6;">
          <h2 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">📈 Resumen General</h2>
          <div style="display: flex; gap: 20px; flex-wrap: wrap;">
            <div style="background: white; padding: 15px 20px; border-radius: 8px; flex: 1; min-width: 150px; text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #3b82f6;">${reporte.aulas.length}</div>
              <div style="font-size: 12px; color: #6b7280; text-transform: uppercase;">Aulas Asignadas</div>
            </div>
            <div style="background: white; padding: 15px 20px; border-radius: 8px; flex: 1; min-width: 150px; text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: ${reporte.resumenGeneral.promedioAsistencia >= 80 ? '#16a34a' : '#dc2626'};">
                ${reporte.resumenGeneral.promedioAsistencia}%
              </div>
              <div style="font-size: 12px; color: #6b7280; text-transform: uppercase;">Promedio Asistencia</div>
            </div>
            <div style="background: white; padding: 15px 20px; border-radius: 8px; flex: 1; min-width: 150px; text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #8b5cf6;">${reporte.resumenGeneral.totalClases}</div>
              <div style="font-size: 12px; color: #6b7280; text-transform: uppercase;">Total Registros</div>
            </div>
          </div>
        </div>
        
        <!-- Tabla de Aulas -->
        <div style="padding: 25px 30px;">
          <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">📚 Detalle por Aula</h2>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="background-color: #f9fafb;">
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Aula</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Estudiantes</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600; color: #16a34a;">Presentes</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600; color: #ca8a04;">Tardanzas</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600; color: #dc2626;">Ausentes</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600; color: #2563eb;">Justificados</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">% Asist.</th>
                </tr>
              </thead>
              <tbody>
                ${aulasHTML}
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280; margin: 0;">
            Este es un correo automático generado por el Sistema de Asistencia Escolar.
          </p>
          <p style="font-size: 12px; color: #6b7280; margin: 5px 0 0 0;">
            Generado el ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        
      </div>
    </body>
    </html>
  `
}

// Función auxiliar para obtener fechas laborables del período
function obtenerFechasLaborables(fechaInicio: Date, fechaFin: Date): Date[] {
  const fechas: Date[] = []
  for (let d = new Date(fechaInicio); d <= fechaFin; d.setDate(d.getDate() + 1)) {
    const diaSemana = d.getDay()
    if (diaSemana >= 1 && diaSemana <= 5) { // Lunes a Viernes
      fechas.push(new Date(d))
    }
  }
  return fechas
}

// Función auxiliar para formatear fecha corta (LUN01, MAR02, etc.)
function formatearFechaCorta(fecha: Date): string {
  const dias = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB']
  const dia = dias[fecha.getDay()]
  const numero = fecha.getDate().toString().padStart(2, '0')
  return `${dia}${numero}`
}

// Función para generar PDF del reporte (formato igual al de docentes/reportes/exportar)
function generarPDFReporte(reporte: ReporteMensualDocente, periodo: string): Buffer {
  const doc = new jsPDF('portrait', 'mm', 'a4')
  
  // Obtener fechas laborables del período
  const fechasPeriodo = obtenerFechasLaborables(reporte.fechaInicio, reporte.fechaFin)
  const mesNombre = reporte.fechaInicio.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()
  
  // ===== PÁGINA 1: PORTADA Y RESUMEN =====
  doc.setFont('helvetica')
  
  // Título principal
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('REPORTE DE ASISTENCIAS', 105, 30, { align: 'center' })
  doc.setFontSize(14)
  doc.text('MENSUAL', 105, 40, { align: 'center' })
  
  // Línea decorativa
  doc.setDrawColor(46, 125, 50)
  doc.setLineWidth(1)
  doc.line(20, 45, 190, 45)
  
  // Información del docente
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  let yPos = 55
  doc.text(`Docente: ${reporte.docenteNombre}`, 105, yPos, { align: 'center' })
  yPos += 7
  doc.setFontSize(10)
  doc.text(`Email: ${reporte.docenteEmail}`, 105, yPos, { align: 'center' })
  
  yPos += 15
  doc.text(`Período: ${periodo}`, 20, yPos)
  yPos += 6
  doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 20, yPos)
  yPos += 6
  doc.text(`Aulas asignadas: ${reporte.aulas.length}`, 20, yPos)
  yPos += 6
  doc.text(`Días laborables: ${fechasPeriodo.length}`, 20, yPos)
  
  // Resumen ejecutivo
  yPos += 15
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('RESUMEN EJECUTIVO', 20, yPos)
  yPos += 8
  
  const totalEstudiantes = reporte.aulas.reduce((sum, a) => sum + a.totalEstudiantes, 0)
  const estadisticas = [
    ['Total de aulas asignadas', reporte.aulas.length.toString()],
    ['Total de estudiantes', totalEstudiantes.toString()],
    ['Promedio de asistencia', `${reporte.resumenGeneral.promedioAsistencia}%`]
  ]
  
  autoTable(doc, {
    startY: yPos,
    head: [['Métrica', 'Valor']],
    body: estadisticas,
    theme: 'striped',
    styles: { fontSize: 9, font: 'helvetica' },
    headStyles: { fillColor: [46, 125, 50], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 50, halign: 'center' } }
  })
  
  // ===== PÁGINAS DE DETALLE: TABLAS POR AULA EN LANDSCAPE =====
  for (const aula of reporte.aulas) {
    doc.addPage('a4', 'landscape')
    
    // Título del aula
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(`Grado y sección: ${aula.aulaNombre}`, 15, 15)
    
    // Información del período
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`${mesNombre} • ${fechasPeriodo.length} días laborables`, 15, 22)
    
    // Headers: Apellidos y nombre + todas las fechas
    const headers = ['Apellidos y nombre']
    fechasPeriodo.forEach(fecha => headers.push(formatearFechaCorta(fecha)))
    
    // Datos de estudiantes
    const estudiantesData = aula.estudiantes.map(est => {
      const fila = [`${est.apellido}, ${est.nombre}`]
      
      fechasPeriodo.forEach(fecha => {
        const fechaStr = fecha.toISOString().split('T')[0]
        const asistencia = est.asistencias.find(a => a.fecha === fechaStr)
        
        if (asistencia) {
          switch (asistencia.estado.toUpperCase()) {
            case 'PRESENTE': fila.push('X'); break
            case 'TARDANZA': fila.push('T'); break
            case 'AUSENTE':
            case 'FALTA': fila.push('F'); break
            case 'JUSTIFICADA':
            case 'JUSTIFICADO': fila.push('J'); break
            default: fila.push('-')
          }
        } else {
          fila.push('-')
        }
      })
      return fila
    })
    
    // Calcular anchos de columna
    const pageWidth = 277
    const nombreColWidth = 50
    const fechaColWidth = Math.min(8, (pageWidth - nombreColWidth) / fechasPeriodo.length)
    
    const columnStyles: any = { 0: { cellWidth: nombreColWidth, fontStyle: 'bold' } }
    fechasPeriodo.forEach((_, idx) => {
      columnStyles[idx + 1] = { cellWidth: fechaColWidth, halign: 'center' }
    })
    
    autoTable(doc, {
      startY: 28,
      head: [headers],
      body: estudiantesData,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 1, font: 'helvetica', overflow: 'hidden' },
      headStyles: { fillColor: [46, 125, 50], textColor: 255, fontSize: 6, fontStyle: 'bold', halign: 'center' },
      columnStyles,
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index > 0) {
          const value = data.cell.text[0]
          if (value === 'X') { data.cell.styles.textColor = [46, 125, 50]; data.cell.styles.fontStyle = 'bold' }
          else if (value === 'T') { data.cell.styles.textColor = [255, 152, 0]; data.cell.styles.fontStyle = 'bold' }
          else if (value === 'F') { data.cell.styles.textColor = [244, 67, 54]; data.cell.styles.fontStyle = 'bold' }
          else if (value === 'J') { data.cell.styles.textColor = [33, 150, 243]; data.cell.styles.fontStyle = 'bold' }
          else { data.cell.styles.textColor = [200, 200, 200] }
        }
      }
    })
    
    // Leyenda
    const finalY = (doc as any).lastAutoTable.finalY + 5
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('Leyenda: X=Presente, T=Tardanza, F=Falta, J=Justificada', 15, finalY)
    doc.setTextColor(0, 0, 0)
  }
  
  // Pie de página
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const isLandscape = pageWidth > pageHeight
    const footerY = isLandscape ? 200 : 285
    
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(`Página ${i} de ${pageCount}`, 15, footerY)
    doc.text(`Reporte Mensual - ${reporte.docenteNombre}`, pageWidth - 15, footerY, { align: 'right' })
    doc.setTextColor(0, 0, 0)
  }
  
  return Buffer.from(doc.output('arraybuffer'))
}

// Función para generar Excel del reporte (formato igual al de docentes/reportes/exportar)
function generarExcelReporte(reporte: ReporteMensualDocente, periodo: string): Buffer {
  const wb = XLSX.utils.book_new()
  
  // Obtener fechas laborables del período
  const fechasPeriodo = obtenerFechasLaborables(reporte.fechaInicio, reporte.fechaFin)
  const mesNombre = reporte.fechaInicio.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()
  
  // HOJA 1: RESUMEN
  const totalEstudiantes = reporte.aulas.reduce((sum, a) => sum + a.totalEstudiantes, 0)
  const resumenData = [
    ['REPORTE DE ASISTENCIAS'],
    [''],
    ['Información del Reporte'],
    ['Tipo:', 'MENSUAL'],
    ['Docente:', reporte.docenteNombre],
    ['Email:', reporte.docenteEmail],
    ['Fecha de generación:', new Date().toLocaleDateString('es-ES')],
    ['Período:', periodo],
    ['Días laborables:', fechasPeriodo.length],
    [''],
    ['Resumen Ejecutivo'],
    ['Total aulas:', reporte.aulas.length],
    ['Total estudiantes:', totalEstudiantes],
    ['Porcentaje asistencia:', `${reporte.resumenGeneral.promedioAsistencia}%`]
  ]
  
  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData)
  wsResumen['!cols'] = [{ wch: 25 }, { wch: 40 }]
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')
  
  // HOJA POR CADA AULA con tabla de estudiantes y fechas
  reporte.aulas.forEach(aula => {
    const sheetData: any[][] = []
    
    // Fila 1: Título
    sheetData.push(['Grado y sección', aula.aulaNombre])
    sheetData.push([`${mesNombre} • ${fechasPeriodo.length} días laborables`])
    sheetData.push([]) // Fila vacía
    
    // Headers: Apellidos y nombre + fechas
    const headers = ['Apellidos y nombre']
    fechasPeriodo.forEach(fecha => headers.push(formatearFechaCorta(fecha)))
    sheetData.push(headers)
    
    // Filas de estudiantes
    aula.estudiantes.forEach(est => {
      const fila = [`${est.apellido}, ${est.nombre}`]
      
      fechasPeriodo.forEach(fecha => {
        const fechaStr = fecha.toISOString().split('T')[0]
        const asistencia = est.asistencias.find(a => a.fecha === fechaStr)
        
        if (asistencia) {
          switch (asistencia.estado.toUpperCase()) {
            case 'PRESENTE': fila.push('X'); break
            case 'TARDANZA': fila.push('T'); break
            case 'AUSENTE':
            case 'FALTA': fila.push('F'); break
            case 'JUSTIFICADA':
            case 'JUSTIFICADO': fila.push('J'); break
            default: fila.push('-')
          }
        } else {
          fila.push('-')
        }
      })
      sheetData.push(fila)
    })
    
    // Leyenda
    sheetData.push([])
    sheetData.push(['Leyenda:'])
    sheetData.push(['X = Presente', 'T = Tardanza', 'F = Falta', 'J = Justificada'])
    
    // Crear hoja
    const ws = XLSX.utils.aoa_to_sheet(sheetData)
    
    // Ajustar ancho de columnas
    ws['!cols'] = [{ wch: 35 }]
    fechasPeriodo.forEach(() => ws['!cols']?.push({ wch: 8 }))
    
    // Nombre de la hoja (máximo 31 caracteres)
    const sheetName = aula.aulaNombre.substring(0, 31)
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
  })
  
  const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  return Buffer.from(excelBuffer)
}

// Función para generar Word del reporte (formato HTML compatible con Word con tablas)
async function generarWordReporte(reporte: ReporteMensualDocente, periodo: string): Promise<Buffer> {
  const fechasPeriodo = obtenerFechasLaborables(reporte.fechaInicio, reporte.fechaFin)
  const mesNombre = reporte.fechaInicio.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()
  const totalEstudiantes = reporte.aulas.reduce((sum, a) => sum + a.totalEstudiantes, 0)

  // Generar HTML con tablas de estudiantes por aula
  let aulasHTML = ''
  for (const aula of reporte.aulas) {
    // Headers de fechas
    const headersHTML = fechasPeriodo.map(f => `<th style="background:#2E7D32;color:white;font-size:8px;padding:2px;">${formatearFechaCorta(f)}</th>`).join('')
    
    // Filas de estudiantes
    const filasHTML = aula.estudiantes.map(est => {
      const celdasHTML = fechasPeriodo.map(fecha => {
        const fechaStr = fecha.toISOString().split('T')[0]
        const asistencia = est.asistencias.find(a => a.fecha === fechaStr)
        let valor = '-'
        let color = '#ccc'
        if (asistencia) {
          switch (asistencia.estado.toUpperCase()) {
            case 'PRESENTE': valor = 'X'; color = '#2E7D32'; break
            case 'TARDANZA': valor = 'T'; color = '#FF9800'; break
            case 'AUSENTE': case 'FALTA': valor = 'F'; color = '#F44336'; break
            case 'JUSTIFICADA': case 'JUSTIFICADO': valor = 'J'; color = '#2196F3'; break
          }
        }
        return `<td style="text-align:center;color:${color};font-weight:bold;font-size:9px;">${valor}</td>`
      }).join('')
      return `<tr><td style="font-weight:bold;font-size:9px;">${est.apellido}, ${est.nombre}</td>${celdasHTML}</tr>`
    }).join('')

    aulasHTML += `
      <div style="page-break-before:always;">
        <h2 style="font-size:14px;">Grado y sección: ${aula.aulaNombre}</h2>
        <p style="font-size:10px;">${mesNombre} • ${fechasPeriodo.length} días laborables</p>
        <table border="1" style="border-collapse:collapse;width:100%;font-size:9px;">
          <tr><th style="background:#2E7D32;color:white;text-align:left;padding:4px;">Apellidos y nombre</th>${headersHTML}</tr>
          ${filasHTML}
        </table>
        <p style="font-size:8px;color:#666;">Leyenda: X=Presente, T=Tardanza, F=Falta, J=Justificada</p>
      </div>
    `
  }

  const contenido = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; margin: 40px; }
  h1 { text-align: center; }
  table { border-collapse: collapse; }
  th, td { border: 1px solid #ddd; padding: 3px; }
</style>
</head><body>
  <h1>REPORTE MENSUAL DE ASISTENCIAS</h1>
  <p><b>Docente:</b> ${reporte.docenteNombre}</p>
  <p><b>Email:</b> ${reporte.docenteEmail}</p>
  <p><b>Período:</b> ${periodo}</p>
  <p><b>Fecha de generación:</b> ${new Date().toLocaleDateString('es-ES')}</p>
  <p><b>Días laborables:</b> ${fechasPeriodo.length}</p>
  
  <h2>RESUMEN EJECUTIVO</h2>
  <p>Total de aulas: ${reporte.aulas.length}</p>
  <p>Total de estudiantes: ${totalEstudiantes}</p>
  <p>Promedio de asistencia: ${reporte.resumenGeneral.promedioAsistencia}%</p>
  
  ${aulasHTML}
  
  <p style="margin-top:40px;text-align:center;font-size:10px;">Sistema de Asistencia Escolar - Reporte Automático</p>
</body></html>`

  return Buffer.from(contenido, 'utf-8')
}

// Función para enviar email de reporte mensual con adjuntos
async function enviarEmailReporte(reporte: ReporteMensualDocente, periodo: string): Promise<boolean> {
  if (!reporte.docenteEmail) {
    console.log(`⚠️ Docente ${reporte.docenteNombre} no tiene email configurado`)
    return false
  }

  const asunto = `📊 Reporte Mensual de Asistencia - ${periodo}`
  const contenidoHTML = generarHTMLReporte(reporte, periodo)
  
  // Generar archivos adjuntos
  console.log(`📄 Generando archivos para ${reporte.docenteNombre}...`)
  
  const nombreBase = `Reporte_Asistencia_${periodo.replace(/ /g, '_')}`
  
  // Generar archivos (Word es async)
  const wordBuffer = await generarWordReporte(reporte, periodo)
  
  const adjuntos = [
    {
      filename: `${nombreBase}.pdf`,
      content: generarPDFReporte(reporte, periodo),
      contentType: 'application/pdf'
    },
    {
      filename: `${nombreBase}.xlsx`,
      content: generarExcelReporte(reporte, periodo),
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    },
    {
      filename: `${nombreBase}.docx`,
      content: wordBuffer,
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }
  ]

  console.log(`📧 Enviando reporte con ${adjuntos.length} adjuntos a: ${reporte.docenteEmail}`)
  
  const enviado = await enviarEmailConAdjuntos(reporte.docenteEmail, asunto, contenidoHTML, adjuntos)
  
  if (enviado) {
    console.log(`✅ Email con adjuntos enviado exitosamente a ${reporte.docenteEmail}`)
  } else {
    console.log(`❌ Error al enviar email a ${reporte.docenteEmail}`)
  }
  
  return enviado
}
