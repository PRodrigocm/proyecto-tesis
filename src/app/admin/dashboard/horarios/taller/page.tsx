'use client'

import { useHorariosTaller } from '@/hooks/useHorariosTaller'
import HorariosTallerTable from '@/components/admin/HorariosTallerTable'
import HorariosTallerStats from '@/components/admin/HorariosTallerStats'

export default function HorariosTallerPage() {
  const {
    horariosTaller,
    loading,
    filters,
    talleres,
    docentes,
    stats,
    loadHorariosTaller,
    crearHorarioTaller,
    actualizarHorarioTaller,
    eliminarHorarioTaller,
    toggleActivo,
    updateFilters
  } = useHorariosTaller()

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
          <h1 className="text-2xl font-bold text-gray-900">Horarios de Talleres</h1>
          <p className="mt-2 text-sm text-gray-700">
            Administra los horarios de talleres extracurriculares
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
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nuevo Horario
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label htmlFor="taller" className="block text-sm font-medium text-gray-700 mb-1">
              Taller
            </label>
            <select
              id="taller"
              value={filters.taller}
              onChange={(e) => updateFilters({ taller: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              {talleres.map((taller) => (
                <option key={taller} value={taller}>
                  {taller}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="docente" className="block text-sm font-medium text-gray-700 mb-1">
              Docente
            </label>
            <select
              id="docente"
              value={filters.docente}
              onChange={(e) => updateFilters({ docente: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              {docentes.map((docente) => (
                <option key={docente} value={docente}>
                  {docente}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="diaSemana" className="block text-sm font-medium text-gray-700 mb-1">
              Día
            </label>
            <select
              id="diaSemana"
              value={filters.diaSemana}
              onChange={(e) => updateFilters({ diaSemana: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="LUNES">Lunes</option>
              <option value="MARTES">Martes</option>
              <option value="MIERCOLES">Miércoles</option>
              <option value="JUEVES">Jueves</option>
              <option value="VIERNES">Viernes</option>
            </select>
          </div>
          <div>
            <label htmlFor="activo" className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              id="activo"
              value={filters.activo}
              onChange={(e) => updateFilters({ activo: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="TODOS">Todos</option>
              <option value="ACTIVO">Activos</option>
              <option value="INACTIVO">Inactivos</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadHorariosTaller}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <HorariosTallerStats stats={stats} />

      {/* Schedule Grid */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Horarios de Talleres ({horariosTaller.length})
          </h3>
        </div>
        <div className="p-4">
          <HorariosTallerTable
            horariosTaller={horariosTaller}
            onEdit={(horario) => console.log('Edit:', horario)}
            onDelete={eliminarHorarioTaller}
            onToggleActivo={toggleActivo}
          />
        </div>
      </div>
    </div>
  )
}
