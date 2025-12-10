import { useState, useEffect } from 'react'

export interface Justificacion {
  idJustificacion: number
  estudiante: {
    usuario: {
      nombre: string
      apellido: string
      dni: string
    }
    gradoSeccion: {
      grado: { nombre: string }
      seccion: { nombre: string }
    } | null
  }
  tipoJustificacion: {
    nombre: string
    codigo: string
  }
  estadoJustificacion: {
    nombre: string
    codigo: string
  }
  fechaInicio: string
  fechaFin: string
  motivo: string
  observaciones?: string
  fechaPresentacion: string
  usuarioRevisor?: {
    nombre: string
    apellido: string
  }
  fechaRevision?: string
  observacionesRevision?: string
  documentos: Array<{
    idDocumento: number
    nombreArchivo: string
    tipoArchivo: string
  }>
  asistenciasAfectadas: Array<{
    asistencia: {
      fecha: string
      sesion: string
      estadoAsistencia: {
        nombreEstado: string
        codigo: string
      }
    }
  }>
}

export interface JustificacionesResponse {
  success: boolean
  data: Justificacion[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface FiltrosJustificaciones {
  estado?: string
  fechaInicio?: string
  fechaFin?: string
  estudianteId?: string
  page?: number
  limit?: number
}

export interface EstadoJustificacion {
  idEstadoJustificacion: number
  codigo: string
  nombre: string
  orden: number
  activo: boolean
}

export function useJustificaciones() {
  const [justificaciones, setJustificaciones] = useState<Justificacion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [estadosDisponibles, setEstadosDisponibles] = useState<EstadoJustificacion[]>([])

  // Cargar justificaciones
  const loadJustificaciones = async (filtros: FiltrosJustificaciones = {}) => {
    try {
      setLoading(true)
      setError('')

      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación')
      }

      const params = new URLSearchParams()
      if (filtros.estado) params.append('estado', filtros.estado)
      if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio)
      if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin)
      if (filtros.estudianteId) params.append('estudianteId', filtros.estudianteId)
      params.append('page', (filtros.page || 1).toString())
      params.append('limit', (filtros.limit || 10).toString())

      console.log('🔍 Cargando justificaciones con filtros:', filtros)

      const response = await fetch(`/api/justificaciones?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data: JustificacionesResponse = await response.json()
        console.log('✅ Justificaciones cargadas:', data.data.length)
        
        setJustificaciones(data.data)
        setPagination(data.pagination)
        return data.data
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || `Error ${response.status}`)
      }
    } catch (error) {
      console.error('❌ Error cargando justificaciones:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(errorMessage)
      
      // Datos de ejemplo para desarrollo
      const ejemploJustificaciones: Justificacion[] = [
        {
          idJustificacion: 1,
          estudiante: {
            usuario: {
              nombre: 'Juan Carlos',
              apellido: 'Pérez García',
              dni: '12345678'
            },
            gradoSeccion: {
              grado: { nombre: '3' },
              seccion: { nombre: 'A' }
            }
          },
          tipoJustificacion: {
            nombre: 'Justificación Médica',
            codigo: 'MEDICA'
          },
          estadoJustificacion: {
            nombre: 'Pendiente',
            codigo: 'PENDIENTE'
          },
          fechaInicio: '2024-01-15',
          fechaFin: '2024-01-17',
          motivo: 'Cita médica de control y exámenes de laboratorio',
          observaciones: 'Adjunta certificado médico',
          fechaPresentacion: '2024-01-14T10:30:00Z',
          documentos: [
            {
              idDocumento: 1,
              nombreArchivo: 'certificado_medico.pdf',
              tipoArchivo: 'pdf'
            }
          ],
          asistenciasAfectadas: [
            {
              asistencia: {
                fecha: '2024-01-15',
                sesion: 'AM',
                estadoAsistencia: {
                  nombreEstado: 'Inasistencia',
                  codigo: 'INASISTENCIA'
                }
              }
            }
          ]
        },
        {
          idJustificacion: 2,
          estudiante: {
            usuario: {
              nombre: 'María Elena',
              apellido: 'González López',
              dni: '87654321'
            },
            gradoSeccion: {
              grado: { nombre: '2' },
              seccion: { nombre: 'B' }
            }
          },
          tipoJustificacion: {
            nombre: 'Justificación Familiar',
            codigo: 'FAMILIAR'
          },
          estadoJustificacion: {
            nombre: 'Pendiente',
            codigo: 'PENDIENTE'
          },
          fechaInicio: '2024-01-18',
          fechaFin: '2024-01-18',
          motivo: 'Viaje familiar urgente por enfermedad de familiar',
          fechaPresentacion: '2024-01-17T14:20:00Z',
          documentos: [],
          asistenciasAfectadas: [
            {
              asistencia: {
                fecha: '2024-01-18',
                sesion: 'AM',
                estadoAsistencia: {
                  nombreEstado: 'Inasistencia',
                  codigo: 'INASISTENCIA'
                }
              }
            }
          ]
        }
      ]
      
      setJustificaciones(ejemploJustificaciones)
      setPagination({
        page: 1,
        limit: 10,
        total: ejemploJustificaciones.length,
        pages: 1
      })
      
      return ejemploJustificaciones
    } finally {
      setLoading(false)
    }
  }

  // Revisar justificación (aprobar/rechazar)
  const revisarJustificacion = async (
    idJustificacion: number, 
    accion: 'APROBAR' | 'RECHAZAR', 
    observacionesRevision?: string
  ) => {
    try {
      setLoading(true)
      setError('')

      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación')
      }

      console.log(`📝 ${accion === 'APROBAR' ? 'Aprobando' : 'Rechazando'} justificación ${idJustificacion}`)

      const response = await fetch(`/api/justificaciones/${idJustificacion}/revisar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accion,
          observacionesRevision
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Justificación ${accion === 'APROBAR' ? 'aprobada' : 'rechazada'} exitosamente`)
        
        // Actualizar la justificación en el estado local
        setJustificaciones(prev => 
          prev.map(j => 
            j.idJustificacion === idJustificacion 
              ? { ...j, ...data.data }
              : j
          )
        )
        
        return data.data
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        
        // Manejar errores específicos
        if (errorData.errorCode === 'ESTADO_NO_ENCONTRADO') {
          throw new Error('El estado configurado no existe en la base de datos. El sistema intentará crearlo automáticamente. Si el problema persiste, contacte al administrador.')
        }
        
        if (errorData.errorCode === 'ESTADO_NO_CREADO') {
          throw new Error('No se pudo crear el estado automáticamente. Contacte al administrador del sistema para que inicialice los estados de justificación.')
        }
        
        throw new Error(errorData.error || `Error ${response.status}: ${errorData.details || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('❌ Error al revisar justificación:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Obtener estadísticas
  const getEstadisticas = () => {
    const pendientes = justificaciones.filter(j => j.estadoJustificacion.codigo === 'PENDIENTE').length
    const aprobadas = justificaciones.filter(j => j.estadoJustificacion.codigo === 'APROBADO').length
    const rechazadas = justificaciones.filter(j => j.estadoJustificacion.codigo === 'RECHAZADO').length
    
    return {
      total: justificaciones.length,
      pendientes,
      aprobadas,
      rechazadas
    }
  }

  // Cargar estados disponibles desde la BD
  const loadEstados = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación')
      }

      const response = await fetch('/api/estados/justificacion', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setEstadosDisponibles(data.data)
        console.log(`✅ Estados cargados: ${data.data.length}`)
        return data.data
      } else {
        console.error('❌ Error al cargar estados')
        return []
      }
    } catch (error) {
      console.error('❌ Error al cargar estados:', error)
      return []
    }
  }

  return {
    justificaciones,
    loading,
    error,
    pagination,
    estadosDisponibles,
    loadJustificaciones,
    loadEstados,
    revisarJustificacion,
    getEstadisticas
  }
}
