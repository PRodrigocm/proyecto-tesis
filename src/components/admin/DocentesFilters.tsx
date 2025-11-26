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
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Búsqueda */}
        <div className="md:col-span-2">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1.5">
            🔍 Buscar
          </label>
          <div className="relative">
            <input
              type="text"
              id="search"
              value={filters.searchTerm}
              onChange={(e) => onFiltersChange({ searchTerm: e.target.value })}
              placeholder="Nombre, email o DNI..."
              className="w-full pl-4 pr-10 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white transition-all"
            />
            {filters.searchTerm && (
              <button
                onClick={() => onFiltersChange({ searchTerm: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Estado */}
        <div>
          <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-1.5">
            📊 Estado
          </label>
          <select
            id="estado"
            value={filters.filterEstado}
            onChange={(e) => onFiltersChange({ filterEstado: e.target.value as 'TODOS' | 'ACTIVO' | 'INACTIVO' })}
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white transition-all appearance-none cursor-pointer"
          >
            <option value="TODOS">Todos</option>
            <option value="ACTIVO">🟢 Activos</option>
            <option value="INACTIVO">🔴 Inactivos</option>
          </select>
        </div>

        {/* Grado */}
        <div>
          <label htmlFor="grado" className="block text-sm font-medium text-gray-700 mb-1.5">
            📚 Grado
          </label>
          <select
            id="grado"
            value={filters.filterGrado}
            onChange={(e) => onFiltersChange({ filterGrado: e.target.value })}
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white transition-all appearance-none cursor-pointer"
          >
            <option value="">Todos</option>
            {[...new Set(grados)].map((grado, index) => (
              <option key={`grado-${grado}-${index}`} value={grado}>
                {grado}
              </option>
            ))}
          </select>
        </div>

        {/* Sección */}
        <div>
          <label htmlFor="seccion" className="block text-sm font-medium text-gray-700 mb-1.5">
            🏫 Sección
          </label>
          <select
            id="seccion"
            value={filters.filterSeccion}
            onChange={(e) => onFiltersChange({ filterSeccion: e.target.value })}
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white transition-all appearance-none cursor-pointer"
          >
            <option value="">Todas</option>
            {[...new Set(secciones)].map((seccion, index) => (
              <option key={`seccion-${seccion}-${index}`} value={seccion}>
                {seccion}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Botón de actualizar y filtros activos */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="flex flex-wrap gap-2">
          {filters.searchTerm && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm">
              Búsqueda: "{filters.searchTerm}"
              <button onClick={() => onFiltersChange({ searchTerm: '' })} className="hover:text-indigo-900">✕</button>
            </span>
          )}
          {filters.filterEstado !== 'TODOS' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm">
              Estado: {filters.filterEstado}
              <button onClick={() => onFiltersChange({ filterEstado: 'TODOS' })} className="hover:text-indigo-900">✕</button>
            </span>
          )}
          {filters.filterGrado && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm">
              Grado: {filters.filterGrado}
              <button onClick={() => onFiltersChange({ filterGrado: '' })} className="hover:text-indigo-900">✕</button>
            </span>
          )}
          {filters.filterSeccion && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm">
              Sección: {filters.filterSeccion}
              <button onClick={() => onFiltersChange({ filterSeccion: '' })} className="hover:text-indigo-900">✕</button>
            </span>
          )}
        </div>
        <button
          onClick={onRefresh}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-violet-700 transition-all shadow-md flex items-center gap-2"
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
