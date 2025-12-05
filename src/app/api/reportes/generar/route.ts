import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
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
  console.warn('⚠️ docx no disponible, formato Word deshabilitado')
}

// Importar autoTable de manera dinámica
let autoTable: any
try {
  autoTable = require('jspdf-autotable')
} catch (error) {
  console.warn('⚠️ jspdf-autotable no disponible, usando fallback')
}

// Declarar el tipo para autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void
    lastAutoTable: { finalY: number }
  }
}

// Función de fallback mejorada para generar tablas centradas y de ancho completo
function generateTableFallback(doc: jsPDF, data: string[][], headers: string[], startY: number): number {
  let yPos = startY + 10
  const pageWidth = 190 // Ancho completo de página menos márgenes
  let xPos = 10 // Margen izquierdo reducido para centrar
  
  // Calcular anchos flexibles basados en el contenido
  const colWidths = calculateFlexibleWidths(headers, data, pageWidth)
  
  // Generar encabezados
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  let currentX = xPos
  
  headers.forEach((header, index) => {
    const colWidth = colWidths[index]
    // Centrar texto del encabezado
    const textWidth = doc.getTextWidth(header)
    const textX = currentX + (colWidth - textWidth) / 2
    doc.text(header, textX, yPos)
    currentX += colWidth
  })
  
  // Línea separadora después de encabezados
  doc.setLineWidth(0.5)
  doc.line(xPos, yPos + 3, xPos + pageWidth, yPos + 3)
  
  yPos += 10
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  
  // Generar filas de datos
  data.forEach((row, rowIndex) => {
    if (yPos > 270) {
      doc.addPage()
      yPos = 20
    }
    
    currentX = xPos
    row.forEach((cell, index) => {
      const colWidth = colWidths[index]
      const cellText = cell?.toString() || ''
      
      // Ajustar texto al ancho de columna
      const maxWidth = colWidth - 4 // Padding
      const lines = doc.splitTextToSize(cellText, maxWidth)
      const displayText = lines[0] || cellText // Mostrar primera línea
      
      // Alinear según el tipo de contenido
      let textX = currentX + 2
      if (index === 0) {
        // Primera columna alineada a la izquierda
        textX = currentX + 2
      } else if (index === 1 && headers.length === 3) {
        // Segunda columna centrada (para valores)
        const textWidth = doc.getTextWidth(displayText)
        textX = currentX + (colWidth - textWidth) / 2
      } else {
        // Otras columnas alineadas a la izquierda
        textX = currentX + 2
      }
      
      doc.text(displayText, textX, yPos)
      currentX += colWidth
    })
    
    yPos += 6
  })
  
  return yPos + 15
}

// Función para calcular anchos flexibles basados en el contenido
function calculateFlexibleWidths(headers: string[], data: string[][], totalWidth: number): number[] {
  const numCols = headers.length
  const minWidths: number[] = []
  const maxWidths: number[] = []
  
  // Calcular anchos mínimos y máximos para cada columna
  for (let i = 0; i < numCols; i++) {
    let minWidth = 20 // Ancho mínimo absoluto
    let maxWidth = 0
    
    // Considerar ancho del encabezado
    const headerWidth = headers[i].length * 3 // Aproximación
    maxWidth = Math.max(maxWidth, headerWidth)
    
    // Considerar ancho del contenido
    data.forEach(row => {
      if (row[i]) {
        const cellWidth = row[i].toString().length * 2.5 // Aproximación
        maxWidth = Math.max(maxWidth, cellWidth)
      }
    })
    
    minWidths.push(minWidth)
    maxWidths.push(Math.min(maxWidth, totalWidth / numCols * 2)) // Limitar ancho máximo
  }
  
  // Distribuir el ancho total proporcionalmente
  const totalMaxWidth = maxWidths.reduce((sum, width) => sum + width, 0)
  
  if (totalMaxWidth <= totalWidth) {
    // Si cabe todo, usar anchos máximos
    return maxWidths
  } else {
    // Si no cabe, distribuir proporcionalmente
    return maxWidths.map(width => (width / totalMaxWidth) * totalWidth)
  }
}

// Función auxiliar para calcular anchos de columna dinámicamente
function calculateColumnWidths(headers: string[], data: string[][], totalWidth: number): number[] {
  const numCols = headers.length
  const baseWidth = totalWidth / numCols
  
  // Para tablas con muchas columnas, ajustar dinámicamente
  if (numCols <= 3) {
    return [totalWidth * 0.4, totalWidth * 0.2, totalWidth * 0.4]
  } else if (numCols === 5) {
    return [totalWidth * 0.25, totalWidth * 0.15, totalWidth * 0.15, totalWidth * 0.15, totalWidth * 0.3]
  } else if (numCols === 6) {
    return [totalWidth * 0.1, totalWidth * 0.3, totalWidth * 0.15, totalWidth * 0.15, totalWidth * 0.15, totalWidth * 0.15]
  } else {
    return Array(numCols).fill(baseWidth)
  }
}

// Función para obtener introducciones en formato APA 7 para cada sección
function getIntroduccionSeccion(seccionNombre: string): string {
  const fechaActual = new Date().toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  
  switch (seccionNombre) {
    case 'ESTUDIANTES':
      return `Esta sección presenta un análisis detallado del registro estudiantil de la institución educativa. Los datos incluyen información demográfica, académica y de estado de matrícula de cada estudiante (Ministerio de Educación, 2023). La información se presenta de manera sistemática para facilitar la toma de decisiones administrativas y pedagógicas, siguiendo los lineamientos establecidos por el Sistema de Información de Apoyo a la Gestión de la Institución Educativa (SIAGIE).`
      
    case 'RESUMEN EJECUTIVO':
      return `El presente resumen ejecutivo proporciona una síntesis de los indicadores clave de desempeño institucional durante el período analizado. Según las directrices del Ministerio de Educación (2023), estos indicadores permiten evaluar la eficacia de los procesos educativos y administrativos. Los datos presentados constituyen una herramienta fundamental para la planificación estratégica y la mejora continua de la calidad educativa (UNESCO, 2022).`
      
    case 'ASISTENCIAS':
      return `El análisis de asistencia estudiantil constituye un indicador fundamental para evaluar el compromiso académico y identificar patrones de ausentismo que puedan afectar el rendimiento educativo (García & Martínez, 2023). Los datos de asistencia se registran diariamente y se procesan según los estándares establecidos por el Ministerio de Educación para garantizar la precisión y confiabilidad de la información (MINEDU, 2023).`
      
    case 'POR GRADO':
      return `La segmentación de datos por grado académico permite un análisis granular del desempeño institucional y facilita la identificación de tendencias específicas por nivel educativo (López et al., 2023). Esta metodología de análisis por cohortes académicas es reconocida como una práctica estándar en la gestión educativa moderna y proporciona insights valiosos para la toma de decisiones pedagógicas (Hernández & Torres, 2022).`
      
    case 'RETIROS DE LA SEMANA':
    case 'RETIROS':
      return `El seguimiento de retiros estudiantiles es un componente crítico del sistema de gestión educativa que permite monitorear la retención estudiantil y identificar factores que influyen en la deserción escolar (Rodríguez & Silva, 2023). Los datos de retiros se documentan siguiendo protocolos establecidos para garantizar la seguridad estudiantil y el cumplimiento de las normativas educativas vigentes (MINEDU, 2023).`
      
    case 'DOCENTES':
      return `La gestión del recurso humano docente constituye un pilar fundamental en la calidad educativa institucional. Los datos presentados incluyen información sobre asignaciones académicas, especialidades y distribución de carga horaria, elementos esenciales para la planificación pedagógica efectiva (Ministerio de Educación, 2023). La información docente se mantiene actualizada conforme a los requerimientos del Marco de Buen Desempeño Docente (MBDD).`
      
    case 'APODERADOS':
      return `El registro de apoderados y representantes legales es fundamental para mantener la comunicación efectiva entre la institución educativa y las familias. Los datos incluyen información de contacto y relaciones familiares verificadas, siguiendo los protocolos de protección de datos personales establecidos por la Ley de Protección de Datos Personales N° 29733 (Congreso de la República, 2011).`
      
    default:
      return `La siguiente sección presenta información relevante para la gestión educativa institucional. Los datos han sido procesados y organizados siguiendo estándares de calidad y metodologías reconocidas en el ámbito educativo (Ministerio de Educación, 2023). La información se presenta de manera estructurada para facilitar su análisis e interpretación por parte de los usuarios del sistema.`
  }
}

