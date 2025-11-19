'use client'

import { useState, useEffect } from 'react'
import { Docente } from '@/hooks/useDocentes'

interface Grado {
  idGrado: number
  nombre: string
}

interface Seccion {
  idSeccion: number
  nombre: string
}

interface TipoAsignacion {
  idTipoAsignacion: number
  nombre: string
}

interface EditDocenteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  docente: Docente | null
}

export default function EditDocenteModal({ isOpen, onClose, onSuccess, docente }: EditDocenteModalProps) {
  const [loading, setLoading] = useState(false)
  const [grados, setGrados] = useState<Grado[]>([])
  const [secciones, setSecciones] = useState<Seccion[]>([])
  const [tiposAsignacion, setTiposAsignacion] = useState<TipoAsignacion[]>([])
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    telefono: '',
    especialidad: '',
    gradoId: '',
    seccionId: '',
    tipoAsignacionId: ''
  })

  // Reset form when modal opens/closes or docente changes
  useEffect(() => {
    if (docente && isOpen) {
      setFormData({
        nombre: docente.nombre || '',
        apellido: docente.apellido || '',
        dni: docente.dni || '',
        email: docente.email || '',
        telefono: docente.telefono || '',
        especialidad: docente.especialidad || '',
        gradoId: '', // Se llenará después de cargar grados
        seccionId: '', // Se llenará después de cargar secciones
        tipoAsignacionId: '' // Se llenará después de cargar tipos
      })
      
      // Load grados, secciones and tipos de asignación
      loadInitialData()
    }
  }, [docente, isOpen])

  const loadInitialData = async () => {
    await loadGrados()
    await loadTiposAsignacion()
  }

  // Precargar valores cuando se cargan los datos
  useEffect(() => {
    if (docente && grados.length > 0) {
      const gradoEncontrado = grados.find(g => g.nombre === docente.grado)
      if (gradoEncontrado) {
        setFormData(prev => ({ ...prev, gradoId: gradoEncontrado.idGrado.toString() }))
        loadSecciones(gradoEncontrado.idGrado.toString())
      }
    }
  }, [docente, grados])

  useEffect(() => {
    if (docente && secciones.length > 0) {
      const seccionEncontrada = secciones.find(s => s.nombre === docente.seccion)
      if (seccionEncontrada) {
        setFormData(prev => ({ ...prev, seccionId: seccionEncontrada.idSeccion.toString() }))
      }
    }
  }, [docente, secciones])

  useEffect(() => {
    if (docente && tiposAsignacion.length > 0) {
      // Necesitamos obtener el tipo de asignación del docente desde la API
      loadDocenteAsignacion()
    }
  }, [docente, tiposAsignacion])

  const loadDocenteAsignacion = async () => {
    if (!docente) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/docentes/${docente.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        const docenteData = data.data
        
        // Si el docente tiene tipo de asignación, precargar el valor
        if (docenteData.tipoAsignacion && docenteData.tipoAsignacion.idTipoAsignacion) {
          setFormData(prev => ({ 
            ...prev, 
            tipoAsignacionId: docenteData.tipoAsignacion.idTipoAsignacion.toString() 
          }))
        }
      }
    } catch (error) {
      console.error('Error loading docente asignacion:', error)
    }
  }

  const loadGrados = async () => {
    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) return

      const user = JSON.parse(userStr)
      const ieId = user.idIe || user.institucionId || 1
      const token = localStorage.getItem('token')

      const response = await fetch(`/api/grados?ieId=${ieId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setGrados(data.data || [])
      }
    } catch (error) {
      console.error('Error loading grados:', error)
    }
  }

  const loadSecciones = async (gradoId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/secciones?gradoId=${gradoId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setSecciones(data.data || [])
      }
    } catch (error) {
      console.error('Error loading secciones:', error)
    }
  }

  const loadTiposAsignacion = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/tipos-asignacion', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setTiposAsignacion(data.data || [])
      }
    } catch (error) {
      console.error('Error loading tipos de asignación:', error)
    }
  }

  // Load secciones when grado changes
  useEffect(() => {
    if (formData.gradoId) {
      loadSecciones(formData.gradoId)
    } else {
      setSecciones([])
      setFormData(prev => ({ ...prev, seccionId: '' }))
    }
  }, [formData.gradoId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!docente) return

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/docentes?id=${docente.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          gradoId: formData.gradoId ? parseInt(formData.gradoId) : null,
          seccionId: formData.seccionId ? parseInt(formData.seccionId) : null,
          tipoAsignacionId: formData.tipoAsignacionId ? parseInt(formData.tipoAsignacionId) : null
        })
      })

      if (response.ok) {
        alert('Docente actualizado exitosamente')
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        alert(`Error: ${error.message || 'No se pudo actualizar el docente'}`)
      }
    } catch (error) {
      console.error('Error updating docente:', error)
      alert('Error al actualizar el docente')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !docente) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Editar Docente
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
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>
            </div>

            {/* Información Académica */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Información Académica</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Especialidad *
                </label>
                <input
                  type="text"
                  name="especialidad"
                  value={formData.especialidad}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grado
                </label>
                <select
                  name="gradoId"
                  value={formData.gradoId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                >
                  <option value="">Seleccionar grado...</option>
                  {grados.map((grado) => (
                    <option key={grado.idGrado} value={grado.idGrado}>
                      {grado.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sección
                </label>
                <select
                  name="seccionId"
                  value={formData.seccionId}
                  onChange={handleInputChange}
                  disabled={!formData.gradoId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black disabled:bg-gray-100"
                >
                  <option value="">Seleccionar sección...</option>
                  {secciones.map((seccion) => (
                    <option key={seccion.idSeccion} value={seccion.idSeccion}>
                      {seccion.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Asignación
                </label>
                <select
                  name="tipoAsignacionId"
                  value={formData.tipoAsignacionId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                >
                  <option value="">Seleccionar tipo...</option>
                  {tiposAsignacion.map((tipo) => (
                    <option key={tipo.idTipoAsignacion} value={tipo.idTipoAsignacion}>
                      {tipo.nombre}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Define el rol del docente (Tutor, Profesor de materia, etc.)
                </p>
              </div>
            </div>
          </div>

          {/* Asignaciones Actuales */}
          {docente.materias && docente.materias.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-base font-semibold text-gray-800 mb-3">Asignaciones Actuales</h4>
              <div className="flex flex-wrap gap-2">
                {docente.materias.map((materia, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {materia.nombre}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Al asignar un nuevo grado y sección, se reemplazarán las asignaciones actuales.
              </p>
            </div>
          )}

          {/* Información del Sistema (Solo lectura) */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-base font-semibold text-gray-800 mb-3">Información del Sistema</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Institución:</span>
                <span className="ml-2 text-gray-900">{docente.institucionEducativa}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Estado:</span>
                <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  docente.estado === 'ACTIVO' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {docente.estado}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600">ID Usuario:</span>
                <span className="ml-2 text-gray-900 font-mono">{docente.id}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Fecha Registro:</span>
                <span className="ml-2 text-gray-900">
                  {new Date(docente.fechaRegistro).toLocaleDateString('es-ES')}
                </span>
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
