import { Asistencia } from '@/hooks/useAsistencia'

interface AsistenciaTableProps {
  asistencias: Asistencia[]
  onMarcarAsistencia: (estudianteId: string, estado: 'PRESENTE' | 'AUSENTE' | 'TARDANZA' | 'JUSTIFICADO', observaciones?: string) => void
  onRegistrarSalida: (asistenciaId: string) => void
}

export default function AsistenciaTable({ asistencias, onMarcarAsistencia, onRegistrarSalida }: AsistenciaTableProps) {
  if (asistencias.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay registros de asistencia</h3>
          <p className="mt-1 text-sm text-gray-500">
            No se encontraron registros para los filtros aplicados.
          </p>
        </div>
      </div>
    )
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PRESENTE':
        return 'bg-green-100 text-green-800'
      case 'AUSENTE':
        return 'bg-red-100 text-red-800'
      case 'TARDANZA':
        return 'bg-yellow-100 text-yellow-800'
      case 'JUSTIFICADO':
        return 'bg-blue-100 text-blue-800'
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
              Grado/Sección
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Hora Entrada
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Hora Salida
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sesión
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {asistencias.map((asistencia) => (
            <tr key={asistencia.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-indigo-700">
                        {asistencia.estudiante.nombre.charAt(0)}{asistencia.estudiante.apellido.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {asistencia.estudiante.nombre} {asistencia.estudiante.apellido}
                    </div>
                    <div className="text-sm text-gray-500">DNI: {asistencia.estudiante.dni}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{asistencia.estudiante.grado}</div>
                <div className="text-sm text-gray-500">Sección: {asistencia.estudiante.seccion}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {asistencia.horaEntrada ? new Date(`2000-01-01T${asistencia.horaEntrada}`).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '-'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {asistencia.horaSalida ? new Date(`2000-01-01T${asistencia.horaSalida}`).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '-'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(asistencia.estado)}`}>
                  {asistencia.estado}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  asistencia.sesion === 'AM' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                }`}>
                  {asistencia.sesion}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <button className="text-indigo-600 hover:text-indigo-900">
                    Ver
                  </button>
                  <button className="text-yellow-600 hover:text-yellow-900">
                    Editar
                  </button>
                  {asistencia.estado === 'PRESENTE' && !asistencia.horaSalida && (
                    <button
                      onClick={() => onRegistrarSalida(asistencia.id)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Registrar Salida
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
