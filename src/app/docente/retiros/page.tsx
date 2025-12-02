'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import RetirosDocente from '@/components/docente/RetirosDocente'

export default function RetirosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token')
        const userString = localStorage.getItem('user')
        
        if (!token) {
          router.push('/login')
          return
        }

        if (userString) {
          const user = JSON.parse(userString)
          if (!['DOCENTE', 'ADMINISTRATIVO'].includes(user.rol)) {
            router.push('/login')
            return
          }
        } else {
          router.push('/login')
          return
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Error al verificar autenticación:', error)
        router.push('/login')
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <span className="text-gray-700 font-medium">Cargando retiros...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header mejorado */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 p-3 rounded-xl shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Retiros</h1>
              <p className="text-gray-600 text-sm">Solicita y gestiona los retiros de estudiantes</p>
            </div>
          </div>
        </div>

        {/* Componente principal */}
        <RetirosDocente />

        {/* Información adicional - Colapsable */}
        <details className="mt-6 bg-white rounded-xl shadow-md overflow-hidden">
          <summary className="p-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xl">ℹ️</span>
              <span className="font-semibold text-gray-900">Información sobre Retiros</span>
            </div>
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="p-6 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100">
                <h4 className="font-semibold text-orange-900 mb-3 flex items-center">
                  <span className="mr-2">📋</span> Motivos de Retiro
                </h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-start"><span className="text-orange-500 mr-2">•</span><span><strong>Cita médica</strong></span></li>
                  <li className="flex items-start"><span className="text-orange-500 mr-2">•</span><span><strong>Emergencia familiar</strong></span></li>
                  <li className="flex items-start"><span className="text-orange-500 mr-2">•</span><span><strong>Malestar del estudiante</strong></span></li>
                  <li className="flex items-start"><span className="text-orange-500 mr-2">•</span><span><strong>Retiro autorizado</strong></span></li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                  <span className="mr-2">⚡</span> Estados del Retiro
                </h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-start"><span className="text-yellow-500 mr-2">⏳</span><span><strong>Pendiente:</strong> Esperando autorización</span></li>
                  <li className="flex items-start"><span className="text-green-500 mr-2">✓</span><span><strong>Autorizado:</strong> Listo para recoger</span></li>
                  <li className="flex items-start"><span className="text-red-500 mr-2">✗</span><span><strong>Rechazado:</strong> No autorizado</span></li>
                </ul>
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  )
}