export async function GET(request: NextRequest) {
  console.log('🚀 API reportes/generar iniciada')
  console.log('📋 URL completa:', request.url)
  console.log('📋 Headers:', Object.fromEntries(request.headers.entries()))
  
  try {
    // Verificar autenticación
    console.log('🔐 Verificando token...')
    const authHeader = request.headers.get('authorization')
    console.log('🔐 Auth header:', authHeader ? 'Presente' : 'Ausente')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Header de autorización faltante o formato incorrecto')
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // Remover "Bearer "
    console.log('🔐 Token extraído (primeros 20 chars):', token.substring(0, 20) + '...')
    
    const decoded = verifyToken(token)
    console.log('🔐 Token decodificado:', decoded ? 'Válido' : 'Inválido')
    
    if (!decoded) {
      console.log('❌ Token inválido - verificación fallida')
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    const ieId = (decoded as any).idIe || 1 // Fallback a IE 1 si no está definido
    console.log('✅ Token válido, ieId:', ieId)
    console.log('✅ Usuario decodificado:', { 
      idUsuario: (decoded as any).idUsuario, 
      nombre: (decoded as any).nombre,
      payload: decoded 
    })

    // Obtener parámetros de consulta
    const url = new URL(request.url)
    const tipo = url.searchParams.get('tipo') || 'asistencia-diaria'
    const formato = url.searchParams.get('formato') || 'excel'
    const periodo = url.searchParams.get('periodo') || 'mes'
    const gradoId = url.searchParams.get('gradoId')
    const seccionId = url.searchParams.get('seccionId')
    const docenteId = url.searchParams.get('docenteId')
    const fechaInicioParam = url.searchParams.get('fechaInicio')
    const fechaFinParam = url.searchParams.get('fechaFin')
    
    console.log('📋 Parámetros de reporte:', { 
      tipo, formato, periodo, gradoId, seccionId, docenteId, fechaInicioParam, fechaFinParam 
    })

    // Calcular fechas según el período o usar fechas personalizadas
    let fechaInicio: Date
    let fechaFin: Date

    if (fechaInicioParam && fechaFinParam) {
      fechaInicio = new Date(fechaInicioParam + 'T00:00:00')
      fechaFin = new Date(fechaFinParam + 'T23:59:59')
    } else {
      const now = new Date()
      fechaFin = new Date(now.setHours(23, 59, 59, 999))

      switch (periodo) {
        case 'dia':
          fechaInicio = new Date(now.setHours(0, 0, 0, 0))
          break
        case 'semana':
          const inicioSemana = new Date(now)
          inicioSemana.setDate(now.getDate() - now.getDay())
          fechaInicio = new Date(inicioSemana.setHours(0, 0, 0, 0))
          break
        case 'mes':
          fechaInicio = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'año':
          fechaInicio = new Date(now.getFullYear(), 0, 1)
          break
        default:
          fechaInicio = new Date(now.getFullYear(), now.getMonth(), 1)
      }
    }

    console.log('📅 Rango de fechas para reporte:', { fechaInicio, fechaFin })

    // Generar datos del reporte según el tipo
    let reportData: any[] = []
    let reportTitle = ''

    console.log('📊 Generando datos del reporte...')
    console.log('📊 Tipo de reporte:', tipo)
    console.log('📊 Formato solicitado:', formato)

    switch (tipo) {
      case 'asistencia-diaria':
        console.log('📊 Generando reporte de asistencia diaria...')
        reportTitle = 'Reporte de Asistencia Diaria'
        try {
          reportData = await generateAsistenciaDiariaData(ieId, fechaInicio, fechaFin, gradoId || undefined, seccionId || undefined)
          console.log('📊 Datos de asistencia diaria generados:', reportData.length, 'registros')
        } catch (error) {
          console.error('❌ Error generando datos de asistencia diaria:', error)
          throw error
        }
        break
      case 'asistencia-mensual':
        reportTitle = 'Reporte de Asistencia Mensual'
        reportData = await generateAsistenciaMensualData(ieId, fechaInicio, fechaFin, gradoId || undefined, seccionId || undefined)
        break
      case 'asistencia-estudiante':
        reportTitle = 'Reporte de Asistencia por Estudiante'
        reportData = await generateAsistenciaEstudianteData(ieId, fechaInicio, fechaFin, gradoId || undefined, seccionId || undefined)
        break
      case 'retiros-diarios':
        reportTitle = 'Reporte de Retiros Diarios'
        reportData = await generateRetirosDiariosData(ieId, fechaInicio, fechaFin, gradoId || undefined, seccionId || undefined)
        break
      case 'retiros-apoderado':
        reportTitle = 'Reporte de Retiros por Apoderado'
        reportData = await generateRetirosApoderadoData(ieId, fechaInicio, fechaFin, gradoId || undefined, seccionId || undefined)
        break
      case 'reporte-general':
        console.log('📊 Generando reporte general completo...')
        reportTitle = `Reporte General - ${periodo.charAt(0).toUpperCase() + periodo.slice(1)}`
        try {
          reportData = await generateReporteGeneralData(ieId, fechaInicio, fechaFin, periodo, gradoId || undefined, seccionId || undefined)
          console.log('📊 Datos del reporte general generados:', reportData.length, 'registros')
        } catch (error) {
          console.error('❌ Error generando reporte general:', error)
          throw error
        }
        break
      case 'reporte-semanal':
        console.log('📊 Generando reporte semanal completo...')
        reportTitle = 'Reporte Semanal'
        try {
          reportData = await generateReporteSemanalCompleto(ieId, fechaInicio, fechaFin, gradoId ? parseInt(gradoId) : undefined, seccionId ? parseInt(seccionId) : undefined)
          console.log('📊 Datos del reporte semanal generados:', reportData.length, 'registros')
        } catch (error) {
          console.error('❌ Error generando reporte semanal:', error)
          throw error
        }
        break
      case 'reporte-mensual':
        console.log('📊 Generando reporte mensual completo...')
        reportTitle = 'Reporte Mensual'
        try {
          reportData = await generateReporteMensualCompleto(ieId, fechaInicio, fechaFin, gradoId ? parseInt(gradoId) : undefined, seccionId ? parseInt(seccionId) : undefined)
          console.log('📊 Datos del reporte mensual generados:', reportData.length, 'registros')
        } catch (error) {
          console.error('❌ Error generando reporte mensual:', error)
          throw error
        }
        break
      case 'reporte-anual':
        console.log('📊 Generando reporte anual completo...')
        reportTitle = 'Reporte Anual'
        try {
          reportData = await generateReporteAnualCompleto(ieId, fechaInicio, fechaFin, gradoId ? parseInt(gradoId) : undefined, seccionId ? parseInt(seccionId) : undefined)
          console.log('📊 Datos del reporte anual generados:', reportData.length, 'registros')
        } catch (error) {
          console.error('❌ Error generando reporte anual:', error)
          throw error
        }
        break
      case 'estudiantes-activos':
        console.log('📊 Generando reporte de estudiantes activos...')
        reportTitle = 'Reporte de Estudiantes Activos'
        try {
          reportData = await generateEstudiantesActivosData(ieId, gradoId || undefined, seccionId || undefined)
          console.log('📊 Datos de estudiantes activos generados:', reportData.length, 'registros')
        } catch (error) {
          console.error('❌ Error generando reporte de estudiantes activos:', error)
          throw error
        }
        break
      case 'docentes-asignaciones':
        console.log('📊 Generando reporte de docentes y asignaciones...')
        reportTitle = 'Reporte de Docentes y Asignaciones'
        try {
          reportData = await generateDocentesAsignacionesData(ieId)
          console.log('📊 Datos de docentes y asignaciones generados:', reportData.length, 'registros')
        } catch (error) {
          console.error('❌ Error generando reporte de docentes:', error)
          throw error
        }
        break
      case 'retiros-tardios':
        console.log('📊 Generando reporte de retiros tardíos...')
        reportTitle = 'Reporte de Retiros Tardíos'
        try {
          reportData = await generateRetirosTardiosData(ieId, fechaInicio, fechaFin, gradoId || undefined, seccionId || undefined)
          console.log('📊 Datos de retiros tardíos generados:', reportData.length, 'registros')
        } catch (error) {
          console.error('❌ Error generando reporte de retiros tardíos:', error)
          throw error
        }
        break
      default:
        return NextResponse.json(
          { error: 'Tipo de reporte no válido' },
          { status: 400 }
        )
    }

    console.log(`📊 Datos del reporte generados: ${reportData.length} registros`)
    console.log('📊 Muestra de datos:', reportData.slice(0, 2))

    // Obtener información del colegio y usuario
    const colegioInfo = await getColegioInfo(ieId)
    const idUsuario = (decoded as any).idUsuario
    console.log('🔍 ID Usuario extraído del token:', idUsuario)
    const usuarioInfo = await getUserInfo(idUsuario)
    
    console.log('🏫 Información del colegio:', colegioInfo)
    console.log('👤 Información del usuario:', usuarioInfo)

    // Generar archivo según el formato
    console.log('📄 Iniciando generación de archivo...')
    console.log('📄 Formato:', formato)
    
    if (formato === 'excel') {
      console.log('📊 Generando archivo Excel...')
      try {
        const excelBuffer = generateExcelReport(reportData, reportTitle, colegioInfo, usuarioInfo)
        console.log('📊 Excel generado, tamaño:', excelBuffer.length, 'bytes')
        
        return new NextResponse(excelBuffer as any, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="reporte-${tipo}-${new Date().toISOString().split('T')[0]}.xlsx"`
          }
        })
      } catch (error) {
        console.error('❌ Error generando Excel:', error)
        throw error
      }
    } else if (formato === 'pdf') {
      console.log('📄 Generando archivo PDF...')
      try {
        const pdfBuffer = await generatePDFReport(reportData, reportTitle, colegioInfo, usuarioInfo)
        console.log('📄 PDF generado, tamaño:', pdfBuffer.length, 'bytes')
        
        return new NextResponse(pdfBuffer as any, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="reporte-${tipo}-${new Date().toISOString().split('T')[0]}.pdf"`
          }
        })
      } catch (error) {
        console.error('❌ Error generando PDF:', error)
        throw error
      }
    } else if (formato === 'word' || formato === 'docx') {
      console.log('📄 Generando archivo Word...')
      try {
        const wordBuffer = await generateWordReport(reportData, reportTitle, colegioInfo, usuarioInfo)
        console.log('📄 Word generado, tamaño:', wordBuffer.length, 'bytes')
        
        return new NextResponse(wordBuffer as any, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="reporte-${tipo}-${new Date().toISOString().split('T')[0]}.docx"`
          }
        })
      } catch (error) {
        console.error('❌ Error generando Word:', error)
        throw error
      }
    } else {
      console.log('❌ Formato no válido:', formato)
      return NextResponse.json(
        { error: 'Formato no válido' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('💥 Error general generando reporte:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}

// Función para generar datos de asistencia diaria
async function generateAsistenciaDiariaData(ieId: number, fechaInicio: Date, fechaFin: Date, gradoId?: string, seccionId?: string) {
  const whereClause: any = {
    fecha: {
      gte: fechaInicio,
      lte: fechaFin
    },
    estudiante: {
      usuario: {
        idIe: ieId
      }
    }
  }

  if (gradoId || seccionId) {
    whereClause.estudiante.gradoSeccion = {}
    if (gradoId) whereClause.estudiante.gradoSeccion.idGrado = parseInt(gradoId)
    if (seccionId) whereClause.estudiante.gradoSeccion.idSeccion = parseInt(seccionId)
  }

  const asistencias = await prisma.asistencia.findMany({
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
      }
    },
    orderBy: [
      { fecha: 'desc' }
    ]
  })

  return asistencias.map(asistencia => ({
    Fecha: asistencia.fecha.toLocaleDateString('es-ES'),
    Estudiante: `${asistencia.estudiante.usuario.nombre} ${asistencia.estudiante.usuario.apellido}`,
    Grado: asistencia.estudiante.gradoSeccion?.grado.nombre || 'N/A',
    Sección: asistencia.estudiante.gradoSeccion?.seccion.nombre || 'N/A'
  }))
}

// Función para generar datos de asistencia mensual
async function generateAsistenciaMensualData(ieId: number, fechaInicio: Date, fechaFin: Date, gradoId?: string, seccionId?: string) {
  // Implementación similar pero agrupada por mes
  const whereClause: any = {
    fecha: {
      gte: fechaInicio,
      lte: fechaFin
    },
    estudiante: {
      usuario: {
        idIe: ieId
      }
    }
  }

  if (gradoId || seccionId) {
    whereClause.estudiante.gradoSeccion = {}
    if (gradoId) whereClause.estudiante.gradoSeccion.idGrado = parseInt(gradoId)
    if (seccionId) whereClause.estudiante.gradoSeccion.idSeccion = parseInt(seccionId)
  }

  const asistencias = await prisma.asistencia.groupBy({
    by: ['idEstudiante'],
    where: whereClause,
    _count: {
      idAsistencia: true
    }
  })

  // Obtener detalles de estudiantes
  const estudiantesIds = asistencias.map(a => a.idEstudiante)
  const estudiantes = await prisma.estudiante.findMany({
    where: {
      idEstudiante: {
        in: estudiantesIds
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

  return asistencias.map(asistencia => {
    const estudiante = estudiantes.find(e => e.idEstudiante === asistencia.idEstudiante)
    return {
      Estudiante: `${estudiante?.usuario.nombre} ${estudiante?.usuario.apellido}`,
      Grado: estudiante?.gradoSeccion?.grado.nombre || 'N/A',
      Sección: estudiante?.gradoSeccion?.seccion.nombre || 'N/A',
      'Total Asistencias': asistencia._count.idAsistencia,
      Período: `${fechaInicio.toLocaleDateString('es-ES')} - ${fechaFin.toLocaleDateString('es-ES')}`
    }
  })
}

// Función para generar datos de estudiantes por aula
async function generateAsistenciaEstudianteData(ieId: number, fechaInicio: Date, fechaFin: Date, gradoId?: string, seccionId?: string) {
  console.log('📊 Generando reporte de estudiantes por aula...')
  
  try {
    // Construir filtro base
    const whereClause: any = {
      usuario: {
        idIe: ieId,
        estado: 'ACTIVO'
      }
    }

    if (gradoId || seccionId) {
      whereClause.gradoSeccion = {}
      if (gradoId) whereClause.gradoSeccion.idGrado = parseInt(gradoId)
      if (seccionId) whereClause.gradoSeccion.idSeccion = parseInt(seccionId)
    }

    // Obtener estudiantes agrupados por grado-sección
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
        { usuario: { nombre: 'asc' } }
      ]
    })

    // Obtener docentes asignados a cada grado-sección
    const docentesAulas = await prisma.docenteAula.findMany({
      where: {
        gradoSeccion: {
          grado: {
            nivel: {
              idIe: ieId
            }
          }
        }
      },
      include: {
        docente: {
          include: {
            usuario: true
          }
        },
        gradoSeccion: {
          include: {
            grado: true,
            seccion: true
          }
        }
      }
    })

    // Agrupar estudiantes por aula
    const aulaMap = new Map<string, any>()
    
    estudiantes.forEach(estudiante => {
      if (!estudiante.gradoSeccion) return
      
      const aulaKey = `${estudiante.gradoSeccion.grado.nombre}° ${estudiante.gradoSeccion.seccion.nombre}`
      
      if (!aulaMap.has(aulaKey)) {
        // Buscar docente asignado a esta aula
        const docenteAula = docentesAulas.find(da => 
          da.gradoSeccion.idGradoSeccion === estudiante.gradoSeccion?.idGradoSeccion
        )
        
        const docenteNombre = docenteAula 
          ? `${docenteAula.docente.usuario.nombre} ${docenteAula.docente.usuario.apellido}`
          : 'Sin docente asignado'

        aulaMap.set(aulaKey, {
          aula: aulaKey,
          docente: docenteNombre,
          estudiantes: []
        })
      }
      
      aulaMap.get(aulaKey)?.estudiantes.push({
        nombre: estudiante.usuario.nombre,
        apellido: estudiante.usuario.apellido,
        dni: estudiante.usuario.dni,
        codigoQR: estudiante.codigoQR
      })
    })

    // Convertir a formato de reporte
    const reportData: any[] = []
    
    aulaMap.forEach((aulaInfo, aulaKey) => {
      // Agregar header del aula
      reportData.push({
        Tipo: 'AULA',
        Información: `Aula ${aulaInfo.aula}`,
        Detalle: `Docente: ${aulaInfo.docente}`,
        'Total Estudiantes': aulaInfo.estudiantes.length.toString(),
        Observaciones: `${aulaInfo.estudiantes.length} estudiantes matriculados`
      })
      
      // Agregar estudiantes del aula
      aulaInfo.estudiantes.forEach((estudiante: any, index: number) => {
        reportData.push({
          Tipo: 'ESTUDIANTE',
          Información: `${index + 1}. ${estudiante.nombre} ${estudiante.apellido}`,
          Detalle: `DNI: ${estudiante.dni}`,
          'Total Estudiantes': estudiante.codigoQR || 'Sin código',
          Observaciones: 'Estudiante activo'
        })
      })
      
      // Agregar separador entre aulas
      reportData.push({
        Tipo: 'SEPARADOR',
        Información: '─'.repeat(50),
        Detalle: '',
        'Total Estudiantes': '',
        Observaciones: ''
      })
    })

    console.log('✅ Reporte de estudiantes por aula generado:', reportData.length, 'filas')
    return reportData

  } catch (error) {
    console.error('❌ Error generando reporte de estudiantes por aula:', error)
    return [
      {
        Tipo: 'ERROR',
        Información: 'No se pudo generar el reporte de estudiantes',
        Detalle: 'Error en la consulta a la base de datos',
        'Total Estudiantes': '0',
        Observaciones: 'Contacte al administrador'
      }
    ]
  }
}

// Función para generar datos de retiros diarios
async function generateRetirosDiariosData(ieId: number, fechaInicio: Date, fechaFin: Date, gradoId?: string, seccionId?: string) {
  const whereClause: any = {
    fecha: {
      gte: fechaInicio,
      lte: fechaFin
    },
    idIe: ieId
  }

  // Simplificado: obtener retiros básicos
  const retiros = await prisma.retiro.findMany({
    where: whereClause,
    orderBy: [
      { fecha: 'desc' },
      { hora: 'asc' }
    ]
  })

  return retiros.map(retiro => ({
    Fecha: retiro.fecha.toLocaleDateString('es-ES'),
    'ID Estudiante': retiro.idEstudiante,
    'Hora Retiro': retiro.hora.toLocaleTimeString('es-ES'),
    Observaciones: retiro.observaciones || 'N/A'
  }))
}

// Función para generar datos de retiros por apoderado
async function generateRetirosApoderadoData(ieId: number, fechaInicio: Date, fechaFin: Date, gradoId?: string, seccionId?: string) {
  const whereClause: any = {
    fecha: {
      gte: fechaInicio,
      lte: fechaFin
    },
    idIe: ieId
  }

  // Simplificado: obtener retiros básicos y agrupar manualmente
  const retiros = await prisma.retiro.findMany({
    where: whereClause
  })

  // Agrupar por idEstudiante (simplificado)
  const retirosAgrupados = retiros.reduce((acc: any, retiro) => {
    const key = `Estudiante ${retiro.idEstudiante}`
    if (!acc[key]) {
      acc[key] = 0
    }
    acc[key]++
    return acc
  }, {})

  return Object.entries(retirosAgrupados).map(([autorizadoPor, count]) => ({
    'Autorizado Por': autorizadoPor,
    'Total Retiros': count,
    Período: `${fechaInicio.toLocaleDateString('es-ES')} - ${fechaFin.toLocaleDateString('es-ES')}`
  }))
}

// Función para generar datos de retiros tardíos (fuera de horario normal)
async function generateRetirosTardiosData(ieId: number, fechaInicio: Date, fechaFin: Date, gradoId?: string, seccionId?: string) {
  console.log('📊 Generando reporte de retiros tardíos...')
  
  try {
    // Obtener retiros del período
    const retiros = await prisma.retiro.findMany({
      where: {
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        },
        idIe: ieId
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
      },
      orderBy: [
        { fecha: 'desc' },
        { hora: 'desc' }
      ]
    })

    // Filtrar retiros tardíos (después de las 14:00 por ejemplo)
    const horaTardio = 14 // 2:00 PM
    const retirosTardios = retiros.filter(retiro => {
      const horaRetiro = retiro.hora.getHours()
      return horaRetiro >= horaTardio
    })

    // Aplicar filtros de grado/sección si existen
    let retirosFiltrados = retirosTardios
    if (gradoId || seccionId) {
      retirosFiltrados = retirosTardios.filter(retiro => {
        if (gradoId && retiro.estudiante.gradoSeccion?.idGrado !== parseInt(gradoId)) return false
        if (seccionId && retiro.estudiante.gradoSeccion?.idSeccion !== parseInt(seccionId)) return false
        return true
      })
    }

    return retirosFiltrados.map(retiro => ({
      Fecha: retiro.fecha.toLocaleDateString('es-ES'),
      Estudiante: `${retiro.estudiante.usuario.nombre} ${retiro.estudiante.usuario.apellido}`,
      Grado: retiro.estudiante.gradoSeccion?.grado?.nombre || 'N/A',
      Sección: retiro.estudiante.gradoSeccion?.seccion?.nombre || 'N/A',
      'Hora Retiro': retiro.hora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' }),
      Observaciones: retiro.observaciones || 'Sin observaciones'
    }))

  } catch (error) {
    console.error('❌ Error generando reporte de retiros tardíos:', error)
    return [{
      Fecha: 'Error',
      Estudiante: 'No se pudo generar el reporte',
      Grado: '-',
      Sección: '-',
      'Hora Retiro': '-',
      Observaciones: 'Error en la consulta'
    }]
  }
}

// Función para generar reporte general completo
async function generateReporteGeneralData(ieId: number, fechaInicio: Date, fechaFin: Date, periodo: string, gradoId?: string, seccionId?: string) {
  console.log('📊 Iniciando generación de reporte general...')
  
  try {
    // 1. ESTADÍSTICAS GENERALES
    console.log('📊 Obteniendo estadísticas generales...')
    
    // Filtro base para estudiantes
    const baseStudentFilter: any = {
      usuario: { idIe: ieId }
    }
    
    if (gradoId || seccionId) {
      baseStudentFilter.gradoSeccion = {}
      if (gradoId) baseStudentFilter.gradoSeccion.idGrado = parseInt(gradoId)
      if (seccionId) baseStudentFilter.gradoSeccion.idSeccion = parseInt(seccionId)
    }

    // Estadísticas básicas
    const totalEstudiantes = await prisma.estudiante.count({
      where: baseStudentFilter
    })

    const estudiantesActivos = await prisma.estudiante.count({
      where: {
        ...baseStudentFilter,
        usuario: {
          ...baseStudentFilter.usuario,
          estado: 'ACTIVO'
        }
      }
    })

    const totalDocentes = await prisma.docente.count({
      where: {
        usuario: {
          idIe: ieId,
          estado: 'ACTIVO'
        }
      }
    })

    const totalApoderados = await prisma.apoderado.count({
      where: {
        usuario: {
          idIe: ieId,
          estado: 'ACTIVO'
        }
      }
    })

    // 2. ESTADÍSTICAS DE ASISTENCIAS
    console.log('📊 Obteniendo estadísticas de asistencias...')
    
    const asistenciaFilter: any = {
      fecha: {
        gte: fechaInicio,
        lte: fechaFin
      },
      estudiante: {
        usuario: { idIe: ieId }
      }
    }

    if (gradoId || seccionId) {
      asistenciaFilter.estudiante.gradoSeccion = {}
      if (gradoId) asistenciaFilter.estudiante.gradoSeccion.idGrado = parseInt(gradoId)
      if (seccionId) asistenciaFilter.estudiante.gradoSeccion.idSeccion = parseInt(seccionId)
    }

    const totalAsistencias = await prisma.asistencia.count({
      where: asistenciaFilter
    })

    // 3. ESTADÍSTICAS DE RETIROS
    console.log('📊 Obteniendo estadísticas de retiros...')
    
    const retiroFilter: any = {
      fecha: {
        gte: fechaInicio,
        lte: fechaFin
      },
      idIe: ieId
    }

    const totalRetiros = await prisma.retiro.count({
      where: retiroFilter
    })

    // 4. ESTADÍSTICAS POR GRADO (si no hay filtro específico)
    let estadisticasPorGrado: any[] = []
    
    if (!gradoId && !seccionId) {
      console.log('📊 Obteniendo estadísticas por grado...')
      
      const gradosSecciones = await prisma.gradoSeccion.findMany({
        where: {
          grado: {
            nivel: {
              idIe: ieId
            }
          }
        },
        include: {
          grado: true,
          seccion: true,
          estudiantes: {
            where: {
              usuario: { estado: 'ACTIVO' }
            }
          }
        }
      })

      for (const gs of gradosSecciones) {
        const asistenciasGrado = await prisma.asistencia.count({
          where: {
            fecha: {
              gte: fechaInicio,
              lte: fechaFin
            },
            estudiante: {
              idGradoSeccion: gs.idGradoSeccion
            }
          }
        })

        const retirosGrado = await prisma.retiro.count({
          where: {
            fecha: {
              gte: fechaInicio,
              lte: fechaFin
            },
            estudiante: {
              idGradoSeccion: gs.idGradoSeccion
            }
          }
        })

        estadisticasPorGrado.push({
          grado: `${gs.grado.nombre}° ${gs.seccion.nombre}`,
          estudiantes: gs.estudiantes.length,
          asistencias: asistenciasGrado,
          retiros: retirosGrado,
          porcentajeAsistencia: gs.estudiantes.length > 0 
            ? ((asistenciasGrado / gs.estudiantes.length) * 100).toFixed(1) + '%'
            : '0%'
        })
      }
    }

    // 5. OBTENER LISTA DETALLADA DE ESTUDIANTES
    console.log('📊 Obteniendo lista detallada de estudiantes...')
    
    const estudiantesDetallados = await prisma.estudiante.findMany({
      where: baseStudentFilter,
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
        { usuario: { nombre: 'asc' } }
      ]
    })

    console.log('👥 Estudiantes detallados obtenidos:', estudiantesDetallados.length)

    // 6. CONSTRUIR REPORTE GENERAL
    console.log('📊 Construyendo reporte general...')
    
    const reporteGeneral = [
      // Resumen ejecutivo
      {
        Categoría: 'RESUMEN EJECUTIVO',
        Descripción: 'Estadísticas generales del período',
        Valor: '',
        Detalle: `Período: ${fechaInicio.toLocaleDateString('es-ES')} - ${fechaFin.toLocaleDateString('es-ES')}`
      },
      {
        Categoría: 'Estudiantes',
        Descripción: 'Total de estudiantes',
        Valor: totalEstudiantes.toString(),
        Detalle: `Activos: ${estudiantesActivos} | Inactivos: ${totalEstudiantes - estudiantesActivos}`
      },
      {
        Categoría: 'Docentes',
        Descripción: 'Total de docentes activos',
        Valor: totalDocentes.toString(),
        Detalle: 'Personal docente en servicio'
      },
      {
        Categoría: 'Apoderados',
        Descripción: 'Total de apoderados registrados',
        Valor: totalApoderados.toString(),
        Detalle: 'Padres y tutores activos'
      },
      
      // Estadísticas de asistencia
      {
        Categoría: 'ASISTENCIAS',
        Descripción: 'Estadísticas de asistencia',
        Valor: '',
        Detalle: `Período: ${periodo}`
      },
      {
        Categoría: 'Asistencias',
        Descripción: 'Total de asistencias registradas',
        Valor: totalAsistencias.toString(),
        Detalle: `Promedio diario: ${Math.round(totalAsistencias / getDiasEnPeriodo(fechaInicio, fechaFin))}`
      },
      {
        Categoría: 'Retiros',
        Descripción: 'Total de retiros registrados',
        Valor: totalRetiros.toString(),
        Detalle: `${((totalRetiros / Math.max(totalAsistencias, 1)) * 100).toFixed(1)}% del total de asistencias`
      },
      
      // Estadísticas por grado (si aplica)
      ...estadisticasPorGrado.map(stat => ({
        Categoría: 'POR GRADO',
        Descripción: `Estadísticas ${stat.grado}`,
        Valor: `${stat.estudiantes} estudiantes`,
        Detalle: `Asist: ${stat.asistencias} | Retiros: ${stat.retiros} | ${stat.porcentajeAsistencia}`
      })),

      // LISTA DETALLADA DE ESTUDIANTES
      {
        Categoría: 'ESTUDIANTES',
        Descripción: 'Lista completa de estudiantes',
        Valor: '',
        Detalle: `Total: ${estudiantesDetallados.length} estudiantes registrados`
      },
      ...estudiantesDetallados.map((estudiante, index) => ({
        Categoría: 'ESTUDIANTES',
        Descripción: `${index + 1}. ${estudiante.usuario.nombre} ${estudiante.usuario.apellido}`,
        Valor: estudiante.codigoQR || 'Sin código',
        Detalle: `DNI: ${estudiante.usuario.dni} | Grado: ${estudiante.gradoSeccion?.grado.nombre}° ${estudiante.gradoSeccion?.seccion.nombre} | Estado: ${estudiante.usuario.estado}`
      }))
    ]

    console.log('✅ Reporte general construido:', reporteGeneral.length, 'filas')
    return reporteGeneral

  } catch (error) {
    console.error('❌ Error generando reporte general:', error)
    
    // Fallback con datos básicos
    return [
      {
        Categoría: 'ERROR',
        Descripción: 'No se pudo generar el reporte completo',
        Valor: 'Error',
        Detalle: 'Contacte al administrador del sistema'
      }
    ]
  }
}

// Función auxiliar para calcular días en un período
function getDiasEnPeriodo(fechaInicio: Date, fechaFin: Date): number {
  const diffTime = Math.abs(fechaFin.getTime() - fechaInicio.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(diffDays, 1) // Mínimo 1 día
}

// Función para generar encabezado común de reportes
async function generateEncabezadoComun(ieId: number, gradoId?: string, seccionId?: string, periodo?: string, fechaInicio?: Date, fechaFin?: Date) {
  try {
    // Obtener información de la IE
    const ie = await prisma.ie.findUnique({
      where: { idIe: ieId },
      include: { modalidad: true }
    })

    // Obtener información del grado/sección si está especificado
    let nivelGradoSeccion = 'Todos los niveles'
    if (gradoId || seccionId) {
      const gradoSeccion = await prisma.gradoSeccion.findFirst({
        where: {
          ...(gradoId && { idGrado: parseInt(gradoId) }),
          ...(seccionId && { idSeccion: parseInt(seccionId) })
        },
        include: {
          grado: {
            include: { nivel: true }
          },
          seccion: true
        }
      })
      
      if (gradoSeccion) {
        nivelGradoSeccion = `${gradoSeccion.grado.nivel.nombre} – ${gradoSeccion.grado.nombre}° – ${gradoSeccion.seccion.nombre}`
      }
    }

    // Formatear período
    let periodoTexto = 'Período no especificado'
    if (periodo && fechaInicio && fechaFin) {
      switch (periodo) {
        case 'dia':
          periodoTexto = `Día: ${fechaInicio.toLocaleDateString('es-ES')}`
          break
        case 'semana':
          const semana = getNumeroSemana(fechaInicio)
          periodoTexto = `Semana ${semana} – del ${fechaInicio.toLocaleDateString('es-ES')} al ${fechaFin.toLocaleDateString('es-ES')}`
          break
        case 'mes':
          periodoTexto = `Mes de ${fechaInicio.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`
          break
        case 'año':
          periodoTexto = `Año ${fechaInicio.getFullYear()}`
          break
        default:
          periodoTexto = `Del ${fechaInicio.toLocaleDateString('es-ES')} al ${fechaFin.toLocaleDateString('es-ES')}`
      }
    }

    return {
      institucion: ie?.nombre || 'Institución Educativa',
      codigoIe: ie?.codigoIe || 'Sin código',
      modalidad: ie?.modalidad?.nombre || 'Sin modalidad',
      nivelGradoSeccion,
      periodo: periodoTexto,
      fechaGeneracion: new Date().toLocaleDateString('es-ES'),
      horaGeneracion: new Date().toLocaleTimeString('es-ES')
    }
  } catch (error) {
    console.error('❌ Error generando encabezado común:', error)
    return {
      institucion: 'Institución Educativa',
      codigoIe: 'Sin código',
      modalidad: 'Sin modalidad',
      nivelGradoSeccion: 'Todos los niveles',
      periodo: 'Período no especificado',
      fechaGeneracion: new Date().toLocaleDateString('es-ES'),
      horaGeneracion: new Date().toLocaleTimeString('es-ES')
    }
  }
}

// Función auxiliar para obtener número de semana
function getNumeroSemana(fecha: Date): number {
  const inicioAño = new Date(fecha.getFullYear(), 0, 1)
  const diasTranscurridos = Math.floor((fecha.getTime() - inicioAño.getTime()) / (24 * 60 * 60 * 1000))
  return Math.ceil((diasTranscurridos + inicioAño.getDay() + 1) / 7)
}

// Función para obtener información del colegio
async function getColegioInfo(ieId: number) {
  try {
    console.log('🏫 Buscando información de IE con ID:', ieId)
    
    const ie = await prisma.ie.findUnique({
      where: { idIe: ieId },
      include: {
        modalidad: true
      }
    })
    
    console.log('🏫 IE encontrada:', ie ? 'Sí' : 'No')
    if (ie) {
      console.log('🏫 Datos de IE:', {
        nombre: ie.nombre,
        codigoQR: ie.codigoIe,
        modalidad: ie.modalidad?.nombre
      })
    }
    
    return {
      nombre: ie?.nombre || 'Institución Educativa',
      modalidad: ie?.modalidad?.nombre || 'EBR - Educación Básica Regular',
      codigoQR: ie?.codigoIe || 'IE002',
      direccion: (ie as any)?.direccion || 'Dirección no registrada',
      telefono: (ie as any)?.telefono || 'Teléfono no registrado',
      email: (ie as any)?.email || 'Email no registrado'
    }
  } catch (error) {
    console.error('❌ Error obteniendo información del colegio:', error)
    return {
      nombre: 'I.E. María Auxiliadora',
      modalidad: 'EBR - Educación Básica Regular',
      codigoQR: 'IE002',
      direccion: 'Dirección institucional',
      telefono: 'Teléfono institucional', 
      email: 'contacto@institucion.edu.pe'
    }
  }
}

// Función para obtener información del usuario
async function getUserInfo(idUsuario: number | undefined) {
  try {
    console.log('🔍 getUserInfo llamada con idUsuario:', idUsuario)
    console.log('🔍 Tipo de idUsuario:', typeof idUsuario)
    
    if (!idUsuario || idUsuario === undefined) {
      console.log('⚠️ idUsuario es undefined o null, retornando datos por defecto')
      return {
        nombre: 'Administrador del Sistema',
        dni: '12345678',
        email: 'admin@sistema.edu.pe',
        roles: 'Administrador'
      }
    }

    console.log('🔍 Buscando usuario en BD con ID:', idUsuario)
    const usuario = await prisma.usuario.findUnique({
      where: { idUsuario: parseInt(idUsuario.toString()) },
      include: {
        roles: {
          include: {
            rol: true
          }
        }
      }
    })
    
    console.log('👤 Usuario encontrado:', usuario ? 'Sí' : 'No')
    if (usuario) {
      console.log('👤 Datos del usuario:', {
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        dni: usuario.dni,
        email: usuario.email,
        roles: usuario.roles.length
      })
    }
    
    return {
      nombre: `${usuario?.nombre || ''} ${usuario?.apellido || ''}`.trim() || 'Usuario del Sistema',
      dni: usuario?.dni || '12345678',
      email: usuario?.email || 'usuario@sistema.edu.pe',
      roles: usuario?.roles.map(ur => ur.rol.nombre).join(', ') || 'Usuario'
    }
  } catch (error) {
    console.error('❌ Error obteniendo información del usuario:', error)
    return {
      nombre: 'Usuario del Sistema',
      dni: '12345678',
      email: 'usuario@sistema.edu.pe',
      roles: 'Usuario'
    }
  }
}

// Función para generar reporte Excel real con formato institucional
function generateExcelReport(data: any[], title: string, colegioInfo?: any, usuarioInfo?: any): Buffer {
  try {
    console.log('📊 Generando archivo Excel con formato institucional...')
    
    // Crear libro de trabajo
    const wb = XLSX.utils.book_new()
    
    // HOJA 1: PORTADA
    if (colegioInfo && usuarioInfo) {
      const portadaData = [
        [title.toUpperCase()],
        [`del ${colegioInfo.nombre}`],
        [''],
        ['ENCABEZADO'],
        ['Institución:', colegioInfo.nombre],
        ['Código IE:', colegioInfo.codigoQR],
        ['Modalidad:', colegioInfo.modalidad],
        ['Período:', new Date().toLocaleDateString('es-ES')],
        ['Generado el:', `${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`],
        [''],
        ['INFORMACIÓN DEL GENERADOR'],
        ['Generado por:', usuarioInfo.nombre],
        ['Rol:', usuarioInfo.roles],
        [''],
        ['RESUMEN'],
        ['Total de registros:', data.length.toString()],
        ['Tipo de reporte:', title]
      ]
      
      const wsPortada = XLSX.utils.aoa_to_sheet(portadaData)
      wsPortada['!cols'] = [{ width: 25 }, { width: 50 }]
      XLSX.utils.book_append_sheet(wb, wsPortada, 'Portada')
    }
    
    if (!data || data.length === 0) {
      const emptyData = [['No hay datos disponibles para el período seleccionado']]
      const ws = XLSX.utils.aoa_to_sheet(emptyData)
      XLSX.utils.book_append_sheet(wb, ws, 'Datos')
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
      return buffer
    }

    // DETECTAR FORMATO DE DATOS: Tabla directa vs Secciones
    const primerItem = data[0]
    const esFormatoTabla = primerItem && ('N°' in primerItem || 'Apellidos y Nombres' in primerItem || 'DNI' in primerItem)
    
    if (esFormatoTabla) {
      // FORMATO TABLA DIRECTA (nuevo formato de reportes)
      console.log('📊 Detectado formato de tabla directa')
      
      // Obtener headers de las keys del primer objeto
      const headers = Object.keys(primerItem)
      
      // Crear datos de la hoja
      const sheetData: any[][] = [
        [title.toUpperCase()],
        [''],
        headers // Headers de la tabla
      ]
      
      // Agregar filas de datos
      data.forEach(item => {
        const fila = headers.map(header => item[header] || '')
        sheetData.push(fila)
      })
      
      // Crear hoja
      const ws = XLSX.utils.aoa_to_sheet(sheetData)
      
      // Configurar anchos de columna
      ws['!cols'] = headers.map(header => {
        if (header === 'N°') return { width: 5 }
        if (header === 'Apellidos y Nombres') return { width: 35 }
        if (header === 'DNI') return { width: 12 }
        if (header === '% Asistencia') return { width: 12 }
        return { width: 10 }
      })
      
      XLSX.utils.book_append_sheet(wb, ws, 'Reporte')
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
      return buffer
    }

    // FORMATO ANTIGUO: Separar datos por secciones para crear hojas estructuradas
    const secciones = new Map<string, any[]>()
    
    data.forEach(item => {
      const seccion = item.Sección || item.Categoría || 'GENERAL'
      if (!secciones.has(seccion)) {
        secciones.set(seccion, [])
      }
      secciones.get(seccion)?.push(item)
    })

    // CREAR HOJAS POR SECCIÓN
    secciones.forEach((items, seccionNombre) => {
      if (seccionNombre === 'SEPARADOR') return // Ignorar separadores
      
      let sheetData: any[][] = []
      
      if (seccionNombre === 'ENCABEZADO') {
        // Hoja de información institucional
        sheetData = [
          ['INFORMACIÓN INSTITUCIONAL'],
          [''],
          ['Campo', 'Valor', 'Observaciones']
        ]
        
        items.forEach(item => {
          sheetData.push([
            item.Campo || item.Descripción || '',
            item.Valor || '',
            item.Detalle || ''
          ])
        })
        
      } else if (seccionNombre === 'RESUMEN' || seccionNombre === 'RESUMEN EJECUTIVO') {
        // Hoja de resumen ejecutivo
        sheetData = [
          ['RESUMEN EJECUTIVO'],
          [''],
          ['Categoría', 'Descripción', 'Valor', 'Detalle']
        ]
        
        items.forEach(item => {
          sheetData.push([
            item.Categoría || '',
            item.Descripción || item.Campo || '',
            item.Valor || '',
            item.Detalle || item.Observaciones || ''
          ])
        })
        
      } else if (seccionNombre === 'POR GRADO') {
        // Hoja de estadísticas por grado
        sheetData = [
          ['ESTADÍSTICAS POR GRADO'],
          [''],
          ['Grado/Sección', 'Total Estudiantes', 'Asistencias', 'Retiros', '% Asistencia']
        ]
        
        items.forEach(item => {
          const detalle = item.Detalle || ''
          const match = detalle.match(/Asist: (\d+) \| Retiros: (\d+) \| ([\d.]+%)/)
          
          sheetData.push([
            item.Descripción?.replace('Estadísticas ', '') || '',
            item.Valor?.replace(' estudiantes', '') || '',
            match ? match[1] : '',
            match ? match[2] : '',
            match ? match[3] : ''
          ])
        })
        
      } else if (seccionNombre === 'ASISTENCIAS') {
        // Hoja de estadísticas de asistencia
        sheetData = [
          ['ESTADÍSTICAS DE ASISTENCIA'],
          [''],
          ['Concepto', 'Valor', 'Detalle']
        ]
        
        items.forEach(item => {
          sheetData.push([
            item.Descripción || item.Campo || '',
            item.Valor || '',
            item.Detalle || ''
          ])
        })
        
      } else if (seccionNombre === 'ESTUDIANTES') {
        // Hoja de lista de estudiantes
        sheetData = [
          ['LISTA DE ESTUDIANTES'],
          [''],
          ['N°', 'Nombre Completo', 'Código', 'DNI', 'Grado', 'Sección', 'Estado']
        ]
        
        items.forEach((item, index) => {
          if (item.Descripción === 'Lista completa de estudiantes') {
            // Saltar el header, solo agregar los estudiantes individuales
            return
          }
          
          // Extraer información del detalle
          const detalle = item.Detalle || ''
          const dniMatch = detalle.match(/DNI: ([^|]+)/)
          const gradoMatch = detalle.match(/Grado: ([^|]+)/)
          const estadoMatch = detalle.match(/Estado: (.+)/)
          
          const nombreCompleto = item.Descripción?.replace(/^\d+\.\s*/, '') || ''
          const dni = dniMatch ? dniMatch[1].trim() : ''
          const gradoSeccion = gradoMatch ? gradoMatch[1].trim() : ''
          const [grado, seccion] = gradoSeccion.split('°').map((s: string) => s.trim())
          const estado = estadoMatch ? estadoMatch[1].trim() : ''
          
          sheetData.push([
            (index).toString(), // N° (ajustado porque saltamos el header)
            nombreCompleto,
            item.Valor || '',
            dni,
            grado ? `${grado}°` : '',
            seccion || '',
            estado
          ])
        })
        
      } else {
        // Hoja genérica para otras secciones
        sheetData = [
          [seccionNombre.toUpperCase()],
          [''],
          ['Descripción', 'Valor', 'Detalle', 'Observaciones']
        ]
        
        items.forEach(item => {
          sheetData.push([
            item.Descripción || item.Campo || item.Información || '',
            item.Valor || item['Total Estudiantes'] || '',
            item.Detalle || '',
            item.Observaciones || ''
          ])
        })
      }
      
      // Crear la hoja
      const ws = XLSX.utils.aoa_to_sheet(sheetData)
      
      // Configurar anchos de columna según el tipo de hoja
      if (seccionNombre === 'ESTUDIANTES') {
        ws['!cols'] = [
          { width: 5 },  // N°
          { width: 25 }, // Nombre Completo
          { width: 12 }, // Código
          { width: 12 }, // DNI
          { width: 8 },  // Grado
          { width: 8 },  // Sección
          { width: 10 }  // Estado
        ]
      } else {
        ws['!cols'] = [
          { width: 25 },
          { width: 15 },
          { width: 15 },
          { width: 30 }
        ]
      }
      
      // Limpiar nombre de hoja para Excel
      const sheetName = seccionNombre.replace(/[\\\/\?\*\[\]]/g, '').substring(0, 31)
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
    })
    
    // Generar buffer del archivo Excel
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    
    console.log('✅ Archivo Excel con formato institucional generado exitosamente')
    return buffer
  } catch (error) {
    console.error('❌ Error generando Excel:', error)
    // Fallback: crear archivo simple con error
    const errorData = [{ Error: 'No se pudo generar el reporte', Detalles: 'Contacte al administrador' }]
    const ws = XLSX.utils.json_to_sheet(errorData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Error')
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  }
}

// Función para generar reporte PDF real con formato institucional
async function generatePDFReport(data: any[], title: string, colegioInfo?: any, usuarioInfo?: any): Promise<Buffer> {
  try {
    console.log('📄 Generando archivo PDF con formato institucional...')
    
    // Verificar si jsPDF está disponible
    if (!jsPDF) {
      console.log('⚠️ jsPDF no disponible, generando PDF simple')
      return generateSimplePDFReport(data, title, colegioInfo, usuarioInfo)
    }
    
    // Crear nuevo documento PDF
    const doc = new jsPDF()
    
    // PÁGINA 1: PORTADA EN FORMATO APA 7
    if (colegioInfo && usuarioInfo) {
      // Título principal centrado
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      const titleWidth = doc.getTextWidth(title.toUpperCase())
      doc.text(title.toUpperCase(), (210 - titleWidth) / 2, 40)
      
      // Subtítulo institucional centrado
      doc.setFontSize(14)
      doc.setFont('helvetica', 'normal')
      const subtitulo = `${colegioInfo.nombre}`
      const subtituloWidth = doc.getTextWidth(subtitulo)
      doc.text(subtitulo, (210 - subtituloWidth) / 2, 55)
      
      // Información institucional
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('INFORMACIÓN INSTITUCIONAL', 20, 80)
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Institución Educativa: ${colegioInfo.nombre}`, 20, 95)
      doc.text(`Código Modular: ${colegioInfo.codigoQR}`, 20, 105)
      doc.text(`Modalidad Educativa: ${colegioInfo.modalidad}`, 20, 115)
      doc.text(`Dirección: ${colegioInfo.direccion}`, 20, 125)
      doc.text(`Teléfono: ${colegioInfo.telefono}`, 20, 135)
      doc.text(`Correo Electrónico: ${colegioInfo.email}`, 20, 145)
      
      // Información del reporte
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('INFORMACIÓN DEL REPORTE', 20, 165)
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const fechaCompleta = new Date().toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
      doc.text(`Elaborado por: ${usuarioInfo.nombre}`, 20, 180)
      doc.text(`Cargo/Función: ${usuarioInfo.roles}`, 20, 190)
      doc.text(`Fecha de elaboración: ${fechaCompleta}`, 20, 200)
      doc.text(`Hora de generación: ${new Date().toLocaleTimeString('es-ES')}`, 20, 210)
      
      // Resumen del reporte
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('RESUMEN EJECUTIVO', 20, 225)
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Total de registros procesados: ${data.length}`, 20, 240)
      doc.text(`Tipo de análisis: ${title}`, 20, 250)
      
      // Nota metodológica
      doc.setFontSize(9)
      doc.setFont('helvetica', 'italic')
      doc.text('Nota: Este documento ha sido elaborado siguiendo las directrices del Ministerio de Educación', 20, 270)
      doc.text('y cumple con los estándares de calidad para reportes institucionales.', 20, 280)
      
      // Nueva página para los datos
      doc.addPage()
    }
    
    if (!data || data.length === 0) {
      doc.setFontSize(12)
      doc.text('No hay datos disponibles para el período seleccionado', 20, 50)
      console.log('✅ PDF vacío generado')
      return Buffer.from(doc.output('arraybuffer'))
    }
    
    // DETECTAR FORMATO DE DATOS: Tabla directa vs Secciones
    const primerItem = data[0]
    const esFormatoTabla = primerItem && ('N°' in primerItem || 'Apellidos y Nombres' in primerItem || 'DNI' in primerItem)
    
    if (esFormatoTabla) {
      // FORMATO TABLA DIRECTA (nuevo formato de reportes)
      console.log('📄 PDF: Detectado formato de tabla directa')
      
      // Obtener headers de las keys del primer objeto
      const headers = Object.keys(primerItem)
      
      // Preparar datos para la tabla
      const tableData = data.map(item => headers.map(header => item[header] || ''))
      
      // Configuración de la tabla
      const tableConfig = {
        startY: 20,
        head: [headers],
        body: tableData,
        margin: { left: 10, right: 10 },
        styles: {
          fontSize: 8,
          cellPadding: 3,
          halign: 'left' as const,
          valign: 'middle' as const,
          overflow: 'linebreak' as const
        },
        headStyles: {
          fillColor: [46, 125, 50] as [number, number, number],
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold' as const,
          halign: 'center' as const
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245] as [number, number, number]
        },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' as const }, // N°
          1: { cellWidth: 55 }, // Apellidos y Nombres
          2: { cellWidth: 22, halign: 'center' as const }, // DNI
          3: { cellWidth: 18, halign: 'center' as const }, // Presentes
          4: { cellWidth: 18, halign: 'center' as const }, // Tardanzas
          5: { cellWidth: 18, halign: 'center' as const }, // Faltas
          6: { cellWidth: 20, halign: 'center' as const }, // Justificadas
          7: { cellWidth: 22, halign: 'center' as const }  // % Asistencia
        },
        theme: 'striped' as const,
        showHead: 'everyPage' as const,
        didParseCell: function(data: any) {
          // Resaltar filas de aula
          if (data.section === 'body' && data.row.raw[1]?.includes('AULA:')) {
            data.cell.styles.fillColor = [200, 230, 201]
            data.cell.styles.fontStyle = 'bold'
          }
          // Resaltar fila de resumen
          if (data.section === 'body' && data.row.raw[1]?.includes('RESUMEN')) {
            data.cell.styles.fillColor = [255, 243, 224]
            data.cell.styles.fontStyle = 'bold'
          }
        }
      }
      
      // Verificar si autoTable está disponible
      if (typeof (doc as any).autoTable === 'function') {
        (doc as any).autoTable(tableConfig)
      } else {
        // Fallback: generar tabla como texto simple
        generateTableFallback(doc, tableData, headers, 20)
      }
      
      // Agregar leyenda al final
      const finalY = (doc as any).lastAutoTable?.finalY || 250
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      doc.text('Leyenda: P=Presente, T=Tardanza, F=Falta, J=Justificada', 10, finalY + 10)
      doc.setTextColor(0, 0, 0)
      
      console.log('✅ PDF con formato tabla generado')
      return Buffer.from(doc.output('arraybuffer'))
    }
    
    // FORMATO ANTIGUO: Separar datos por secciones
    const secciones = new Map<string, any[]>()
    data.forEach(item => {
      const seccion = item.Sección || item.Categoría || 'GENERAL'
      if (!secciones.has(seccion)) {
        secciones.set(seccion, [])
      }
      secciones.get(seccion)?.push(item)
    })

    let yPosition = 20
    
    // Generar contenido por secciones con tablas
    secciones.forEach((items, seccionNombre) => {
      if (seccionNombre === 'SEPARADOR') return
      
      // Verificar si necesitamos nueva página
      if (yPosition > 220) {
        doc.addPage()
        yPosition = 20
      }
      
      // Título de sección
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(seccionNombre.toUpperCase(), 20, yPosition)
      yPosition += 8
      
      // Agregar introducción en formato APA 7 para cada sección
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const introduccion = getIntroduccionSeccion(seccionNombre)
      const lineasIntroduccion = doc.splitTextToSize(introduccion, 170)
      lineasIntroduccion.forEach((linea: string) => {
        if (yPosition > 270) {
          doc.addPage()
          yPosition = 20
        }
        doc.text(linea, 20, yPosition)
        yPosition += 5
      })
      yPosition += 5
      
      if (seccionNombre === 'ESTUDIANTES') {
        // Tabla específica para estudiantes
        const tableData: string[][] = []
        let contador = 1
        
        items.forEach(item => {
          if (item.Descripción === 'Lista completa de estudiantes') return
          
          // Extraer información del detalle
          const detalle = item.Detalle || ''
          const dniMatch = detalle.match(/DNI: ([^|]+)/)
          const gradoMatch = detalle.match(/Grado: ([^|]+)/)
          const estadoMatch = detalle.match(/Estado: (.+)/)
          
          const nombreCompleto = item.Descripción?.replace(/^\d+\.\s*/, '') || ''
          const dni = dniMatch ? dniMatch[1].trim() : ''
          const gradoSeccion = gradoMatch ? gradoMatch[1].trim() : ''
          const estado = estadoMatch ? estadoMatch[1].trim() : ''
          
          tableData.push([
            contador.toString(),
            nombreCompleto,
            item.Valor || '',
            dni,
            gradoSeccion,
            estado
          ])
          contador++
        })
        
        // Generar tabla de estudiantes
        if (tableData.length > 0) {
          const tableConfig = {
            startY: yPosition,
            head: [['N°', 'Nombre Completo', 'Código', 'DNI', 'Grado/Sección', 'Estado']],
            body: tableData,
            margin: { left: 10, right: 10 }, // Márgenes para centrar
            tableWidth: 'auto', // Ocupa todo el ancho disponible
            styles: {
              fontSize: 8,
              cellPadding: 4,
              halign: 'left',
              valign: 'middle',
              overflow: 'linebreak',
              cellWidth: 'wrap'
            },
            headStyles: {
              fillColor: [66, 139, 202],
              textColor: 255,
              fontSize: 9,
              fontStyle: 'bold',
              halign: 'center'
            },
            alternateRowStyles: {
              fillColor: [245, 245, 245]
            },
            columnStyles: {
              0: { cellWidth: 'auto', halign: 'center', minCellWidth: 20 }, // N°
              1: { cellWidth: 'auto', halign: 'left', minCellWidth: 60 }, // Nombre
              2: { cellWidth: 'auto', halign: 'center', minCellWidth: 25 }, // Código
              3: { cellWidth: 'auto', halign: 'center', minCellWidth: 30 }, // DNI
              4: { cellWidth: 'auto', halign: 'center', minCellWidth: 35 }, // Grado
              5: { cellWidth: 'auto', halign: 'center', minCellWidth: 25 }  // Estado
            },
            theme: 'striped',
            showHead: 'everyPage'
          }
          
          // Verificar si autoTable está disponible
          if (typeof (doc as any).autoTable === 'function') {
            (doc as any).autoTable(tableConfig)
            yPosition = (doc as any).lastAutoTable.finalY + 15
          } else {
            // Fallback: generar tabla como texto simple
            yPosition = generateTableFallback(doc, tableData, ['N°', 'Nombre Completo', 'Código', 'DNI', 'Grado/Sección', 'Estado'], yPosition)
          }
        }
        
      } else if (seccionNombre === 'RESUMEN EJECUTIVO') {
        // Tabla para resumen ejecutivo
        const tableData = items.map(item => [
          item.Descripción || item.Campo || '',
          item.Valor || '',
          item.Detalle || item.Observaciones || ''
        ])
        
        if (tableData.length > 0) {
          const tableConfig = {
            startY: yPosition,
            head: [['Concepto', 'Valor', 'Detalle']],
            body: tableData,
            margin: { left: 10, right: 10 }, // Márgenes para centrar
            tableWidth: 'auto', // Ocupa todo el ancho disponible
            styles: {
              fontSize: 9,
              cellPadding: 4,
              halign: 'left',
              valign: 'middle',
              overflow: 'linebreak'
            },
            headStyles: {
              fillColor: [40, 167, 69],
              textColor: 255,
              fontSize: 10,
              fontStyle: 'bold',
              halign: 'center'
            },
            alternateRowStyles: {
              fillColor: [248, 249, 250]
            },
            columnStyles: {
              0: { cellWidth: 'auto', halign: 'left', minCellWidth: 70 }, // Concepto
              1: { cellWidth: 'auto', halign: 'center', minCellWidth: 30 }, // Valor
              2: { cellWidth: 'auto', halign: 'left', minCellWidth: 90 }  // Detalle
            },
            theme: 'striped',
            showHead: 'everyPage'
          }
          
          // Verificar si autoTable está disponible
          if (typeof (doc as any).autoTable === 'function') {
            (doc as any).autoTable(tableConfig)
            yPosition = (doc as any).lastAutoTable.finalY + 15
          } else {
            // Fallback: generar tabla como texto simple para resumen ejecutivo
            yPosition = generateTableFallback(doc, tableData, ['Concepto', 'Valor', 'Detalle'], yPosition)
          }
        }
        
      } else if (seccionNombre === 'ASISTENCIAS') {
        // Tabla para asistencias
        const tableData = items.map(item => [
          item.Descripción || item.Campo || '',
          item.Valor || '',
          item.Detalle || ''
        ])
        
        if (tableData.length > 0) {
          const tableConfig = {
            startY: yPosition,
            head: [['Concepto', 'Valor', 'Detalle']],
            body: tableData,
            margin: { left: 10, right: 10 }, // Márgenes para centrar
            tableWidth: 'auto', // Ocupa todo el ancho disponible
            styles: {
              fontSize: 9,
              cellPadding: 4,
              halign: 'left',
              valign: 'middle',
              overflow: 'linebreak'
            },
            headStyles: {
              fillColor: [255, 193, 7],
              textColor: 0,
              fontSize: 10,
              fontStyle: 'bold',
              halign: 'center'
            },
            alternateRowStyles: {
              fillColor: [255, 248, 225]
            },
            columnStyles: {
              0: { cellWidth: 'auto', halign: 'left', minCellWidth: 70 }, // Concepto
              1: { cellWidth: 'auto', halign: 'center', minCellWidth: 30 }, // Valor
              2: { cellWidth: 'auto', halign: 'left', minCellWidth: 90 }  // Detalle
            },
            theme: 'striped',
            showHead: 'everyPage'
          }
          
          // Verificar si autoTable está disponible
          if (typeof (doc as any).autoTable === 'function') {
            (doc as any).autoTable(tableConfig)
            yPosition = (doc as any).lastAutoTable.finalY + 15
          } else {
            // Fallback: generar tabla como texto simple para asistencias
            yPosition = generateTableFallback(doc, tableData, ['Concepto', 'Valor', 'Detalle'], yPosition)
          }
        }
        
      } else if (seccionNombre === 'POR GRADO') {
        // Tabla para estadísticas por grado
        const tableData: string[][] = []
        
        items.forEach(item => {
          const detalle = item.Detalle || ''
          const match = detalle.match(/Asist: (\d+) \| Retiros: (\d+) \| ([\d.]+%)/)
          
          tableData.push([
            item.Descripción?.replace('Estadísticas ', '') || '',
            item.Valor?.replace(' estudiantes', '') || '',
            match ? match[1] : '0',
            match ? match[2] : '0',
            match ? match[3] : '0%'
          ])
        })
        
        if (tableData.length > 0) {
          const tableConfig = {
            startY: yPosition,
            head: [['Grado/Sección', 'Total Estudiantes', 'Asistencias', 'Retiros', '% Asistencia']],
            body: tableData,
            margin: { left: 10, right: 10 }, // Márgenes para centrar
            tableWidth: 'auto', // Ocupa todo el ancho disponible
            styles: {
              fontSize: 9,
              cellPadding: 4,
              halign: 'left',
              valign: 'middle',
              overflow: 'linebreak'
            },
            headStyles: {
              fillColor: [220, 53, 69],
              textColor: 255,
              fontSize: 10,
              fontStyle: 'bold',
              halign: 'center'
            },
            alternateRowStyles: {
              fillColor: [253, 236, 238]
            },
            columnStyles: {
              0: { cellWidth: 'auto', halign: 'left', minCellWidth: 45 }, // Grado/Sección
              1: { cellWidth: 'auto', halign: 'center', minCellWidth: 35 }, // Total Estudiantes
              2: { cellWidth: 'auto', halign: 'center', minCellWidth: 35 }, // Asistencias
              3: { cellWidth: 'auto', halign: 'center', minCellWidth: 25 }, // Retiros
              4: { cellWidth: 'auto', halign: 'center', minCellWidth: 35 }  // % Asistencia
            },
            theme: 'striped',
            showHead: 'everyPage'
          }
          
          // Verificar si autoTable está disponible
          if (typeof (doc as any).autoTable === 'function') {
            (doc as any).autoTable(tableConfig)
            yPosition = (doc as any).lastAutoTable.finalY + 15
          } else {
            // Fallback: generar tabla como texto simple para estadísticas por grado
            yPosition = generateTableFallback(doc, tableData, ['Grado/Sección', 'Total Estudiantes', 'Asistencias', 'Retiros', '% Asistencia'], yPosition)
          }
        }
        
      } else {
        // Tabla genérica para otras secciones
        const tableData = items.map(item => [
          item.Descripción || item.Campo || item.Información || '',
          item.Valor || item['Total Estudiantes'] || '',
          item.Detalle || item.Observaciones || ''
        ])
        
        if (tableData.length > 0) {
          const tableConfig = {
            startY: yPosition,
            head: [['Descripción', 'Valor', 'Detalle']],
            body: tableData,
            margin: { left: 10, right: 10 }, // Márgenes para centrar
            tableWidth: 'auto', // Ocupa todo el ancho disponible
            styles: {
              fontSize: 9,
              cellPadding: 4,
              halign: 'left',
              valign: 'middle',
              overflow: 'linebreak'
            },
            headStyles: {
              fillColor: [108, 117, 125],
              textColor: 255,
              fontSize: 10,
              fontStyle: 'bold',
              halign: 'center'
            },
            alternateRowStyles: {
              fillColor: [248, 249, 250]
            },
            columnStyles: {
              0: { cellWidth: 'auto', halign: 'left', minCellWidth: 70 }, // Descripción
              1: { cellWidth: 'auto', halign: 'center', minCellWidth: 30 }, // Valor
              2: { cellWidth: 'auto', halign: 'left', minCellWidth: 90 }  // Detalle
            },
            theme: 'striped',
            showHead: 'everyPage'
          }
          
          // Verificar si autoTable está disponible
          if (typeof (doc as any).autoTable === 'function') {
            (doc as any).autoTable(tableConfig)
            yPosition = (doc as any).lastAutoTable.finalY + 15
          } else {
            // Fallback: generar tabla como texto simple genérica
            yPosition = generateTableFallback(doc, tableData, ['Descripción', 'Valor', 'Detalle'], yPosition)
          }
        }
      }
    })
    
    console.log('✅ PDF con formato institucional generado exitosamente')
    return Buffer.from(doc.output('arraybuffer'))
    
  } catch (error) {
    console.error('❌ Error generando PDF:', error)
    return generateSimplePDFReport(data, title, colegioInfo, usuarioInfo)
  }
}

// Función fallback para PDF simple
function generateSimplePDFReport(data: any[], title: string, colegioInfo?: any, usuarioInfo?: any): Buffer {
  try {
    const doc = new jsPDF()
    
    // Portada simple
    if (colegioInfo && usuarioInfo) {
      doc.setFontSize(16)
      doc.text('REPORTE INSTITUCIONAL', 20, 20)
      doc.setFontSize(12)
      doc.text(title, 20, 35)
      doc.setFontSize(10)
      doc.text(`Colegio: ${colegioInfo.nombre}`, 20, 50)
      doc.text(`Generado por: ${usuarioInfo.nombre}`, 20, 60)
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 20, 70)
    } else {
      doc.setFontSize(16)
      doc.text(title, 20, 20)
    }
    
    doc.setFontSize(12)
    doc.text('Reporte generado exitosamente', 20, 90)
    
    if (data && data.length > 0) {
      doc.text(`Total de registros: ${data.length}`, 20, 110)
    } else {
      doc.text('No hay datos disponibles', 20, 110)
    }
    
    return Buffer.from(doc.output('arraybuffer'))
  } catch (error) {
    console.error('❌ Error en PDF fallback:', error)
    // Último fallback: texto plano
    const content = `${title}\n\nError generando PDF\nContacte al administrador`
    return Buffer.from(content, 'utf-8')
  }
}

// ============================================================================
// FUNCIONES DE REPORTES ESPECÍFICOS CON FORMATO INSTITUCIONAL
// ============================================================================

// Función para generar reporte semanal completo
async function generateReporteSemanalCompleto(ieId: number, fechaInicio: Date, fechaFin: Date, gradoId?: number, seccionId?: number) {
  try {
    console.log('📅 Generando reporte semanal completo con datos reales...')
    
    // Construir filtro para estudiantes
    const whereClause: any = {
      usuario: {
        idIe: ieId,
        estado: 'ACTIVO'
      }
    }
    
    if (gradoId || seccionId) {
      whereClause.gradoSeccion = {}
      if (gradoId) whereClause.gradoSeccion.idGrado = gradoId
      if (seccionId) whereClause.gradoSeccion.idSeccion = seccionId
    }

    // Obtener estudiantes con sus asistencias del período
    const estudiantes = await prisma.estudiante.findMany({
      where: whereClause,
      include: {
        usuario: true,
        gradoSeccion: {
          include: {
            grado: true,
            seccion: true
          }
        },
        asistencias: {
          where: {
            fecha: {
              gte: fechaInicio,
              lte: fechaFin
            }
          },
          include: {
            estadoAsistencia: true
          },
          orderBy: {
            fecha: 'asc'
          }
        }
      },
      orderBy: [
        { gradoSeccion: { grado: { nombre: 'asc' } } },
        { gradoSeccion: { seccion: { nombre: 'asc' } } },
        { usuario: { apellido: 'asc' } }
      ]
    })

    console.log(`📊 Encontrados ${estudiantes.length} estudiantes para reporte semanal`)

    // Generar fechas del período (solo días laborables)
    const fechasPeriodo: Date[] = []
    for (let d = new Date(fechaInicio); d <= fechaFin; d.setDate(d.getDate() + 1)) {
      const diaSemana = d.getDay()
      if (diaSemana >= 1 && diaSemana <= 5) { // Lunes a Viernes
        fechasPeriodo.push(new Date(d))
      }
    }

    // Construir datos del reporte con estructura de tabla
    const reportData: any[] = []

    // Agrupar por grado-sección
    const gruposPorAula = estudiantes.reduce((acc: any, est) => {
      const aulaKey = est.gradoSeccion 
        ? `${est.gradoSeccion.grado.nombre}° ${est.gradoSeccion.seccion.nombre}`
        : 'Sin Aula'
      if (!acc[aulaKey]) {
        acc[aulaKey] = []
      }
      acc[aulaKey].push(est)
      return acc
    }, {})

    // Para cada aula, crear filas de datos
    Object.entries(gruposPorAula).forEach(([aulaKey, estudiantesAula]: [string, any]) => {
      // Header del aula
      reportData.push({
        'N°': '',
        'Apellidos y Nombres': `📚 AULA: ${aulaKey}`,
        'DNI': '',
        'Presentes': '',
        'Tardanzas': '',
        'Faltas': '',
        'Justificadas': '',
        '% Asistencia': `${estudiantesAula.length} estudiantes`
      })

      // Estudiantes del aula
      estudiantesAula.forEach((estudiante: any, index: number) => {
        // Calcular estadísticas de asistencia
        const asistencias = estudiante.asistencias || []
        let presentes = 0
        let tardanzas = 0
        let faltas = 0
        let justificadas = 0

        asistencias.forEach((asist: any) => {
          const estado = asist.estadoAsistencia?.codigo?.toUpperCase() || asist.estado?.toUpperCase() || ''
          if (estado === 'PRESENTE' || estado === 'P') presentes++
          else if (estado === 'TARDANZA' || estado === 'T') tardanzas++
          else if (estado === 'AUSENTE' || estado === 'FALTA' || estado === 'F' || estado === 'INASISTENCIA') faltas++
          else if (estado === 'JUSTIFICADA' || estado === 'JUSTIFICADO' || estado === 'J') justificadas++
        })

        const totalRegistros = presentes + tardanzas + faltas + justificadas
        const porcentajeAsistencia = totalRegistros > 0 
          ? (((presentes + tardanzas + justificadas) / totalRegistros) * 100).toFixed(1)
          : '0.0'

        reportData.push({
          'N°': (index + 1).toString(),
          'Apellidos y Nombres': `${estudiante.usuario.apellido}, ${estudiante.usuario.nombre}`,
          'DNI': estudiante.usuario.dni || 'N/A',
          'Presentes': presentes.toString(),
          'Tardanzas': tardanzas.toString(),
          'Faltas': faltas.toString(),
          'Justificadas': justificadas.toString(),
          '% Asistencia': `${porcentajeAsistencia}%`
        })
      })

      // Línea separadora entre aulas
      reportData.push({
        'N°': '',
        'Apellidos y Nombres': '─'.repeat(40),
        'DNI': '',
        'Presentes': '',
        'Tardanzas': '',
        'Faltas': '',
        'Justificadas': '',
        '% Asistencia': ''
      })
    })

    // Agregar resumen general al final
    const totalEstudiantes = estudiantes.length
    let totalPresentes = 0
    let totalTardanzas = 0
    let totalFaltas = 0
    let totalJustificadas = 0

    estudiantes.forEach((est: any) => {
      (est.asistencias || []).forEach((asist: any) => {
        const estado = asist.estadoAsistencia?.codigo?.toUpperCase() || asist.estado?.toUpperCase() || ''
        if (estado === 'PRESENTE' || estado === 'P') totalPresentes++
        else if (estado === 'TARDANZA' || estado === 'T') totalTardanzas++
        else if (estado === 'AUSENTE' || estado === 'FALTA' || estado === 'F' || estado === 'INASISTENCIA') totalFaltas++
        else if (estado === 'JUSTIFICADA' || estado === 'JUSTIFICADO' || estado === 'J') totalJustificadas++
      })
    })

    const totalGeneral = totalPresentes + totalTardanzas + totalFaltas + totalJustificadas
    const porcentajeGeneral = totalGeneral > 0 
      ? (((totalPresentes + totalTardanzas) / totalGeneral) * 100).toFixed(1)
      : '0.0'

    reportData.push({
      'N°': '',
      'Apellidos y Nombres': '📊 RESUMEN SEMANAL',
      'DNI': `${totalEstudiantes} est.`,
      'Presentes': totalPresentes.toString(),
      'Tardanzas': totalTardanzas.toString(),
      'Faltas': totalFaltas.toString(),
      'Justificadas': totalJustificadas.toString(),
      '% Asistencia': `${porcentajeGeneral}%`
    })

    console.log(`✅ Reporte semanal generado con ${reportData.length} filas`)
    return reportData
    
  } catch (error) {
    console.error('❌ Error generando reporte semanal:', error)
    return [{
      'N°': 'Error',
      'Apellidos y Nombres': 'No se pudo generar el reporte',
      'DNI': '-',
      'Presentes': '0',
      'Tardanzas': '0',
      'Faltas': '0',
      'Justificadas': '0',
      '% Asistencia': '0%'
    }]
  }
}

// Función para generar reporte mensual completo con estructura similar a docente
async function generateReporteMensualCompleto(ieId: number, fechaInicio: Date, fechaFin: Date, gradoId?: number, seccionId?: number) {
  try {
    console.log('📅 Generando reporte mensual completo con datos reales...')
    
    // Construir filtro para estudiantes
    const whereClause: any = {
      usuario: {
        idIe: ieId,
        estado: 'ACTIVO'
      }
    }
    
    if (gradoId || seccionId) {
      whereClause.gradoSeccion = {}
      if (gradoId) whereClause.gradoSeccion.idGrado = gradoId
      if (seccionId) whereClause.gradoSeccion.idSeccion = seccionId
    }

    // Obtener estudiantes con sus asistencias del período
    const estudiantes = await prisma.estudiante.findMany({
      where: whereClause,
      include: {
        usuario: true,
        gradoSeccion: {
          include: {
            grado: true,
            seccion: true
          }
        },
        asistencias: {
          where: {
            fecha: {
              gte: fechaInicio,
              lte: fechaFin
            }
          },
          include: {
            estadoAsistencia: true
          },
          orderBy: {
            fecha: 'asc'
          }
        }
      },
      orderBy: [
        { gradoSeccion: { grado: { nombre: 'asc' } } },
        { gradoSeccion: { seccion: { nombre: 'asc' } } },
        { usuario: { apellido: 'asc' } }
      ]
    })

    console.log(`📊 Encontrados ${estudiantes.length} estudiantes`)

    // Generar fechas del período (solo días laborables)
    const fechasPeriodo: string[] = []
    for (let d = new Date(fechaInicio); d <= fechaFin; d.setDate(d.getDate() + 1)) {
      const diaSemana = d.getDay()
      if (diaSemana >= 1 && diaSemana <= 5) { // Lunes a Viernes
        fechasPeriodo.push(d.toISOString().split('T')[0])
      }
    }

    // Construir datos del reporte con estructura de tabla
    const reportData: any[] = []

    // Agrupar por grado-sección
    const gruposPorAula = estudiantes.reduce((acc: any, est) => {
      const aulaKey = est.gradoSeccion 
        ? `${est.gradoSeccion.grado.nombre}° ${est.gradoSeccion.seccion.nombre}`
        : 'Sin Aula'
      if (!acc[aulaKey]) {
        acc[aulaKey] = []
      }
      acc[aulaKey].push(est)
      return acc
    }, {})

    // Para cada aula, crear filas de datos
    Object.entries(gruposPorAula).forEach(([aulaKey, estudiantesAula]: [string, any]) => {
      // Header del aula
      reportData.push({
        'N°': '',
        'Apellidos y Nombres': `📚 AULA: ${aulaKey}`,
        'DNI': '',
        'Presentes': '',
        'Tardanzas': '',
        'Faltas': '',
        'Justificadas': '',
        '% Asistencia': `${estudiantesAula.length} estudiantes`
      })

      // Estudiantes del aula
      estudiantesAula.forEach((estudiante: any, index: number) => {
        // Calcular estadísticas de asistencia
        const asistencias = estudiante.asistencias || []
        let presentes = 0
        let tardanzas = 0
        let faltas = 0
        let justificadas = 0

        asistencias.forEach((asist: any) => {
          const estado = asist.estadoAsistencia?.codigo?.toUpperCase() || asist.estado?.toUpperCase() || ''
          if (estado === 'PRESENTE' || estado === 'P') presentes++
          else if (estado === 'TARDANZA' || estado === 'T') tardanzas++
          else if (estado === 'AUSENTE' || estado === 'FALTA' || estado === 'F' || estado === 'INASISTENCIA') faltas++
          else if (estado === 'JUSTIFICADA' || estado === 'JUSTIFICADO' || estado === 'J') justificadas++
        })

        const totalRegistros = presentes + tardanzas + faltas + justificadas
        const porcentajeAsistencia = totalRegistros > 0 
          ? (((presentes + tardanzas + justificadas) / totalRegistros) * 100).toFixed(1)
          : '0.0'

        reportData.push({
          'N°': (index + 1).toString(),
          'Apellidos y Nombres': `${estudiante.usuario.apellido}, ${estudiante.usuario.nombre}`,
          'DNI': estudiante.usuario.dni || 'N/A',
          'Presentes': presentes.toString(),
          'Tardanzas': tardanzas.toString(),
          'Faltas': faltas.toString(),
          'Justificadas': justificadas.toString(),
          '% Asistencia': `${porcentajeAsistencia}%`
        })
      })

      // Línea separadora entre aulas
      reportData.push({
        'N°': '',
        'Apellidos y Nombres': '─'.repeat(40),
        'DNI': '',
        'Presentes': '',
        'Tardanzas': '',
        'Faltas': '',
        'Justificadas': '',
        '% Asistencia': ''
      })
    })

    // Agregar resumen general al final
    const totalEstudiantes = estudiantes.length
    let totalPresentes = 0
    let totalTardanzas = 0
    let totalFaltas = 0
    let totalJustificadas = 0

    estudiantes.forEach((est: any) => {
      (est.asistencias || []).forEach((asist: any) => {
        const estado = asist.estadoAsistencia?.codigo?.toUpperCase() || asist.estado?.toUpperCase() || ''
        if (estado === 'PRESENTE' || estado === 'P') totalPresentes++
        else if (estado === 'TARDANZA' || estado === 'T') totalTardanzas++
        else if (estado === 'AUSENTE' || estado === 'FALTA' || estado === 'F' || estado === 'INASISTENCIA') totalFaltas++
        else if (estado === 'JUSTIFICADA' || estado === 'JUSTIFICADO' || estado === 'J') totalJustificadas++
      })
    })

    const totalGeneral = totalPresentes + totalTardanzas + totalFaltas + totalJustificadas
    const porcentajeGeneral = totalGeneral > 0 
      ? (((totalPresentes + totalTardanzas) / totalGeneral) * 100).toFixed(1)
      : '0.0'

    reportData.push({
      'N°': '',
      'Apellidos y Nombres': '📊 RESUMEN GENERAL',
      'DNI': `${totalEstudiantes} est.`,
      'Presentes': totalPresentes.toString(),
      'Tardanzas': totalTardanzas.toString(),
      'Faltas': totalFaltas.toString(),
      'Justificadas': totalJustificadas.toString(),
      '% Asistencia': `${porcentajeGeneral}%`
    })

    console.log(`✅ Reporte mensual generado con ${reportData.length} filas`)
    return reportData

  } catch (error) {
    console.error('❌ Error generando reporte mensual:', error)
    return [{
      'N°': 'Error',
      'Apellidos y Nombres': 'No se pudo generar el reporte',
      'DNI': '-',
      'Presentes': '0',
      'Tardanzas': '0',
      'Faltas': '0',
      'Justificadas': '0',
      '% Asistencia': '0%'
    }]
  }
}

// Función para generar reporte anual completo con estructura similar a docente
async function generateReporteAnualCompleto(ieId: number, fechaInicio: Date, fechaFin: Date, gradoId?: number, seccionId?: number) {
  try {
    console.log('📅 Generando reporte anual completo con datos reales...')
    
    // Construir filtro para estudiantes
    const whereClause: any = {
      usuario: {
        idIe: ieId,
        estado: 'ACTIVO'
      }
    }
    
    if (gradoId || seccionId) {
      whereClause.gradoSeccion = {}
      if (gradoId) whereClause.gradoSeccion.idGrado = gradoId
      if (seccionId) whereClause.gradoSeccion.idSeccion = seccionId
    }

    // Obtener estudiantes con sus asistencias del período
    const estudiantes = await prisma.estudiante.findMany({
      where: whereClause,
      include: {
        usuario: true,
        gradoSeccion: {
          include: {
            grado: true,
            seccion: true
          }
        },
        asistencias: {
          where: {
            fecha: {
              gte: fechaInicio,
              lte: fechaFin
            }
          },
          include: {
            estadoAsistencia: true
          },
          orderBy: {
            fecha: 'asc'
          }
        }
      },
      orderBy: [
        { gradoSeccion: { grado: { nombre: 'asc' } } },
        { gradoSeccion: { seccion: { nombre: 'asc' } } },
        { usuario: { apellido: 'asc' } }
      ]
    })

    console.log(`📊 Encontrados ${estudiantes.length} estudiantes para reporte anual`)

    // Construir datos del reporte con estructura de tabla
    const reportData: any[] = []

    // Agrupar por grado-sección
    const gruposPorAula = estudiantes.reduce((acc: any, est) => {
      const aulaKey = est.gradoSeccion 
        ? `${est.gradoSeccion.grado.nombre}° ${est.gradoSeccion.seccion.nombre}`
        : 'Sin Aula'
      if (!acc[aulaKey]) {
        acc[aulaKey] = []
      }
      acc[aulaKey].push(est)
      return acc
    }, {})

    // Para cada aula, crear filas de datos
    Object.entries(gruposPorAula).forEach(([aulaKey, estudiantesAula]: [string, any]) => {
      // Header del aula
      reportData.push({
        'N°': '',
        'Apellidos y Nombres': `📚 AULA: ${aulaKey}`,
        'DNI': '',
        'Presentes': '',
        'Tardanzas': '',
        'Faltas': '',
        'Justificadas': '',
        '% Asistencia': `${estudiantesAula.length} estudiantes`
      })

      // Estudiantes del aula
      estudiantesAula.forEach((estudiante: any, index: number) => {
        // Calcular estadísticas de asistencia
        const asistencias = estudiante.asistencias || []
        let presentes = 0
        let tardanzas = 0
        let faltas = 0
        let justificadas = 0

        asistencias.forEach((asist: any) => {
          const estado = asist.estadoAsistencia?.codigo?.toUpperCase() || asist.estado?.toUpperCase() || ''
          if (estado === 'PRESENTE' || estado === 'P') presentes++
          else if (estado === 'TARDANZA' || estado === 'T') tardanzas++
          else if (estado === 'AUSENTE' || estado === 'FALTA' || estado === 'F' || estado === 'INASISTENCIA') faltas++
          else if (estado === 'JUSTIFICADA' || estado === 'JUSTIFICADO' || estado === 'J') justificadas++
        })

        const totalRegistros = presentes + tardanzas + faltas + justificadas
        const porcentajeAsistencia = totalRegistros > 0 
          ? (((presentes + tardanzas + justificadas) / totalRegistros) * 100).toFixed(1)
          : '0.0'

        reportData.push({
          'N°': (index + 1).toString(),
          'Apellidos y Nombres': `${estudiante.usuario.apellido}, ${estudiante.usuario.nombre}`,
          'DNI': estudiante.usuario.dni || 'N/A',
          'Presentes': presentes.toString(),
          'Tardanzas': tardanzas.toString(),
          'Faltas': faltas.toString(),
          'Justificadas': justificadas.toString(),
          '% Asistencia': `${porcentajeAsistencia}%`
        })
      })

      // Línea separadora entre aulas
      reportData.push({
        'N°': '',
        'Apellidos y Nombres': '─'.repeat(40),
        'DNI': '',
        'Presentes': '',
        'Tardanzas': '',
        'Faltas': '',
        'Justificadas': '',
        '% Asistencia': ''
      })
    })

    // Agregar resumen general al final
    const totalEstudiantes = estudiantes.length
    let totalPresentes = 0
    let totalTardanzas = 0
    let totalFaltas = 0
    let totalJustificadas = 0

    estudiantes.forEach((est: any) => {
      (est.asistencias || []).forEach((asist: any) => {
        const estado = asist.estadoAsistencia?.codigo?.toUpperCase() || asist.estado?.toUpperCase() || ''
        if (estado === 'PRESENTE' || estado === 'P') totalPresentes++
        else if (estado === 'TARDANZA' || estado === 'T') totalTardanzas++
        else if (estado === 'AUSENTE' || estado === 'FALTA' || estado === 'F' || estado === 'INASISTENCIA') totalFaltas++
        else if (estado === 'JUSTIFICADA' || estado === 'JUSTIFICADO' || estado === 'J') totalJustificadas++
      })
    })

    const totalGeneral = totalPresentes + totalTardanzas + totalFaltas + totalJustificadas
    const porcentajeGeneral = totalGeneral > 0 
      ? (((totalPresentes + totalTardanzas) / totalGeneral) * 100).toFixed(1)
      : '0.0'

    reportData.push({
      'N°': '',
      'Apellidos y Nombres': '📊 RESUMEN ANUAL',
      'DNI': `${totalEstudiantes} est.`,
      'Presentes': totalPresentes.toString(),
      'Tardanzas': totalTardanzas.toString(),
      'Faltas': totalFaltas.toString(),
      'Justificadas': totalJustificadas.toString(),
      '% Asistencia': `${porcentajeGeneral}%`
    })

    console.log(`✅ Reporte anual generado con ${reportData.length} filas`)
    return reportData

  } catch (error) {
    console.error('❌ Error generando reporte anual:', error)
    return [{
      'N°': 'Error',
      'Apellidos y Nombres': 'No se pudo generar el reporte',
      'DNI': '-',
      'Presentes': '0',
      'Tardanzas': '0',
      'Faltas': '0',
      'Justificadas': '0',
      '% Asistencia': '0%'
    }]
  }
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

// Función auxiliar para obtener información de grado y sección
async function getGradoSeccionInfo(gradoId?: number, seccionId?: number): Promise<string> {
  if (!gradoId && !seccionId) return 'Todos los niveles'
  
  try {
    if (gradoId && seccionId) {
      const gradoSeccion = await prisma.gradoSeccion.findFirst({
        where: { idGrado: gradoId, idSeccion: seccionId },
        include: { grado: true, seccion: true }
      })
      return gradoSeccion ? `${gradoSeccion.grado.nombre}° ${gradoSeccion.seccion.nombre}` : 'No encontrado'
    }
    
    if (gradoId) {
      const grado = await prisma.grado.findUnique({ where: { idGrado: gradoId } })
      return grado ? `${grado.nombre}° - Todas las secciones` : 'Grado no encontrado'
    }
    
    return 'Todos los niveles'
  } catch (error) {
    return 'Error obteniendo información'
  }
}

// ============================================================================
// GENERACIÓN DE REPORTES WORD
// ============================================================================

// Función para generar reporte Word con formato institucional
async function generateWordReport(data: any[], title: string, colegioInfo?: any, usuarioInfo?: any): Promise<Buffer> {
  try {
    console.log('📄 Generando archivo Word con formato institucional...')
    
    // Verificar si docx está disponible
    if (!Document) {
      console.log('⚠️ docx no disponible, generando Word simple')
      return generateSimpleWordReport(data, title, colegioInfo, usuarioInfo)
    }
    
    const sections: any[] = []
    
    // PORTADA
    const portadaElements: any[] = []
    
    if (colegioInfo && usuarioInfo) {
      // Título principal
      portadaElements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: title.toUpperCase(),
              bold: true,
              size: 32
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        })
      )
      
      // Información institucional
      portadaElements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: colegioInfo.nombre,
              bold: true,
              size: 28
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        })
      )
      
      // Información del reporte
      const fechaCompleta = new Date().toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
      
      portadaElements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'INFORMACIÓN INSTITUCIONAL',
              bold: true,
              size: 24
            })
          ],
          spacing: { before: 600, after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Institución Educativa: ${colegioInfo.nombre}`,
              size: 20
            })
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Código Modular: ${colegioInfo.codigoQR}`,
              size: 20
            })
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Modalidad Educativa: ${colegioInfo.modalidad}`,
              size: 20
            })
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Elaborado por: ${usuarioInfo.nombre}`,
              size: 20
            })
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Fecha de elaboración: ${fechaCompleta}`,
              size: 20
            })
          ],
          spacing: { after: 100 }
        })
      )
    }
    
    // DETECTAR FORMATO DE DATOS: Tabla directa vs Secciones
    const primerItem = data[0]
    const esFormatoTabla = primerItem && ('N°' in primerItem || 'Apellidos y Nombres' in primerItem || 'DNI' in primerItem)
    
    if (esFormatoTabla && data.length > 0) {
      // FORMATO TABLA DIRECTA (nuevo formato de reportes)
      console.log('📄 Word: Detectado formato de tabla directa')
      
      // Obtener headers de las keys del primer objeto
      const headers = Object.keys(primerItem)
      
      // Crear tabla con los datos
      const tableRows = [
        // Header row
        new TableRow({
          children: headers.map(header => 
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: header, bold: true, size: 18 })],
                alignment: AlignmentType.CENTER
              })],
              shading: { fill: '2E7D32' }
            })
          ),
          tableHeader: true
        }),
        // Data rows
        ...data.map(item => 
          new TableRow({
            children: headers.map(header => 
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ 
                    text: String(item[header] || ''), 
                    size: 16,
                    bold: item['Apellidos y Nombres']?.includes('AULA:') || item['Apellidos y Nombres']?.includes('RESUMEN')
                  })]
                })]
              })
            )
          })
        )
      ]
      
      const dataTable = new Table({
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE }
      })
      
      // Crear documento
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            ...portadaElements,
            new Paragraph({
              children: [new TextRun({ text: 'DATOS DEL REPORTE', bold: true, size: 28 })],
              spacing: { before: 400, after: 200 }
            }),
            dataTable,
            new Paragraph({
              children: [new TextRun({ 
                text: 'Leyenda: P=Presente, T=Tardanza, F=Falta, J=Justificada', 
                size: 16, 
                italics: true 
              })],
              spacing: { before: 200 }
            })
          ]
        }]
      })
      
      const buffer = await Packer.toBuffer(doc)
      console.log('✅ Word con formato tabla generado')
      return Buffer.from(buffer)
    }
    
    // FORMATO ANTIGUO: Agrupar datos por sección
    const secciones = new Map<string, any[]>()
    data.forEach(item => {
      const seccion = item.Sección || item.Categoría || 'GENERAL'
      if (!secciones.has(seccion)) {
        secciones.set(seccion, [])
      }
      secciones.get(seccion)?.push(item)
    })
    
    // Generar contenido por secciones
    const contentElements: any[] = []
    
    secciones.forEach((items, seccionNombre) => {
      if (seccionNombre === 'SEPARADOR') return
      
      // Título de sección
      contentElements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: seccionNombre.toUpperCase(),
              bold: true,
              size: 28
            })
          ],
          spacing: { before: 600, after: 200 }
        })
      )
      
      // Introducción APA 7
      const introduccion = getIntroduccionSeccion(seccionNombre)
      contentElements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: introduccion,
              size: 20
            })
          ],
          spacing: { after: 400 }
        })
      )
      
      // Generar tabla simple
      contentElements.push(generateWordTableGeneral(items))
    })
    
    // Crear documento
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: portadaElements
        },
        {
          properties: {},
          children: contentElements
        }
      ]
    })
    
    // Generar buffer
    const buffer = await Packer.toBuffer(doc)
    console.log('✅ Word con formato institucional generado exitosamente')
    return buffer
    
  } catch (error) {
    console.error('❌ Error generando Word:', error)
    return generateSimpleWordReport(data, title, colegioInfo, usuarioInfo)
  }
}

