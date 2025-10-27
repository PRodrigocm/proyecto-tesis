'use client'

import { useState } from 'react'

interface Administrativo {
  id: number
  nombre: string
  apellido: string
  dni: string
  email: string
  telefono?: string
  cargo: string
  departamento: string
  fechaIngreso: string
  institucionEducativa: string
  estado: 'ACTIVO' | 'INACTIVO'
  fechaRegistro: string
  roles: Array<{
    rol: {
      nombre: string
    }
  }>
}

interface AdministrativosTableProps {
  administrativos: Administrativo[]
  onRefresh: () => void
  onView: (id: number) => void
  onEdit: (id: number) => void
  onEstadoChange: (id: number, estado: 'ACTIVO' | 'INACTIVO') => void
}

export function AdministrativosTable({ administrativos, onRefresh, onView, onEdit, onEstadoChange }: AdministrativosTableProps) {

  return (
    <div className="bg-white shadow-sm ring-1 ring-gray-200 rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="overflow-hidden shadow-sm ring-1 ring-gray-200 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DNI
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teléfono
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Institución
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="relative px-3 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {administrativos.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-indigo-600 font-medium text-xs">
                            {admin.nombre?.charAt(0)}{admin.apellido?.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {admin.nombre} {admin.apellido}
                        </div>
                        <div className="text-xs text-gray-500">
                          {admin.roles?.map((r, index) => r.rol?.nombre).filter(Boolean).join(', ') || 'Administrativo'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                    {admin.dni || 'Sin DNI'}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-900">
                    <div className="max-w-xs truncate" title={admin.email || 'Sin email'}>
                      {admin.email || 'Sin email'}
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                    {admin.telefono || '-'}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-900">
                    <div className="max-w-xs truncate" title={admin.institucionEducativa || 'Sin institución'}>
                      {admin.institucionEducativa || 'Sin institución'}
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      (admin.estado || 'INACTIVO') === 'ACTIVO' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {admin.estado || 'INACTIVO'}
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => onView(admin.id)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Ver
                      </button>
                      <button 
                        onClick={() => onEdit(admin.id)}
                        className="text-yellow-600 hover:text-yellow-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onEstadoChange(
                          admin.id,
                          admin.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
                        )}
                        className={`${
                          admin.estado === 'ACTIVO'
                            ? 'text-red-600 hover:text-red-900'
                            : 'text-green-600 hover:text-green-900'
                        }`}
                      >
                        {admin.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {administrativos.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay administrativos</h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron administrativos que coincidan con los filtros.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
