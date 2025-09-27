'use client'

import { useState, useEffect } from 'react'

interface Grado {
  idGrado: number
  nombre: string
  nivel: {
    nombre: string
  }
}

interface Seccion {
  idSeccion: number
  nombre: string
}

interface Apoderado {
  id: number
  nombre: string
  apellido: string
  dni: string
}

interface ApoderadoRelacion {
  apoderadoId: number
  relacion: string
  esTitular: boolean
}

interface CreateEstudianteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

// Tipos de relación disponibles
const TIPOS_RELACION = [
  { value: 'PADRE', label: 'Padre' },
  { value: 'MADRE', label: 'Madre' },
  { value: 'TUTOR', label: 'Tutor' },
  { value: 'ABUELO', label: 'Abuelo' },
  { value: 'ABUELA', label: 'Abuela' },
  { value: 'TIO', label: 'Tío' },
  { value: 'TIA', label: 'Tía' },
  { value: 'HERMANO', label: 'Hermano' },
  { value: 'HERMANA', label: 'Hermana' },
  { value: 'OTRO', label: 'Otro' }
]

export default function CreateEstudianteModal({ isOpen, onClose, onSuccess }: CreateEstudianteModalProps) {
  const [loading, setLoading] = useState(false)
  const [grados, setGrados] = useState<Grado[]>([])
  const [secciones, setSecciones] = useState<Seccion[]>([])
  const [apoderados, setApoderados] = useState<Apoderado[]>([])
  const [apoderadosRelaciones, setApoderadosRelaciones] = useState<ApoderadoRelacion[]>([
    { apoderadoId: 0, relacion: '', esTitular: false }
  ])
  
  const [formData, setFormData] = useState({
    dni: '',
    nombre: '',
    apellido: '',
    fechaNacimiento: '',
    gradoId: '',
    seccionId: ''
  })

  // Cargar datos iniciales
  useEffect(() => {
    if (isOpen) {
      fetchGrados()
      fetchApoderados()
    }
  }, [isOpen])

  // Cargar secciones cuando cambia el grado
  useEffect(() => {
    if (formData.gradoId) {
      fetchSecciones(formData.gradoId)
    } else {
      setSecciones([])
      setFormData(prev => ({ ...prev, seccionId: '' }))
    }
  }, [formData.gradoId])

  const fetchGrados = async () => {
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
      console.error('Error fetching grados:', error)
    }
  }

  const fetchSecciones = async (gradoId: string) => {
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
      console.error('Error fetching secciones:', error)
    }
  }

  const fetchApoderados = async () => {
    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) return

      const user = JSON.parse(userStr)
      const ieId = user.idIe || user.institucionId || 1
      const token = localStorage.getItem('token')

      const response = await fetch(`/api/usuarios/apoderados?ieId=${ieId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setApoderados(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching apoderados:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        alert('Error: No se encontró información del usuario')
        return
      }

      const user = JSON.parse(userStr)
      const ieId = user.idIe || user.institucionId || 1
      const token = localStorage.getItem('token')

      const response = await fetch('/api/estudiantes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          ieId,
          gradoId: parseInt(formData.gradoId),
          seccionId: parseInt(formData.seccionId),
          apoderadosRelaciones: apoderadosRelaciones.filter(rel => rel.apoderadoId > 0 && rel.relacion),
          fechaNacimiento: formData.fechaNacimiento ? new Date(formData.fechaNacimiento).toISOString() : null
        })
      })

      if (response.ok) {
        alert('Estudiante creado exitosamente')
        onSuccess()
        onClose()
        resetForm()
      } else {
        const error = await response.json()
        alert(`Error: ${error.message || 'No se pudo crear el estudiante'}`)
      }
    } catch (error) {
      console.error('Error creating estudiante:', error)
      alert('Error al crear el estudiante')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      dni: '',
      nombre: '',
      apellido: '',
      fechaNacimiento: '',
      gradoId: '',
      seccionId: ''
    })
    setApoderadosRelaciones([{ apoderadoId: 0, relacion: '', esTitular: false }])
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleApoderadoChange = (index: number, field: 'apoderadoId' | 'relacion' | 'esTitular', value: string | number | boolean) => {
    setApoderadosRelaciones(prev => 
      prev.map((rel, i) => 
        i === index 
          ? { 
              ...rel, 
              [field]: field === 'apoderadoId' ? Number(value) : 
                      field === 'esTitular' ? Boolean(value) : value 
            }
          : rel
      )
    )
  }

  const agregarApoderado = () => {
    setApoderadosRelaciones(prev => [...prev, { apoderadoId: 0, relacion: '', esTitular: false }])
  }

  const eliminarApoderado = (index: number) => {
    if (apoderadosRelaciones.length > 1) {
      setApoderadosRelaciones(prev => prev.filter((_, i) => i !== index))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-3">
          <h3 className="text-lg font-bold text-gray-900">Crear Nuevo Estudiante</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* DNI */}
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">DNI *</label>
              <input
                type="text"
                name="dni"
                value={formData.dni}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-4 py-3 text-black bg-white border-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                placeholder="12345678"
              />
            </div>


            {/* Nombre */}
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Nombre *</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-4 py-3 text-black bg-white border-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Apellido */}
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Apellido *</label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-4 py-3 text-black bg-white border-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Fecha de Nacimiento */}
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Fecha de Nacimiento *</label>
              <input
                type="date"
                name="fechaNacimiento"
                value={formData.fechaNacimiento}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-4 py-3 text-black bg-white border-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
              />
            </div>


            {/* Grado */}
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Grado *</label>
              <select
                name="gradoId"
                value={formData.gradoId}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-4 py-3 text-black bg-white border-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Seleccionar grado</option>
                {grados.map((grado) => (
                  <option key={grado.idGrado} value={grado.idGrado}>
                    {grado.nombre}° - {grado.nivel.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Sección */}
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Sección *</label>
              <select
                name="seccionId"
                value={formData.seccionId}
                onChange={handleChange}
                required
                disabled={!formData.gradoId}
                className="mt-1 block w-full px-4 py-3 text-black bg-white border-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none disabled:bg-gray-100"
              >
                <option value="">Seleccionar sección</option>
                {secciones.map((seccion) => (
                  <option key={seccion.idSeccion} value={seccion.idSeccion}>
                    {seccion.nombre}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Selección de Apoderados con Relaciones */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="block text-base font-semibold text-gray-800">Apoderados y Relaciones</label>
                <p className="text-sm text-gray-600 mt-1">Opcional: Puedes asignar uno o más apoderados al estudiante</p>
              </div>
              <button
                type="button"
                onClick={agregarApoderado}
                className="flex items-center space-x-1 px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Agregar Apoderado</span>
              </button>
            </div>
            
            <div className="space-y-4">
              {apoderadosRelaciones.map((relacion, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">
                      Apoderado {index + 1}
                    </h4>
                    {apoderadosRelaciones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => eliminarApoderado(index)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Eliminar apoderado"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Selector de Apoderado */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Seleccionar Apoderado
                      </label>
                      <select
                        value={relacion.apoderadoId}
                        onChange={(e) => handleApoderadoChange(index, 'apoderadoId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      >
                        <option value={0}>Seleccionar apoderado</option>
                        {apoderados.map((apoderado) => (
                          <option key={apoderado.id} value={apoderado.id}>
                            {apoderado.nombre} {apoderado.apellido} - DNI: {apoderado.dni}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Selector de Relación */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Relación {relacion.apoderadoId > 0 ? '*' : ''}
                      </label>
                      <select
                        value={relacion.relacion}
                        onChange={(e) => handleApoderadoChange(index, 'relacion', e.target.value)}
                        required={relacion.apoderadoId > 0}
                        disabled={relacion.apoderadoId === 0}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">Seleccionar relación</option>
                        {TIPOS_RELACION.map((tipo) => (
                          <option key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Checkbox Es Titular */}
                  <div className="mt-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={relacion.esTitular}
                        onChange={(e) => handleApoderadoChange(index, 'esTitular', e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Es titular (puede autorizar retiros)
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Solo los apoderados titulares pueden autorizar retiros del estudiante
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              Puedes dejar este campo vacío si no deseas asignar un apoderado por ahora
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                onClose()
                resetForm()
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear Estudiante'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
