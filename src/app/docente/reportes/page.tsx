'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ReportesDocente from '@/components/docente/ReportesDocente'

export default function ReportesPage() {
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <span className="text-gray-700 font-medium">Cargando reportes...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header mejorado */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-gradient-to-br from-teal-500 to-cyan-600 p-3 rounded-xl shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reportes de Asistencia</h1>
              <p className="text-gray-600 text-sm">Genera reportes detallados con exportación en múltiples formatos</p>
            </div>
          </div>
        </div>

        {/* Componente principal */}
        <ReportesDocente />

        {/* Información adicional - Colapsable */}
        <details className="mt-6 bg-white rounded-xl shadow-md overflow-hidden">
          <summary className="p-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xl">ℹ️</span>
              <span className="font-semibold text-gray-900">Información sobre Reportes</span>
            </div>
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="p-6 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-100">
                <h4 className="font-semibold text-teal-900 mb-3 flex items-center">
                  <span className="mr-2">📊</span> Tipos
                </h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li><strong>Semanal</strong></li>
                  <li><strong>Mensual</strong></li>
                  <li><strong>Personalizado</strong></li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                  <span className="mr-2">📄</span> Formatos
                </h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li><strong>PDF</strong> - Presentaciones</li>
                  <li><strong>Excel</strong> - Análisis</li>
                  <li><strong>Word</strong> - Editable</li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                  <span className="mr-2">📈</span> Datos
                </h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li><strong>Asistencias</strong></li>
                  <li><strong>Tardanzas</strong></li>
                  <li><strong>Estadísticas</strong></li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
                  <span className="mr-2">🎯</span> Normas APA
                </h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li><strong>Formato</strong> estándar</li>
                  <li><strong>Referencias</strong></li>
                  <li><strong>Metadatos</strong></li>
                </ul>
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  )
}
