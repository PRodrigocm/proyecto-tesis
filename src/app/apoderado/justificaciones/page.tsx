'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  estudiantesService, 
  justificacionesService,
  type Estudiante,
  type InasistenciaPendiente
} from '@/services/apoderado.service'

/**
 * Parsea una fecha ISO string y la muestra correctamente sin problemas de zona horaria
 * Evita que 2025-12-04T00:00:00.000Z se muestre como 3 de diciembre en Lima
 */
function parsearFechaLocal(fechaISO: string): Date {
  // Extraer solo la parte de la fecha (YYYY-MM-DD)
  const fechaStr = fechaISO.split('T')[0]
  const [anio, mes, dia] = fechaStr.split('-').map(Number)
  // Crear fecha a mediodía para evitar problemas de zona horaria
  return new Date(anio, mes - 1, dia, 12, 0, 0)
}

interface JustificacionForm {
  inasistenciaId: string
  motivo: string
  descripcion: string
  tipoJustificacion: 'MEDICA' | 'FAMILIAR' | 'PERSONAL' | 'OTRA'
  documentoAdjunto?: File
}

export default function JustificarInasistencias() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [inasistenciasPendientes, setInasistenciasPendientes] = useState<InasistenciaPendiente[]>([])
  const [selectedEstudiante, setSelectedEstudiante] = useState('')
  const [showJustificarModal, setShowJustificarModal] = useState(false)
  const [selectedInasistencia, setSelectedInasistencia] = useState<InasistenciaPendiente | null>(null)
  const [formData, setFormData] = useState<JustificacionForm>({
    inasistenciaId: '',
    motivo: '',
    descripcion: '',
    tipoJustificacion: 'PERSONAL'
  })

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token')
      const userString = localStorage.getItem('user')
      
      if (!token || !userString) {
        router.push('/login')
        return false
      }

      try {
        const user = JSON.parse(userString)
        if (user.rol !== 'APODERADO') {
          router.push('/login')
          return false
        }
        return true
      } catch (error) {
        router.push('/login')
        return false
      }
    }

    if (checkAuth()) {
      loadInitialData()
    }
  }, [router])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadEstudiantes(),
        loadInasistenciasPendientes()
      ])
    } catch (error) {
      console.error('Error loading initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadEstudiantes = async () => {
    try {
      const data = await estudiantesService.getAll()
      setEstudiantes(data)
    } catch (error) {
      console.error('Error loading estudiantes:', error)
    }
  }

  const loadInasistenciasPendientes = async (estudianteId?: string) => {
    try {
      const data = await justificacionesService.getPendientes(estudianteId)
      setInasistenciasPendientes(data)
    } catch (error) {
      console.error('Error loading inasistencias pendientes:', error)
    }
  }

  const handleEstudianteChange = (estudianteId: string) => {
    setSelectedEstudiante(estudianteId)
    if (estudianteId) {
      loadInasistenciasPendientes(estudianteId)
    } else {
      loadInasistenciasPendientes()
    }
  }

  const openJustificarModal = (inasistencia: InasistenciaPendiente) => {
    setSelectedInasistencia(inasistencia)
    setFormData({
      inasistenciaId: inasistencia.id,
      motivo: '',
      descripcion: '',
      tipoJustificacion: 'PERSONAL'
    })
    setShowJustificarModal(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({
        ...prev,
        documentoAdjunto: file
      }))
    }
  }

  const handleSubmitJustificacion = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.motivo || !formData.descripcion) {
      alert('Por favor complete todos los campos requeridos')
      return
    }

    setSubmitting(true)
    try {
      const formDataToSend = new FormData()
      
      formDataToSend.append('inasistenciaId', formData.inasistenciaId)
      formDataToSend.append('motivo', formData.motivo)
      formDataToSend.append('descripcion', formData.descripcion)
      formDataToSend.append('tipoJustificacion', formData.tipoJustificacion)
      
      if (formData.documentoAdjunto) {
        formDataToSend.append('documento', formData.documentoAdjunto)
      }

      await justificacionesService.crear(formDataToSend)
      alert('Justificación enviada exitosamente')
      setShowJustificarModal(false)
      loadInasistenciasPendientes(selectedEstudiante || undefined)
    } catch (error: any) {
      console.error('Error submitting justificacion:', error)
      alert(error.message || 'Error al enviar la justificación')
    } finally {
      setSubmitting(false)
    }
  }

  const getTipoJustificacionLabel = (tipo: string) => {
    switch (tipo) {
      case 'MEDICA':
        return 'Médica'
      case 'FAMILIAR':
        return 'Familiar'
      case 'PERSONAL':
        return 'Personal'
      case 'OTRA':
        return 'Otra'
      default:
        return tipo
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span>📝</span> Justificar Inasistencias
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-gray-600">
          Justifica las inasistencias con documentación de respaldo
        </p>
      </div>

      {/* Filtro por estudiante */}
      <div className="bg-white shadow-md rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
          👨‍🎓 Filtrar por Estudiante
        </label>
        <select
          value={selectedEstudiante}
          onChange={(e) => handleEstudianteChange(e.target.value)}
          className="block w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black text-sm min-h-[44px]"
        >
          <option value="">Todos los estudiantes</option>
          {estudiantes.map((estudiante) => (
            <option key={estudiante.id} value={estudiante.id}>
              {estudiante.apellido}, {estudiante.nombre} - {estudiante.grado}° {estudiante.seccion}
            </option>
          ))}
        </select>
      </div>

      {/* Lista de inasistencias pendientes */}
      {inasistenciasPendientes.length === 0 ? (
        <div className="bg-white shadow-md rounded-xl p-6 sm:p-8">
          <div className="text-center">
            <span className="text-5xl mb-3 block">✅</span>
            <h3 className="text-base sm:text-lg font-medium text-gray-900">No hay inasistencias pendientes</h3>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              Todas las inasistencias han sido justificadas
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-xl overflow-hidden">
          <div className="px-3 sm:px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span>⚠️</span> Pendientes ({inasistenciasPendientes.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {inasistenciasPendientes.map((inasistencia) => (
              <div key={inasistencia.id} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-xl sm:text-2xl">❌</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                        {inasistencia.estudiante.apellido}, {inasistencia.estudiante.nombre}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {inasistencia.estudiante.grado}° {inasistencia.estudiante.seccion}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          📅 {parsearFechaLocal(inasistencia.fecha).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          🕐 {inasistencia.sesion || 'Sin especificar'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-red-100 text-red-800">
                      {inasistencia.estado}
                    </span>
                    <button
                      onClick={() => openJustificarModal(inasistencia)}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 text-xs sm:text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors min-h-[40px]"
                    >
                      📝 Justificar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de justificación */}
      {showJustificarModal && selectedInasistencia && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header del modal */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center z-10">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>📝</span> Justificar Inasistencia
              </h3>
              <button
                onClick={() => setShowJustificarModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <span className="text-gray-500">✕</span>
              </button>
            </div>

            <div className="p-4">
              {/* Información de la inasistencia */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">❌</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {selectedInasistencia.estudiante.apellido}, {selectedInasistencia.estudiante.nombre}
                    </p>
                    <p className="text-xs text-gray-600">
                      {selectedInasistencia.estudiante.grado}° {selectedInasistencia.estudiante.seccion} • {parsearFechaLocal(selectedInasistencia.fecha).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmitJustificacion} className="space-y-4">
                {/* Tipo de justificación */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Tipo de Justificación *
                  </label>
                  <select
                    name="tipoJustificacion"
                    value={formData.tipoJustificacion}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black text-sm min-h-[44px]"
                    required
                  >
                    <option value="PERSONAL">👤 Personal</option>
                    <option value="MEDICA">🏥 Médica</option>
                    <option value="FAMILIAR">👨‍👩‍👧 Familiar</option>
                    <option value="OTRA">📋 Otra</option>
                  </select>
                </div>

                {/* Motivo */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Motivo *
                  </label>
                  <input
                    type="text"
                    name="motivo"
                    value={formData.motivo}
                    onChange={handleInputChange}
                    placeholder="Ej: Cita médica, enfermedad..."
                    className="block w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black text-sm min-h-[44px]"
                    required
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Descripción Detallada *
                  </label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Describa el motivo de la inasistencia..."
                    className="block w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black text-sm resize-none"
                    required
                  />
                </div>

                {/* Documento adjunto */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    📎 Documento (Opcional)
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 active:file:bg-blue-200"
                  />
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                    PDF, JPG, PNG, DOC (máx. 5MB)
                  </p>
                </div>

                {/* Información importante - colapsada en móvil */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <p className="text-xs text-blue-700">
                    ℹ️ Las justificaciones deben enviarse dentro de 48h. Para médicas, adjunte certificado.
                  </p>
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowJustificarModal(false)}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors text-sm"
                    disabled={submitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 text-sm"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                        Enviando...
                      </span>
                    ) : (
                      '✅ Enviar'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
