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
  fechaNacimiento?: string
  fechaCreacion?: string
  ocupacion?: string
  estado: 'ACTIVO' | 'INACTIVO'
  estudiantes: Array<{
    id: string
    nombre: string
    apellido: string
    dni: string
    grado: string
    seccion: string
    relacion: string
    esTitular: boolean
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

  useEffect(() => {
    loadApoderados()
  }, [filters.filterEstado])

  const loadApoderados = async () => {
    setLoading(true)
    try {
      // Get user's institution ID from localStorage
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        console.error('No user data found')
        return
      }
      
      const user = JSON.parse(userStr)
      const ieId = user.idIe || user.institucionId || user.ieId || 1 // Fallback to 1 if not found
      
      if (!ieId) {
        console.error('No institution ID found for user:', user)
        return
      }

      // Include inactive apoderados when filter is set to show them
      const includeInactive = filters.filterEstado === 'INACTIVO' || filters.filterEstado === 'TODOS'
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/usuarios/apoderados?ieId=${ieId}&includeInactive=${includeInactive}`, {
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
      const response = await fetch(`/api/usuarios/apoderados?id=${id}`, {
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

  const updateApoderado = async (apoderadoData: {
    id: string
    nombre: string
    apellido: string
    email: string
    telefono: string
    dni: string
    direccion: string
    estado: 'ACTIVO' | 'INACTIVO'
    estudiantesIds: string[]
    estudiantesRelaciones: {[key: string]: string}
  }) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/apoderados/${apoderadoData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(apoderadoData)
      })

      if (response.ok) {
        await loadApoderados() // Reload to get updated data
        return true
      } else {
        console.error('Error updating apoderado')
        return false
      }
    } catch (error) {
      console.error('Error updating apoderado:', error)
      return false
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
    updateApoderado,
    updateFilters
  }
}
