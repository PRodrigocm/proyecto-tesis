'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    institucionEducativa: '',
    rol: ''
  })
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    institucionEducativa: '',
    rol: '',
    general: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isAdminDetected, setIsAdminDetected] = useState(false)
  const [showRoleSelection, setShowRoleSelection] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Mock data for dropdowns
  const institucionesEducativas = [
    { id: 1, nombre: 'I.E. María Auxiliadora' },
    { id: 2, nombre: 'I.E. San José' },
    { id: 3, nombre: 'I.E. Nuestra Señora de Fátima' },
    { id: 4, nombre: 'I.E. José Carlos Mariátegui' }
  ]

  const roles = [
    { id: 1, nombre: 'Administrativo' },
    { id: 2, nombre: 'Docente' },
    { id: 3, nombre: 'Apoderado' }
  ]

  // Función para detectar si es admin y manejar login inteligente
  const handleEmailPasswordSubmit = async () => {
    if (!formData.email || !formData.password) {
      setErrors(prev => ({
        ...prev,
        email: !formData.email ? 'El email es requerido' : '',
        password: !formData.password ? 'La contraseña es requerida' : ''
      }))
      return
    }

    setIsLoading(true)
    try {
      // Primero intentar login como ADMIN
      const adminResponse = await fetch('http://localhost:3001/api/auth/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      })

      if (adminResponse.ok) {
        const adminData = await adminResponse.json()
        localStorage.setItem('token', adminData.data.token)
        localStorage.setItem('user', JSON.stringify(adminData.data.user))
        router.push('/admin')
        return
      }

      // Si no es admin, mostrar selección de rol e institución
      setIsAdminDetected(false)
      setShowRoleSelection(true)
    } catch (error) {
      setErrors(prev => ({ ...prev, general: 'Error de conexión' }))
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors = { email: '', password: '', institucionEducativa: '', rol: '', general: '' }
    let isValid = true

    if (!formData.email) {
      newErrors.email = 'El email es requerido'
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido'
      isValid = false
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
      isValid = false
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
      isValid = false
    }

    if (showRoleSelection) {
      if (!formData.institucionEducativa) {
        newErrors.institucionEducativa = 'Debe seleccionar una institución educativa'
        isValid = false
      }

      if (!formData.rol) {
        newErrors.rol = 'Debe seleccionar un rol'
        isValid = false
      }
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!showRoleSelection) {
      await handleEmailPasswordSubmit()
      return
    }

    if (!validateForm()) return

    setIsLoading(true)
    
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          institucionEducativa: formData.institucionEducativa,
          rol: formData.rol
        })
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('token', data.data.token)
        localStorage.setItem('user', JSON.stringify(data.data.user))
        
        // Redirigir según el rol
        switch (data.data.user.rol) {
          case 'ADMINISTRATIVO':
            router.push('/administrativo')
            break
          case 'DOCENTE':
            router.push('/docente')
            break
          case 'APODERADO':
            router.push('/apoderado')
            break
          default:
            router.push('/dashboard')
        }
      } else {
        setErrors(prev => ({ ...prev, general: data.error || 'Error en el login' }))
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, general: 'Error de conexión' }))
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
        general: ''
      }))
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {showRoleSelection ? 'Selecciona tu Rol' : 'Iniciar Sesión'}
            </h2>
            <p className="text-gray-600">
              {showRoleSelection 
                ? 'Completa la información para acceder'
                : 'Ingresa tus credenciales para acceder'
              }
            </p>
          </div>

          {errors.general && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                    errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="tu@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                    errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {showRoleSelection && (
                <>
                  <div>
                    <label htmlFor="institucionEducativa" className="block text-sm font-medium text-gray-700 mb-1">
                      Institución Educativa
                    </label>
                    <select
                      id="institucionEducativa"
                      name="institucionEducativa"
                      value={formData.institucionEducativa}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                        errors.institucionEducativa ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Seleccione una institución</option>
                      {institucionesEducativas.map((ie) => (
                        <option key={ie.id} value={ie.id.toString()}>
                          {ie.nombre}
                        </option>
                      ))}
                    </select>
                    {errors.institucionEducativa && (
                      <p className="mt-1 text-sm text-red-600">{errors.institucionEducativa}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="rol" className="block text-sm font-medium text-gray-700 mb-1">
                      Rol
                    </label>
                    <select
                      id="rol"
                      name="rol"
                      value={formData.rol}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                        errors.rol ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Seleccione un rol</option>
                      {roles.map((rol) => (
                        <option key={rol.id} value={rol.nombre}>
                          {rol.nombre}
                        </option>
                      ))}
                    </select>
                    {errors.rol && (
                      <p className="mt-1 text-sm text-red-600">{errors.rol}</p>
                    )}
                  </div>
                </>
              )}
            </div>

            {showRoleSelection && (
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setShowRoleSelection(false)
                    setFormData(prev => ({ ...prev, institucionEducativa: '', rol: '' }))
                    setErrors({ email: '', password: '', institucionEducativa: '', rol: '', general: '' })
                  }}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  ← Volver
                </button>
                <div className="text-sm">
                  <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
              </div>
            )}

            {!showRoleSelection && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Recordarme
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Iniciando sesión...
                </div>
              ) : (
                showRoleSelection ? 'Continuar' : 'Iniciar Sesión'
              )}
            </button>

            {!showRoleSelection && (
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Sistema de Control de Asistencia Escolar
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
