import { Taller } from '@/hooks/useTalleres'

interface ViewTallerModalProps {
  isOpen: boolean
  onClose: () => void
  taller: Taller | null
}

export default function ViewTallerModal({ isOpen, onClose, taller }: ViewTallerModalProps) {
  if (!isOpen || !taller) return null

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getEstadoColor = (activo: boolean) => {
    return activo
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200'
  }

  const getEstadoIcon = (activo: boolean) => {
    return activo ? '✅' : '❌'
  }

  const getCapacidadColor = () => {
    if (!taller.capacidadMaxima) return 'text-gray-600'
    
    const porcentaje = (taller.inscripciones / taller.capacidadMaxima) * 100
    if (porcentaje >= 90) return 'text-red-600'
    if (porcentaje >= 70) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            🎯 Detalles del Taller
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
          {/* Información del Taller */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
              📚 Información del Taller
            </h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mr-4">
                  {taller.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-lg">
                    {taller.nombre}
                  </p>
                  {taller.codigo && (
                    <p className="text-sm text-gray-600">
                      Código: {taller.codigo}
                    </p>
                  )}
                </div>
              </div>
              
              {taller.descripcion && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-sm font-medium text-gray-700">Descripción:</p>
                  <p className="text-gray-900 mt-1">{taller.descripcion}</p>
                </div>
              )}
            </div>
          </div>

          {/* Información del Instructor */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h4 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
              👨‍🏫 Instructor
            </h4>
            <div className="space-y-3">
              {taller.instructor ? (
                <div>
                  <p className="text-sm font-medium text-gray-700">Nombre:</p>
                  <p className="text-gray-900 font-medium">{taller.instructor}</p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="text-gray-500 mt-2">Sin instructor asignado</p>
                  <p className="text-xs text-gray-400">Se puede asignar en la edición</p>
                </div>
              )}
            </div>
          </div>

          {/* Capacidad e Inscripciones */}
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <h4 className="text-lg font-semibold text-purple-900 mb-3 flex items-center">
              👥 Capacidad e Inscripciones
            </h4>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Inscripciones actuales:</p>
                <p className={`text-2xl font-bold ${getCapacidadColor()}`}>
                  {taller.inscripciones}
                  {taller.capacidadMaxima && (
                    <span className="text-lg text-gray-600"> / {taller.capacidadMaxima}</span>
                  )}
                </p>
              </div>
              
              {taller.capacidadMaxima && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Capacidad máxima:</p>
                  <p className="text-gray-900">{taller.capacidadMaxima} estudiantes</p>
                  
                  {/* Barra de progreso */}
                  <div className="mt-2">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          (taller.inscripciones / taller.capacidadMaxima) >= 0.9 
                            ? 'bg-red-500' 
                            : (taller.inscripciones / taller.capacidadMaxima) >= 0.7 
                              ? 'bg-yellow-500' 
                              : 'bg-green-500'
                        }`}
                        style={{ 
                          width: `${Math.min((taller.inscripciones / taller.capacidadMaxima) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round((taller.inscripciones / taller.capacidadMaxima) * 100)}% ocupado
                    </p>
                  </div>
                </div>
              )}
              
              {!taller.capacidadMaxima && (
                <div>
                  <p className="text-sm text-gray-600">Sin límite de capacidad</p>
                </div>
              )}
            </div>
          </div>

          {/* Estado del Taller */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              🏷️ Estado del Taller
            </h4>
            <div className="space-y-3">
              <div>
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${getEstadoColor(taller.activo)}`}>
                  <span className="mr-2">{getEstadoIcon(taller.activo)}</span>
                  {taller.activo ? 'Activo' : 'Inactivo'}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">Fecha de creación:</p>
                <p className="text-gray-900 text-sm">
                  {formatFecha(taller.fechaCreacion)}
                </p>
              </div>
              
              {taller.fechaActualizacion && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Última actualización:</p>
                  <p className="text-gray-900 text-sm">
                    {formatFecha(taller.fechaActualizacion)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800">
                Gestión de talleres
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                Desde aquí puedes ver toda la información del taller. Para realizar cambios, usa el botón "Editar" 
                en la tabla de talleres. Para gestionar inscripciones, usa el botón "Inscripciones".
              </p>
            </div>
          </div>
        </div>

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
