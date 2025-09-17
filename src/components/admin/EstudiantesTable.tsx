import { Estudiante } from '@/hooks/useEstudiantes'

interface EstudiantesTableProps {
  estudiantes: Estudiante[]
  onEstadoChange: (id: string, estado: 'ACTIVO' | 'INACTIVO' | 'RETIRADO') => void
  onGenerateQR: (id: string) => void
}

export default function EstudiantesTable({ estudiantes, onEstadoChange, onGenerateQR }: EstudiantesTableProps) {
  if (estudiantes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay estudiantes</h3>
          <p className="mt-1 text-sm text-gray-500">
            No se encontraron estudiantes con los filtros aplicados.
          </p>
        </div>
      </div>
    )
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
              Apoderado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              QR Code
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
          {estudiantes.map((estudiante) => (
            <tr key={estudiante.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-indigo-700">
                        {estudiante.nombre.charAt(0)}{estudiante.apellido.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {estudiante.nombre} {estudiante.apellido}
                    </div>
                    <div className="text-sm text-gray-500">DNI: {estudiante.dni}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{estudiante.grado}</div>
                <div className="text-sm text-gray-500">Sección: {estudiante.seccion}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {estudiante.apoderado?.nombre} {estudiante.apoderado?.apellido}
                </div>
                <div className="text-sm text-gray-500">{estudiante.apoderado?.telefono}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {estudiante.qrCode ? (
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Generado
                  </span>
                ) : (
                  <button
                    onClick={() => onGenerateQR(estudiante.id)}
                    className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                  >
                    Generar QR
                  </button>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  estudiante.estado === 'ACTIVO'
                    ? 'bg-green-100 text-green-800'
                    : estudiante.estado === 'RETIRADO'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {estudiante.estado}
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
                  {estudiante.estado !== 'RETIRADO' && (
                    <button
                      onClick={() => onEstadoChange(
                        estudiante.id,
                        estudiante.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
                      )}
                      className={`${
                        estudiante.estado === 'ACTIVO'
                          ? 'text-red-600 hover:text-red-900'
                          : 'text-green-600 hover:text-green-900'
                      }`}
                    >
                      {estudiante.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}
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
