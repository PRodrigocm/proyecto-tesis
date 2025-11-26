'use client'

import { useState, useEffect } from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'
import SearchableSelect from '@/components/ui/SearchableSelect'

// Iconos
const ParentIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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

const HomeIcon = () => (
  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)

const BriefcaseIcon = () => (
  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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

interface CreateApoderadoModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface HijoRelacion {
  estudianteId: string
  parentesco: string
  esTitular: boolean
}

const createInitialFormData = () => ({
  dni: '',
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  ocupacion: '',
  direccion: '',
  password: ''
})

const createInitialHijos = (): HijoRelacion[] => ([
  { estudianteId: '', parentesco: 'PADRE', esTitular: false }
])

export default function CreateApoderadoModal({ isOpen, onClose, onSuccess }: CreateApoderadoModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(createInitialFormData)
  
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [loadingEstudiantes, setLoadingEstudiantes] = useState(false)
  const [hijosRelaciones, setHijosRelaciones] = useState<HijoRelacion[]>(createInitialHijos)
  const [fieldErrors, setFieldErrors] = useState<{ dni?: string; email?: string }>({})

  const resetForm = () => {
    setFormData(createInitialFormData())
    setHijosRelaciones(createInitialHijos())
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

  // Cargar estudiantes cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      resetForm()
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
          rol: 'APODERADO',
          apoderado: {
            ocupacion: formData.ocupacion,
            direccion: formData.direccion
          },
          // Relaciones con estudiantes (múltiples hijos)
          hijosRelaciones: hijosRelaciones.filter(hijo => hijo.estudianteId).map(hijo => ({
            estudianteId: parseInt(hijo.estudianteId),
            parentesco: hijo.parentesco,
            esTitular: hijo.esTitular
          }))
        })
      })

      if (response.ok) {
        alert('Apoderado creado exitosamente')
        onSuccess()
        onClose()
        resetForm()
      } else {
        const error = await response.json()
        const errorMessage = error.error || error.message || 'No se pudo crear el apoderado'

        if (errorMessage.toLowerCase().includes('dni')) {
          setFieldErrors(prev => ({ ...prev, dni: errorMessage }))
        }

        alert(`Error: ${errorMessage}`)
      }
    } catch (error) {
      console.error('Error creating apoderado:', error)
      alert('Error al crear el apoderado')
    } finally {
      setLoading(false)
      resetForm()
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

  const agregarHijo = () => {
    setHijosRelaciones(prev => [
      ...prev,
      { estudianteId: '', parentesco: 'PADRE', esTitular: false }
    ])
  }

  const eliminarHijo = (index: number) => {
    if (hijosRelaciones.length > 1) {
      setHijosRelaciones(prev => prev.filter((_, i) => i !== index))
    }
  }

  const handleHijoChange = (index: number, field: keyof HijoRelacion, value: string | boolean) => {
    setHijosRelaciones(prev => prev.map((hijo, i) => {
      if (i === index) {
        // Si se marca como titular, desmarcar todos los demás
        if (field === 'esTitular' && value === true) {
          const updatedRelaciones = prev.map((h, idx) => ({
            ...h,
            esTitular: idx === index
          }))
          return { ...hijo, [field]: value }
        }
        return { ...hijo, [field]: value }
      }
      // Si se está marcando otro como titular, desmarcar este
      if (field === 'esTitular' && value === true) {
        return { ...hijo, esTitular: false }
      }
      return hijo
    }))
  }

  if (!isOpen) return null

  const inputClass = "w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-slate-900 placeholder-slate-400 transition-all"
  const inputErrorClass = "w-full pl-12 pr-4 py-3 bg-red-50 border border-red-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder-slate-400 transition-all"
  const selectClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-slate-900 transition-all appearance-none cursor-pointer"

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader 
        icon={<ParentIcon />} 
        subtitle="Complete los datos del nuevo apoderado"
        variant="rose"
        onClose={onClose}
      >
        Crear Nuevo Apoderado
      </ModalHeader>

      <ModalBody className="max-h-[65vh] overflow-y-auto">
        <form id="create-apoderado-form" onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
          {/* Sección: Información Personal */}
          <div className="p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl border border-rose-100">
            <h4 className="text-sm font-semibold text-rose-900 mb-4 flex items-center gap-2">
              <UserIcon />
              Información Personal
            </h4>
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
                    autoComplete="off"
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
                    className={fieldErrors.email ? inputErrorClass : inputClass}
                    placeholder="apoderado@email.com"
                    autoComplete="off"
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
                    autoComplete="off"
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
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Teléfono <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2"><PhoneIcon /></div>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    required
                    maxLength={9}
                    pattern="[0-9]{9}"
                    className={inputClass}
                    placeholder="999999999"
                  />
                </div>
              </div>

              {/* Ocupación */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Ocupación</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2"><BriefcaseIcon /></div>
                  <input
                    type="text"
                    name="ocupacion"
                    value={formData.ocupacion}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Profesión u ocupación"
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Dirección */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Dirección <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2"><HomeIcon /></div>
                  <input
                    type="text"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    required
                    className={inputClass}
                    placeholder="Dirección completa del domicilio"
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sección: Hijos */}
          <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-semibold text-violet-900">Hijos Asignados</h4>
                <p className="text-xs text-violet-600 mt-1">Asigna estudiantes como hijos del apoderado</p>
              </div>
              <button
                type="button"
                onClick={agregarHijo}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-violet-600 hover:text-violet-800 hover:bg-violet-100 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Agregar
              </button>
            </div>
            
            <div className="space-y-3">
              {hijosRelaciones.map((hijo, index) => (
                <div key={index} className="bg-white rounded-xl p-4 border border-violet-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-700">Hijo {index + 1}</span>
                    {hijosRelaciones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => eliminarHijo(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <SearchableSelect
                      label="Seleccionar Estudiante"
                      options={estudiantes.map(est => ({
                        value: est.id,
                        label: `${est.nombre} ${est.apellido}`,
                        subtitle: `${est.grado}° ${est.seccion} - DNI: ${est.dni}`
                      }))}
                      value={hijo.estudianteId}
                      onChange={(value) => handleHijoChange(index, 'estudianteId', value)}
                      placeholder="Buscar estudiante..."
                      disabled={loadingEstudiantes}
                    />

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Parentesco</label>
                      <select
                        value={hijo.parentesco}
                        onChange={(e) => handleHijoChange(index, 'parentesco', e.target.value)}
                        className={`${selectClass} disabled:bg-slate-100`}
                        disabled={!hijo.estudianteId}
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
                  </div>

                  {hijo.estudianteId && (
                    <label className="flex items-center gap-2 mt-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hijo.esTitular}
                        onChange={(e) => handleHijoChange(index, 'esTitular', e.target.checked)}
                        className="w-4 h-4 text-violet-600 border-slate-300 rounded focus:ring-violet-500"
                      />
                      <span className="text-sm text-slate-700">Es titular (puede autorizar retiros)</span>
                    </label>
                  )}
                </div>
              ))}
              
              {loadingEstudiantes && (
                <div className="flex items-center justify-center py-4">
                  <svg className="animate-spin h-5 w-5 text-violet-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="ml-2 text-sm text-slate-500">Cargando estudiantes...</span>
                </div>
              )}
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
                className={inputClass}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
              />
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
          form="create-apoderado-form"
          disabled={loading}
          className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-medium rounded-xl hover:from-rose-600 hover:to-pink-600 transition-all shadow-lg shadow-rose-500/30 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creando...
            </>
          ) : 'Crear Apoderado'}
        </button>
      </ModalFooter>
    </Modal>
  )
}
