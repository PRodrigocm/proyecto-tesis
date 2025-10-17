import { useState, useEffect } from 'react'

interface CalendarioEscolarItem {
  fecha: string
  esLectivo: boolean
  motivo?: string
}

interface ExcepcionItem {
  fecha: string
  fechaFin?: string
  tipoExcepcion: 'FERIADO' | 'DIA_NO_LABORABLE' | 'SUSPENSION_CLASES' | 'HORARIO_ESPECIAL' | 'VACACIONES' | 'CAPACITACION' | 'OTRO'
  motivo?: string
  descripcion?: string
}

interface Stats {
  diasLectivos: number
  feriados: number
  suspensiones: number
  totalDias: number
}

export function useAnoLectivo(year: number = new Date().getFullYear()) {
  const [calendarioEscolar, setCalendarioEscolar] = useState<CalendarioEscolarItem[]>([])
  const [excepciones, setExcepciones] = useState<ExcepcionItem[]>([])
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

      // Cargar excepciones
      console.log('⚠️ Cargando excepciones para año:', year)
      const excepcionesResponse = await fetch(`/api/excepciones-horario?year=${year}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (excepcionesResponse.ok) {
        const excepcionesData = await excepcionesResponse.json()
        console.log('⚠️ Excepciones cargadas:', excepcionesData.data?.length || 0, 'registros')
        console.log('⚠️ Datos de excepciones completos:', excepcionesData.data)
        
        // Log específico de cada excepción
        if (excepcionesData.data && excepcionesData.data.length > 0) {
          excepcionesData.data.forEach((exc: any, index: number) => {
            console.log(`  📋 Excepción ${index + 1}:`, {
              fecha: exc.fecha,
              tipo: exc.tipoExcepcion,
              motivo: exc.motivo,
              activo: exc.activo
            })
          })
        }
        
        setExcepciones(excepcionesData.data || [])
      } else {
        console.error('❌ Error cargando excepciones:', excepcionesResponse.status)
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
    tipo: 'LECTIVO' | 'FERIADO' | 'SUSPENSION' | 'VACACIONES'
    descripcion?: string
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
        // Registrar como excepción
        let tipoExcepcion: ExcepcionItem['tipoExcepcion'] = 'OTRO'
        
        switch (eventoData.tipo) {
          case 'FERIADO':
            tipoExcepcion = 'FERIADO'
            break
          case 'SUSPENSION':
            tipoExcepcion = 'SUSPENSION_CLASES'
            break
          case 'VACACIONES':
            tipoExcepcion = 'VACACIONES'
            break
        }

        // Generar motivo automáticamente basado en el tipo
        let motivoAutomatico = ''
        switch (eventoData.tipo) {
          case 'FERIADO':
            motivoAutomatico = 'Feriado'
            break
          case 'SUSPENSION':
            motivoAutomatico = 'Suspensión de Clases'
            break
          case 'VACACIONES':
            motivoAutomatico = 'Vacaciones'
            break
          default:
            motivoAutomatico = eventoData.tipo
        }

        const requestBody = {
          fecha: eventoData.fecha.toISOString().split('T')[0],
          tipoExcepcion,
          tipoHorario: 'AMBOS',
          motivo: motivoAutomatico,
          descripcion: eventoData.descripcion
        }
        console.log('⚠️ Enviando a /api/excepciones-horario:', requestBody)
        
        const response = await fetch('/api/excepciones-horario', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        })

        console.log('📊 Respuesta del servidor (excepciones):', response.status, response.statusText)

        if (!response.ok) {
          const errorData = await response.json()
          console.error('❌ Error del servidor (excepciones):', errorData)
          throw new Error(`Error al registrar excepción: ${errorData.error || response.statusText}`)
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
      console.log('  - Excepciones items:', excepciones.length)
      
    } catch (error) {
      console.error('Error registering evento:', error)
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
    excepciones,
    loading,
    stats,
    loadCalendarioEscolar,
    registrarEvento,
    eliminarEvento
  }
}
