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

  const requiresEmailPhone = selectedRoleName === 'APODERADO' || selectedRoleName === 'DOCENTE' || selectedRoleName === 'ADMINISTRATIVO' || selectedRoleName === 'ADMIN'
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Crear Nuevo Usuario</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

          {success && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              Usuario creado exitosamente
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
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
                <label htmlFor="fechaNacimiento" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Nacimiento *
                </label>
                <input
                  type="date"
                  id="fechaNacimiento"
                  name="fechaNacimiento"
                  value={formData.fechaNacimiento || ''}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>
            )}

            {/* Aula - Grado y Sección (solo para Estudiantes) */}
            {isEstudiante && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="grado" className="block text-sm font-medium text-gray-700 mb-1">
                    Grado *
                  </label>
                  <select
                    id="grado"
                    name="grado"
                    value={formData.grado || ''}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  >
                    <option value="">Seleccionar grado</option>
                    <option value="1">1° Grado</option>
                    <option value="2">2° Grado</option>
                    <option value="3">3° Grado</option>
                    <option value="4">4° Grado</option>
                    <option value="5">5° Grado</option>
                    <option value="6">6° Grado</option>
                  </select>
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
