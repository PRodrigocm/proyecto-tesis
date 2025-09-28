import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Extender el tipo jsPDF para incluir autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export async function GET(request: NextRequest) {
  console.log('🚀 API reportes/generar iniciada')
  
  try {
    // Verificar autenticación
    console.log('🔐 Verificando token...')
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Header de autorización faltante')
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // Remover "Bearer "
    const decoded = verifyToken(token)
    
    if (!decoded) {
      console.log('❌ Token inválido')
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    const ieId = decoded.idIe || 1 // Fallback a IE 1 si no está definido
    console.log('✅ Token válido, ieId:', ieId)

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

    switch (tipo) {
      case 'asistencia-diaria':
        reportTitle = 'Reporte de Asistencia Diaria'
        reportData = await generateAsistenciaDiariaData(ieId, fechaInicio, fechaFin, gradoId || undefined, seccionId || undefined)
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
      default:
        return NextResponse.json(
          { error: 'Tipo de reporte no válido' },
          { status: 400 }
        )
    }

    console.log(`📊 Datos del reporte generados: ${reportData.length} registros`)

    // Generar archivo según el formato
    if (formato === 'excel') {
      const excelBuffer = generateExcelReport(reportData, reportTitle)
      
      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="reporte-${tipo}-${new Date().toISOString().split('T')[0]}.xlsx"`
        }
      })
    } else if (formato === 'pdf') {
      const pdfBuffer = await generatePDFReport(reportData, reportTitle)
      
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="reporte-${tipo}-${new Date().toISOString().split('T')[0]}.pdf"`
        }
      })
    } else {
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
      { fecha: 'desc' },
      { horaEntrada: 'asc' }
    ]
  })

  return asistencias.map(asistencia => ({
    Fecha: asistencia.fecha.toLocaleDateString('es-ES'),
    Estudiante: `${asistencia.estudiante.usuario.nombre} ${asistencia.estudiante.usuario.apellido}`,
    Grado: asistencia.estudiante.gradoSeccion?.grado.nombre || 'N/A',
    Sección: asistencia.estudiante.gradoSeccion?.seccion.nombre || 'N/A',
    'Hora Entrada': asistencia.horaEntrada?.toLocaleTimeString('es-ES') || 'N/A',
    'Hora Salida': asistencia.horaSalida?.toLocaleTimeString('es-ES') || 'N/A',
    Sesión: asistencia.sesion
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

// Función para generar datos de asistencia por estudiante
async function generateAsistenciaEstudianteData(ieId: number, fechaInicio: Date, fechaFin: Date, gradoId?: string, seccionId?: string) {
  // Similar a mensual pero con más detalle por estudiante
  return generateAsistenciaMensualData(ieId, fechaInicio, fechaFin, gradoId, seccionId)
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

// Función para generar reporte Excel real
function generateExcelReport(data: any[], title: string): Buffer {
  try {
    console.log('📊 Generando archivo Excel...')
    
    if (!data || data.length === 0) {
      // Crear archivo con mensaje de no datos
      const emptyData = [{ Mensaje: 'No hay datos disponibles para el período seleccionado' }]
      const ws = XLSX.utils.json_to_sheet(emptyData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Reporte')
      
      // Agregar título
      XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: 'A1' })
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
      console.log('✅ Archivo Excel vacío generado')
      return buffer
    }

    // Crear hoja de trabajo desde los datos
    const ws = XLSX.utils.json_to_sheet(data)
    
    // Crear libro de trabajo
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte')
    
    // Agregar título en la primera fila
    XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: 'A1' })
    
    // Ajustar el rango para incluir el título
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
    range.s.r = 0 // Empezar desde la fila 0
    ws['!ref'] = XLSX.utils.encode_range(range)
    
    // Generar buffer del archivo Excel
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    
    console.log('✅ Archivo Excel generado exitosamente')
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

// Función para generar reporte PDF real
async function generatePDFReport(data: any[], title: string): Promise<Buffer> {
  try {
    console.log('📄 Generando archivo PDF...')
    
    // Crear nuevo documento PDF
    const doc = new jsPDF()
    
    // Configurar fuente
    doc.setFont('helvetica', 'normal')
    
    // Agregar título
    doc.setFontSize(16)
    doc.text(title, 20, 20)
    
    // Agregar fecha de generación
    doc.setFontSize(10)
    doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`, 20, 30)
    
    if (!data || data.length === 0) {
      // Mensaje de no datos
      doc.setFontSize(12)
      doc.text('No hay datos disponibles para el período seleccionado', 20, 50)
      
      console.log('✅ PDF vacío generado')
      return Buffer.from(doc.output('arraybuffer'))
    }
    
    // Preparar datos para la tabla
    const headers = Object.keys(data[0])
    const rows = data.map(item => headers.map(header => String(item[header] || '')))
    
    // Agregar tabla usando autoTable
    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 40,
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [66, 139, 202], // Color azul
        textColor: [255, 255, 255], // Texto blanco
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245] // Gris claro para filas alternas
      },
      margin: { top: 40, left: 20, right: 20 },
      theme: 'striped'
    })
    
    // Agregar pie de página
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10)
    }
    
    console.log('✅ PDF generado exitosamente')
    return Buffer.from(doc.output('arraybuffer'))
    
  } catch (error) {
    console.error('❌ Error generando PDF:', error)
    
    // Fallback: crear PDF simple con error
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Error al generar reporte', 20, 20)
    doc.setFontSize(12)
    doc.text('No se pudo generar el reporte. Contacte al administrador.', 20, 40)
    
    return Buffer.from(doc.output('arraybuffer'))
  }
}
