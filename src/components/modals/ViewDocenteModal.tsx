'use client'

import { Docente } from '@/hooks/useDocentes'

interface ViewDocenteModalProps {
  isOpen: boolean
  onClose: () => void
  docente: Docente | null
}

export default function ViewDocenteModal({ isOpen, onClose, docente }: ViewDocenteModalProps) {
  if (!isOpen || !docente) return null

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'ACTIVO':
        return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'
      case 'INACTIVO':
        return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'
      default:
        return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Información del Docente
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Información Personal */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 text-sm">👤</span>
              </div>
              Información Personal
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Nombre Completo</label>
                <p className="mt-1 text-sm text-gray-900 font-medium">
                  {docente.nombre} {docente.apellido}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">DNI</label>
                <p className="mt-1 text-sm text-gray-900 font-mono">{docente.dni}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Email</label>
                <p className="mt-1 text-sm text-gray-900">{docente.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Teléfono</label>
                <p className="mt-1 text-sm text-gray-900">{docente.telefono || 'No disponible'}</p>
              </div>
            </div>
          </div>

          {/* Información Académica */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-green-600 text-sm">🎓</span>
              </div>
              Información Académica
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Especialidad</label>
                <p className="mt-1 text-sm text-gray-900 font-medium">{docente.especialidad}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Institución Educativa</label>
                <p className="mt-1 text-sm text-gray-900">{docente.institucionEducativa}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Aula Asignada</label>
                <div className="mt-1">
                  {docente.grado && docente.seccion ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {docente.grado}° {docente.seccion}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">Sin asignar</span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Materias</label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {docente.materias && docente.materias.length > 0 ? (
                    docente.materias.map((materia, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        {materia.nombre}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">Sin materias asignadas</span>
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
                <p className="mt-1 text-sm text-gray-900 font-mono">{docente.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Estado del Sistema</label>
                <div className="mt-1">
                  <span className={getEstadoBadge(docente.estado)}>
                    {docente.estado}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Fecha de Registro</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(docente.fechaRegistro).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
