'use client'

import { useState } from 'react'
import { Salon } from '@/hooks/useSalones'
import { useSalonDetails } from '@/hooks/useSalonDetails'

interface SalonesFilteredViewProps {
  salones: Salon[]
  loading: boolean
  selectedGrado: string | null
  selectedSeccion: string | null
}

export default function SalonesFilteredView({ 
  salones, 
  loading, 
  selectedGrado, 
  selectedSeccion
}: SalonesFilteredViewProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Filtrar salones según la selección
  const filteredSalones = salones.filter(salon => {
    if (selectedGrado && salon.grado !== selectedGrado) return false
    if (selectedSeccion && salon.seccion !== selectedSeccion) return false
    return true
  })

  if (filteredSalones.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-6 4h6" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay salones</h3>
        <p className="mt-1 text-sm text-gray-500">
          {selectedGrado || selectedSeccion 
            ? 'No se encontraron salones para la selección actual.'
            : 'No hay salones disponibles.'
          }
        </p>
      </div>
    )
  }

  const getTitle = () => {
    if (selectedGrado && selectedSeccion) {
      return `${selectedGrado}° Grado - Sección ${selectedSeccion}`
    } else if (selectedGrado) {
      return `${selectedGrado}° Grado`
    } else {
      return 'Todos los Salones'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header con información */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {getTitle()}
        </h2>
        <div className="flex items-center space-x-6 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-6 4h6" />
            </svg>
            <span>{filteredSalones.length} {filteredSalones.length === 1 ? 'salón' : 'salones'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <span>
              {filteredSalones.reduce((total, salon) => total + salon.cantidadEstudiantes, 0)} estudiantes
            </span>
          </div>
        </div>
      </div>

      {/* Mostrar tablas para cada salón */}
      <div className="space-y-8">
        {filteredSalones.map((salon) => (
          <SalonTablesView key={salon.id} salon={salon} />
        ))}
      </div>
    </div>
  )
}

// Componente para mostrar las tablas de estudiantes y docentes de un salón
function SalonTablesView({ salon }: { salon: Salon }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { 
    estudiantes, 
    docentes, 
    loadingEstudiantes, 
    loadingDocentes, 
    errorEstudiantes, 
    errorDocentes 
  } = useSalonDetails(isExpanded ? parseInt(salon.id) : null)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header del salón - siempre visible */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {salon.nombre}
          </h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>{salon.nivel}</span>
              <span>•</span>
              <span>{salon.cantidadEstudiantes} estudiantes</span>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
            >
              <span>{isExpanded ? 'Ocultar detalles' : 'Ver detalles'}</span>
              <svg 
                className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Contenido expandible */}
      {isExpanded && (
        <>
          {(loadingEstudiantes || loadingDocentes) && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {(errorEstudiantes || errorDocentes) && (
            <div className="text-center py-8">
              <div className="text-red-600 mb-2">Error al cargar los datos</div>
              <div className="text-sm text-gray-500">{errorEstudiantes || errorDocentes}</div>
            </div>
          )}

          {!loadingEstudiantes && !loadingDocentes && !errorEstudiantes && !errorDocentes && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Tabla de Docentes */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Docentes Asignados ({docentes.length})
                  </h4>
                  
                  {docentes.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <p className="text-sm">No hay docentes asignados</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Docente
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Especialidad
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tipo
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {docentes.map((docente) => (
                            <tr key={docente.id} className="hover:bg-gray-50">
                              <td className="px-3 py-2 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {docente.nombres} {docente.apellidos}
                                  </div>
                                  <div className="text-sm text-gray-500">DNI: {docente.dni}</div>
                                </div>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                {docente.especialidad || 'No especificada'}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {docente.tipoAsignacion || 'Docente'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Tabla de Estudiantes */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    Estudiantes Matriculados ({estudiantes.length})
                  </h4>
                  
                  {estudiantes.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      <p className="text-sm">No hay estudiantes matriculados</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Estudiante
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Fecha Nac.
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              QR
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {estudiantes.map((estudiante) => (
                            <tr key={estudiante.id} className="hover:bg-gray-50">
                              <td className="px-3 py-2 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {estudiante.nombres} {estudiante.apellidos}
                                  </div>
                                  <div className="text-sm text-gray-500">DNI: {estudiante.dni}</div>
                                </div>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                {estudiante.fechaNacimiento 
                                  ? new Date(estudiante.fechaNacimiento).toLocaleDateString('es-PE')
                                  : 'No registrada'
                                }
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                                  {estudiante.qr ? estudiante.qr.substring(0, 8) + '...' : 'Sin QR'}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
