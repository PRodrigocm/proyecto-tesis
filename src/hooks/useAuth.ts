import { useState, useEffect } from 'react'
import { getCurrentUser, getCurrentToken, isAuthenticated, logoutCurrentSession } from '@/lib/multiSessionManager'

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
      // Usar el sistema de múltiples sesiones
      const userData = getCurrentUser()
      if (userData && isAuthenticated()) {
        setUser(userData)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Error loading user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const getInstitutionId = (): number => {
    if (!user) return 1 // Fallback por defecto
    return user.idIe || user.institucionId || 1
  }

  const getToken = (): string | null => {
    return getCurrentToken()
  }

  const logout = () => {
    logoutCurrentSession()
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
