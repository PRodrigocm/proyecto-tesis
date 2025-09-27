'use client'

interface Administrativo {
  id: number
  nombre: string
  apellido: string
  dni: string
  email: string
  telefono?: string
  cargo: string
  departamento: string
  fechaIngreso: string
  institucionEducativa: string
  estado: 'ACTIVO' | 'INACTIVO'
  fechaRegistro: string
  roles: Array<{
    rol: {
      nombre: string
    }
  }>
}

interface ViewAdministrativoModalProps {
  isOpen: boolean
  onClose: () => void
  administrativo: Administrativo | null
}

export default function ViewAdministrativoModal({ isOpen, onClose, administrativo }: ViewAdministrativoModalProps) {
  if (!isOpen || !administrativo) return null

  const getEstadoBadge = (estado: string) => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
    switch (estado) {
      case 'ACTIVO':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'INACTIVO':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-6 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center pb-4 border-b">
          <h3 className="text-xl font-bold text-gray-900">Detalles del Administrativo</h3>
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
                  {administrativo.nombre.charAt(0)}{administrativo.apellido.charAt(0)}
                </span>
              </div>
              Información Personal
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Nombre Completo</label>
                <p className="mt-1 text-sm text-gray-900 font-medium">
                  {administrativo.nombre} {administrativo.apellido}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">DNI</label>
                <p className="mt-1 text-sm text-gray-900 font-mono">{administrativo.dni}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Email</label>
                <p className="mt-1 text-sm text-gray-900">{administrativo.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Teléfono</label>
                <p className="mt-1 text-sm text-gray-900 font-mono">
                  {administrativo.telefono || 'No disponible'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Estado</label>
                <div className="mt-1">
                  <span className={getEstadoBadge(administrativo.estado)}>
                    {administrativo.estado}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Información Laboral */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-green-600 text-sm">🏢</span>
              </div>
              Información Laboral
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Institución Educativa</label>
                <p className="mt-1 text-sm text-gray-900 font-medium">
                  {administrativo.institucionEducativa || 'No disponible'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Rol(es)</label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {administrativo.roles && administrativo.roles.length > 0 ? (
                    administrativo.roles.map((roleItem, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        {roleItem?.rol?.nombre || 'Sin rol'}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">No hay roles asignados</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Información del Sistema */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-purple-600 text-sm">⚙️</span>
              </div>
              Información del Sistema
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">ID de Usuario</label>
                <p className="mt-1 text-sm text-gray-900 font-mono">{administrativo.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Estado del Sistema</label>
                <div className="mt-1">
                  <span className={getEstadoBadge(administrativo.estado)}>
                    {administrativo.estado}
                  </span>
                </div>
              </div>
            </div>
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
