import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { formato, datos } = body

    if (!datos || !formato) {
      return NextResponse.json({ error: 'Datos y formato son requeridos' }, { status: 400 })
    }

    let contenido: Buffer
    let mimeType: string
    let filename: string

    const fechaActual = new Date().toISOString().split('T')[0]

    switch (formato) {
      case 'pdf':
        contenido = await generatePDF(datos)
        mimeType = 'application/pdf'
        filename = `reporte_asistencia_${datos.filtros.tipoReporte}_${fechaActual}.pdf`
        break

      case 'excel':
        contenido = generateExcel(datos)
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        filename = `reporte_asistencia_${datos.filtros.tipoReporte}_${fechaActual}.xlsx`
        break

      case 'word':
        contenido = generateWord(datos)
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        filename = `reporte_asistencia_${datos.filtros.tipoReporte}_${fechaActual}.docx`
        break

      default:
        return NextResponse.json({ error: 'Formato no soportado' }, { status: 400 })
    }

    // Convertir a base64 como lo hace el docente
    const contenidoBase64 = contenido.toString('base64')

    return NextResponse.json({
      success: true,
      data: {
        contenido: contenidoBase64,
        mimeType,
        filename
      }
    })

  } catch (error) {
    console.error('Error exporting report:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

async function generatePDF(datos: any): Promise<Buffer> {
  const doc = new jsPDF()
  const { reportes, estadisticas, filtros } = datos
  
  // Configuración APA 7
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 25.4 // 1 pulgada en mm (APA 7)
  
  // Portada estilo APA 7
  doc.setFont('Times', 'normal')
  
  // Título centrado
  doc.setFontSize(14)
  const titulo = 'Reporte de Asistencia Escolar'
  const subtitulo = `Análisis ${filtros.tipoReporte.charAt(0).toUpperCase() + filtros.tipoReporte.slice(1)} de Asistencia Estudiantil`
  
  doc.text(titulo, pageWidth / 2, 60, { align: 'center' })
  doc.text(subtitulo, pageWidth / 2, 75, { align: 'center' })
  
  // Información institucional centrada
  doc.setFontSize(12)
  doc.text('Sistema de Gestión Escolar', pageWidth / 2, 100, { align: 'center' })
  doc.text('Departamento de Control Académico', pageWidth / 2, 115, { align: 'center' })
  
  if (filtros.grado !== 'Todos') {
    doc.text(`Grado: ${filtros.grado}`, pageWidth / 2, 130, { align: 'center' })
  }
  if (filtros.seccion !== 'Todas') {
    doc.text(`Sección: ${filtros.seccion}`, pageWidth / 2, 145, { align: 'center' })
  }
  
  // Fecha centrada
  doc.text(new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  }), pageWidth / 2, pageHeight - 50, { align: 'center' })

  // Nueva página para contenido
  doc.addPage()
  
  // Resumen Ejecutivo
  let yPos = margin
  doc.setFontSize(14)
  doc.setFont('Times', 'bold')
  doc.text('Resumen Ejecutivo', margin, yPos)
  
  yPos += 15
  doc.setFontSize(12)
  doc.setFont('Times', 'normal')
  const resumenTexto = `El presente reporte analiza los patrones de asistencia estudiantil durante el período comprendido entre ${filtros.fechaInicio} y ${filtros.fechaFin}. Este análisis forma parte del sistema de monitoreo académico institucional y tiene como objetivo proporcionar información estadística relevante para la toma de decisiones educativas.`
  
  const resumenLines = doc.splitTextToSize(resumenTexto, pageWidth - (margin * 2))
  doc.text(resumenLines, margin, yPos)
  yPos += resumenLines.length * 6 + 10

  // Metodología
  doc.setFontSize(12)
  doc.setFont('Times', 'bold')
  doc.text('Metodología', margin, yPos)
  yPos += 10
  
  doc.setFont('Times', 'normal')
  const metodologiaTexto = `Los datos fueron recopilados a través del sistema de registro de asistencia digital, considerando únicamente los días hábiles del período académico. Se analizaron ${estadisticas.diasAnalizados} días lectivos, evaluando el comportamiento de asistencia de ${estadisticas.totalEstudiantes} estudiantes.`
  
  const metodologiaLines = doc.splitTextToSize(metodologiaTexto, pageWidth - (margin * 2))
  doc.text(metodologiaLines, margin, yPos)
  yPos += metodologiaLines.length * 6 + 15

  // Tabla de estadísticas estilo APA 7
  doc.setFont('Times', 'bold')
  doc.text('Tabla 1', margin, yPos)
  yPos += 6
  doc.setFont('Times', 'italic')
  doc.text('Indicadores Principales de Asistencia', margin, yPos)
  yPos += 10

  // Configuración de tabla
  const tableStartY = yPos
  const colWidths = [80, 40]
  const rowHeight = 8
  
  // Encabezados de tabla (estilo APA 7)
  doc.setFont('Times', 'bold')
  doc.setFontSize(10)
  
  // Línea superior
  doc.line(margin, tableStartY, margin + colWidths[0] + colWidths[1], tableStartY)
  
  // Encabezados
  doc.text('Indicador', margin + 2, tableStartY + 6)
  doc.text('Valor', margin + colWidths[0] + 2, tableStartY + 6)
  
  // Línea después de encabezados
  doc.line(margin, tableStartY + rowHeight, margin + colWidths[0] + colWidths[1], tableStartY + rowHeight)
  
  // Datos de la tabla
  doc.setFont('Times', 'normal')
  const estadisticasData = [
    ['Total de estudiantes analizados', estadisticas.totalEstudiantes.toString()],
    ['Promedio general de asistencia', `${estadisticas.promedioAsistencia.toFixed(1)}%`],
    ['Estudiantes con asistencia inferior al 70%', estadisticas.estudiantesConBajaAsistencia.toString()],
    ['Días lectivos analizados', estadisticas.diasAnalizados.toString()]
  ]
  
  estadisticasData.forEach((row, index) => {
    const currentY = tableStartY + rowHeight + (index + 1) * rowHeight
    doc.text(row[0], margin + 2, currentY + 6)
    doc.text(row[1], margin + colWidths[0] + 2, currentY + 6)
  })
  
  // Línea inferior de tabla
  const tableEndY = tableStartY + rowHeight + (estadisticasData.length + 1) * rowHeight
  doc.line(margin, tableEndY, margin + colWidths[0] + colWidths[1], tableEndY)
  
  yPos = tableEndY + 20

  // Nueva página para tabla de estudiantes
  doc.addPage()
  yPos = margin

  // Tabla de estudiantes estilo APA 7
  doc.setFont('Times', 'bold')
  doc.text('Tabla 2', margin, yPos)
  yPos += 6
  doc.setFont('Times', 'italic')
  doc.text('Análisis Individual de Asistencia por Estudiante', margin, yPos)
  yPos += 15

  // Configuración de tabla de estudiantes
  const estudiantesTableY = yPos
  const estudiantesColWidths = [45, 20, 25, 15, 15, 15, 20]
  const estudiantesRowHeight = 12
  
  // Encabezados
  doc.setFont('Times', 'bold')
  doc.setFontSize(9)
  
  // Línea superior
  const totalWidth = estudiantesColWidths.reduce((sum, width) => sum + width, 0)
  doc.line(margin, estudiantesTableY, margin + totalWidth, estudiantesTableY)
  
  // Encabezados de columnas
  let xPos = margin
  const headers = ['Apellidos y Nombres', 'DNI', 'Grado/Sección', 'Presente', 'Ausente', 'Tardanza', '% Asistencia']
  
  headers.forEach((header, index) => {
    doc.text(header, xPos + 1, estudiantesTableY + 8)
    xPos += estudiantesColWidths[index]
  })
  
  // Línea después de encabezados
  doc.line(margin, estudiantesTableY + estudiantesRowHeight, margin + totalWidth, estudiantesTableY + estudiantesRowHeight)
  
  // Datos de estudiantes
  doc.setFont('Times', 'normal')
  doc.setFontSize(8)
  
  let currentRowY = estudiantesTableY + estudiantesRowHeight
  
  reportes.forEach((item: any, index: number) => {
    if (currentRowY > pageHeight - 40) {
      doc.addPage()
      currentRowY = margin
    }
    
    xPos = margin
    const rowData = [
      `${item.estudiante.apellido}, ${item.estudiante.nombre}`,
      item.estudiante.dni,
      `${item.estudiante.grado}-${item.estudiante.seccion}`,
      item.resumen.diasPresente.toString(),
      item.resumen.diasAusente.toString(),
      item.resumen.diasTardanza.toString(),
      `${item.resumen.porcentajeAsistencia.toFixed(1)}%`
    ]
    
    rowData.forEach((data, colIndex) => {
      // Truncar texto si es muy largo
      const maxWidth = estudiantesColWidths[colIndex] - 2
      const truncatedText = doc.getTextWidth(data) > maxWidth ? 
        data.substring(0, Math.floor(data.length * maxWidth / doc.getTextWidth(data))) + '...' : 
        data
      
      doc.text(truncatedText, xPos + 1, currentRowY + 8)
      xPos += estudiantesColWidths[colIndex]
    })
    
    currentRowY += estudiantesRowHeight
  })
  
  // Línea inferior de tabla
  doc.line(margin, currentRowY, margin + totalWidth, currentRowY)

  // Nueva página para conclusiones
  doc.addPage()
  yPos = margin

  // Conclusiones estilo APA 7
  doc.setFontSize(12)
  doc.setFont('Times', 'bold')
  doc.text('Conclusiones', margin, yPos)
  yPos += 15
  
  doc.setFont('Times', 'normal')
  const conclusionesTexto = `Basándose en el análisis de los datos recopilados durante el período de estudio, se pueden establecer las siguientes conclusiones:

1. El promedio general de asistencia alcanzó el ${estadisticas.promedioAsistencia.toFixed(1)}%, lo cual ${estadisticas.promedioAsistencia >= 85 ? 'indica un nivel satisfactorio de asistencia estudiantil' : estadisticas.promedioAsistencia >= 70 ? 'muestra un nivel regular que requiere monitoreo continuo' : 'evidencia la necesidad de implementar estrategias de mejora en la asistencia'}.

2. Se identificaron ${estadisticas.estudiantesConBajaAsistencia} estudiantes con porcentajes de asistencia inferiores al 70%, quienes requieren seguimiento individualizado y posibles intervenciones pedagógicas.

3. El análisis abarcó ${estadisticas.diasAnalizados} días lectivos, proporcionando una muestra representativa del comportamiento de asistencia durante el período evaluado.`
  
  const conclusionesLines = doc.splitTextToSize(conclusionesTexto, pageWidth - (margin * 2))
  doc.text(conclusionesLines, margin, yPos)

  return Buffer.from(doc.output('arraybuffer'))
}

