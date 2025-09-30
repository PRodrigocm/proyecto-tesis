'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AutorizarRetiros from '@/components/apoderado/AutorizarRetiros'

export default function RetirosApoderadoPage() {
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
          
          if (user.rol !== 'APODERADO') {
            console.log('❌ Usuario no es apoderado:', user.rol)
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-black">Cargando retiros...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-black">Autorización de Retiros</h1>
          </div>
          <p className="text-black">
            Como apoderado titular, puedes autorizar o rechazar las solicitudes de retiro de tus hijos.
          </p>
        </div>

        {/* Componente principal */}
        <AutorizarRetiros />

        {/* Información adicional */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-black mb-4">📋 Guía para Apoderados</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-black mb-2">🔐 Tu Responsabilidad:</h4>
              <ul className="text-sm text-black space-y-1">
                <li>• <strong>Solo tú puedes autorizar:</strong> Como apoderado titular, eres el único que puede aprobar retiros</li>
                <li>• <strong>Verifica la información:</strong> Revisa cuidadosamente los detalles de cada solicitud</li>
                <li>• <strong>Confirma quien recoge:</strong> Asegúrate de que la persona indicada esté autorizada</li>
                <li>• <strong>Decisión final:</strong> Una vez autorizado o rechazado, no se puede cambiar</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-black mb-2">⚡ Proceso de Autorización:</h4>
              <ol className="text-sm text-black space-y-1">
                <li><strong>1.</strong> El docente solicita el retiro de tu hijo</li>
                <li><strong>2.</strong> Recibes la notificación de la solicitud</li>
                <li><strong>3.</strong> Revisas los detalles (motivo, hora, persona que recoge)</li>
                <li><strong>4.</strong> Autorizas o rechazas según consideres apropiado</li>
                <li><strong>5.</strong> El colegio procede según tu decisión</li>
              </ol>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-black mb-2">✅ Cuándo Autorizar:</h4>
              <ul className="text-sm text-black space-y-1">
                <li>• Citas médicas programadas</li>
                <li>• Emergencias familiares reales</li>
                <li>• Malestar del estudiante confirmado</li>
                <li>• Actividades familiares importantes</li>
                <li>• Cuando confías en quien lo recogerá</li>
              </ul>
            </div>
            
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-black mb-2">❌ Cuándo Rechazar:</h4>
              <ul className="text-sm text-black space-y-1">
                <li>• Motivo no justificado suficientemente</li>
                <li>• No conoces a la persona que recogerá</li>
                <li>• Dudas sobre la veracidad del motivo</li>
                <li>• El estudiante debe permanecer en clases</li>
                <li>• Información incompleta o confusa</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-black mb-2">📞 Contacto de Emergencia:</h4>
            <p className="text-sm text-black">
              Si tienes dudas sobre una solicitud de retiro o necesitas más información, 
              puedes contactar directamente al colegio o al docente que realizó la solicitud. 
              Es importante que te sientas seguro antes de autorizar cualquier retiro.
            </p>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-black mb-2">⚠️ Recordatorios Importantes:</h4>
            <ul className="text-sm text-black space-y-1">
              <li>• <strong>Identidad:</strong> La persona que recoge debe presentar DNI</li>
              <li>• <strong>Horarios:</strong> Respeta los horarios establecidos por el colegio</li>
              <li>• <strong>Comunicación:</strong> Mantén comunicación con el colegio sobre cambios</li>
              <li>• <strong>Seguridad:</strong> La seguridad de tu hijo es la prioridad</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
