import { useState, useEffect } from 'react'
import { Retiro } from '@/hooks/useRetiros'

interface EditRetiroModalProps {
  isOpen: boolean
  onClose: () => void
  retiro: Retiro | null
  onSave: (retiroId: string, data: any) => Promise<boolean>
}

export default function EditRetiroModal({ isOpen, onClose, retiro, onSave }: EditRetiroModalProps) {
  const [formData, setFormData] = useState({
    horaRetiro: '',
    motivo: '',
    observaciones: '',
    personaRecoge: '',
    dniPersonaRecoge: '',
    idEstadoRetiro: ''
  })
  const [estadosRetiro, setEstadosRetiro] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const motivosComunes = [
    'Cita médica',
    'Emergencia familiar',
    'Viaje familiar',
    'Malestar',
    'Asuntos personales',
    'Otro'
  ]

  useEffect(() => {
    if (retiro && isOpen) {
      setFormData({
        horaRetiro: retiro.horaRetiro || '',
        motivo: retiro.motivo || '',
        observaciones: retiro.observaciones || '',
        personaRecoge: retiro.personaRecoge || '',
        dniPersonaRecoge: retiro.dniPersonaRecoge || '',
        idEstadoRetiro: retiro.idEstadoRetiro?.toString() || ''
      })
    }
  }, [retiro, isOpen])

  // Cargar estados de retiro
  useEffect(() => {
    if (isOpen) {
      loadEstadosRetiro()
    }
  }, [isOpen])

  const loadEstadosRetiro = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/estados-retiro', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Estados retiro cargados:', data.estados)
        setEstadosRetiro(data.estados || [])
      } else {
        console.error('Error response:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error loading estados retiro:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!retiro) return

    setLoading(true)
    try {
      console.log('Enviando datos del retiro:', formData)
      const success = await onSave(retiro.id, formData)
      if (success) {
        console.log('Retiro actualizado exitosamente')
        onClose()
      } else {
        console.error('Error: onSave retornó false')
      }
    } catch (error) {
      console.error('Error al actualizar retiro:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'AUTORIZADO':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'COMPLETADO':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'RECHAZADO':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return '⏳'
      case 'AUTORIZADO':
        return '✅'
      case 'COMPLETADO':
        return '🏁'
      case 'RECHAZADO':
        return '❌'
      default:
        return '📋'
    }
  }

  if (!isOpen || !retiro) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            ✏️ Editar Retiro
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="sr-only">Cerrar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Información del estudiante (solo lectura) */}
        <div className="mb-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
            👤 Información del Estudiante
          </h4>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3">
              {retiro.estudiante.nombre.charAt(0)}{retiro.estudiante.apellido.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {retiro.estudiante.nombre} {retiro.estudiante.apellido}
              </p>
              <p className="text-sm text-gray-600">
                DNI: {retiro.estudiante.dni} | {retiro.estudiante.grado}° {retiro.estudiante.seccion}
              </p>
            </div>
            <div className="ml-auto">
              <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-semibold border ${getEstadoColor(retiro.estado)}`}>
                <span className="mr-2">{getEstadoIcon(retiro.estado)}</span>
                {retiro.estado}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hora de Retiro */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora de Retiro *
              </label>
              <input
                type="time"
                name="horaRetiro"
                value={formData.horaRetiro}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
              />
            </div>

            {/* Motivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo *
              </label>
              <select
                name="motivo"
                value={formData.motivo}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
              >
                <option value="">Seleccionar motivo</option>
                {motivosComunes.map((motivo) => (
                  <option key={motivo} value={motivo}>{motivo}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Persona que Recoge */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Persona que Recoge
              </label>
              <input
                type="text"
                name="personaRecoge"
                value={formData.personaRecoge}
                onChange={handleInputChange}
                placeholder="Nombre completo"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
              />
            </div>

            {/* DNI de la Persona */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DNI de la Persona
              </label>
              <input
                type="text"
                name="dniPersonaRecoge"
                value={formData.dniPersonaRecoge}
                onChange={handleInputChange}
                placeholder="12345678"
                maxLength={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>

          {/* Estado del Retiro */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado del Retiro *
            </label>
            <select
              name="idEstadoRetiro"
              value={formData.idEstadoRetiro}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
            >
              <option value="">Seleccionar estado</option>
              {estadosRetiro.map((estado) => (
                <option key={estado.idEstadoRetiro} value={estado.idEstadoRetiro}>
                  {getEstadoIcon(estado.codigo)} {estado.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones
            </label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleInputChange}
              rows={4}
              placeholder="Información adicional sobre el retiro..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
            />
          </div>

          {/* Información adicional */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-800">
                  Información importante
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Los cambios realizados se aplicarán inmediatamente. Asegúrate de que la información sea correcta antes de guardar.
                </p>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
