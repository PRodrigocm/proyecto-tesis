import { useState, useEffect } from 'react'

export interface Asistencia {
  id: string
  estudianteId: string
  estudiante: {
    nombre: string
    apellido: string
    dni: string
    grado: string
    seccion: string
  }
  fecha: string
  horaEntrada: string
  horaSalida?: string
  estado: 'PRESENTE' | 'AUSENTE' | 'TARDANZA' | 'JUSTIFICADO'
  observaciones?: string
  registradoPor: string
  sesion: 'AM' | 'PM'
}

export interface AsistenciaFilters {
  fecha: string
  grado: string
  seccion: string
  estado: 'TODOS' | 'PRESENTE' | 'AUSENTE' | 'TARDANZA' | 'JUSTIFICADO'
  sesion: 'TODOS' | 'AM' | 'PM'
}

export const useAsistencia = () => {
  const [asistencias, setAsistencias] = useState<Asistencia[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<AsistenciaFilters>({
    fecha: new Date().toISOString().split('T')[0],
    grado: '',
    seccion: '',
    estado: 'TODOS',
    sesion: 'TODOS'
  })

  useEffect(() => {
    loadAsistencias()
  }, [filters.fecha])

  const loadAsistencias = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        fecha: filters.fecha,
        ...(filters.grado && { grado: filters.grado }),
        ...(filters.seccion && { seccion: filters.seccion }),
        ...(filters.estado !== 'TODOS' && { estado: filters.estado }),
        ...(filters.sesion !== 'TODOS' && { sesion: filters.sesion })
      })

      const response = await fetch(`http://localhost:3001/api/asistencias?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAsistencias(data.data || [])
      } else {
        console.error('Error loading asistencias')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAsistencias = asistencias.filter(asistencia => {
    const matchesGrado = !filters.grado || asistencia.estudiante.grado === filters.grado
    const matchesSeccion = !filters.seccion || asistencia.estudiante.seccion === filters.seccion
    const matchesEstado = filters.estado === 'TODOS' || asistencia.estado === filters.estado
    const matchesSesion = filters.sesion === 'TODOS' || asistencia.sesion === filters.sesion

    return matchesGrado && matchesSeccion && matchesEstado && matchesSesion
  })

  const grados = [...new Set(asistencias.map(a => a.estudiante.grado))].filter(Boolean).sort()
  const secciones = [...new Set(asistencias.map(a => a.estudiante.seccion))].filter(Boolean).sort()

  const marcarAsistencia = async (estudianteId: string, estado: 'PRESENTE' | 'AUSENTE' | 'TARDANZA' | 'JUSTIFICADO', observaciones?: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/asistencias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          estudianteId,
          fecha: filters.fecha,
          estado,
          observaciones,
          sesion: new Date().getHours() < 12 ? 'AM' : 'PM'
        })
      })

      if (response.ok) {
        loadAsistencias()
      }
    } catch (error) {
      console.error('Error marking attendance:', error)
    }
  }

  const registrarSalida = async (asistenciaId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/asistencias/${asistenciaId}/salida`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        loadAsistencias()
      }
    } catch (error) {
      console.error('Error registering exit:', error)
    }
  }

  const updateFilters = (newFilters: Partial<AsistenciaFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const stats = {
    total: filteredAsistencias.length,
    presentes: filteredAsistencias.filter(a => a.estado === 'PRESENTE').length,
    ausentes: filteredAsistencias.filter(a => a.estado === 'AUSENTE').length,
    tardanzas: filteredAsistencias.filter(a => a.estado === 'TARDANZA').length,
    justificados: filteredAsistencias.filter(a => a.estado === 'JUSTIFICADO').length
  }

  return {
    asistencias: filteredAsistencias,
    loading,
    filters,
    grados,
    secciones,
    stats,
    loadAsistencias,
    marcarAsistencia,
    registrarSalida,
    updateFilters
  }
}
