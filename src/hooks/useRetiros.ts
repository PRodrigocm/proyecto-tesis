import { useState, useEffect } from 'react'

export interface Retiro {
  id: string
  estudianteId: string
  estudiante: {
    nombre: string
    apellido: string
    dni: string
    grado: string
    seccion: string
  }
  apoderadoId: string
  apoderado: {
    nombre: string
    apellido: string
    dni: string
    telefono: string
  }
  fecha: string
  horaRetiro: string
  motivo: string
  observaciones?: string
  estado: 'PENDIENTE' | 'AUTORIZADO' | 'RECHAZADO' | 'COMPLETADO'
  autorizadoPor?: string
  fechaAutorizacion?: string
  personaRecoge?: string
  dniPersonaRecoge?: string
}

export interface RetirosFilters {
  fecha: string
  grado: string
  estado: 'TODOS' | 'PENDIENTE' | 'AUTORIZADO' | 'RECHAZADO' | 'COMPLETADO'
  searchTerm: string
}

export const useRetiros = () => {
  const [retiros, setRetiros] = useState<Retiro[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<RetirosFilters>({
    fecha: new Date().toISOString().split('T')[0],
    grado: '',
    estado: 'TODOS',
    searchTerm: ''
  })

  useEffect(() => {
    loadRetiros()
  }, [filters.fecha])

  const loadRetiros = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        fecha: filters.fecha,
        ...(filters.grado && { grado: filters.grado }),
        ...(filters.estado !== 'TODOS' && { estado: filters.estado }),
        ...(filters.searchTerm && { search: filters.searchTerm })
      })

      const response = await fetch(`/api/retiros?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setRetiros(data.data || [])
      } else {
        console.error('Error loading retiros')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRetiros = retiros.filter(retiro => {
    const matchesGrado = !filters.grado || retiro.estudiante.grado === filters.grado
    const matchesEstado = filters.estado === 'TODOS' || retiro.estado === filters.estado
    const matchesSearch = !filters.searchTerm || 
      retiro.estudiante.nombre.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      retiro.estudiante.apellido.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      retiro.estudiante.dni.includes(filters.searchTerm) ||
      retiro.apoderado.nombre.toLowerCase().includes(filters.searchTerm.toLowerCase())

    return matchesGrado && matchesEstado && matchesSearch
  })

  const grados = [...new Set(retiros.map(r => r.estudiante.grado))].filter(Boolean).sort()

  const solicitarRetiro = async (data: {
    estudianteId: string
    motivo: string
    horaRetiro: string
    observaciones?: string
    personaRecoge?: string
    dniPersonaRecoge?: string
  }) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/retiros', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...data,
          fecha: filters.fecha
        })
      })

      if (response.ok) {
        loadRetiros()
        return true
      }
      return false
    } catch (error) {
      console.error('Error creating retiro:', error)
      return false
    }
  }

  const autorizarRetiro = async (retiroId: string, autorizado: boolean, observaciones?: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/retiros/${retiroId}/autorizar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          autorizado,
          observaciones
        })
      })

      if (response.ok) {
        loadRetiros()
        return true
      }
      return false
    } catch (error) {
      console.error('Error authorizing retiro:', error)
      return false
    }
  }

  const completarRetiro = async (retiroId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/retiros/${retiroId}/completar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        loadRetiros()
        return true
      }
      return false
    } catch (error) {
      console.error('Error completing retiro:', error)
      return false
    }
  }

  const updateFilters = (newFilters: Partial<RetirosFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const stats = {
    total: filteredRetiros.length,
    pendientes: filteredRetiros.filter(r => r.estado === 'PENDIENTE').length,
    autorizados: filteredRetiros.filter(r => r.estado === 'AUTORIZADO').length,
    completados: filteredRetiros.filter(r => r.estado === 'COMPLETADO').length,
    rechazados: filteredRetiros.filter(r => r.estado === 'RECHAZADO').length
  }

  return {
    retiros: filteredRetiros,
    loading,
    filters,
    grados,
    stats,
    loadRetiros,
    solicitarRetiro,
    autorizarRetiro,
    completarRetiro,
    updateFilters
  }
}
