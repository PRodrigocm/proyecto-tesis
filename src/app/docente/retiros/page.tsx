'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import RetirosDocente from '@/components/docente/RetirosDocente'

export default function RetirosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [showInfo, setShowInfo] = useState(false)

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
          
          if (!['DOCENTE', 'ADMINISTRATIVO'].includes(user.rol)) {
            console.log('❌ Usuario no tiene permisos:', user.rol)
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-4 flex items-center gap-3">
            <h1 className="text-2xl font-bold text-black">Gestión de Retiros</h1>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold hover:bg-blue-600 transition-colors"
              title="Información sobre retiros"
            >
              i
            </button>
          </div>
          <p className="text-black">
            Solicita y gestiona los retiros de estudiantes. Los apoderados deben autorizar cada solicitud de retiro.
          </p>
        </div>

        {/* Componente principal */}
        <RetirosDocente />

        {/* Información adicional (colapsable) */}
        {showInfo && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6 animate-fadeIn">
            <h3 className="text-lg font-semibold text-black mb-4">ℹ️ Información sobre Retiros</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-black mb-2">📋 Motivos Comunes de Retiro:</h4>
                <ul className="text-sm text-black space-y-1">
                  <li>• <strong>Cita médica:</strong> Consultas médicas programadas</li>
                  <li>• <strong>Emergencia familiar:</strong> Situaciones familiares urgentes</li>
                  <li>• <strong>Malestar del estudiante:</strong> Problemas de salud en clase</li>
                  <li>• <strong>Retiro temprano autorizado:</strong> Salida anticipada planificada</li>
                  <li>• <strong>Actividad extracurricular:</strong> Eventos fuera del horario</li>
                  <li>• <strong>Otro:</strong> Otras situaciones justificadas</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-black mb-2">⚡ Estados del Retiro:</h4>
                <ul className="text-sm text-black space-y-1">
                  <li>• <strong>Pendiente:</strong> Esperando autorización del apoderado</li>
                  <li>• <strong>Autorizado:</strong> Aprobado por el apoderado, listo para recoger</li>
                  <li>• <strong>Rechazado:</strong> No autorizado por el apoderado</li>
                  <li>• <strong>Completado:</strong> Estudiante retirado exitosamente</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-black mb-2">👨‍🏫 Responsabilidades del Docente:</h4>
                <ol className="text-sm text-black space-y-1">
                  <li><strong>1.</strong> Solicitar retiro cuando sea necesario</li>
                  <li><strong>2.</strong> Proporcionar información completa y precisa</li>
                  <li><strong>3.</strong> Especificar motivo y hora de retiro</li>
                  <li><strong>4.</strong> Indicar quién recogerá al estudiante</li>
                  <li><strong>5.</strong> Editar o cancelar retiros pendientes si es necesario</li>
                </ol>
              </div>
              
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-black mb-2">👨‍👩‍👧‍👦 Proceso de Autorización:</h4>
                <ol className="text-sm text-black space-y-1">
                  <li><strong>1.</strong> El docente solicita el retiro</li>
                  <li><strong>2.</strong> Se notifica al apoderado titular</li>
                  <li><strong>3.</strong> El apoderado revisa y autoriza/rechaza</li>
                  <li><strong>4.</strong> Si se autoriza, el estudiante puede ser retirado</li>
                  <li><strong>5.</strong> Se registra la salida como completada</li>
                </ol>
              </div>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-black mb-2">⚠️ Consideraciones Importantes:</h4>
              <ul className="text-sm text-black space-y-1">
                <li>• Solo los apoderados titulares pueden autorizar retiros</li>
                <li>• Los retiros autorizados o completados no se pueden editar</li>
                <li>• Es importante verificar la identidad de quien recoge al estudiante</li>
                <li>• Mantener registro completo de observaciones cuando sea necesario</li>
                <li>• Coordinar con la administración para retiros de emergencia</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
