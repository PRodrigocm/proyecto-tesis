import { useState, useEffect } from 'react'

export interface ReporteData {
  metadatos: {
    tipoReporte: string
    fechaGeneracion: string
    fechaInicio: string
    fechaFin: string
    generadoPor: {
      nombre: string
      especialidad?: string
      codigo?: string
      rol?: string
    }
    institucion: {
      nombre: string
      codigo: string
      modalidad: string
      direccion?: string
      telefono?: string
      email?: string
    }
    filtros: {
      grado?: string
      seccion?: string
    }
  }
  resumenEjecutivo: {
    totalEstudiantes: number
    totalAsistencias: number
    totalRetiros: number
    porcentajes: {
      asistencia: string
      tardanzas: string
      inasistencias: string
    }
    estadisticasAsistencia: {
      presente: number
      tardanza: number
      inasistencia: number
      justificada: number
    }
  }
  estudiantes: EstudianteReporte[]
}

export interface EstudianteReporte {
  id: number
  dni: string
  nombre: string
  apellido: string
  grado: string
  seccion: string
  nivel: string
  estadisticas: {
    totalAsistencias: number
    presente: number
    tardanza: number
    inasistencia: number
    justificada: number
    totalRetiros: number
  }
  asistencias: AsistenciaReporte[]
  retiros: RetiroReporte[]
}

export interface AsistenciaReporte {
  fecha: string
  sesion: string
  horaEntrada?: string
  horaSalida?: string
  estado: string
  codigo: string
  observaciones?: string
  registradoPor?: string
  fechaRegistro: string
}

export interface RetiroReporte {
  fecha: string
  hora: string
  tipoRetiro: string
  estado: string
  origen?: string
  apoderadoContactado?: string
  apoderadoQueRetira?: string
  docenteReportador?: string
  observaciones?: string
  medioContacto?: string
  horaContacto?: string
}

export interface FiltrosReporte {
  tipoReporte: 'semanal' | 'mensual'
  fechaInicio?: string
  fechaFin?: string
  grado?: string
  seccion?: string
}

export interface ConfiguracionExportacion {
  habilitada: boolean
  frecuencia: 'semanal' | 'mensual'
  formato: 'pdf' | 'excel' | 'word'
  diaDelMes: number
  diaDeLaSemana: number
  hora: string
  incluirResumen: boolean
  incluirDetalle: boolean
  incluirGraficos: boolean
  email: string
  notificarPorEmail: boolean
}

