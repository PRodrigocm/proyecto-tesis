import { PrismaClient } from '@prisma/client'
import QRCode from 'qrcode'
import jsPDF from 'jspdf'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

interface EstudianteQR {
  idEstudiante: number
  dni: string
  nombre: string
  apellido: string
  grado?: string
  seccion?: string
  qrCode: string
}

async function generateQRCode(dni: string): Promise<string> {
  try {
    // Generar QR code como base64
    const qrCodeDataURL = await QRCode.toDataURL(dni, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    return qrCodeDataURL
  } catch (error) {
    console.error(`Error generando QR para DNI ${dni}:`, error)
    throw error
  }
}

async function obtenerEstudiantes(): Promise<EstudianteQR[]> {
  console.log('📚 Obteniendo estudiantes de la base de datos...')
  
  const estudiantes = await prisma.estudiante.findMany({
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
      {
        gradoSeccion: {
          grado: {
            nombre: 'asc'
          }
        }
      },
      {
        gradoSeccion: {
          seccion: {
            nombre: 'asc'
          }
        }
      },
      {
        usuario: {
          apellido: 'asc'
        }
      }
    ]
  })

  console.log(`✅ Encontrados ${estudiantes.length} estudiantes`)

  const estudiantesQR: EstudianteQR[] = []

  for (const estudiante of estudiantes) {
    if (!estudiante.usuario.dni) {
      console.warn(`⚠️  Estudiante ${estudiante.usuario.nombre} ${estudiante.usuario.apellido} no tiene DNI`)
      continue
    }

    console.log(`🔄 Generando QR para: ${estudiante.usuario.apellido}, ${estudiante.usuario.nombre} (DNI: ${estudiante.usuario.dni})`)
    
    try {
      const qrCode = await generateQRCode(estudiante.usuario.dni)
      
      estudiantesQR.push({
        idEstudiante: estudiante.idEstudiante,
        dni: estudiante.usuario.dni,
        nombre: estudiante.usuario.nombre || '',
        apellido: estudiante.usuario.apellido || '',
        grado: estudiante.gradoSeccion?.grado.nombre || 'Sin grado',
        seccion: estudiante.gradoSeccion?.seccion.nombre || 'Sin sección',
        qrCode
      })
    } catch (error) {
      console.error(`❌ Error generando QR para estudiante ${estudiante.usuario.dni}:`, error)
    }
  }

  return estudiantesQR
}

