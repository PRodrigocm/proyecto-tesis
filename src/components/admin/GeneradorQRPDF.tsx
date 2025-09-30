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
      
      // Datos de ejemplo como fallback
      console.log('📋 Usando datos de ejemplo como fallback')
      setEstudiantes([
        { id: '1', nombre: 'Juan Pérez', codigo: 'EST001', grado: '1°', seccion: 'A' },
        { id: '2', nombre: 'María González', codigo: 'EST002', grado: '1°', seccion: 'A' },
        { id: '3', nombre: 'Carlos López', codigo: 'EST003', grado: '1°', seccion: 'B' },
        { id: '4', nombre: 'Ana Martínez', codigo: 'EST004', grado: '2°', seccion: 'A' },
        { id: '5', nombre: 'Luis Rodríguez', codigo: 'EST005', grado: '2°', seccion: 'B' }
      ])
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
      
      // Configuración de la cuadrícula
      const qrSize = 40 // Tamaño del QR en mm
      const cardWidth = 85 // Ancho de cada tarjeta
      const cardHeight = 55 // Alto de cada tarjeta
      const margin = 10
      const cols = 2 // 2 columnas por página
      const rows = 4 // 4 filas por página
      
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

        // Generar código QR
        const qrDataURL = await QRCode.toDataURL(estudiante.codigo, {
          width: 200,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })

        // Dibujar borde de la tarjeta
        pdf.setDrawColor(200, 200, 200)
        pdf.rect(x, y, cardWidth, cardHeight)

        // Agregar código QR
        pdf.addImage(qrDataURL, 'PNG', x + 5, y + 5, qrSize, qrSize)

        // Agregar información del estudiante
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'bold')
        pdf.text(estudiante.nombre, x + qrSize + 10, y + 15)
        
        pdf.setFont('helvetica', 'normal')
        pdf.text(`Código: ${estudiante.codigo}`, x + qrSize + 10, y + 25)
        
        if (estudiante.grado && estudiante.seccion) {
          pdf.text(`${estudiante.grado} - Sección ${estudiante.seccion}`, x + qrSize + 10, y + 35)
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
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-black mb-3">
              Estudiantes encontrados: {estudiantes.length}
            </h3>
            <div className="max-h-60 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-black">Código</th>
                    <th className="px-4 py-2 text-left text-black">Nombre</th>
                    <th className="px-4 py-2 text-left text-black">Grado</th>
                  </tr>
                </thead>
                <tbody>
                  {estudiantes.map((estudiante) => (
                    <tr key={estudiante.id} className="border-t">
                      <td className="px-4 py-2 text-black font-mono">{estudiante.codigo}</td>
                      <td className="px-4 py-2 text-black">{estudiante.nombre}</td>
                      <td className="px-4 py-2 text-black">
                        {estudiante.grado && estudiante.seccion 
                          ? `${estudiante.grado} - ${estudiante.seccion}`
                          : 'N/A'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-black mb-2">📋 Información del PDF:</h4>
        <ul className="text-sm text-black space-y-1">
          <li>• <strong>Formato:</strong> A4, 2 columnas x 4 filas por página</li>
          <li>• <strong>Contenido:</strong> Código QR + Nombre + Código + Grado/Sección</li>
          <li>• <strong>Tamaño QR:</strong> 40mm x 40mm (ideal para escaneo)</li>
          <li>• <strong>Uso:</strong> Imprimir y recortar para distribuir a estudiantes</li>
        </ul>
      </div>
    </div>
  )
}
