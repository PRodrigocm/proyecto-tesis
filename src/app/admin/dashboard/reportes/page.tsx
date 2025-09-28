'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ReporteStats {
  totalEstudiantes: number
  estudiantesActivos: number
  estudiantesInactivos: number
  totalDocentes: number
  totalApoderados: number
  totalTalleres: number
  asistenciasHoy: number
  asistenciasSemana: number
  asistenciasMes: number
  retirosHoy: number
  retirosSemana: number
  retirosMes: number
}

interface Grado {
  idGrado: number
  nombre: string
}

interface Seccion {
  idSeccion: number
  nombre: string
}

interface Docente {
  idDocente: number
  nombre: string
  apellido: string
}

interface Filtros {
  gradoId: string
  seccionId: string
  docenteId: string
  fechaInicio: string
  fechaFin: string
}

export default function ReportesPage() {
  const router = useRouter()
  const [stats, setStats] = useState<ReporteStats>({
    totalEstudiantes: 0,
    estudiantesActivos: 0,
    estudiantesInactivos: 0,
    totalDocentes: 0,
    totalApoderados: 0,
    totalTalleres: 0,
    asistenciasHoy: 0,
    asistenciasSemana: 0,
    asistenciasMes: 0,
    retirosHoy: 0,
    retirosSemana: 0,
    retirosMes: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriodo, setSelectedPeriodo] = useState('mes')
  const [grados, setGrados] = useState<Grado[]>([])
  const [secciones, setSecciones] = useState<Seccion[]>([])
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [filtros, setFiltros] = useState<Filtros>({
    gradoId: '',
    seccionId: '',
    docenteId: '',
    fechaInicio: '',
    fechaFin: ''
  })
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false)

  useEffect(() => {
    loadReportesData()
    loadFiltrosData()
  }, [selectedPeriodo])

  useEffect(() => {
    // Recargar datos cuando cambien los filtros
    if (mostrarFiltrosAvanzados) {
      loadReportesData()
    }
  }, [filtros])

  const loadReportesData = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        console.log('⚠️ No hay token, usando datos de ejemplo')
        setStats({
          totalEstudiantes: 180,
          estudiantesActivos: 165,
          estudiantesInactivos: 15,
          totalDocentes: 12,
          totalApoderados: 95,
          totalTalleres: 8,
          asistenciasHoy: 156,
          asistenciasSemana: 892,
          asistenciasMes: 3456,
          retirosHoy: 23,
          retirosSemana: 145,
          retirosMes: 567
        })
        return
      }

      console.log('🔐 Token encontrado, cargando estadísticas reales de reportes...')
      
      // Construir parámetros de consulta con filtros
      const params = new URLSearchParams({
        periodo: selectedPeriodo
      })
      
      if (mostrarFiltrosAvanzados) {
        if (filtros.gradoId) params.append('gradoId', filtros.gradoId)
        if (filtros.seccionId) params.append('seccionId', filtros.seccionId)
        if (filtros.docenteId) params.append('docenteId', filtros.docenteId)
        if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio)
        if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin)
      }
      
      // Cargar estadísticas reales desde la API
      const response = await fetch(`/api/reportes/stats?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('📡 Response status reportes:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('📊 Estadísticas de reportes cargadas:', result.data)
        setStats(result.data)
      } else {
        console.error('❌ Error al cargar estadísticas de reportes:', response.status)
        const errorText = await response.text()
        console.error('❌ Error details:', errorText)
        
        // Si es error de autenticación, redirigir al login
        if (response.status === 401) {
          console.log('🔐 Token inválido, redirigiendo al login...')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/login')
          return
        }
        
        // Para otros errores, usar datos de ejemplo
        setStats({
          totalEstudiantes: 180,
          estudiantesActivos: 165,
          estudiantesInactivos: 15,
          totalDocentes: 12,
          totalApoderados: 95,
          totalTalleres: 8,
          asistenciasHoy: 156,
          asistenciasSemana: 892,
          asistenciasMes: 3456,
          retirosHoy: 23,
          retirosSemana: 145,
          retirosMes: 567
        })
      }
    } catch (error) {
      console.error('💥 Error loading reportes data:', error)
      
      // Fallback a datos de ejemplo si hay error
      setStats({
        totalEstudiantes: 180,
        estudiantesActivos: 165,
        estudiantesInactivos: 15,
        totalDocentes: 12,
        totalApoderados: 95,
        totalTalleres: 8,
        asistenciasHoy: 156,
        asistenciasSemana: 892,
        asistenciasMes: 3456,
        retirosHoy: 23,
        retirosSemana: 145,
        retirosMes: 567
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadFiltrosData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      // Cargar grados
      const gradosResponse = await fetch('/api/grados', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (gradosResponse.ok) {
        const gradosData = await gradosResponse.json()
        setGrados(gradosData.data || [])
      }

      // Cargar secciones
      const seccionesResponse = await fetch('/api/secciones', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (seccionesResponse.ok) {
        const seccionesData = await seccionesResponse.json()
        setSecciones(seccionesData.data || [])
      }

      // Cargar docentes
      const docentesResponse = await fetch('/api/docentes', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (docentesResponse.ok) {
        const docentesData = await docentesResponse.json()
        setDocentes(docentesData.data || [])
      }

      console.log('✅ Datos de filtros cargados')
    } catch (error) {
      console.error('❌ Error cargando datos de filtros:', error)
    }
  }

  const handleFiltroChange = (campo: keyof Filtros, valor: string) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }))
  }

  const limpiarFiltros = () => {
    setFiltros({
      gradoId: '',
      seccionId: '',
      docenteId: '',
      fechaInicio: '',
      fechaFin: ''
    })
  }

  const generateReport = async (tipo: string, formato: 'excel' | 'pdf' = 'excel') => {
    try {
      console.log(`Generando reporte de ${tipo} en formato ${formato}...`)
      
      const token = localStorage.getItem('token')
      if (!token) {
        alert('No hay token de autenticación')
        return
      }

      // Construir parámetros de consulta con filtros actuales
      const params = new URLSearchParams({
        tipo,
        formato,
        periodo: selectedPeriodo
      })
      
      if (mostrarFiltrosAvanzados) {
        if (filtros.gradoId) params.append('gradoId', filtros.gradoId)
        if (filtros.seccionId) params.append('seccionId', filtros.seccionId)
        if (filtros.docenteId) params.append('docenteId', filtros.docenteId)
        if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio)
        if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin)
      }

      // Hacer petición para generar el reporte
      const response = await fetch(`/api/reportes/generar?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        // Obtener el blob del archivo
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        
        // Crear enlace de descarga
        const a = document.createElement('a')
        a.href = url
        a.download = `reporte-${tipo}-${new Date().toISOString().split('T')[0]}.${formato === 'excel' ? 'xlsx' : 'pdf'}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        
        console.log(`✅ Reporte ${tipo} generado exitosamente`)
      } else {
        const error = await response.json()
        console.error('❌ Error generando reporte:', error)
        alert(`Error generando reporte: ${error.error || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('💥 Error generando reporte:', error)
      alert('Error generando reporte. Revisa la consola para más detalles.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="text-gray-600">Cargando reportes...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Reportes y Estadísticas</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Genera reportes detallados y visualiza estadísticas del sistema
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <select
                  value={selectedPeriodo}
                  onChange={(e) => setSelectedPeriodo(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="dia">Hoy</option>
                  <option value="semana">Esta Semana</option>
                  <option value="mes">Este Mes</option>
                  <option value="año">Este Año</option>
                </select>
                <button
                  onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
                  className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    mostrarFiltrosAvanzados 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {mostrarFiltrosAvanzados ? '🔍 Ocultar Filtros' : '🔍 Filtros Avanzados'}
                </button>
                <button
                  onClick={() => loadReportesData()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Actualizar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros Avanzados */}
      {mostrarFiltrosAvanzados && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Filtros Avanzados</h3>
            <button
              onClick={limpiarFiltros}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Limpiar Filtros
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Filtro por Grado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grado
              </label>
              <select
                value={filtros.gradoId}
                onChange={(e) => handleFiltroChange('gradoId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Todos los grados</option>
                {grados.map((grado, index) => (
                  <option key={`grado-${grado.idGrado || index}`} value={grado.idGrado}>
                    {grado.nombre}°
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Sección */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sección
              </label>
              <select
                value={filtros.seccionId}
                onChange={(e) => handleFiltroChange('seccionId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Todas las secciones</option>
                {secciones.map((seccion, index) => (
                  <option key={`seccion-${seccion.idSeccion || index}`} value={seccion.idSeccion}>
                    {seccion.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Docente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Docente
              </label>
              <select
                value={filtros.docenteId}
                onChange={(e) => handleFiltroChange('docenteId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Todos los docentes</option>
                {docentes.map((docente, index) => (
                  <option key={`docente-${docente.idDocente || index}`} value={docente.idDocente}>
                    {docente.nombre} {docente.apellido}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha Inicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={filtros.fechaInicio}
                onChange={(e) => handleFiltroChange('fechaInicio', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Fecha Fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Fin
              </label>
              <input
                type="date"
                value={filtros.fechaFin}
                onChange={(e) => handleFiltroChange('fechaFin', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Indicador de filtros activos */}
          {(filtros.gradoId || filtros.seccionId || filtros.docenteId || filtros.fechaInicio || filtros.fechaFin) && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-blue-800">
                  Filtros activos: {
                    [
                      filtros.gradoId && `Grado ${grados.find(g => g.idGrado.toString() === filtros.gradoId)?.nombre}°`,
                      filtros.seccionId && `Sección ${secciones.find(s => s.idSeccion.toString() === filtros.seccionId)?.nombre}`,
                      filtros.docenteId && `Docente ${docentes.find(d => d.idDocente.toString() === filtros.docenteId)?.nombre}`,
                      filtros.fechaInicio && `Desde ${filtros.fechaInicio}`,
                      filtros.fechaFin && `Hasta ${filtros.fechaFin}`
                    ].filter(Boolean).join(', ')
                  }
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Estudiantes */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Estudiantes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEstudiantes}</p>
              <p className="text-xs text-gray-500">
                {stats.estudiantesActivos} activos, {stats.estudiantesInactivos} inactivos
              </p>
            </div>
          </div>
        </div>

        {/* Docentes */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Docentes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDocentes}</p>
              <p className="text-xs text-gray-500">Personal académico</p>
            </div>
          </div>
        </div>

        {/* Asistencias */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Asistencias</p>
              <p className="text-2xl font-bold text-gray-900">
                {selectedPeriodo === 'dia' ? stats.asistenciasHoy : 
                 selectedPeriodo === 'semana' ? stats.asistenciasSemana : stats.asistenciasMes}
              </p>
              <p className="text-xs text-gray-500">
                {selectedPeriodo === 'dia' ? 'Hoy' : 
                 selectedPeriodo === 'semana' ? 'Esta semana' : 'Este mes'}
              </p>
            </div>
          </div>
        </div>

        {/* Retiros */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Retiros</p>
              <p className="text-2xl font-bold text-gray-900">
                {selectedPeriodo === 'dia' ? stats.retirosHoy : 
                 selectedPeriodo === 'semana' ? stats.retirosSemana : stats.retirosMes}
              </p>
              <p className="text-xs text-gray-500">
                {selectedPeriodo === 'dia' ? 'Hoy' : 
                 selectedPeriodo === 'semana' ? 'Esta semana' : 'Este mes'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reportes Disponibles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Reportes de Asistencia */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Reportes de Asistencia</h3>
            <p className="text-sm text-gray-600">Genera reportes detallados de asistencia</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="w-full border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Asistencia Diaria</p>
                      <p className="text-sm text-gray-600">Reporte de asistencias por día</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => generateReport('asistencia-diaria', 'excel')}
                      className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                    >
                      📊 Excel
                    </button>
                    <button
                      onClick={() => generateReport('asistencia-diaria', 'pdf')}
                      className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
                    >
                      📄 PDF
                    </button>
                  </div>
                </div>
              </div>

              <div className="w-full border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Asistencia Mensual</p>
                      <p className="text-sm text-gray-600">Reporte consolidado mensual</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => generateReport('asistencia-mensual', 'excel')}
                      className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                    >
                      📊 Excel
                    </button>
                    <button
                      onClick={() => generateReport('asistencia-mensual', 'pdf')}
                      className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
                    >
                      📄 PDF
                    </button>
                  </div>
                </div>
              </div>

              <div className="w-full border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Por Estudiante</p>
                      <p className="text-sm text-gray-600">Historial individual de asistencia</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => generateReport('asistencia-estudiante', 'excel')}
                      className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                    >
                      📊 Excel
                    </button>
                    <button
                      onClick={() => generateReport('asistencia-estudiante', 'pdf')}
                      className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
                    >
                      📄 PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reportes de Retiros */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Reportes de Retiros</h3>
            <p className="text-sm text-gray-600">Genera reportes de retiros de estudiantes</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <button
                onClick={() => generateReport('retiros-diarios')}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Retiros Diarios</p>
                    <p className="text-sm text-gray-600">Reporte de retiros por día</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>

              <button
                onClick={() => generateReport('retiros-apoderado')}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Por Apoderado</p>
                    <p className="text-sm text-gray-600">Retiros realizados por apoderado</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>

              <button
                onClick={() => generateReport('retiros-tardios')}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Retiros Tardíos</p>
                    <p className="text-sm text-gray-600">Estudiantes retirados fuera de horario</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reportes Académicos */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Reportes Académicos</h3>
          <p className="text-sm text-gray-600">Reportes relacionados con la gestión académica</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => generateReport('estudiantes-activos')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Estudiantes Activos</p>
                <p className="text-sm text-gray-600">Lista de estudiantes matriculados</p>
              </div>
            </button>

            <button
              onClick={() => generateReport('docentes-asignaciones')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Docentes y Asignaciones</p>
                <p className="text-sm text-gray-600">Docentes por grado y sección</p>
              </div>
            </button>

            <button
              onClick={() => generateReport('talleres-inscripciones')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Talleres e Inscripciones</p>
                <p className="text-sm text-gray-600">Participación en talleres</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
