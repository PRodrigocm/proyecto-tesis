'use client'

import { useState, useEffect } from 'react'

interface Retiro {
  id: string
  fecha: string
  horaRetiro: string
  motivo: string
  observaciones?: string
  personaRecoge?: string
  dniPersonaRecoge?: string
  estado: string
  estudiante: {
    id: string
    nombre: string
    apellido: string
    dni: string
    grado: string
    seccion: string
  }
  solicitadoPor?: {
    nombre: string
    apellido: string
  }
}

export default function AutorizarRetiros() {
  const [retiros, setRetiros] = useState<Retiro[]>([])
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState<string | null>(null)
  const [modalRetiro, setModalRetiro] = useState<Retiro | null>(null)
  const [observacionesAutorizacion, setObservacionesAutorizacion] = useState('')

  useEffect(() => {
    loadRetiros()
  }, [])

  const loadRetiros = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      // Cargar solo retiros pendientes de los hijos del apoderado
      const response = await fetch('/api/retiros?estado=PENDIENTE', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setRetiros(data.data || [])
      } else {
        // Datos de ejemplo para desarrollo
        setRetiros([
          {
            id: '1',
            fecha: '2024-01-20',
            horaRetiro: '14:30',
            motivo: 'Cita médica',
            observaciones: 'Control médico programado',
            personaRecoge: 'María González',
            dniPersonaRecoge: '12345678',
            estado: 'PENDIENTE',
            estudiante: {
              id: '1',
              nombre: 'Juan Carlos',
              apellido: 'Pérez García',
              dni: '87654321',
              grado: '3',
              seccion: 'A'
            },
            solicitadoPor: {
              nombre: 'Ana',
              apellido: 'Rodríguez'
            }
          },
          {
            id: '2',
            fecha: '2024-01-21',
            horaRetiro: '11:00',
            motivo: 'Emergencia familiar',
            observaciones: 'Situación familiar urgente',
            estado: 'PENDIENTE',
            estudiante: {
              id: '2',
              nombre: 'María Elena',
              apellido: 'Pérez García',
              dni: '11223344',
              grado: '1',
              seccion: 'B'
            },
            solicitadoPor: {
              nombre: 'Carlos',
              apellido: 'López'
            }
          }
        ])
      }
    } catch (error) {
      console.error('Error loading retiros:', error)
      setRetiros([])
    } finally {
      setLoading(false)
    }
  }

  const handleAutorizar = (retiro: Retiro, autorizado: boolean) => {
    setModalRetiro(retiro)
    setObservacionesAutorizacion('')
    // Aquí podrías abrir un modal de confirmación
    confirmarAutorizacion(retiro, autorizado)
  }

  const confirmarAutorizacion = async (retiro: Retiro, autorizado: boolean) => {
    try {
      setProcesando(retiro.id)
      const token = localStorage.getItem('token')
      
      const response = await fetch(`/api/retiros/${retiro.id}/autorizar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          autorizado,
          observaciones: observacionesAutorizacion.trim() || undefined
        })
      })

      if (response.ok) {
        console.log(`✅ Retiro ${autorizado ? 'autorizado' : 'rechazado'} exitosamente`)
        await loadRetiros() // Recargar la lista
        setModalRetiro(null)
      } else {
        const errorData = await response.json()
        console.error('❌ Error al autorizar retiro:', errorData)
        alert(`Error: ${errorData.error || 'No se pudo procesar la autorización'}`)
      }
    } catch (error) {
      console.error('❌ Error al autorizar retiro:', error)
      alert('Error de conexión. Por favor, intenta nuevamente.')
    } finally {
      setProcesando(null)
    }
  }

  const formatearFecha = (fecha: string) => {
    // Extraer solo la parte de la fecha (YYYY-MM-DD) para evitar problemas de zona horaria
    const fechaStr = fecha.split('T')[0]
    const [year, month, day] = fechaStr.split('-').map(Number)
    const date = new Date(year, month - 1, day) // Crear fecha local
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatearHora = (hora: string) => {
    return hora.slice(0, 5) // HH:MM
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-black">Cargando retiros pendientes...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-black mb-2">Autorización de Retiros</h2>
        <p className="text-black">
          Revisa y autoriza las solicitudes de retiro de tus hijos. Solo tú puedes autorizar estos retiros.
        </p>
      </div>

      {/* Estadísticas */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{retiros.length}</div>
            <div className="text-sm text-black">Retiros Pendientes</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {retiros.filter(r => r.horaRetiro < '12:00').length}
            </div>
            <div className="text-sm text-black">Retiros Matutinos</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {retiros.filter(r => r.horaRetiro >= '12:00').length}
            </div>
            <div className="text-sm text-black">Retiros Vespertinos</div>
          </div>
        </div>
      </div>

      {/* Lista de retiros */}
      <div className="p-6">
        {retiros.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-6xl mb-4">✅</div>
            <h3 className="text-lg font-medium text-black mb-2">No hay retiros pendientes</h3>
            <p className="text-black">
              Actualmente no tienes solicitudes de retiro esperando tu autorización.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {retiros.map((retiro) => (
              <div
                key={retiro.id}
                className="border-2 border-yellow-200 rounded-lg p-6 bg-yellow-50 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Información principal */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-bold text-black">
                        Retiro de {retiro.estudiante.nombre} {retiro.estudiante.apellido}
                      </h3>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
                        {retiro.estudiante.grado}° {retiro.estudiante.seccion}
                      </span>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full font-medium">
                        ⏳ PENDIENTE
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-white p-3 rounded-lg border">
                        <span className="font-medium text-black block">📅 Fecha y hora:</span>
                        <p className="text-black capitalize">{formatearFecha(retiro.fecha)}</p>
                        <p className="text-black font-medium">{formatearHora(retiro.horaRetiro)}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border">
                        <span className="font-medium text-black block">📝 Motivo:</span>
                        <p className="text-black">{retiro.motivo}</p>
                      </div>
                    </div>

                    {retiro.personaRecoge && (
                      <div className="bg-white p-3 rounded-lg border mb-4">
                        <span className="font-medium text-black block">👤 Persona que recogerá:</span>
                        <p className="text-black">
                          {retiro.personaRecoge}
                          {retiro.dniPersonaRecoge && ` (DNI: ${retiro.dniPersonaRecoge})`}
                        </p>
                      </div>
                    )}

                    {retiro.observaciones && (
                      <div className="bg-white p-3 rounded-lg border mb-4">
                        <span className="font-medium text-black block">💬 Observaciones:</span>
                        <p className="text-black">{retiro.observaciones}</p>
                      </div>
                    )}

                    {retiro.solicitadoPor && (
                      <div className="text-sm text-black">
                        <span className="font-medium">Solicitado por:</span>
                        <span className="ml-2">
                          {retiro.solicitadoPor.nombre} {retiro.solicitadoPor.apellido}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col gap-3 min-w-[200px]">
                    <button
                      onClick={() => handleAutorizar(retiro, true)}
                      disabled={procesando === retiro.id}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      {procesando === retiro.id ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Procesando...
                        </span>
                      ) : (
                        '✅ Autorizar Retiro'
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleAutorizar(retiro, false)}
                      disabled={procesando === retiro.id}
                      className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      ❌ Rechazar Retiro
                    </button>

                    <div className="text-xs text-black text-center mt-2 p-2 bg-white rounded border">
                      <strong>⚠️ Importante:</strong><br />
                      Una vez autorizado o rechazado, no podrás cambiar tu decisión.
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <h4 className="font-medium text-black mb-3">ℹ️ Información importante:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-black">
          <div>
            <h5 className="font-medium mb-2">✅ Al autorizar un retiro:</h5>
            <ul className="space-y-1">
              <li>• El estudiante podrá ser retirado a la hora indicada</li>
              <li>• Debes asegurar que alguien autorizado lo recoja</li>
              <li>• Es importante verificar la identidad de quien recoge</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-2">❌ Al rechazar un retiro:</h5>
            <ul className="space-y-1">
              <li>• El estudiante permanecerá en clases</li>
              <li>• El docente será notificado del rechazo</li>
              <li>• Puedes agregar observaciones sobre el motivo</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
