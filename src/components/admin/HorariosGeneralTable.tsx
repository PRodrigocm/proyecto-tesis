import { HorarioGeneral } from '@/hooks/useHorariosGeneral'

interface HorariosGeneralTableProps {
  horariosGeneral: HorarioGeneral[]
  onEdit: (horario: HorarioGeneral) => void
  onDelete: (id: string) => void
  onToggleActivo: (id: string, activo: boolean) => void
}

export default function HorariosGeneralTable({ 
  horariosGeneral, 
  onEdit, 
  onDelete, 
  onToggleActivo 
}: HorariosGeneralTableProps) {
  if (horariosGeneral.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay horarios generales</h3>
          <p className="mt-1 text-sm text-gray-500">
            No se encontraron horarios generales para los filtros aplicados.
          </p>
        </div>
      </div>
    )
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'ENTRADA': return '🚪'
      case 'SALIDA': return '🏃'
      case 'RECREO': return '⚽'
      case 'ALMUERZO': return '🍽️'
      case 'ACTIVIDAD': return '📚'
      default: return '⏰'
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'ENTRADA': return 'bg-green-100 text-green-800'
      case 'SALIDA': return 'bg-red-100 text-red-800'
      case 'RECREO': return 'bg-blue-100 text-blue-800'
      case 'ALMUERZO': return 'bg-orange-100 text-orange-800'
      case 'ACTIVIDAD': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSesionColor = (sesion: string) => {
    switch (sesion) {
      case 'AM': return 'bg-yellow-100 text-yellow-800'
      case 'PM': return 'bg-indigo-100 text-indigo-800'
      case 'AMBAS': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Horario
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tipo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Horario
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sesión
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Días
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="relative px-6 py-3">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {horariosGeneral.map((horario) => (
            <tr key={horario.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">{getTipoIcon(horario.tipo)}</div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{horario.nombre}</div>
                    <div className="text-sm text-gray-500">{horario.descripcion}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTipoColor(horario.tipo)}`}>
                  {horario.tipo}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {horario.horaInicio} - {horario.horaFin}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSesionColor(horario.sesion)}`}>
                  {horario.sesion}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {horario.diasSemana.join(', ')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => onToggleActivo(horario.id, !horario.activo)}
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    horario.activo 
                      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  {horario.activo ? 'Activo' : 'Inactivo'}
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex space-x-2 justify-end">
                  <button
                    onClick={() => onEdit(horario)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(horario.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
