'use client'

import { useState, useEffect } from 'react'

interface Estudiante {
  id: number
  nombres: string
  apellidos: string
  dni: string
  fechaNacimiento?: string
  codigoQR?: string
}

interface ViewSalonModalProps {
  isOpen: boolean
  onClose: () => void
  salonId: string
}

export default function ViewSalonModal({ isOpen, onClose, salonId }: ViewSalonModalProps) {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [loading, setLoading] = useState(true)
  const [salonInfo, setSalonInfo] = useState<any>(null)

  useEffect(() => {
    if (isOpen && salonId) {
      loadSalonData()
    }
  }, [isOpen, salonId])

  const loadSalonData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/salones/${salonId}/estudiantes`)
      if (response.ok) {
        const data = await response.json()
        setEstudiantes(data.estudiantes || [])
        setSalonInfo(data.salon)
      }
    } catch (error) {
      console.error('Error loading salon data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Detalles del Salón</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Información del Salón */}
            {salonInfo && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {salonInfo.nivel} - {salonInfo.grado}° Grado - Sección {salonInfo.seccion}
                </h3>
                <p className="text-sm text-gray-600">
                  Total de estudiantes: {estudiantes.length}
                </p>
              </div>
            )}

            {/* Lista de Estudiantes */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Estudiantes Asignados
              </h3>
              
              {estudiantes.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No hay estudiantes asignados a este salón</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estudiante
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          DNI
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Código QR
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha Nacimiento
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {estudiantes.map((estudiante, index) => (
                        <tr key={estudiante.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {estudiante.apellidos}, {estudiante.nombres}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {estudiante.dni}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {estudiante.codigoQR ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 font-mono">
                                {estudiante.codigoQR}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">Sin código</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {estudiante.fechaNacimiento 
                              ? new Date(estudiante.fechaNacimiento).toLocaleDateString()
                              : 'No registrada'
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
