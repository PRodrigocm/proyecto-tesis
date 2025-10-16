/**
 * Sistema de Sesiones Múltiples para Desarrollo
 * Permite que diferentes roles inicien sesión en pestañas separadas sin interferir
 */

export interface SessionData {
  token: string
  user: any
  timestamp: number
  tabId: string
}

export interface MultiSessionStorage {
  [role: string]: SessionData
}

/**
 * Genera un ID único para la pestaña actual
 */
function generateTabId(): string {
  return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Obtiene el ID de la pestaña actual (lo crea si no existe)
 */
function getCurrentTabId(): string {
  if (typeof window === 'undefined') return 'server'
  
  let tabId = sessionStorage.getItem('tabId')
  if (!tabId) {
    tabId = generateTabId()
    sessionStorage.setItem('tabId', tabId)
  }
  return tabId
}

/**
 * Verifica si las sesiones múltiples están habilitadas
 */
function isMultiSessionEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('dev_multi_session') === 'enabled'
}

/**
 * Habilita las sesiones múltiples (solo para desarrollo)
 */
export function enableMultiSession(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('dev_multi_session', 'enabled')
  console.log('🔧 Sesiones múltiples habilitadas para desarrollo')
}

/**
 * Deshabilita las sesiones múltiples
 */
export function disableMultiSession(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('dev_multi_session')
  // Limpiar todas las sesiones múltiples
  const keys = Object.keys(localStorage).filter(key => key.startsWith('session_'))
  keys.forEach(key => localStorage.removeItem(key))
  console.log('🔧 Sesiones múltiples deshabilitadas')
}

/**
 * Guarda una sesión para un rol específico
 */
export function setRoleSession(role: string, token: string, user: any): void {
  if (typeof window === 'undefined') return
  
  const tabId = getCurrentTabId()
  
  if (isMultiSessionEnabled()) {
    // Modo sesiones múltiples: guardar por rol
    const sessionData: SessionData = {
      token,
      user,
      timestamp: Date.now(),
      tabId
    }
    
    localStorage.setItem(`session_${role.toLowerCase()}`, JSON.stringify(sessionData))
    console.log(`🔧 Sesión guardada para rol: ${role} en pestaña: ${tabId}`)
  } else {
    // Modo normal: usar localStorage estándar
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
  }
}

/**
 * Obtiene la sesión para un rol específico
 */
export function getRoleSession(role: string): SessionData | null {
  if (typeof window === 'undefined') return null
  
  if (isMultiSessionEnabled()) {
    // Modo sesiones múltiples: obtener por rol
    const sessionStr = localStorage.getItem(`session_${role.toLowerCase()}`)
    if (!sessionStr) return null
    
    try {
      return JSON.parse(sessionStr) as SessionData
    } catch {
      return null
    }
  } else {
    // Modo normal: usar localStorage estándar
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    
    if (!token || !userStr) return null
    
    try {
      return {
        token,
        user: JSON.parse(userStr),
        timestamp: Date.now(),
        tabId: getCurrentTabId()
      }
    } catch {
      return null
    }
  }
}

/**
 * Obtiene la sesión activa para la pestaña actual
 */
export function getCurrentSession(): SessionData | null {
  if (typeof window === 'undefined') return null
  
  if (isMultiSessionEnabled()) {
    // En modo multi-sesión, buscar la sesión que corresponde a esta pestaña
    const tabId = getCurrentTabId()
    const sessionKeys = Object.keys(localStorage).filter(key => key.startsWith('session_'))
    
    for (const key of sessionKeys) {
      const sessionStr = localStorage.getItem(key)
      if (!sessionStr) continue
      
      try {
        const session = JSON.parse(sessionStr) as SessionData
        if (session.tabId === tabId) {
          return session
        }
      } catch {
        continue
      }
    }
    
    return null
  } else {
    // Modo normal
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    
    if (!token || !userStr) return null
    
    try {
      return {
        token,
        user: JSON.parse(userStr),
        timestamp: Date.now(),
        tabId: getCurrentTabId()
      }
    } catch {
      return null
    }
  }
}

/**
 * Elimina la sesión de un rol específico
 */
export function removeRoleSession(role: string): void {
  if (typeof window === 'undefined') return
  
  if (isMultiSessionEnabled()) {
    localStorage.removeItem(`session_${role.toLowerCase()}`)
    console.log(`🔧 Sesión eliminada para rol: ${role}`)
  } else {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}

/**
 * Lista todas las sesiones activas (solo en modo multi-sesión)
 */
export function listActiveSessions(): { role: string; user: any; tabId: string; timestamp: number }[] {
  if (typeof window === 'undefined' || !isMultiSessionEnabled()) return []
  
  const sessions: { role: string; user: any; tabId: string; timestamp: number }[] = []
  const sessionKeys = Object.keys(localStorage).filter(key => key.startsWith('session_'))
  
  for (const key of sessionKeys) {
    const role = key.replace('session_', '')
    const sessionStr = localStorage.getItem(key)
    
    if (!sessionStr) continue
    
    try {
      const session = JSON.parse(sessionStr) as SessionData
      sessions.push({
        role: role.toUpperCase(),
        user: session.user,
        tabId: session.tabId,
        timestamp: session.timestamp
      })
    } catch {
      continue
    }
  }
  
  return sessions.sort((a, b) => b.timestamp - a.timestamp)
}

/**
 * Limpia sesiones expiradas (más de 24 horas)
 */
export function cleanExpiredSessions(): void {
  if (typeof window === 'undefined') return
  
  const now = Date.now()
  const maxAge = 24 * 60 * 60 * 1000 // 24 horas
  
  const sessionKeys = Object.keys(localStorage).filter(key => key.startsWith('session_'))
  
  for (const key of sessionKeys) {
    const sessionStr = localStorage.getItem(key)
    if (!sessionStr) continue
    
    try {
      const session = JSON.parse(sessionStr) as SessionData
      if (now - session.timestamp > maxAge) {
        localStorage.removeItem(key)
        console.log(`🧹 Sesión expirada eliminada: ${key}`)
      }
    } catch {
      localStorage.removeItem(key)
    }
  }
}

/**
 * Hook para detectar cambios en las sesiones
 */
export function onSessionChange(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  
  const handler = (e: StorageEvent) => {
    if (e.key?.startsWith('session_') || e.key === 'token' || e.key === 'user') {
      callback()
    }
  }
  
  window.addEventListener('storage', handler)
  
  return () => {
    window.removeEventListener('storage', handler)
  }
}
