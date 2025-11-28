import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface LoginFormData {
  email: string
  password: string
}

interface LoginErrors {
  email: string
  password: string
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
    password: ''
  })
  const [errors, setErrors] = useState<LoginErrors>({
    email: '',
    password: '',
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
    const newErrors: LoginErrors = { email: '', password: '', general: '' }
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

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Guardar sesión en localStorage
        localStorage.setItem('user', JSON.stringify(data.data.user))
        localStorage.setItem('token', data.data.token)
        
        // Redirigir según el rol
        switch (data.data.user.rol) {
          case 'ADMINISTRATIVO':
            router.push('/admin/dashboard')
            break
          case 'DOCENTE':
            router.push('/docente/dashboard')
            break
          case 'AUXILIAR':
            router.push('/auxiliar/dashboard')
            break
          case 'APODERADO':
            router.push('/apoderado/dashboard')
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
    setFormData({ email: '', password: '' })
    setErrors({ email: '', password: '', general: '' })
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
