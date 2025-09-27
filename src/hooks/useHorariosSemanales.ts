import { useState, useEffect } from 'react'

export interface HorarioSemanalDetalle {
  id: string
  diaSemana: number
  diaNombre: string
  horaInicio: string
  horaFin: string
  materia: string
  docente: string
  aula: string
  tipoActividad: 'CLASE_REGULAR' | 'REFORZAMIENTO' | 'RECUPERACION' | 'EVALUACION' | 'TALLER_EXTRA'
  tipoActividadLabel: string
  observaciones: string
  grado: string
  seccion: string
  activo: boolean
}

export interface HorarioSemanal {
  id: string
  nombre: string
  descripcion: string
  fechaInicio: string
  fechaFin: string
  activo: boolean
  ie: {
    id: string
    nombre: string
  }
  detalles: HorarioSemanalDetalle[]
  createdAt: string
  updatedAt: string | null
}

export interface HorarioSemanalFilters {
  fechaInicio: string
  fechaFin: string
  activo: string
}

export const useHorariosSemanales = () => {
  const [horarios, setHorarios] = useState<HorarioSemanal[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<HorarioSemanalFilters>({
    fechaInicio: '',
    fechaFin: '',
    activo: 'true'
  })

  useEffect(() => {
    loadHorarios()
  }, [])

  const loadHorarios = async () => {
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
      if (filters.activo) params.append('activo', filters.activo)

      const response = await fetch(`/api/horarios/semanales?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Horarios semanales cargados exitosamente:', data)
        setHorarios(data.data || [])
      } else {
        const errorText = await response.text()
        console.error('Error loading horarios semanales:', response.status, errorText)
        setHorarios([])
      }
    } catch (error) {
      console.error('Error:', error)
      setHorarios([])
    } finally {
      setLoading(false)
    }
  }

  const crearHorario = async (data: {
    nombre: string
    descripcion?: string
    fechaInicio: string
    fechaFin: string
    detalles: Array<{
      idHorarioBase: string
      diaSemana: number
      horaInicio: string
      horaFin: string
      materia?: string
      docente?: string
      aula?: string
      tipoActividad?: string
      observaciones?: string
    }>
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
      
      const response = await fetch('/api/horarios/semanales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...data, ieId })
      })

      if (response.ok) {
        loadHorarios()
        return true
      }
      return false
    } catch (error) {
      console.error('Error creating horario semanal:', error)
      return false
    }
  }

  const updateFilters = (newFilters: Partial<HorarioSemanalFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const tiposActividad = [
    { value: 'CLASE_REGULAR', label: 'Clase Regular' },
    { value: 'REFORZAMIENTO', label: 'Reforzamiento' },
    { value: 'RECUPERACION', label: 'Recuperación' },
    { value: 'EVALUACION', label: 'Evaluación' },
    { value: 'TALLER_EXTRA', label: 'Taller Extra' }
  ]

  const diasSemana = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
    { value: 7, label: 'Domingo' }
  ]

  // Filtrar horarios por día de la semana
  const getHorariosPorDia = (diaSemana: number) => {
    return horarios.flatMap(horario => 
      horario.detalles.filter(detalle => detalle.diaSemana === diaSemana)
    )
  }

  // Obtener horarios de fin de semana (reforzamiento/recuperación)
  const getHorariosFinDeSemana = () => {
    return horarios.flatMap(horario => 
      horario.detalles.filter(detalle => 
        detalle.diaSemana === 6 || detalle.diaSemana === 7
      )
    )
  }

  const stats = {
    total: horarios.length,
    activos: horarios.filter(h => h.activo).length,
    inactivos: horarios.filter(h => !h.activo).length,
    conReforzamiento: horarios.filter(h => 
      h.detalles.some(d => d.tipoActividad === 'REFORZAMIENTO')
    ).length,
    conRecuperacion: horarios.filter(h => 
      h.detalles.some(d => d.tipoActividad === 'RECUPERACION')
    ).length,
    finDeSemana: horarios.filter(h => 
      h.detalles.some(d => d.diaSemana === 6 || d.diaSemana === 7)
    ).length
  }

  return {
    horarios,
    loading,
    filters,
    tiposActividad,
    diasSemana,
    stats,
    loadHorarios,
    crearHorario,
    updateFilters,
    getHorariosPorDia,
    getHorariosFinDeSemana
  }
}