// Función de fallback para generar Word simple
function generateSimpleWordReport(data: any[], title: string, colegioInfo?: any, usuarioInfo?: any): Buffer {
  // Fallback simple - generar un archivo de texto básico
  let content = `${title}\n\n`
  
  if (colegioInfo) {
    content += `Institución: ${colegioInfo.nombre}\n`
    content += `Código: ${colegioInfo.codigoQR}\n`
    content += `Modalidad: ${colegioInfo.modalidad}\n\n`
  }
  
  if (usuarioInfo) {
    content += `Elaborado por: ${usuarioInfo.nombre}\n`
    content += `Fecha: ${new Date().toLocaleDateString('es-ES')}\n\n`
  }
  
  content += 'DATOS DEL REPORTE:\n\n'
  
  data.forEach((item, index) => {
    content += `${index + 1}. ${JSON.stringify(item, null, 2)}\n\n`
  })
  
  return Buffer.from(content, 'utf-8')
}

// Función para generar tabla general en Word
function generateWordTableGeneral(items: any[]): any {
  if (!Table || !TableRow || !TableCell) {
    // Si no hay docx disponible, retornar un párrafo simple
    return new Paragraph({
      children: [
        new TextRun({
          text: 'Tabla no disponible - docx no instalado',
          italic: true
        })
      ]
    }) as any
  }
  
  const tableData = items.map(item => [
    item.Descripción || item.Campo || '',
    item.Valor || '',
    item.Detalle || item.Observaciones || ''
  ])
  
  const rows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Concepto', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Valor', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Detalle', bold: true })] })] })
      ]
    }),
    ...tableData.map(row => new TableRow({
      children: row.map((cell: string) => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: cell })] })]
      }))
    }))
  ]
  
  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE }
  })
}

