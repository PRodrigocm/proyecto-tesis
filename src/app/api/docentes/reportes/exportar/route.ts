import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType } from 'docx'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// POST /api/docentes/reportes/exportar - Exportar reportes en diferentes formatos
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Verificar que sea docente o administrador
    if (!['DOCENTE', 'ADMINISTRATIVO'].includes(decoded.rol)) {
      return NextResponse.json({ error: 'No tienes permisos para exportar reportes' }, { status: 403 })
    }

    const body = await request.json()
    const { formato, datos, configuracion } = body

    if (!formato || !datos) {
      return NextResponse.json({ 
        error: 'Formato y datos son requeridos' 
      }, { status: 400 })
    }

    console.log('📄 Exportando reporte en formato:', formato)

    // Generar contenido según el formato
    let buffer: Buffer
    let mimeType: string
    let extension: string
    let filename: string

    const fechaActual = new Date().toISOString().split('T')[0]
    const tipoReporte = datos.metadatos?.tipoReporte || 'reporte'
    
    switch (formato.toLowerCase()) {
      case 'pdf':
        buffer = await generarPDF(datos, configuracion)
        mimeType = 'application/pdf'
        extension = 'pdf'
        filename = `reporte_${tipoReporte}_${fechaActual}.pdf`
        break
        
      case 'excel':
        buffer = await generarExcel(datos, configuracion)
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        extension = 'xlsx'
        filename = `reporte_${tipoReporte}_${fechaActual}.xlsx`
        break
        
      case 'word':
        buffer = await generarWord(datos, configuracion)
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        extension = 'docx'
        filename = `reporte_${tipoReporte}_${fechaActual}.docx`
        break
        
      default:
        return NextResponse.json({ 
          error: 'Formato no soportado. Use: pdf, excel, word' 
        }, { status: 400 })
    }

    // Convertir buffer a base64 para envío
    const contenidoBase64 = buffer.toString('base64')

    return NextResponse.json({
      success: true,
      data: {
        filename,
        mimeType,
        extension,
        contenido: contenidoBase64,
        size: buffer.length
      }
    })

  } catch (error) {
    console.error('❌ Error al exportar reporte:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

// Función para generar PDF con formato similar al auxiliar
async function generarPDF(datos: any, configuracion: any): Promise<Buffer> {
  const { metadatos, resumenEjecutivo, estudiantes } = datos
  
  // Crear documento PDF en orientación vertical para la portada
  const doc = new jsPDF('portrait', 'mm', 'a4')
  
  // ===== PÁGINA 1: PORTADA Y RESUMEN =====
  doc.setFont('helvetica')
  
  // Título principal
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('REPORTE DE ASISTENCIAS', 105, 30, { align: 'center' })
  doc.setFontSize(14)
  doc.text(metadatos.tipoReporte.toUpperCase(), 105, 40, { align: 'center' })
  
  // Línea decorativa
  doc.setDrawColor(46, 125, 50)
  doc.setLineWidth(1)
  doc.line(20, 45, 190, 45)
  
  // Información institucional
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  let yPos = 55
  doc.text(metadatos.institucion.nombre, 105, yPos, { align: 'center' })
  yPos += 7
  if (metadatos.institucion.direccion) {
    doc.setFontSize(10)
    doc.text(metadatos.institucion.direccion, 105, yPos, { align: 'center' })
    yPos += 6
  }
  
  // Información del generador
  yPos += 10
  doc.setFontSize(10)
  doc.text(`Generado por: ${metadatos.generadoPor.nombre}`, 20, yPos)
  yPos += 6
  if (metadatos.generadoPor.especialidad) {
    doc.text(`Especialidad: ${metadatos.generadoPor.especialidad}`, 20, yPos)
    yPos += 6
  }
  doc.text(`Fecha de generación: ${new Date(metadatos.fechaGeneracion).toLocaleDateString('es-ES')}`, 20, yPos)
  yPos += 6
  doc.text(`Período: ${new Date(metadatos.fechaInicio).toLocaleDateString('es-ES')} - ${new Date(metadatos.fechaFin).toLocaleDateString('es-ES')}`, 20, yPos)
  
  // Resumen ejecutivo
  yPos += 15
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('RESUMEN EJECUTIVO', 20, yPos)
  
  yPos += 8
  
  // Tabla de estadísticas
  const estadisticas = [
    ['Total de estudiantes evaluados', resumenEjecutivo.totalEstudiantes.toString()],
    ['Total de registros de asistencia', resumenEjecutivo.totalAsistencias.toString()],
    ['Total de retiros registrados', resumenEjecutivo.totalRetiros.toString()],
    ['Presentes', `${resumenEjecutivo.estadisticasAsistencia.presente} (${resumenEjecutivo.porcentajes.asistencia}%)`],
    ['Tardanzas', `${resumenEjecutivo.estadisticasAsistencia.tardanza} (${resumenEjecutivo.porcentajes.tardanzas}%)`],
    ['Inasistencias', `${resumenEjecutivo.estadisticasAsistencia.inasistencia} (${resumenEjecutivo.porcentajes.inasistencias}%)`],
    ['Justificadas', resumenEjecutivo.estadisticasAsistencia.justificada.toString()]
  ]
  
  autoTable(doc, {
    startY: yPos,
    head: [['Métrica', 'Valor']],
    body: estadisticas,
    theme: 'striped',
    styles: { fontSize: 9, font: 'helvetica' },
    headStyles: { fillColor: [46, 125, 50], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 50, halign: 'center' }
    }
  })
  
  // ===== PÁGINAS DE DETALLE: TABLAS EN LANDSCAPE =====
  if (estudiantes.length > 0) {
    // Agrupar estudiantes por grado y sección
    const aulaGroups = estudiantes.reduce((groups: any, estudiante: any) => {
      const aulaKey = `${estudiante.grado}° ${estudiante.seccion}`
      if (!groups[aulaKey]) {
        groups[aulaKey] = {
          grado: estudiante.grado,
          seccion: estudiante.seccion,
          nivel: estudiante.nivel,
          estudiantes: []
        }
      }
      groups[aulaKey].estudiantes.push(estudiante)
      return groups
    }, {})
    
    // Obtener fechas del período (solo días laborables: lunes a viernes)
    const fechasPeriodo: Date[] = []
    const fechaInicio = new Date(metadatos.fechaInicio)
    const fechaFin = new Date(metadatos.fechaFin)
    for (let d = new Date(fechaInicio); d <= fechaFin; d.setDate(d.getDate() + 1)) {
      const diaSemana = d.getDay()
      // Solo incluir días laborables (lunes=1 a viernes=5)
      if (diaSemana >= 1 && diaSemana <= 5) {
        fechasPeriodo.push(new Date(d))
      }
    }
    
    // Para cada aula, crear una nueva página en landscape
    Object.entries(aulaGroups).forEach(([aulaKey, aula]: [string, any]) => {
      // Nueva página en LANDSCAPE para la tabla de asistencia
      doc.addPage('a4', 'landscape')
      
      // Título del aula
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(`Grado y sección: ${aulaKey}`, 15, 15)
      
      // Información del período
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      const mesNombre = fechasPeriodo.length > 0 
        ? fechasPeriodo[0].toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()
        : ''
      doc.text(`${mesNombre} • ${fechasPeriodo.length} días laborables`, 15, 22)
      
      // Headers: Apellidos y nombre + todas las fechas del mes (L, M, X, J, V, S, D)
      const headers = ['Apellidos y nombre']
      fechasPeriodo.forEach(fecha => {
        const dias = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
        const dia = dias[fecha.getDay()]
        const numero = fecha.getDate().toString().padStart(2, '0')
        headers.push(`${dia}${numero}`)
      })
      
      // Datos de estudiantes
      const estudiantesData = aula.estudiantes.map((estudiante: any) => {
        const fila = [`${estudiante.apellido}, ${estudiante.nombre}`]
        
        fechasPeriodo.forEach(fecha => {
          const fechaStr = fecha.toISOString().split('T')[0]
          const asistencia = estudiante.asistencias?.find(
            (a: any) => a.fecha?.split('T')[0] === fechaStr
          )
          
          if (asistencia) {
            switch (asistencia.estado?.toUpperCase()) {
              case 'PRESENTE': fila.push('X'); break
              case 'TARDANZA': fila.push('T'); break
              case 'AUSENTE':
              case 'INASISTENCIA': fila.push('F'); break
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
      
      // Calcular ancho de columnas dinámicamente
      const pageWidth = 277 // A4 landscape width in mm minus margins
      const nombreColWidth = 50
      const fechaColWidth = Math.min(8, (pageWidth - nombreColWidth) / fechasPeriodo.length)
      
      const columnStyles: any = { 0: { cellWidth: nombreColWidth, fontStyle: 'bold' } }
      fechasPeriodo.forEach((_, idx) => {
        columnStyles[idx + 1] = { cellWidth: fechaColWidth, halign: 'center' }
      })
      
      // Tabla de asistencia
      autoTable(doc, {
        startY: 28,
        head: [headers],
        body: estudiantesData,
        theme: 'grid',
        styles: { 
          fontSize: 7, 
          cellPadding: 1,
          font: 'helvetica',
          overflow: 'hidden'
        },
        headStyles: { 
          fillColor: [46, 125, 50], 
          textColor: 255, 
          fontSize: 6,
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles,
        didParseCell: function(data) {
          // Colorear celdas según el estado
          if (data.section === 'body' && data.column.index > 0) {
            const value = data.cell.text[0]
            if (value === 'X') {
              data.cell.styles.textColor = [46, 125, 50] // Verde
              data.cell.styles.fontStyle = 'bold'
            } else if (value === 'T') {
              data.cell.styles.textColor = [255, 152, 0] // Naranja
              data.cell.styles.fontStyle = 'bold'
            } else if (value === 'F') {
              data.cell.styles.textColor = [244, 67, 54] // Rojo
              data.cell.styles.fontStyle = 'bold'
            } else if (value === 'J') {
              data.cell.styles.textColor = [33, 150, 243] // Azul
              data.cell.styles.fontStyle = 'bold'
            } else {
              data.cell.styles.textColor = [200, 200, 200] // Gris claro
            }
          }
        }
      })
      
      // Leyenda al final de la tabla
      const finalY = (doc as any).lastAutoTable.finalY + 5
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      doc.text('Leyenda: X=Presente, T=Tardanza, F=Falta, J=Justificada', 15, finalY)
      doc.setTextColor(0, 0, 0)
    })
  }
  
  // Sección de Justificaciones Detalladas
  const justificaciones = estudiantes.flatMap((estudiante: any) => 
    (estudiante.asistencias || [])
      .filter((asistencia: any) => asistencia.estado === 'JUSTIFICADA')
      .map((justificacion: any) => ({
        estudiante: `${estudiante.nombre} ${estudiante.apellido}`,
        dni: estudiante.dni,
        aula: `${estudiante.grado}° ${estudiante.seccion}`,
        fecha: justificacion.fecha,
        motivo: justificacion.observaciones || 'Sin especificar',
        documentoAdjunto: justificacion.documentoJustificacion || null,
        fechaJustificacion: justificacion.fechaJustificacion || justificacion.fecha,
        aprobadoPor: justificacion.aprobadoPor || 'Sistema'
      }))
  )
  
  if (justificaciones.length > 0) {
    // Nueva página en portrait para justificaciones
    doc.addPage('a4', 'portrait')
    yPos = 20
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('DETALLE DE JUSTIFICACIONES', 105, yPos, { align: 'center' })
    
    yPos += 10
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Total de justificaciones registradas: ${justificaciones.length}`, 20, yPos)
    
    yPos += 15
    
    // Tabla de justificaciones
    const justificacionesData = justificaciones.map((just: any, index: number) => [
      (index + 1).toString(),
      just.estudiante,
      just.dni,
      just.aula,
      just.fecha,
      just.motivo.substring(0, 30) + (just.motivo.length > 30 ? '...' : ''),
      just.fechaJustificacion,
      just.documentoAdjunto ? 'Sí' : 'No'
    ])
    
    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Estudiante', 'DNI', 'Aula', 'Fecha Falta', 'Motivo', 'Fecha Just.', 'Doc.']],
      body: justificacionesData,
      theme: 'striped',
      styles: { fontSize: 8, font: 'helvetica' },
      headStyles: { fillColor: [46, 125, 50], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 38 },
        2: { cellWidth: 22 },
        3: { cellWidth: 18 },
        4: { cellWidth: 22 },
        5: { cellWidth: 40 },
        6: { cellWidth: 22 },
        7: { cellWidth: 12, halign: 'center' }
      }
    })
    
    // Detalle completo de cada justificación
    let justCurrentY = (doc as any).lastAutoTable.finalY + 20
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('DETALLE COMPLETO DE JUSTIFICACIONES', 20, justCurrentY)
    justCurrentY += 15
    
    justificaciones.forEach((just: any, index: number) => {
      // Verificar si necesitamos nueva página
      if (justCurrentY > 240) {
        doc.addPage()
        justCurrentY = 20
      }
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. JUSTIFICACIÓN - ${just.estudiante}`, 20, justCurrentY)
      justCurrentY += 8
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      
      // Información básica
      doc.text(`Estudiante: ${just.estudiante} (DNI: ${just.dni})`, 25, justCurrentY)
      justCurrentY += 6
      doc.text(`Aula: ${just.aula}`, 25, justCurrentY)
      justCurrentY += 6
      doc.text(`Fecha de la inasistencia: ${just.fecha}`, 25, justCurrentY)
      justCurrentY += 6
      doc.text(`Fecha de justificación: ${just.fechaJustificacion}`, 25, justCurrentY)
      justCurrentY += 6
      doc.text(`Aprobado por: ${just.aprobadoPor}`, 25, justCurrentY)
      justCurrentY += 8
      
      // Motivo de la justificación
      doc.setFont('helvetica', 'bold')
      doc.text('Motivo de la justificación:', 25, justCurrentY)
      justCurrentY += 6
      doc.setFont('helvetica', 'normal')
      
      // Dividir el motivo en líneas si es muy largo
      const motivoLines = doc.splitTextToSize(just.motivo, 160)
      motivoLines.forEach((line: string) => {
        doc.text(line, 25, justCurrentY)
        justCurrentY += 5
      })
      
      justCurrentY += 3
      
      // Información del documento adjunto
      if (just.documentoAdjunto) {
        doc.setFont('helvetica', 'bold')
        doc.text('Documento adjunto:', 25, justCurrentY)
        justCurrentY += 6
        doc.setFont('helvetica', 'normal')
        doc.text(`Archivo: ${just.documentoAdjunto}`, 25, justCurrentY)
        justCurrentY += 6
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        doc.text('Nota: El documento original se encuentra archivado en la institución.', 25, justCurrentY)
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(9)
        justCurrentY += 8
      } else {
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(150, 150, 150)
        doc.text('Sin documento adjunto', 25, justCurrentY)
        doc.setTextColor(0, 0, 0)
        doc.setFont('helvetica', 'normal')
        justCurrentY += 8
      }
      
      // Línea separadora
      doc.setDrawColor(200, 200, 200)
      doc.line(20, justCurrentY, 190, justCurrentY)
      justCurrentY += 10
    })
    
    // Anexo de documentos
    if (justificaciones.some((just: any) => just.documentoAdjunto)) {
      doc.addPage()
      yPos = 20
      
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('ANEXO: DOCUMENTOS DE JUSTIFICACIÓN', 20, yPos)
      
      yPos += 15
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text('Lista de documentos adjuntos a las justificaciones:', 20, yPos)
      yPos += 10
      
      const documentosAdjuntos = justificaciones
        .filter((just: any) => just.documentoAdjunto)
        .map((just: any, index: number) => [
          (index + 1).toString(),
          just.estudiante,
          just.fecha,
          just.documentoAdjunto,
          'Archivado en IE'
        ])
      
      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Estudiante', 'Fecha', 'Nombre del Documento', 'Estado']],
        body: documentosAdjuntos,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [155, 89, 182] },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 50 },
          2: { cellWidth: 25 },
          3: { cellWidth: 60 },
          4: { cellWidth: 30 }
        }
      })
      
      yPos = (doc as any).lastAutoTable.finalY + 15
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'italic')
      doc.text('Nota: Los documentos originales se encuentran archivados físicamente en la institución educativa.', 20, yPos)
      yPos += 5
      doc.text('Para consultar un documento específico, contactar con la administración de la IE.', 20, yPos)
    }
  }
  
  // Pie de página con número de página
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    
    // Detectar orientación de la página actual
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const isLandscape = pageWidth > pageHeight
    
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    
    // Posición del pie según orientación
    const footerY = isLandscape ? 200 : 285
    const footerX = 15
    
    doc.text(`Página ${i} de ${pageCount}`, footerX, footerY)
    doc.text(`${metadatos.institucion.nombre}`, pageWidth - 15, footerY, { align: 'right' })
    
    doc.setTextColor(0, 0, 0)
  }
  
  // Convertir a buffer
  const pdfOutput = doc.output('arraybuffer')
  return Buffer.from(pdfOutput)
}

