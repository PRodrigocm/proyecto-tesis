'use client'

import { useState, useEffect } from 'react'
import { useRetiros } from '@/hooks/useRetiros'
import RetirosTable from '@/components/admin/RetirosTable'
import RetirosStats from '@/components/admin/RetirosStats'
import CreateRetiroModal from '@/components/admin/CreateRetiroModal'

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
  const [showCreateModal, setShowCreateModal] = useState(false)
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
    solicitarRetiro,
    autorizarRetiro,
    completarRetiro,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Retiros</h1>
          <p className="mt-2 text-sm text-gray-700">
            Administra los retiros de estudiantes
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nuevo Retiro
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha
            </label>
            <input
              type="date"
              id="fecha"
              value={filters.fecha}
              onChange={(e) => updateFilters({ fecha: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grado y Sección
            </label>
            <div className="flex space-x-2">
              <select
                id="grado"
                value={selectedGrado}
                onChange={(e) => {
                  setSelectedGrado(e.target.value)
                  setSelectedSeccion('') // Reset sección cuando cambia grado
                  updateFilters({ grado: e.target.value })
                }}
                disabled={loadingGrados}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 disabled:bg-gray-100"
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
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 disabled:bg-gray-100"
              >
                <option value="">Sección</option>
                {seccionesDB.map((seccion, index) => (
                  <option key={seccion.idSeccion || `seccion-${index}`} value={seccion.nombre}>
                    {seccion.nombre}
                  </option>
                ))}
              </select>
            </div>
            {(loadingGrados || loadingSecciones) && <p className="text-xs text-gray-500 mt-1">Cargando...</p>}
          </div>
          <div>
            <label htmlFor="estudiante" className="block text-sm font-medium text-gray-700 mb-1">
              Estudiante
            </label>
            <select
              id="estudiante"
              disabled={loadingEstudiantes}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 disabled:bg-gray-100"
            >
              <option value="">Todos los estudiantes</option>
              {estudiantesFiltrados.map((estudiante) => (
                <option key={estudiante.id} value={estudiante.id}>
                  {estudiante.nombre} {estudiante.apellido} - {estudiante.grado}° {estudiante.seccion}
                </option>
              ))}
            </select>
            {loadingEstudiantes && <p className="text-xs text-gray-500 mt-1">Cargando...</p>}
          </div>
          <div>
            <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-1">
              Estado del Retiro
            </label>
            <select
              id="estado"
              value={filters.estado}
              onChange={(e) => updateFilters({ estado: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
            >
              <option value="TODOS">📋 Todos los Estados</option>
              <option value="PENDIENTE">⏳ Pendientes de Autorización</option>
              <option value="AUTORIZADO">✅ Autorizados</option>
              <option value="COMPLETADO">🏁 Completados</option>
              <option value="RECHAZADO">❌ Rechazados</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadRetiros}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors font-medium"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <RetirosStats stats={stats} />

      {/* Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Retiros ({retiros.length})
          </h3>
        </div>
        <RetirosTable
          retiros={retiros}
          onAutorizar={autorizarRetiro}
          onCompletar={completarRetiro}
          onModificar={modificarRetiro}
          onEliminar={eliminarRetiro}
        />
      </div>

      {/* Modal de crear retiro */}
      <CreateRetiroModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={solicitarRetiro}
      />
    </div>
  )
}
