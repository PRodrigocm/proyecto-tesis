import { useState, useEffect } from 'react'

export interface Retiro {
  id: string
  fecha: string
  horaRetiro: string
  motivo: string
  observaciones?: string
  personaRecoge?: string
  dniPersonaRecoge?: string
  estado: string
  autorizado: boolean
  fechaAutorizacion?: string
  observacionesAutorizacion?: string
  idEstadoRetiro?: number
  estudiante: {
    id: string
    nombre: string
    apellido: string
    dni: string
    grado: string
    seccion: string
  }
  autorizadoPor?: {
    nombre: string
    apellido: string
  } | null
}

export interface RetirosFilters {
  fecha: string
  grado: string
  estado: 'TODOS' | 'PENDIENTE' | 'AUTORIZADO' | 'RECHAZADO'
  searchTerm: string
}

export const useRetiros = () => {
  const [retiros, setRetiros] = useState<Retiro[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<RetirosFilters>({
    fecha: '', // Sin filtro de fecha por defecto
    grado: '',
    estado: 'TODOS',
    searchTerm: ''
  })

  useEffect(() => {
    loadRetiros()
  }, []) // Cargar al montar el componente, sin depender de filtros

  const loadRetiros = async () => {
    console.log('🔄 useRetiros: Iniciando carga de retiros')
    console.log('📋 Filtros actuales:', filters)
    
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        ...(filters.fecha && { fecha: filters.fecha }),
        ...(filters.grado && { grado: filters.grado }),
        ...(filters.estado !== 'TODOS' && { estado: filters.estado }),
        ...(filters.searchTerm && { search: filters.searchTerm })
      })

      const url = `/api/retiros?${params}`
      console.log('🌐 URL de consulta:', url)
      console.log('🔑 Token presente:', !!token)

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('📡 Response status:', response.status)
      console.log('📡 Response ok:', response.ok)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Datos recibidos:', data)
        console.log('📊 Cantidad de retiros:', data.data?.length || 0)
        setRetiros(data.data || [])
      } else {
        const errorText = await response.text()
        console.error('❌ Error loading retiros:', response.status, errorText)
      }
    } catch (error) {
      console.error('💥 Error en loadRetiros:', error)
    } finally {
      setLoading(false)
      console.log('🏁 Carga de retiros finalizada')
    }
  }

  const filteredRetiros = retiros.filter(retiro => {
    const matchesGrado = !filters.grado || retiro.estudiante.grado === filters.grado
    const matchesEstado = filters.estado === 'TODOS' || retiro.estado === filters.estado
    const matchesSearch = !filters.searchTerm || 
      retiro.estudiante.nombre.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      retiro.estudiante.apellido.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      retiro.estudiante.dni.includes(filters.searchTerm) ||
      retiro.motivo.toLowerCase().includes(filters.searchTerm.toLowerCase())

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
      const response = await fetch('/api/retiros/autorizar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          retiroId,
          accion: autorizado ? 'AUTORIZAR' : 'RECHAZAR',
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


  const modificarRetiro = async (retiroId: string, data: {
    fecha?: string
    horaRetiro?: string
    motivo?: string
    observaciones?: string
    personaRecoge?: string
    dniPersonaRecoge?: string
    idEstadoRetiro?: string
  }) => {
    try {
      console.log('Modificando retiro:', retiroId, 'con datos:', data)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/retiros/${retiroId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      console.log('Respuesta del servidor:', response.status, response.statusText)
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        console.log('Resultado de la actualización:', result)
        loadRetiros()
        return true
      } else {
        const errorMsg = result.error || result.message || `Error ${response.status}: ${response.statusText}`
        console.error('Error del servidor:', errorMsg)
        alert(`Error al modificar retiro: ${errorMsg}`)
        return false
      }
    } catch (error) {
      console.error('Error updating retiro:', error)
      alert('Error de conexión al modificar retiro')
      return false
    }
  }

  const eliminarRetiro = async (retiroId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/retiros/${retiroId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        loadRetiros()
        return true
      }
      return false
    } catch (error) {
      console.error('Error deleting retiro:', error)
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
    modificarRetiro,
    eliminarRetiro,
    updateFilters
  }
}
