'use client'

import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import jsPDF from 'jspdf'

interface Estudiante {
  id: string
  nombre: string
  codigo: string
  grado?: string
  seccion?: string
  idGradoSeccion?: number | null
}

interface GradoSeccion {
  idGradoSeccion: number
  grado: { nombre: string; nivel: { nombre: string } }
  seccion: { nombre: string }
}

type ModoGeneracion = 'todos' | 'grado' | 'estudiante'

export default function GeneradorQRPDF() {
  const [loading, setLoading] = useState(false)
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [estudiantesFiltrados, setEstudiantesFiltrados] = useState<Estudiante[]>([])
  const [gradosSecciones, setGradosSecciones] = useState<GradoSeccion[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modoGeneracion, setModoGeneracion] = useState<ModoGeneracion>('todos')
  const [gradoSeleccionado, setGradoSeleccionado] = useState<number | null>(null)
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    const cargarGrados = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch('/api/grados-secciones?ieId=1', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setGradosSecciones(data.data || [])
        }
      } catch (e) { console.error(e) }
    }
    cargarGrados()
  }, [])

  const cargarEstudiantes = async () => {
    try {
      setLoading(true)
      setError('')
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No hay token')

      const res = await fetch('/api/usuarios/estudiantes', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        console.log('Estudiantes cargados:', data.estudiantes)
        // Log de idGradoSeccion para debug
        data.estudiantes?.forEach((e: Estudiante) => {
          console.log(`${e.nombre}: idGradoSeccion=${e.idGradoSeccion}`)
        })
        setEstudiantes(data.estudiantes || [])
        setEstudiantesFiltrados(data.estudiantes || [])
        setSuccess(`✅ ${data.estudiantes?.length || 0} estudiantes cargados`)
      } else {
        setError('Error al cargar estudiantes')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let filtrados = [...estudiantes]
    
    if (modoGeneracion === 'grado' && gradoSeleccionado) {
      filtrados = estudiantes.filter(e => e.idGradoSeccion === gradoSeleccionado)
      console.log(`Filtro por grado ${gradoSeleccionado}: ${filtrados.length} estudiantes`)
    } else if (modoGeneracion === 'estudiante' && estudianteSeleccionado) {
      filtrados = estudiantes.filter(e => e.id === estudianteSeleccionado)
      console.log(`Filtro individual ${estudianteSeleccionado}: ${filtrados.length} estudiantes`)
    } else if (modoGeneracion === 'todos') {
      console.log(`Modo todos: ${filtrados.length} estudiantes`)
    }
    
    if (busqueda.trim()) {
      const b = busqueda.toLowerCase()
      filtrados = filtrados.filter(e => e.nombre.toLowerCase().includes(b) || e.codigo.toLowerCase().includes(b))
    }
    
    setEstudiantesFiltrados(filtrados)
  }, [modoGeneracion, gradoSeleccionado, estudianteSeleccionado, estudiantes, busqueda])

  const generarPDF = async () => {
    if (estudiantesFiltrados.length === 0) {
      setError('No hay estudiantes para generar')
      return
    }
    try {
      setLoading(true)
      
      // ===== CONFIGURACIÓN A4 VERTICAL =====
      // A4: 210mm × 297mm orientación vertical
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      // ===== DIMENSIONES DE CREDENCIAL =====
      const cardWidth = 105      // 210 / 2 = 105mm exacto
      const cardHeight = 148.5   // 297 / 2 = 148.5mm exacto
      const margin = 5           // Margen interno mínimo 5mm
      const headerHeight = 22    // Barra azul de 22mm
      
      // ===== CÓDIGO QR - MÁXIMO POSIBLE =====
      // Ancho disponible: 105mm - (5mm * 2) = 95mm
      // Usamos 93mm para dejar espacio al marco
      const qrSize = 93          // QR lo más grande posible
      // 300 dpi: 93mm = 3.66 pulgadas × 300 = 1098px (alta resolución)
      const qrPixels = 1098
      
      const qrsPerPage = 4
      
      // Posiciones 2×2 (sin espacios entre credenciales)
      const positions = [
        { col: 0, row: 0 }, // Superior izquierda
        { col: 1, row: 0 }, // Superior derecha
        { col: 0, row: 1 }, // Inferior izquierda
        { col: 1, row: 1 }  // Inferior derecha
      ]

      for (let i = 0; i < estudiantesFiltrados.length; i++) {
        const est = estudiantesFiltrados[i]
        const posIndex = i % qrsPerPage
        const pos = positions[posIndex]
        
        // Nueva página cada 4 estudiantes
        if (i > 0 && posIndex === 0) {
          pdf.addPage()
        }

        // Calcular posición exacta de la tarjeta
        const cardX = pos.col * cardWidth
        const cardY = pos.row * cardHeight

        // Generar QR a 300 dpi - SIN margen interno (quiet zone en el marco)
        const qrDataURL = await QRCode.toDataURL(est.codigo, {
          width: qrPixels,
          margin: 1, // Mínimo margen, el marco negro actúa como quiet zone
          errorCorrectionLevel: 'H',
          color: { dark: '#000000', light: '#FFFFFF' }
        })

        // ===== FONDO BLANCO DE LA CREDENCIAL =====
        pdf.setFillColor(255, 255, 255)
        pdf.rect(cardX, cardY, cardWidth, cardHeight, 'F')
        
        // ===== LÍNEA DE CORTE (borde gris muy claro) =====
        pdf.setDrawColor(200, 200, 200)
        pdf.setLineWidth(0.15)
        pdf.rect(cardX, cardY, cardWidth, cardHeight)

        // ===== ENCABEZADO AZUL (#2F66F6) - 22mm =====
        pdf.setFillColor(47, 102, 246) // #2F66F6
        pdf.rect(cardX, cardY, cardWidth, headerHeight, 'F')
        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'bold')
        pdf.text('CREDENCIAL DE ESTUDIANTE', cardX + cardWidth / 2, cardY + 14, { align: 'center' })

        // ===== CÓDIGO QR CENTRADO (GIGANTE) =====
        // Centrar QR horizontalmente
        const qrX = cardX + (cardWidth - qrSize) / 2
        // Posicionar justo debajo del header
        const qrY = cardY + headerHeight + 3
        
        // Marco negro del QR
        pdf.setDrawColor(0, 0, 0)
        pdf.setLineWidth(1)
        pdf.rect(qrX - 1.5, qrY - 1.5, qrSize + 3, qrSize + 3)
        
        // Imagen QR
        pdf.addImage(qrDataURL, 'PNG', qrX, qrY, qrSize, qrSize)

        // ===== INFORMACIÓN DEL ESTUDIANTE (compacta) =====
        let infoY = qrY + qrSize + 5
        
        // Código del estudiante (negrita, grande)
        pdf.setTextColor(0, 0, 0)
        pdf.setFontSize(11)
        pdf.setFont('helvetica', 'bold')
        pdf.text(est.codigo, cardX + cardWidth / 2, infoY, { align: 'center' })

        // Nombre del estudiante (regular)
        infoY += 5
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'normal')
        // Truncar nombre si es muy largo
        const nombreCorto = est.nombre.length > 30 ? est.nombre.substring(0, 30) + '...' : est.nombre
        pdf.text(nombreCorto, cardX + cardWidth / 2, infoY, { align: 'center' })

        // Grado y sección en cápsula azul
        if (est.grado && est.seccion) {
          infoY += 6
          const gradoText = `${est.grado}° - Sección "${est.seccion}"`
          pdf.setFontSize(8)
          const capsuleWidth = pdf.getTextWidth(gradoText) + 10
          const capsuleHeight = 6
          const capsuleX = cardX + (cardWidth - capsuleWidth) / 2
          
          // Cápsula azul con bordes redondeados
          pdf.setFillColor(47, 102, 246) // #2F66F6
          pdf.roundedRect(capsuleX, infoY - 4, capsuleWidth, capsuleHeight, 1.5, 1.5, 'F')
          
          // Texto blanco
          pdf.setTextColor(255, 255, 255)
          pdf.setFont('helvetica', 'bold')
          pdf.text(gradoText, cardX + cardWidth / 2, infoY, { align: 'center' })
        }
      }

      pdf.save(`credenciales-qr-${new Date().toISOString().split('T')[0]}.pdf`)
      setSuccess(`✅ PDF A4 generado: ${estudiantesFiltrados.length} credencial(es) en ${Math.ceil(estudiantesFiltrados.length / 4)} página(s)`)
    } catch (e) {
      console.error('Error:', e)
      setError('Error al generar PDF')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Generador de Credenciales QR</h2>
      
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{success}</div>}

      <div className="mb-6">
        <button onClick={cargarEstudiantes} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400">
          {loading ? 'Cargando...' : '📥 Cargar Estudiantes'}
        </button>
        {estudiantes.length > 0 && <span className="ml-3 text-green-600">✓ {estudiantes.length} estudiantes</span>}
      </div>

      {estudiantes.length > 0 && (
        <>
          <div className="mb-4 grid grid-cols-3 gap-2">
            {(['todos', 'grado', 'estudiante'] as ModoGeneracion[]).map(modo => (
              <button key={modo} onClick={() => { setModoGeneracion(modo); setGradoSeleccionado(null); setEstudianteSeleccionado(null) }}
                className={`p-3 rounded border-2 text-gray-900 font-medium ${modoGeneracion === modo ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}>
                {modo === 'todos' ? '👥 Todos' : modo === 'grado' ? '📚 Por Grado' : '👤 Individual'}
              </button>
            ))}
          </div>

          {modoGeneracion === 'grado' && (
            <select value={gradoSeleccionado || ''} onChange={e => setGradoSeleccionado(Number(e.target.value))}
              className="w-full p-2 border rounded mb-4 text-black">
              <option value="">Seleccionar grado...</option>
              {gradosSecciones.map(gs => (
                <option key={gs.idGradoSeccion} value={gs.idGradoSeccion}>
                  {gs.grado.nivel.nombre} - {gs.grado.nombre}° {gs.seccion.nombre}
                </option>
              ))}
            </select>
          )}

          {modoGeneracion === 'estudiante' && (
            <>
              <input type="text" placeholder="Buscar estudiante..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
                className="w-full p-2 border rounded mb-2 text-black" />
              <select value={estudianteSeleccionado || ''} onChange={e => setEstudianteSeleccionado(e.target.value)}
                className="w-full p-2 border rounded mb-4 text-black">
                <option value="">Seleccionar estudiante...</option>
                {estudiantes.filter(e => !busqueda || e.nombre.toLowerCase().includes(busqueda.toLowerCase())).map(e => (
                  <option key={e.id} value={e.id}>{e.nombre} - {e.codigo}</option>
                ))}
              </select>
            </>
          )}

          <div className="p-3 bg-blue-50 rounded mb-4 text-gray-900">
            <strong className="text-gray-900">A generar:</strong> <span className="text-blue-700 font-semibold">{estudiantesFiltrados.length}</span> código(s) QR
          </div>

          <button onClick={generarPDF} disabled={loading || estudiantesFiltrados.length === 0}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold">
            {loading ? '⏳ Generando...' : `📄 Generar PDF (${estudiantesFiltrados.length} QR)`}
          </button>
        </>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded text-sm text-gray-700">
        <strong className="text-gray-900">📄 Especificaciones del PDF:</strong>
        <ul className="mt-2 space-y-1 list-disc list-inside">
          <li><strong>Formato:</strong> A4 vertical (210×297mm)</li>
          <li><strong>Distribución:</strong> 4 credenciales por página (2×2)</li>
          <li><strong>Credencial:</strong> 105×148.5mm exactos</li>
          <li><strong>QR:</strong> 93×93mm a 300dpi (1098px), Nivel H</li>
          <li><strong>Encabezado:</strong> Barra azul #2F66F6, 22mm</li>
        </ul>
      </div>
    </div>
  )
}