export const useReportes = () => {
  const [reporteData, setReporteData] = useState<ReporteData | null>(null)
  const [loading, setLoading] = useState(false)
  const [configuracion, setConfiguracion] = useState<ConfiguracionExportacion | null>(null)
  const [filtros, setFiltros] = useState<FiltrosReporte>({
    tipoReporte: 'semanal'
  })

  // Cargar configuración al inicializar
  useEffect(() => {
    loadConfiguracion()
  }, [])

  const loadConfiguracion = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/docentes/reportes/configuracion', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setConfiguracion(data.data.exportacionAutomatica)
      } else {
        console.error('Error al cargar configuración')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const generarReporte = async (filtrosReporte: FiltrosReporte) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      
      const params = new URLSearchParams()
      params.append('tipo', filtrosReporte.tipoReporte)
      
      if (filtrosReporte.fechaInicio) params.append('fechaInicio', filtrosReporte.fechaInicio)
      if (filtrosReporte.fechaFin) params.append('fechaFin', filtrosReporte.fechaFin)
      if (filtrosReporte.grado) params.append('grado', filtrosReporte.grado)
      if (filtrosReporte.seccion) params.append('seccion', filtrosReporte.seccion)

      const response = await fetch(`/api/docentes/reportes?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setReporteData(data.data)
        setFiltros(filtrosReporte)
        return data.data
      } else {
        const errorText = await response.text()
        console.error('Error al generar reporte:', response.status, errorText)
        return null
      }
    } catch (error) {
      console.error('Error:', error)
      return null
    } finally {
      setLoading(false)
    }
  }

  const exportarReporte = async (formato: 'pdf' | 'excel' | 'word', datos?: ReporteData, configuracionExport?: any) => {
    try {
      const token = localStorage.getItem('token')
      const datosExport = datos || reporteData
      
      if (!datosExport) {
        throw new Error('No hay datos para exportar')
      }

      const response = await fetch('/api/docentes/reportes/exportar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          formato,
          datos: datosExport,
          configuracion: configuracionExport || {}
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Crear y descargar archivo
        const contenidoDecoded = atob(data.data.contenido)
        const bytes = new Uint8Array(contenidoDecoded.length)
        for (let i = 0; i < contenidoDecoded.length; i++) {
          bytes[i] = contenidoDecoded.charCodeAt(i)
        }
        
        const blob = new Blob([bytes], { type: data.data.mimeType })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = data.data.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        return true
      } else {
        console.error('Error al exportar reporte')
        return false
      }
    } catch (error) {
      console.error('Error:', error)
      return false
    }
  }

  const guardarConfiguracion = async (nuevaConfiguracion: ConfiguracionExportacion) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/docentes/reportes/configuracion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          exportacionAutomatica: nuevaConfiguracion
        })
      })

      if (response.ok) {
        const data = await response.json()
        setConfiguracion(data.data.exportacionAutomatica)
        return true
      } else {
        console.error('Error al guardar configuración')
        return false
      }
    } catch (error) {
      console.error('Error:', error)
      return false
    }
  }

  const deshabilitarExportacionAutomatica = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/docentes/reportes/configuracion', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setConfiguracion(prev => prev ? { ...prev, habilitada: false } : null)
        return true
      } else {
        console.error('Error al deshabilitar exportación automática')
        return false
      }
    } catch (error) {
      console.error('Error:', error)
      return false
    }
  }

  // Obtener opciones para filtros
  const getGradosDisponibles = () => {
    if (!reporteData) return []
    const grados = [...new Set(reporteData.estudiantes.map(e => e.grado))].sort()
    return grados
  }

  const getSeccionesDisponibles = (grado?: string) => {
    if (!reporteData) return []
    let estudiantes = reporteData.estudiantes
    if (grado) {
      estudiantes = estudiantes.filter(e => e.grado === grado)
    }
    const secciones = [...new Set(estudiantes.map(e => e.seccion))].sort()
    return secciones
  }

  // Calcular estadísticas adicionales
  const getEstadisticasAvanzadas = () => {
    if (!reporteData) return null

    const { estudiantes, resumenEjecutivo } = reporteData
    
    // Estudiante con mejor asistencia
    const mejorAsistencia = estudiantes.reduce((mejor, actual) => {
      const porcentajeActual = actual.estadisticas.totalAsistencias > 0 ? 
        (actual.estadisticas.presente + actual.estadisticas.tardanza) / actual.estadisticas.totalAsistencias * 100 : 0
      const porcentajeMejor = mejor.estadisticas.totalAsistencias > 0 ? 
        (mejor.estadisticas.presente + mejor.estadisticas.tardanza) / mejor.estadisticas.totalAsistencias * 100 : 0
      
      return porcentajeActual > porcentajeMejor ? actual : mejor
    }, estudiantes[0])

    // Estudiante con más tardanzas
    const masTardanzas = estudiantes.reduce((max, actual) => 
      actual.estadisticas.tardanza > max.estadisticas.tardanza ? actual : max, estudiantes[0])

    // Día con más inasistencias
    const inasistenciasPorDia: { [key: string]: number } = {}
    estudiantes.forEach(estudiante => {
      estudiante.asistencias.forEach(asistencia => {
        if (asistencia.codigo === 'INASISTENCIA') {
          inasistenciasPorDia[asistencia.fecha] = (inasistenciasPorDia[asistencia.fecha] || 0) + 1
        }
      })
    })

    const diaConMasInasistencias = Object.entries(inasistenciasPorDia)
      .sort(([,a], [,b]) => b - a)[0]

    return {
      mejorAsistencia: {
        estudiante: `${mejorAsistencia.nombre} ${mejorAsistencia.apellido}`,
        porcentaje: mejorAsistencia.estadisticas.totalAsistencias > 0 ? 
          ((mejorAsistencia.estadisticas.presente + mejorAsistencia.estadisticas.tardanza) / mejorAsistencia.estadisticas.totalAsistencias * 100).toFixed(1) : '0'
      },
      masTardanzas: {
        estudiante: `${masTardanzas.nombre} ${masTardanzas.apellido}`,
        cantidad: masTardanzas.estadisticas.tardanza
      },
      diaConMasInasistencias: diaConMasInasistencias ? {
        fecha: diaConMasInasistencias[0],
        cantidad: diaConMasInasistencias[1]
      } : null,
      promedioAsistenciaPorEstudiante: estudiantes.length > 0 ? 
        (resumenEjecutivo.totalAsistencias / estudiantes.length).toFixed(1) : '0'
    }
  }

  return {
    reporteData,
    loading,
    configuracion,
    filtros,
    generarReporte,
    exportarReporte,
    guardarConfiguracion,
    deshabilitarExportacionAutomatica,
    loadConfiguracion,
    getGradosDisponibles,
    getSeccionesDisponibles,
    getEstadisticasAvanzadas,
    setFiltros
  }
}