// Función auxiliar para obtener fechas del rango
function obtenerFechasDelRango(fechaInicio: string, fechaFin: string): Date[] {
  const fechas: Date[] = []
  const inicio = new Date(fechaInicio)
  const fin = new Date(fechaFin)
  
  for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
    fechas.push(new Date(d))
  }
  return fechas
}

// Función para formatear fecha corta (L01, M02, X03, etc.)
function formatearFechaCorta(fecha: Date): string {
  const dias = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
  const dia = dias[fecha.getDay()]
  const numero = fecha.getDate().toString().padStart(2, '0')
  return `${dia}${numero}`
}

// Función para generar Excel con formato de tabla de asistencia
async function generarExcel(datos: any, configuracion: any): Promise<Buffer> {
  const { metadatos, resumenEjecutivo, estudiantes } = datos
  
  // Crear nuevo workbook
  const wb = XLSX.utils.book_new()
  
  // Obtener fechas del período
  const fechas = obtenerFechasDelRango(metadatos.fechaInicio, metadatos.fechaFin)
  
  // Agrupar estudiantes por grado y sección
  const grupos = estudiantes.reduce((acc: any, est: any) => {
    const key = `${est.grado} ${est.seccion}`
    if (!acc[key]) acc[key] = []
    acc[key].push(est)
    return acc
  }, {})
  
  // Crear una hoja por cada grado/sección
  Object.entries(grupos).forEach(([gradoSeccion, estudiantesGrupo]: [string, any]) => {
    const sheetData: any[][] = []
    
    // Fila 1: Título
    sheetData.push([`Grado y sección`, gradoSeccion])
    sheetData.push([]) // Fila vacía
    
    // Fila 3: Headers - Apellidos y nombre + fechas
    const headers = ['Apellidos y nombre']
    fechas.forEach(fecha => {
      headers.push(formatearFechaCorta(fecha))
    })
    sheetData.push(headers)
    
    // Filas de estudiantes
    estudiantesGrupo.forEach((estudiante: any) => {
      const fila = [`${estudiante.apellido}, ${estudiante.nombre}`]
      
      fechas.forEach(fecha => {
        const fechaStr = fecha.toISOString().split('T')[0]
        const asistencia = estudiante.asistencias?.find(
          (a: any) => a.fecha?.split('T')[0] === fechaStr
        )
        
        if (asistencia) {
          switch (asistencia.estado?.toLowerCase()) {
            case 'presente':
              fila.push('X')
              break
            case 'tardanza':
              fila.push('T')
              break
            case 'inasistencia':
              fila.push('F')
              break
            case 'justificada':
              fila.push('J')
              break
            default:
              fila.push('-')
          }
        } else {
          fila.push('-')
        }
      })
      
      sheetData.push(fila)
    })
    
    // Agregar leyenda
    sheetData.push([])
    sheetData.push(['Leyenda:'])
    sheetData.push(['X = Presente', 'T = Tardanza', 'F = Falta', 'J = Justificada'])
    
    // Crear hoja
    const ws = XLSX.utils.aoa_to_sheet(sheetData)
    
    // Ajustar ancho de columnas
    ws['!cols'] = [{ wch: 35 }] // Primera columna más ancha
    fechas.forEach(() => {
      ws['!cols']?.push({ wch: 8 })
    })
    
    // Nombre de la hoja (máximo 31 caracteres)
    const sheetName = gradoSeccion.substring(0, 31)
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
  })
  
  // Hoja de Resumen
  const resumenData = [
    ['REPORTE DE ASISTENCIAS'],
    [''],
    ['Información del Reporte'],
    ['Tipo:', metadatos.tipoReporte.toUpperCase()],
    ['Institución:', metadatos.institucion.nombre],
    ['Generado por:', metadatos.generadoPor.nombre],
    ['Fecha de generación:', new Date(metadatos.fechaGeneracion).toLocaleDateString('es-ES')],
    ['Período:', `${new Date(metadatos.fechaInicio).toLocaleDateString('es-ES')} - ${new Date(metadatos.fechaFin).toLocaleDateString('es-ES')}`],
    [''],
    ['Resumen Ejecutivo'],
    ['Total estudiantes:', resumenEjecutivo.totalEstudiantes],
    ['Total asistencias:', resumenEjecutivo.totalAsistencias],
    ['Porcentaje asistencia:', `${resumenEjecutivo.porcentajes.asistencia}%`],
    ['Porcentaje tardanzas:', `${resumenEjecutivo.porcentajes.tardanzas}%`],
    ['Porcentaje inasistencias:', `${resumenEjecutivo.porcentajes.inasistencias}%`]
  ]
  
  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData)
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')
  
  // Convertir a buffer
  const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  return Buffer.from(excelBuffer)
}

