'use client'

import { useState, useEffect } from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'

// Iconos
const AdminIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const UserIcon = () => (
  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const MailIcon = () => (
  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const PhoneIcon = () => (
  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
)

const IdCardIcon = () => (
  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
  </svg>
)

const LockIcon = () => (
  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)

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

  const inputClass = "w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 placeholder-slate-400 transition-all"
  const inputErrorClass = "w-full pl-12 pr-4 py-3 bg-red-50 border border-red-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder-slate-400 transition-all"

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader 
        icon={<AdminIcon />} 
        subtitle="Complete los datos del nuevo administrativo"
        variant="indigo"
        onClose={onClose}
      >
        Crear Nuevo Administrativo
      </ModalHeader>

      <ModalBody>
        <form id="create-admin-form" onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* DNI */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">DNI <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2"><IdCardIcon /></div>
                <input
                  type="text"
                  name="dni"
                  value={formData.dni}
                  onChange={handleChange}
                  required
                  maxLength={8}
                  pattern="[0-9]{8}"
                  className={fieldErrors.dni ? inputErrorClass : inputClass}
                  placeholder="12345678"
                />
              </div>
              {fieldErrors.dni && <p className="mt-1.5 text-sm text-red-500">{fieldErrors.dni}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2"><MailIcon /></div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                  className={fieldErrors.email ? inputErrorClass : inputClass}
                  placeholder="admin@email.com"
                />
              </div>
              {fieldErrors.email && <p className="mt-1.5 text-sm text-red-500">{fieldErrors.email}</p>}
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nombre <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2"><UserIcon /></div>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder="Nombres"
                />
              </div>
            </div>

            {/* Apellido */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Apellido <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2"><UserIcon /></div>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder="Apellidos"
                />
              </div>
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Teléfono</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2"><PhoneIcon /></div>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  maxLength={9}
                  pattern="[0-9]{9}"
                  className={inputClass}
                  placeholder="999999999"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Contraseña <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2"><LockIcon /></div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className={inputClass}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </div>
          </div>
        </form>
      </ModalBody>

      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          form="create-admin-form"
          disabled={loading}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creando...
            </>
          ) : 'Crear Administrativo'}
        </button>
      </ModalFooter>
    </Modal>
  )
}
