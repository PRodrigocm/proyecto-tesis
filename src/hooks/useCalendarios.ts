import { useState, useEffect } from 'react'

export interface EventoCalendario {
  id: string
  titulo: string
  descripcion: string
  fechaInicio: string
  fechaFin: string
  horaInicio?: string
  horaFin?: string
  tipo: 'ACADEMICO' | 'ADMINISTRATIVO' | 'FESTIVO' | 'SUSPENSION' | 'EVALUACION' | 'REUNION'
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA'
  todoDia: boolean
  color: string
  visible: boolean
  institucionId: string
  creadoPor: string
  createdAt: string
  updatedAt: string
}

export interface CalendariosFilters {
  tipo: string
  prioridad: string
  mes: string
  año: string
  visible: 'TODOS' | 'VISIBLE' | 'OCULTO'
}

export const useCalendarios = () => {
  const [eventos, setEventos] = useState<EventoCalendario[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<CalendariosFilters>({
    tipo: '',
    prioridad: '',
    mes: new Date().getMonth() + 1 + '',
    año: new Date().getFullYear() + '',
    visible: 'TODOS'
  })

  useEffect(() => {
    loadEventos()
  }, [])

  const loadEventos = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      
      // Obtener ieId del usuario
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        console.error('No user data found')
        return
      }
      
      const user = JSON.parse(userStr)
      const ieId = user.idIe || user.institucionId || 1
      
      const params = new URLSearchParams()
      params.append('ieId', ieId.toString())
      
      if (filters.tipo) params.append('tipo', filters.tipo)
      if (filters.prioridad) params.append('prioridad', filters.prioridad)
      if (filters.mes) params.append('mes', filters.mes)
      if (filters.año) params.append('año', filters.año)
      if (filters.visible !== 'TODOS') params.append('visible', filters.visible === 'VISIBLE' ? 'true' : 'false')

      const response = await fetch(`/api/calendario?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setEventos(data.data || [])
      } else {
        console.error('Error loading eventos')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEventos = eventos.filter(evento => {
    const fechaEvento = new Date(evento.fechaInicio)
    const matchesTipo = !filters.tipo || evento.tipo === filters.tipo
    const matchesPrioridad = !filters.prioridad || evento.prioridad === filters.prioridad
    const matchesMes = !filters.mes || (fechaEvento.getMonth() + 1) === parseInt(filters.mes)
    const matchesAño = !filters.año || fechaEvento.getFullYear() === parseInt(filters.año)
    const matchesVisible = filters.visible === 'TODOS' || 
      (filters.visible === 'VISIBLE' && evento.visible) ||
      (filters.visible === 'OCULTO' && !evento.visible)

    return matchesTipo && matchesPrioridad && matchesMes && matchesAño && matchesVisible
  }).sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime())

  const crearEvento = async (data: {
    titulo: string
    descripcion: string
    fechaInicio: string
    fechaFin: string
    horaInicio?: string
    horaFin?: string
    tipo: string
    prioridad: string
    todoDia: boolean
    color: string
  }) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/calendario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        loadEventos()
        return true
      }
      return false
    } catch (error) {
      console.error('Error creating evento:', error)
      return false
    }
  }

  const actualizarEvento = async (id: string, data: Partial<EventoCalendario>) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/calendario/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        loadEventos()
        return true
      }
      return false
    } catch (error) {
      console.error('Error updating evento:', error)
      return false
    }
  }

  const eliminarEvento = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/calendario/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        loadEventos()
        return true
      }
      return false
    } catch (error) {
      console.error('Error deleting evento:', error)
      return false
    }
  }

  const toggleVisible = async (id: string, visible: boolean) => {
    return actualizarEvento(id, { visible })
  }

  const updateFilters = (newFilters: Partial<CalendariosFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  // Generar años disponibles (año actual ± 2)
  const añosDisponibles = Array.from({ length: 5 }, (_, i) => {
    const año = new Date().getFullYear() - 2 + i
    return año.toString()
  })

  const mesesDisponibles = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' }
  ]

  const stats = {
    total: filteredEventos.length,
    visible: filteredEventos.filter(e => e.visible).length,
    oculto: filteredEventos.filter(e => !e.visible).length,
    alta: filteredEventos.filter(e => e.prioridad === 'ALTA').length,
    media: filteredEventos.filter(e => e.prioridad === 'MEDIA').length,
    baja: filteredEventos.filter(e => e.prioridad === 'BAJA').length,
    proximos: filteredEventos.filter(e => new Date(e.fechaInicio) >= new Date()).length
  }

  return {
    eventos: filteredEventos,
    loading,
    filters,
    añosDisponibles,
    mesesDisponibles,
    stats,
    loadEventos,
    crearEvento,
    actualizarEvento,
    eliminarEvento,
    toggleVisible,
    updateFilters
  }
}
