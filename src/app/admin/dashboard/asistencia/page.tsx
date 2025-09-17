'use client'

import { useAsistencia } from '@/hooks/useAsistencia'
import AsistenciaTable from '@/components/admin/AsistenciaTable'
import AsistenciaStats from '@/components/admin/AsistenciaStats'

export default function AsistenciaPage() {
  const {
    asistencias,
    loading,
    filters,
    grados,
    secciones,
    stats,
    loadAsistencias,
    marcarAsistencia,
    registrarSalida,
    updateFilters
  } = useAsistencia()

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
          <h1 className="text-2xl font-bold text-gray-900">Control de Asistencia</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gestiona la asistencia diaria de los estudiantes
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
            Marcar Asistencia
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha
            </label>
            <input
              type="date"
              id="fecha"
              value={filters.fecha}
              onChange={(e) => updateFilters({ fecha: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="grado" className="block text-sm font-medium text-gray-700 mb-1">
              Grado
            </label>
            <select
              id="grado"
              value={filters.grado}
              onChange={(e) => updateFilters({ grado: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              {grados.map((grado) => (
                <option key={grado} value={grado}>
                  {grado}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="seccion" className="block text-sm font-medium text-gray-700 mb-1">
              Sección
            </label>
            <select
              id="seccion"
              value={filters.seccion}
              onChange={(e) => updateFilters({ seccion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Todas</option>
              {secciones.map((seccion) => (
                <option key={seccion} value={seccion}>
                  {seccion}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              id="estado"
              value={filters.estado}
              onChange={(e) => updateFilters({ estado: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="TODOS">Todos</option>
              <option value="PRESENTE">Presentes</option>
              <option value="AUSENTE">Ausentes</option>
              <option value="TARDANZA">Tardanzas</option>
              <option value="JUSTIFICADO">Justificados</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadAsistencias}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <AsistenciaStats stats={stats} />

      {/* Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Registros de Asistencia ({asistencias.length})
          </h3>
        </div>
        <AsistenciaTable
          asistencias={asistencias}
          onMarcarAsistencia={marcarAsistencia}
          onRegistrarSalida={registrarSalida}
        />
      </div>
    </div>
  )
}