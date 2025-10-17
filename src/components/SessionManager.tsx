'use client'

import { useState, useEffect } from 'react'
import { useMultiSession, SessionData } from '@/hooks/useMultiSession'

interface SessionManagerProps {
  showSessions?: boolean
  onSessionChange?: (session: SessionData) => void
}

export default function SessionManager({ showSessions = false, onSessionChange }: SessionManagerProps) {
  const { 
    currentSession, 
    sessionId, 
    getAllActiveSessions, 
    switchSession, 
    logout 
  } = useMultiSession()
  
  const [activeSessions, setActiveSessions] = useState<SessionData[]>([])
  const [showSessionList, setShowSessionList] = useState(showSessions)

  useEffect(() => {
    loadSessions()
    
    // Actualizar cada 5 segundos para detectar nuevas sesiones
    const interval = setInterval(loadSessions, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadSessions = () => {
    const sessions = getAllActiveSessions()
    setActiveSessions(sessions)
  }

  const handleSwitchSession = (session: SessionData) => {
    switchSession(session)
    if (onSessionChange) {
      onSessionChange(session)
    }
  }

  const handleLogout = () => {
    logout()
    loadSessions()
  }

  if (!currentSession) {
    return null
  }

  return (
    <div className="relative">
      {/* Indicador de sesión actual */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium">
            {currentSession.user.nombre} {currentSession.user.apellido}
          </span>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {currentSession.user.rol}
          </span>
        </div>
        
        {activeSessions.length > 1 && (
          <button
            onClick={() => setShowSessionList(!showSessionList)}
            className="text-blue-600 hover:text-blue-800 text-xs underline"
            title={`${activeSessions.length} sesiones activas`}
          >
            {activeSessions.length} sesiones
          </button>
        )}
        
        <button
          onClick={handleLogout}
          className="text-red-600 hover:text-red-800 text-xs underline"
          title="Cerrar esta sesión"
        >
          Logout
        </button>
      </div>

      {/* Lista de sesiones activas */}
      {showSessionList && activeSessions.length > 1 && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Sesiones Activas</h3>
            <p className="text-xs text-gray-500">Gestiona tus sesiones abiertas</p>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {activeSessions.map((session, index) => (
              <div
                key={session.sessionId}
                className={`p-3 border-b border-gray-100 last:border-b-0 ${
                  session.sessionId === sessionId 
                    ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        session.sessionId === sessionId ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                      <span className="text-sm font-medium text-gray-900">
                        {session.user.nombre} {session.user.apellido}
                      </span>
                      {session.sessionId === sessionId && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Actual
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                        {session.user.rol}
                      </span>
                      <span>{session.user.email}</span>
                    </div>
                    
                    <div className="mt-1 text-xs text-gray-400">
                      Sesión: {session.sessionId.split('_')[2]?.substring(0, 6)}...
                      {session.timestamp && (
                        <span className="ml-2">
                          {new Date(session.timestamp).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {session.sessionId !== sessionId && (
                      <button
                        onClick={() => handleSwitchSession(session)}
                        className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded border border-blue-200 hover:bg-blue-50"
                      >
                        Cambiar
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        // Aquí podrías implementar logout de sesión específica
                        console.log('Logout session:', session.sessionId)
                      }}
                      className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded border border-red-200 hover:bg-red-50"
                      title="Cerrar esta sesión"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>ID de esta pestaña: {sessionId.split('_')[2]?.substring(0, 8)}...</span>
              <button
                onClick={() => setShowSessionList(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Overlay para cerrar el menú */}
      {showSessionList && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowSessionList(false)}
        ></div>
      )}
    </div>
  )
}