async function generarPDF(estudiantes: EstudianteQR[]): Promise<string> {
  console.log('📄 Generando PDF con códigos QR...')
  
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  
  // Configuración de layout
  const margin = 10
  const qrSize = 40
  const cardWidth = 85
  const cardHeight = 60
  const cardsPerRow = 2
  const cardsPerColumn = 4
  const cardsPerPage = cardsPerRow * cardsPerColumn
  
  // Título del documento
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('CÓDIGOS QR - ESTUDIANTES', pageWidth / 2, 15, { align: 'center' })
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generado el: ${new Date().toLocaleDateString('es-PE')}`, pageWidth / 2, 22, { align: 'center' })
  doc.text(`Total de estudiantes: ${estudiantes.length}`, pageWidth / 2, 27, { align: 'center' })

  let currentPage = 1
  let cardIndex = 0

  for (let i = 0; i < estudiantes.length; i++) {
    const estudiante = estudiantes[i]
    
    // Calcular posición en la página
    const row = Math.floor(cardIndex / cardsPerRow)
    const col = cardIndex % cardsPerRow
    
    const x = margin + (col * cardWidth)
    const y = 35 + (row * cardHeight) // 35mm desde arriba para dejar espacio al título
    
    // Dibujar borde de la tarjeta
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.5)
    doc.rect(x, y, cardWidth, cardHeight)
    
    // Información del estudiante
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(`${estudiante.apellido}, ${estudiante.nombre}`, x + 2, y + 8)
    
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`DNI: ${estudiante.dni}`, x + 2, y + 14)
    doc.text(`Grado: ${estudiante.grado}° ${estudiante.seccion}`, x + 2, y + 19)
    doc.text(`ID: ${estudiante.idEstudiante}`, x + 2, y + 24)
    
    // Agregar código QR
    try {
      doc.addImage(
        estudiante.qrCode,
        'PNG',
        x + cardWidth - qrSize - 5,
        y + 5,
        qrSize,
        qrSize
      )
    } catch (error) {
      console.error(`Error agregando QR para ${estudiante.dni}:`, error)
      // Dibujar un rectángulo como placeholder si falla el QR
      doc.setFillColor(240, 240, 240)
      doc.rect(x + cardWidth - qrSize - 5, y + 5, qrSize, qrSize, 'F')
      doc.setFontSize(6)
      doc.text('QR ERROR', x + cardWidth - qrSize/2 - 5, y + qrSize/2 + 5, { align: 'center' })
    }
    
    cardIndex++
    
    // Nueva página si es necesario
    if (cardIndex >= cardsPerPage && i < estudiantes.length - 1) {
      doc.addPage()
      currentPage++
      cardIndex = 0
      
      // Título en nueva página
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(`CÓDIGOS QR - ESTUDIANTES (Página ${currentPage})`, pageWidth / 2, 15, { align: 'center' })
    }
  }
  
  // Crear directorio de salida si no existe
  const outputDir = path.join(process.cwd(), 'output')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }
  
  // Guardar PDF
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
  const filename = `codigos-qr-estudiantes-${timestamp}.pdf`
  const filepath = path.join(outputDir, filename)
  
  doc.save(filepath)
  
  console.log(`✅ PDF generado exitosamente: ${filepath}`)
  return filepath
}

async function actualizarCodigosQREnBD(estudiantes: EstudianteQR[]): Promise<void> {
  console.log('💾 Actualizando códigos QR en la base de datos...')
  
  for (const estudiante of estudiantes) {
    try {
      await prisma.estudiante.update({
        where: { idEstudiante: estudiante.idEstudiante },
        data: { qr: estudiante.dni } // Usar el DNI como código QR
      })
    } catch (error) {
      console.error(`Error actualizando QR para estudiante ${estudiante.dni}:`, error)
    }
  }
  
  console.log('✅ Códigos QR actualizados en la base de datos')
}

async function generarEstadisticas(estudiantes: EstudianteQR[]): Promise<void> {
  console.log('\n📊 ESTADÍSTICAS DE GENERACIÓN:')
  console.log('=' .repeat(50))
  
  const porGrado = estudiantes.reduce((acc, est) => {
    const grado = `${est.grado}° ${est.seccion}`
    acc[grado] = (acc[grado] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  console.log('📚 Estudiantes por grado y sección:')
  Object.entries(porGrado)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([grado, cantidad]) => {
      console.log(`   ${grado}: ${cantidad} estudiantes`)
    })
  
  console.log(`\n📈 Total de códigos QR generados: ${estudiantes.length}`)
  console.log(`📅 Fecha de generación: ${new Date().toLocaleString('es-PE')}`)
}

async function main() {
  try {
    console.log('🚀 INICIANDO GENERACIÓN DE CÓDIGOS QR PARA ESTUDIANTES')
    console.log('=' .repeat(60))
    
    // 1. Obtener estudiantes y generar QR codes
    const estudiantes = await obtenerEstudiantes()
    
    if (estudiantes.length === 0) {
      console.log('⚠️  No se encontraron estudiantes con DNI válido')
      return
    }
    
    // 2. Generar PDF
    const pdfPath = await generarPDF(estudiantes)
    
    // 3. Actualizar códigos QR en la base de datos
    await actualizarCodigosQREnBD(estudiantes)
    
    // 4. Mostrar estadísticas
    await generarEstadisticas(estudiantes)
    
    console.log('\n🎉 PROCESO COMPLETADO EXITOSAMENTE')
    console.log('=' .repeat(60))
    console.log(`📁 Archivo PDF generado: ${pdfPath}`)
    console.log('💡 Los códigos QR están basados en el DNI de cada estudiante')
    console.log('💾 Los códigos QR han sido actualizados en la base de datos')
    
  } catch (error) {
    console.error('❌ Error durante la generación:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main()
}

export { main as generateQRPDF }
