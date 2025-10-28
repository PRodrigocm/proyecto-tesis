'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { estudiantesService, retirosService, type Estudiante } from '@/services/apoderado.service'

interface SolicitudRetiro {
  estudianteId: string
  fecha: string
  hora: string
  motivo: string
  observaciones: string
  tipoRetiro: 'TEMPRANO' | 'EMERGENCIA' | 'MEDICO' | 'FAMILIAR'
}

export default function SolicitarRetiro() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [formData, setFormData] = useState<SolicitudRetiro>({
    estudianteId: '',
    fecha: '',
    hora: '',
    motivo: '',
    observaciones: '',
    tipoRetiro: 'TEMPRANO'
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
      loadEstudiantes()
      setDefaultDateTime()
    }
  }, [router])

  const setDefaultDateTime = () => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const currentTime = now.toTimeString().slice(0, 5)
    
    setFormData(prev => ({
      ...prev,
      fecha: today,
      hora: currentTime
    }))
  }

  const loadEstudiantes = async () => {
    setLoading(true)
    try {
      const data = await estudiantesService.getAll()
      setEstudiantes(data)
    } catch (error) {
      console.error('Error loading estudiantes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.estudianteId || !formData.fecha || !formData.hora || !formData.motivo) {
      alert('Por favor complete todos los campos requeridos')
      return
    }

    setSubmitting(true)
    try {
      await retirosService.solicitar(formData)
      alert('Solicitud de retiro enviada exitosamente')
      router.push('/apoderado/retiros')
    } catch (error: any) {
      console.error('Error submitting retiro:', error)
      alert(error.message || 'Error al enviar la solicitud')
    } finally {
      setSubmitting(false)
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
        <h1 className="text-2xl font-bold text-gray-900">Solicitar Retiro</h1>
        <p className="mt-1 text-sm text-gray-600">
          Solicita el retiro anticipado de tu hijo de la institución educativa
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Selección de estudiante */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estudiante *
              </label>
              <select
                name="estudianteId"
                value={formData.estudianteId}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                required
              >
                <option value="">Seleccionar estudiante</option>
                {estudiantes.map((estudiante) => (
                  <option key={estudiante.id} value={estudiante.id}>
                    {estudiante.apellido}, {estudiante.nombre} - {estudiante.grado}° {estudiante.seccion}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de retiro */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Retiro *
              </label>
              <select
                name="tipoRetiro"
                value={formData.tipoRetiro}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                required
              >
                <option value="TEMPRANO">Retiro Temprano</option>
                <option value="EMERGENCIA">Emergencia</option>
                <option value="MEDICO">Cita Médica</option>
                <option value="FAMILIAR">Asunto Familiar</option>
              </select>
            </div>

            {/* Fecha y hora */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha del Retiro *
                </label>
                <input
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora del Retiro *
                </label>
                <input
                  type="time"
                  name="hora"
                  value={formData.hora}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                  required
                />
              </div>
            </div>

            {/* Motivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo del Retiro *
              </label>
              <input
                type="text"
                name="motivo"
                value={formData.motivo}
                onChange={handleInputChange}
                placeholder="Ej: Cita médica, emergencia familiar, etc."
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                required
              />
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones Adicionales
              </label>
              <textarea
                name="observaciones"
                value={formData.observaciones}
                onChange={handleInputChange}
                rows={4}
                placeholder="Información adicional sobre el retiro..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
              />
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
                    <li>• La solicitud debe ser enviada con al menos 2 horas de anticipación</li>
                    <li>• Para emergencias, puede solicitar el retiro inmediato</li>
                    <li>• Debe presentarse personalmente o enviar a una persona autorizada</li>
                    <li>• Traer documento de identidad para retirar al estudiante</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/apoderado/dashboard')}
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
                  'Enviar Solicitud'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
