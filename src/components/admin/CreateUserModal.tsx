'use client'

import { useState, useEffect } from 'react'
import { useCreateUser, CreateUserData } from '@/hooks/useCreateUser'
import { useRoles } from '@/hooks/useRoles'
import { Modal, ModalHeader, ModalBody, ModalFooter, FormSection, Alert } from '@/components/ui'

interface CreateUserModalProps {
  isOpen: boolean
  onClose: () => void
  onUserCreated?: () => void
}

// Iconos
const UserPlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
)

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
)

export default function CreateUserModal({ isOpen, onClose, onUserCreated }: CreateUserModalProps) {
  const { createUser, loading } = useCreateUser()
  const { roles, loading: rolesLoading } = useRoles()
  
  const [formData, setFormData] = useState<CreateUserData>({
    dni: '',
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    passwordHash: '',
    confirmPassword: '',
    ieId: '',
    roleIds: [],
    especialidad: '',
    ocupacion: '',
    fechaNacimiento: '',
    estado: '',
    grado: '',
    seccion: '',
    apoderadoId: '',
    relacionApoderado: ''
  })
  
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')
  const [currentUserIe, setCurrentUserIe] = useState<string>('')
  const [apoderados, setApoderados] = useState<any[]>([])
  const [filteredApoderados, setFilteredApoderados] = useState<any[]>([])
  const [searchApoderado, setSearchApoderado] = useState('')
  const [availableSecciones, setAvailableSecciones] = useState<string[]>([])

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Get current user's institution and manage form state
  useEffect(() => {
    if (isOpen) {
      const userStr = localStorage.getItem('user')
      const token = localStorage.getItem('token')
      console.log('Raw user data from localStorage:', userStr)
      console.log('Token from localStorage:', token ? 'Present' : 'Not found')
      
      let ieId = ''
      
      // First try to get from user data
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          console.log('Parsed user object:', user)
          
          // Get institution ID from logged-in user
          ieId = user.idIe?.toString() || ''
          
          console.log('Extracted ieId from user data:', ieId)
        } catch (error) {
          console.error('Error parsing user data:', error)
        }
      }
      
      // If not found in user data, try to decode JWT token
      if (!ieId && token) {
        try {
          // Decode JWT token (simple base64 decode of payload)
          const tokenParts = token.split('.')
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]))
            console.log('JWT payload:', payload)
            ieId = payload.ieId?.toString() || ''
            console.log('Extracted ieId from JWT:', ieId)
          }
        } catch (error) {
          console.error('Error decoding JWT token:', error)
        }
      }
      
      if (!ieId) {
        setError('No se pudo obtener la institución del usuario logueado. Por favor, vuelva a iniciar sesión.')
        return
      }
      
      setCurrentUserIe(ieId)
      // Initialize form with proper ieId
      setFormData({
        dni: '',
        nombres: '',
        apellidos: '',
        email: '',
        telefono: '',
        passwordHash: '',
        confirmPassword: '',
        ieId: ieId,
        roleIds: [],
        especialidad: '',
        ocupacion: '',
        fechaNacimiento: '',
        estado: '',
        grado: '',
        seccion: '',
        apoderadoId: '',
        relacionApoderado: ''
      })
      setSelectedRoleId('')
      setError(null)
      setSuccess(false)
    }
  }, [isOpen])

  // Check role-specific field requirements
  const selectedRoleName = roles?.find(role => role.id === selectedRoleId)?.name || ''

  // Load apoderados when modal opens and role is ESTUDIANTE
  useEffect(() => {
    if (isOpen && selectedRoleName === 'ESTUDIANTE' && currentUserIe) {
      loadApoderados()
    }
  }, [isOpen, selectedRoleName, currentUserIe])

  // Filter apoderados based on search
  useEffect(() => {
    if (searchApoderado.trim() === '') {
      setFilteredApoderados(apoderados)
    } else {
      const filtered = apoderados.filter(apoderado =>
        `${apoderado.nombre} ${apoderado.apellido}`.toLowerCase().includes(searchApoderado.toLowerCase()) ||
        apoderado.dni.includes(searchApoderado)
      )
      setFilteredApoderados(filtered)
    }
  }, [searchApoderado, apoderados])

  // Update available sections when grade changes
  useEffect(() => {
    if (formData.grado) {
      const secciones = ['A', 'B', 'C', 'D', 'E'] // Default sections
      setAvailableSecciones(secciones)
    } else {
      setAvailableSecciones([])
      setFormData(prev => ({ ...prev, seccion: '' }))
    }
  }, [formData.grado])

  const loadApoderados = async () => {
    try {
      const response = await fetch(`/api/apoderados?ieId=${currentUserIe}`)
      if (response.ok) {
        const data = await response.json()
        setApoderados(data.data || [])
      }
    } catch (error) {
      console.error('Error loading apoderados:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleApoderadoSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchApoderado(e.target.value)
  }

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const roleId = e.target.value
    setSelectedRoleId(roleId)
    setFormData(prev => ({
      ...prev,
      roleIds: roleId ? [roleId] : []
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    console.log('Form submission - formData:', formData)
    console.log('Form submission - ieId:', formData.ieId)
    console.log('Form submission - currentUserIe:', currentUserIe)

    try {
      await createUser(formData)
      setSuccess(true)
      
      // Reset form
      setFormData({
        dni: '',
        nombres: '',
        apellidos: '',
        email: '',
        telefono: '',
        passwordHash: '',
        confirmPassword: '',
        ieId: currentUserIe,
        roleIds: [],
        especialidad: '',
        ocupacion: '',
        fechaNacimiento: '',
        estado: '',
        grado: '',
        seccion: '',
        apoderadoId: '',
        relacionApoderado: ''
      })
      setSelectedRoleId('')
    } catch (error: any) {
      setError(error.message || 'Error al crear usuario')
    }
  }

  const requiresEmailPhone = ['APODERADO', 'DOCENTE', 'ADMINISTRATIVO', 'AUXILIAR'].includes(selectedRoleName)
  const requiresEspecialidad = selectedRoleName === 'DOCENTE'
  const requiresOcupacion = selectedRoleName === 'APODERADO'
  const requiresFechaNacimiento = selectedRoleName === 'ESTUDIANTE'
  const isEstudiante = selectedRoleName === 'ESTUDIANTE'

  if (!isOpen) return null

  // Estilos de input reutilizables
  const inputClass = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 placeholder-slate-400 transition-all"
  const labelClass = "block text-sm font-medium text-slate-700 mb-1.5"
  const selectClass = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 transition-all appearance-none cursor-pointer"

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalHeader 
        icon={<UserPlusIcon />} 
        subtitle="Complete los datos del nuevo usuario"
        variant="blue"
        onClose={onClose}
      >
        Crear Nuevo Usuario
      </ModalHeader>

      <ModalBody>
        {/* Alertas */}
        {success && (
          <Alert type="success" className="mb-6">
            <p className="font-semibold">¡Usuario creado exitosamente!</p>
            <p className="text-sm opacity-90">El usuario ha sido registrado en el sistema</p>
          </Alert>
        )}

        {error && (
          <Alert type="error" className="mb-6">
            <p className="font-semibold">Error al crear usuario</p>
            <p className="text-sm opacity-90">{error}</p>
          </Alert>
        )}

        <form onSubmit={handleSubmit} id="create-user-form" className="space-y-6">
          {/* Sección 1: Datos Básicos */}
          <FormSection number={1} title="Datos Básicos">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* DNI */}
              <div className="space-y-1.5">
                <label htmlFor="dni" className={labelClass}>
                  DNI <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="dni"
                  name="dni"
                  value={formData.dni}
                  onChange={handleInputChange}
                  required
                  maxLength={8}
                  pattern="[0-9]{8}"
                  className={inputClass}
                  placeholder="12345678"
                />
              </div>

              {/* Nombres */}
              <div className="space-y-1.5">
                <label htmlFor="nombres" className={labelClass}>
                  Nombres <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="nombres"
                  name="nombres"
                  value={formData.nombres}
                  onChange={handleInputChange}
                  required
                  className={inputClass}
                  placeholder="Ingrese nombres"
                />
              </div>

              {/* Apellidos */}
              <div className="space-y-1.5">
                <label htmlFor="apellidos" className={labelClass}>
                  Apellidos <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="apellidos"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleInputChange}
                  required
                  className={inputClass}
                  placeholder="Ingrese apellidos"
                />
              </div>

              {/* Rol */}
              <div className="space-y-1.5">
                <label htmlFor="roleId" className={labelClass}>
                  Rol <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="roleId"
                    name="roleId"
                    value={selectedRoleId}
                    onChange={handleRoleChange}
                    required
                    className={selectClass}
                    disabled={rolesLoading}
                  >
                    <option value="">Seleccionar rol</option>
                    {roles?.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    )) || []}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </FormSection>

          {/* Sección 2: Contacto (condicional) */}
          {requiresEmailPhone && (
            <FormSection number={2} title="Información de Contacto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="email" className={labelClass}>
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className={inputClass}
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="telefono" className={labelClass}>
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    required
                    className={inputClass}
                    placeholder="999 999 999"
                  />
                </div>
              </div>
            </FormSection>
          )}

          {/* Sección 3: Seguridad */}
          <FormSection number={requiresEmailPhone ? 3 : 2} title="Seguridad">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="passwordHash" className={labelClass}>
                  Contraseña <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="passwordHash"
                  name="passwordHash"
                  value={formData.passwordHash}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                  className={inputClass}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className={labelClass}>
                  Confirmar Contraseña <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className={inputClass}
                  placeholder="Repita la contraseña"
                />
              </div>
            </div>
            
            {/* Info de institución */}
            <div className="mt-4 p-4 bg-slate-100 rounded-xl">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>El usuario será creado en tu misma institución educativa</span>
              </div>
            </div>
          </FormSection>

          {/* Sección Estudiante */}
          {isEstudiante && (
            <FormSection number={requiresEmailPhone ? 4 : 3} title="Información del Estudiante">
              <div className="space-y-1.5">
                <label htmlFor="fechaNacimiento" className={labelClass}>
                  Fecha de Nacimiento <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="fechaNacimiento"
                  name="fechaNacimiento"
                  value={formData.fechaNacimiento || ''}
                  onChange={(e) => {
                    const selectedDate = new Date(e.target.value)
                    const today = new Date()
                    const age = today.getFullYear() - selectedDate.getFullYear()
                    const monthDiff = today.getMonth() - selectedDate.getMonth()
                    const dayDiff = today.getDate() - selectedDate.getDate()
                    let exactAge = age
                    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) exactAge--
                    
                    if (exactAge < 6 || exactAge > 12) {
                      setError(`La edad debe estar entre 6 y 12 años. Edad: ${exactAge} años`)
                      setFormData(prev => ({ ...prev, grado: '' }))
                    } else {
                      setError(null)
                      const gradoAsignado = (exactAge - 5).toString()
                      setFormData(prev => ({ ...prev, fechaNacimiento: e.target.value, grado: gradoAsignado }))
                      return
                    }
                    handleInputChange(e)
                  }}
                  required
                  max={new Date().toISOString().split('T')[0]}
                  className={inputClass}
                />
                <p className="text-xs text-slate-500">Solo estudiantes entre 6 y 12 años</p>
              </div>
            </FormSection>
          )}

          {/* Grado y Sección (Estudiantes) */}
          {isEstudiante && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="grado" className={labelClass}>
                  Grado <span className="text-red-500">*</span>
                  {formData.grado && formData.fechaNacimiento && (
                    <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">Auto</span>
                  )}
                </label>
                <div className="relative">
                  <select id="grado" name="grado" value={formData.grado || ''} onChange={handleInputChange} required className={selectClass}>
                    <option value="">Seleccionar grado</option>
                    <option value="1">1° Grado</option>
                    <option value="2">2° Grado</option>
                    <option value="3">3° Grado</option>
                    <option value="4">4° Grado</option>
                    <option value="5">5° Grado</option>
                    <option value="6">6° Grado</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="seccion" className={labelClass}>Sección <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select id="seccion" name="seccion" value={formData.seccion || ''} onChange={handleInputChange} required disabled={!formData.grado} className={`${selectClass} disabled:bg-slate-100`}>
                    <option value="">Seleccionar</option>
                    {availableSecciones.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Buscar Apoderado (Estudiantes) */}
          {isEstudiante && (
            <div className="space-y-3">
              <label className={labelClass}>Asignar Apoderado</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><SearchIcon /></div>
                <input type="text" value={searchApoderado} onChange={handleApoderadoSearch} placeholder="Buscar por nombre o DNI..." className={`${inputClass} pl-10`} />
              </div>
              {filteredApoderados.length > 0 && (
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50">
                  {filteredApoderados.map((a) => (
                    <button key={a.id} type="button" onClick={() => setFormData(prev => ({ ...prev, apoderadoId: a.id }))}
                      className={`w-full flex items-center justify-between p-3 text-left hover:bg-indigo-50 border-b border-slate-200 last:border-b-0 ${formData.apoderadoId === a.id ? 'bg-indigo-50' : ''}`}>
                      <div><p className="font-medium text-slate-900">{a.nombre} {a.apellido}</p><p className="text-sm text-slate-500">DNI: {a.dni}</p></div>
                      {formData.apoderadoId === a.id && <CheckIcon />}
                    </button>
                  ))}
                </div>
              )}
              {formData.apoderadoId && (
                <div className="space-y-1.5">
                  <label htmlFor="relacionApoderado" className={labelClass}>Relación <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select id="relacionApoderado" name="relacionApoderado" value={formData.relacionApoderado || ''} onChange={handleInputChange} required className={selectClass}>
                      <option value="">Seleccionar</option>
                      <option value="Padre">Padre</option>
                      <option value="Madre">Madre</option>
                      <option value="Tutor">Tutor</option>
                      <option value="Familiar">Familiar</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Especialidad (Docentes) */}
          {requiresEspecialidad && (
            <FormSection number={4} title="Información Profesional">
              <div className="space-y-1.5">
                <label htmlFor="especialidad" className={labelClass}>Especialidad <span className="text-red-500">*</span></label>
                <input type="text" id="especialidad" name="especialidad" value={formData.especialidad || ''} onChange={handleInputChange} required className={inputClass} placeholder="Ej: Matemáticas, Comunicación" />
              </div>
            </FormSection>
          )}

          {/* Ocupación (Apoderados) */}
          {requiresOcupacion && (
            <FormSection number={4} title="Información Adicional">
              <div className="space-y-1.5">
                <label htmlFor="ocupacion" className={labelClass}>Ocupación <span className="text-red-500">*</span></label>
                <input type="text" id="ocupacion" name="ocupacion" value={formData.ocupacion || ''} onChange={handleInputChange} required className={inputClass} placeholder="Ej: Ingeniero, Médico" />
              </div>
            </FormSection>
          )}

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
          form="create-user-form"
          disabled={loading}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/30"
        >
          {loading ? 'Creando...' : 'Crear Usuario'}
        </button>
      </ModalFooter>
    </Modal>
  )
}
