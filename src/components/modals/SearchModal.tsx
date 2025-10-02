'use client'

import { useState } from 'react'
import {
  XMarkIcon,
  FunnelIcon,
  UserGroupIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

interface Estudiante {
  id: string
  nombre: string
  apellido: string
  dni: string
  grado: string
  seccion: string
  nivel: string
  codigoQR: string
  estado: 'PRESENTE' | 'AUSENTE' | 'RETIRADO' | 'TARDANZA'
  horaEntrada?: string
  horaSalida?: string
  horarioClase?: {
    horaInicio: string
    horaFin: string
    materia?: string
  }
}

interface SearchFilters {
  searchTerm: string
  grado: string
  seccion: string
  estado: string
  fecha: string
}

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  searchFilters: SearchFilters
  setSearchFilters: (filters: SearchFilters) => void
  searchResults: Estudiante[]
  searchLoading: boolean
  grados: any[]
  secciones: any[]
  onSearch: () => void
  onClearFilters: () => void
}

export default function SearchModal({
  isOpen,
  onClose,
  searchFilters,
  setSearchFilters,
  searchResults,
  searchLoading,
  grados,
  secciones,
  onSearch,
  onClearFilters
}: SearchModalProps) {
  if (!isOpen) return null

  const handleFilterChange = (field: string, value: string) => {
    setSearchFilters({
      ...searchFilters,
      [field]: value
    })
  }

  return (
    <div className="fixed inset-0 z-[9998] overflow-y-auto">
      <div className="flex items-start justify-center min-h-screen pt-4 px-4 pb-20">
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity" onClick={onClose}></div>

        <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-7xl mx-auto mt-8 z-[9999] min-h-[600px]">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200 rounded-t-lg">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">
                <FunnelIcon className="h-6 w-6 inline mr-2 text-purple-600" />
                Búsqueda de Asistencia
              </h3>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 p-2 focus:outline-none"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Panel de Filtros */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Filtros de Búsqueda</h4>
                  
                  <div className="space-y-4">
                    {/* Búsqueda por texto */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Buscar
                      </label>
                      <input
                        type="text"
                        value={searchFilters.searchTerm}
                        onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                        placeholder="Nombre, apellido o DNI"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-black"
                      />
                    </div>

                    {/* Filtro por grado */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grado
                      </label>
                      <select
                        value={searchFilters.grado}
                        onChange={(e) => handleFilterChange('grado', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-black"
                      >
                        <option value="">Todos los grados</option>
                        {grados.map((grado: any, index: number) => (
                          <option key={index} value={grado.nombre}>
                            {grado.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Filtro por sección */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sección
                      </label>
                      <select
                        value={searchFilters.seccion}
                        onChange={(e) => handleFilterChange('seccion', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-black"
                      >
                        <option value="">Todas las secciones</option>
                        {secciones.map((seccion: any, index: number) => (
                          <option key={index} value={seccion.nombre}>
                            {seccion.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Filtro por estado */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado
                      </label>
                      <select
                        value={searchFilters.estado}
                        onChange={(e) => handleFilterChange('estado', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-black"
                      >
                        <option value="">Todos los estados</option>
                        <option value="PRESENTE">Presente</option>
                        <option value="AUSENTE">Ausente</option>
                        <option value="RETIRADO">Retirado</option>
                        <option value="TARDANZA">Tardanza</option>
                      </select>
                    </div>

                    {/* Filtro por fecha */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha
                      </label>
                      <input
                        type="date"
                        value={searchFilters.fecha}
                        onChange={(e) => handleFilterChange('fecha', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-black"
                      />
                    </div>

                    {/* Botones de acción */}
                    <div className="space-y-2 pt-4">
                      <button
                        onClick={onSearch}
                        disabled={searchLoading}
                        className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                      >
                        <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                        {searchLoading ? 'Buscando...' : 'Buscar'}
                      </button>
                      <button
                        onClick={onClearFilters}
                        className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      >
                        Limpiar Filtros
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resultados de búsqueda */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <h4 className="text-md font-medium text-gray-900">
                      Resultados de Búsqueda ({searchResults.length})
                    </h4>
                  </div>
                  
                  <div className="overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Estudiante
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Grado/Sección
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Estado
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Horarios
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Entrada/Salida
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {searchLoading ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center">
                                <div className="flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mr-2"></div>
                                  <span className="text-gray-500">Buscando estudiantes...</span>
                                </div>
                              </td>
                            </tr>
                          ) : searchResults.length > 0 ? (
                            searchResults.map((estudiante: Estudiante) => (
                              <tr key={estudiante.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {estudiante.apellido}, {estudiante.nombre}
                                    </div>
                                    <div className="text-sm text-gray-500">DNI: {estudiante.dni}</div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  <div>{estudiante.grado}</div>
                                  <div>{estudiante.seccion}</div>
                                  <div className="text-xs text-gray-400">{estudiante.nivel}</div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    estudiante.estado === 'PRESENTE' 
                                      ? 'bg-green-100 text-green-800'
                                      : estudiante.estado === 'RETIRADO'
                                      ? 'bg-orange-100 text-orange-800'
                                      : estudiante.estado === 'TARDANZA'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {estudiante.estado}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {estudiante.horarioClase ? (
                                    <div>
                                      <div>Inicio: {estudiante.horarioClase.horaInicio}</div>
                                      <div>Fin: {estudiante.horarioClase.horaFin}</div>
                                      {estudiante.horarioClase.materia && (
                                        <div className="text-xs text-gray-400">{estudiante.horarioClase.materia}</div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-gray-400">Sin horario</div>
                                  )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {estudiante.horaEntrada ? (
                                    <div>Entrada: {estudiante.horaEntrada}</div>
                                  ) : (
                                    <div className="text-gray-400">Sin entrada</div>
                                  )}
                                  {estudiante.horaSalida ? (
                                    <div>Salida: {estudiante.horaSalida}</div>
                                  ) : estudiante.estado !== 'AUSENTE' ? (
                                    <div className="text-gray-400">Sin salida</div>
                                  ) : null}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center">
                                <div className="text-center">
                                  <UserGroupIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                                  <p className="text-sm text-gray-500">
                                    No se encontraron estudiantes
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    Intenta ajustar los filtros de búsqueda
                                  </p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 rounded-b-lg">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
