import { DocentesFilters } from '@/hooks/useDocentes'

interface DocentesFiltersProps {
  filters: DocentesFilters
  especialidades: string[]
  instituciones: string[]
  onFiltersChange: (filters: Partial<DocentesFilters>) => void
  onRefresh: () => void
}

export default function DocentesFiltersComponent({ 
  filters, 
  especialidades, 
  instituciones, 
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="TODOS">Todos</option>
            <option value="ACTIVO">Activos</option>
            <option value="INACTIVO">Inactivos</option>
          </select>
        </div>
        <div>
          <label htmlFor="especialidad" className="block text-sm font-medium text-gray-700 mb-1">
            Especialidad
          </label>
          <select
            id="especialidad"
            value={filters.filterEspecialidad}
            onChange={(e) => onFiltersChange({ filterEspecialidad: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Todas</option>
            {especialidades.map((especialidad) => (
              <option key={especialidad} value={especialidad}>
                {especialidad}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="institucion" className="block text-sm font-medium text-gray-700 mb-1">
            Institución
          </label>
          <select
            id="institucion"
            value={filters.filterInstitucion}
            onChange={(e) => onFiltersChange({ filterInstitucion: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Todas</option>
            {instituciones.map((institucion) => (
              <option key={institucion} value={institucion}>
                {institucion}
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
