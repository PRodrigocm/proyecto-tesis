'use client'

import { useState, useEffect } from 'react'
import { Apoderado } from '@/hooks/useApoderados'
import { Modal, ModalHeader, ModalBody, ModalFooter, FormSection } from '@/components/ui'

// Iconos
const EditIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
)

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

  // Estilos reutilizables
  const inputClass = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 placeholder-slate-400 transition-all"
  const labelClass = "block text-sm font-medium text-slate-700 mb-1.5"

  if (!isOpen || !apoderado) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalHeader 
        icon={<EditIcon />} 
        subtitle={`${apoderado.nombre} ${apoderado.apellido}`}
        variant="purple"
        onClose={onClose}
      >
        Editar Apoderado
      </ModalHeader>

      <ModalBody>
        <form onSubmit={handleSubmit} id="edit-apoderado-form" className="space-y-6">
          {/* Información Personal */}
          <FormSection number={1} title="Información Personal">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Nombre <span className="text-red-500">*</span></label>
                <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} required className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Apellido <span className="text-red-500">*</span></label>
                <input type="text" name="apellido" value={formData.apellido} onChange={handleInputChange} required className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>DNI <span className="text-red-500">*</span></label>
                <input type="text" name="dni" value={formData.dni} onChange={handleInputChange} required className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Email <span className="text-red-500">*</span></label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Teléfono <span className="text-red-500">*</span></label>
                <input type="tel" name="telefono" value={formData.telefono} onChange={handleInputChange} required className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Dirección</label>
                <input type="text" name="direccion" value={formData.direccion} onChange={handleInputChange} className={inputClass} />
              </div>
            </div>
          </FormSection>

          {/* Asignación de Estudiantes */}
          <FormSection number={2} title="Estudiantes Asignados">
            <div className="space-y-4">
              {/* Campo de búsqueda */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><SearchIcon /></div>
                <input
                  type="text"
                  value={searchEstudiantes}
                  onChange={handleSearchChange}
                  placeholder="Buscar por nombre, DNI o grado..."
                  className={`${inputClass} pl-10`}
                />
              </div>
              
              {loadingEstudiantes ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50">
                  {filteredEstudiantes.length === 0 ? (
                    <div className="p-6 text-center text-slate-500">
                      {searchEstudiantes ? 'No se encontraron estudiantes' : 'No hay estudiantes disponibles'}
                    </div>
                  ) : (
                    filteredEstudiantes.map((estudiante) => {
                      const isSelected = selectedEstudiantes.includes(estudiante.id)
                      return (
                        <div key={estudiante.id} className={`flex items-center gap-3 p-3 border-b border-slate-200 last:border-b-0 hover:bg-indigo-50 transition-colors ${
                          estudiante.estado !== 'ACTIVO' ? 'opacity-60' : ''
                        } ${isSelected ? 'bg-indigo-50' : ''}`}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleEstudianteToggle(estudiante.id)}
                            className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                            disabled={estudiante.estado !== 'ACTIVO' && !isSelected}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900 truncate">{estudiante.nombre} {estudiante.apellido}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                estudiante.estado === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                              }`}>{estudiante.estado}</span>
                            </div>
                            <p className="text-sm text-slate-500">DNI: {estudiante.dni} | {estudiante.grado}° {estudiante.seccion}</p>
                          </div>
                          {isSelected && (
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <select
                                value={estudiantesRelaciones[estudiante.id] || 'Padre/Madre'}
                                onChange={(e) => handleRelacionChange(estudiante.id, e.target.value)}
                                className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 text-slate-900"
                              >
                                <option value="Padre">Padre</option>
                                <option value="Madre">Madre</option>
                                <option value="Tutor">Tutor</option>
                                <option value="Familiar">Familiar</option>
                              </select>
                              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={estudiantesTitulares[estudiante.id] || false}
                                  onChange={(e) => handleTitularChange(estudiante.id, e.target.checked)}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                                />
                                <span className="text-slate-600">Titular</span>
                              </label>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  <span className="font-medium text-indigo-600">{selectedEstudiantes.length}</span> estudiante(s) seleccionado(s)
                </span>
                {searchEstudiantes && (
                  <span className="text-slate-500">{filteredEstudiantes.length} mostrados</span>
                )}
              </div>
            </div>
          </FormSection>
        </form>
      </ModalBody>

      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-100 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          form="edit-apoderado-form"
          disabled={loading}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/30"
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </ModalFooter>
    </Modal>
  )
}
