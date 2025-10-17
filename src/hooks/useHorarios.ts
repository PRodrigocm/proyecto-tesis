import { useState, useEffect } from 'react'

export interface Horario {
  id: string
  grado: string
  seccion: string
  diaSemana: string
  horaInicio: string
  horaFin: string
  materia: string
  toleranciaMin: number
  aula: string
  tipoActividad: string
  activo: boolean
  docente: {
    id: string
    nombre: string
    apellido: string
    especialidad: string
  } | null
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
      
      // Usar la API específica para docentes
      const response = await fetch('/api/docentes/horarios', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Horarios cargados exitosamente:', data)
        setHorarios(data.horarios || [])
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
    // Removemos el filtro de sesión ya que no existe en el nuevo modelo
    const matchesDocente = !filters.docente || 
      (horario.docente?.nombre && horario.docente?.apellido && 
       `${horario.docente.nombre} ${horario.docente.apellido}`.toLowerCase().includes(filters.docente.toLowerCase()))

    return matchesGrado && matchesSeccion && matchesDia && matchesDocente
  })

  const grados = [...new Set(horarios.map(h => h.grado))].filter(Boolean).sort()
  const secciones = [...new Set(horarios.map(h => h.seccion))].filter(Boolean).sort()
  const docentes = [...new Set(horarios.map(h => 
    h.docente?.nombre && h.docente?.apellido ? `${h.docente.nombre} ${h.docente.apellido}` : ''
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

  // Función para actualizar tolerancia
  const actualizarTolerancia = async (id: string, toleranciaMin: number) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/docentes/horarios/${id}/tolerancia`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ toleranciaMin })
      })

      if (response.ok) {
        loadHorarios()
        return true
      }
      return false
    } catch (error) {
      console.error('Error updating tolerancia:', error)
      return false
    }
  }

  // Función para actualizar horarios de ingreso y salida
  const actualizarHorarios = async (id: string, horaInicio: string, horaFin: string) => {
    try {
      console.log('🌐 Hook actualizarHorarios llamado:')
      console.log(`URL: /api/docentes/horarios/${id}/horarios`)
      console.log(`Datos: ${JSON.stringify({ horaInicio, horaFin })}`)
      
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/docentes/horarios/${id}/horarios`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ horaInicio, horaFin })
      })

      console.log(`📡 Respuesta de la API: ${response.status} ${response.statusText}`)

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Respuesta exitosa:', result)
        console.log('🔄 Recargando horarios...')
        loadHorarios()
        return true
      } else {
        const error = await response.text()
        console.log('❌ Error de la API:', error)
        return false
      }
    } catch (error) {
      console.error('❌ Error en actualizarHorarios:', error)
      return false
    }
  }

  const stats = {
    total: filteredHorarios.length,
    activos: filteredHorarios.filter(h => h.activo).length,
    inactivos: filteredHorarios.filter(h => !h.activo).length,
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
    actualizarTolerancia,
    actualizarHorarios,
    updateFilters
  }
}
