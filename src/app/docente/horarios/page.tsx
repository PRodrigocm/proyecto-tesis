'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import HorariosDocente from '@/components/docente/HorariosDocente'
import CalendarioEscolar from '@/components/docente/CalendarioEscolar'

export default function HorariosPage() {
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <span className="text-gray-700 font-medium">Cargando horarios...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header mejorado */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-xl shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Horarios de Clase</h1>
              <p className="text-gray-600 text-sm">Gestiona tus horarios y tolerancias de asistencia</p>
            </div>
          </div>
        </div>

        {/* Layout con dos columnas */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <HorariosDocente />
          </div>
          <div className="xl:col-span-1">
            <CalendarioEscolar />
          </div>
        </div>

        {/* Información adicional - Colapsable */}
        <details className="mt-6 bg-white rounded-xl shadow-md overflow-hidden">
          <summary className="p-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xl">ℹ️</span>
              <span className="font-semibold text-gray-900">Información sobre Horarios</span>
            </div>
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="p-6 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
                  <span className="mr-2">⏰</span> Tolerancias
                </h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li><strong>0-5 min:</strong> Estricto</li>
                  <li><strong>10-15 min:</strong> Estándar</li>
                  <li><strong>20-30 min:</strong> Flexible</li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                  <span className="mr-2">📅</span> Tipos de Clase
                </h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li><strong>Regular:</strong> Clases normales</li>
                  <li><strong>Reforzamiento:</strong> Apoyo</li>
                  <li><strong>Evaluación:</strong> Exámenes</li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                  <span className="mr-2">📊</span> Vistas
                </h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li><strong>Lista:</strong> Detalles completos</li>
                  <li><strong>Calendario:</strong> Visual por días</li>
                  <li><strong>Filtros:</strong> Por materia/día</li>
                </ul>
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  )
}
