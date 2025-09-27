import { useState, useEffect } from 'react'

export interface ExcepcionHorario {
  id: string
  fecha: string
  tipoExcepcion: 'FERIADO' | 'DIA_NO_LABORABLE' | 'SUSPENSION_CLASES' | 'HORARIO_ESPECIAL' | 'VACACIONES' | 'CAPACITACION' | 'OTRO'
  tipoHorario: 'CLASE' | 'TALLER' | 'AMBOS'
  motivo: string
  descripcion: string
  horaInicioAlt?: string | null
  horaFinAlt?: string | null
  horarioClase?: {
    id: string
    grado: string
    seccion: string
    diaSemana: number
    horaEntrada: string
    horaSalida: string
  } | null
  horarioTaller?: {
    id: string
    taller: string
    diaSemana: number
    horaInicio: string
    horaFin: string
    lugar: string
  } | null
  activo: boolean
}

export interface ExcepcionesFilters {
  fechaInicio: string
  fechaFin: string
  tipoExcepcion: string
  tipoHorario: string
}

export const useExcepcionesHorario = () => {
  const [excepciones, setExcepciones] = useState<ExcepcionHorario[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ExcepcionesFilters>({
    fechaInicio: '',
    fechaFin: '',
    tipoExcepcion: '',
    tipoHorario: ''
  })

  useEffect(() => {
    loadExcepciones()
  }, [])

  const loadExcepciones = async () => {
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
      const ieId = user.idIe || user.institucionId || user.ieId || 1
      
      const params = new URLSearchParams()
      params.append('ieId', ieId.toString())
      
      if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio)
      if (filters.fechaFin) params.append('fechaFin', filters.fechaFin)

      const response = await fetch(`/api/horarios/excepciones?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Excepciones cargadas exitosamente:', data)
        setExcepciones(data.data || [])
      } else {
        const errorText = await response.text()
        console.error('Error loading excepciones:', response.status, errorText)
        setExcepciones([])
      }
    } catch (error) {
      console.error('Error:', error)
      setExcepciones([])
    } finally {
      setLoading(false)
    }
  }

  const filteredExcepciones = excepciones.filter(excepcion => {
    const matchesTipoExcepcion = !filters.tipoExcepcion || excepcion.tipoExcepcion === filters.tipoExcepcion
    const matchesTipoHorario = !filters.tipoHorario || excepcion.tipoHorario === filters.tipoHorario
    return matchesTipoExcepcion && matchesTipoHorario
  })

  const tiposExcepcion = [
    { value: 'FERIADO', label: 'Feriado' },
    { value: 'DIA_NO_LABORABLE', label: 'Día no laborable' },
    { value: 'SUSPENSION_CLASES', label: 'Suspensión de clases' },
    { value: 'HORARIO_ESPECIAL', label: 'Horario especial' },
    { value: 'VACACIONES', label: 'Vacaciones' },
    { value: 'CAPACITACION', label: 'Capacitación docente' },
    { value: 'OTRO', label: 'Otro' }
  ]

  const tiposHorario = [
    { value: 'CLASE', label: 'Solo Clases' },
    { value: 'TALLER', label: 'Solo Talleres' },
    { value: 'AMBOS', label: 'Clases y Talleres' }
  ]

  const crearExcepcion = async (data: {
    fecha: string
    tipoExcepcion: string
    tipoHorario: string
    motivo?: string
    descripcion?: string
    horaInicioAlt?: string
    horaFinAlt?: string
    idHorarioClase?: string
    idHorarioTaller?: string
  }) => {
    try {
      const token = localStorage.getItem('token')
      
      // Obtener ieId del usuario
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        console.error('No user data found')
        return false
      }
      
      const user = JSON.parse(userStr)
      const ieId = user.idIe || user.institucionId || user.ieId || 1
      
      const response = await fetch('/api/horarios/excepciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...data, ieId })
      })

      if (response.ok) {
        loadExcepciones()
        return true
      }
      return false
    } catch (error) {
      console.error('Error creating excepcion:', error)
      return false
    }
  }

  const actualizarExcepcion = async (id: string, data: Partial<ExcepcionHorario>) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/horarios/excepciones', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id, ...data })
      })

      if (response.ok) {
        loadExcepciones()
        return true
      }
      return false
    } catch (error) {
      console.error('Error updating excepcion:', error)
      return false
    }
  }

  const eliminarExcepcion = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/horarios/excepciones?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        loadExcepciones()
        return true
      }
      return false
    } catch (error) {
      console.error('Error deleting excepcion:', error)
      return false
    }
  }

  const updateFilters = (newFilters: Partial<ExcepcionesFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const stats = {
    total: filteredExcepciones.length,
    feriados: filteredExcepciones.filter(e => e.tipoExcepcion === 'FERIADO').length,
    suspensiones: filteredExcepciones.filter(e => e.tipoExcepcion === 'SUSPENSION_CLASES').length,
    horariosEspeciales: filteredExcepciones.filter(e => e.tipoExcepcion === 'HORARIO_ESPECIAL').length,
    vacaciones: filteredExcepciones.filter(e => e.tipoExcepcion === 'VACACIONES').length
  }

  return {
    excepciones: filteredExcepciones,
    loading,
    filters,
    tiposExcepcion,
    tiposHorario,
    stats,
    loadExcepciones,
    crearExcepcion,
    actualizarExcepcion,
    eliminarExcepcion,
    updateFilters
  }
}
