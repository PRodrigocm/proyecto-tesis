'use client'

interface Estudiante {
  id: string
  nombre: string
  apellido: string
  dni: string
  fechaNacimiento: string
  grado: string
  seccion: string
  institucionEducativa: string
  apoderado: {
    id: string
    nombre: string
    apellido: string
    telefono: string
    email: string
    relacion: string
    esTitular: boolean
  }
  estado: 'ACTIVO' | 'INACTIVO' | 'RETIRADO'
  fechaRegistro: string
  codigoQR: string
}

interface ViewEstudianteModalProps {
  isOpen: boolean
  onClose: () => void
  estudiante: Estudiante | null
}

export default function ViewEstudianteModal({ isOpen, onClose, estudiante }: ViewEstudianteModalProps) {
  if (!isOpen || !estudiante) return null

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No disponible'
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return 'Fecha inválida'
    }
  }

  const getEstadoBadge = (estado: string) => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
    switch (estado) {
      case 'ACTIVO':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'INACTIVO':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      case 'RETIRADO':
        return `${baseClasses} bg-red-100 text-red-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-6 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center pb-4 border-b">
          <h3 className="text-xl font-bold text-gray-900">Detalles del Estudiante</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mt-6 space-y-6">
          {/* Información Personal */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 font-bold">
                  {estudiante.nombre.charAt(0)}{estudiante.apellido.charAt(0)}
                </span>
              </div>
              Información Personal
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Nombre Completo</label>
                <p className="mt-1 text-sm text-gray-900 font-medium">
                  {estudiante.nombre} {estudiante.apellido}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">DNI</label>
                <p className="mt-1 text-sm text-gray-900 font-mono">{estudiante.dni}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Fecha de Nacimiento</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(estudiante.fechaNacimiento)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Estado</label>
                <div className="mt-1">
                  <span className={getEstadoBadge(estudiante.estado)}>
                    {estudiante.estado}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Fecha de Registro</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(estudiante.fechaRegistro)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Código QR</label>
                <div className="mt-1">
                  {estudiante.codigoQR ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Generado
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      ⚠ Pendiente
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Información Académica */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-green-600 text-sm">📚</span>
              </div>
              Información Académica
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Institución Educativa</label>
                <p className="mt-1 text-sm text-gray-900 font-medium">{estudiante.institucionEducativa}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Grado</label>
                <p className="mt-1 text-sm text-gray-900">{estudiante.grado}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Sección</label>
                <p className="mt-1 text-sm text-gray-900">{estudiante.seccion}</p>
              </div>
            </div>
          </div>

          {/* Información del Apoderado */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-purple-600 text-sm">👥</span>
              </div>
              Información del Apoderado
            </h4>
            {estudiante.apoderado?.nombre ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Nombre Completo</label>
                  <p className="mt-1 text-sm text-gray-900 font-medium">
                    {estudiante.apoderado.nombre} {estudiante.apoderado.apellido}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Relación</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <p className="text-sm text-gray-900">{estudiante.apoderado.relacion}</p>
                    {estudiante.apoderado.esTitular && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Titular
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Teléfono</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">
                    {estudiante.apoderado.telefono || 'No disponible'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Email</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {estudiante.apoderado.email || 'No disponible'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">No hay información de apoderado disponible</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
