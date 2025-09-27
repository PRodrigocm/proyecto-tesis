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
  grado: string
  seccion: string
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
  filterGrado: string
  filterSeccion: string
}

export const useDocentes = () => {
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [loading, setLoading] = useState(true)
  const [grados, setGrados] = useState<string[]>([])
  const [secciones, setSecciones] = useState<string[]>([])
  const [filters, setFilters] = useState<DocentesFilters>({
    searchTerm: '',
    filterEstado: 'ACTIVO',  // Por defecto solo mostrar activos
    filterGrado: '',
    filterSeccion: ''
  })

  useEffect(() => {
    loadDocentes()
    loadGradosYSecciones()
  }, [])

  const loadDocentes = async () => {
    setLoading(true)
    try {
      // Get user's institution ID from localStorage
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        console.error('No user data found')
        return
      }
      
      const user = JSON.parse(userStr)
      const ieId = user.idIe || user.institucionId || 1 // Fallback a IE por defecto

      const response = await fetch(`/api/docentes?ieId=${ieId}`)

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

  const loadGradosYSecciones = async () => {
    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) return

      const user = JSON.parse(userStr)
      const ieId = user.idIe || user.institucionId || 1
      const token = localStorage.getItem('token')

      // Cargar grados
      const gradosResponse = await fetch(`/api/grados?ieId=${ieId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (gradosResponse.ok) {
        const gradosData = await gradosResponse.json()
        const gradosNombres = gradosData.data?.map((g: any) => g.nombre) || []
        setGrados(gradosNombres)
      }

      // Cargar todas las secciones (sin filtrar por grado)
      const seccionesResponse = await fetch(`/api/secciones`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (seccionesResponse.ok) {
        const seccionesData = await seccionesResponse.json()
        const seccionesNombres = [...new Set(seccionesData.data?.map((s: any) => s.nombre) || [])].sort() as string[]
        setSecciones(seccionesNombres)
      }
    } catch (error) {
      console.error('Error loading grados y secciones:', error)
    }
  }

  const filteredDocentes = docentes.filter(docente => {
    const matchesSearch = 
      docente.nombre.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      docente.apellido.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      docente.email.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      docente.dni.includes(filters.searchTerm)

    const matchesFilter = filters.filterEstado === 'TODOS' || docente.estado === filters.filterEstado
    const matchesGrado = !filters.filterGrado || docente.grado === filters.filterGrado
    const matchesSeccion = !filters.filterSeccion || docente.seccion === filters.filterSeccion

    return matchesSearch && matchesFilter && matchesGrado && matchesSeccion
  })

  const handleEstadoChange = async (id: string, nuevoEstado: 'ACTIVO' | 'INACTIVO') => {
    const docente = docentes.find(d => d.id === id)
    const accion = nuevoEstado === 'INACTIVO' ? 'desactivar' : 'activar'
    
    if (!confirm(`¿Estás seguro de que deseas ${accion} a ${docente?.nombre} ${docente?.apellido}?`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/docentes?id=${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado: nuevoEstado })
      })

      if (response.ok) {
        // Actualizar el estado local
        setDocentes(prev => 
          prev.map(docente => 
            docente.id === id 
              ? { ...docente, estado: nuevoEstado }
              : docente
          )
        )
        
        const mensaje = nuevoEstado === 'INACTIVO' ? 
          'Docente desactivado exitosamente. Ya no aparecerá en la lista de activos.' :
          `Docente ${nuevoEstado.toLowerCase()} exitosamente`
        
        alert(mensaje)
      } else {
        const error = await response.json()
        alert(`Error: ${error.message || 'No se pudo cambiar el estado del docente'}`)
      }
    } catch (error) {
      console.error('Error updating docente estado:', error)
      alert('Error al cambiar el estado del docente')
    }
  }

  const updateFilters = (newFilters: Partial<DocentesFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const stats = {
    total: docentes.length,
    activos: docentes.filter(d => d.estado === 'ACTIVO').length,
    inactivos: docentes.filter(d => d.estado === 'INACTIVO').length,
    grados: grados.length
  }

  return {
    docentes: filteredDocentes,
    loading,
    filters,
    grados,
    secciones,
    stats,
    loadDocentes,
    handleEstadoChange,
    updateFilters
  }
}
