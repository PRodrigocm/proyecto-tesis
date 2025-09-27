import { useState, useEffect } from 'react'

export interface Horario {
  id: string
  grado: string
  seccion: string
  diaSemana: string
  horaInicio: string
  horaFin: string
  materia: string
  docenteId: string
  docente: {
    nombre: string
    apellido: string
    especialidad: string
  }
  aula: string
  sesion: string
  activo: boolean
}

export interface HorariosFilters {
  grado: string
  seccion: string
  diaSemana: string
  sesion: 'TODOS' | 'AM' | 'PM'
  docente: string
}

export const useHorarios = () => {
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<HorariosFilters>({
    grado: '',
    seccion: '',
    diaSemana: '',
    sesion: 'TODOS',
    docente: ''
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
      const ieId = user.idIe || user.institucionId || 1
      
      const params = new URLSearchParams()
      params.append('ieId', ieId.toString())
      
      if (filters.grado) params.append('grado', filters.grado)
      if (filters.seccion) params.append('seccion', filters.seccion)
      if (filters.diaSemana) params.append('diaSemana', filters.diaSemana)
      if (filters.sesion !== 'TODOS') params.append('sesion', filters.sesion)
      if (filters.docente) params.append('docente', filters.docente)

      const response = await fetch(`/api/horarios?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Horarios cargados exitosamente:', data)
        setHorarios(data.data || [])
      } else {
        const errorText = await response.text()
        console.error('Error loading horarios:', response.status, errorText)
        setHorarios([])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredHorarios = horarios.filter(horario => {
    const matchesGrado = !filters.grado || horario.grado === filters.grado
    const matchesSeccion = !filters.seccion || horario.seccion === filters.seccion
    const matchesDia = !filters.diaSemana || horario.diaSemana === filters.diaSemana
    const matchesSesion = filters.sesion === 'TODOS' || horario.sesion === filters.sesion
    const matchesDocente = !filters.docente || 
      (horario.docente.nombre && horario.docente.apellido && 
       `${horario.docente.nombre} ${horario.docente.apellido}`.toLowerCase().includes(filters.docente.toLowerCase()))

    return matchesGrado && matchesSeccion && matchesDia && matchesSesion && matchesDocente
  })

  const grados = [...new Set(horarios.map(h => h.grado))].filter(Boolean).sort()
  const secciones = [...new Set(horarios.map(h => h.seccion))].filter(Boolean).sort()
  const docentes = [...new Set(horarios.map(h => 
    h.docente.nombre && h.docente.apellido ? `${h.docente.nombre} ${h.docente.apellido}` : ''
  ))].filter(Boolean).sort()

  const crearHorario = async (data: {
    grado: string
    seccion: string
    diaSemana: string
    horaInicio: string
    horaFin: string
    materia: string
    docenteId: string
    aula: string
    sesion: string
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
      const ieId = user.idIe || user.institucionId || 1
      
      const response = await fetch('/api/horarios', {
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
      console.error('Error creating horario:', error)
      return false
    }
  }

  const actualizarHorario = async (id: string, data: Partial<Horario>) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/horarios/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        loadHorarios()
        return true
      }
      return false
    } catch (error) {
      console.error('Error updating horario:', error)
      return false
    }
  }

  const eliminarHorario = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/horarios/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        loadHorarios()
        return true
      }
      return false
    } catch (error) {
      console.error('Error deleting horario:', error)
      return false
    }
  }

  const updateFilters = (newFilters: Partial<HorariosFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const stats = {
    total: filteredHorarios.length,
    am: filteredHorarios.filter(h => h.sesion === 'AM').length,
    pm: filteredHorarios.filter(h => h.sesion === 'PM').length,
    grados: grados.length,
    docentes: docentes.length
  }

  return {
    horarios: filteredHorarios,
    loading,
    filters,
    grados,
    secciones,
    docentes,
    stats,
    loadHorarios,
    crearHorario,
    actualizarHorario,
    eliminarHorario,
    updateFilters
  }
}
