import { HorarioTaller } from '@/hooks/useHorariosTaller'

interface HorariosTallerTableProps {
  horariosTaller: HorarioTaller[]
  onEdit: (horario: HorarioTaller) => void
  onDelete: (id: string) => void
  onToggleActivo: (id: string, activo: boolean) => void
}

export default function HorariosTallerTable({ 
  horariosTaller, 
  onEdit, 
  onDelete, 
  onToggleActivo 
}: HorariosTallerTableProps) {
  if (horariosTaller.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay horarios de talleres</h3>
          <p className="mt-1 text-sm text-gray-500">
            No se encontraron horarios de talleres para los filtros aplicados.
          </p>
        </div>
      </div>
    )
  }

  const diasSemana = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']
  
  // Agrupar horarios por día de la semana
  const horariosPorDia = diasSemana.reduce((acc, dia) => {
    acc[dia] = horariosTaller.filter(h => h.diaSemana === dia).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
    return acc
  }, {} as Record<string, HorarioTaller[]>)

  const getOcupacionColor = (inscritos: number, cupoMaximo: number) => {
    const porcentaje = (inscritos / cupoMaximo) * 100
    if (porcentaje >= 90) return 'bg-red-100 text-red-800'
    if (porcentaje >= 70) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

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
                <p className="text-sm text-gray-500 text-center py-4">Sin talleres</p>
              ) : (
                horariosPorDia[dia].map((horario) => (
                  <div key={horario.id} className="border rounded-lg p-3 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{horario.taller.nombre}</div>
                        <div className="text-xs text-gray-500">
                          Aula: {horario.aula}
                        </div>
                      </div>
                      <button
                        onClick={() => onToggleActivo(horario.id, !horario.activo)}
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          horario.activo 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {horario.activo ? 'Activo' : 'Inactivo'}
                      </button>
                    </div>
                    
                    <div className="text-xs text-gray-600 mb-2">
                      <div>{horario.horaInicio} - {horario.horaFin}</div>
                    </div>
                    
                    <div className="text-xs text-gray-500 mb-2">
                      Prof. {horario.docente.nombre} {horario.docente.apellido}
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-500">Inscritos</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getOcupacionColor(horario.taller.inscritosCount, horario.taller.cupoMaximo)}`}>
                          {horario.taller.inscritosCount}/{horario.taller.cupoMaximo}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min((horario.taller.inscritosCount / horario.taller.cupoMaximo) * 100, 100)}%` }}
                        ></div>
                      </div>
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
