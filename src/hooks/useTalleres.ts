import { useState, useEffect } from 'react'

export interface Taller {
  id: string
  codigo?: string
  nombre: string
  descripcion?: string
  instructor?: string
  capacidadMaxima?: number
  activo: boolean
  inscripciones: number
  fechaCreacion: string
  fechaActualizacion?: string
}

export interface TallerStats {
  total: number
  activos: number
  inactivos: number
  totalInscripciones: number
}

export interface EstudianteInscripcion {
  id: string
  nombre: string
  apellido: string
  dni: string
  grado: string
  seccion: string
  fechaInscripcion: string
  estado: string
}

export const useTalleres = () => {
  const [talleres, setTalleres] = useState<Taller[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<TallerStats>({
    total: 0,
    activos: 0,
    inactivos: 0,
    totalInscripciones: 0
  })

  useEffect(() => {
    loadTalleres()
  }, [])

  const loadTalleres = async () => {
    console.log('🔄 useTalleres: Iniciando carga de talleres')
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/talleres', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('📡 Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Talleres cargados:', data)
        setTalleres(data.data || [])
        
        // Calcular estadísticas
        const talleresData = data.data || []
        const newStats = {
          total: talleresData.length,
          activos: talleresData.filter((t: Taller) => t.activo).length,
          inactivos: talleresData.filter((t: Taller) => !t.activo).length,
          totalInscripciones: talleresData.reduce((sum: number, t: Taller) => sum + t.inscripciones, 0)
        }
        setStats(newStats)
      } else {
        console.error('❌ Error loading talleres:', response.status)
      }
    } catch (error) {
      console.error('💥 Error en loadTalleres:', error)
    } finally {
      setLoading(false)
    }
  }

  const crearTaller = async (data: {
    nombre: string
    descripcion?: string
    docentesIds?: string[]
    estudiantesIds?: string[]
    capacidadMaxima?: number
    horarios?: {
      diaSemana: number
      horaInicio: string
      horaFin: string
      lugar?: string
    }[]
  }) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/talleres', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await loadTalleres() // Recargar la lista
        return true
      } else {
        const error = await response.json()
        console.error('Error creando taller:', error)
        return false
      }
    } catch (error) {
      console.error('Error:', error)
      return false
    }
  }

  const actualizarTaller = async (tallerId: string, data: any) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/talleres/${tallerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await loadTalleres() // Recargar la lista
        return true
      } else {
        const error = await response.json()
        console.error('Error actualizando taller:', error)
        return false
      }
    } catch (error) {
      console.error('Error:', error)
      return false
    }
  }

  const eliminarTaller = async (tallerId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/talleres/${tallerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await loadTalleres() // Recargar la lista
        return true
      } else {
        const error = await response.json()
        console.error('Error eliminando taller:', error)
        return false
      }
    } catch (error) {
      console.error('Error:', error)
      return false
    }
  }

  const inscribirEstudiante = async (tallerId: string, estudianteId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/talleres/${tallerId}/inscripciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estudianteId })
      })

      if (response.ok) {
        await loadTalleres() // Recargar la lista
        return true
      } else {
        const error = await response.json()
        console.error('Error inscribiendo estudiante:', error)
        return false
      }
    } catch (error) {
      console.error('Error:', error)
      return false
    }
  }

  const desinscribirEstudiante = async (tallerId: string, estudianteId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/talleres/${tallerId}/inscripciones/${estudianteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await loadTalleres() // Recargar la lista
        return true
      } else {
        const error = await response.json()
        console.error('Error desinscribiendo estudiante:', error)
        return false
      }
    } catch (error) {
      console.error('Error:', error)
      return false
    }
  }

  const obtenerInscripciones = async (tallerId: string): Promise<EstudianteInscripcion[]> => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/talleres/${tallerId}/inscripciones`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        return data.data || []
      } else {
        console.error('Error obteniendo inscripciones')
        return []
      }
    } catch (error) {
      console.error('Error:', error)
      return []
    }
  }

  return {
    talleres,
    loading,
    stats,
    loadTalleres,
    crearTaller,
    actualizarTaller,
    eliminarTaller,
    inscribirEstudiante,
    desinscribirEstudiante,
    obtenerInscripciones
  }
}
