import { Docente } from '@/hooks/useDocentes'

interface DocentesTableProps {
  docentes: Docente[]
  onView: (docente: Docente) => void
  onEdit: (docente: Docente) => void
  onEstadoChange: (id: string, estado: 'ACTIVO' | 'INACTIVO') => void
}

export default function DocentesTable({ docentes, onView, onEdit, onEstadoChange }: DocentesTableProps) {
  if (docentes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-2.25" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay docentes</h3>
          <p className="mt-1 text-sm text-gray-500">
            No se encontraron docentes con los filtros aplicados.
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
              Docente
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Especialidad
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contacto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Aula
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
          {docentes.map((docente) => (
            <tr key={docente.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-indigo-700">
                        {docente.nombre.charAt(0)}{docente.apellido.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {docente.nombre} {docente.apellido}
                    </div>
                    <div className="text-sm text-gray-500">DNI: {docente.dni}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{docente.especialidad}</div>
                <div className="text-sm text-gray-500">{docente.institucionEducativa}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{docente.email}</div>
                <div className="text-sm text-gray-500">{docente.telefono}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {docente.grado && docente.seccion ? (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {docente.grado}° {docente.seccion}
                    </span>
                  ) : (
                    <span className="text-gray-500">Sin asignar</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  docente.estado === 'ACTIVO'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {docente.estado}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <button 
                    onClick={() => onView(docente)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Ver
                  </button>
                  <button 
                    onClick={() => onEdit(docente)}
                    className="text-yellow-600 hover:text-yellow-900"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onEstadoChange(
                      docente.id,
                      docente.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
                    )}
                    className={`${
                      docente.estado === 'ACTIVO'
                        ? 'text-red-600 hover:text-red-900'
                        : 'text-green-600 hover:text-green-900'
                    }`}
                  >
                    {docente.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}
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
