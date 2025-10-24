import { useState, useEffect } from 'react'

// DEPRECADO: Este hook ahora usa la API de horarios base
// Los horarios semanales complejos fueron eliminados del sistema
export interface HorarioSemanalDetalle {
  id: string
  diaSemana: number
  diaNombre: string
  horaInicio: string
  horaFin: string
  materia: string
  docente: string
  aula: string
  tipoActividad: 'CLASE_REGULAR' | 'REFORZAMIENTO' | 'RECUPERACION' | 'EVALUACION'
  tipoActividadLabel: string
  observaciones: string
  grado: string
  seccion: string
  activo: boolean
}

export interface HorarioSemanal {
  id: string
  nombre: string
  descripcion: string
  fechaInicio: string
  fechaFin: string
  activo: boolean
  ie: {
    id: string
    nombre: string
  }
  detalles: HorarioSemanalDetalle[]
  createdAt: string
  updatedAt: string | null
}

export interface HorarioSemanalFilters {
  fechaInicio: string
  fechaFin: string
  activo: string
}

export const useHorariosSemanales = () => {
  const [horarios, setHorarios] = useState<HorarioSemanal[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<HorarioSemanalFilters>({
    fechaInicio: '',
    fechaFin: '',
    activo: 'true'
  })

  useEffect(() => {
    loadHorarios()
  }, [])

  const loadHorarios = async () => {
    setLoading(true)
    try {
      console.log('⚠️ DEPRECADO: useHorariosSemanales ahora usa API de horarios base')
      
      const token = localStorage.getItem('token')
      
      // Obtener ieId del usuario
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        console.error('No user data found')
        setHorarios([])
        return
      }
      
      const user = JSON.parse(userStr)
      const ieId = user.idIe || user.institucionId || user.ieId || 1
      
      console.log('🔄 Cargando horarios base en lugar de horarios semanales...')
      
      const params = new URLSearchParams()
      params.append('ieId', ieId.toString())

      // Usar la nueva API de horarios base
      const response = await fetch(`/api/horarios/base?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Horarios base cargados exitosamente:', data)
        
        // Transformar horarios base a formato semanal para compatibilidad
        const horariosTransformados = transformarHorariosBase(data.data || [])
        setHorarios(horariosTransformados)
      } else {
        const errorText = await response.text()
        console.error('❌ Error loading horarios base:', response.status, errorText)
        setHorarios([])
      }
    } catch (error) {
      console.error('❌ Error:', error)
      setHorarios([])
    } finally {
      setLoading(false)
    }
  }

  // Función para transformar horarios base al formato semanal (compatibilidad)
  const transformarHorariosBase = (horariosBase: any[]): HorarioSemanal[] => {
    console.log('🔄 Transformando horarios base a formato semanal...')
    
    if (!horariosBase.length) return []

    // Agrupar por grado-sección
    const agrupados = horariosBase.reduce((acc: Record<string, any[]>, horario: any) => {
      const key = `${horario.grado}° ${horario.seccion}`
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(horario)
      return acc
    }, {} as Record<string, any[]>)

    // Crear horarios semanales virtuales
    const horariosSemanales: HorarioSemanal[] = Object.entries(agrupados).map(([gradoSeccion, horarios]: [string, any[]], index) => {
      const primerHorario = horarios[0]
      
      const detalles: HorarioSemanalDetalle[] = horarios.map((horario: any) => ({
        id: horario.id,
        diaSemana: horario.diaNumero,
        diaNombre: horario.diaSemana,
        horaInicio: horario.horaInicio,
        horaFin: horario.horaFin,
        materia: 'Clases Regulares',
        docente: horario.docente,
        aula: horario.aula || 'Sin especificar',
        tipoActividad: 'CLASE_REGULAR' as const,
        tipoActividadLabel: 'Clase Regular',
        observaciones: '',
        grado: horario.grado,
        seccion: horario.seccion,
        activo: horario.activo
      }))

      return {
        id: `virtual-${index}`,
        nombre: `Horario Base ${gradoSeccion}`,
        descripcion: `Horario base para ${gradoSeccion} (L-V ${primerHorario.horaInicio}-${primerHorario.horaFin})`,
        fechaInicio: new Date().toISOString().split('T')[0],
        fechaFin: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        activo: true,
        ie: {
          id: '1',
          nombre: 'Institución Educativa'
        },
        detalles,
        createdAt: primerHorario.createdAt,
        updatedAt: null
      }
    })

    console.log('✅ Horarios transformados:', horariosSemanales.length)
    return horariosSemanales
  }

  const crearHorario = async (data: {
    nombre: string
    descripcion?: string
    fechaInicio: string
    fechaFin: string
    detalles: Array<{
      idHorarioBase: string
      diaSemana: number
      horaInicio: string
      horaFin: string
      materia?: string
      docente?: string
      aula?: string
      tipoActividad?: string
      observaciones?: string
    }>
  }) => {
    console.warn('⚠️ DEPRECADO: crearHorario en useHorariosSemanales')
    console.warn('📋 Usa el nuevo sistema de horarios base: /api/horarios/base')
    console.warn('🔗 Hook recomendado: useHorariosBase')
    
    // Mostrar alerta al usuario
    alert('⚠️ Función deprecada\n\nEsta funcionalidad ha sido reemplazada por el nuevo sistema de horarios base.\n\nUsa el modal "Crear Horario Base" en su lugar.')
    
    return false
  }

  const updateFilters = (newFilters: Partial<HorarioSemanalFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const tiposActividad = [
    { value: 'CLASE_REGULAR', label: 'Clase Regular' },
    { value: 'REFORZAMIENTO', label: 'Reforzamiento' },
    { value: 'RECUPERACION', label: 'Recuperación' },
    { value: 'EVALUACION', label: 'Evaluación' }
  ]

  const diasSemana = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
    { value: 7, label: 'Domingo' }
  ]

  // Filtrar horarios por día de la semana
  const getHorariosPorDia = (diaSemana: number) => {
    return horarios.flatMap(horario => 
      horario.detalles.filter(detalle => detalle.diaSemana === diaSemana)
    )
  }

  // Obtener horarios de fin de semana (reforzamiento/recuperación)
  const getHorariosFinDeSemana = () => {
    return horarios.flatMap(horario => 
      horario.detalles.filter(detalle => 
        detalle.diaSemana === 6 || detalle.diaSemana === 7
      )
    )
  }

  const stats = {
    total: horarios.length,
    activos: horarios.filter(h => h.activo).length,
    inactivos: horarios.filter(h => !h.activo).length,
    conReforzamiento: horarios.filter(h => 
      h.detalles.some(d => d.tipoActividad === 'REFORZAMIENTO')
    ).length,
    conRecuperacion: horarios.filter(h => 
      h.detalles.some(d => d.tipoActividad === 'RECUPERACION')
    ).length,
    finDeSemana: horarios.filter(h => 
      h.detalles.some(d => d.diaSemana === 6 || d.diaSemana === 7)
    ).length
  }

  return {
    horarios,
    loading,
    filters,
    tiposActividad,
    diasSemana,
    stats,
    loadHorarios,
    crearHorario,
    updateFilters,
    getHorariosPorDia,
    getHorariosFinDeSemana
  }
}
