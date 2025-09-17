import { Horario } from '@/hooks/useHorarios'

interface HorariosTableProps {
  horarios: Horario[]
  onEdit: (horario: Horario) => void
  onDelete: (id: string) => void
}

export default function HorariosTable({ horarios, onEdit, onDelete }: HorariosTableProps) {
  if (horarios.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay horarios</h3>
          <p className="mt-1 text-sm text-gray-500">
            No se encontraron horarios para los filtros aplicados.
          </p>
        </div>
      </div>
    )
  }

  const diasSemana = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']
  
  // Agrupar horarios por día de la semana
  const horariosPorDia = diasSemana.reduce((acc, dia) => {
    acc[dia] = horarios.filter(h => h.diaSemana === dia).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
    return acc
  }, {} as Record<string, Horario[]>)

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {diasSemana.map(dia => (
          <div key={dia} className="bg-white border rounded-lg">
            <div className="px-4 py-3 bg-gray-50 border-b rounded-t-lg">
              <h4 className="text-sm font-medium text-gray-900">{dia}</h4>
            </div>
            <div className="p-4 space-y-3">
              {horariosPorDia[dia].length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Sin clases</p>
              ) : (
                horariosPorDia[dia].map((horario) => (
                  <div key={horario.id} className="border rounded-lg p-3 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{horario.materia}</div>
                        <div className="text-xs text-gray-500">
                          {horario.grado} - {horario.seccion}
                        </div>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        horario.sesion === 'AM' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {horario.sesion}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-600 mb-2">
                      <div>{horario.horaInicio} - {horario.horaFin}</div>
                      <div>Aula: {horario.aula}</div>
                    </div>
                    
                    <div className="text-xs text-gray-500 mb-3">
                      Prof. {horario.docente.nombre} {horario.docente.apellido}
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEdit(horario)}
                        className="text-xs text-indigo-600 hover:text-indigo-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onDelete(horario.id)}
                        className="text-xs text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
