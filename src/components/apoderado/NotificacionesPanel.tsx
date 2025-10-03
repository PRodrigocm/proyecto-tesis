'use client'

import { useState, useEffect } from 'react'

interface Notificacion {
  id: string
  tipo: 'RETIRO_PENDIENTE' | 'JUSTIFICACION_REQUERIDA' | 'RETIRO_APROBADO' | 'RETIRO_RECHAZADO'
  titulo: string
  mensaje: string
  fecha: string
  leida: boolean
  estudiante?: string
  urgente?: boolean
}

interface NotificacionesPanelProps {
  className?: string
}

export default function NotificacionesPanel({ className = '' }: NotificacionesPanelProps) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    loadNotificaciones()
  }, [])

  const loadNotificaciones = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/apoderados/notificaciones', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setNotificaciones(data.notificaciones || [])
      }
    } catch (error) {
      console.error('Error loading notificaciones:', error)
      // Datos simulados para demostración
      setNotificaciones([
        {
          id: '1',
          tipo: 'RETIRO_PENDIENTE',
          titulo: 'Retiro Pendiente de Aprobación',
          mensaje: 'Tienes una solicitud de retiro pendiente para Juan Pérez',
          fecha: new Date().toISOString(),
          leida: false,
          estudiante: 'Juan Pérez',
          urgente: true
        },
        {
          id: '2',
          tipo: 'JUSTIFICACION_REQUERIDA',
          titulo: 'Justificación Requerida',
          mensaje: 'Se requiere justificar la inasistencia del 01/10/2024',
          fecha: new Date(Date.now() - 86400000).toISOString(),
          leida: false,
          estudiante: 'María García'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const marcarComoLeida = async (notificacionId: string) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`/api/apoderados/notificaciones/${notificacionId}/leer`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      setNotificaciones(prev => 
        prev.map(notif => 
          notif.id === notificacionId 
            ? { ...notif, leida: true }
            : notif
        )
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'RETIRO_PENDIENTE':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      case 'JUSTIFICACION_REQUERIDA':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        )
      case 'RETIRO_APROBADO':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      case 'RETIRO_RECHAZADO':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
    }
  }

  const notificacionesNoLeidas = notificaciones.filter(n => !n.leida)
  const notificacionesMostrar = showAll ? notificaciones : notificaciones.slice(0, 5)

  if (loading) {
    return (
      <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white shadow rounded-lg ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Notificaciones
            {notificacionesNoLeidas.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {notificacionesNoLeidas.length}
              </span>
            )}
          </h3>
          {notificaciones.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showAll ? 'Ver menos' : 'Ver todas'}
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {notificacionesMostrar.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 17H6l5 5v-5zM7 7h10v10H7V7z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay notificaciones</h3>
            <p className="mt-1 text-sm text-gray-500">
              Todas las notificaciones están al día.
            </p>
          </div>
        ) : (
          notificacionesMostrar.map((notificacion) => (
            <div
              key={notificacion.id}
              className={`px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                !notificacion.leida ? 'bg-blue-50' : ''
              } ${notificacion.urgente ? 'border-l-4 border-red-400' : ''}`}
              onClick={() => marcarComoLeida(notificacion.id)}
            >
              <div className="flex space-x-3">
                {getIconoTipo(notificacion.tipo)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${
                      !notificacion.leida ? 'text-gray-900' : 'text-gray-600'
                    }`}>
                      {notificacion.titulo}
                      {notificacion.urgente && (
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Urgente
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(notificacion.fecha).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <p className={`text-sm ${
                    !notificacion.leida ? 'text-gray-700' : 'text-gray-500'
                  }`}>
                    {notificacion.mensaje}
                  </p>
                  {notificacion.estudiante && (
                    <p className="text-xs text-gray-500 mt-1">
                      Estudiante: {notificacion.estudiante}
                    </p>
                  )}
                  {!notificacion.leida && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Nueva
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {notificaciones.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <button
            onClick={() => {
              // Marcar todas como leídas
              notificaciones.forEach(notif => {
                if (!notif.leida) {
                  marcarComoLeida(notif.id)
                }
              })
            }}
            className="text-sm text-gray-600 hover:text-gray-800"
            disabled={notificacionesNoLeidas.length === 0}
          >
            Marcar todas como leídas
          </button>
        </div>
      )}
    </div>
  )
}
