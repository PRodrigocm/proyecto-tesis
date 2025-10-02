export interface ReportData {
  estudiante: {
    id: string
    nombre: string
    apellido: string
    dni: string
    grado: string
    seccion: string
  }
  asistencias: {
    fecha: string
    estado: 'PRESENTE' | 'AUSENTE' | 'TARDANZA' | 'RETIRADO'
    horaEntrada?: string
    horaSalida?: string
  }[]
  resumen: {
    totalDias: number
    diasPresente: number
    diasAusente: number
    diasTardanza: number
    diasRetirado: number
    porcentajeAsistencia: number
  }
}

export interface ReportStats {
  totalEstudiantes: number
  promedioAsistencia: number
  estudiantesConBajaAsistencia: number
  diasAnalizados: number
}

export const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.style.display = 'none'
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

export const getReportTitle = (tipoReporte: string): string => {
  switch (tipoReporte) {
    case 'semanal':
      return 'Reporte Semanal de Asistencia'
    case 'mensual':
      return 'Reporte Mensual de Asistencia'
    case 'anual':
      return 'Reporte Anual de Asistencia'
    default:
      return 'Reporte de Asistencia'
  }
}

export const getAsistenciaColor = (porcentaje: number): string => {
  if (porcentaje >= 85) return 'text-green-600'
  if (porcentaje >= 70) return 'text-yellow-600'
  return 'text-red-600'
}

export const getAsistenciaBadgeColor = (porcentaje: number): string => {
  if (porcentaje >= 85) return 'bg-green-100 text-green-800'
  if (porcentaje >= 70) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}
