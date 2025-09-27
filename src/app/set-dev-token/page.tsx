'use client'

import { useEffect, useState } from 'react'

export default function SetDevTokenPage() {
  const [tokenSet, setTokenSet] = useState(false)

  useEffect(() => {
    const currentToken = localStorage.getItem('token')
    setTokenSet(!!currentToken)
  }, [])

  const setDevToken = () => {
    localStorage.setItem('token', 'dev-token-123')
    setTokenSet(true)
    alert('✅ Token de desarrollo establecido!')
  }

  const clearToken = () => {
    localStorage.removeItem('token')
    setTokenSet(false)
    alert('🗑️ Token eliminado!')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          🔧 Token de Desarrollo
        </h1>
        
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Estado actual: {tokenSet ? (
                <span className="text-green-600 font-semibold">✅ Token establecido</span>
              ) : (
                <span className="text-red-600 font-semibold">❌ Sin token</span>
              )}
            </p>
          </div>

          <button
            onClick={setDevToken}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            🔑 Establecer Token de Desarrollo
          </button>

          <button
            onClick={clearToken}
            className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
          >
            🗑️ Limpiar Token
          </button>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h3 className="text-sm font-semibold text-yellow-800 mb-2">
              💡 Instrucciones:
            </h3>
            <ol className="text-xs text-yellow-700 space-y-1">
              <li>1. Haz clic en "Establecer Token de Desarrollo"</li>
              <li>2. Ve a la página de horarios</li>
              <li>3. Intenta crear un horario base</li>
              <li>4. Debería funcionar correctamente</li>
            </ol>
          </div>

          <div className="mt-4 text-center">
            <a 
              href="/admin/horarios" 
              className="text-blue-500 hover:text-blue-700 text-sm underline"
            >
              → Ir a Horarios
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