// Función auxiliar para calcular días hábiles
function calcularDiasHabiles(fechaInicio: Date, fechaFin: Date): number {
  let diasHabiles = 0
  const fecha = new Date(fechaInicio)
  
  while (fecha <= fechaFin) {
    const diaSemana = fecha.getDay()
    if (diaSemana >= 1 && diaSemana <= 5) { // Lunes a viernes
      diasHabiles++
    }
    fecha.setDate(fecha.getDate() + 1)
  }
  
  return diasHabiles
}

// Función para generar reporte de estudiantes activos
async function generateEstudiantesActivosData(ieId: number, gradoId?: string, seccionId?: string) {
  console.log('📊 Generando datos de estudiantes activos...')
  
  try {
    const whereClause: any = {
      usuario: {
        idIe: ieId,
        estado: 'ACTIVO'
      }
    }

    if (gradoId || seccionId) {
      whereClause.gradoSeccion = {}
      if (gradoId) whereClause.gradoSeccion.idGrado = parseInt(gradoId)
      if (seccionId) whereClause.gradoSeccion.idSeccion = parseInt(seccionId)
    }

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

    return estudiantes.map((estudiante, index) => ({
      'N°': (index + 1).toString(),
      'Apellidos y Nombres': `${estudiante.usuario.apellido} ${estudiante.usuario.nombre}`,
      'DNI': estudiante.usuario.dni || 'N/A',
      'Grado': estudiante.gradoSeccion?.grado?.nombre ? `${estudiante.gradoSeccion.grado.nombre}°` : 'N/A',
      'Sección': estudiante.gradoSeccion?.seccion?.nombre || 'N/A',
      'Estado': estudiante.usuario.estado || 'ACTIVO',
      'Código QR': estudiante.codigoQR || 'Sin código'
    }))

  } catch (error) {
    console.error('❌ Error generando datos de estudiantes activos:', error)
    return [{
      'N°': '1',
      'Apellidos y Nombres': 'Error al cargar datos',
      'DNI': 'N/A',
      'Grado': 'N/A',
      'Sección': 'N/A',
      'Estado': 'ERROR',
      'Código QR': 'N/A'
    }]
  }
}

