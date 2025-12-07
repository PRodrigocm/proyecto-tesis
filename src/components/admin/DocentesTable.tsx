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
      <div className="text-center py-16 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-2.25" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">No hay docentes</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          No se encontraron docentes con los filtros aplicados. Intenta ajustar los criterios de búsqueda.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Docente
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Especialidad
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Contacto
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Aulas Asignadas
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {docentes.map((docente) => (
            <tr key={docente.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                      <span className="text-sm font-semibold text-white">
                        {docente.nombre.charAt(0)}{docente.apellido.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {docente.nombre} {docente.apellido}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                      {docente.dni}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-gray-900">{docente.especialidad || 'Sin especialidad'}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {docente.institucionEducativa}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="truncate max-w-[150px]">{docente.email}</span>
                </div>
                {docente.telefono && (
                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {docente.telefono}
                  </div>
                )}
              </td>
              <td className="px-6 py-4">
                {docente.materias && docente.materias.length > 0 ? (
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {docente.materias.slice(0, 3).map((materia, idx) => (
                      <span key={idx} className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                        {materia.nombre}
                      </span>
                    ))}
                    {docente.materias.length > 3 && (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-600">
                        +{docente.materias.length - 3} más
                      </span>
                    )}
                  </div>
                ) : docente.grado && docente.seccion ? (
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                    {docente.grado}° {docente.seccion}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400 italic">Sin asignar</span>
                )}
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
                  docente.estado === 'ACTIVO'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${docente.estado === 'ACTIVO' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                  {docente.estado}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-end gap-1">
                  <button 
                    onClick={() => onView(docente)}
                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Ver detalles"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => onEdit(docente)}
                    className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onEstadoChange(
                      docente.id,
                      docente.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
                    )}
                    className={`p-2 rounded-lg transition-colors ${
                      docente.estado === 'ACTIVO'
                        ? 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                        : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                    }`}
                    title={docente.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}
                  >
                    {docente.estado === 'ACTIVO' ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
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
