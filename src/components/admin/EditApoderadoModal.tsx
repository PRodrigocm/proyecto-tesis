'use client'

import { useState, useEffect } from 'react'
import { Apoderado } from '@/hooks/useApoderados'

interface Estudiante {
  id: string
  nombre: string
  apellido: string
  dni: string
  grado: string
  seccion: string
  estado: 'ACTIVO' | 'INACTIVO' | 'RETIRADO'
}

interface EditApoderadoModalProps {
  apoderado: Apoderado | null
  isOpen: boolean
  onClose: () => void
  onSave: (apoderadoData: any) => Promise<void>
}

export default function EditApoderadoModal({ 
  apoderado, 
  isOpen, 
  onClose, 
  onSave 
}: EditApoderadoModalProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    dni: '',
    direccion: '',
    estado: 'ACTIVO' as 'ACTIVO' | 'INACTIVO'
  })
  
  const [selectedEstudiantes, setSelectedEstudiantes] = useState<string[]>([])
  const [estudiantesRelaciones, setEstudiantesRelaciones] = useState<{[key: string]: string}>({})
  const [availableEstudiantes, setAvailableEstudiantes] = useState<Estudiante[]>([])
  const [filteredEstudiantes, setFilteredEstudiantes] = useState<Estudiante[]>([])
  const [searchEstudiantes, setSearchEstudiantes] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingEstudiantes, setLoadingEstudiantes] = useState(false)

  // Reset form when modal opens/closes or apoderado changes
  useEffect(() => {
    if (apoderado && isOpen) {
      setFormData({
        nombre: apoderado.nombre || '',
        apellido: apoderado.apellido || '',
        email: apoderado.email || '',
        telefono: apoderado.telefono || '',
        dni: apoderado.dni || '',
        direccion: apoderado.direccion || '',
        estado: apoderado.estado || 'ACTIVO'
      })
      
      // Set currently assigned students
      const estudiantesIds = apoderado.estudiantes?.map(e => e.id) || []
      setSelectedEstudiantes(estudiantesIds)
      
      // Set relationships from existing data
      const relacionesIniciales: {[key: string]: string} = {}
      apoderado.estudiantes?.forEach(estudiante => {
        relacionesIniciales[estudiante.id] = estudiante.relacion || 'Padre/Madre'
      })
      setEstudiantesRelaciones(relacionesIniciales)
      
      // Load available students
      loadAvailableEstudiantes()
    }
  }, [apoderado, isOpen])

  const loadAvailableEstudiantes = async () => {
    setLoadingEstudiantes(true)
    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) return
      
      const user = JSON.parse(userStr)
      const ieId = user.idIe
      
      if (!ieId) return

      const response = await fetch(`/api/estudiantes?ieId=${ieId}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableEstudiantes(data.data || [])
        setFilteredEstudiantes(data.data || [])
      }
    } catch (error) {
      console.error('Error loading estudiantes:', error)
    } finally {
      setLoadingEstudiantes(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Filter students based on search term
  useEffect(() => {
    if (!searchEstudiantes.trim()) {
      setFilteredEstudiantes(availableEstudiantes)
    } else {
      const filtered = availableEstudiantes.filter(estudiante =>
        estudiante.nombre.toLowerCase().includes(searchEstudiantes.toLowerCase()) ||
        estudiante.apellido.toLowerCase().includes(searchEstudiantes.toLowerCase()) ||
        estudiante.dni.includes(searchEstudiantes) ||
        `${estudiante.grado}° ${estudiante.seccion}`.toLowerCase().includes(searchEstudiantes.toLowerCase())
      )
      setFilteredEstudiantes(filtered)
    }
  }, [searchEstudiantes, availableEstudiantes])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchEstudiantes(e.target.value)
  }

  const handleEstudianteToggle = (estudianteId: string) => {
    setSelectedEstudiantes(prev => {
      if (prev.includes(estudianteId)) {
        // Remove student and their relationship
        setEstudiantesRelaciones(prevRel => {
          const newRel = { ...prevRel }
          delete newRel[estudianteId]
          return newRel
        })
        return prev.filter(id => id !== estudianteId)
      } else {
        // Add student with default relationship
        setEstudiantesRelaciones(prevRel => ({
          ...prevRel,
          [estudianteId]: 'Padre/Madre'
        }))
        return [...prev, estudianteId]
      }
    })
  }

  const handleRelacionChange = (estudianteId: string, relacion: string) => {
    setEstudiantesRelaciones(prev => ({
      ...prev,
      [estudianteId]: relacion
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!apoderado) return

    setLoading(true)
    try {
      await onSave({
        ...formData,
        id: apoderado.id,
        estudiantesIds: selectedEstudiantes,
        estudiantesRelaciones: estudiantesRelaciones
      })
      onClose()
    } catch (error) {
      console.error('Error saving apoderado:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !apoderado) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Editar Apoderado
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información Personal */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Información Personal</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido *
                </label>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DNI *
                </label>
                <input
                  type="text"
                  name="dni"
                  value={formData.dni}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>

            </div>

            {/* Asignación de Estudiantes */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Estudiantes Asignados</h3>
              
              {/* Campo de búsqueda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar Estudiantes
                </label>
                <input
                  type="text"
                  value={searchEstudiantes}
                  onChange={handleSearchChange}
                  placeholder="Buscar por nombre, apellido, DNI o grado..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>
              
              {loadingEstudiantes ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
                  {filteredEstudiantes.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      {searchEstudiantes ? 'No se encontraron estudiantes con ese criterio' : 'No hay estudiantes disponibles'}
                    </div>
                  ) : (
                    <div className="space-y-1 p-2">
                      {filteredEstudiantes
                        .filter(estudiante => estudiante.estado === 'ACTIVO')
                        .map((estudiante) => (
                        <div key={estudiante.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                          <input
                            type="checkbox"
                            id={`estudiante-${estudiante.id}`}
                            checked={selectedEstudiantes.includes(estudiante.id)}
                            onChange={() => handleEstudianteToggle(estudiante.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`estudiante-${estudiante.id}`} className="flex-1 cursor-pointer">
                            <div className="text-sm font-medium text-gray-900">
                              {estudiante.nombre} {estudiante.apellido}
                            </div>
                            <div className="text-sm text-gray-500">
                              DNI: {estudiante.dni} | {estudiante.grado}° {estudiante.seccion}
                            </div>
                          </label>
                          {selectedEstudiantes.includes(estudiante.id) && (
                            <select
                              value={estudiantesRelaciones[estudiante.id] || 'Padre/Madre'}
                              onChange={(e) => handleRelacionChange(estudiante.id, e.target.value)}
                              className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="Padre/Madre">Padre/Madre</option>
                              <option value="Padre">Padre</option>
                              <option value="Madre">Madre</option>
                              <option value="Apoderado">Apoderado</option>
                              <option value="Tutor">Tutor</option>
                              <option value="Familiar">Familiar</option>
                            </select>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div className="text-sm text-gray-600">
                {selectedEstudiantes.length} estudiante(s) seleccionado(s)
                {searchEstudiantes && (
                  <span className="ml-2 text-blue-600">
                    ({filteredEstudiantes.filter(e => e.estado === 'ACTIVO').length} mostrados)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
