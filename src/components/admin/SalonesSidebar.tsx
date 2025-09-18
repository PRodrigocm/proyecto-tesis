'use client'

import { Salon } from '@/hooks/useSalones'
import { useState } from 'react'

interface SalonesSidebarProps {
  salones: Salon[]
  onGradoSelect: (grado: string | null) => void
  onSeccionSelect: (grado: string, seccion: string) => void
  selectedGrado: string | null
  selectedSeccion: string | null
}

interface GroupedSalones {
  [grado: string]: {
    [seccion: string]: Salon[]
  }
}

export default function SalonesSidebar({ 
  salones, 
  onGradoSelect, 
  onSeccionSelect, 
  selectedGrado, 
  selectedSeccion 
}: SalonesSidebarProps) {
  const [expandedGrados, setExpandedGrados] = useState<Set<string>>(new Set())

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

  const getTotalEstudiantesSeccion = (grado: string, seccion: string) => {
    return groupedSalones[grado][seccion].reduce(
      (total, salon) => total + salon.cantidadEstudiantes, 
      0
    )
  }

  const handleGradoClick = (grado: string) => {
    toggleGrado(grado)
    if (selectedGrado === grado) {
      onGradoSelect(null)
    } else {
      onGradoSelect(grado)
    }
  }

  const handleSeccionClick = (grado: string, seccion: string) => {
    onSeccionSelect(grado, seccion)
  }

  const handleShowAll = () => {
    onGradoSelect(null)
    setExpandedGrados(new Set())
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Navegación</h3>
        <p className="text-sm text-gray-600 mt-1">Grados y Secciones</p>
      </div>

      <div className="p-4">
        {/* Botón para mostrar todos */}
        <button
          onClick={handleShowAll}
          className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors mb-3 ${
            selectedGrado === null
              ? 'bg-blue-100 text-blue-800 border border-blue-200'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <span>📚 Todos los Salones</span>
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
              {salones.length}
            </span>
          </div>
        </button>

        {/* Lista de grados */}
        <div className="space-y-1">
          {sortedGrados.map((grado) => {
            const isExpanded = expandedGrados.has(grado)
            const isSelected = selectedGrado === grado
            const totalEstudiantes = getTotalEstudiantesGrado(grado)
            const secciones = Object.keys(groupedSalones[grado]).sort()

            return (
              <div key={grado} className="space-y-1">
                {/* Header del Grado */}
                <button
                  onClick={() => handleGradoClick(grado)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <svg
                        className={`w-4 h-4 transition-transform ${
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
                      <span>Grado {grado}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                        {totalEstudiantes}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Secciones expandibles */}
                {isExpanded && (
                  <div className="ml-6 space-y-1">
                    {secciones.map((seccion) => {
                      const estudiantesSeccion = getTotalEstudiantesSeccion(grado, seccion)
                      const isSeccionSelected = selectedGrado === grado && selectedSeccion === seccion
                      const salonesCount = groupedSalones[grado][seccion].length

                      return (
                        <button
                          key={seccion}
                          onClick={() => handleSeccionClick(grado, seccion)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                            isSeccionSelected
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="w-2 h-2 bg-current rounded-full opacity-50"></span>
                              <span>Sección {seccion}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                                {salonesCount}
                              </span>
                              <span className="text-xs text-gray-500">
                                {estudiantesSeccion}
                              </span>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Estadísticas */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>Total Grados:</span>
              <span className="font-medium">{sortedGrados.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Salones:</span>
              <span className="font-medium">{salones.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Estudiantes:</span>
              <span className="font-medium">
                {salones.reduce((total, salon) => total + salon.cantidadEstudiantes, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
