'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function QuickLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const quickLogin = async () => {
    setLoading(true)
    setMessage('Intentando login...')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'admin@test.com',
          password: 'admin123',
          institucionEducativa: '1',
          rol: 'ADMINISTRATIVO'
        })
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('token', data.data.token)
        localStorage.setItem('user', JSON.stringify(data.data.user))
        setMessage('✅ Login exitoso! Token guardado.')
        
        setTimeout(() => {
          router.push('/admin/horarios')
        }, 1500)
      } else {
        setMessage(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setMessage(`💥 Error de conexión: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const checkCurrentToken = () => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    
    if (token && user) {
      setMessage(`✅ Ya tienes token activo\nUsuario: ${JSON.parse(user).email}`)
    } else {
      setMessage('❌ No hay token activo')
    }
  }

  const clearToken = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setMessage('🗑️ Token eliminado')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          🚀 Quick Login
        </h1>
        
        <div className="space-y-4">
          <button
            onClick={quickLogin}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {loading ? '⏳ Cargando...' : '🔑 Login como Admin'}
          </button>

          <button
            onClick={checkCurrentToken}
            className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          >
            🔍 Verificar Token Actual
          </button>

          <button
            onClick={clearToken}
            className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
          >
            🗑️ Limpiar Token
          </button>

          {message && (
            <div className="mt-4 p-3 bg-gray-100 border border-gray-300 rounded-md">
              <pre className="text-sm whitespace-pre-wrap">{message}</pre>
            </div>
          )}

          <div className="mt-6 text-center">
            <a 
              href="/admin/horarios" 
              className="text-blue-500 hover:text-blue-700 text-sm underline"
            >
              → Ir a Horarios
            </a>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h3 className="text-sm font-semibold text-yellow-800 mb-2">
              💡 Instrucciones:
            </h3>
            <ol className="text-xs text-yellow-700 space-y-1">
              <li>1. Haz clic en "Login como Admin"</li>
              <li>2. Ve a la página de horarios</li>
              <li>3. Intenta crear un horario base</li>
              <li>4. Debería funcionar con autenticación real</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
