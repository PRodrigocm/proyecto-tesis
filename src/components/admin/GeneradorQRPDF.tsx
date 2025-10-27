'use client'

import { useState } from 'react'
import QRCode from 'qrcode'
import jsPDF from 'jspdf'

interface Estudiante {
  id: string
  nombre: string
  codigo: string
  grado?: string
  seccion?: string
}

export default function GeneradorQRPDF() {
  const [loading, setLoading] = useState(false)
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [error, setError] = useState('')

  // Cargar estudiantes desde la API
  const cargarEstudiantes = async () => {
    try {
      setLoading(true)
      setError('')

      // Verificar que estamos en el cliente
      if (typeof window === 'undefined') {
        throw new Error('Esta función solo puede ejecutarse en el cliente')
      }

      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación. Por favor, inicia sesión nuevamente.')
      }

      console.log('🔐 Token encontrado, cargando estudiantes...')

      const response = await fetch('/api/usuarios/estudiantes', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('📡 Respuesta de API:', response.status, response.statusText)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Datos recibidos:', data)
        setEstudiantes(data.estudiantes || [])
        
        if (!data.estudiantes || data.estudiantes.length === 0) {
          setError('No se encontraron estudiantes registrados en el sistema')
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        console.error('❌ Error de API:', response.status, errorData)
        
        if (response.status === 401) {
          setError('Sesión expirada. Por favor, inicia sesión nuevamente.')
          // Limpiar token inválido
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        } else if (response.status === 403) {
          setError('No tienes permisos para acceder a esta información.')
        } else {
          setError(`Error del servidor: ${errorData.error || 'Error desconocido'}`)
        }
      }
    } catch (error) {
      console.error('💥 Error completo:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('token')) {
          setError('Problema de autenticación. Por favor, inicia sesión nuevamente.')
        } else if (error.message.includes('cliente')) {
          setError('Error de inicialización. Recarga la página.')
        } else {
          setError(`Error: ${error.message}`)
        }
      } else {
        setError('Error inesperado al cargar estudiantes')
      }
      
      // NO usar datos de ejemplo - solo datos reales de la BD
      setEstudiantes([])
    } finally {
      setLoading(false)
    }
  }

  // Generar PDF con códigos QR
  const generarPDF = async () => {
    if (estudiantes.length === 0) {
      setError('No hay estudiantes para generar códigos QR')
      return
    }

    try {
      setLoading(true)
      setError('')

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      
      // Configuración para 6 QR por página (3 columnas x 2 filas)
      // QR más grande para mejor escaneo
      const qrSize = 60 // Tamaño del QR en mm (6cm - más grande y visible)
      const cardWidth = 68 // Ancho de cada tarjeta
      const cardHeight = 130 // Alto de cada tarjeta
      const margin = 3
      const cols = 3 // 3 columnas por página
      const rows = 2 // 2 filas por página (6 tarjetas total)
      
      let currentPage = 1
      let currentRow = 0
      let currentCol = 0

      // Título de la primera página
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Códigos QR - Estudiantes', pageWidth / 2, 15, { align: 'center' })

      for (let i = 0; i < estudiantes.length; i++) {
        const estudiante = estudiantes[i]

        // Calcular posición
        const x = margin + (currentCol * cardWidth)
        const y = 25 + (currentRow * cardHeight)

        // Generar código QR con configuración óptima
        const qrDataURL = await QRCode.toDataURL(estudiante.codigo, {
          width: 800, // Alta resolución para impresión
          margin: 2, // Margen alrededor del QR
          errorCorrectionLevel: 'H', // Nivel H: 30% de corrección de errores (máximo)
          type: 'image/png',
          quality: 1.0,
          color: {
            dark: '#000000',  // Color negro para los módulos
            light: '#FFFFFF'  // Color blanco para el fondo
          },
          // Configuración adicional para mejor calidad
          rendererOpts: {
            quality: 1.0
          }
        })

        // Dibujar borde de la tarjeta
        pdf.setDrawColor(0, 0, 0)
        pdf.setLineWidth(0.5)
        pdf.rect(x, y, cardWidth, cardHeight)

        // Centrar el QR horizontalmente en la tarjeta
        const qrX = x + (cardWidth - qrSize) / 2
        const qrY = y + 10
        
        // Dibujar borde del QR
        pdf.setDrawColor(0, 0, 0)
        pdf.setLineWidth(0.8)
        pdf.rect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4)
        
        // Agregar código QR centrado
        pdf.addImage(qrDataURL, 'PNG', qrX, qrY, qrSize, qrSize)

        // Posición Y después del QR
        let textY = qrY + qrSize + 5
        
        // Código del estudiante (SIN BORDE - solo texto)
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.text(estudiante.codigo, x + cardWidth / 2, textY + 6, { align: 'center' })
        
        textY += 10
        
        // Grado y Sección (con borde)
        if (estudiante.grado && estudiante.seccion) {
          const gradoBoxHeight = 7
          pdf.setDrawColor(0, 0, 0)
          pdf.setLineWidth(0.4)
          pdf.rect(x + 8, textY, cardWidth - 16, gradoBoxHeight)
          pdf.setFontSize(8)
          pdf.setFont('helvetica', 'normal')
          pdf.text(`${estudiante.grado}° - Sec ${estudiante.seccion}`, x + cardWidth / 2, textY + 5, { align: 'center' })
          textY += gradoBoxHeight + 2
        }
        
        // Nombre completo (SIN BORDE - solo texto)
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'bold')
        
        // Dividir nombre si es muy largo
        const nombreCompleto = estudiante.nombre
        const maxWidth = cardWidth - 8
        const nombreLineas = pdf.splitTextToSize(nombreCompleto, maxWidth)
        
        if (nombreLineas.length === 1) {
          pdf.text(nombreLineas[0], x + cardWidth / 2, textY + 6, { align: 'center' })
        } else {
          pdf.setFontSize(8)
          pdf.text(nombreLineas[0], x + cardWidth / 2, textY + 3, { align: 'center' })
          if (nombreLineas[1]) {
            pdf.text(nombreLineas[1], x + cardWidth / 2, textY + 8, { align: 'center' })
          }
        }

        // Avanzar posición
        currentCol++
        if (currentCol >= cols) {
          currentCol = 0
          currentRow++
          
          if (currentRow >= rows && i < estudiantes.length - 1) {
            // Nueva página
            pdf.addPage()
            currentPage++
            currentRow = 0
            
            // Título de la nueva página
            pdf.setFontSize(16)
            pdf.setFont('helvetica', 'bold')
            pdf.text(`Códigos QR - Estudiantes (Página ${currentPage})`, pageWidth / 2, 15, { align: 'center' })
          }
        }
      }

      // Descargar PDF
      const fecha = new Date().toISOString().split('T')[0]
      pdf.save(`codigos-qr-estudiantes-${fecha}.pdf`)

    } catch (error) {
      console.error('Error al generar PDF:', error)
      setError('Error al generar el PDF')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-black mb-2">Generar PDF de Códigos QR</h2>
        <p className="text-black">
          Genera un PDF con todos los códigos QR de los estudiantes para imprimir y distribuir.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex space-x-4">
          <button
            onClick={() => {
              console.log('🔍 Verificando autenticación...')
              const token = localStorage.getItem('token')
              const user = localStorage.getItem('user')
              console.log('Token:', token ? 'Presente' : 'Ausente')
              console.log('User:', user ? JSON.parse(user) : 'Ausente')
              if (!token) {
                alert('❌ No hay token de autenticación')
              } else {
                alert('✅ Token encontrado, procediendo a cargar estudiantes')
                cargarEstudiantes()
              }
            }}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Cargando...' : 'Cargar Estudiantes'}
          </button>

          {estudiantes.length > 0 && (
            <button
              onClick={generarPDF}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Generando PDF...' : '📄 Generar PDF'}
            </button>
          )}
        </div>

        {estudiantes.length > 0 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-semibold text-black mb-2">
              ✅ Estudiantes encontrados: {estudiantes.length}
            </h3>
            <p className="text-sm text-gray-600">
              Los códigos QR se generarán para todos los estudiantes activos del sistema.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-black mb-2">📋 Información del PDF:</h4>
        <ul className="text-sm text-black space-y-1">
          <li>• <strong>Formato:</strong> A4, 3 columnas x 2 filas por página (6 tarjetas por hoja)</li>
          <li>• <strong>Diseño:</strong> QR grande arriba, Código destacado (14pt), Grado/Sección y Nombre</li>
          <li>• <strong>Tamaño QR:</strong> 60mm x 60mm (6cm - detectable hasta 6 metros)</li>
          <li>• <strong>Código:</strong> 14pt bold - Visible y legible</li>
          <li>• <strong>Resolución:</strong> 800px con corrección de errores nivel H (máxima calidad)</li>
          <li>• <strong>Tamaño tarjeta:</strong> 68mm x 130mm</li>
          <li>• <strong>Tarjetas por hoja:</strong> 6 (optimiza papel y distribución)</li>
          <li>• <strong>Uso:</strong> Imprimir en A4 de alta calidad, recortar y distribuir</li>
        </ul>
      </div>
    </div>
  )
}
