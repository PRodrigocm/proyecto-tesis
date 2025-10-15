'use client'

import { useState, useEffect } from 'react'
import { 
  XMarkIcon, 
  CheckIcon, 
  InformationCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BellIcon
} from '@heroicons/react/24/outline'

interface Notificacion {
  id: number
  titulo: string
  mensaje: string
  tipo: string
  leida: boolean
  fechaEnvio: string
  fechaLectura: string | null
  origen: string | null
}

interface NotificacionesPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function NotificacionesPanel({ isOpen, onClose }: NotificacionesPanelProps) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'todas' | 'noLeidas'>('todas')

  useEffect(() => {
    if (isOpen) {
      fetchNotificaciones()
    }
  }, [isOpen, filter])

  const fetchNotificaciones = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) return

      const params = new URLSearchParams()
      if (filter === 'noLeidas') {
        params.append('soloNoLeidas', 'true')
      }
      params.append('limite', '20')

      const response = await fetch(`/api/notificaciones?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setNotificaciones(data.notificaciones || [])
      }
    } catch (error) {
      console.error('Error al obtener notificaciones:', error)
    } finally {
      setLoading(false)
    }
  }

  const marcarComoLeida = async (id: number) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/notificaciones/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setNotificaciones(prev => 
          prev.map(notif => 
            notif.id === id 
              ? { ...notif, leida: true, fechaLectura: new Date().toISOString() }
              : notif
          )
        )
      }
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error)
    }
  }

  const marcarTodasComoLeidas = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/notificaciones', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ accion: 'marcarTodasLeidas' })
      })

      if (response.ok) {
        setNotificaciones(prev => 
          prev.map(notif => ({ 
            ...notif, 
            leida: true, 
            fechaLectura: new Date().toISOString() 
          }))
        )
      }
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error)
    }
  }

  const eliminarNotificacion = async (id: number) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/notificaciones/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setNotificaciones(prev => prev.filter(notif => notif.id !== id))
      }
    } catch (error) {
      console.error('Error al eliminar notificación:', error)
    }
  }

  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'ALERTA':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      case 'RETIRO':
        return <UserGroupIcon className="h-5 w-5 text-orange-500" />
      case 'ASISTENCIA':
        return <ClockIcon className="h-5 w-5 text-blue-500" />
      case 'JUSTIFICACION':
        return <AcademicCapIcon className="h-5 w-5 text-purple-500" />
      case 'RECORDATORIO':
        return <BellIcon className="h-5 w-5 text-yellow-500" />
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) {
      return 'Hace unos minutos'
    } else if (diffHours < 24) {
      return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`
    } else if (diffDays < 7) {
      return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`
    } else {
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-900">Notificaciones</h2>
            <button
              onClick={onClose}
              className="rounded-md p-2 text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Filtros y acciones */}
          <div className="border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilter('todas')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    filter === 'todas'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFilter('noLeidas')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    filter === 'noLeidas'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  No leídas
                </button>
              </div>
              
              {notificaciones.some(n => !n.leida) && (
                <button
                  onClick={marcarTodasComoLeidas}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>
          </div>

          {/* Lista de notificaciones */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : notificaciones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <BellIcon className="h-12 w-12 mb-2" />
                <p>No hay notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notificaciones.map((notificacion) => (
                  <div
                    key={notificacion.id}
                    className={`p-4 hover:bg-gray-50 ${
                      !notificacion.leida ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getIconoTipo(notificacion.tipo)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${
                            !notificacion.leida ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notificacion.titulo}
                          </p>
                          
                          <div className="flex items-center space-x-1">
                            {!notificacion.leida && (
                              <button
                                onClick={() => marcarComoLeida(notificacion.id)}
                                className="text-blue-600 hover:text-blue-700"
                                title="Marcar como leída"
                              >
                                <CheckIcon className="h-4 w-4" />
                              </button>
                            )}
                            
                            <button
                              onClick={() => eliminarNotificacion(notificacion.id)}
                              className="text-gray-400 hover:text-red-500"
                              title="Eliminar"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        
                        <p className="mt-1 text-sm text-gray-600">
                          {notificacion.mensaje}
                        </p>
                        
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                          <span>{formatearFecha(notificacion.fechaEnvio)}</span>
                          {notificacion.origen && (
                            <span className="bg-gray-100 px-2 py-1 rounded">
                              {notificacion.origen}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
