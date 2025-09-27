'use client'

import { useState } from 'react'

interface QuickLoginButtonProps {
  onLoginSuccess?: () => void
}

export default function QuickLoginButton({ onLoginSuccess }: QuickLoginButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleQuickLogin = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@sistema.com',
          password: 'admin123',
          institucionEducativa: '1',
          rol: 'ADMINISTRATIVO'
        })
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('token', data.data.token)
        localStorage.setItem('user', JSON.stringify(data.data.user))
        
        console.log('✅ Login rápido exitoso')
        alert('✅ Login exitoso!')
        
        if (onLoginSuccess) {
          onLoginSuccess()
        }
      } else {
        const error = await response.json()
        console.error('❌ Error en login rápido:', error)
        alert(`❌ Error: ${error.error}`)
      }
    } catch (error) {
      console.error('💥 Error de red:', error)
      alert('💥 Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleQuickLogin}
      disabled={loading}
      className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 text-sm"
    >
      {loading ? '⏳ Conectando...' : '🔑 Login Rápido'}
    </button>
  )
}
