'use client'

import { useEffect } from 'react'
import { 
  XMarkIcon, 
  CheckIcon, 
  InformationCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BellIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline'
import { useNotificaciones } from '@/hooks/useNotificaciones'

interface Notificacion {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
  relatedTo?: string
  actionUrl?: string
}

interface NotificacionesPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function NotificacionesPanel({ isOpen, onClose }: NotificacionesPanelProps) {
  const { 
    notificaciones, 
    loading, 
    fetchNotificaciones, 
    marcarComoLeida, 
    marcarTodasComoLeidas, 
    eliminarNotificacion 
  } = useNotificaciones()

  useEffect(() => {
    if (isOpen) {
      fetchNotificaciones()
    }
  }, [isOpen, fetchNotificaciones])

  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />
      case 'success':
        return <CheckIcon className="h-5 w-5 text-green-500" />
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
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

          {/* Acciones */}
          <div className="border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Notificaciones dinámicas del sistema
              </div>
              
              {notificaciones.some(n => !n.isRead) && (
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
                      !notificacion.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getIconoTipo(notificacion.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${
                            !notificacion.isRead ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notificacion.title}
                          </p>
                          
                          <div className="flex items-center space-x-1">
                            {!notificacion.isRead && (
                              <button
                                onClick={() => marcarComoLeida(notificacion.id)}
                                className="text-blue-600 hover:text-blue-700"
                                title="Marcar como leída"
                              >
                                <CheckIcon className="h-4 w-4" />
                              </button>
                            )}
                            
                            {notificacion.actionUrl && (
                              <button
                                onClick={() => window.open(notificacion.actionUrl, '_blank')}
                                className="text-blue-600 hover:text-blue-700"
                                title="Ir a la acción"
                              >
                                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
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
                          {notificacion.message}
                        </p>
                        
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                          <span>{formatearFecha(notificacion.createdAt)}</span>
                          {notificacion.relatedTo && (
                            <span className="bg-gray-100 px-2 py-1 rounded">
                              {notificacion.relatedTo}
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
