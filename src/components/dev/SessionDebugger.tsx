'use client'

import { useState, useEffect } from 'react'
import { getSessionDebugInfo, getAllActiveSessions } from '@/lib/multiSessionManager'

interface SessionDebuggerProps {
  show?: boolean
}

export default function SessionDebugger({ show = false }: SessionDebuggerProps) {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(show)

  useEffect(() => {
    if (isVisible) {
      loadDebugInfo()
      const interval = setInterval(loadDebugInfo, 2000) // Actualizar cada 2 segundos
      return () => clearInterval(interval)
    }
  }, [isVisible])

  const loadDebugInfo = () => {
    const info = getSessionDebugInfo()
    setDebugInfo(info)
  }

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV !== 'development' && !show) {
    return null
  }

  // Mostrar/ocultar con Ctrl+Shift+D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setIsVisible(!isVisible)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible])

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
          title="Mostrar debug de sesiones (Ctrl+Shift+D)"
        >
          Debug Sessions
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
      <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Session Debugger</h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">Ctrl+Shift+D</span>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
      </div>
      
      <div className="p-3">
        {debugInfo ? (
          <div className="space-y-3">
            {/* Información de la pestaña actual */}
            <div className="bg-blue-50 p-2 rounded text-xs">
              <div className="font-medium text-blue-900">Current Tab</div>
              <div className="text-blue-700">ID: {debugInfo.currentTabId}</div>
              <div className="text-blue-700">Total Sessions: {debugInfo.totalSessions}</div>
            </div>

            {/* Lista de sesiones */}
            <div>
              <div className="text-xs font-medium text-gray-700 mb-2">Active Sessions:</div>
              <div className="space-y-2">
                {debugInfo.sessions.map((session: any, index: number) => (
                  <div
                    key={session.tabId}
                    className={`p-2 rounded text-xs border ${
                      session.isCurrentTab 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">
                        {session.user} ({session.rol})
                      </div>
                      {session.isCurrentTab && (
                        <span className="bg-green-100 text-green-800 px-1 py-0.5 rounded text-xs">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-gray-600 mt-1">
                      <div>Tab: {session.tabId.split('_')[2]?.substring(0, 8)}...</div>
                      <div>Session: {session.sessionId.split('_')[2]?.substring(0, 8)}...</div>
                      <div>Time: {session.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Instrucciones */}
            <div className="bg-yellow-50 p-2 rounded text-xs">
              <div className="font-medium text-yellow-900">Developer Tips:</div>
              <div className="text-yellow-700 mt-1">
                • Open new tabs and login with different users<br/>
                • Each tab maintains its own session<br/>
                • Sessions persist until logout or expiration<br/>
                • Use localStorage/sessionStorage in DevTools to inspect
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-500">Loading debug info...</div>
        )}
      </div>
    </div>
  )
}
