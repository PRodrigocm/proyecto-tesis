'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Hook para gestionar notificaciones dinámicas del sistema
 * 
 * IMPORTANTE: Las notificaciones ahora se generan dinámicamente y NO se guardan en BD
 * - Se generan en tiempo real basadas en el estado actual del sistema
 * - Marcar como leída/eliminar solo afecta el estado local de la sesión
 * - Al recargar la página, las notificaciones se regeneran automáticamente
 * - Esto garantiza notificaciones siempre actualizadas sin ocupar espacio en BD
 */

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

      console.log('🔔 Obteniendo notificaciones dinámicas...')

      const response = await fetch('/api/notifications', {
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error('Error al obtener notificaciones')
      }

      const data = await response.json()
      const notificacionesDinamicas = data.notifications || []
      
      console.log('📋 Notificaciones dinámicas obtenidas:', notificacionesDinamicas.length)
      
      // Filtrar por opciones si se proporcionan
      let notificacionesFiltradas = notificacionesDinamicas
      
      if (opciones?.soloNoLeidas) {
        notificacionesFiltradas = notificacionesFiltradas.filter((n: Notificacion) => !n.isRead)
      }
      
      if (opciones?.tipo) {
        notificacionesFiltradas = notificacionesFiltradas.filter((n: Notificacion) => n.type === opciones.tipo)
      }
      
      if (opciones?.limite) {
        notificacionesFiltradas = notificacionesFiltradas.slice(0, opciones.limite)
      }

      setNotificaciones(notificacionesFiltradas)
      
      return notificacionesFiltradas
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
      console.log('🔢 Calculando conteo de notificaciones dinámicas...')
      
      const response = await fetch('/api/notifications', {
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error('Error al obtener conteo')
      }

      const data = await response.json()
      const notificacionesDinamicas = data.notifications || []
      
      // Contar solo las no leídas (las dinámicas siempre son no leídas)
      const countNoLeidas = notificacionesDinamicas.filter((n: Notificacion) => !n.isRead).length
      
      console.log('📊 Conteo calculado:', countNoLeidas, 'notificaciones no leídas')
      
      setCount(countNoLeidas)
      
      return countNoLeidas
    } catch (err) {
      console.error('Error al obtener conteo de notificaciones:', err)
      return 0
    }
  }, [getAuthHeaders])

  const marcarComoLeida = useCallback(async (id: string) => {
    try {
      console.log('✅ Marcando notificación como leída (solo local):', id)
      
      // Las notificaciones dinámicas solo se marcan como leídas localmente
      // No se guardan en BD, por lo que solo actualizamos el estado local
      
      // Actualizar estado local
      setNotificaciones(prev => 
        prev.map(notif => 
          notif.id === id 
            ? { ...notif, isRead: true }
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
  }, [])

  const marcarTodasComoLeidas = useCallback(async () => {
    try {
      console.log('✅ Marcando todas las notificaciones como leídas (solo local)')
      
      // Las notificaciones dinámicas solo se marcan como leídas localmente
      // No se guardan en BD, por lo que solo actualizamos el estado local

      // Actualizar estado local
      setNotificaciones(prev => 
        prev.map(notif => ({ 
          ...notif, 
          isRead: true
        }))
      )

      // Resetear conteo
      setCount(0)

      return true
    } catch (err) {
      console.error('Error al marcar todas como leídas:', err)
      return false
    }
  }, [])

  const eliminarNotificacion = useCallback(async (id: string) => {
    try {
      console.log('🗑️ Eliminando notificación (solo local):', id)
      
      // Las notificaciones dinámicas solo se eliminan localmente
      // No se guardan en BD, por lo que solo actualizamos el estado local

      // Actualizar estado local
      const notificacionEliminada = notificaciones.find(n => n.id === id)
      setNotificaciones(prev => prev.filter(notif => notif.id !== id))

      // Actualizar conteo si la notificación no estaba leída
      if (notificacionEliminada && !notificacionEliminada.isRead) {
        setCount(prev => Math.max(0, prev - 1))
      }

      return true
    } catch (err) {
      console.error('Error al eliminar notificación:', err)
      return false
    }
  }, [notificaciones])

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
