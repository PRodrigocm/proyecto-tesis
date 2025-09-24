import { useState, useEffect } from 'react'

export interface User {
  id: number
  nombre: string
  apellido: string
  email: string
  rol: string
  idIe?: number
  institucionId?: number
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = () => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const userData = JSON.parse(userStr)
        setUser(userData)
      }
    } catch (error) {
      console.error('Error loading user:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInstitutionId = (): number => {
    if (!user) return 1 // Fallback por defecto
    return user.idIe || user.institucionId || 1
  }

  const getToken = (): string | null => {
    return localStorage.getItem('token')
  }

  const logout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    setUser(null)
  }

  return {
    user,
    loading,
    getInstitutionId,
    getToken,
    logout,
    loadUser
  }
}
