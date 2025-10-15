import { useState, useEffect } from 'react'

export interface HorarioTaller {
  id: string
  idTaller: number
  taller: {
    id: number
    nombre: string
    instructor?: string
    descripcion?: string
    capacidadMaxima?: number
    activo: boolean
  }
  diaSemana: number // 1=Lunes, 2=Martes, ..., 7=Domingo
  horaInicio: string
  horaFin: string
  toleranciaMin: number
  lugar?: string
  activo: boolean
  inscripciones?: number
}

export interface TallerConHorarios {
  id: number
  nombre: string
  instructor?: string
  descripcion?: string
  capacidadMaxima?: number
  activo: boolean
  inscripciones: number
  horarios: {
    id: string
    dia: string
    diaSemana: number
    horaInicio: string
    horaFin: string
    lugar?: string
  }[]
}

export interface InstructorInfo {
  nombre: string
  talleres: string[]
}

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export const useHorariosTalleres = () => {
  const [horarios, setHorarios] = useState<HorarioTaller[]>([])
  const [talleresConHorarios, setTalleresConHorarios] = useState<TallerConHorarios[]>([])
  const [instructores, setInstructores] = useState<InstructorInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadHorariosTalleres()
  }, [])

  const loadHorariosTalleres = async () => {
    console.log('🔄 useHorariosTalleres: Iniciando carga de horarios')
    setLoading(true)
    setError(null)
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación')
      }

      const response = await fetch('/api/horarios/talleres', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('📡 Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Horarios de talleres cargados:', data)
        
        const horariosData = data.horarios || []
        setHorarios(horariosData)

        // Procesar datos para la vista de talleres con horarios
        const talleresMap = new Map<number, TallerConHorarios>()
        const instructoresSet = new Set<string>()

        horariosData.forEach((horario: HorarioTaller) => {
          const tallerId = horario.taller.id
          
          if (!talleresMap.has(tallerId)) {
            talleresMap.set(tallerId, {
              id: tallerId,
              nombre: horario.taller.nombre,
              instructor: horario.taller.instructor,
              descripcion: horario.taller.descripcion,
              capacidadMaxima: horario.taller.capacidadMaxima,
              activo: horario.taller.activo,
              inscripciones: horario.inscripciones || 0,
              horarios: []
            })
          }

          const taller = talleresMap.get(tallerId)!
          taller.horarios.push({
            id: horario.id,
            dia: diasSemana[horario.diaSemana - 1],
            diaSemana: horario.diaSemana,
            horaInicio: horario.horaInicio,
            horaFin: horario.horaFin,
            lugar: horario.lugar
          })

          // Agregar instructor a la lista
          if (horario.taller.instructor) {
            instructoresSet.add(horario.taller.instructor)
          }
        })

        const talleresArray = Array.from(talleresMap.values())
        setTalleresConHorarios(talleresArray)

        // Crear lista de instructores con sus talleres
        const instructoresList: InstructorInfo[] = Array.from(instructoresSet).map(instructor => ({
          nombre: instructor,
          talleres: talleresArray
            .filter(t => t.instructor === instructor)
            .map(t => t.nombre)
        }))
        setInstructores(instructoresList)

      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al cargar horarios de talleres')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      console.error('💥 Error en loadHorariosTalleres:', err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const actualizarHorario = async (horarioId: string, data: {
    diaSemana?: number
    horaInicio?: string
    horaFin?: string
    lugar?: string
    toleranciaMin?: number
    activo?: boolean
  }) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación')
      }

      const response = await fetch(`/api/horarios/talleres/${horarioId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await loadHorariosTalleres() // Recargar datos
        return true
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar horario')
      }
    } catch (err) {
      console.error('Error actualizando horario:', err)
      setError(err instanceof Error ? err.message : 'Error al actualizar horario')
      return false
    }
  }

  const crearHorario = async (data: {
    idTaller: number
    diaSemana: number
    horaInicio: string
    horaFin: string
    lugar?: string
    toleranciaMin?: number
  }) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación')
      }

      const response = await fetch('/api/horarios/talleres', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await loadHorariosTalleres() // Recargar datos
        return true
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear horario')
      }
    } catch (err) {
      console.error('Error creando horario:', err)
      setError(err instanceof Error ? err.message : 'Error al crear horario')
      return false
    }
  }

  const eliminarHorario = async (horarioId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación')
      }

      const response = await fetch(`/api/horarios/talleres/${horarioId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await loadHorariosTalleres() // Recargar datos
        return true
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar horario')
      }
    } catch (err) {
      console.error('Error eliminando horario:', err)
      setError(err instanceof Error ? err.message : 'Error al eliminar horario')
      return false
    }
  }

  // Función para obtener talleres por día
  const getTalleresPorDia = (dia: string) => {
    return talleresConHorarios.filter(taller => 
      taller.horarios.some(h => h.dia === dia)
    )
  }

  // Función para obtener horarios por día específico
  const getHorariosPorDia = (dia: string) => {
    const diaIndex = diasSemana.indexOf(dia) + 1
    return horarios.filter(h => h.diaSemana === diaIndex && h.activo)
  }

  // Estadísticas
  const stats = {
    totalTalleres: talleresConHorarios.length,
    talleresActivos: talleresConHorarios.filter(t => t.activo).length,
    totalParticipantes: talleresConHorarios.reduce((sum, t) => sum + t.inscripciones, 0),
    talleresFindeSemana: talleresConHorarios.filter(t => 
      t.horarios.some(h => h.dia === 'Sábado' || h.dia === 'Domingo')
    ).length,
    totalInstructores: instructores.length
  }

  return {
    horarios,
    talleresConHorarios,
    instructores,
    loading,
    error,
    stats,
    loadHorariosTalleres,
    actualizarHorario,
    crearHorario,
    eliminarHorario,
    getTalleresPorDia,
    getHorariosPorDia
  }
}
