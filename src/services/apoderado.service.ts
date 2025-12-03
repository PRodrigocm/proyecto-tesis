/**
 * Servicio de Apoderado
 * Capa de abstracción para todas las llamadas a la API del apoderado
 */

const API_BASE = '/api/apoderados'

// Tipos
export interface Estudiante {
  id: string
  nombre: string
  apellido: string
  dni: string
  grado: string
  seccion: string
  codigoEstudiante: string
  relacion?: string
  esTitular?: boolean
}

export interface Estadisticas {
  totalEstudiantes: number
  retirosPendientes: number
  justificacionesPendientes: number
  asistenciaPromedio: number
}

export interface RetiroPendiente {
  id: string
  fecha: string
  hora: string
  motivo: string
  observaciones: string
  tipoRetiro: string
  estado: string
  estudiante: {
    id: string
    nombre: string
    apellido: string
    dni: string
    grado: string
    seccion: string
  }
  solicitadoPor: string
  fechaSolicitud: string
}

export interface InasistenciaPendiente {
  id: string
  fecha: string
  sesion: string
  estudiante: {
    id: string
    nombre: string
    apellido: string
    dni: string
    grado: string
    seccion: string
  }
  estado: string
  fechaRegistro: string
}

export interface HistorialItem {
  id: string
  tipo: 'RETIRO' | 'JUSTIFICACION'
  fecha: string
  estudiante: {
    nombre: string
    apellido: string
    grado: string
    seccion: string
  }
  estado: string
  motivo: string
  descripcion?: string
  fechaCreacion: string
  fechaAprobacion?: string
  aprobadoPor?: string
  creadoPor?: string
}

export interface AsistenciaIE {
  id: string
  fecha: string
  horaEntrada?: string
  horaSalida?: string
  estado: 'PRESENTE' | 'AUSENTE' | 'TARDANZA'
  estudiante: Estudiante
}

export interface AsistenciaAula {
  id: string
  fecha: string
  hora: string
  materia: string
  aula: string
  estado: 'PRESENTE' | 'AUSENTE' | 'TARDANZA' | 'JUSTIFICADO'
  estudiante: Estudiante
}

export interface Notificacion {
  id: string
  tipo: string
  titulo: string
  mensaje: string
  fecha: string
  leida: boolean
  estudiante?: string
  urgente?: boolean
}

export interface NotificacionConfig {
  estudianteId: string
  entradaIE: {
    email: boolean
    telefono: boolean
  }
  salidaIE: {
    email: boolean
    telefono: boolean
  }
  asistenciaAulas: {
    email: boolean
    telefono: boolean
  }
}

// Funciones auxiliares
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

const getHeaders = (): HeadersInit => {
  const token = getToken()
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

// Servicios de Estudiantes
export const estudiantesService = {
  async getAll(): Promise<Estudiante[]> {
    const response = await fetch(`${API_BASE}/estudiantes`, {
      headers: getHeaders()
    })
    if (!response.ok) throw new Error('Error al cargar estudiantes')
    const data = await response.json()
    return data.estudiantes || []
  }
}

// Servicios de Estadísticas
export const estadisticasService = {
  async get(): Promise<Estadisticas> {
    const response = await fetch(`${API_BASE}/estadisticas`, {
      headers: getHeaders()
    })
    if (!response.ok) throw new Error('Error al cargar estadísticas')
    const data = await response.json()
    return data.estadisticas
  }
}

// Servicios de Retiros
export const retirosService = {
  async getPendientes(): Promise<RetiroPendiente[]> {
    const response = await fetch(`${API_BASE}/retiros/pendientes`, {
      headers: getHeaders()
    })
    if (!response.ok) throw new Error('Error al cargar retiros pendientes')
    const data = await response.json()
    return data.retiros || []
  },

  async solicitar(retiroData: {
    estudianteId: string
    fecha: string
    hora: string
    motivo: string
    tipoRetiro: string
    observaciones?: string
  }): Promise<void> {
    const response = await fetch(`${API_BASE}/retiros/solicitar`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(retiroData)
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al solicitar retiro')
    }
  },

  async aprobar(retiroId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/retiros/${retiroId}/aprobar`, {
      method: 'PUT',
      headers: getHeaders()
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al aprobar retiro')
    }
  },

  async rechazar(retiroId: string, motivo: string): Promise<void> {
    const response = await fetch(`${API_BASE}/retiros/${retiroId}/rechazar`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ motivo })
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al rechazar retiro')
    }
  }
}

// Servicios de Justificaciones
export const justificacionesService = {
  async getPendientes(estudianteId?: string): Promise<InasistenciaPendiente[]> {
    const url = estudianteId 
      ? `${API_BASE}/justificaciones/pendientes?estudianteId=${estudianteId}`
      : `${API_BASE}/justificaciones/pendientes`
    
    const response = await fetch(url, {
      headers: getHeaders()
    })
    if (!response.ok) throw new Error('Error al cargar inasistencias pendientes')
    const data = await response.json()
    return data.inasistencias || []
  },

  async crear(formData: FormData): Promise<void> {
    const token = getToken()
    const response = await fetch(`${API_BASE}/justificaciones/crear`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al crear justificación')
    }
  }
}

// Servicios de Historial
export const historialService = {
  async get(): Promise<HistorialItem[]> {
    const response = await fetch(`${API_BASE}/historial`, {
      headers: getHeaders()
    })
    if (!response.ok) throw new Error('Error al cargar historial')
    const data = await response.json()
    return data.historial || []
  }
}

// Servicios de Asistencias
export const asistenciasService = {
  async getIE(estudianteId: string, fechaInicio: string, fechaFin: string): Promise<AsistenciaIE[]> {
    const response = await fetch(
      `${API_BASE}/asistencias/ie?estudianteId=${estudianteId}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
      { headers: getHeaders() }
    )
    if (!response.ok) throw new Error('Error al cargar asistencias IE')
    const data = await response.json()
    return data.asistencias || []
  },

  async getAulas(estudianteId: string, fechaInicio: string, fechaFin: string): Promise<AsistenciaAula[]> {
    const response = await fetch(
      `${API_BASE}/asistencias/aulas?estudianteId=${estudianteId}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
      { headers: getHeaders() }
    )
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('❌ Error en API asistencias/aulas:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
      throw new Error(errorData.error || 'Error al cargar asistencias de aulas')
    }
    const data = await response.json()
    return data.asistencias || []
  }
}

// Servicios de Notificaciones
export const notificacionesService = {
  async getAll(): Promise<Notificacion[]> {
    const response = await fetch(`${API_BASE}/notificaciones`, {
      headers: getHeaders()
    })
    if (!response.ok) throw new Error('Error al cargar notificaciones')
    const data = await response.json()
    return data.notificaciones || []
  },

  async marcarComoLeida(notificacionId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/notificaciones/${notificacionId}/leer`, {
      method: 'PUT',
      headers: getHeaders()
    })
    if (!response.ok) throw new Error('Error al marcar notificación como leída')
  },

  async getConfig(): Promise<NotificacionConfig[]> {
    const response = await fetch(`${API_BASE}/notificaciones/config`, {
      headers: getHeaders()
    })
    if (!response.ok) throw new Error('Error al cargar configuración de notificaciones')
    const data = await response.json()
    return data.configuraciones || []
  },

  async updateConfig(config: Partial<NotificacionConfig> & { estudianteId: string }): Promise<void> {
    const response = await fetch(`${API_BASE}/notificaciones/config`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(config)
    })
    if (!response.ok) throw new Error('Error al actualizar configuración de notificaciones')
  }
}
