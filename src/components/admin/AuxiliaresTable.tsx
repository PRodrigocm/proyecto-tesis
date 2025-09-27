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
  onView: (id: number) => void
  onEdit: (id: number) => void
  onEstadoChange: (id: number, estado: 'ACTIVO' | 'INACTIVO') => void
}

export default function AuxiliaresTable({ auxiliares, onRefresh, onView, onEdit, onEstadoChange }: AuxiliaresTableProps) {
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




  return (
    <div className="space-y-4">
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
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auxiliares.map((auxiliar) => (
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
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      auxiliar.estado === 'ACTIVO' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {auxiliar.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => onView(auxiliar.idUsuario)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Ver
                      </button>
                      <button 
                        onClick={() => onEdit(auxiliar.idUsuario)}
                        className="text-yellow-600 hover:text-yellow-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onEstadoChange(
                          auxiliar.idUsuario,
                          auxiliar.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
                        )}
                        className={`${
                          auxiliar.estado === 'ACTIVO'
                            ? 'text-red-600 hover:text-red-900'
                            : 'text-green-600 hover:text-green-900'
                        }`}
                      >
                        {auxiliar.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {auxiliares.length === 0 && (
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
