'use client'

import { useState, useEffect } from 'react'
import { useRetiros } from '@/hooks/useRetiros'
import RetirosTable from '@/components/admin/RetirosTable'
import RetirosStats from '@/components/admin/RetirosStats'

interface Grado {
  idGrado: number
  nombre: string
}

interface Seccion {
  idSeccion: number
  nombre: string
}

interface Estudiante {
  id: string
  nombre: string
  apellido: string
  dni: string
  grado: string
  seccion: string
}

export default function RetirosPage() {
  const [gradosDB, setGradosDB] = useState<Grado[]>([])
  const [seccionesDB, setSeccionesDB] = useState<Seccion[]>([])
  const [estudiantesDB, setEstudiantesDB] = useState<Estudiante[]>([])
  const [loadingGrados, setLoadingGrados] = useState(false)
  const [loadingSecciones, setLoadingSecciones] = useState(false)
  const [loadingEstudiantes, setLoadingEstudiantes] = useState(false)
  const [selectedGrado, setSelectedGrado] = useState('')
  const [selectedSeccion, setSelectedSeccion] = useState('')
  
  const {
    retiros,
    loading,
    filters,
    grados,
    stats,
    loadRetiros,
    autorizarRetiro,
    modificarRetiro,
    eliminarRetiro,
    updateFilters
  } = useRetiros()

  // Obtener ieId del usuario
  const getIeId = () => {
    try {
      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        return user.ieId || user.idIe || user.institucionId || '1'
      }
    } catch (error) {
      console.error('Error getting ieId:', error)
    }
    return '1' // Fallback
  }

  // Cargar grados desde la BD
  const loadGrados = async () => {
    setLoadingGrados(true)
    try {
      const token = localStorage.getItem('token')
      const ieId = getIeId()
      const response = await fetch(`/api/grados?ieId=${ieId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setGradosDB(data.data || [])
      } else {
        console.error('Error response from grados API:', await response.text())
      }
    } catch (error) {
      console.error('Error loading grados:', error)
    } finally {
      setLoadingGrados(false)
    }
  }

  // Cargar secciones desde la BD
  const loadSecciones = async () => {
    setLoadingSecciones(true)
    try {
      const token = localStorage.getItem('token')
      const ieId = getIeId()
      const response = await fetch(`/api/secciones?ieId=${ieId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSeccionesDB(data.data || [])
      } else {
        console.error('Error response from secciones API:', await response.text())
      }
    } catch (error) {
      console.error('Error loading secciones:', error)
    } finally {
      setLoadingSecciones(false)
    }
  }

  // Cargar estudiantes desde la BD
  const loadEstudiantes = async () => {
    setLoadingEstudiantes(true)
    try {
      const token = localStorage.getItem('token')
      const ieId = getIeId()
      const response = await fetch(`/api/estudiantes?ieId=${ieId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setEstudiantesDB(data.data || [])
      } else {
        console.error('Error response from estudiantes API:', await response.text())
      }
    } catch (error) {
      console.error('Error loading estudiantes:', error)
    } finally {
      setLoadingEstudiantes(false)
    }
  }

  // Filtrar estudiantes por grado y sección seleccionados
  const estudiantesFiltrados = estudiantesDB.filter(estudiante => {
    const matchGrado = !selectedGrado || estudiante.grado === selectedGrado
    const matchSeccion = !selectedSeccion || estudiante.seccion === selectedSeccion
    return matchGrado && matchSeccion
  })

  // Cargar datos al montar el componente
  useEffect(() => {
    loadGrados()
    loadSecciones() // Cargar todas las secciones disponibles
    loadEstudiantes()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header mejorado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Gestión de Retiros</h1>
              <p className="text-slate-500">Administra los retiros de estudiantes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters mejorados */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h3 className="font-semibold text-slate-700">Filtros de búsqueda</h3>
          </div>
          {(filters.fecha || filters.grado || filters.estado !== 'TODOS' || filters.searchTerm) && (
            <button
              onClick={() => {
                updateFilters({ fecha: '', grado: '', estado: 'TODOS', searchTerm: '' })
                setSelectedGrado('')
                setSelectedSeccion('')
              }}
              className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpiar filtros
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Búsqueda */}
          <div className="lg:col-span-2 space-y-1.5">
            <label htmlFor="search" className="block text-xs font-medium text-slate-500 uppercase tracking-wide">
              Buscar estudiante
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                id="search"
                value={filters.searchTerm}
                onChange={(e) => updateFilters({ searchTerm: e.target.value })}
                placeholder="Nombre, DNI..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>
          
          {/* Fecha */}
          <div className="space-y-1.5">
            <label htmlFor="fecha" className="block text-xs font-medium text-slate-500 uppercase tracking-wide">
              Fecha
            </label>
            <div className="relative">
              <input
                type="date"
                id="fecha"
                value={filters.fecha}
                onChange={(e) => updateFilters({ fecha: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 transition-all"
              />
              {filters.fecha && (
                <button
                  onClick={() => updateFilters({ fecha: '' })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* Grado */}
          <div className="space-y-1.5">
            <label htmlFor="grado" className="block text-xs font-medium text-slate-500 uppercase tracking-wide">
              Grado
            </label>
            <div className="relative">
              <select
                id="grado"
                value={selectedGrado}
                onChange={(e) => {
                  setSelectedGrado(e.target.value)
                  setSelectedSeccion('')
                  updateFilters({ grado: e.target.value })
                }}
                disabled={loadingGrados}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 disabled:bg-slate-100 transition-all appearance-none cursor-pointer pr-10"
              >
                <option value="">Todos</option>
                {gradosDB.map((grado, index) => (
                  <option key={grado.idGrado || `grado-${index}`} value={grado.nombre}>
                    {grado.nombre}° Grado
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Estado */}
          <div className="space-y-1.5">
            <label htmlFor="estado" className="block text-xs font-medium text-slate-500 uppercase tracking-wide">
              Estado
            </label>
            <div className="relative">
              <select
                id="estado"
                value={filters.estado}
                onChange={(e) => updateFilters({ estado: e.target.value as any })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 transition-all appearance-none cursor-pointer pr-10"
              >
                <option value="TODOS">Todos</option>
                <option value="PENDIENTE">Pendientes</option>
                <option value="AUTORIZADO">Autorizados</option>
                <option value="RECHAZADO">Rechazados</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Botón Actualizar */}
          <div className="flex items-end">
            <button
              onClick={loadRetiros}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Buscar
            </button>
          </div>
        </div>
        
        {/* Filtros activos */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
          {filters.fecha && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(filters.fecha + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
              <button onClick={() => updateFilters({ fecha: '' })} className="hover:text-indigo-900 ml-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          {filters.searchTerm && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              "{filters.searchTerm}"
              <button onClick={() => updateFilters({ searchTerm: '' })} className="hover:text-blue-900 ml-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          {selectedGrado && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {selectedGrado}° Grado
              <button onClick={() => { setSelectedGrado(''); updateFilters({ grado: '' }) }} className="hover:text-purple-900 ml-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          {filters.estado !== 'TODOS' && (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
              filters.estado === 'PENDIENTE' ? 'bg-amber-50 text-amber-700' :
              filters.estado === 'AUTORIZADO' ? 'bg-green-50 text-green-700' :
              'bg-red-50 text-red-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                filters.estado === 'PENDIENTE' ? 'bg-amber-500' :
                filters.estado === 'AUTORIZADO' ? 'bg-green-500' :
                'bg-red-500'
              }`}></span>
              {filters.estado}
              <button onClick={() => updateFilters({ estado: 'TODOS' })} className="hover:opacity-70 ml-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          {!filters.fecha && !filters.searchTerm && !selectedGrado && filters.estado === 'TODOS' && (
            <span className="text-xs text-slate-400 italic">Mostrando todos los retiros</span>
          )}
        </div>
      </div>

      {/* Stats */}
      <RetirosStats stats={stats} />

      {/* Table mejorada */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-slate-900">
              Lista de Retiros
            </h3>
            <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full">
              {retiros.length}
            </span>
          </div>
        </div>
        <RetirosTable
          retiros={retiros}
          onAutorizar={autorizarRetiro}
          onModificar={modificarRetiro}
          onEliminar={eliminarRetiro}
        />
      </div>
    </div>
  )
}
