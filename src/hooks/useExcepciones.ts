import { useState, useEffect } from 'react'

interface Excepcion {
  id: string
  fecha: string // YYYY-MM-DD
  fechaFin?: string // YYYY-MM-DD (para períodos como vacaciones)
  tipoExcepcion: 'FERIADO' | 'SUSPENSION_CLASES' | 'VACACIONES' | 'HORARIO_ESPECIAL' | 'CAPACITACION' | 'DIA_NO_LABORABLE' | 'OTRO'
  tipoHorario: 'CLASE' | 'AMBOS'
  motivo: string
  descripcion: string
  horaInicioAlt?: string // HH:MM
  horaFinAlt?: string // HH:MM
  activo: boolean
  institucion: string
  createdAt: string
}

interface CreateExcepcionData {
  fecha: string
  tipoExcepcion: string
  tipoHorario: string
  motivo: string
  descripcion?: string
  horaInicioAlt?: string
  horaFinAlt?: string
}

export const useExcepciones = (ieId?: number) => {
  const [excepciones, setExcepciones] = useState<Excepcion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadExcepciones = async (filtros?: { fecha?: string, tipo?: string }) => {
    if (!ieId) return

    setLoading(true)
    setError(null)
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación')
      }

      const params = new URLSearchParams({
        ieId: ieId.toString()
      })

      if (filtros?.fecha) {
        params.append('fecha', filtros.fecha)
      }

      if (filtros?.tipo) {
        params.append('tipo', filtros.tipo)
      }

      const response = await fetch(`/api/excepciones?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al cargar excepciones')
      }

      const data = await response.json()
      setExcepciones(data.data || [])

    } catch (error) {
      console.error('Error loading excepciones:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
      setExcepciones([])
    } finally {
      setLoading(false)
    }
  }

  const createExcepcion = async (excepcionData: CreateExcepcionData): Promise<boolean> => {
    if (!ieId) {
      setError('IE ID requerido')
      return false
    }

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación')
      }

      const response = await fetch('/api/excepciones', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ieId,
          ...excepcionData
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear excepción')
      }

      const result = await response.json()
      
      // Recargar la lista de excepciones
      await loadExcepciones()
      
      return true

    } catch (error) {
      console.error('Error creating excepción:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
      return false
    }
  }

  const updateExcepcion = async (id: string, excepcionData: Partial<CreateExcepcionData>): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación')
      }

      const response = await fetch(`/api/excepciones?id=${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(excepcionData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar excepción')
      }

      // Recargar la lista de excepciones
      await loadExcepciones()
      
      return true

    } catch (error) {
      console.error('Error updating excepción:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
      return false
    }
  }

  const deleteExcepcion = async (id: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación')
      }

      const response = await fetch(`/api/excepciones?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar excepción')
      }

      // Recargar la lista de excepciones
      await loadExcepciones()
      
      return true

    } catch (error) {
      console.error('Error deleting excepción:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
      return false
    }
  }

  const consultarSiHayClases = async (fecha: string, gradoSeccionId?: number) => {
    if (!ieId) return null

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación')
      }

      const params = new URLSearchParams({
        fecha,
        ieId: ieId.toString()
      })

      if (gradoSeccionId) {
        params.append('gradoSeccionId', gradoSeccionId.toString())
      }

      const response = await fetch(`/api/horarios/consulta?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Error al consultar horarios')
      }

      const data = await response.json()
      return data

    } catch (error) {
      console.error('Error consultando si hay clases:', error)
      return null
    }
  }

  // Cargar excepciones al montar el componente
  useEffect(() => {
    if (ieId) {
      loadExcepciones()
    }
  }, [ieId])

  return {
    excepciones,
    loading,
    error,
    loadExcepciones,
    createExcepcion,
    updateExcepcion,
    deleteExcepcion,
    consultarSiHayClases
  }
}
