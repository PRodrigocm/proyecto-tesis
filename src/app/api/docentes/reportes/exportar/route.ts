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

// Función para generar PDF con normas APA
async function generarPDF(datos: any, configuracion: any): Promise<Buffer> {
  const { metadatos, resumenEjecutivo, estudiantes } = datos
  
  // Crear nuevo documento PDF
  const doc = new jsPDF()
  
  // Configurar fuente
  doc.setFont('helvetica')
  
  // Título principal
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(`REPORTE ${metadatos.tipoReporte.toUpperCase()} DE ASISTENCIAS Y RETIROS`, 20, 20)
  
  // Información institucional
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  let yPos = 35
  doc.text(metadatos.institucion.nombre, 20, yPos)
  yPos += 7
  if (metadatos.institucion.direccion) {
    doc.text(metadatos.institucion.direccion, 20, yPos)
    yPos += 7
  }
  if (metadatos.institucion.telefono || metadatos.institucion.email) {
    doc.text(`${metadatos.institucion.telefono || ''} | ${metadatos.institucion.email || ''}`, 20, yPos)
    yPos += 7
  }
  
  // Información del generador
  yPos += 5
  doc.text(`Generado por: ${metadatos.generadoPor.nombre}`, 20, yPos)
  yPos += 7
  if (metadatos.generadoPor.especialidad) {
    doc.text(`Especialidad: ${metadatos.generadoPor.especialidad}`, 20, yPos)
    yPos += 7
  }
  doc.text(`Fecha de generación: ${new Date(metadatos.fechaGeneracion).toLocaleDateString('es-ES')}`, 20, yPos)
  yPos += 7
  doc.text(`Período: ${new Date(metadatos.fechaInicio).toLocaleDateString('es-ES')} - ${new Date(metadatos.fechaFin).toLocaleDateString('es-ES')}`, 20, yPos)
  
  // Resumen ejecutivo
  yPos += 15
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('RESUMEN EJECUTIVO', 20, yPos)
  
  yPos += 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  // Estadísticas principales
  const estadisticas = [
    ['Total de estudiantes evaluados:', resumenEjecutivo.totalEstudiantes.toString()],
    ['Total de registros de asistencia:', resumenEjecutivo.totalAsistencias.toString()],
    ['Total de retiros registrados:', resumenEjecutivo.totalRetiros.toString()],
    ['', ''],
    ['ESTADÍSTICAS DE ASISTENCIA:', ''],
    ['Presente:', `${resumenEjecutivo.estadisticasAsistencia.presente} (${resumenEjecutivo.porcentajes.asistencia}%)`],
    ['Tardanzas:', `${resumenEjecutivo.estadisticasAsistencia.tardanza} (${resumenEjecutivo.porcentajes.tardanzas}%)`],
    ['Inasistencias:', `${resumenEjecutivo.estadisticasAsistencia.inasistencia} (${resumenEjecutivo.porcentajes.inasistencias}%)`],
    ['Justificadas:', resumenEjecutivo.estadisticasAsistencia.justificada.toString()]
  ]
  
  // Agregar tabla de estadísticas
  autoTable(doc, {
    startY: yPos,
    head: [['Métrica', 'Valor']],
    body: estadisticas,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] }
  })
  
  // Detalle por grado y sección (Aulas)
  if (estudiantes.length > 0) {
    doc.addPage()
    yPos = 20
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('DETALLE POR GRADO Y SECCIÓN (AULAS)', 20, yPos)
    
    yPos += 15
    
    // Agrupar estudiantes por grado y sección
    const aulaGroups = estudiantes.reduce((groups: any, estudiante: any) => {
      const aulaKey = `${estudiante.grado}° ${estudiante.seccion}`
      if (!groups[aulaKey]) {
        groups[aulaKey] = {
          grado: estudiante.grado,
          seccion: estudiante.seccion,
          nivel: estudiante.nivel,
          estudiantes: [],
          estadisticas: {
            totalEstudiantes: 0,
            totalAsistencias: 0,
            presente: 0,
            tardanza: 0,
            inasistencia: 0,
            justificada: 0,
            totalRetiros: 0
          }
        }
      }
      
      groups[aulaKey].estudiantes.push(estudiante)
      groups[aulaKey].estadisticas.totalEstudiantes++
      groups[aulaKey].estadisticas.totalAsistencias += estudiante.estadisticas.totalAsistencias
      groups[aulaKey].estadisticas.presente += estudiante.estadisticas.presente
      groups[aulaKey].estadisticas.tardanza += estudiante.estadisticas.tardanza
      groups[aulaKey].estadisticas.inasistencia += estudiante.estadisticas.inasistencia
      groups[aulaKey].estadisticas.justificada += estudiante.estadisticas.justificada
      groups[aulaKey].estadisticas.totalRetiros += estudiante.estadisticas.totalRetiros
      
      return groups
    }, {})
    
    // Generar tabla resumen por aula
    const aulasData = Object.entries(aulaGroups).map(([aulaKey, aula]: [string, any]) => {
      const porcentajeAsistencia = aula.estadisticas.totalAsistencias > 0 ? 
        (((aula.estadisticas.presente + aula.estadisticas.tardanza) / aula.estadisticas.totalAsistencias) * 100).toFixed(1) : '0'
      
      return [
        aulaKey,
        aula.nivel,
        aula.estadisticas.totalEstudiantes.toString(),
        aula.estadisticas.totalAsistencias.toString(),
        aula.estadisticas.presente.toString(),
        aula.estadisticas.tardanza.toString(),
        aula.estadisticas.inasistencia.toString(),
        aula.estadisticas.justificada.toString(),
        aula.estadisticas.totalRetiros.toString(),
        `${porcentajeAsistencia}%`
      ]
    })
    
    autoTable(doc, {
      startY: yPos,
      head: [['Aula', 'Nivel', 'Est.', 'Total Asist.', 'Presente', 'Tardanzas', 'Faltas', 'Justif.', 'Retiros', '% Asist.']],
      body: aulasData,
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [52, 152, 219] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 20 },
        2: { cellWidth: 15 },
        3: { cellWidth: 20 },
        4: { cellWidth: 15 },
        5: { cellWidth: 15 },
        6: { cellWidth: 15 },
        7: { cellWidth: 15 },
        8: { cellWidth: 15 },
        9: { cellWidth: 20 }
      }
    })
    
    // Detalle por cada aula
    let currentY = (doc as any).lastAutoTable.finalY + 20
    
    Object.entries(aulaGroups).forEach(([aulaKey, aula]: [string, any]) => {
      // Verificar si necesitamos nueva página
      if (currentY > 250) {
        doc.addPage()
        currentY = 20
      }
      
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(`DETALLE DEL AULA: ${aulaKey} - ${aula.nivel}`, 20, currentY)
      currentY += 10
      
      // Tabla de estudiantes del aula
      const estudiantesAulaData = aula.estudiantes.map((estudiante: any) => [
        `${estudiante.apellido}, ${estudiante.nombre}`,
        estudiante.dni,
        estudiante.estadisticas.totalAsistencias.toString(),
        estudiante.estadisticas.presente.toString(),
        estudiante.estadisticas.tardanza.toString(),
        estudiante.estadisticas.inasistencia.toString(),
        estudiante.estadisticas.justificada.toString(),
        estudiante.estadisticas.totalRetiros.toString()
      ])
      
      autoTable(doc, {
        startY: currentY,
        head: [['Estudiante', 'DNI', 'Total', 'Presente', 'Tardanzas', 'Faltas', 'Justif.', 'Retiros']],
        body: estudiantesAulaData,
        theme: 'grid',
        styles: { fontSize: 7 },
        headStyles: { fillColor: [46, 204, 113] },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 25 },
          2: { cellWidth: 15 },
          3: { cellWidth: 15 },
          4: { cellWidth: 15 },
          5: { cellWidth: 15 },
          6: { cellWidth: 15 },
          7: { cellWidth: 15 }
        }
      })
      
      currentY = (doc as any).lastAutoTable.finalY + 15
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
    doc.addPage()
    yPos = 20
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('DETALLE DE JUSTIFICACIONES', 20, yPos)
    
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
      head: [['#', 'Estudiante', 'DNI', 'Aula', 'Fecha Falta', 'Motivo', 'Fecha Just.', 'Documento']],
      body: justificacionesData,
      theme: 'striped',
      styles: { fontSize: 7 },
      headStyles: { fillColor: [231, 76, 60] },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 40 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 35 },
        6: { cellWidth: 20 },
        7: { cellWidth: 15 }
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
  
  // Pie de página con referencia APA
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`Página ${i} de ${pageCount}`, 20, 285)
    
    if (i === pageCount) {
      doc.text('---', 20, 270)
      doc.text('Documento generado automáticamente por el Sistema de Gestión Educativa', 20, 275)
      doc.text(`Fecha y hora de generación: ${new Date().toLocaleString('es-ES')}`, 20, 280)
      
      // Referencia APA
      doc.setFontSize(7)
      doc.text(`Referencia APA: ${metadatos.generadoPor.nombre}. (${new Date().getFullYear()}). Reporte ${metadatos.tipoReporte} de asistencias y retiros. ${metadatos.institucion.nombre}.`, 20, 290)
    }
  }
  
  // Convertir a buffer
  const pdfOutput = doc.output('arraybuffer')
  return Buffer.from(pdfOutput)
}

