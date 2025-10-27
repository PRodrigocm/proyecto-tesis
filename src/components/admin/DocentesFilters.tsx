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
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Buscar
          </label>
          <input
            type="text"
            id="search"
            value={filters.searchTerm}
            onChange={(e) => onFiltersChange({ searchTerm: e.target.value })}
            placeholder="Nombre, email o DNI..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            id="estado"
            value={filters.filterEstado}
            onChange={(e) => onFiltersChange({ filterEstado: e.target.value as 'TODOS' | 'ACTIVO' | 'INACTIVO' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black font-medium"
          >
            <option value="TODOS" className="text-black">Todos</option>
            <option value="ACTIVO" className="text-black">Activos</option>
            <option value="INACTIVO" className="text-black">Inactivos</option>
          </select>
        </div>
        <div>
          <label htmlFor="grado" className="block text-sm font-medium text-gray-700 mb-1">
            Grado
          </label>
          <select
            id="grado"
            value={filters.filterGrado}
            onChange={(e) => onFiltersChange({ filterGrado: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black font-medium"
          >
            <option value="" className="text-black">Todos</option>
            {[...new Set(grados)].map((grado, index) => (
              <option key={`grado-${grado}-${index}`} value={grado} className="text-black">
                {grado}°
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
            value={filters.filterSeccion}
            onChange={(e) => onFiltersChange({ filterSeccion: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black font-medium"
          >
            <option value="" className="text-black">Todas</option>
            {[...new Set(secciones)].map((seccion, index) => (
              <option key={`seccion-${seccion}-${index}`} value={seccion} className="text-black">
                {seccion}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={onRefresh}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            Actualizar
          </button>
        </div>
      </div>
    </div>
  )
}
