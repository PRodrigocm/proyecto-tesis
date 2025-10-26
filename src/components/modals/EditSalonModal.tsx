'use client'

import { useState, useEffect } from 'react'

interface Estudiante {
  id: number
  nombres: string
  apellidos: string
  dni: string
  grado: string
  seccion: string
  codigoQR?: string
}

interface EditSalonModalProps {
  isOpen: boolean
  onClose: () => void
  salonId: string
  onSave: () => void
}

export default function EditSalonModal({ isOpen, onClose, salonId, onSave }: EditSalonModalProps) {
  const [estudiantesEnAula, setEstudiantesEnAula] = useState<Estudiante[]>([])
  const [estudiantesDisponibles, setEstudiantesDisponibles] = useState<Estudiante[]>([])
  const [filteredDisponibles, setFilteredDisponibles] = useState<Estudiante[]>([])
  const [searchDisponibles, setSearchDisponibles] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedToAdd, setSelectedToAdd] = useState<Set<number>>(new Set())
  const [selectedToRemove, setSelectedToRemove] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (isOpen && salonId) {
      loadData()
    }
  }, [isOpen, salonId])

  useEffect(() => {
    // Filtrar estudiantes disponibles
    const filtered = estudiantesDisponibles.filter(est => {
      const searchLower = searchDisponibles.toLowerCase()
      return (
        est.nombres.toLowerCase().includes(searchLower) ||
        est.apellidos.toLowerCase().includes(searchLower) ||
        est.dni.includes(searchDisponibles)
      )
    })
    setFilteredDisponibles(filtered)
  }, [searchDisponibles, estudiantesDisponibles])

  const loadData = async () => {
    setLoading(true)
    try {
      // Obtener estudiantes del salón
      const salonResponse = await fetch(`/api/salones/${salonId}/estudiantes`)
      let estudiantesActuales: Estudiante[] = []
      
      if (salonResponse.ok) {
        const salonData = await salonResponse.json()
        estudiantesActuales = salonData.estudiantes || []
        setEstudiantesEnAula(estudiantesActuales)
      }

      // Obtener todos los estudiantes
      const userStr = localStorage.getItem('user')
      const user = userStr ? JSON.parse(userStr) : null
      const ieId = user?.idIe || user?.institucionId || 1

      const todosResponse = await fetch(`/api/estudiantes?ieId=${ieId}`)
      if (todosResponse.ok) {
        const todosData = await todosResponse.json()
        const todosEstudiantes = todosData.data || []
        
        // Filtrar estudiantes que NO están en el aula
        const estudiantesEnAulaIds = new Set(estudiantesActuales.map((e: Estudiante) => e.id))
        const disponibles = todosEstudiantes
          .filter((e: any) => !estudiantesEnAulaIds.has(parseInt(e.id)))
          .map((e: any) => ({
            id: parseInt(e.id),
            nombres: e.nombre || '',
            apellidos: e.apellido || '',
            dni: e.dni,
            grado: e.grado || '',
            seccion: e.seccion || '',
            codigoQR: e.codigoQR
          }))
        setEstudiantesDisponibles(disponibles)
        setFilteredDisponibles(disponibles)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAdd = (id: number) => {
    const newSelected = new Set(selectedToAdd)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedToAdd(newSelected)
  }

  const handleToggleRemove = (id: number) => {
    const newSelected = new Set(selectedToRemove)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedToRemove(newSelected)
  }

  const handleAddSelected = () => {
    const toAdd = estudiantesDisponibles.filter(e => selectedToAdd.has(e.id))
    setEstudiantesEnAula([...estudiantesEnAula, ...toAdd])
    setEstudiantesDisponibles(estudiantesDisponibles.filter(e => !selectedToAdd.has(e.id)))
    setSelectedToAdd(new Set())
  }

  const handleRemoveSelected = () => {
    const toRemove = estudiantesEnAula.filter(e => selectedToRemove.has(e.id))
    setEstudiantesDisponibles([...estudiantesDisponibles, ...toRemove])
    setEstudiantesEnAula(estudiantesEnAula.filter(e => !selectedToRemove.has(e.id)))
    setSelectedToRemove(new Set())
  }

  const handleSave = async () => {
    // Validación: Confirmar si hay cambios pendientes
    if (selectedToAdd.size > 0 || selectedToRemove.size > 0) {
      const confirmMessage = `Tienes estudiantes seleccionados sin mover. ¿Deseas continuar sin aplicar estos cambios?`
      if (!confirm(confirmMessage)) {
        return
      }
    }

    // Validación: Confirmar guardado
    const confirmSave = confirm(
      `¿Estás seguro de guardar los cambios?\n\nEstudiantes en el aula: ${estudiantesEnAula.length}`
    )
    
    if (!confirmSave) {
      return
    }

    try {
      setLoading(true)
      
      const estudiantesIds = estudiantesEnAula.map(e => e.id)
      
      console.log('📤 Enviando actualización:', {
        salonId,
        totalEstudiantes: estudiantesIds.length,
        estudiantesIds
      })
      
      const response = await fetch(`/api/salones/${salonId}/estudiantes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estudiantesIds })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Cambios guardados:', data)
        alert(`✅ Cambios guardados exitosamente\n\nTotal de estudiantes en el salón: ${data.totalEstudiantes}`)
        onSave()
        onClose()
      } else {
        const error = await response.json()
        console.error('❌ Error al guardar:', error)
        alert(`❌ Error al guardar: ${error.error || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('❌ Error:', error)
      alert('❌ Error al guardar los cambios. Por favor, intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Editar Estudiantes del Salón</h2>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tabla: Estudiantes en el Aula */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Estudiantes en el Aula ({estudiantesEnAula.length})
                </h3>
                {selectedToRemove.size > 0 && (
                  <button
                    onClick={handleRemoveSelected}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Quitar ({selectedToRemove.size})
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {estudiantesEnAula.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay estudiantes en el aula
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedToRemove(new Set(estudiantesEnAula.map(e => e.id)))
                              } else {
                                setSelectedToRemove(new Set())
                              }
                            }}
                            className="rounded"
                          />
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                          Estudiante
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                          DNI
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {estudiantesEnAula.map((estudiante) => (
                        <tr key={estudiante.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={selectedToRemove.has(estudiante.id)}
                              onChange={() => handleToggleRemove(estudiante.id)}
                              className="rounded"
                            />
                          </td>
                          <td className="px-3 py-2 text-sm font-medium text-gray-900">
                            {estudiante.apellidos}, {estudiante.nombres}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {estudiante.dni}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Tabla: Estudiantes Disponibles */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Estudiantes Disponibles ({filteredDisponibles.length})
                </h3>
                {selectedToAdd.size > 0 && (
                  <button
                    onClick={handleAddSelected}
                    className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Agregar ({selectedToAdd.size})
                  </button>
                )}
              </div>

              {/* Buscador */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Buscar por nombre, apellido o DNI..."
                  value={searchDisponibles}
                  onChange={(e) => setSearchDisponibles(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              <div className="max-h-96 overflow-y-auto">
                {filteredDisponibles.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchDisponibles ? 'No se encontraron estudiantes' : 'No hay estudiantes disponibles'}
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedToAdd(new Set(filteredDisponibles.map(e => e.id)))
                              } else {
                                setSelectedToAdd(new Set())
                              }
                            }}
                            className="rounded"
                          />
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                          Estudiante
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                          DNI
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                          Grado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredDisponibles.map((estudiante) => (
                        <tr key={estudiante.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={selectedToAdd.has(estudiante.id)}
                              onChange={() => handleToggleAdd(estudiante.id)}
                              className="rounded"
                            />
                          </td>
                          <td className="px-3 py-2 text-sm font-medium text-gray-900">
                            {estudiante.apellidos}, {estudiante.nombres}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {estudiante.dni}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {estudiante.grado}° {estudiante.seccion}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  )
}
