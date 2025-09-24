'use client'

import { useCalendarios } from '@/hooks/useCalendarios'
import CalendariosTable from '@/components/admin/CalendariosTable'
import CalendariosStats from '@/components/admin/CalendariosStats'
import CalendarioMes from '@/components/admin/CalendarioMes'

export default function CalendariosPage() {
  const {
    eventos,
    loading,
    filters,
    añosDisponibles,
    mesesDisponibles,
    stats,
    loadEventos,
    crearEvento,
    actualizarEvento,
    eliminarEvento,
    toggleVisible,
    updateFilters
  } = useCalendarios()

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
          <h1 className="text-2xl font-bold text-gray-900">Calendario Escolar</h1>
          <p className="mt-2 text-sm text-gray-700">
            Administra eventos, fechas importantes y actividades del calendario escolar
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
            Nuevo Evento
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              id="tipo"
              value={filters.tipo}
              onChange={(e) => updateFilters({ tipo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="ACADEMICO">Académico</option>
              <option value="ADMINISTRATIVO">Administrativo</option>
              <option value="FESTIVO">Festivo</option>
              <option value="SUSPENSION">Suspensión</option>
              <option value="EVALUACION">Evaluación</option>
              <option value="REUNION">Reunión</option>
            </select>
          </div>
          <div>
            <label htmlFor="prioridad" className="block text-sm font-medium text-gray-700 mb-1">
              Prioridad
            </label>
            <select
              id="prioridad"
              value={filters.prioridad}
              onChange={(e) => updateFilters({ prioridad: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Todas</option>
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Media</option>
              <option value="BAJA">Baja</option>
            </select>
          </div>
          <div>
            <label htmlFor="mes" className="block text-sm font-medium text-gray-700 mb-1">
              Mes
            </label>
            <select
              id="mes"
              value={filters.mes}
              onChange={(e) => updateFilters({ mes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              {mesesDisponibles.map((mes) => (
                <option key={mes.value} value={mes.value}>
                  {mes.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="año" className="block text-sm font-medium text-gray-700 mb-1">
              Año
            </label>
            <select
              id="año"
              value={filters.año}
              onChange={(e) => updateFilters({ año: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              {añosDisponibles.map((año) => (
                <option key={año} value={año}>
                  {año}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="visible" className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              id="visible"
              value={filters.visible}
              onChange={(e) => updateFilters({ visible: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="TODOS">Todos</option>
              <option value="VISIBLE">Visibles</option>
              <option value="OCULTO">Ocultos</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadEventos}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Visor de calendario con horarios */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Horarios de la semana</h2>
        <CalendarioMes />
      </div>

      {/* Stats */}
      <CalendariosStats stats={stats} />

      {/* Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Eventos del Calendario ({eventos.length})
          </h3>
        </div>
        <CalendariosTable
          eventos={eventos}
          onEdit={(evento) => console.log('Edit:', evento)}
          onDelete={eliminarEvento}
          onToggleVisible={toggleVisible}
        />
      </div>
    </div>
  )
}
