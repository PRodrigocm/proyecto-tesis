'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface RetiroPendiente {
  id: string
  fecha: string
  hora: string
  motivo: string
  observaciones: string
  tipoRetiro: string
  estado: string
  estudiante: {
    id: string
    nombre: string
    apellido: string
    dni: string
    grado: string
    seccion: string
  }
  solicitadoPor: string
  fechaSolicitud: string
}

export default function AprobarRetiros() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [retirosPendientes, setRetirosPendientes] = useState<RetiroPendiente[]>([])
  const [procesando, setProcesando] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token')
      const userString = localStorage.getItem('user')
      
      if (!token || !userString) {
        router.push('/login')
        return false
      }

      try {
        const user = JSON.parse(userString)
        if (user.rol !== 'APODERADO') {
          router.push('/login')
          return false
        }
        return true
      } catch (error) {
        router.push('/login')
        return false
      }
    }

    if (checkAuth()) {
      loadRetirosPendientes()
    }
  }, [router])

  const loadRetirosPendientes = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/apoderados/retiros/pendientes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setRetirosPendientes(data.retiros || [])
      }
    } catch (error) {
      console.error('Error loading retiros pendientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAprobarRetiro = async (retiroId: string) => {
    if (!confirm('¿Está seguro de que desea aprobar este retiro?')) {
      return
    }

    setProcesando(retiroId)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/apoderados/retiros/${retiroId}/aprobar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        alert('Retiro aprobado exitosamente')
        loadRetirosPendientes() // Recargar la lista
      } else {
        const error = await response.json()
        alert(`Error: ${error.message || 'No se pudo aprobar el retiro'}`)
      }
    } catch (error) {
      console.error('Error aprobando retiro:', error)
      alert('Error al aprobar el retiro')
    } finally {
      setProcesando(null)
    }
  }

  const handleRechazarRetiro = async (retiroId: string) => {
    const motivo = prompt('Ingrese el motivo del rechazo:')
    if (!motivo) return

    setProcesando(retiroId)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/apoderados/retiros/${retiroId}/rechazar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ motivo })
      })

      if (response.ok) {
        alert('Retiro rechazado')
        loadRetirosPendientes() // Recargar la lista
      } else {
        const error = await response.json()
        alert(`Error: ${error.message || 'No se pudo rechazar el retiro'}`)
      }
    } catch (error) {
      console.error('Error rechazando retiro:', error)
      alert('Error al rechazar el retiro')
    } finally {
      setProcesando(null)
    }
  }

  const getTipoRetiroColor = (tipo: string) => {
    switch (tipo) {
      case 'EMERGENCIA':
        return 'bg-red-100 text-red-800'
      case 'MEDICO':
        return 'bg-blue-100 text-blue-800'
      case 'FAMILIAR':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTipoRetiroLabel = (tipo: string) => {
    switch (tipo) {
      case 'TEMPRANO':
        return 'Retiro Temprano'
      case 'EMERGENCIA':
        return 'Emergencia'
      case 'MEDICO':
        return 'Cita Médica'
      case 'FAMILIAR':
        return 'Asunto Familiar'
      default:
        return tipo
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Aprobar Retiros</h1>
        <p className="mt-1 text-sm text-gray-600">
          Revisa y aprueba las solicitudes de retiro de tus hijos
        </p>
      </div>

      {retirosPendientes.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay retiros pendientes</h3>
            <p className="mt-1 text-sm text-gray-500">
              Todas las solicitudes de retiro han sido procesadas.
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/apoderado/dashboard')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Volver al Dashboard
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {retirosPendientes.map((retiro) => (
            <div key={retiro.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {retiro.estudiante.apellido}, {retiro.estudiante.nombre}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {retiro.estudiante.grado}° {retiro.estudiante.seccion} • DNI: {retiro.estudiante.dni}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTipoRetiroColor(retiro.tipoRetiro)}`}>
                    {getTipoRetiroLabel(retiro.tipoRetiro)}
                  </span>
                </div>
              </div>

              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Fecha y Hora del Retiro</label>
                      <p className="text-sm text-gray-900">
                        {new Date(retiro.fecha).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })} a las {retiro.hora}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Motivo</label>
                      <p className="text-sm text-gray-900">{retiro.motivo}</p>
                    </div>

                    {retiro.observaciones && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Observaciones</label>
                        <p className="text-sm text-gray-900">{retiro.observaciones}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Solicitado por</label>
                      <p className="text-sm text-gray-900">{retiro.solicitadoPor}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Fecha de Solicitud</label>
                      <p className="text-sm text-gray-900">
                        {new Date(retiro.fechaSolicitud).toLocaleDateString('es-ES')} a las{' '}
                        {new Date(retiro.fechaSolicitud).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Estado</label>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {retiro.estado}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => handleRechazarRetiro(retiro.id)}
                    disabled={procesando === retiro.id}
                    className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {procesando === retiro.id ? 'Procesando...' : 'Rechazar'}
                  </button>
                  <button
                    onClick={() => handleAprobarRetiro(retiro.id)}
                    disabled={procesando === retiro.id}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {procesando === retiro.id ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Procesando...
                      </div>
                    ) : (
                      'Aprobar Retiro'
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