function generateExcel(datos: any): Buffer {
  const { reportes, estadisticas, filtros } = datos
  const workbook = XLSX.utils.book_new()

  // Hoja de resumen
  const resumenData = [
    ['Reporte de Asistencia'],
    [''],
    ['Tipo de Reporte:', filtros.tipoReporte.charAt(0).toUpperCase() + filtros.tipoReporte.slice(1)],
    ['Período:', `${filtros.fechaInicio} - ${filtros.fechaFin}`],
    ['Grado:', filtros.grado],
    ['Sección:', filtros.seccion],
    ['Fecha de generación:', new Date().toLocaleDateString()],
    [''],
    ['Estadísticas Generales'],
    ['Total de estudiantes:', estadisticas.totalEstudiantes],
    ['Promedio de asistencia:', `${estadisticas.promedioAsistencia.toFixed(1)}%`],
    ['Estudiantes con baja asistencia:', estadisticas.estudiantesConBajaAsistencia],
    ['Días analizados:', estadisticas.diasAnalizados]
  ]

  const resumenWS = XLSX.utils.aoa_to_sheet(resumenData)
  XLSX.utils.book_append_sheet(workbook, resumenWS, 'Resumen')

  // Hoja de datos detallados
  const detailData = [
    ['Apellido', 'Nombre', 'DNI', 'Grado', 'Sección', 'Días Presente', 'Días Ausente', 'Tardanzas', 'Retiros', '% Asistencia']
  ]

  reportes.forEach((item: any) => {
    detailData.push([
      item.estudiante.apellido,
      item.estudiante.nombre,
      item.estudiante.dni,
      item.estudiante.grado,
      item.estudiante.seccion,
      item.resumen.diasPresente,
      item.resumen.diasAusente,
      item.resumen.diasTardanza,
      item.resumen.diasRetirado,
      `${item.resumen.porcentajeAsistencia.toFixed(1)}%`
    ])
  })

  const detailWS = XLSX.utils.aoa_to_sheet(detailData)
  XLSX.utils.book_append_sheet(workbook, detailWS, 'Detalle')

  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }))
}

