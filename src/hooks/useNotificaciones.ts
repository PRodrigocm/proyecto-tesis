'use client'

import { useState, useEffect, useCallback } from 'react'

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

interface UseNotificacionesOptions {
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useNotificaciones(options: UseNotificacionesOptions = {}) {
  const { autoRefresh = true, refreshInterval = 30000 } = options
  
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('No hay token de autenticación')
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, [])

  const fetchNotificaciones = useCallback(async (opciones?: {
    soloNoLeidas?: boolean
    limite?: number
    tipo?: string
  }) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (opciones?.soloNoLeidas) {
        params.append('soloNoLeidas', 'true')
      }
      if (opciones?.limite) {
        params.append('limite', opciones.limite.toString())
      }
      if (opciones?.tipo) {
        params.append('tipo', opciones.tipo)
      }

      const response = await fetch(`/api/notificaciones?${params}`, {
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error('Error al obtener notificaciones')
      }

      const data = await response.json()
      setNotificaciones(data.notificaciones || [])
      
      return data.notificaciones || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error al obtener notificaciones:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [getAuthHeaders])

  const fetchCount = useCallback(async () => {
    try {
      const response = await fetch('/api/notificaciones?accion=contar', {
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error('Error al obtener conteo')
      }

      const data = await response.json()
      setCount(data.count || 0)
      
      return data.count || 0
    } catch (err) {
      console.error('Error al obtener conteo de notificaciones:', err)
      return 0
    }
  }, [getAuthHeaders])

  const marcarComoLeida = useCallback(async (id: number) => {
    try {
      const response = await fetch(`/api/notificaciones/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error('Error al marcar como leída')
      }

      // Actualizar estado local
      setNotificaciones(prev => 
        prev.map(notif => 
          notif.id === id 
            ? { ...notif, leida: true, fechaLectura: new Date().toISOString() }
            : notif
        )
      )

      // Actualizar conteo
      setCount(prev => Math.max(0, prev - 1))

      return true
    } catch (err) {
      console.error('Error al marcar notificación como leída:', err)
      return false
    }
  }, [getAuthHeaders])

  const marcarTodasComoLeidas = useCallback(async () => {
    try {
      const response = await fetch('/api/notificaciones', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ accion: 'marcarTodasLeidas' })
      })

      if (!response.ok) {
        throw new Error('Error al marcar todas como leídas')
      }

      // Actualizar estado local
      setNotificaciones(prev => 
        prev.map(notif => ({ 
          ...notif, 
          leida: true, 
          fechaLectura: new Date().toISOString() 
        }))
      )

      // Resetear conteo
      setCount(0)

      return true
    } catch (err) {
      console.error('Error al marcar todas como leídas:', err)
      return false
    }
  }, [getAuthHeaders])

  const eliminarNotificacion = useCallback(async (id: number) => {
    try {
      const response = await fetch(`/api/notificaciones/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error('Error al eliminar notificación')
      }

      // Actualizar estado local
      const notificacionEliminada = notificaciones.find(n => n.id === id)
      setNotificaciones(prev => prev.filter(notif => notif.id !== id))

      // Actualizar conteo si la notificación no estaba leída
      if (notificacionEliminada && !notificacionEliminada.leida) {
        setCount(prev => Math.max(0, prev - 1))
      }

      return true
    } catch (err) {
      console.error('Error al eliminar notificación:', err)
      return false
    }
  }, [getAuthHeaders, notificaciones])

  const refresh = useCallback(() => {
    fetchCount()
    fetchNotificaciones()
  }, [fetchCount, fetchNotificaciones])

  // Efecto para cargar datos iniciales
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      fetchCount()
      fetchNotificaciones()
    }
  }, [fetchCount, fetchNotificaciones])

  // Efecto para auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      const token = localStorage.getItem('token')
      if (token) {
        fetchCount()
      }
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchCount])

  return {
    notificaciones,
    count,
    loading,
    error,
    fetchNotificaciones,
    fetchCount,
    marcarComoLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion,
    refresh
  }
}
