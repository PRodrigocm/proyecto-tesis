import { useState, useEffect } from 'react'

export interface HorarioTaller {
  id: string
  tallerId: string
  taller: {
    nombre: string
    descripcion: string
    cupoMaximo: number
    inscritosCount: number
  }
  docenteId: string
  docente: {
    nombre: string
    apellido: string
    especialidad: string
  }
  diaSemana: 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES'
  horaInicio: string
  horaFin: string
  aula: string
  activo: boolean
}

export interface HorariosTallerFilters {
  taller: string
  docente: string
  diaSemana: string
  activo: 'TODOS' | 'ACTIVO' | 'INACTIVO'
}

export const useHorariosTaller = () => {
  const [horariosTaller, setHorariosTaller] = useState<HorarioTaller[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<HorariosTallerFilters>({
    taller: '',
    docente: '',
    diaSemana: '',
    activo: 'TODOS'
  })

  useEffect(() => {
    loadHorariosTaller()
  }, [])

  const loadHorariosTaller = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      
      if (filters.taller) params.append('taller', filters.taller)
      if (filters.docente) params.append('docente', filters.docente)
      if (filters.diaSemana) params.append('diaSemana', filters.diaSemana)
      if (filters.activo !== 'TODOS') params.append('activo', filters.activo === 'ACTIVO' ? 'true' : 'false')

      const response = await fetch(`/api/horarios-taller?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setHorariosTaller(data.data || [])
      } else {
        console.error('Error loading horarios taller')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredHorariosTaller = horariosTaller.filter(horario => {
    const matchesTaller = !filters.taller || horario.taller.nombre.toLowerCase().includes(filters.taller.toLowerCase())
    const matchesDocente = !filters.docente || 
      `${horario.docente.nombre} ${horario.docente.apellido}`.toLowerCase().includes(filters.docente.toLowerCase())
    const matchesDia = !filters.diaSemana || horario.diaSemana === filters.diaSemana
    const matchesActivo = filters.activo === 'TODOS' || 
      (filters.activo === 'ACTIVO' && horario.activo) ||
      (filters.activo === 'INACTIVO' && !horario.activo)

    return matchesTaller && matchesDocente && matchesDia && matchesActivo
  })

  const talleres = [...new Set(horariosTaller.map(h => h.taller.nombre))].filter(Boolean).sort()
  const docentes = [...new Set(horariosTaller.map(h => `${h.docente.nombre} ${h.docente.apellido}`))].filter(Boolean).sort()

  const crearHorarioTaller = async (data: {
    tallerId: string
    docenteId: string
    diaSemana: string
    horaInicio: string
    horaFin: string
    aula: string
  }) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/horarios-taller', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        loadHorariosTaller()
        return true
      }
      return false
    } catch (error) {
      console.error('Error creating horario taller:', error)
      return false
    }
  }

  const actualizarHorarioTaller = async (id: string, data: Partial<HorarioTaller>) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/horarios-taller/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        loadHorariosTaller()
        return true
      }
      return false
    } catch (error) {
      console.error('Error updating horario taller:', error)
      return false
    }
  }

  const eliminarHorarioTaller = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/horarios-taller/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        loadHorariosTaller()
        return true
      }
      return false
    } catch (error) {
      console.error('Error deleting horario taller:', error)
      return false
    }
  }

  const toggleActivo = async (id: string, activo: boolean) => {
    return actualizarHorarioTaller(id, { activo })
  }

  const updateFilters = (newFilters: Partial<HorariosTallerFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const stats = {
    total: filteredHorariosTaller.length,
    activos: filteredHorariosTaller.filter(h => h.activo).length,
    inactivos: filteredHorariosTaller.filter(h => !h.activo).length,
    talleres: talleres.length,
    docentes: docentes.length,
    totalInscritos: filteredHorariosTaller.reduce((sum, h) => sum + h.taller.inscritosCount, 0),
    cupoTotal: filteredHorariosTaller.reduce((sum, h) => sum + h.taller.cupoMaximo, 0)
  }

  return {
    horariosTaller: filteredHorariosTaller,
    loading,
    filters,
    talleres,
    docentes,
    stats,
    loadHorariosTaller,
    crearHorarioTaller,
    actualizarHorarioTaller,
    eliminarHorarioTaller,
    toggleActivo,
    updateFilters
  }
}