function generateWord(datos: any): Buffer {
  const { reportes, estadisticas, filtros } = datos
  
  // Generar HTML para Word
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reporte de Asistencia</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #ff6600; border-bottom: 2px solid #ff6600; }
        h2 { color: #333; margin-top: 30px; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #ff6600; color: white; }
        .stats { background-color: #f9f9f9; padding: 15px; margin: 20px 0; }
        .info { margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <h1>Reporte de Asistencia</h1>
      
      <div class="info">
        <p><strong>Tipo de Reporte:</strong> ${filtros.tipoReporte.charAt(0).toUpperCase() + filtros.tipoReporte.slice(1)}</p>
        <p><strong>Período:</strong> ${filtros.fechaInicio} - ${filtros.fechaFin}</p>
        <p><strong>Grado:</strong> ${filtros.grado}</p>
        <p><strong>Sección:</strong> ${filtros.seccion}</p>
        <p><strong>Fecha de generación:</strong> ${new Date().toLocaleDateString()}</p>
      </div>

      <div class="stats">
        <h2>Resumen Estadístico</h2>
        <p><strong>Total de estudiantes:</strong> ${estadisticas.totalEstudiantes}</p>
        <p><strong>Promedio de asistencia:</strong> ${estadisticas.promedioAsistencia.toFixed(1)}%</p>
        <p><strong>Estudiantes con baja asistencia:</strong> ${estadisticas.estudiantesConBajaAsistencia}</p>
        <p><strong>Días analizados:</strong> ${estadisticas.diasAnalizados}</p>
      </div>

      <h2>Detalle por Estudiante</h2>
      <table>
        <thead>
          <tr>
            <th>Estudiante</th>
            <th>DNI</th>
            <th>Grado/Sección</th>
            <th>Días Presente</th>
            <th>Días Ausente</th>
            <th>Tardanzas</th>
            <th>% Asistencia</th>
          </tr>
        </thead>
        <tbody>
          ${reportes.map((item: any) => `
            <tr>
              <td>${item.estudiante.apellido}, ${item.estudiante.nombre}</td>
              <td>${item.estudiante.dni}</td>
              <td>${item.estudiante.grado} - ${item.estudiante.seccion}</td>
              <td>${item.resumen.diasPresente}</td>
              <td>${item.resumen.diasAusente}</td>
              <td>${item.resumen.diasTardanza}</td>
              <td>${item.resumen.porcentajeAsistencia.toFixed(1)}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `

  return Buffer.from(html, 'utf-8')
}
