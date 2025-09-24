import { useState, useEffect } from 'react'

export interface HorarioGeneral {
  id: string
  nombre: string
  descripcion: string
  horaInicio: string
  horaFin: string
  tipo: 'RECREO' | 'ALMUERZO' | 'ENTRADA' | 'SALIDA' | 'ACTIVIDAD'
  sesion: 'AM' | 'PM' | 'AMBAS'
  diasSemana: string[]
  activo: boolean
  orden: number
}

export interface HorariosGeneralFilters {
  tipo: string
  sesion: 'TODOS' | 'AM' | 'PM' | 'AMBAS'
  activo: 'TODOS' | 'ACTIVO' | 'INACTIVO'
}

export const useHorariosGeneral = () => {
  const [horariosGeneral, setHorariosGeneral] = useState<HorarioGeneral[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<HorariosGeneralFilters>({
    tipo: '',
    sesion: 'TODOS',
    activo: 'TODOS'
  })

  useEffect(() => {
    loadHorariosGeneral()
  }, [])

  const loadHorariosGeneral = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      
      if (filters.tipo) params.append('tipo', filters.tipo)
      if (filters.sesion !== 'TODOS') params.append('sesion', filters.sesion)
      if (filters.activo !== 'TODOS') params.append('activo', filters.activo === 'ACTIVO' ? 'true' : 'false')

      const response = await fetch(`/api/horarios-general?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setHorariosGeneral(data.data || [])
      } else {
        console.error('Error loading horarios general')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredHorariosGeneral = horariosGeneral.filter(horario => {
    const matchesTipo = !filters.tipo || horario.tipo === filters.tipo
    const matchesSesion = filters.sesion === 'TODOS' || horario.sesion === filters.sesion || horario.sesion === 'AMBAS'
    const matchesActivo = filters.activo === 'TODOS' || 
      (filters.activo === 'ACTIVO' && horario.activo) ||
      (filters.activo === 'INACTIVO' && !horario.activo)

    return matchesTipo && matchesSesion && matchesActivo
  }).sort((a, b) => a.orden - b.orden)

  const crearHorarioGeneral = async (data: {
    nombre: string
    descripcion: string
    horaInicio: string
    horaFin: string
    tipo: string
    sesion: 'AM' | 'PM' | 'AMBAS'
    diasSemana: string[]
    orden: number
  }) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/horarios-general', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        loadHorariosGeneral()
        return true
      }
      return false
    } catch (error) {
      console.error('Error creating horario general:', error)
      return false
    }
  }

  const actualizarHorarioGeneral = async (id: string, data: Partial<HorarioGeneral>) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/horarios-general/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        loadHorariosGeneral()
        return true
      }
      return false
    } catch (error) {
      console.error('Error updating horario general:', error)
      return false
    }
  }

  const eliminarHorarioGeneral = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/horarios-general/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        loadHorariosGeneral()
        return true
      }
      return false
    } catch (error) {
      console.error('Error deleting horario general:', error)
      return false
    }
  }

  const toggleActivo = async (id: string, activo: boolean) => {
    return actualizarHorarioGeneral(id, { activo })
  }

  const updateFilters = (newFilters: Partial<HorariosGeneralFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const stats = {
    total: filteredHorariosGeneral.length,
    activos: filteredHorariosGeneral.filter(h => h.activo).length,
    inactivos: filteredHorariosGeneral.filter(h => !h.activo).length,
    am: filteredHorariosGeneral.filter(h => h.sesion === 'AM' || h.sesion === 'AMBAS').length,
    pm: filteredHorariosGeneral.filter(h => h.sesion === 'PM' || h.sesion === 'AMBAS').length
  }

  return {
    horariosGeneral: filteredHorariosGeneral,
    loading,
    filters,
    stats,
    loadHorariosGeneral,
    crearHorarioGeneral,
    actualizarHorarioGeneral,
    eliminarHorarioGeneral,
    toggleActivo,
    updateFilters
  }
}
