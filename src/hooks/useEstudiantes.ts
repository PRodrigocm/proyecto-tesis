import { useState, useEffect } from 'react'

export interface Estudiante {
  id: string
  nombre: string
  apellido: string
  dni: string
  fechaNacimiento: string
  grado: string
  seccion: string
  institucionEducativa: string
  apoderado: {
    id: string
    nombre: string
    apellido: string
    telefono: string
    email: string
    relacion: string
    esTitular: boolean
  }
  estado: 'ACTIVO' | 'INACTIVO' | 'RETIRADO'
  fechaRegistro: string
  qrCode: string
}

export interface EstudiantesFilters {
  searchTerm: string
  filterEstado: 'TODOS' | 'ACTIVO' | 'INACTIVO' | 'RETIRADO'
  filterGrado: string
  filterInstitucion: string
}

export const useEstudiantes = () => {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<EstudiantesFilters>({
    searchTerm: '',
    filterEstado: 'TODOS',
    filterGrado: '',
    filterInstitucion: ''
  })

  useEffect(() => {
    loadEstudiantes()
  }, [])

  const loadEstudiantes = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/estudiantes')

      if (response.ok) {
        const data = await response.json()
        setEstudiantes(data.data || [])
      } else {
        console.error('Error loading estudiantes')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEstudiantes = estudiantes.filter(estudiante => {
    const matchesSearch = 
      estudiante.nombre.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      estudiante.apellido.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      estudiante.dni.includes(filters.searchTerm) ||
      estudiante.apoderado?.nombre.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      estudiante.apoderado?.apellido.toLowerCase().includes(filters.searchTerm.toLowerCase())

    const matchesFilter = filters.filterEstado === 'TODOS' || estudiante.estado === filters.filterEstado
    const matchesGrado = !filters.filterGrado || estudiante.grado === filters.filterGrado
    const matchesInstitucion = !filters.filterInstitucion || estudiante.institucionEducativa === filters.filterInstitucion

    return matchesSearch && matchesFilter && matchesGrado && matchesInstitucion
  })

  const grados = [...new Set(estudiantes.map(e => e.grado))].filter(Boolean).sort()
  const instituciones = [...new Set(estudiantes.map(e => e.institucionEducativa))].filter(Boolean)

  const handleEstadoChange = async (id: string, nuevoEstado: 'ACTIVO' | 'INACTIVO' | 'RETIRADO') => {
    try {
      const response = await fetch(`/api/estudiantes?id=${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado: nuevoEstado })
      })

      if (response.ok) {
        setEstudiantes(prev => 
          prev.map(estudiante => 
            estudiante.id === id 
              ? { ...estudiante, estado: nuevoEstado }
              : estudiante
          )
        )
      }
    } catch (error) {
      console.error('Error updating estado:', error)
    }
  }

  const generateQR = async (estudianteId: string) => {
    try {
      const response = await fetch(`/api/estudiantes/qr?id=${estudianteId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setEstudiantes(prev => 
          prev.map(estudiante => 
            estudiante.id === estudianteId 
              ? { ...estudiante, qrCode: data.qrCode }
              : estudiante
          )
        )
      }
    } catch (error) {
      console.error('Error generating QR:', error)
    }
  }

  const updateFilters = (newFilters: Partial<EstudiantesFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const stats = {
    total: estudiantes.length,
    activos: estudiantes.filter(e => e.estado === 'ACTIVO').length,
    retirados: estudiantes.filter(e => e.estado === 'RETIRADO').length,
    instituciones: instituciones.length
  }

  return {
    estudiantes: filteredEstudiantes,
    loading,
    filters,
    grados,
    instituciones,
    stats,
    loadEstudiantes,
    handleEstadoChange,
    generateQR,
    updateFilters
  }
}
