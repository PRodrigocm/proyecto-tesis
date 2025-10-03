'use client'

import { useState, useEffect } from 'react'
import TalleresTable from '@/components/admin/TalleresTable'
import TalleresStats from '@/components/admin/TalleresStats'
import CreateTallerModal from '@/components/admin/CreateTallerModal'
import { useTalleres } from '@/hooks/useTalleres'

export default function TalleresPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('TODOS')

  const {
    talleres,
    loading,
    stats,
    loadTalleres,
    crearTaller,
    actualizarTaller,
    eliminarTaller,
    inscribirEstudiante,
    desinscribirEstudiante
  } = useTalleres()

  const filteredTalleres = talleres.filter(taller => {
    const matchesSearch = !searchTerm || 
      taller.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      taller.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      taller.instructor?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesEstado = estadoFilter === 'TODOS' || 
      (estadoFilter === 'ACTIVO' && taller.activo) ||
      (estadoFilter === 'INACTIVO' && !taller.activo)

    return matchesSearch && matchesEstado
  })

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
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Talleres</h1>
          <p className="mt-2 text-sm text-gray-700">
            Administra los talleres extracurriculares y sus inscripciones
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            type="button"
            onClick={loadTalleres}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            🔄 Actualizar
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nuevo Taller
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar Talleres
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, descripción o instructor..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black placeholder-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="ACTIVO">Solo Activos</option>
              <option value="INACTIVO">Solo Inactivos</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadTalleres}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors font-medium"
            >
              🔍 Buscar
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <TalleresStats stats={stats} />

      {/* Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Talleres ({filteredTalleres.length})
          </h3>
        </div>
        <TalleresTable
          talleres={filteredTalleres}
          onActualizar={actualizarTaller}
          onEliminar={eliminarTaller}
          onInscribir={inscribirEstudiante}
          onDesinscribir={desinscribirEstudiante}
        />
      </div>

      {/* Modal de crear taller */}
      <CreateTallerModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={crearTaller}
      />
    </div>
  )
}
