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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span>🚪</span> Solicitar Retiro
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-gray-600">
          Solicita el retiro anticipado de tu hijo
        </p>
      </div>

      <div className="max-w-lg mx-auto">
        <div className="bg-white shadow-md rounded-xl overflow-hidden">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
            {/* Selección de estudiante */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                👨‍🎓 Estudiante *
              </label>
              <select
                name="estudianteId"
                value={formData.estudianteId}
                onChange={handleInputChange}
                className="block w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black text-sm min-h-[44px]"
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
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                📋 Tipo de Retiro *
              </label>
              <select
                name="tipoRetiro"
                value={formData.tipoRetiro}
                onChange={handleInputChange}
                className="block w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black text-sm min-h-[44px]"
                required
              >
                <option value="TEMPRANO">🕐 Retiro Temprano</option>
                <option value="EMERGENCIA">🚨 Emergencia</option>
                <option value="MEDICO">🏥 Cita Médica</option>
                <option value="FAMILIAR">👨‍👩‍👧 Asunto Familiar</option>
              </select>
            </div>

            {/* Fecha y hora */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  📅 Fecha *
                </label>
                <input
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black text-sm min-h-[44px]"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  🕐 Hora *
                </label>
                <input
                  type="time"
                  name="hora"
                  value={formData.hora}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black text-sm min-h-[44px]"
                  required
                />
              </div>
            </div>

            {/* Motivo */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                ✏️ Motivo *
              </label>
              <input
                type="text"
                name="motivo"
                value={formData.motivo}
                onChange={handleInputChange}
                placeholder="Ej: Cita médica, emergencia..."
                className="block w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black text-sm min-h-[44px]"
                required
              />
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                📝 Observaciones (Opcional)
              </label>
              <textarea
                name="observaciones"
                value={formData.observaciones}
                onChange={handleInputChange}
                rows={3}
                placeholder="Información adicional..."
                className="block w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black text-sm resize-none"
              />
            </div>

            {/* Información importante */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-xs text-blue-700">
                ℹ️ Envíe con 2h de anticipación. Para emergencias, retiro inmediato. Presente DNI al retirar.
              </p>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push('/apoderado/dashboard')}
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
  )
}
