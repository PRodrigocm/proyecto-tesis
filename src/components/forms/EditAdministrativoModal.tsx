'use client'

import { useState, useEffect } from 'react'

interface Administrativo {
  id: number
  nombre: string
  apellido: string
  dni: string
  email: string
  telefono?: string
  cargo: string
  departamento: string
  fechaIngreso: string
  institucionEducativa: string
  estado: 'ACTIVO' | 'INACTIVO'
  fechaRegistro: string
  roles: Array<{
    rol: {
      nombre: string
    }
  }>
}

interface EditAdministrativoModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  administrativo: Administrativo | null
}

export default function EditAdministrativoModal({ isOpen, onClose, onSuccess, administrativo }: EditAdministrativoModalProps) {
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    dni: '',
    nombre: '',
    apellido: '',
    email: '',
    telefono: ''
  })

  useEffect(() => {
    if (administrativo && isOpen) {
      setFormData({
        dni: administrativo.dni,
        nombre: administrativo.nombre,
        apellido: administrativo.apellido,
        email: administrativo.email,
        telefono: administrativo.telefono || ''
      })
    }
  }, [administrativo, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!administrativo) return

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/usuarios/${administrativo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          dni: formData.dni,
          nombre: formData.nombre,
          apellido: formData.apellido,
          email: formData.email,
          telefono: formData.telefono
        })
      })

      if (response.ok) {
        alert('Administrativo actualizado exitosamente')
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        alert(`Error: ${error.message || 'No se pudo actualizar el administrativo'}`)
      }
    } catch (error) {
      console.error('Error updating administrativo:', error)
      alert('Error al actualizar el administrativo')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (!isOpen || !administrativo) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center pb-3">
          <h3 className="text-lg font-bold text-gray-900">Editar Administrativo</h3>
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

            {/* Email */}
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

            {/* Teléfono */}
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Teléfono</label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 text-black bg-white border-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Información del Sistema (Solo lectura) */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-base font-semibold text-gray-800 mb-3">Información del Sistema</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Institución:</span>
                <span className="ml-2 text-gray-900">
                  {administrativo.institucionEducativa || 'No disponible'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Rol:</span>
                <span className="ml-2 text-gray-900">
                  {administrativo.roles?.map(r => r.rol?.nombre).filter(Boolean).join(', ') || 'Sin rol'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Estado:</span>
                <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  administrativo.estado === 'ACTIVO' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {administrativo.estado}
                </span>
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
              {loading ? 'Actualizando...' : 'Actualizar Administrativo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