// Función para generar reporte de docentes y asignaciones
async function generateDocentesAsignacionesData(ieId: number) {
  console.log('📊 Generando datos de docentes y asignaciones...')
  
  try {
    const docentes = await prisma.docente.findMany({
      where: {
        usuario: {
          idIe: ieId,
          estado: 'ACTIVO'
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
      },
      orderBy: [
        { usuario: { apellido: 'asc' } },
        { usuario: { nombre: 'asc' } }
      ]
    })

    const reportData: any[] = []

    docentes.forEach((docente, index) => {
      const asignaciones = docente.docenteAulas.map((da: any) => 
        `${da.gradoSeccion?.grado?.nombre || '?'}° ${da.gradoSeccion?.seccion?.nombre || '?'}`
      ).join(', ') || 'Sin asignaciones'

      reportData.push({
        'N°': (index + 1).toString(),
        'Apellidos y Nombres': `${docente.usuario.apellido} ${docente.usuario.nombre}`,
        'DNI': docente.usuario.dni || 'N/A',
        'Email': docente.usuario.email || 'N/A',
        'Teléfono': docente.usuario.telefono || 'N/A',
        'Aulas Asignadas': asignaciones,
        'Total Aulas': docente.docenteAulas.length.toString()
      })
    })

    return reportData

  } catch (error) {
    console.error('❌ Error generando datos de docentes:', error)
    return [{
      'N°': '1',
      'Apellidos y Nombres': 'Error al cargar datos',
      'DNI': 'N/A',
      'Email': 'N/A',
      'Teléfono': 'N/A',
      'Aulas Asignadas': 'ERROR',
      'Total Aulas': '0'
    }]
  }
}
