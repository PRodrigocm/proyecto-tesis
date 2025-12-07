import { DocentesFilters } from '@/hooks/useDocentes'

interface DocentesFiltersProps {
  filters: DocentesFilters
  grados: string[]
  secciones: string[]
  onFiltersChange: (filters: Partial<DocentesFilters>) => void
  onRefresh: () => void
}

export default function DocentesFiltersComponent({ 
  filters, 
  grados, 
  secciones, 
  onFiltersChange, 
  onRefresh 
}: DocentesFiltersProps) {
  const hasActiveFilters = filters.searchTerm || filters.filterEstado !== 'ACTIVO' || filters.filterGrado || filters.filterSeccion

  const clearAllFilters = () => {
    onFiltersChange({
      searchTerm: '',
      filterEstado: 'ACTIVO',
      filterGrado: '',
      filterSeccion: ''
    })
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      {/* Header con título */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filtros de búsqueda
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Búsqueda */}
        <div className="lg:col-span-2">
          <label htmlFor="search" className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
            Buscar docente
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              id="search"
              value={filters.searchTerm}
              onChange={(e) => onFiltersChange({ searchTerm: e.target.value })}
              placeholder="Nombre, email, DNI o especialidad..."
              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-gray-50 hover:bg-white transition-all placeholder:text-gray-400"
            />
            {filters.searchTerm && (
              <button
                onClick={() => onFiltersChange({ searchTerm: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Estado */}
        <div>
          <label htmlFor="estado" className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
            Estado
          </label>
          <div className="relative">
            <select
              id="estado"
              value={filters.filterEstado}
              onChange={(e) => onFiltersChange({ filterEstado: e.target.value as 'TODOS' | 'ACTIVO' | 'INACTIVO' })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-gray-50 hover:bg-white transition-all appearance-none cursor-pointer pr-10"
            >
              <option value="TODOS">Todos</option>
              <option value="ACTIVO">Activos</option>
              <option value="INACTIVO">Inactivos</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Grado */}
        <div>
          <label htmlFor="grado" className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
            Grado
          </label>
          <div className="relative">
            <select
              id="grado"
              value={filters.filterGrado}
              onChange={(e) => onFiltersChange({ filterGrado: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-gray-50 hover:bg-white transition-all appearance-none cursor-pointer pr-10"
            >
              <option value="">Todos los grados</option>
              {[...new Set(grados)].map((grado, index) => (
                <option key={`grado-${grado}-${index}`} value={grado}>
                  {grado}° Grado
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Sección */}
        <div>
          <label htmlFor="seccion" className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
            Sección
          </label>
          <div className="relative">
            <select
              id="seccion"
              value={filters.filterSeccion}
              onChange={(e) => onFiltersChange({ filterSeccion: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-gray-50 hover:bg-white transition-all appearance-none cursor-pointer pr-10"
            >
              <option value="">Todas las secciones</option>
              {[...new Set(secciones)].map((seccion, index) => (
                <option key={`seccion-${seccion}-${index}`} value={seccion}>
                  Sección {seccion}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros activos y botón actualizar */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="flex flex-wrap gap-2">
          {filters.searchTerm && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              "{filters.searchTerm}"
              <button onClick={() => onFiltersChange({ searchTerm: '' })} className="hover:text-indigo-900 ml-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          {filters.filterEstado !== 'ACTIVO' && filters.filterEstado !== 'TODOS' && (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
              filters.filterEstado === 'INACTIVO' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${filters.filterEstado === 'INACTIVO' ? 'bg-red-500' : 'bg-green-500'}`}></span>
              {filters.filterEstado}
              <button onClick={() => onFiltersChange({ filterEstado: 'ACTIVO' })} className="hover:opacity-70 ml-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          {filters.filterEstado === 'TODOS' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
              Mostrando todos
              <button onClick={() => onFiltersChange({ filterEstado: 'ACTIVO' })} className="hover:text-gray-900 ml-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          {filters.filterGrado && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {filters.filterGrado}° Grado
              <button onClick={() => onFiltersChange({ filterGrado: '' })} className="hover:text-blue-900 ml-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          {filters.filterSeccion && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Sección {filters.filterSeccion}
              <button onClick={() => onFiltersChange({ filterSeccion: '' })} className="hover:text-purple-900 ml-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          {!hasActiveFilters && (
            <span className="text-xs text-gray-400 italic">Sin filtros activos</span>
          )}
        </div>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-medium rounded-xl hover:from-indigo-600 hover:to-violet-700 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar
        </button>
      </div>
    </div>
  )
}
