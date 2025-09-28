import { useState, useEffect } from 'react'

interface DashboardStats {
  totalUsuarios: number
  totalEstudiantes: number
  totalDocentes: number
  totalApoderados: number
  totalTalleres: number
  asistenciasHoy: number
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsuarios: 0,
    totalEstudiantes: 0,
    totalDocentes: 0,
    totalApoderados: 0,
    totalTalleres: 0,
    asistenciasHoy: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación')
      }

      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Error al cargar estadísticas')
      }

      const result = await response.json()
      setStats(result.data)

    } catch (error) {
      console.error('Error loading dashboard stats:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  return {
    stats,
    loading,
    error,
    refetch: loadStats
  }
}
