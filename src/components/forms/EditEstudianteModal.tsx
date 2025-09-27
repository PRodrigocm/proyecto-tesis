'use client'

import { useState, useEffect } from 'react'

interface Estudiante {
  id: string
  nombre: string
  apellido: string
  dni: string
  fechaNacimiento: string
  grado: string
  seccion: string
  institucionEducativa: string
  apoderado: {
    id: string
    nombre: string
    apellido: string
    telefono: string
    email: string
    relacion: string
    esTitular: boolean
  }
  estado: 'ACTIVO' | 'INACTIVO' | 'RETIRADO'
  fechaRegistro: string
  qrCode: string
}

interface Grado {
  idGrado: number
  nombre: string
}

interface Seccion {
  idSeccion: number
  nombre: string
}

interface EditEstudianteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  estudiante: Estudiante | null
}

export default function EditEstudianteModal({ isOpen, onClose, onSuccess, estudiante }: EditEstudianteModalProps) {
  const [loading, setLoading] = useState(false)
  const [grados, setGrados] = useState<Grado[]>([])
  const [secciones, setSecciones] = useState<Seccion[]>([])
  
  const [formData, setFormData] = useState({
    dni: '',
    nombre: '',
    apellido: '',
    fechaNacimiento: '',
    gradoId: '',
    seccionId: ''
  })

  useEffect(() => {
    if (estudiante && isOpen) {
      setFormData({
        dni: estudiante.dni,
        nombre: estudiante.nombre,
        apellido: estudiante.apellido,
        fechaNacimiento: estudiante.fechaNacimiento ? estudiante.fechaNacimiento.split('T')[0] : '',
        gradoId: '',
        seccionId: ''
      })
      fetchGrados()
    }
  }, [estudiante, isOpen])

  const fetchGrados = async () => {
    try {
      const token = localStorage.getItem('token')
      const userStr = localStorage.getItem('user')
      if (!userStr) return

      const user = JSON.parse(userStr)
      const ieId = user.idIe || user.institucionId || 1

      const response = await fetch(`/api/grados?ieId=${ieId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
    if (!gradoId) {
      setSecciones([])
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/secciones?gradoId=${gradoId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSecciones(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching secciones:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!estudiante) return

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/estudiantes?id=${estudiante.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          gradoId: parseInt(formData.gradoId),
          seccionId: parseInt(formData.seccionId),
          fechaNacimiento: formData.fechaNacimiento ? new Date(formData.fechaNacimiento).toISOString() : null
        })
      })

      if (response.ok) {
        alert('Estudiante actualizado exitosamente')
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        alert(`Error: ${error.message || 'No se pudo actualizar el estudiante'}`)
      }
    } catch (error) {
      console.error('Error updating estudiante:', error)
      alert('Error al actualizar el estudiante')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    if (name === 'gradoId') {
      fetchSecciones(value)
      setFormData(prev => ({ ...prev, seccionId: '' }))
    }
  }

  if (!isOpen || !estudiante) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center pb-3">
          <h3 className="text-lg font-bold text-gray-900">Editar Estudiante</h3>
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
                    {grado.nombre}
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

          {/* Información del Apoderado (Solo lectura) */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-base font-semibold text-gray-800 mb-3">Apoderado Actual</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Nombre:</span>
                <span className="ml-2 text-gray-900">
                  {estudiante.apoderado?.nombre} {estudiante.apoderado?.apellido}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Relación:</span>
                <span className="ml-2 text-gray-900">{estudiante.apoderado?.relacion}</span>
                {estudiante.apoderado?.esTitular && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Titular
                  </span>
                )}
              </div>
              <div>
                <span className="font-medium text-gray-600">Teléfono:</span>
                <span className="ml-2 text-gray-900">{estudiante.apoderado?.telefono || 'No disponible'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Email:</span>
                <span className="ml-2 text-gray-900">{estudiante.apoderado?.email || 'No disponible'}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Actualizando...' : 'Actualizar Estudiante'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
