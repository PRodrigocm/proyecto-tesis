import { useState, useEffect, useCallback } from 'react'

export interface User {
  id: number
  nombre: string
  apellido: string
  email: string
  rol: string
  idIe?: number
  institucionId?: number
}

export interface SessionData {
  sessionId: string
  user: User
  token: string
  timestamp: number
}

// Generar ID único para cada sesión/pestaña
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const useMultiSession = () => {
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionId] = useState(() => {
    // Verificar si ya existe una sesión en esta pestaña
    const existingSessionId = sessionStorage.getItem('sessionId')
    if (existingSessionId) {
      return existingSessionId
    }
    // Crear nueva sesión para esta pestaña
    const newSessionId = generateSessionId()
    sessionStorage.setItem('sessionId', newSessionId)
    return newSessionId
  })

  // Cargar sesión desde sessionStorage (específico de la pestaña)
  const loadSession = useCallback(() => {
    try {
      setLoading(true)
      
      // Buscar datos de sesión en sessionStorage
      const sessionData = sessionStorage.getItem('currentSession')
      if (sessionData) {
        const session: SessionData = JSON.parse(sessionData)
        
        // Verificar que la sesión no haya expirado (24 horas)
        const now = Date.now()
        const sessionAge = now - session.timestamp
        const maxAge = 24 * 60 * 60 * 1000 // 24 horas
        
        if (sessionAge < maxAge) {
          setCurrentSession(session)
          console.log('✅ Sesión cargada para pestaña:', sessionId)
        } else {
          console.log('⏰ Sesión expirada, limpiando...')
          clearSession()
        }
      } else {
        console.log('📭 No hay sesión activa en esta pestaña')
      }
    } catch (error) {
      console.error('❌ Error cargando sesión:', error)
      clearSession()
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  // Guardar nueva sesión
  const saveSession = (user: User, token: string) => {
    const sessionData: SessionData = {
      sessionId,
      user,
      token,
      timestamp: Date.now()
    }
    
    // Guardar en sessionStorage (específico de la pestaña)
    sessionStorage.setItem('currentSession', JSON.stringify(sessionData))
    
    // También mantener en localStorage para compatibilidad con código existente
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('token', token)
    
    setCurrentSession(sessionData)
    
    console.log('💾 Sesión guardada para pestaña:', sessionId)
    console.log('👤 Usuario:', user.nombre, user.apellido, '- Rol:', user.rol)
  }

  // Limpiar sesión actual
  const clearSession = () => {
    sessionStorage.removeItem('currentSession')
    
    // Solo limpiar localStorage si no hay otras pestañas activas
    const allSessions = getAllActiveSessions()
    if (allSessions.length === 0) {
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    }
    
    setCurrentSession(null)
    console.log('🗑️ Sesión limpiada para pestaña:', sessionId)
  }

  // Obtener todas las sesiones activas (de todas las pestañas)
  const getAllActiveSessions = (): SessionData[] => {
    const sessions: SessionData[] = []
    
    // Revisar localStorage para sesiones de otras pestañas
    try {
      // Esto es una aproximación - en un sistema real usarías IndexedDB o BroadcastChannel
      const storedUser = localStorage.getItem('user')
      const storedToken = localStorage.getItem('token')
      
      if (storedUser && storedToken) {
        // Hay al menos una sesión activa en localStorage
        sessions.push({
          sessionId: 'legacy',
          user: JSON.parse(storedUser),
          token: storedToken,
          timestamp: Date.now()
        })
      }
    } catch (error) {
      console.error('Error obteniendo sesiones activas:', error)
    }
    
    return sessions
  }

  // Verificar si el usuario está autenticado
  const isAuthenticated = (): boolean => {
    return currentSession !== null && currentSession.token !== null
  }

  // Obtener token de la sesión actual
  const getToken = (): string | null => {
    return currentSession?.token || null
  }

  // Obtener usuario de la sesión actual
  const getUser = (): User | null => {
    return currentSession?.user || null
  }

  // Obtener ID de institución
  const getInstitutionId = (): number => {
    const user = getUser()
    if (!user) return 1 // Fallback por defecto
    return user.idIe || user.institucionId || 1
  }

  // Logout de la sesión actual
  const logout = () => {
    clearSession()
  }

  // Cambiar a otra sesión (para futuras funcionalidades)
  const switchSession = (sessionData: SessionData) => {
    sessionStorage.setItem('currentSession', JSON.stringify(sessionData))
    setCurrentSession(sessionData)
    console.log('🔄 Cambiado a sesión:', sessionData.sessionId)
  }

  // Cargar sesión al inicializar
  useEffect(() => {
    loadSession()
  }, [loadSession])

  // Escuchar cambios en sessionStorage (por si se actualiza desde otro lugar)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentSession' && e.storageArea === sessionStorage) {
        loadSession()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [loadSession])

  return {
    // Estado de la sesión
    currentSession,
    sessionId,
    loading,
    
    // Métodos de autenticación
    isAuthenticated,
    getToken,
    getUser,
    getInstitutionId,
    
    // Gestión de sesiones
    saveSession,
    clearSession,
    logout,
    switchSession,
    loadSession,
    
    // Información de sesiones múltiples
    getAllActiveSessions
  }
}
