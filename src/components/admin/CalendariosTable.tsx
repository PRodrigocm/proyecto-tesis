import { EventoCalendario } from '@/hooks/useCalendarios'

interface CalendariosTableProps {
  eventos: EventoCalendario[]
  onEdit: (evento: EventoCalendario) => void
  onDelete: (id: string) => void
  onToggleVisible: (id: string, visible: boolean) => void
}

export default function CalendariosTable({ 
  eventos, 
  onEdit, 
  onDelete, 
  onToggleVisible 
}: CalendariosTableProps) {
  if (eventos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay eventos</h3>
          <p className="mt-1 text-sm text-gray-500">
            No se encontraron eventos para los filtros aplicados.
          </p>
        </div>
      </div>
    )
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'ACADEMICO': return '📚'
      case 'ADMINISTRATIVO': return '📋'
      case 'FESTIVO': return '🎉'
      case 'SUSPENSION': return '⏸️'
      case 'EVALUACION': return '📝'
      case 'REUNION': return '👥'
      default: return '📅'
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'ACADEMICO': return 'bg-blue-100 text-blue-800'
      case 'ADMINISTRATIVO': return 'bg-gray-100 text-gray-800'
      case 'FESTIVO': return 'bg-green-100 text-green-800'
      case 'SUSPENSION': return 'bg-red-100 text-red-800'
      case 'EVALUACION': return 'bg-purple-100 text-purple-800'
      case 'REUNION': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'ALTA': return 'bg-red-100 text-red-800'
      case 'MEDIA': return 'bg-yellow-100 text-yellow-800'
      case 'BAJA': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatHora = (hora: string) => {
    return hora ? new Date(`2000-01-01T${hora}`).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    }) : ''
  }

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Evento
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tipo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fecha
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Horario
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Prioridad
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
          {eventos.map((evento) => (
            <tr key={evento.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">{getTipoIcon(evento.tipo)}</div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{evento.titulo}</div>
                    <div className="text-sm text-gray-500">{evento.descripcion}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTipoColor(evento.tipo)}`}>
                  {evento.tipo}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div>{formatFecha(evento.fechaInicio)}</div>
                {evento.fechaInicio !== evento.fechaFin && (
                  <div className="text-xs text-gray-500">
                    hasta {formatFecha(evento.fechaFin)}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {evento.todoDia ? (
                  <span className="text-blue-600">Todo el día</span>
                ) : (
                  <div>
                    {evento.horaInicio && formatHora(evento.horaInicio)}
                    {evento.horaFin && ` - ${formatHora(evento.horaFin)}`}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPrioridadColor(evento.prioridad)}`}>
                  {evento.prioridad}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => onToggleVisible(evento.id, !evento.visible)}
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    evento.visible 
                      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  {evento.visible ? 'Visible' : 'Oculto'}
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex space-x-2 justify-end">
                  <button
                    onClick={() => onEdit(evento)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(evento.id)}
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
