import { useState, useEffect } from 'react'

export interface Docente {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono: string
  dni: string
  especialidad: string
  institucionEducativa: string
  fechaRegistro: string
  estado: 'ACTIVO' | 'INACTIVO'
  materias: Array<{
    id: string
    nombre: string
  }>
}

export interface DocentesFilters {
  searchTerm: string
  filterEstado: 'TODOS' | 'ACTIVO' | 'INACTIVO'
  filterEspecialidad: string
  filterInstitucion: string
}

export const useDocentes = () => {
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<DocentesFilters>({
    searchTerm: '',
    filterEstado: 'TODOS',
    filterEspecialidad: '',
    filterInstitucion: ''
  })

  useEffect(() => {
    loadDocentes()
  }, [])

  const loadDocentes = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/users/docentes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDocentes(data.data || [])
      } else {
        console.error('Error loading docentes')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDocentes = docentes.filter(docente => {
    const matchesSearch = 
      docente.nombre.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      docente.apellido.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      docente.email.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      docente.dni.includes(filters.searchTerm)

    const matchesFilter = filters.filterEstado === 'TODOS' || docente.estado === filters.filterEstado
    const matchesEspecialidad = !filters.filterEspecialidad || docente.especialidad === filters.filterEspecialidad
    const matchesInstitucion = !filters.filterInstitucion || docente.institucionEducativa === filters.filterInstitucion

    return matchesSearch && matchesFilter && matchesEspecialidad && matchesInstitucion
  })

  const especialidades = [...new Set(docentes.map(d => d.especialidad))].filter(Boolean).sort()
  const instituciones = [...new Set(docentes.map(d => d.institucionEducativa))].filter(Boolean)

  const handleEstadoChange = async (id: string, nuevoEstado: 'ACTIVO' | 'INACTIVO') => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/users/docentes/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado: nuevoEstado })
      })

      if (response.ok) {
        setDocentes(prev => 
          prev.map(docente => 
            docente.id === id 
              ? { ...docente, estado: nuevoEstado }
              : docente
          )
        )
      }
    } catch (error) {
      console.error('Error updating estado:', error)
    }
  }

  const updateFilters = (newFilters: Partial<DocentesFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const stats = {
    total: docentes.length,
    activos: docentes.filter(d => d.estado === 'ACTIVO').length,
    inactivos: docentes.filter(d => d.estado === 'INACTIVO').length,
    especialidades: especialidades.length
  }

  return {
    docentes: filteredDocentes,
    loading,
    filters,
    especialidades,
    instituciones,
    stats,
    loadDocentes,
    handleEstadoChange,
    updateFilters
  }
}
