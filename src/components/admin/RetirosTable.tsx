import { Retiro } from '@/hooks/useRetiros'

interface RetirosTableProps {
  retiros: Retiro[]
  onAutorizar: (retiroId: string, autorizado: boolean, observaciones?: string) => void
  onCompletar: (retiroId: string) => void
}

export default function RetirosTable({ retiros, onAutorizar, onCompletar }: RetirosTableProps) {
  if (retiros.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay retiros</h3>
          <p className="mt-1 text-sm text-gray-500">
            No se encontraron retiros para los filtros aplicados.
          </p>
        </div>
      </div>
    )
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800'
      case 'AUTORIZADO':
        return 'bg-blue-100 text-blue-800'
      case 'COMPLETADO':
        return 'bg-green-100 text-green-800'
      case 'RECHAZADO':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estudiante
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Apoderado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Hora Retiro
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Motivo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {retiros.map((retiro) => (
            <tr key={retiro.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-indigo-700">
                        {retiro.estudiante.nombre.charAt(0)}{retiro.estudiante.apellido.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {retiro.estudiante.nombre} {retiro.estudiante.apellido}
                    </div>
                    <div className="text-sm text-gray-500">
                      {retiro.estudiante.grado} - {retiro.estudiante.seccion}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {retiro.apoderado.nombre} {retiro.apoderado.apellido}
                </div>
                <div className="text-sm text-gray-500">{retiro.apoderado.telefono}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {new Date(`2000-01-01T${retiro.horaRetiro}`).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">{retiro.motivo}</div>
                {retiro.observaciones && (
                  <div className="text-sm text-gray-500">{retiro.observaciones}</div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(retiro.estado)}`}>
                  {retiro.estado}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <button className="text-indigo-600 hover:text-indigo-900">
                    Ver
                  </button>
                  {retiro.estado === 'PENDIENTE' && (
                    <>
                      <button
                        onClick={() => onAutorizar(retiro.id, true)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Autorizar
                      </button>
                      <button
                        onClick={() => onAutorizar(retiro.id, false)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Rechazar
                      </button>
                    </>
                  )}
                  {retiro.estado === 'AUTORIZADO' && (
                    <button
                      onClick={() => onCompletar(retiro.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Completar
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
