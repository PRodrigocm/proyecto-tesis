'use client'

import { useState } from 'react'
// import { PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

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

interface AuxiliaresTableProps {
  auxiliares: Auxiliar[]
  onRefresh: () => void
}

export default function AuxiliaresTable({ auxiliares, onRefresh }: AuxiliaresTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterArea, setFilterArea] = useState('')
  const [filterTurno, setFilterTurno] = useState('')

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este auxiliar?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        alert('Auxiliar eliminado exitosamente')
        onRefresh()
      } else {
        alert('Error al eliminar el auxiliar')
      }
    } catch (error) {
      console.error('Error deleting auxiliar:', error)
      alert('Error al eliminar el auxiliar')
    }
  }

  const handleEdit = (id: number) => {
    // TODO: Implementar edición
    console.log('Editar auxiliar:', id)
    alert('Función de edición próximamente')
  }

  const filteredAuxiliares = auxiliares.filter(auxiliar => {
    const matchesSearch = 
      auxiliar.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      auxiliar.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      auxiliar.dni.includes(searchTerm) ||
      auxiliar.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesArea = !filterArea // Temporalmente deshabilitado hasta implementar relación auxiliar
    const matchesTurno = !filterTurno // Temporalmente deshabilitado hasta implementar relación auxiliar

    return matchesSearch && matchesArea && matchesTurno
  })

  const areas: string[] = [] // Temporalmente vacío hasta implementar relación auxiliar
  const turnos: string[] = [] // Temporalmente vacío hasta implementar relación auxiliar

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">🔍</span>
          </div>
          <input
            type="text"
            placeholder="Buscar auxiliares..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <select
          value={filterArea}
          onChange={(e) => setFilterArea(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Todas las áreas</option>
          {areas.map(area => (
            <option key={area} value={area}>{area}</option>
          ))}
        </select>

        <select
          value={filterTurno}
          onChange={(e) => setFilterTurno(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Todos los turnos</option>
          {turnos.map(turno => (
            <option key={turno} value={turno}>{turno}</option>
          ))}
        </select>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Auxiliares</dt>
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
                    {filteredAuxiliares.filter(aux => aux.estado === 'ACTIVO').length}
                  </span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Activos</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {filteredAuxiliares.filter(aux => aux.estado === 'ACTIVO').length}
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
                  <span className="text-white text-sm font-medium">{areas.length}</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Áreas</dt>
                  <dd className="text-lg font-medium text-gray-900">{areas.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{turnos.length}</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Turnos</dt>
                  <dd className="text-lg font-medium text-gray-900">{turnos.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Auxiliar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DNI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Área
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Turno
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAuxiliares.map((auxiliar) => (
                <tr key={auxiliar.idUsuario} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {auxiliar.nombre.charAt(0)}{auxiliar.apellido.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {auxiliar.nombre} {auxiliar.apellido}
                        </div>
                        <div className="text-sm text-gray-500">
                          {auxiliar.ie.nombre}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {auxiliar.dni}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{auxiliar.email}</div>
                    <div className="text-sm text-gray-500">{auxiliar.telefono || 'Sin teléfono'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      Sin área
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                      Sin turno
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      auxiliar.estado === 'ACTIVO' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {auxiliar.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(auxiliar.idUsuario)}
                        className="text-indigo-600 hover:text-indigo-900 text-lg"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(auxiliar.idUsuario)}
                        className="text-red-600 hover:text-red-900 text-lg"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAuxiliares.length === 0 && (
          <div className="text-center py-12">
            <div className="text-sm text-gray-500">
              No se encontraron auxiliares que coincidan con los filtros.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
