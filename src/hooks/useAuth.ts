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
      if (typeof window === 'undefined') {
        setLoading(false)
        return
      }
      
      const userStr = localStorage.getItem('user')
      const token = localStorage.getItem('token')
      
      if (userStr && token) {
        const userData = JSON.parse(userStr)
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
    if (!user) return 1
    return user.idIe || user.institucionId || 1
  }

  const getToken = (): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('token')
  }

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    }
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
