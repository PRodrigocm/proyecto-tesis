// Sistema de múltiples sesiones transparente - Solo backend
// No afecta la UI existente, permite múltiples sesiones para desarrollo

interface SessionData {
  sessionId: string
  user: any
  token: string
  timestamp: number
  tabId: string
}

class MultiSessionManager {
  private static instance: MultiSessionManager
  private currentTabId: string
  private sessions: Map<string, SessionData> = new Map()
  private isClient: boolean

  constructor() {
    this.isClient = typeof window !== 'undefined'
    this.currentTabId = this.generateTabId()
    if (this.isClient) {
      this.loadExistingSessions()
      this.setupStorageListener()
    }
  }

  static getInstance(): MultiSessionManager {
    if (!MultiSessionManager.instance) {
      MultiSessionManager.instance = new MultiSessionManager()
    }
    return MultiSessionManager.instance
  }

  private generateTabId(): string {
    // Generar ID único para esta pestaña
    const tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Guardar en sessionStorage (específico por pestaña) solo si estamos en el cliente
    if (this.isClient && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('tabId', tabId)
    }
    
    return tabId
  }

  private loadExistingSessions(): void {
    if (!this.isClient) return
    
    try {
      // Cargar sesiones existentes desde localStorage
      if (typeof localStorage !== 'undefined') {
        const storedSessions = localStorage.getItem('multiSessions')
        if (storedSessions) {
          const sessionsData = JSON.parse(storedSessions)
          this.sessions = new Map(Object.entries(sessionsData))
        }
      }

      // Cargar sesión de esta pestaña desde sessionStorage
      if (typeof sessionStorage !== 'undefined') {
        const currentSessionData = sessionStorage.getItem('currentTabSession')
        if (currentSessionData) {
          const sessionData = JSON.parse(currentSessionData)
          this.sessions.set(this.currentTabId, sessionData)
        }
      }
    } catch (error) {
      console.error('Error loading existing sessions:', error)
    }
  }

  private setupStorageListener(): void {
    if (!this.isClient || typeof window === 'undefined') return
    
    // Escuchar cambios en localStorage para sincronizar sesiones
    window.addEventListener('storage', (e) => {
      if (e.key === 'multiSessions') {
        this.loadExistingSessions()
      }
    })
  }

  private persistSessions(): void {
    if (!this.isClient || typeof localStorage === 'undefined') return
    
    try {
      // Guardar todas las sesiones en localStorage
      const sessionsObject = Object.fromEntries(this.sessions)
      localStorage.setItem('multiSessions', JSON.stringify(sessionsObject))
    } catch (error) {
      console.error('Error persisting sessions:', error)
    }
  }

  // Crear nueva sesión para esta pestaña
  createSession(user: any, token: string): void {
    const sessionData: SessionData = {
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user,
      token,
      timestamp: Date.now(),
      tabId: this.currentTabId
    }

    // Guardar en el mapa de sesiones
    this.sessions.set(this.currentTabId, sessionData)

    // Guardar en sessionStorage para esta pestaña (solo en cliente)
    if (this.isClient && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('currentTabSession', JSON.stringify(sessionData))
    }

    // Persistir todas las sesiones
    this.persistSessions()

    // Mantener compatibilidad con código existente (solo en cliente)
    if (this.isClient && typeof localStorage !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('token', token)
    }

    if (this.isClient) {
      console.log(`🔐 Session created for tab ${this.currentTabId}:`, {
        user: `${user.nombre} ${user.apellido}`,
        rol: user.rol,
        totalSessions: this.sessions.size
      })
    }
  }

  // Obtener sesión actual de esta pestaña
  getCurrentSession(): SessionData | null {
    return this.sessions.get(this.currentTabId) || null
  }

  // Obtener todas las sesiones activas
  getAllSessions(): SessionData[] {
    return Array.from(this.sessions.values())
  }

  // Verificar si hay sesión activa en esta pestaña
  hasActiveSession(): boolean {
    const session = this.getCurrentSession()
    if (!session) return false

    // Verificar que la sesión no haya expirado (24 horas)
    const now = Date.now()
    const sessionAge = now - session.timestamp
    const maxAge = 24 * 60 * 60 * 1000 // 24 horas

    return sessionAge < maxAge
  }

  // Obtener token de la sesión actual
  getCurrentToken(): string | null {
    const session = this.getCurrentSession()
    return session?.token || null
  }

  // Obtener usuario de la sesión actual
  getCurrentUser(): any | null {
    const session = this.getCurrentSession()
    return session?.user || null
  }

  // Cerrar sesión de esta pestaña
  logout(): void {
    // Eliminar sesión de esta pestaña
    this.sessions.delete(this.currentTabId)
    
    if (this.isClient && typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('currentTabSession')
    }

    // Si no hay más sesiones, limpiar localStorage
    if (this.sessions.size === 0) {
      if (this.isClient && typeof localStorage !== 'undefined') {
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        localStorage.removeItem('multiSessions')
      }
    } else {
      // Solo actualizar las sesiones restantes
      this.persistSessions()
    }

    if (this.isClient) {
      console.log(`🚪 Session closed for tab ${this.currentTabId}. Remaining sessions: ${this.sessions.size}`)
    }
  }

  // Limpiar sesiones expiradas
  cleanExpiredSessions(): void {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 horas

    for (const [tabId, session] of this.sessions.entries()) {
      const sessionAge = now - session.timestamp
      if (sessionAge >= maxAge) {
        this.sessions.delete(tabId)
        if (this.isClient) {
          console.log(`🗑️ Expired session removed for tab ${tabId}`)
        }
      }
    }

    this.persistSessions()
  }

  // Obtener información de debug
  getDebugInfo(): any {
    return {
      currentTabId: this.currentTabId,
      totalSessions: this.sessions.size,
      sessions: Array.from(this.sessions.entries()).map(([tabId, session]) => ({
        tabId,
        sessionId: session.sessionId,
        user: `${session.user.nombre} ${session.user.apellido}`,
        rol: session.user.rol,
        timestamp: new Date(session.timestamp).toLocaleString(),
        isCurrentTab: tabId === this.currentTabId
      }))
    }
  }
}

// Funciones de utilidad para usar en el código existente
let multiSessionManager: MultiSessionManager | null = null

// Función para obtener el manager de forma segura
const getManager = (): MultiSessionManager => {
  if (!multiSessionManager) {
    multiSessionManager = MultiSessionManager.getInstance()
  }
  return multiSessionManager
}

// Funciones compatibles con el código existente
export const saveUserSession = (user: any, token: string): void => {
  if (typeof window !== 'undefined') {
    getManager().createSession(user, token)
  }
}

export const getCurrentUser = (): any | null => {
  if (typeof window === 'undefined') return null
  return getManager().getCurrentUser()
}

export const getCurrentToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return getManager().getCurrentToken()
}

export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false
  return getManager().hasActiveSession()
}

export const logoutCurrentSession = (): void => {
  if (typeof window !== 'undefined') {
    getManager().logout()
  }
}

export const getAllActiveSessions = (): SessionData[] => {
  if (typeof window === 'undefined') return []
  return getManager().getAllSessions()
}

export const getSessionDebugInfo = (): any => {
  if (typeof window === 'undefined') return {}
  return getManager().getDebugInfo()
}

// Limpiar sesiones expiradas al cargar (solo en cliente)
if (typeof window !== 'undefined') {
  getManager().cleanExpiredSessions()
}

export { multiSessionManager }
export default getManager
