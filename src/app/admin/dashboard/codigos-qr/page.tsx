'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import GeneradorQRPDF from '@/components/admin/GeneradorQRPDF'

export default function CodigosQRPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar autenticación
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token')
        const userString = localStorage.getItem('user')
        
        if (!token) {
          console.log('❌ No hay token, redirigiendo al login')
          router.push('/login')
          return
        }

        if (userString) {
          const user = JSON.parse(userString)
          console.log('👤 Usuario:', user)
          
          if (user.rol !== 'ADMINISTRATIVO') {
            console.log('❌ Usuario no es administrador:', user.rol)
            router.push('/login')
            return
          }
        } else {
          console.log('❌ No hay información de usuario')
          router.push('/login')
          return
        }
        
        console.log('✅ Autenticación verificada correctamente')
        setLoading(false)
      } catch (error) {
        console.error('❌ Error al verificar autenticación:', error)
        router.push('/login')
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              ← Volver
            </button>
            <h1 className="text-2xl font-bold text-black">Códigos QR de Estudiantes</h1>
          </div>
          <p className="text-black">
            Genera y descarga un PDF con todos los códigos QR de los estudiantes registrados en el sistema.
          </p>
        </div>

        {/* Generador de PDF */}
        <GeneradorQRPDF />

        {/* Instrucciones */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-black mb-4">📖 Instrucciones de uso:</h3>
          <div className="space-y-3 text-black">
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <p><strong>Cargar Estudiantes:</strong> Haz clic en "Cargar Estudiantes" para obtener la lista actualizada del sistema.</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <p><strong>Generar PDF:</strong> Una vez cargados, haz clic en "📄 Generar PDF" para crear el documento.</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <p><strong>Imprimir:</strong> El PDF se descargará automáticamente. Imprímelo en papel A4.</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
              <p><strong>Distribuir:</strong> Recorta las tarjetas y entrégalas a cada estudiante.</p>
            </div>
          </div>
        </div>

        {/* Características del PDF */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-black mb-4">✨ Características del PDF:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-black">📄 Formato:</h4>
              <ul className="text-sm text-black space-y-1">
                <li>• Tamaño: A4 (210 x 297 mm)</li>
                <li>• Orientación: Vertical</li>
                <li>• 8 tarjetas por página (2x4)</li>
                <li>• Márgenes optimizados</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-black">🏷️ Contenido de cada tarjeta:</h4>
              <ul className="text-sm text-black space-y-1">
                <li>• Código QR (40x40 mm)</li>
                <li>• Nombre del estudiante</li>
                <li>• Código único</li>
                <li>• Grado y sección</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
