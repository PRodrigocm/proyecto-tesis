'use client'

import { useState, useEffect } from 'react'
import { useCreateUser, CreateUserData } from '@/hooks/useCreateUser'
import { useRoles } from '@/hooks/useRoles'
import { useInstitucionesEducativas } from '@/hooks/useInstitucionesEducativas'

interface CreateUserModalProps {
  isOpen: boolean
  onClose: () => void
  onUserCreated?: () => void
}

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

  // Debug logging
  console.log('Modal is open, roles:', roles)

  return (
    <>
      {/* Background overlay */}
      <div 
        className="fixed inset-0 bg-gray-900 bg-opacity-20 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-screen overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Crear Nuevo Usuario</h2>
                  <p className="text-sm text-gray-500">Complete los datos del nuevo usuario</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

          {success && (
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg shadow-sm">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold text-green-800">¡Usuario creado exitosamente!</p>
                  <p className="text-sm text-green-600">El usuario ha sido registrado en el sistema</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 rounded-lg shadow-sm">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-red-500 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold text-red-800">Error al crear usuario</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* DNI */}
              <div>
                <label htmlFor="dni" className="block text-sm font-medium text-gray-700 mb-1">
                  DNI *
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="12345678"
                />
              </div>

              {/* Nombres */}
              <div>
                <label htmlFor="nombres" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombres *
                </label>
                <input
                  type="text"
                  id="nombres"
                  name="nombres"
                  value={formData.nombres}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>

              {/* Apellidos */}
              <div>
                <label htmlFor="apellidos" className="block text-sm font-medium text-gray-700 mb-1">
                  Apellidos *
                </label>
                <input
                  type="text"
                  id="apellidos"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>

              {/* Email - Solo para roles que lo requieren */}
              {requiresEmailPhone && (
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </div>
              )}

              {/* Teléfono - Solo para roles que lo requieren */}
              {requiresEmailPhone && (
                <div>
                  <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </div>
              )}

              {/* Contraseña */}
              <div>
                <label htmlFor="passwordHash" className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña *
                </label>
                <input
                  type="password"
                  id="passwordHash"
                  name="passwordHash"
                  value={formData.passwordHash}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>

              {/* Confirmar Contraseña */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Contraseña *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>

              {/* Institución Educativa - Automática */}
              <div>
                <label htmlFor="ieId" className="block text-sm font-medium text-gray-700 mb-1">
                  Institución Educativa
                </label>
                <input
                  type="text"
                  id="ieId"
                  name="ieId"
                  value="Institución actual del administrador"
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">
                  El usuario será creado en tu misma institución educativa
                </p>
              </div>

              {/* Rol */}
              <div>
                <label htmlFor="roleId" className="block text-sm font-medium text-gray-700 mb-1">
                  Rol *
                </label>
                <select
                  id="roleId"
                  name="roleId"
                  value={selectedRoleId}
                  onChange={handleRoleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  disabled={rolesLoading}
                >
                  <option value="">Seleccionar rol</option>
                  {roles?.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  )) || []}
                </select>
              </div>
            </div>

            {/* Fecha de Nacimiento (solo para Estudiantes) */}
            {requiresFechaNacimiento && (
              <div>
                <label htmlFor="fechaNacimiento" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  Fecha de Nacimiento *
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
                    
                    // Calcular edad exacta
                    let exactAge = age
                    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
                      exactAge--
                    }
                    
                    // Validar rango de edad
                    if (exactAge < 6 || exactAge > 12) {
                      setError(`La edad del estudiante debe estar entre 6 y 12 años. Edad seleccionada: ${exactAge} años`)
                      // Limpiar grado si la edad no es válida
                      setFormData(prev => ({ ...prev, grado: '' }))
                    } else {
                      setError(null)
                      
                      // Asignar grado automáticamente según la edad
                      // 6 años = 1° grado, 7 años = 2° grado, etc.
                      const gradoAsignado = (exactAge - 5).toString()
                      setFormData(prev => ({ 
                        ...prev, 
                        fechaNacimiento: e.target.value,
                        grado: gradoAsignado 
                      }))
                      
                      console.log(`✅ Edad: ${exactAge} años → Grado asignado: ${gradoAsignado}°`)
                      return
                    }
                    
                    handleInputChange(e)
                  }}
                  required
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black transition-all"
                />
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Solo estudiantes entre 6 y 12 años
                </p>
              </div>
            )}

            {/* Aula - Grado y Sección (solo para Estudiantes) */}
            {isEstudiante && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="grado" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                    </svg>
                    Grado *
                    {formData.grado && formData.fechaNacimiento && (
                      <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Auto-asignado
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <select
                      id="grado"
                      name="grado"
                      value={formData.grado || ''}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black transition-all"
                    >
                      <option value="">Seleccionar grado</option>
                      <option value="1">1° Grado (6 años)</option>
                      <option value="2">2° Grado (7 años)</option>
                      <option value="3">3° Grado (8 años)</option>
                      <option value="4">4° Grado (9 años)</option>
                      <option value="5">5° Grado (10 años)</option>
                      <option value="6">6° Grado (11 años)</option>
                    </select>
                    {formData.grado && (
                      <div className="absolute inset-y-0 right-10 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {formData.fechaNacimiento && formData.grado && (
                    <p className="text-xs text-green-600 mt-1 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Grado asignado según fecha de nacimiento
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="seccion" className="block text-sm font-medium text-gray-700 mb-1">
                    Sección *
                  </label>
                  <select
                    id="seccion"
                    name="seccion"
                    value={formData.seccion || ''}
                    onChange={handleInputChange}
                    required
                    disabled={!formData.grado}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Seleccionar sección</option>
                    {availableSecciones.map(seccion => (
                      <option key={seccion} value={seccion}>{seccion}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Apoderado (solo para Estudiantes) */}
            {isEstudiante && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="searchApoderado" className="block text-sm font-medium text-gray-700 mb-1">
                    Buscar Apoderado
                  </label>
                  <input
                    type="text"
                    id="searchApoderado"
                    value={searchApoderado}
                    onChange={handleApoderadoSearch}
                    placeholder="Buscar por nombre, apellido o DNI..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </div>

                {filteredApoderados.length > 0 && (
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                    <div className="space-y-1 p-2">
                      {filteredApoderados.map((apoderado) => (
                        <div 
                          key={apoderado.id} 
                          className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                            formData.apoderadoId === apoderado.id ? 'bg-blue-50 border-blue-300' : ''
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, apoderadoId: apoderado.id }))}
                        >
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {apoderado.nombre} {apoderado.apellido}
                            </div>
                            <div className="text-sm text-gray-500">
                              DNI: {apoderado.dni}
                            </div>
                          </div>
                          {formData.apoderadoId === apoderado.id && (
                            <div className="text-blue-600">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {formData.apoderadoId && (
                  <div>
                    <label htmlFor="relacionApoderado" className="block text-sm font-medium text-gray-700 mb-1">
                      Relación con el Apoderado *
                    </label>
                    <select
                      id="relacionApoderado"
                      name="relacionApoderado"
                      value={formData.relacionApoderado || ''}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    >
                      <option value="">Seleccionar relación</option>
                      <option value="Padre/Madre">Padre/Madre</option>
                      <option value="Padre">Padre</option>
                      <option value="Madre">Madre</option>
                      <option value="Apoderado">Apoderado</option>
                      <option value="Tutor">Tutor</option>
                      <option value="Familiar">Familiar</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Especialidad (solo para Docentes) */}
            {requiresEspecialidad && (
              <div>
                <label htmlFor="especialidad" className="block text-sm font-medium text-gray-700 mb-1">
                  Especialidad *
                </label>
                <input
                  type="text"
                  id="especialidad"
                  name="especialidad"
                  value={formData.especialidad || ''}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Ej: Matemáticas, Comunicación, etc."
                />
              </div>
            )}

            {/* Ocupación (solo para Apoderados) */}
            {requiresOcupacion && (
              <div>
                <label htmlFor="ocupacion" className="block text-sm font-medium text-gray-700 mb-1">
                  Ocupación *
                </label>
                <input
                  type="text"
                  id="ocupacion"
                  name="ocupacion"
                  value={formData.ocupacion || ''}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>
            )}


            {/* Información sobre campos requeridos */}
            {selectedRoleId && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Campos requeridos para el rol seleccionado:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  {selectedRoleName === 'ESTUDIANTE' && (
                    <li>• <strong>Estudiante:</strong> DNI, nombres, apellidos, contraseña y fecha de nacimiento. Email y teléfono son opcionales.</li>
                  )}
                  {selectedRoleName === 'APODERADO' && (
                    <li>• <strong>Apoderado:</strong> DNI, nombres, apellidos, email, teléfono, contraseña y ocupación son obligatorios.</li>
                  )}
                  {selectedRoleName === 'DOCENTE' && (
                    <li>• <strong>Docente:</strong> DNI, nombres, apellidos, email, teléfono, contraseña y especialidad son obligatorios.</li>
                  )}
                  {selectedRoleName === 'ADMINISTRATIVO' && (
                    <li>• <strong>Administrativo:</strong> DNI, nombres, apellidos, email, teléfono y contraseña son obligatorios.</li>
                  )}
                  {selectedRoleName === 'AUXILIAR' && (
                    <li>• <strong>Auxiliar:</strong> DNI, nombres, apellidos, email, teléfono y contraseña son obligatorios.</li>
                  )}
                  {selectedRoleName === 'ADMIN' && (
                    <li>• <strong>Admin:</strong> DNI, nombres, apellidos, email, teléfono y contraseña son obligatorios.</li>
                  )}
                </ul>
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creando...' : 'Crear Usuario'}
              </button>
            </div>
          </form>
          </div>
        </div>
      </div>
    </>
  )
}
