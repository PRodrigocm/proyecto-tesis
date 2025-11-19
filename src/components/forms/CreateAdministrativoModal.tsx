'use client'

import { useState, useEffect } from 'react'
// import { XMarkIcon } from '@heroicons/react/24/outline'

interface CreateAdministrativoModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateAdministrativoModal({ isOpen, onClose, onSuccess }: CreateAdministrativoModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    dni: '',
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    password: ''
  })
  const [fieldErrors, setFieldErrors] = useState<{ dni?: string; email?: string }>({})

  // Reset form
  const resetForm = () => {
    setFormData({
      dni: '',
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      password: ''
    })
    setFieldErrors({})
  }

  // Validar DNI duplicado
  const validateDNI = async (dni: string) => {
    if (dni.length !== 8) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/usuarios/validate-dni?dni=${dni}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.exists) {
          setFieldErrors(prev => ({ 
            ...prev, 
            dni: `El DNI ${dni} ya está registrado` 
          }))
        } else {
          setFieldErrors(prev => ({ ...prev, dni: undefined }))
        }
      }
    } catch (error) {
      console.error('Error validating DNI:', error)
    }
  }

  // Validar email duplicado
  const validateEmail = async (email: string) => {
    if (!email || !email.includes('@')) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/usuarios/validate-email?email=${encodeURIComponent(email)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.exists) {
          setFieldErrors(prev => ({ 
            ...prev, 
            email: `El email ${email} ya está registrado` 
          }))
        } else {
          setFieldErrors(prev => ({ ...prev, email: undefined }))
        }
      }
    } catch (error) {
      console.error('Error validating email:', error)
    }
  }

  useEffect(() => {
    if (isOpen) {
      resetForm()
    }
  }, [isOpen])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Verificar si hay errores de validación
    if (fieldErrors.dni || fieldErrors.email) {
      alert('Por favor, corrige los errores antes de continuar')
      return
    }
    
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
          rol: 'ADMINISTRATIVO'
        })
      })

      if (response.ok) {
        alert('Administrativo creado exitosamente')
        onSuccess()
        onClose()
        setFormData({
          dni: '',
          nombre: '',
          apellido: '',
          email: '',
          telefono: '',
          password: ''
        })
      } else {
        const error = await response.json()
        alert(`Error: ${error.message || 'No se pudo crear el administrativo'}`)
      }
    } catch (error) {
      console.error('Error creating administrativo:', error)
      alert('Error al crear el administrativo')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    // Limpiar errores cuando el usuario empiece a escribir
    if (name === 'dni') {
      setFieldErrors(prev => ({ ...prev, dni: undefined }))
    } else if (name === 'email') {
      setFieldErrors(prev => ({ ...prev, email: undefined }))
    }
    
    setFormData({
      ...formData,
      [name]: value
    })

    // Validar DNI cuando tenga 8 dígitos
    if (name === 'dni' && value.length === 8 && /^\d{8}$/.test(value)) {
      validateDNI(value)
    }

    // Validar email cuando tenga formato válido
    if (name === 'email' && value.includes('@') && value.includes('.')) {
      validateEmail(value)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center pb-3">
          <h3 className="text-lg font-bold text-gray-900">Crear Nuevo Administrativo</h3>
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
                maxLength={8}
                pattern="[0-9]{8}"
                className={`mt-1 block w-full px-4 py-3 text-black bg-white border-2 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none ${fieldErrors.dni ? 'border-red-400' : 'border-gray-300'}`}
                placeholder="12345678"
              />
              <p className="mt-1 text-sm text-gray-500">Debe contener exactamente 8 dígitos</p>
              {fieldErrors.dni && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.dni}</p>
              )}
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={`mt-1 block w-full px-4 py-3 text-black bg-white border-2 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none ${fieldErrors.email ? 'border-red-400' : 'border-gray-300'}`}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
              )}
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
              <label className="block text-base font-semibold text-gray-800 mb-2">Teléfono</label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                maxLength={9}
                pattern="[0-9]{9}"
                className="mt-1 block w-full px-4 py-3 text-black bg-white border-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                placeholder="999999999"
              />
              <p className="mt-1 text-sm text-gray-500">Debe contener exactamente 9 dígitos</p>
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
              {loading ? 'Creando...' : 'Crear Administrativo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
