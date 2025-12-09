'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  DocumentTextIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { getReportTitle, getAsistenciaBadgeColor, formatDate } from '@/utils/reportUtils'

interface Grado {
  id: string
  nombre: string
}

interface Seccion {
  id: string
  nombre: string
}

interface ReportData {
  estudiante: {
    id: string
    nombre: string
    apellido: string
    dni: string
    grado: string
    seccion: string
  }
  asistencias: {
    fecha: string
    estado: 'PRESENTE' | 'AUSENTE' | 'TARDANZA' | 'RETIRADO' | 'JUSTIFICADA'
    horaEntrada?: string
    horaSalida?: string
  }[]
  resumen: {
    totalDias: number
    diasPresente: number
    diasAusente: number
    diasTardanza: number
    diasRetirado: number
    porcentajeAsistencia: number
  }
}

// Función para obtener las fechas del rango (filtrando fines de semana según días laborables y feriados)
const obtenerFechasDelRango = (fechaInicio: string, fechaFin: string, diasLaborables?: string[], feriados?: string[]): Date[] => {
  const fechas: Date[] = []
  const inicio = new Date(fechaInicio)
  const fin = new Date(fechaFin)
  
  // Mapeo de día de semana (0=DOM, 1=LUN, etc.) a nombre
  const diasSemanaMap: Record<number, string> = {
    0: 'DOMINGO',
    1: 'LUNES',
    2: 'MARTES',
    3: 'MIERCOLES',
    4: 'JUEVES',
    5: 'VIERNES',
    6: 'SABADO'
  }
  
  for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
    const diaSemana = d.getDay()
    const nombreDia = diasSemanaMap[diaSemana]
    const fechaStr = d.toISOString().split('T')[0]
    
    // Excluir feriados
    if (feriados && feriados.includes(fechaStr)) {
      continue
    }
    
    // Si hay días laborables configurados, solo incluir esos días
    if (diasLaborables && diasLaborables.length > 0) {
      if (diasLaborables.includes(nombreDia)) {
        fechas.push(new Date(d))
      }
    } else {
      // Por defecto, excluir sábados y domingos
      if (diaSemana !== 0 && diaSemana !== 6) {
        fechas.push(new Date(d))
      }
    }
  }
  return fechas
}

// Función para formatear fecha corta (L01, M02, X03, etc.)
const formatearFechaCorta = (fecha: Date): string => {
  const dias = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
  const dia = dias[fecha.getDay()]
  const numero = fecha.getDate().toString().padStart(2, '0')
  return `${dia}${numero}`
}

