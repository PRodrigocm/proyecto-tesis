import { useState, useEffect } from 'react'

interface CalendarioEscolarItem {
  fecha: string
  esLectivo: boolean
  motivo?: string
}

interface Stats {
  diasLectivos: number
  feriados: number
  suspensiones: number
  totalDias: number
}

export function useAnoLectivo(year: number = new Date().getFullYear()) {
  const [calendarioEscolar, setCalendarioEscolar] = useState<CalendarioEscolarItem[]>([])
  const [loading, setLoading] = useState(true)
  const currentYear = new Date().getFullYear()
  const [stats, setStats] = useState<Stats>({
    diasLectivos: 0,
    feriados: 0,
    suspensiones: 0,
    totalDias: year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 366 : 365 // Año bisiesto
  })

  const loadCalendarioEscolar = async () => {
    setLoading(true)
    console.log(`📅 Cargando calendario escolar para el año: ${year}${year === currentYear ? ' (Año Actual)' : ''}`)
    try {
      const token = localStorage.getItem('token')
      
      // Cargar calendario escolar
      const calendarioResponse = await fetch(`/api/calendario-escolar?year=${year}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (calendarioResponse.ok) {
        const calendarioData = await calendarioResponse.json()
        setCalendarioEscolar(calendarioData.data || [])
      }

      // Cargar estadísticas
      const statsResponse = await fetch(`/api/calendario-escolar/stats?year=${year}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.data || stats)
      }

    } catch (error) {
      console.error('Error loading calendario escolar:', error)
    } finally {
      setLoading(false)
    }
  }

  const registrarEvento = async (eventoData: {
    fecha: Date
    fechaInicio: Date
    fechaFin?: Date
    horaInicio?: string
    horaFin?: string
    tipo: 'LECTIVO' | 'FERIADO' | 'SUSPENSION' | 'VACACIONES' | 'EVENTO'
    descripcion?: string
    alcance?: string
    nivel?: string
    gradoInicio?: string
    gradoFin?: string
    idGradoSeccion?: number
    idHorarioClase?: number
    notificarPadres?: boolean
  }) => {
    console.log('🎯 Iniciando registro de evento:', eventoData)
    try {
      const token = localStorage.getItem('token')
      console.log('🔑 Token obtenido:', token ? 'Sí' : 'No')
      
      if (eventoData.tipo === 'LECTIVO') {
        // Los días lectivos no se guardan en BD - son por defecto
        console.log('📅 Día lectivo: No se guarda en BD (es por defecto)')
        console.log('✅ Día lectivo procesado exitosamente (sin guardar)')
      } else {
        // Registrar en CalendarioEscolar
        let tipoDia = 'EVENTO'
        
        switch (eventoData.tipo) {
          case 'FERIADO':
            tipoDia = 'FERIADO'
            break
          case 'SUSPENSION':
          case 'VACACIONES':
            tipoDia = 'VACACIONES'
            break
          case 'EVENTO':
            tipoDia = 'EVENTO'
            break
        }

        // Generar descripción automática si no se proporciona
        let descripcionFinal = eventoData.descripcion
        if (!descripcionFinal) {
          switch (eventoData.tipo) {
            case 'FERIADO':
              descripcionFinal = 'Feriado'
              break
            case 'SUSPENSION':
              descripcionFinal = 'Suspensión de Clases'
              break
            case 'VACACIONES':
              descripcionFinal = 'Vacaciones'
              break
            default:
              descripcionFinal = 'Evento Especial'
          }
        }

        const requestBody = {
          fechaInicio: eventoData.fechaInicio.toISOString().split('T')[0],
          fechaFin: (eventoData.fechaFin || eventoData.fechaInicio).toISOString().split('T')[0],
          tipoDia,
          descripcion: descripcionFinal
        }

        console.log('📅 Enviando a /api/calendario:', requestBody)
        
        const response = await fetch('/api/calendario', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        })

        console.log('📊 Respuesta del servidor (calendario):', response.status, response.statusText)

        if (!response.ok) {
          const errorData = await response.json()
          console.error('❌ Error del servidor (calendario):', errorData)
          throw new Error(`Error al registrar evento: ${errorData.error || response.statusText}`)
        }
        
        const result = await response.json()
        console.log('✅ Excepción registrada exitosamente:', result)
      }

      // Recargar datos
      console.log('🔄 Recargando datos del calendario...')
      await loadCalendarioEscolar()
      console.log('✅ Datos recargados exitosamente')
      console.log('📊 Estado actual después de recarga:')
      console.log('  - Calendario escolar items:', calendarioEscolar.length)
      
    } catch (error) {
      console.error('Error registering evento:', error)
      throw error
    }
  }

  const actualizarEvento = async (eventoId: string, eventoData: {
    fechaInicio: Date
    fechaFin?: Date
    tipo: 'LECTIVO' | 'FERIADO' | 'SUSPENSION' | 'VACACIONES' | 'EVENTO'
    descripcion?: string
  }) => {
    console.log('🔄 Actualizando evento:', eventoId, eventoData)
    try {
      const token = localStorage.getItem('token')
      
      let tipoDia = 'EVENTO'
      switch (eventoData.tipo) {
        case 'FERIADO':
          tipoDia = 'FERIADO'
          break
        case 'SUSPENSION':
        case 'VACACIONES':
          tipoDia = 'VACACIONES'
          break
        case 'EVENTO':
          tipoDia = 'EVENTO'
          break
      }

      const requestBody = {
        fechaInicio: eventoData.fechaInicio.toISOString().split('T')[0],
        fechaFin: (eventoData.fechaFin || eventoData.fechaInicio).toISOString().split('T')[0],
        tipoDia,
        descripcion: eventoData.descripcion || 'Evento actualizado'
      }

      console.log('📅 Enviando actualización a /api/calendario-escolar:', requestBody)
      
      const response = await fetch(`/api/calendario-escolar/${eventoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      })

      console.log('📊 Respuesta del servidor (actualización):', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Error del servidor (actualización):', errorData)
        throw new Error(`Error al actualizar evento: ${errorData.error || response.statusText}`)
      }
      
      const result = await response.json()
      console.log('✅ Evento actualizado exitosamente:', result)

      // Recargar datos
      console.log('🔄 Recargando datos del calendario...')
      await loadCalendarioEscolar()
      console.log('✅ Datos recargados exitosamente')
      
    } catch (error) {
      console.error('Error updating evento:', error)
      throw error
    }
  }

  const eliminarEvento = async (fecha: string) => {
    try {
      const token = localStorage.getItem('token')
      
      // Intentar eliminar de calendario escolar
      await fetch(`/api/calendario-escolar?fecha=${fecha}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      // Intentar eliminar de excepciones
      await fetch(`/api/excepciones-horario?fecha=${fecha}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      // Recargar datos
      await loadCalendarioEscolar()
      
    } catch (error) {
      console.error('Error deleting evento:', error)
      throw error
    }
  }

  useEffect(() => {
    loadCalendarioEscolar()
  }, [year])

  return {
    calendarioEscolar,
    loading,
    stats,
    loadCalendarioEscolar,
    registrarEvento,
    actualizarEvento,
    eliminarEvento
  }
}
