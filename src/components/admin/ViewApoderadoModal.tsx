'use client'

import { Apoderado } from '@/hooks/useApoderados'

interface ViewApoderadoModalProps {
  apoderado: Apoderado | null
  isOpen: boolean
  onClose: () => void
}

export default function ViewApoderadoModal({ apoderado, isOpen, onClose }: ViewApoderadoModalProps) {
  if (!isOpen || !apoderado) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Información del Apoderado
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Información Personal */}
            <div>
              <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2">
                Información Personal
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <p className="mt-1 text-sm text-gray-900">{apoderado.nombre}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Apellido</label>
                  <p className="mt-1 text-sm text-gray-900">{apoderado.apellido}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">DNI</label>
                  <p className="mt-1 text-sm text-gray-900">{apoderado.dni}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    apoderado.estado === 'ACTIVO'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {apoderado.estado}
                  </span>
                </div>
              </div>
            </div>

            {/* Información de Contacto */}
            <div>
              <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2">
                Información de Contacto
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{apoderado.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                  <p className="mt-1 text-sm text-gray-900">{apoderado.telefono}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dirección</label>
                  <p className="mt-1 text-sm text-gray-900">{apoderado.direccion || 'No especificada'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ocupación</label>
                  <p className="mt-1 text-sm text-gray-900">{apoderado.ocupacion || 'No especificada'}</p>
                </div>
              </div>
            </div>

            {/* Información de Fechas */}
            <div>
              <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2">
                Información del Sistema
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {apoderado.fechaNacimiento 
                      ? new Date(apoderado.fechaNacimiento).toLocaleDateString('es-ES')
                      : 'No especificada'
                    }
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha de Registro</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {apoderado.fechaCreacion 
                      ? new Date(apoderado.fechaCreacion).toLocaleDateString('es-ES')
                      : 'No disponible'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Estudiantes Asignados */}
            <div>
              <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2">
                Estudiantes Asignados ({apoderado.estudiantes?.length || 0})
              </h4>
              {apoderado.estudiantes && apoderado.estudiantes.length > 0 ? (
                <div className="space-y-3">
                  {apoderado.estudiantes.map((estudiante, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">
                            {estudiante.nombre} {estudiante.apellido}
                          </p>
                          <p className="text-sm text-gray-600">DNI: {estudiante.dni}</p>
                          {estudiante.grado && estudiante.seccion && (
                            <p className="text-sm text-gray-600">
                              Aula: {estudiante.grado}° - Sección {estudiante.seccion}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {estudiante.relacion || 'Apoderado'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No tiene estudiantes asignados</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
