'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  estudiantesService, 
  justificacionesService,
  type Estudiante,
  type InasistenciaPendiente
} from '@/services/apoderado.service'

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Justificar Inasistencias</h1>
        <p className="mt-1 text-sm text-gray-600">
          Justifica las inasistencias de tus hijos proporcionando la documentación necesaria
        </p>
      </div>

      {/* Filtro por estudiante */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filtrar por Estudiante
        </label>
        <select
          value={selectedEstudiante}
          onChange={(e) => handleEstudianteChange(e.target.value)}
          className="block w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
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
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay inasistencias pendientes</h3>
            <p className="mt-1 text-sm text-gray-500">
              Todas las inasistencias han sido justificadas o no hay registros pendientes.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Inasistencias Pendientes de Justificación ({inasistenciasPendientes.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {inasistenciasPendientes.map((inasistencia) => (
              <div key={inasistencia.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {inasistencia.estudiante.apellido}, {inasistencia.estudiante.nombre}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {inasistencia.estudiante.grado}° {inasistencia.estudiante.seccion} • DNI: {inasistencia.estudiante.dni}
                      </p>
                      <p className="text-sm text-gray-500">
                        Fecha: {new Date(inasistencia.fecha).toLocaleDateString('es-ES')} • Horario: {inasistencia.sesion || 'Sin especificar'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {inasistencia.estado}
                    </span>
                    <button
                      onClick={() => openJustificarModal(inasistencia)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Justificar
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">
                  Justificar Inasistencia
                </h3>
                <button
                  onClick={() => setShowJustificarModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Información de la inasistencia */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Información de la Inasistencia</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-500">Estudiante:</span>
                    <p>{selectedInasistencia.estudiante.apellido}, {selectedInasistencia.estudiante.nombre}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Grado y Sección:</span>
                    <p>{selectedInasistencia.estudiante.grado}° {selectedInasistencia.estudiante.seccion}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Fecha:</span>
                    <p>{new Date(selectedInasistencia.fecha).toLocaleDateString('es-ES')}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Horario:</span>
                    <p>{selectedInasistencia.sesion || 'Sin especificar'}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmitJustificacion} className="space-y-6">
                {/* Tipo de justificación */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Justificación *
                  </label>
                  <select
                    name="tipoJustificacion"
                    value={formData.tipoJustificacion}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                    required
                  >
                    <option value="PERSONAL">Personal</option>
                    <option value="MEDICA">Médica</option>
                    <option value="FAMILIAR">Familiar</option>
                    <option value="OTRA">Otra</option>
                  </select>
                </div>

                {/* Motivo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo de la Inasistencia *
                  </label>
                  <input
                    type="text"
                    name="motivo"
                    value={formData.motivo}
                    onChange={handleInputChange}
                    placeholder="Ej: Cita médica, enfermedad, emergencia familiar, etc."
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                    required
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción Detallada *
                  </label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Proporcione una descripción detallada del motivo de la inasistencia..."
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                    required
                  />
                </div>

                {/* Documento adjunto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Documento de Respaldo (Opcional)
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formatos permitidos: PDF, JPG, PNG, DOC, DOCX (máx. 5MB)
                  </p>
                </div>

                {/* Información importante */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-blue-800 mb-2">Información Importante:</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Las justificaciones deben enviarse dentro de las 48 horas posteriores a la inasistencia</li>
                        <li>• Para justificaciones médicas, adjunte el certificado médico correspondiente</li>
                        <li>• La justificación será revisada por el personal académico</li>
                        <li>• Recibirá una notificación sobre el estado de su justificación</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowJustificarModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={submitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Enviando...
                      </div>
                    ) : (
                      'Enviar Justificación'
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
