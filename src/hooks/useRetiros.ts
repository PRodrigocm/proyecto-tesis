import { useState, useEffect } from 'react'

export interface Retiro {
  id: string
  fecha: string
  horaRetiro: string
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
  creadoPor?: {
    nombre: string
    apellido: string
    rol: string
  } | null
  origen?: string
  origenColor?: string
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
  }, [filters.fecha]) // Recargar cuando cambie la fecha

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
    // Filtrar por fecha si está especificada
    const matchesFecha = !filters.fecha || retiro.fecha.startsWith(filters.fecha)
    const matchesGrado = !filters.grado || retiro.estudiante.grado === filters.grado
    const matchesEstado = filters.estado === 'TODOS' || retiro.estado === filters.estado
    const matchesSearch = !filters.searchTerm || 
      retiro.estudiante.nombre.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      retiro.estudiante.apellido.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      retiro.estudiante.dni.includes(filters.searchTerm)

    return matchesFecha && matchesGrado && matchesEstado && matchesSearch
  })

  const grados = [...new Set(retiros.map(r => r.estudiante.grado))].filter(Boolean).sort()

  const solicitarRetiro = async (data: {
    estudianteId: string
    horaRetiro: string
    motivo?: string
    observaciones?: string
    personaRecoge?: string
    dniPersonaRecoge?: string
    apoderadoQueRetira?: string
    medioContacto?: string
    fecha?: string
  }) => {
    try {
      const token = localStorage.getItem('token')
      
      // Preparar datos para enviar
      const payload = {
        estudianteId: data.estudianteId,
        horaRetiro: data.horaRetiro,
        motivo: data.motivo || 'Retiro solicitado',
        observaciones: data.observaciones,
        personaRecoge: data.personaRecoge,
        dniPersonaRecoge: data.dniPersonaRecoge,
        apoderadoQueRetira: data.apoderadoQueRetira, // ID del apoderado que retira
        medioContacto: data.medioContacto,
        horaContacto: new Date().toISOString(), // Hora actual del contacto
        fecha: data.fecha || filters.fecha || new Date().toISOString().split('T')[0]
      }
      
      console.log('📤 Enviando solicitud de retiro:', payload)
      
      const response = await fetch('/api/retiros', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()
      console.log('📥 Respuesta del servidor:', result)

      if (response.ok && result.success) {
        loadRetiros()
        return true
      } else {
        console.error('❌ Error al crear retiro:', result.error || result.message)
        alert(`Error: ${result.error || result.message || 'No se pudo crear el retiro'}`)
        return false
      }
    } catch (error) {
      console.error('Error creating retiro:', error)
      alert('Error de conexión al crear retiro')
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
