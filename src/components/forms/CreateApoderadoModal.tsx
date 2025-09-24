'use client'

import { useState, useEffect } from 'react'
// import { XMarkIcon } from '@heroicons/react/24/outline'

interface CreateApoderadoModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateApoderadoModal({ isOpen, onClose, onSuccess }: CreateApoderadoModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    dni: '',
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    fechaNacimiento: '',
    ocupacion: '',
    password: '',
    estudianteId: '',
    parentescoEstudiante: 'PADRE'
  })
  
  const [estudiantes, setEstudiantes] = useState<any[]>([])
  const [loadingEstudiantes, setLoadingEstudiantes] = useState(false)

  // Cargar estudiantes cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadEstudiantes()
    }
  }, [isOpen])

  // Cargar estudiantes cuando se abre el modal
  const loadEstudiantes = async () => {
    setLoadingEstudiantes(true)
    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) return

      const user = JSON.parse(userStr)
      const ieId = user.idIe || user.institucionId || 1
      const token = localStorage.getItem('token')

      const response = await fetch(`/api/estudiantes?ieId=${ieId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setEstudiantes(data.data || [])
      }
    } catch (error) {
      console.error('Error loading estudiantes:', error)
    } finally {
      setLoadingEstudiantes(false)
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

      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          ieId,
          rol: 'APODERADO',
          fechaNacimiento: formData.fechaNacimiento ? new Date(formData.fechaNacimiento).toISOString() : null,
          apoderado: {
            ocupacion: formData.ocupacion
          },
          // Relación con estudiante si se seleccionó
          estudianteRelacion: formData.estudianteId ? {
            estudianteId: parseInt(formData.estudianteId),
            parentesco: formData.parentescoEstudiante
          } : null
        })
      })

      if (response.ok) {
        alert('Apoderado creado exitosamente')
        onSuccess()
        onClose()
        setFormData({
          dni: '',
          nombre: '',
          apellido: '',
          email: '',
          telefono: '',
          direccion: '',
          fechaNacimiento: '',
          ocupacion: '',
          password: '',
          estudianteId: '',
          parentescoEstudiante: 'PADRE'
        })
      } else {
        const error = await response.json()
        alert(`Error: ${error.message || 'No se pudo crear el apoderado'}`)
      }
    } catch (error) {
      console.error('Error creating apoderado:', error)
      alert('Error al crear el apoderado')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center pb-3">
          <h3 className="text-lg font-bold text-gray-900">Crear Nuevo Apoderado</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-4 py-3 text-black bg-white border-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

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

            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Teléfono *</label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-4 py-3 text-black bg-white border-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Fecha de Nacimiento</label>
              <input
                type="date"
                name="fechaNacimiento"
                value={formData.fechaNacimiento}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 text-black bg-white border-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Ocupación</label>
              <input
                type="text"
                name="ocupacion"
                value={formData.ocupacion}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 text-black bg-white border-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                placeholder="Profesión u ocupación"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-base font-semibold text-gray-800 mb-2">Dirección</label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 text-black bg-white border-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Sección de hijos */}
            <div className="md:col-span-2">
              <h4 className="text-md font-medium text-gray-900 mb-3 border-t pt-4">
                Hijos (Opcional)
              </h4>
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Seleccionar Hijo</label>
              <select
                name="estudianteId"
                value={formData.estudianteId}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 text-black bg-white border-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                disabled={loadingEstudiantes}
              >
                <option value="">Seleccionar hijo...</option>
                {estudiantes.map((estudiante) => (
                  <option key={estudiante.idEstudiante} value={estudiante.idEstudiante}>
                    {estudiante.usuario?.nombre} {estudiante.usuario?.apellido} - {estudiante.codigo}
                  </option>
                ))}
              </select>
              {loadingEstudiantes && (
                <p className="text-sm text-gray-500 mt-1">Cargando estudiantes...</p>
              )}
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Parentesco con el Hijo</label>
              <select
                name="parentescoEstudiante"
                value={formData.parentescoEstudiante}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 text-black bg-white border-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                disabled={!formData.estudianteId}
              >
                <option value="PADRE">Padre</option>
                <option value="MADRE">Madre</option>
                <option value="TUTOR">Tutor Legal</option>
                <option value="ABUELO">Abuelo</option>
                <option value="ABUELA">Abuela</option>
                <option value="TIO">Tío</option>
                <option value="TIA">Tía</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-base font-semibold text-gray-800 mb-2">Contraseña *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-4 py-3 text-black bg-white border-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
              />
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
              {loading ? 'Creando...' : 'Crear Apoderado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
