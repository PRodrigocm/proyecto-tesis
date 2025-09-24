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

interface CreateEstudianteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateEstudianteModal({ isOpen, onClose, onSuccess }: CreateEstudianteModalProps) {
  const [loading, setLoading] = useState(false)
  const [grados, setGrados] = useState<Grado[]>([])
  const [secciones, setSecciones] = useState<Seccion[]>([])
  const [apoderados, setApoderados] = useState<Apoderado[]>([])
  const [selectedApoderados, setSelectedApoderados] = useState<number[]>([])
  
  const [formData, setFormData] = useState({
    dni: '',
    nombre: '',
    apellido: '',
    fechaNacimiento: '',
    codigo: '',
    gradoId: '',
    seccionId: '',
    password: ''
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
          apoderadosIds: selectedApoderados,
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
      codigo: '',
      gradoId: '',
      seccionId: '',
      password: ''
    })
    setSelectedApoderados([])
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleApoderadoToggle = (apoderadoId: number) => {
    setSelectedApoderados(prev => 
      prev.includes(apoderadoId) 
        ? prev.filter(id => id !== apoderadoId)
        : [...prev, apoderadoId]
    )
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

            {/* Código Estudiante */}
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Código Estudiante *</label>
              <input
                type="text"
                name="codigo"
                value={formData.codigo}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-4 py-3 text-black bg-white border-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                placeholder="EST2024001"
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

            {/* Password */}
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Contraseña *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-4 py-3 text-black bg-white border-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                placeholder="Contraseña del estudiante"
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

          {/* Selección de Apoderados */}
          <div className="mt-6">
            <label className="block text-base font-semibold text-gray-800 mb-3">Apoderados</label>
            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3 bg-gray-50">
              {apoderados.length === 0 ? (
                <p className="text-gray-500 text-sm">No hay apoderados disponibles</p>
              ) : (
                <div className="space-y-2">
                  {apoderados.map((apoderado) => (
                    <label key={apoderado.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={selectedApoderados.includes(apoderado.id)}
                        onChange={() => handleApoderadoToggle(apoderado.id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {apoderado.nombre} {apoderado.apellido}
                        </div>
                        <div className="text-xs text-gray-500">DNI: {apoderado.dni}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Selecciona uno o más apoderados para este estudiante
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
