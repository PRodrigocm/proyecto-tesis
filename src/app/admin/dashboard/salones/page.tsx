'use client'

import { useState } from 'react'
import { useSalones } from '@/hooks/useSalones'
import SalonesTable from '@/components/admin/SalonesTable'
import SalonesGroupedView from '@/components/admin/SalonesGroupedView'
import SalonesSidebar from '@/components/admin/SalonesSidebar'
import SalonesFilteredView from '@/components/admin/SalonesFilteredView'
import CreateSalonForm from '@/components/admin/CreateSalonForm'

export default function SalonesPage() {
  const { salones, loading, error } = useSalones()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [viewMode, setViewMode] = useState<'grouped' | 'table' | 'sidebar'>('sidebar')
  const [selectedGrado, setSelectedGrado] = useState<string | null>(null)
  const [selectedSeccion, setSelectedSeccion] = useState<string | null>(null)

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    )
  }

  const handleGradoSelect = (grado: string | null) => {
    setSelectedGrado(grado)
    setSelectedSeccion(null)
  }

  const handleSeccionSelect = (grado: string, seccion: string) => {
    setSelectedGrado(grado)
    setSelectedSeccion(seccion)
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar secundario para navegación de salones */}
      {!showCreateForm && viewMode === 'sidebar' && (
        <SalonesSidebar
          salones={salones}
          onGradoSelect={handleGradoSelect}
          onSeccionSelect={handleSeccionSelect}
          selectedGrado={selectedGrado}
          selectedSeccion={selectedSeccion}
        />
      )}

      {/* Contenido principal */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Gestión de Salones</h1>
              <p className="text-gray-600 mt-1">
                Administra los salones de la institución educativa
              </p>
            </div>
            <div className="flex space-x-3">
              {!showCreateForm && (
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('sidebar')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'sidebar'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Navegación
                  </button>
                  <button
                    onClick={() => setViewMode('grouped')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'grouped'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Por Grados
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'table'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Lista Completa
                  </button>
                </div>
              )}
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {showCreateForm ? 'Ver Lista' : 'Crear Salón'}
              </button>
            </div>
          </div>

          {showCreateForm && <CreateSalonForm />} 

          <div className="bg-white rounded-lg shadow">
              {viewMode !== 'sidebar' && (
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-medium text-gray-800">
                        {viewMode === 'grouped' ? 'Salones por Grado y Sección' : 'Lista de Salones'}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Total: {salones.length} salones registrados
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className={viewMode === 'sidebar' ? '' : 'p-6'}>
                {viewMode === 'sidebar' ? (
                  <SalonesFilteredView 
                    salones={salones} 
                    loading={loading}
                    selectedGrado={selectedGrado}
                    selectedSeccion={selectedSeccion}
                  />
                ) : viewMode === 'grouped' ? (
                  <SalonesGroupedView salones={salones} loading={loading} />
                ) : (
                  <SalonesTable salones={salones} loading={loading} />
                )}
              </div>
            </div>
        </div>
      </div>
    </div>
  )
}
