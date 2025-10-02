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
    estado: 'PRESENTE' | 'AUSENTE' | 'TARDANZA' | 'RETIRADO'
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

export default function ReportesAuxiliar() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [grados, setGrados] = useState<Grado[]>([])
  const [secciones, setSecciones] = useState<Seccion[]>([])
  
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
  }, [router])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reportes de Asistencia</h1>
        <p className="mt-2 text-sm text-gray-600">
          Genere reportes detallados de asistencia con diferentes filtros y formatos
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            <FunnelIcon className="h-5 w-5 inline mr-2" />
            Configuración del Reporte
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Tipo de Reporte */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Reporte
              </label>
              <div className="space-y-2">
                {[
                  { value: 'semanal', label: 'Semanal', icon: CalendarIcon },
                  { value: 'mensual', label: 'Mensual', icon: CalendarIcon },
                  { value: 'anual', label: 'Anual', icon: CalendarIcon }
                ].map((tipo) => (
                  <label key={tipo.value} className="flex items-center">
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
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              <ArrowDownTrayIcon className="h-5 w-5 inline mr-2" />
              Descargar Reporte
            </h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => downloadReport('pdf')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                Reporte PDF
              </button>
              <button
                onClick={() => downloadReport('excel')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                Descargar Excel
              </button>
              <button
                onClick={() => downloadReport('word')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                Descargar Word
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de Resultados */}
      {reportData.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Resultados del Reporte ({reportData.length} estudiantes)
            </h3>
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
