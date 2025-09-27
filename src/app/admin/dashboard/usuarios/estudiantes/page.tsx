'use client'

import { useState, useEffect } from 'react'
import EstudiantesTable from '@/components/admin/EstudiantesTable'
import CreateEstudianteModal from '@/components/forms/CreateEstudianteModal'
import EditEstudianteModal from '@/components/forms/EditEstudianteModal'
import ViewEstudianteModal from '@/components/modals/ViewEstudianteModal'

interface Estudiante {
  id: string
  nombre: string
  apellido: string
  dni: string
  fechaNacimiento: string
  grado: string
  seccion: string
  institucionEducativa: string
  apoderado: {
    id: string
    nombre: string
    apellido: string
    telefono: string
    email: string
    relacion: string
    esTitular: boolean
  }
  estado: 'ACTIVO' | 'INACTIVO' | 'RETIRADO'
  fechaRegistro: string
  qrCode: string
}

export default function EstudiantesPage() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [filteredEstudiantes, setFilteredEstudiantes] = useState<Estudiante[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedEstudiante, setSelectedEstudiante] = useState<Estudiante | null>(null)
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState<'TODOS' | 'ACTIVO' | 'INACTIVO' | 'RETIRADO'>('ACTIVO')
  
  useEffect(() => {
    fetchEstudiantes()
  }, [])

  // Efecto para filtrar estudiantes
  useEffect(() => {
    let filtered = estudiantes

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(estudiante =>
        estudiante.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        estudiante.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        estudiante.dni.includes(searchTerm) ||
        `${estudiante.nombre} ${estudiante.apellido}`.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrar por estado
    if (filterEstado !== 'TODOS') {
      filtered = filtered.filter(estudiante => estudiante.estado === filterEstado)
    }

    setFilteredEstudiantes(filtered)
  }, [estudiantes, searchTerm, filterEstado])

  const handleEstadoChange = async (id: string, nuevoEstado: 'ACTIVO' | 'INACTIVO' | 'RETIRADO') => {
    const estudiante = estudiantes.find(est => est.id === id)
    const accion = nuevoEstado === 'INACTIVO' ? 'desactivar' : 
                   nuevoEstado === 'ACTIVO' ? 'activar' : 'retirar'
    
    if (!confirm(`¿Estás seguro de que deseas ${accion} a ${estudiante?.nombre} ${estudiante?.apellido}?`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/estudiantes?id=${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado: nuevoEstado })
      })

      if (response.ok) {
        // Actualizar el estado local
        setEstudiantes(prev => 
          prev.map(est => 
            est.id === id 
              ? { ...est, estado: nuevoEstado }
              : est
          )
        )
        
        const mensaje = nuevoEstado === 'INACTIVO' ? 
          'Estudiante desactivado exitosamente. Ya no aparecerá en la lista de activos.' :
          `Estudiante ${nuevoEstado.toLowerCase()} exitosamente`
        
        alert(mensaje)
      } else {
        alert('Error al cambiar estado del estudiante')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cambiar estado del estudiante')
    }
  }

  const handleView = (id: string) => {
    const estudiante = estudiantes.find(est => est.id === id)
    if (estudiante) {
      setSelectedEstudiante(estudiante)
      setShowViewModal(true)
    }
  }

  const handleEdit = (id: string) => {
    const estudiante = estudiantes.find(est => est.id === id)
    if (estudiante) {
      setSelectedEstudiante(estudiante)
      setShowEditModal(true)
    }
  }

  const handleGenerateQR = (id: string) => {
    // TODO: Implementar generación de QR
    alert(`Generar QR para estudiante ID: ${id}\nPróximamente disponible`)
  }

  const fetchEstudiantes = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Obtener ieId del usuario
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        console.error('No user data found')
        return
      }
      
      const user = JSON.parse(userStr)
      const ieId = user.idIe || user.institucionId || 1
      
      const response = await fetch(`/api/estudiantes?ieId=${ieId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Error al cargar estudiantes')
      }

      const data = await response.json()
      setEstudiantes(data.data || [])
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Gestión de Estudiantes</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gestión de estudiantes registrados en el sistema.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Agregar Estudiante
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">🔍</span>
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre, apellido o DNI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 text-black bg-white border border-gray-300 rounded-md leading-5 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value as 'TODOS' | 'ACTIVO' | 'INACTIVO' | 'RETIRADO')}
          className="block w-full px-3 py-2 text-black bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="ACTIVO">Solo Activos</option>
          <option value="TODOS">Todos los Estados</option>
          <option value="INACTIVO">Solo Inactivos</option>
          <option value="RETIRADO">Solo Retirados</option>
        </select>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{filteredEstudiantes.length}</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Mostrados</dt>
                  <dd className="text-lg font-medium text-gray-900">{filteredEstudiantes.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {estudiantes.filter(est => est.estado === 'ACTIVO').length}
                  </span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Activos</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {estudiantes.filter(est => est.estado === 'ACTIVO').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {estudiantes.filter(est => est.estado === 'INACTIVO').length}
                  </span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Inactivos</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {estudiantes.filter(est => est.estado === 'INACTIVO').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {estudiantes.filter(est => est.estado === 'RETIRADO').length}
                  </span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Retirados</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {estudiantes.filter(est => est.estado === 'RETIRADO').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <EstudiantesTable 
          estudiantes={filteredEstudiantes}
          onEstadoChange={handleEstadoChange}
          onGenerateQR={handleGenerateQR}
          onView={handleView}
          onEdit={handleEdit}
        />
      )}

      <CreateEstudianteModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchEstudiantes}
      />

      <EditEstudianteModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedEstudiante(null)
        }}
        onSuccess={fetchEstudiantes}
        estudiante={selectedEstudiante}
      />

      <ViewEstudianteModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false)
          setSelectedEstudiante(null)
        }}
        estudiante={selectedEstudiante}
      />
    </div>
  )
}