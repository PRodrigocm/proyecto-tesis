import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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
  const { reportes, estadisticas, filtros } = datos
  
  // Crear documento PDF en orientación vertical para la portada
  const doc = new jsPDF('portrait', 'mm', 'a4')
  
  // ===== PÁGINA 1: PORTADA Y RESUMEN =====
  doc.setFont('helvetica')
  
  // Título principal
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('REPORTE DE ASISTENCIAS', 105, 30, { align: 'center' })
  doc.setFontSize(14)
  doc.text(filtros.tipoReporte.toUpperCase(), 105, 40, { align: 'center' })
  
  // Línea decorativa
  doc.setDrawColor(46, 125, 50)
  doc.setLineWidth(1)
  doc.line(20, 45, 190, 45)
  
  // Información institucional
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  let yPos = 55
  doc.text('Sistema de Gestión Escolar', 105, yPos, { align: 'center' })
  yPos += 7
  doc.text('Departamento de Control Académico', 105, yPos, { align: 'center' })
  
  // Información del reporte
  yPos += 15
  doc.setFontSize(10)
  if (filtros.grado !== 'Todos') {
    doc.text(`Grado: ${filtros.grado}`, 20, yPos)
    yPos += 6
  }
  if (filtros.seccion !== 'Todas') {
    doc.text(`Sección: ${filtros.seccion}`, 20, yPos)
    yPos += 6
  }
  doc.text(`Período: ${filtros.fechaInicio} - ${filtros.fechaFin}`, 20, yPos)
  yPos += 6
  doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 20, yPos)
  
  // Resumen ejecutivo
  yPos += 15
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('RESUMEN EJECUTIVO', 20, yPos)
  
  yPos += 8
  
  // Tabla de estadísticas
  const estadisticasData = [
    ['Total de estudiantes evaluados', estadisticas.totalEstudiantes.toString()],
    ['Promedio general de asistencia', `${estadisticas.promedioAsistencia.toFixed(1)}%`],
    ['Estudiantes con baja asistencia (<70%)', estadisticas.estudiantesConBajaAsistencia.toString()],
    ['Días lectivos analizados', estadisticas.diasAnalizados.toString()]
  ]
  
  autoTable(doc, {
    startY: yPos,
    head: [['Métrica', 'Valor']],
    body: estadisticasData,
    theme: 'striped',
    styles: { fontSize: 9, font: 'helvetica' },
    headStyles: { fillColor: [46, 125, 50], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 50, halign: 'center' }
    }
  })
  
  // ===== PÁGINAS DE DETALLE: TABLAS EN LANDSCAPE =====
  // Obtener fechas del período (solo días laborables: lunes a viernes)
  const fechasPeriodo: Date[] = []
  const fechaInicio = new Date(filtros.fechaInicio)
  const fechaFin = new Date(filtros.fechaFin)
  for (let d = new Date(fechaInicio); d <= fechaFin; d.setDate(d.getDate() + 1)) {
    const diaSemana = d.getDay()
    // Solo incluir días laborables (lunes=1 a viernes=5)
    if (diaSemana >= 1 && diaSemana <= 5) {
      fechasPeriodo.push(new Date(d))
    }
  }
  
  // Agrupar estudiantes por grado y sección
  const grupos = reportes.reduce((acc: any, item: any) => {
    const key = `${item.estudiante.grado}° ${item.estudiante.seccion}`
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})
  
  // Para cada grupo, crear una nueva página en landscape
  Object.entries(grupos).forEach(([gradoSeccion, estudiantesGrupo]: [string, any]) => {
    // Nueva página en LANDSCAPE para la tabla de asistencia
    doc.addPage('a4', 'landscape')
    
    // Título del aula
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(`Grado y sección: ${gradoSeccion}`, 15, 15)
    
    // Información del período
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    const mesNombre = fechasPeriodo.length > 0 
      ? fechasPeriodo[0].toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()
      : ''
    doc.text(`${mesNombre} • ${fechasPeriodo.length} días laborables`, 15, 22)
    
    // Headers: Apellidos y nombre + todas las fechas del mes
    const headers = ['Apellidos y nombre']
    fechasPeriodo.forEach(fecha => {
      const dias = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB']
      const dia = dias[fecha.getDay()]
      const numero = fecha.getDate().toString().padStart(2, '0')
      headers.push(`${dia}${numero}`)
    })
    
    // Datos de estudiantes
    const estudiantesData = estudiantesGrupo.map((item: any) => {
      const fila = [`${item.estudiante.apellido}, ${item.estudiante.nombre}`]
      
      fechasPeriodo.forEach(fecha => {
        const fechaStr = fecha.toISOString().split('T')[0]
        const asistencia = item.asistencias?.find(
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
    
    doc.text(`Página ${i} de ${pageCount}`, 15, footerY)
    doc.text('Sistema de Gestión Escolar', pageWidth - 15, footerY, { align: 'right' })
    
    doc.setTextColor(0, 0, 0)
  }

  return Buffer.from(doc.output('arraybuffer'))
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

// Función para formatear fecha corta (LUN01, MAR02, etc.)
function formatearFechaCorta(fecha: Date): string {
  const dias = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB']
  const dia = dias[fecha.getDay()]
  const numero = fecha.getDate().toString().padStart(2, '0')
  return `${dia}${numero}`
}

function generateExcel(datos: any): Buffer {
  const { reportes, estadisticas, filtros } = datos
  const workbook = XLSX.utils.book_new()

  // Obtener fechas del período
  const fechas = obtenerFechasDelRango(filtros.fechaInicio, filtros.fechaFin)

  // Agrupar estudiantes por grado y sección
  const grupos = reportes.reduce((acc: any, item: any) => {
    const key = `${item.estudiante.grado} ${item.estudiante.seccion}`
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  // Crear una hoja por cada grado/sección con formato de tabla de asistencia
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
    estudiantesGrupo.forEach((item: any) => {
      const fila = [`${item.estudiante.apellido}, ${item.estudiante.nombre}`]
      
      fechas.forEach(fecha => {
        const fechaStr = fecha.toISOString().split('T')[0]
        const asistencia = item.asistencias?.find(
          (a: any) => a.fecha?.split('T')[0] === fechaStr
        )
        
        if (asistencia) {
          switch (asistencia.estado?.toUpperCase()) {
            case 'PRESENTE':
              fila.push('X')
              break
            case 'TARDANZA':
              fila.push('T')
              break
            case 'AUSENTE':
              fila.push('F')
              break
            case 'JUSTIFICADA':
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
    XLSX.utils.book_append_sheet(workbook, ws, sheetName)
  })

  // Hoja de Resumen
  const resumenData = [
    ['REPORTE DE ASISTENCIAS'],
    [''],
    ['Información del Reporte'],
    ['Tipo:', filtros.tipoReporte.charAt(0).toUpperCase() + filtros.tipoReporte.slice(1)],
    ['Período:', `${filtros.fechaInicio} - ${filtros.fechaFin}`],
    ['Grado:', filtros.grado],
    ['Sección:', filtros.seccion],
    ['Fecha de generación:', new Date().toLocaleDateString()],
    [''],
    ['Resumen Ejecutivo'],
    ['Total estudiantes:', estadisticas.totalEstudiantes],
    ['Promedio asistencia:', `${estadisticas.promedioAsistencia.toFixed(1)}%`],
    ['Estudiantes con baja asistencia:', estadisticas.estudiantesConBajaAsistencia],
    ['Días analizados:', estadisticas.diasAnalizados]
  ]

  const resumenWS = XLSX.utils.aoa_to_sheet(resumenData)
  XLSX.utils.book_append_sheet(workbook, resumenWS, 'Resumen')

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
