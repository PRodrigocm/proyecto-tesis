'use client'

import { Salon } from '@/hooks/useSalones'
import { useState } from 'react'

interface SalonesGroupedViewProps {
  salones: Salon[]
  loading: boolean
  onView?: (salonId: string) => void
  onEdit?: (salonId: string) => void
  onDelete?: (salonId: string) => void
}

interface GroupedSalones {
  [grado: string]: {
    [seccion: string]: Salon[]
  }
}

export default function SalonesGroupedView({ salones, loading, onView, onEdit, onDelete }: SalonesGroupedViewProps) {
  const [expandedGrados, setExpandedGrados] = useState<Set<string>>(new Set())

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (salones.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No hay salones registrados</p>
      </div>
    )
  }

  // Agrupar salones por grado y sección
  const groupedSalones: GroupedSalones = salones.reduce((acc, salon) => {
    if (!acc[salon.grado]) {
      acc[salon.grado] = {}
    }
    if (!acc[salon.grado][salon.seccion]) {
      acc[salon.grado][salon.seccion] = []
    }
    acc[salon.grado][salon.seccion].push(salon)
    return acc
  }, {} as GroupedSalones)

  // Ordenar grados numéricamente
  const sortedGrados = Object.keys(groupedSalones).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, '')) || 0
    const numB = parseInt(b.replace(/\D/g, '')) || 0
    return numA - numB
  })

  const toggleGrado = (grado: string) => {
    const newExpanded = new Set(expandedGrados)
    if (newExpanded.has(grado)) {
      newExpanded.delete(grado)
    } else {
      newExpanded.add(grado)
    }
    setExpandedGrados(newExpanded)
  }

  const getTotalEstudiantesGrado = (grado: string) => {
    return Object.values(groupedSalones[grado])
      .flat()
      .reduce((total, salon) => total + salon.cantidadEstudiantes, 0)
  }

  const getTotalSalonesGrado = (grado: string) => {
    return Object.values(groupedSalones[grado]).flat().length
  }

  return (
    <div className="space-y-4">
      {sortedGrados.map((grado) => {
        const isExpanded = expandedGrados.has(grado)
        const totalEstudiantes = getTotalEstudiantesGrado(grado)
        const totalSalones = getTotalSalonesGrado(grado)
        const secciones = Object.keys(groupedSalones[grado]).sort()

        return (
          <div key={grado} className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header del Grado */}
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleGrado(grado)}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      isExpanded ? 'rotate-90' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Grado {grado}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {totalSalones} {totalSalones === 1 ? 'salón' : 'salones'} • {totalEstudiantes} estudiantes
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {secciones.length} {secciones.length === 1 ? 'sección' : 'secciones'}
                </span>
              </div>
            </div>

            {/* Contenido expandible */}
            {isExpanded && (
              <div className="border-t border-gray-200">
                {secciones.map((seccion) => {
                  const salonesSeccion = groupedSalones[grado][seccion]
                  const estudiantesSeccion = salonesSeccion.reduce(
                    (total, salon) => total + salon.cantidadEstudiantes,
                    0
                  )

                  return (
                    <div key={seccion} className="p-4 border-b border-gray-100 last:border-b-0">
                      {/* Header de la Sección */}
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-md font-medium text-gray-800">
                          Sección {seccion}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {estudiantesSeccion} estudiantes
                        </span>
                      </div>

                      {/* Salones de la sección */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {salonesSeccion.map((salon) => (
                          <div
                            key={salon.id}
                            className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900">
                                  {salon.nombre}
                                </h5>
                                <p className="text-sm text-gray-600">
                                  {salon.nivel}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {salon.cantidadEstudiantes}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  estudiantes
                                </p>
                              </div>
                            </div>
                            
                            {/* Docente asignado */}
                            <div className="mb-2 pb-2 border-b border-gray-200">
                              <p className="text-xs text-gray-500">Docente:</p>
                              <p className="text-sm font-medium text-gray-700">
                                {salon.docente || 'Sin asignar'}
                              </p>
                            </div>
                            
                            {/* Acciones */}
                            <div className="flex justify-end space-x-2 mt-3 pt-2 border-t border-gray-200">
                              <button 
                                onClick={() => onView?.(salon.id)}
                                className="text-xs text-indigo-600 hover:text-indigo-900"
                              >
                                Ver
                              </button>
                              <button 
                                onClick={() => onEdit?.(salon.id)}
                                className="text-xs text-green-600 hover:text-green-900"
                              >
                                Editar
                              </button>
                              <button 
                                onClick={() => onDelete?.(salon.id)}
                                className="text-xs text-red-600 hover:text-red-900"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
