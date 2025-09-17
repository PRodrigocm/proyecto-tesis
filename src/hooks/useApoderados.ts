import { useState, useEffect } from 'react'

export interface Apoderado {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono: string
  dni: string
  direccion: string
  fechaRegistro: string
  estado: 'ACTIVO' | 'INACTIVO'
  estudiantes: Array<{
    id: string
    nombre: string
    apellido: string
    grado: string
  }>
}

export interface ApoderadosFilters {
  searchTerm: string
  filterEstado: 'TODOS' | 'ACTIVO' | 'INACTIVO'
}

export const useApoderados = () => {
  const [apoderados, setApoderados] = useState<Apoderado[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ApoderadosFilters>({
    searchTerm: '',
    filterEstado: 'TODOS'
  })

  useEffect(() => {
    loadApoderados()
  }, [])

  const loadApoderados = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/users/apoderados', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setApoderados(data.data || [])
      } else {
        console.error('Error loading apoderados')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredApoderados = apoderados.filter(apoderado => {
    const matchesSearch = 
      apoderado.nombre.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      apoderado.apellido.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      apoderado.email.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      apoderado.dni.includes(filters.searchTerm)

    const matchesFilter = filters.filterEstado === 'TODOS' || apoderado.estado === filters.filterEstado

    return matchesSearch && matchesFilter
  })

  const handleEstadoChange = async (id: string, nuevoEstado: 'ACTIVO' | 'INACTIVO') => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/users/apoderados/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado: nuevoEstado })
      })

      if (response.ok) {
        setApoderados(prev => 
          prev.map(apoderado => 
            apoderado.id === id 
              ? { ...apoderado, estado: nuevoEstado }
              : apoderado
          )
        )
      }
    } catch (error) {
      console.error('Error updating estado:', error)
    }
  }

  const updateFilters = (newFilters: Partial<ApoderadosFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const stats = {
    total: apoderados.length,
    activos: apoderados.filter(a => a.estado === 'ACTIVO').length,
    inactivos: apoderados.filter(a => a.estado === 'INACTIVO').length,
    totalEstudiantes: apoderados.reduce((sum, a) => sum + (a.estudiantes?.length || 0), 0)
  }

  return {
    apoderados: filteredApoderados,
    loading,
    filters,
    stats,
    loadApoderados,
    handleEstadoChange,
    updateFilters
  }
}
