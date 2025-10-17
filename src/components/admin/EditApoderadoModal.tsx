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
  const [estudiantesTitulares, setEstudiantesTitulares] = useState<{[key: string]: boolean}>({})
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
      
      // Set currently assigned students - eliminar duplicados desde el inicio
      const estudiantesIds = apoderado.estudiantes?.map(e => e.id) || []
      const uniqueEstudiantesIds = [...new Set(estudiantesIds)]
      console.log('Estudiantes asignados al apoderado (original):', estudiantesIds)
      console.log('Estudiantes asignados al apoderado (únicos):', uniqueEstudiantesIds)
      console.log('Datos completos de estudiantes:', apoderado.estudiantes)
      setSelectedEstudiantes(uniqueEstudiantesIds)
      
      // Set relationships from existing data
      const relacionesIniciales: {[key: string]: string} = {}
      const titularesIniciales: {[key: string]: boolean} = {}
      apoderado.estudiantes?.forEach(estudiante => {
        relacionesIniciales[estudiante.id] = estudiante.relacion || 'Padre/Madre'
        titularesIniciales[estudiante.id] = estudiante.esTitular || false
      })
      setEstudiantesRelaciones(relacionesIniciales)
      setEstudiantesTitulares(titularesIniciales)
      
      console.log('Estado inicial selectedEstudiantes:', uniqueEstudiantesIds)
      console.log('Estado inicial relaciones:', relacionesIniciales)
      console.log('Estado inicial titulares:', titularesIniciales)
      
      // Load available students
      loadAvailableEstudiantes()
    }
  }, [apoderado, isOpen])

  const loadAvailableEstudiantes = async () => {
    setLoadingEstudiantes(true)
    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        console.log('No user data found in localStorage')
        return
      }
      
      const user = JSON.parse(userStr)
      // Intentar diferentes campos posibles para ieId (mismo patrón que en estudiantes page)
      const ieId = user.idIe || user.institucionId || 1
      
      console.log('User object:', user)
      console.log('Using ieId:', ieId)

      console.log('Loading estudiantes for ieId:', ieId)
      const response = await fetch(`/api/estudiantes?ieId=${ieId}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Estudiantes loaded:', data)
        console.log('IDs de estudiantes disponibles:', data.data?.map((e: any) => e.id))
        console.log('Comparación con selectedEstudiantes:', selectedEstudiantes)
        setAvailableEstudiantes(data.data || [])
        setFilteredEstudiantes(data.data || [])
      } else {
        console.error('Error response from API:', response.status, response.statusText)
        const errorData = await response.text()
        console.error('Error details:', errorData)
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
    console.log('Toggle estudiante:', estudianteId)
    console.log('Estado actual selectedEstudiantes:', selectedEstudiantes)
    
    setSelectedEstudiantes(prev => {
      // Asegurar que prev no tenga duplicados antes de procesar
      const uniquePrev = [...new Set(prev)]
      
      if (uniquePrev.includes(estudianteId)) {
        // Remove student and their relationship and titular status
        console.log('Removiendo estudiante:', estudianteId)
        setEstudiantesRelaciones(prevRel => {
          const newRel = { ...prevRel }
          delete newRel[estudianteId]
          return newRel
        })
        setEstudiantesTitulares(prevTit => {
          const newTit = { ...prevTit }
          delete newTit[estudianteId]
          return newTit
        })
        const newSelected = uniquePrev.filter(id => id !== estudianteId)
        console.log('Nuevo estado después de remover:', newSelected)
        return newSelected
      } else {
        // Add student with default relationship and titular status
        console.log('Agregando estudiante:', estudianteId)
        setEstudiantesRelaciones(prevRel => ({
          ...prevRel,
          [estudianteId]: 'Padre/Madre'
        }))
        setEstudiantesTitulares(prevTit => ({
          ...prevTit,
          [estudianteId]: true
        }))
        const newSelected = [...uniquePrev, estudianteId]
        console.log('Nuevo estado después de agregar:', newSelected)
        return newSelected
      }
    })
  }

  const handleRelacionChange = (estudianteId: string, relacion: string) => {
    setEstudiantesRelaciones(prev => ({
      ...prev,
      [estudianteId]: relacion
    }))
  }

  const handleTitularChange = (estudianteId: string, esTitular: boolean) => {
    setEstudiantesTitulares(prev => ({
      ...prev,
      [estudianteId]: esTitular
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!apoderado) return

    setLoading(true)
    try {
      // Eliminar duplicados y asegurar que todos los IDs sean strings
      const uniqueEstudiantesIds = [...new Set(selectedEstudiantes)].map(id => id.toString())
      
      console.log('Estudiantes seleccionados (únicos):', uniqueEstudiantesIds)
      console.log('Relaciones:', estudiantesRelaciones)
      console.log('Titulares:', estudiantesTitulares)
      
      await onSave({
        ...formData,
        id: apoderado.id,
        estudiantesIds: uniqueEstudiantesIds,
        estudiantesRelaciones: estudiantesRelaciones,
        estudiantesTitulares: estudiantesTitulares
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Buscar Estudiantes
                  </label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={loadAvailableEstudiantes}
                      disabled={loadingEstudiantes}
                      className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                    >
                      {loadingEstudiantes ? 'Cargando...' : '🔄 Recargar'}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const userStr = localStorage.getItem('user')
                        const user = userStr ? JSON.parse(userStr) : null
                        console.log('User data:', user)
                        
                        // Intentar diferentes campos posibles para ieId (mismo patrón que en estudiantes page)
                        const ieId = user?.idIe || user?.institucionId || 1
                        
                        console.log('Using ieId:', ieId)
                        
                        try {
                          const response = await fetch(`/api/estudiantes?ieId=${ieId}`)
                          const data = await response.json()
                          console.log('Direct API test:', { status: response.status, data })
                          alert(`API Response: ${response.status} - Total estudiantes: ${data.total || 0}\n\nPrimeros estudiantes: ${JSON.stringify(data.data?.slice(0, 2), null, 2)}`)
                        } catch (error) {
                          console.error('Direct API test error:', error)
                          alert(`Error: ${error}`)
                        }
                      }}
                      className="text-xs text-green-600 hover:text-green-800"
                    >
                      🧪 Test API
                    </button>
                  </div>
                </div>
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
                      <div>
                        {searchEstudiantes ? 'No se encontraron estudiantes con ese criterio' : 'No hay estudiantes disponibles'}
                      </div>
                      <div className="text-xs mt-2 text-gray-400">
                        Total disponibles: {availableEstudiantes.length} | 
                        Filtrados: {filteredEstudiantes.length} |
                        Cargando: {loadingEstudiantes ? 'Sí' : 'No'}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 p-2">
                      {filteredEstudiantes.map((estudiante) => {
                        const isSelected = selectedEstudiantes.includes(estudiante.id)
                        console.log(`Estudiante ${estudiante.id} (${estudiante.nombre}): selected=${isSelected}, selectedArray=${JSON.stringify(selectedEstudiantes)}`)
                        
                        return (
                        <div key={estudiante.id} className={`flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 ${
                          estudiante.estado !== 'ACTIVO' ? 'opacity-60 bg-gray-50' : ''
                        }`}>
                          <input
                            type="checkbox"
                            id={`estudiante-${estudiante.id}`}
                            checked={isSelected}
                            onChange={() => handleEstudianteToggle(estudiante.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            disabled={estudiante.estado !== 'ACTIVO' && !isSelected}
                          />
                          <label htmlFor={`estudiante-${estudiante.id}`} className="flex-1 cursor-pointer">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">
                                {estudiante.nombre} {estudiante.apellido}
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                estudiante.estado === 'ACTIVO' 
                                  ? 'bg-green-100 text-green-800' 
                                  : estudiante.estado === 'INACTIVO'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {estudiante.estado}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              DNI: {estudiante.dni} | {estudiante.grado}° {estudiante.seccion}
                            </div>
                          </label>
                          {selectedEstudiantes.includes(estudiante.id) && (
                            <div className="flex items-center space-x-2">
                              <select
                                value={estudiantesRelaciones[estudiante.id] || 'Padre/Madre'}
                                onChange={(e) => handleRelacionChange(estudiante.id, e.target.value)}
                                className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                              >
                                <option value="Padre/Madre">Padre/Madre</option>
                                <option value="Padre">Padre</option>
                                <option value="Madre">Madre</option>
                                <option value="Apoderado">Apoderado</option>
                                <option value="Tutor">Tutor</option>
                                <option value="Familiar">Familiar</option>
                              </select>
                              <label className="flex items-center space-x-1 text-sm">
                                <input
                                  type="checkbox"
                                  checked={estudiantesTitulares[estudiante.id] || false}
                                  onChange={(e) => handleTitularChange(estudiante.id, e.target.checked)}
                                  className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="text-gray-700">Titular</span>
                              </label>
                            </div>
                          )}
                        </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
              
              <div className="text-sm text-gray-600">
                {selectedEstudiantes.length} estudiante(s) seleccionado(s)
                {searchEstudiantes && (
                  <span className="ml-2 text-blue-600">
                    ({filteredEstudiantes.length} mostrados)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Botones de prueba temporal */}
          <div className="flex justify-center gap-2 mt-4">
            <button
              type="button"
              onClick={async () => {
                if (apoderado) {
                  console.log('Testing GET API route for ID:', apoderado.id)
                  try {
                    const response = await fetch(`/api/apoderados/${apoderado.id}`, {
                      method: 'GET'
                    })
                    console.log('Test GET Response status:', response.status)
                    const data = await response.json()
                    console.log('Test GET Response data:', data)
                    alert(`GET Test: ${response.status} - ${JSON.stringify(data)}`)
                  } catch (error) {
                    console.error('Test GET Error:', error)
                    alert(`GET Test Error: ${error}`)
                  }
                }
              }}
              className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              🧪 Test GET
            </button>
            
            <button
              type="button"
              onClick={async () => {
                if (apoderado) {
                  console.log('Testing PUT API route for ID:', apoderado.id)
                  try {
                    const testData = {
                      id: apoderado.id,
                      test: true,
                      timestamp: new Date().toISOString()
                    }
                    const response = await fetch(`/api/apoderados/${apoderado.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(testData)
                    })
                    console.log('Test PUT Response status:', response.status)
                    const data = await response.json()
                    console.log('Test PUT Response data:', data)
                    alert(`PUT Test: ${response.status} - ${JSON.stringify(data)}`)
                  } catch (error) {
                    console.error('Test PUT Error:', error)
                    alert(`PUT Test Error: ${error}`)
                  }
                }
              }}
              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              🧪 Test PUT
            </button>
            
            <button
              type="button"
              onClick={async () => {
                console.log('Verificando apoderados existentes')
                console.log('Apoderado actual en modal:', apoderado)
                try {
                  const response = await fetch('/api/apoderados', {
                    method: 'GET'
                  })
                  console.log('Apoderados Response status:', response.status)
                  const data = await response.json()
                  console.log('Apoderados disponibles completos:', data.data)
                  console.log('IDs de apoderados:', data.data?.map((a: any) => ({ id: a.id, nombre: a.nombre, apellido: a.apellido })))
                  alert(`Apoderado actual: ID="${apoderado?.id}"\n\nApoderados en BD: ${JSON.stringify(data.data?.map((a: any) => ({ id: a.id, nombre: a.nombre })), null, 2)}`)
                } catch (error) {
                  console.error('Error verificando apoderados:', error)
                  alert(`Error: ${error}`)
                }
              }}
              className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
            >
              🔍 Ver Apoderados BD
            </button>
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