// Función para generar Word con normas APA
async function generarWord(datos: any, configuracion: any): Promise<Buffer> {
  const { metadatos, resumenEjecutivo, estudiantes } = datos
  
  // Crear documento Word
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Título principal
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `REPORTE ${metadatos.tipoReporte.toUpperCase()} DE ASISTENCIAS Y RETIROS`,
                bold: true,
                size: 32
              })
            ]
          }),
          
          new Paragraph({ text: "" }), // Espacio
          
          // Información institucional
          new Paragraph({
            children: [
              new TextRun({
                text: "Institución Educativa: ",
                bold: true
              }),
              new TextRun({
                text: metadatos.institucion.nombre
              })
            ]
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "Código IE: ",
                bold: true
              }),
              new TextRun({
                text: metadatos.institucion.codigo || 'N/A'
              })
            ]
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "Modalidad: ",
                bold: true
              }),
              new TextRun({
                text: metadatos.institucion.modalidad || 'N/A'
              })
            ]
          }),
          
          new Paragraph({ text: "" }), // Espacio
          
          // Información del reporte
          new Paragraph({
            children: [
              new TextRun({
                text: "INFORMACIÓN DEL REPORTE",
                bold: true,
                size: 24
              })
            ]
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "Elaborado por: ",
                bold: true
              }),
              new TextRun({
                text: metadatos.generadoPor.nombre
              })
            ]
          }),
          
          ...(metadatos.generadoPor.especialidad ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Especialidad: ",
                  bold: true
                }),
                new TextRun({
                  text: metadatos.generadoPor.especialidad
                })
              ]
            })
          ] : []),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "Fecha de elaboración: ",
                bold: true
              }),
              new TextRun({
                text: new Date(metadatos.fechaGeneracion).toLocaleDateString('es-ES')
              })
            ]
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "Período analizado: ",
                bold: true
              }),
              new TextRun({
                text: `${new Date(metadatos.fechaInicio).toLocaleDateString('es-ES')} al ${new Date(metadatos.fechaFin).toLocaleDateString('es-ES')}`
              })
            ]
          }),
          
          new Paragraph({ text: "" }), // Espacio
          
          // Resumen ejecutivo
          new Paragraph({
            children: [
              new TextRun({
                text: "RESUMEN EJECUTIVO",
                bold: true,
                size: 24
              })
            ]
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `El presente reporte analiza el comportamiento de asistencias y retiros de ${resumenEjecutivo.totalEstudiantes} estudiantes durante el período especificado. Se registraron un total de ${resumenEjecutivo.totalAsistencias} asistencias y ${resumenEjecutivo.totalRetiros} retiros.`
              })
            ]
          }),
          
          new Paragraph({ text: "" }), // Espacio
          
          new Paragraph({
            children: [
              new TextRun({
                text: "Indicadores de Asistencia:",
                bold: true
              })
            ]
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `• Asistencia efectiva: ${resumenEjecutivo.porcentajes.asistencia}%`
              })
            ]
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `• Tardanzas: ${resumenEjecutivo.porcentajes.tardanzas}%`
              })
            ]
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `• Inasistencias: ${resumenEjecutivo.porcentajes.inasistencias}%`
              })
            ]
          }),
          
          new Paragraph({ text: "" }), // Espacio
          
          // Análisis detallado
          new Paragraph({
            children: [
              new TextRun({
                text: "ANÁLISIS DETALLADO",
                bold: true,
                size: 24
              })
            ]
          }),
          
          // Agregar estudiantes
          ...estudiantes.flatMap((estudiante: any, index: number) => {
            const porcentajeAsistencia = estudiante.estadisticas.totalAsistencias > 0 ? 
              ((estudiante.estadisticas.presente + estudiante.estadisticas.tardanza) / estudiante.estadisticas.totalAsistencias * 100).toFixed(1) : '0'
            
            return [
              new Paragraph({ text: "" }), // Espacio
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${index + 1}. Estudiante: ${estudiante.apellido}, ${estudiante.nombre}`,
                    bold: true
                  })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `   DNI: ${estudiante.dni}`
                  })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `   Grado y sección: ${estudiante.grado}° ${estudiante.seccion}`
                  })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "   Indicadores del período:",
                    bold: true
                  })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `   • Porcentaje de asistencia: ${porcentajeAsistencia}%`
                  })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `   • Total de registros: ${estudiante.estadisticas.totalAsistencias}`
                  })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `   • Presencias: ${estudiante.estadisticas.presente}`
                  })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `   • Tardanzas: ${estudiante.estadisticas.tardanza}`
                  })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `   • Inasistencias: ${estudiante.estadisticas.inasistencia}`
                  })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `   • Justificadas: ${estudiante.estadisticas.justificada}`
                  })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `   • Retiros: ${estudiante.estadisticas.totalRetiros}`
                  })
                ]
              })
            ]
          }),
          
          new Paragraph({ text: "" }), // Espacio
          
          // Metodología
          new Paragraph({
            children: [
              new TextRun({
                text: "METODOLOGÍA",
                bold: true,
                size: 24
              })
            ]
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "Este reporte fue generado automáticamente a partir de los registros de asistencia y retiros almacenados en el sistema de gestión educativa. Los datos incluyen información detallada de cada estudiante, registros de entrada y salida, estados de asistencia, y procedimientos de retiro debidamente documentados."
              })
            ]
          }),
          
          new Paragraph({ text: "" }), // Espacio
          
          // Conclusiones
          new Paragraph({
            children: [
              new TextRun({
                text: "CONCLUSIONES",
                bold: true,
                size: 24
              })
            ]
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "Los datos presentados reflejan el comportamiento de asistencia durante el período analizado y pueden ser utilizados para la toma de decisiones pedagógicas y administrativas."
              })
            ]
          }),
          
          new Paragraph({ text: "" }), // Espacio
          new Paragraph({ text: "---" }),
          
          // Referencia APA
          new Paragraph({
            children: [
              new TextRun({
                text: "REFERENCIA BIBLIOGRÁFICA (Normas APA 7ª edición):",
                bold: true
              })
            ]
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `${metadatos.generadoPor.nombre}. (${new Date().getFullYear()}). Reporte ${metadatos.tipoReporte} de asistencias y retiros [Reporte técnico]. ${metadatos.institucion.nombre}.`,
                italics: true
              })
            ]
          }),
          
          new Paragraph({ text: "" }), // Espacio
          
          new Paragraph({
            children: [
              new TextRun({
                text: `Documento generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`,
                size: 16
              })
            ]
          })
        ]
      }
    ]
  })
  
  // Convertir a buffer
  const buffer = await Packer.toBuffer(doc)
  return buffer
}
