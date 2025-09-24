'use client'

import { useState } from 'react'
import { useDocentes } from '@/hooks/useDocentes'
import DocentesTable from '@/components/admin/DocentesTable'
import DocentesFilters from '@/components/admin/DocentesFilters'
import DocentesStats from '@/components/admin/DocentesStats'
import CreateDocenteModal from '@/components/forms/CreateDocenteModal'

export default function DocentesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  const {
    docentes,
    loading,
    filters,
    especialidades,
    instituciones,
    stats,
    loadDocentes,
    handleEstadoChange,
    updateFilters
  } = useDocentes()

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
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Docentes</h1>
          <p className="mt-2 text-sm text-gray-700">
            Administra los docentes y profesores del sistema
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nuevo Docente
          </button>
        </div>
      </div>

      {/* Filters */}
      <DocentesFilters
        filters={filters}
        especialidades={especialidades}
        instituciones={instituciones}
        onFiltersChange={updateFilters}
        onRefresh={loadDocentes}
      />

      {/* Stats */}
      <DocentesStats stats={stats} />

      {/* Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Lista de Docentes ({docentes.length})
          </h3>
        </div>
        <DocentesTable
          docentes={docentes}
          onEstadoChange={handleEstadoChange}
        />
      </div>

      <CreateDocenteModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadDocentes}
      />
    </div>
  )
}