// Función para generar Excel con normas APA
async function generarExcel(datos: any, configuracion: any): Promise<Buffer> {
  const { metadatos, resumenEjecutivo, estudiantes } = datos
  
  // Crear nuevo workbook
  const wb = XLSX.utils.book_new()
  
  // Hoja 1: Información del reporte
  const infoData = [
    ['REPORTE DE ASISTENCIAS Y RETIROS'],
    [''],
    ['Información del Reporte'],
    ['Tipo:', metadatos.tipoReporte.toUpperCase()],
    ['Institución:', metadatos.institucion.nombre],
    ['Generado por:', metadatos.generadoPor.nombre],
    ['Especialidad:', metadatos.generadoPor.especialidad || 'N/A'],
    ['Fecha de generación:', new Date(metadatos.fechaGeneracion).toLocaleDateString('es-ES')],
    ['Período:', `${new Date(metadatos.fechaInicio).toLocaleDateString('es-ES')} - ${new Date(metadatos.fechaFin).toLocaleDateString('es-ES')}`],
    [''],
    ['Resumen Ejecutivo'],
    ['Total estudiantes:', resumenEjecutivo.totalEstudiantes],
    ['Total asistencias:', resumenEjecutivo.totalAsistencias],
    ['Total retiros:', resumenEjecutivo.totalRetiros],
    ['Porcentaje asistencia:', `${resumenEjecutivo.porcentajes.asistencia}%`],
    ['Porcentaje tardanzas:', `${resumenEjecutivo.porcentajes.tardanzas}%`],
    ['Porcentaje inasistencias:', `${resumenEjecutivo.porcentajes.inasistencias}%`]
  ]
  
  const wsInfo = XLSX.utils.aoa_to_sheet(infoData)
  XLSX.utils.book_append_sheet(wb, wsInfo, 'Información')
  
  // Hoja 2: Detalle de estudiantes
  const estudiantesHeaders = [
    'DNI', 'Apellidos', 'Nombres', 'Grado', 'Sección', 
    'Total Asistencias', 'Presente', 'Tardanzas', 'Inasistencias', 'Justificadas', 'Retiros'
  ]
  
  const estudiantesData = estudiantes.map((estudiante: any) => [
    estudiante.dni,
    estudiante.apellido,
    estudiante.nombre,
    estudiante.grado,
    estudiante.seccion,
    estudiante.estadisticas.totalAsistencias,
    estudiante.estadisticas.presente,
    estudiante.estadisticas.tardanza,
    estudiante.estadisticas.inasistencia,
    estudiante.estadisticas.justificada,
    estudiante.estadisticas.totalRetiros
  ])
  
  const wsEstudiantes = XLSX.utils.aoa_to_sheet([estudiantesHeaders, ...estudiantesData])
  XLSX.utils.book_append_sheet(wb, wsEstudiantes, 'Estudiantes')
  
  // Hoja 3: Asistencias detalladas
  if (estudiantes.length > 0 && estudiantes[0].asistencias?.length > 0) {
    const asistenciasHeaders = ['Estudiante', 'DNI', 'Fecha', 'Sesión', 'Estado', 'Hora Entrada', 'Observaciones']
    const asistenciasData: any[] = []
    
    estudiantes.forEach((estudiante: any) => {
      estudiante.asistencias.forEach((asistencia: any) => {
        asistenciasData.push([
          `${estudiante.nombre} ${estudiante.apellido}`,
          estudiante.dni,
          asistencia.fecha,
          asistencia.sesion,
          asistencia.estado,
          asistencia.horaEntrada || 'N/A',
          asistencia.observaciones || ''
        ])
      })
    })
    
    const wsAsistencias = XLSX.utils.aoa_to_sheet([asistenciasHeaders, ...asistenciasData])
    XLSX.utils.book_append_sheet(wb, wsAsistencias, 'Asistencias')
  }
  
  // Hoja 4: Retiros detallados
  if (estudiantes.some((e: any) => e.retiros?.length > 0)) {
    const retirosHeaders = ['Estudiante', 'DNI', 'Fecha', 'Hora', 'Tipo', 'Estado', 'Apoderado que retira']
    const retirosData: any[] = []
    
    estudiantes.forEach((estudiante: any) => {
      estudiante.retiros?.forEach((retiro: any) => {
        retirosData.push([
          `${estudiante.nombre} ${estudiante.apellido}`,
          estudiante.dni,
          retiro.fecha,
          retiro.hora,
          retiro.tipoRetiro,
          retiro.estado,
          retiro.apoderadoQueRetira || 'N/A'
        ])
      })
    })
    
    const wsRetiros = XLSX.utils.aoa_to_sheet([retirosHeaders, ...retirosData])
    XLSX.utils.book_append_sheet(wb, wsRetiros, 'Retiros')
  }
  
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
