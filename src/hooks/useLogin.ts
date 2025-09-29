import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface LoginFormData {
  email: string
  password: string
  institucionEducativa: string
  rol: string
}

interface LoginErrors {
  email: string
  password: string
  institucionEducativa: string
  rol: string
  general: string
}

interface Institution {
  id: string
  nombre: string
}

interface Role {
  id: string
  nombre: string
}

export const useLogin = () => {
  const router = useRouter()
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    institucionEducativa: '',
    rol: ''
  })
  const [errors, setErrors] = useState<LoginErrors>({
    email: '',
    password: '',
    institucionEducativa: '',
    rol: '',
    general: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showRoleSelection, setShowRoleSelection] = useState(true)
  const [institucionesEducativas, setInstitucionesEducativas] = useState<Institution[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const loadFormData = async () => {
    setLoadingData(true)
    try {
      const [institucionesResponse, rolesResponse] = await Promise.all([
        fetch('/api/instituciones'),
        fetch('/api/instituciones/roles')
      ])

      if (institucionesResponse.ok) {
        const institucionesData = await institucionesResponse.json()
        setInstitucionesEducativas(institucionesData || [])
      }

      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json()
        setRoles(rolesData || [])
      }
    } catch (error) {
      console.error('Error loading form data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  // Cargar datos al inicializar el hook
  useEffect(() => {
    loadFormData()
  }, [])

  const validateForm = () => {
    const newErrors: LoginErrors = { email: '', password: '', institucionEducativa: '', rol: '', general: '' }
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

    if (!formData.institucionEducativa) {
      newErrors.institucionEducativa = 'Debe seleccionar una institución educativa'
      isValid = false
    }

    if (!formData.rol) {
      newErrors.rol = 'Debe seleccionar un rol'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    
    try {
      console.log('🔐 Starting login process...')
      console.log('Form data:', {
        email: formData.email,
        institucionEducativa: formData.institucionEducativa,
        rol: formData.rol
      })

      // Login unificado para todos los roles
      const response = await fetch('/api/auth/login', {
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

      console.log('📡 Login response status:', response.status)
      const data = await response.json()
      console.log('📡 Login response data:', data)

      if (response.ok) {
        console.log('✅ Login successful!')
        localStorage.setItem('token', data.data.token)
        localStorage.setItem('user', JSON.stringify(data.data.user))
        
        // Debug: Log the user data to see what role is being returned
        console.log('👤 User data saved to localStorage:', data.data.user)
        console.log('🎭 User role:', data.data.user.rol)
        console.log('🎭 Role type:', typeof data.data.user.rol)
        
        // Redirigir según el rol
        console.log('🔄 Starting redirect logic...')
        switch (data.data.user.rol) {
          case 'ADMINISTRATIVO':
            console.log('🚀 Redirecting to admin dashboard...')
            router.push('/admin/dashboard')
            break
          case 'DOCENTE':
            console.log('🚀 Redirecting to docente dashboard...')
            router.push('/docente/dashboard')
            break
          case 'AUXILIAR':
            console.log('🚀 Redirecting to auxiliar dashboard...')
            router.push('/auxiliar/dashboard')
            break
          case 'APODERADO':
            console.log('🚀 Redirecting to apoderado dashboard...')
            router.push('/apoderado/dashboard')
            break
          default:
            console.log('🚀 Redirecting to default dashboard...')
            console.log('⚠️ Unrecognized role:', data.data.user.rol)
            router.push('/dashboard')
        }
      } else {
        console.log('❌ Login failed:', data.error)
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
    if (errors[name as keyof LoginErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
        general: ''
      }))
    }
  }

  const handleBack = () => {
    setShowRoleSelection(false)
    setFormData(prev => ({ ...prev, institucionEducativa: '', rol: '' }))
    setErrors({ email: '', password: '', institucionEducativa: '', rol: '', general: '' })
  }

  return {
    formData,
    errors,
    isLoading,
    showRoleSelection,
    institucionesEducativas,
    roles,
    loadingData,
    handleSubmit,
    handleChange,
    handleBack
  }
}
