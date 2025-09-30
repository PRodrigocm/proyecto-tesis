'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import JustificacionesDocente from '@/components/docente/JustificacionesDocente'

export default function JustificacionesPage() {
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
          <span className="text-black">Cargando justificaciones...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-black">Justificaciones de Estudiantes</h1>
          </div>
          <p className="text-black">
            Gestiona las justificaciones presentadas por los estudiantes. Puedes aprobar o rechazar cada solicitud.
          </p>
        </div>

        {/* Componente principal */}
        <JustificacionesDocente />

        {/* Información adicional */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-black mb-4">ℹ️ Información sobre Justificaciones</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-black mb-2">📋 Tipos de Justificación:</h4>
              <ul className="text-sm text-black space-y-1">
                <li>• <strong>Médica:</strong> Citas médicas, enfermedades, tratamientos</li>
                <li>• <strong>Familiar:</strong> Emergencias familiares, viajes urgentes</li>
                <li>• <strong>Personal:</strong> Asuntos personales importantes</li>
                <li>• <strong>Académica:</strong> Participación en eventos académicos</li>
                <li>• <strong>Otro:</strong> Otras situaciones justificadas</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-black mb-2">⚡ Acciones Disponibles:</h4>
              <ul className="text-sm text-black space-y-1">
                <li>• <strong>Aprobar:</strong> La justificación es válida y se acepta</li>
                <li>• <strong>Rechazar:</strong> La justificación no cumple los criterios</li>
                <li>• <strong>Observaciones:</strong> Agregar comentarios sobre la decisión</li>
                <li>• <strong>Filtros:</strong> Buscar por estado, estudiante o motivo</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-black mb-2">🔄 Proceso de Revisión:</h4>
            <ol className="text-sm text-black space-y-1">
              <li><strong>1.</strong> El estudiante o apoderado presenta la justificación</li>
              <li><strong>2.</strong> El docente revisa la documentación y motivos</li>
              <li><strong>3.</strong> Se aprueba o rechaza con observaciones opcionales</li>
              <li><strong>4.</strong> Si se aprueba, las asistencias se marcan como justificadas automáticamente</li>
              <li><strong>5.</strong> El estudiante y apoderado reciben notificación del resultado</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
