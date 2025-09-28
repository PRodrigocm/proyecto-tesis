import { Retiro } from '@/hooks/useRetiros'

interface ViewRetiroModalProps {
  isOpen: boolean
  onClose: () => void
  retiro: Retiro | null
}

export default function ViewRetiroModal({ isOpen, onClose, retiro }: ViewRetiroModalProps) {
  if (!isOpen || !retiro) return null

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            📋 Detalles del Retiro
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información del Estudiante */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
              👤 Información del Estudiante
            </h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3">
                  {retiro.estudiante.nombre.charAt(0)}{retiro.estudiante.apellido.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {retiro.estudiante.nombre} {retiro.estudiante.apellido}
                  </p>
                  <p className="text-sm text-gray-600">
                    DNI: {retiro.estudiante.dni}
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Grado y Sección:</span> {retiro.estudiante.grado}° {retiro.estudiante.seccion}
                </p>
              </div>
            </div>
          </div>

          {/* Información del Retiro */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h4 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
              📅 Información del Retiro
            </h4>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Fecha:</p>
                <p className="text-gray-900">{formatFecha(retiro.fecha)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Hora de Retiro:</p>
                <p className="text-gray-900 font-mono text-lg">⏰ {retiro.horaRetiro}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Motivo:</p>
                <p className="text-gray-900">{retiro.motivo}</p>
              </div>
            </div>
          </div>

          {/* Persona que Recoge */}
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <h4 className="text-lg font-semibold text-purple-900 mb-3 flex items-center">
              👥 Persona que Recoge
            </h4>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-gray-700">Nombre:</p>
                <p className="text-gray-900">{retiro.personaRecoge || 'No especificado'}</p>
              </div>
              {retiro.dniPersonaRecoge && (
                <div>
                  <p className="text-sm font-medium text-gray-700">DNI:</p>
                  <p className="text-gray-900 font-mono">{retiro.dniPersonaRecoge}</p>
                </div>
              )}
            </div>
          </div>

          {/* Estado del Retiro */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              🏷️ Estado del Retiro
            </h4>
            <div className="space-y-3">
              <div>
                <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-semibold border ${getEstadoColor(retiro.estado)}`}>
                  <span className="mr-2">{getEstadoIcon(retiro.estado)}</span>
                  {retiro.estado}
                </div>
              </div>
              {retiro.autorizadoPor && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Autorizado por:</p>
                  <p className="text-gray-900">
                    {retiro.autorizadoPor.nombre} {retiro.autorizadoPor.apellido}
                  </p>
                </div>
              )}
              {retiro.fechaAutorizacion && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Fecha de Autorización:</p>
                  <p className="text-gray-900 text-sm">
                    {new Date(retiro.fechaAutorizacion).toLocaleString('es-ES')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Observaciones */}
        {retiro.observaciones && (
          <div className="mt-6 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <h4 className="text-lg font-semibold text-yellow-900 mb-2 flex items-center">
              📝 Observaciones
            </h4>
            <p className="text-gray-800 whitespace-pre-wrap">{retiro.observaciones}</p>
          </div>
        )}

        {/* Botones de acción */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
