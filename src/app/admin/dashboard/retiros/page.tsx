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
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <h3 className="font-semibold text-slate-700">Filtros de búsqueda</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="space-y-2">
            <label htmlFor="fecha" className="block text-sm font-medium text-slate-700">
              Fecha
            </label>
            <input
              type="date"
              id="fecha"
              value={filters.fecha}
              onChange={(e) => updateFilters({ fecha: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Grado y Sección
            </label>
            <div className="flex gap-2">
              <select
                id="grado"
                value={selectedGrado}
                onChange={(e) => {
                  setSelectedGrado(e.target.value)
                  setSelectedSeccion('')
                  updateFilters({ grado: e.target.value })
                }}
                disabled={loadingGrados}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 disabled:bg-slate-100 transition-all"
              >
                <option value="">Grado</option>
                {gradosDB.map((grado, index) => (
                  <option key={grado.idGrado || `grado-${index}`} value={grado.nombre}>
                    {grado.nombre}°
                  </option>
                ))}
              </select>
              <select
                id="seccion"
                value={selectedSeccion}
                onChange={(e) => setSelectedSeccion(e.target.value)}
                disabled={loadingSecciones}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 disabled:bg-slate-100 transition-all"
              >
                <option value="">Sección</option>
                {seccionesDB.map((seccion, index) => (
                  <option key={seccion.idSeccion || `seccion-${index}`} value={seccion.nombre}>
                    {seccion.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="estudiante" className="block text-sm font-medium text-slate-700">
              Estudiante
            </label>
            <select
              id="estudiante"
              disabled={loadingEstudiantes}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 disabled:bg-slate-100 transition-all"
            >
              <option value="">Todos</option>
              {estudiantesFiltrados.map((estudiante) => (
                <option key={estudiante.id} value={estudiante.id}>
                  {estudiante.nombre} {estudiante.apellido}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="estado" className="block text-sm font-medium text-slate-700">
              Estado
            </label>
            <select
              id="estado"
              value={filters.estado}
              onChange={(e) => updateFilters({ estado: e.target.value as any })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 transition-all"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="AUTORIZADO">Autorizados</option>
              <option value="RECHAZADO">Rechazados</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadRetiros}
              className="w-full px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualizar
            </button>
          </div>
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
