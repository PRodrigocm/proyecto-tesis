'use client'

import { useState, useEffect } from 'react'
import AuxiliaresTable from '@/components/admin/AuxiliaresTable'
import CreateAuxiliarModal from '@/components/forms/CreateAuxiliarModal'
import EditAuxiliarModal from '@/components/forms/EditAuxiliarModal'
import ViewAuxiliarModal from '@/components/modals/ViewAuxiliarModal'

interface Auxiliar {
  idUsuario: number
  dni: string
  nombre: string
  apellido: string
  email: string
  telefono?: string
  estado: string
  ie: {
    nombre: string
  }
  roles: Array<{
    rol: {
      nombre: string
    }
  }>
  // auxiliar?: {
  //   area: string
  //   turno: string
  // }
}

export default function AuxiliaresPage() {
  const [auxiliares, setAuxiliares] = useState<Auxiliar[]>([])
  const [filteredAuxiliares, setFilteredAuxiliares] = useState<Auxiliar[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedAuxiliar, setSelectedAuxiliar] = useState<Auxiliar | null>(null)
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState<'TODOS' | 'ACTIVO' | 'INACTIVO'>('ACTIVO')

  useEffect(() => {
    fetchAuxiliares()
  }, [])

  // Efecto para filtrar auxiliares
  useEffect(() => {
    let filtered = auxiliares

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(auxiliar =>
        auxiliar.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auxiliar.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auxiliar.dni.includes(searchTerm) ||
        auxiliar.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${auxiliar.nombre} ${auxiliar.apellido}`.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrar por estado
    if (filterEstado !== 'TODOS') {
      filtered = filtered.filter(auxiliar => auxiliar.estado === filterEstado)
    }

    setFilteredAuxiliares(filtered)
  }, [auxiliares, searchTerm, filterEstado])

  const handleView = (id: number) => {
    const auxiliar = auxiliares.find(aux => aux.idUsuario === id)
    if (auxiliar) {
      setSelectedAuxiliar(auxiliar)
      setShowViewModal(true)
    }
  }

  const handleEdit = (id: number) => {
    const auxiliar = auxiliares.find(aux => aux.idUsuario === id)
    if (auxiliar) {
      setSelectedAuxiliar(auxiliar)
      setShowEditModal(true)
    }
  }

  const handleEstadoChange = async (id: number, nuevoEstado: 'ACTIVO' | 'INACTIVO') => {
    const auxiliar = auxiliares.find(aux => aux.idUsuario === id)
    const accion = nuevoEstado === 'INACTIVO' ? 'desactivar' : 'activar'
    
    if (!confirm(`¿Estás seguro de que deseas ${accion} a ${auxiliar?.nombre} ${auxiliar?.apellido}?`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado: nuevoEstado })
      })

      if (response.ok) {
        // Actualizar el estado local
        setAuxiliares(prev => 
          prev.map(aux => 
            aux.idUsuario === id 
              ? { ...aux, estado: nuevoEstado }
              : aux
          )
        )
        
        const mensaje = nuevoEstado === 'INACTIVO' ? 
          'Auxiliar desactivado exitosamente. Ya no aparecerá en la lista de activos.' :
          `Auxiliar ${nuevoEstado.toLowerCase()} exitosamente`
        
        alert(mensaje)
      } else {
        alert('Error al cambiar estado del auxiliar')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cambiar estado del auxiliar')
    }
  }

  const fetchAuxiliares = async () => {
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
      
      const response = await fetch(`/api/usuarios/auxiliares?ieId=${ieId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Error al cargar auxiliares')
      }

      const data = await response.json()
      setAuxiliares(data.data || [])
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
          <h1 className="text-2xl font-semibold text-gray-900">Gestión de Auxiliares</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gestión de personal auxiliar de la institución educativa.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Agregar Auxiliar
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
            placeholder="Buscar por nombre, apellido, DNI o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 text-black bg-white border border-gray-300 rounded-md leading-5 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value as 'TODOS' | 'ACTIVO' | 'INACTIVO')}
          className="block w-full px-3 py-2 text-black bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="ACTIVO">Solo Activos</option>
          <option value="TODOS">Todos los Estados</option>
          <option value="INACTIVO">Solo Inactivos</option>
        </select>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{filteredAuxiliares.length}</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Mostrados</dt>
                  <dd className="text-lg font-medium text-gray-900">{filteredAuxiliares.length}</dd>
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
                    {auxiliares.filter(aux => aux.estado === 'ACTIVO').length}
                  </span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Activos</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {auxiliares.filter(aux => aux.estado === 'ACTIVO').length}
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
                    {auxiliares.filter(aux => aux.estado === 'INACTIVO').length}
                  </span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Inactivos</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {auxiliares.filter(aux => aux.estado === 'INACTIVO').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AuxiliaresTable 
        auxiliares={filteredAuxiliares}
        onRefresh={fetchAuxiliares}
        onView={handleView}
        onEdit={handleEdit}
        onEstadoChange={handleEstadoChange}
      />

      <CreateAuxiliarModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchAuxiliares}
      />

      <EditAuxiliarModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedAuxiliar(null)
        }}
        onSuccess={fetchAuxiliares}
        auxiliar={selectedAuxiliar}
      />

      <ViewAuxiliarModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false)
          setSelectedAuxiliar(null)
        }}
        auxiliar={selectedAuxiliar}
      />
    </div>
  )
}
