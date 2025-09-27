import { useState, useEffect } from 'react'

interface HorarioBase {
  id: string
  idGradoSeccion: number
  grado: string
  seccion: string
  diaSemana: string
  diaNumero: number
  horaInicio: string // HH:MM
  horaFin: string // HH:MM
  aula: string
  docente: string
  tipoActividad: string
  toleranciaMin: number
  activo: boolean
  createdAt: string
}

interface CreateHorarioBaseData {
  idGradoSeccion: string
  horaInicio: string
  horaFin: string
  aula?: string
  idDocente?: string
  toleranciaMin: string
}

export const useHorariosBase = (ieId?: number) => {
  const [horariosBase, setHorariosBase] = useState<HorarioBase[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadHorariosBase = async (gradoSeccionId?: number) => {
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

      if (gradoSeccionId) {
        params.append('gradoSeccionId', gradoSeccionId.toString())
      }

      const response = await fetch(`/api/horarios/base?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al cargar horarios base')
      }

      const data = await response.json()
      setHorariosBase(data.data || [])

    } catch (error) {
      console.error('Error loading horarios base:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
      setHorariosBase([])
    } finally {
      setLoading(false)
    }
  }

  const createHorarioBase = async (horarioData: CreateHorarioBaseData): Promise<boolean> => {
    if (!ieId) {
      console.error('❌ Error: IE ID requerido')
      setError('IE ID requerido')
      return false
    }

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('❌ Error: No hay token de autenticación')
        throw new Error('No hay token de autenticación')
      }

      console.log('🚀 === INICIANDO CREACIÓN DE HORARIO BASE ===')
      console.log('📋 Datos recibidos:', {
        idGradoSeccion: horarioData.idGradoSeccion,
        horaInicio: horarioData.horaInicio,
        horaFin: horarioData.horaFin,
        aula: horarioData.aula || 'Sin especificar',
        toleranciaMin: horarioData.toleranciaMin,
        ieId: ieId
      })

      const requestBody = {
        idGradoSeccion: horarioData.idGradoSeccion,
        horaInicio: horarioData.horaInicio,
        horaFin: horarioData.horaFin,
        aula: horarioData.aula,
        idDocente: horarioData.idDocente,
        toleranciaMin: horarioData.toleranciaMin
      }

      console.log('📤 Enviando request a API:', requestBody)

      const response = await fetch('/api/horarios/base', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      console.log('📡 Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Error en API:', errorData)
        throw new Error(errorData.error || 'Error al crear horario base')
      }

      const result = await response.json()
      console.log('✅ === HORARIO BASE CREADO EXITOSAMENTE ===')
      console.log('📊 Resultado de la API:', result)
      console.log('🎯 Detalles:', {
        gradoSeccion: result.data?.gradoSeccion,
        horario: result.data?.horario,
        dias: result.data?.dias,
        horariosCreados: result.data?.horariosCreados
      })
      
      console.log('🔄 Recargando lista de horarios...')
      await loadHorariosBase()
      console.log('✅ Lista de horarios actualizada')
      
      return true

    } catch (error) {
      console.error('❌ === ERROR AL CREAR HORARIO BASE ===')
      console.error('💥 Error details:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
      return false
    }
  }

  const updateHorarioBase = async (id: string, horarioData: Partial<CreateHorarioBaseData>): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación')
      }

      const response = await fetch(`/api/horarios/base?id=${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(horarioData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar horario base')
      }

      // Recargar la lista de horarios
      await loadHorariosBase()
      
      return true

    } catch (error) {
      console.error('Error updating horario base:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
      return false
    }
  }

  const deleteHorarioBase = async (id: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación')
      }

      const response = await fetch(`/api/horarios/base?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar horario base')
      }

      // Recargar la lista de horarios
      await loadHorariosBase()
      
      return true

    } catch (error) {
      console.error('Error deleting horario base:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
      return false
    }
  }

  // Cargar horarios al montar el componente
  useEffect(() => {
    if (ieId) {
      loadHorariosBase()
    }
  }, [ieId])

  return {
    horariosBase,
    loading,
    error,
    loadHorariosBase,
    createHorarioBase,
    updateHorarioBase,
    deleteHorarioBase
  }
}
