'use client'

import { useState, useEffect } from 'react'
import { BellIcon } from '@heroicons/react/24/outline'
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid'

interface NotificacionesBadgeProps {
  className?: string
}

export default function NotificacionesBadge({ className = '' }: NotificacionesBadgeProps) {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotificacionesCount()
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchNotificacionesCount, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchNotificacionesCount = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/notificaciones?accion=contar', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCount(data.count || 0)
      }
    } catch (error) {
      console.error('Error al obtener conteo de notificaciones:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <BellIcon className="h-6 w-6 text-gray-400 animate-pulse" />
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {count > 0 ? (
        <BellSolidIcon className="h-6 w-6 text-blue-600" />
      ) : (
        <BellIcon className="h-6 w-6 text-gray-600" />
      )}
      
      {count > 0 && (
        <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-[1.25rem] h-5">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </div>
  )
}