export default function ReportesAuxiliar() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [grados, setGrados] = useState<Grado[]>([])
  const [secciones, setSecciones] = useState<Seccion[]>([])
  const [vistaActual, setVistaActual] = useState<'resumen' | 'detalle'>('resumen')
  
  // Filtros
  const [tipoReporte, setTipoReporte] = useState<'semanal' | 'mensual' | 'anual'>('mensual')
  const [gradoSeleccionado, setGradoSeleccionado] = useState('')
  const [seccionSeleccionada, setSeccionSeleccionada] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  
  // Datos del reporte
  const [reportData, setReportData] = useState<ReportData[]>([])
  const [stats, setStats] = useState({
    totalEstudiantes: 0,
    promedioAsistencia: 0,
    estudiantesConBajaAsistencia: 0,
    diasAnalizados: 0
  })
  
  // Estados para opciones de filtros
  const [loadingGrados, setLoadingGrados] = useState(false)
  const [loadingSecciones, setLoadingSecciones] = useState(false)
  
  // Días laborables configurados
  const [diasLaborables, setDiasLaborables] = useState<string[]>(['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'])
  
  // Feriados del calendario escolar
  const [feriados, setFeriados] = useState<string[]>([])

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token')
      const userString = localStorage.getItem('user')
      
      if (!token || !userString) {
        router.push('/login')
        return
      }

      try {
        const user = JSON.parse(userString)
        if (!['AUXILIAR', 'ADMINISTRATIVO'].includes(user.rol)) {
          router.push('/unauthorized')
          return
        }
      } catch (error) {
        router.push('/login')
        return
      }
    }

    checkAuth()
    loadInitialData()
    setDefaultDates()
    loadGrados()
    loadSecciones()
    loadDiasLaborables()
    loadFeriados()
  }, [router])

  // Cargar días laborables desde la configuración
  const loadDiasLaborables = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/configuracion/horarios', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.diasLaborables && data.diasLaborables.length > 0) {
          setDiasLaborables(data.diasLaborables)
        }
      }
    } catch (error) {
      console.error('Error cargando días laborables:', error)
    }
  }

  // Cargar feriados del calendario escolar
  const loadFeriados = async () => {
    try {
      const token = localStorage.getItem('token')
      const userString = localStorage.getItem('user')
      
      if (!userString) return
      
      const user = JSON.parse(userString)
      const ieId = user.ie?.id || user.idIe || user.institucionId || 1
      
      // Obtener eventos del año actual
      const año = new Date().getFullYear()
      const feriadosDelAño: string[] = []
      
      // Cargar feriados de cada mes del año
      for (let mes = 1; mes <= 12; mes++) {
        const response = await fetch(`/api/calendario?mes=${mes}&año=${año}&ieId=${ieId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          const data = await response.json()
          const eventos = data.data || []
          
          // Filtrar solo feriados (no lectivos)
          eventos.forEach((evento: any) => {
            if (!evento.esLectivo || evento.tipo === 'FERIADO') {
              const fechaEvento = new Date(evento.fechaInicio).toISOString().split('T')[0]
              if (!feriadosDelAño.includes(fechaEvento)) {
                feriadosDelAño.push(fechaEvento)
              }
            }
          })
        }
      }
      
      setFeriados(feriadosDelAño)
      console.log('📅 Feriados cargados:', feriadosDelAño.length)
    } catch (error) {
      console.error('Error cargando feriados:', error)
    }
  }

  const setDefaultDates = () => {
    const today = new Date()
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    
    setFechaInicio(firstDayOfMonth.toISOString().split('T')[0])
    setFechaFin(lastDayOfMonth.toISOString().split('T')[0])
  }

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadGrados(),
        loadSecciones()
      ])
    } catch (error) {
      console.error('Error loading initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadGrados = async () => {
    setLoadingGrados(true)
    try {
      const token = localStorage.getItem('token')
      const userString = localStorage.getItem('user')
      
      if (!userString) {
        console.error('No user data found')
        return
      }
      
      const user = JSON.parse(userString)
      const ieId = user.ie?.id || user.idIe || user.institucionId || 1 // Fallback to 1
      
      console.log('🏫 Loading grados for ieId:', ieId, 'User:', user)
      
      const response = await fetch(`/api/grados?ieId=${ieId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setGrados(data.data || [])
      } else {
        console.error('Error response from grados API:', response.status)
      }
    } catch (error) {
      console.error('Error loading grados:', error)
    } finally {
      setLoadingGrados(false)
    }
  }

  const loadSecciones = async () => {
    setLoadingSecciones(true)
    try {
      const token = localStorage.getItem('token')
      const userString = localStorage.getItem('user')
      
      if (!userString) {
        console.error('No user data found')
        return
      }
      
      const user = JSON.parse(userString)
      const ieId = user.ie?.id || user.idIe || user.institucionId || 1 // Fallback to 1
      
      console.log('📝 Loading secciones for ieId:', ieId)
      
      const response = await fetch(`/api/secciones?ieId=${ieId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSecciones(data.data || [])
      } else {
        console.error('Error response from secciones API:', response.status)
      }
    } catch (error) {
      console.error('Error loading secciones:', error)
    } finally {
      setLoadingSecciones(false)
    }
  }

  const handleTipoReporteChange = (tipo: 'semanal' | 'mensual' | 'anual') => {
    setTipoReporte(tipo)
    const today = new Date()
    
    switch (tipo) {
      case 'semanal':
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
        const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6))
        setFechaInicio(startOfWeek.toISOString().split('T')[0])
        setFechaFin(endOfWeek.toISOString().split('T')[0])
        break
      case 'mensual':
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        setFechaInicio(firstDayOfMonth.toISOString().split('T')[0])
        setFechaFin(lastDayOfMonth.toISOString().split('T')[0])
        break
      case 'anual':
        const firstDayOfYear = new Date(today.getFullYear(), 0, 1)
        const lastDayOfYear = new Date(today.getFullYear(), 11, 31)
        setFechaInicio(firstDayOfYear.toISOString().split('T')[0])
        setFechaFin(lastDayOfYear.toISOString().split('T')[0])
        break
    }
  }

  const generateReport = async () => {
    setGenerating(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        fechaInicio,
        fechaFin,
        tipoReporte,
        ...(gradoSeleccionado && { grado: gradoSeleccionado }),
        ...(seccionSeleccionada && { seccion: seccionSeleccionada })
      })

      const response = await fetch(`/api/auxiliar/reportes/generar?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setReportData(data.reportes || [])
        setStats(data.estadisticas || {
          totalEstudiantes: 0,
          promedioAsistencia: 0,
          estudiantesConBajaAsistencia: 0,
          diasAnalizados: 0
        })
      } else {
        alert('Error al generar el reporte')
      }
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Error al generar el reporte')
    } finally {
      setGenerating(false)
    }
  }

  const downloadReport = async (formato: 'pdf' | 'excel' | 'word') => {
    if (reportData.length === 0) {
      alert('Primero debe generar un reporte')
      return
    }

    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/auxiliar/reportes/exportar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          formato,
          datos: {
            reportes: reportData,
            estadisticas: stats,
            filtros: {
              fechaInicio,
              fechaFin,
              tipoReporte,
              grado: gradoSeleccionado || 'Todos',
              seccion: seccionSeleccionada || 'Todas'
            }
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Crear y descargar archivo usando el mismo método que el docente
        const contenidoDecoded = atob(data.data.contenido)
        const bytes = new Uint8Array(contenidoDecoded.length)
        for (let i = 0; i < contenidoDecoded.length; i++) {
          bytes[i] = contenidoDecoded.charCodeAt(i)
        }
        
        const blob = new Blob([bytes], { type: data.data.mimeType })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = data.data.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } else {
        alert(`Error al descargar el reporte en formato ${formato.toUpperCase()}`)
      }
    } catch (error) {
      console.error(`Error downloading ${formato} report:`, error)
      alert(`Error al descargar el reporte en formato ${formato.toUpperCase()}`)
    }
  }

  // Exportar en todos los formatos
  const handleExportarTodos = async () => {
    if (reportData.length === 0) {
      alert('Primero debe generar un reporte')
      return
    }
    await Promise.all([
      downloadReport('pdf'),
      downloadReport('excel'),
      downloadReport('word')
    ])
  }

  // Generar fechas para la tabla de detalle (solo días laborables, excluyendo feriados)
  const generarFechasTabla = () => {
    if (!fechaInicio || !fechaFin) {
      const hoy = new Date()
      const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
      return obtenerFechasDelRango(
        primerDia.toISOString().split('T')[0],
        ultimoDia.toISOString().split('T')[0],
        diasLaborables,
        feriados
      )
    }
    return obtenerFechasDelRango(fechaInicio, fechaFin, diasLaborables, feriados)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-orange-200 rounded-full animate-spin border-t-orange-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <DocumentTextIcon className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Cargando reportes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reportes de Asistencia</h1>
          <p className="mt-1 text-gray-500">
            Genere reportes detallados con diferentes filtros y formatos
          </p>
        </div>
        <div className="flex items-center gap-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-3 rounded-xl shadow-lg">
          <DocumentTextIcon className="h-5 w-5" />
          <div className="text-sm">
            <p className="font-semibold">Envío automático</p>
            <p className="text-orange-100">PDF, Excel, Word</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FunnelIcon className="h-5 w-5" />
            Configuración del Reporte
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Tipo de Reporte */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Reporte
              </label>
              <div className="space-y-2">
                {[
                  { value: 'semanal', label: 'Semanal' },
                  { value: 'mensual', label: 'Mensual' },
                  { value: 'anual', label: 'Anual' }
                ].map((tipo) => (
                  <label key={tipo.value} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="tipoReporte"
                      value={tipo.value}
                      checked={tipoReporte === tipo.value}
                      onChange={(e) => handleTipoReporteChange(e.target.value as any)}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">{tipo.label}</span>
                  </label>
                ))}
              </div>
          </div>

          {/* Rango de Fechas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-black"
            />
            <label className="block text-sm font-medium text-gray-700 mb-2 mt-3">
              Fecha de Fin
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-black"
            />
          </div>

          {/* Filtros por Grado y Sección */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grado
            </label>
            <select
              value={gradoSeleccionado}
              onChange={(e) => setGradoSeleccionado(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-black"
              disabled={loadingGrados}
            >
              <option value="">
                {loadingGrados ? 'Cargando grados...' : 'Todos los grados'}
              </option>
              {grados.map((grado, index) => (
                <option key={`grado-${grado.nombre}-${index}`} value={grado.nombre}>
                  {grado.nombre}°
                </option>
              ))}
            </select>
            
            <label className="block text-sm font-medium text-gray-700 mb-2 mt-3">
              Sección
            </label>
            <select
              value={seccionSeleccionada}
              onChange={(e) => setSeccionSeleccionada(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-black"
              disabled={loadingSecciones}
            >
              <option value="">
                {loadingSecciones ? 'Cargando secciones...' : 'Todas las secciones'}
              </option>
              {secciones.map((seccion, index) => (
                <option key={`seccion-${seccion.nombre}-${index}`} value={seccion.nombre}>
                  {seccion.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Botón Generar */}
        <div className="mt-6">
          <button
            onClick={generateReport}
            disabled={generating || !fechaInicio || !fechaFin}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generando...
              </>
            ) : (
              <>
                <ChartBarIcon className="h-4 w-4 mr-2" />
                Generar Reporte
              </>
            )}
          </button>
        </div>
      </div>
    </div>

    {/* Estadísticas del Reporte */}
    {reportData.length > 0 && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Estudiantes</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalEstudiantes}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Promedio Asistencia</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.promedioAsistencia.toFixed(1)}%</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AcademicCapIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Baja Asistencia</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.estudiantesConBajaAsistencia}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Días Analizados</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.diasAnalizados}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Botones de Descarga */}
    {reportData.length > 0 && (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ArrowDownTrayIcon className="h-5 w-5 text-orange-600" />
          Descargar Reporte
        </h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => downloadReport('pdf')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                📕 PDF
              </button>
              <button
                onClick={() => downloadReport('excel')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                📊 Excel
              </button>
              <button
                onClick={() => downloadReport('word')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                📝 Word
              </button>
              <button
                onClick={handleExportarTodos}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                📦 Exportar Todos
              </button>
            </div>
      </div>
    )}

      {/* Resultados del Reporte */}
      {reportData.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {/* Toggle de vista */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Resultados del Reporte ({reportData.length} estudiantes)
              </h3>
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setVistaActual('resumen')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    vistaActual === 'resumen' 
                      ? 'bg-white text-orange-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📊 Resumen
                </button>
                <button
                  onClick={() => setVistaActual('detalle')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    vistaActual === 'detalle' 
                      ? 'bg-white text-orange-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📋 Tabla de Asistencia
                </button>
              </div>
            </div>

            {/* Vista Resumen */}
            {vistaActual === 'resumen' && (
              <div className="overflow-hidden shadow-sm border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estudiante
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grado/Sección
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Días Presente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Días Ausente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tardanzas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        % Asistencia
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.map((item) => (
                      <tr key={item.estudiante.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.estudiante.apellido}, {item.estudiante.nombre}
                            </div>
                            <div className="text-sm text-gray-500">DNI: {item.estudiante.dni}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{item.estudiante.grado}</div>
                          <div>{item.estudiante.seccion}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.resumen.diasPresente}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.resumen.diasAusente}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.resumen.diasTardanza}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.resumen.porcentajeAsistencia >= 85 
                              ? 'bg-green-100 text-green-800'
                              : item.resumen.porcentajeAsistencia >= 70
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {item.resumen.porcentajeAsistencia.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Vista Detalle - Tabla única del mes con todos los días laborables */}
            {vistaActual === 'detalle' && (
              <div className="space-y-6">
                {(() => {
                  // Agrupar estudiantes por grado y sección
                  const grupos = reportData.reduce((acc, item) => {
                    const key = `${item.estudiante.grado}° ${item.estudiante.seccion}`
                    if (!acc[key]) acc[key] = []
                    acc[key].push(item)
                    return acc
                  }, {} as Record<string, typeof reportData>)

                  const fechas = generarFechasTabla()
                  
                  // Obtener nombre del mes
                  const getMesNombre = () => {
                    if (fechas.length > 0) {
                      return fechas[0].toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()
                    }
                    return ''
                  }

                  return Object.entries(grupos).map(([gradoSeccion, estudiantes]) => (
                    <div key={gradoSeccion} className="border border-gray-200 rounded-xl overflow-hidden">
                      {/* Header del grupo */}
                      <div className="bg-gradient-to-r from-orange-500 to-amber-600 px-4 py-3">
                        <div className="flex justify-between items-center">
                          <h3 className="text-white font-bold">
                            Grado y sección: <span className="text-orange-100">{gradoSeccion}</span>
                          </h3>
                          <span className="text-orange-100 text-sm">
                            {getMesNombre()} • {fechas.length} días laborables
                          </span>
                        </div>
                      </div>

                      {/* Tabla de asistencia - Una sola tabla con todo el mes */}
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse">
                          <thead>
                            <tr className="bg-green-600">
                              <th className="sticky left-0 z-10 bg-green-600 px-3 py-2 text-left text-xs font-semibold text-white border-b border-r border-green-700 min-w-[180px]">
                                Apellidos y nombre
                              </th>
                              {fechas.map((fecha, idx) => (
                                <th 
                                  key={idx} 
                                  className="px-1 py-2 text-center text-xs font-semibold text-white border-b border-green-700 min-w-[45px]"
                                >
                                  {formatearFechaCorta(fecha)}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {estudiantes.map((item, estIdx) => (
                              <tr 
                                key={item.estudiante.id} 
                                className={`${estIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-orange-50 transition-colors`}
                              >
                                <td className="sticky left-0 z-10 bg-inherit px-3 py-2 text-sm font-medium text-gray-900 border-r border-gray-200 whitespace-nowrap">
                                  {item.estudiante.apellido}, {item.estudiante.nombre}
                                </td>
                                {fechas.map((fecha, fechaIdx) => {
                                  // Buscar si hay asistencia para esta fecha
                                  const fechaStr = fecha.toISOString().split('T')[0]
                                  const asistencia = item.asistencias?.find(
                                    (a) => a.fecha?.split('T')[0] === fechaStr
                                  )
                                  
                                  let contenido = '-'
                                  let colorClass = 'text-gray-300'
                                  let bgClass = ''
                                  
                                  if (asistencia) {
                                    switch (asistencia.estado?.toUpperCase()) {
                                      case 'PRESENTE':
                                        contenido = 'X'
                                        colorClass = 'text-green-600 font-bold'
                                        break
                                      case 'TARDANZA':
                                        contenido = 'T'
                                        colorClass = 'text-orange-500 font-bold'
                                        break
                                      case 'AUSENTE':
                                      case 'INASISTENCIA':
                                        contenido = 'F'
                                        colorClass = 'text-red-600 font-bold'
                                        break
                                      case 'JUSTIFICADA':
                                      case 'JUSTIFICADO':
                                        contenido = 'J'
                                        colorClass = 'text-blue-600 font-bold'
                                        break
                                      default:
                                        contenido = '-'
                                        colorClass = 'text-gray-300'
                                    }
                                  }
                                  
                                  return (
                                    <td 
                                      key={fechaIdx} 
                                      className={`px-1 py-2 text-center text-sm ${colorClass} ${bgClass} border-l border-gray-100`}
                                    >
                                      {contenido}
                                    </td>
                                  )
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Leyenda */}
                      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                        <div className="flex flex-wrap items-center gap-6 text-xs">
                          <span className="text-gray-500 font-medium">Leyenda:</span>
                          <span className="flex items-center gap-1">
                            <span className="text-green-600 font-bold">X</span>=Presente
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="text-orange-500 font-bold">T</span>=Tardanza
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="text-red-600 font-bold">F</span>=Falta
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="text-blue-600 font-bold">J</span>=Justificada
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {reportData.length === 0 && !generating && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-12 text-center">
            <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay datos de reporte</h3>
            <p className="text-sm text-gray-500">
              Configure los filtros y haga clic en "Generar Reporte" para ver los resultados
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
