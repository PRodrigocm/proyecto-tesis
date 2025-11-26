'use client'

import { Apoderado } from '@/hooks/useApoderados'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'

// Iconos
const UserIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const MailIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const PhoneIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
)

interface ViewApoderadoModalProps {
  apoderado: Apoderado | null
  isOpen: boolean
  onClose: () => void
}

export default function ViewApoderadoModal({ apoderado, isOpen, onClose }: ViewApoderadoModalProps) {
  if (!isOpen || !apoderado) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader 
        icon={<UserIcon />} 
        subtitle={`DNI: ${apoderado.dni}`}
        variant="indigo"
        onClose={onClose}
      >
        {apoderado.nombre} {apoderado.apellido}
      </ModalHeader>

      <ModalBody>
        <div className="space-y-6">
          {/* Estado y Datos Principales */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {apoderado.nombre.charAt(0)}{apoderado.apellido.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{apoderado.nombre} {apoderado.apellido}</h3>
                <p className="text-sm text-slate-500">{apoderado.ocupacion || 'Sin ocupación registrada'}</p>
              </div>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              apoderado.estado === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
            }`}>
              {apoderado.estado}
            </span>
          </div>

          {/* Información de Contacto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <MailIcon />
                <span className="text-xs font-medium uppercase tracking-wide">Email</span>
              </div>
              <p className="text-slate-900 font-medium">{apoderado.email}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <PhoneIcon />
                <span className="text-xs font-medium uppercase tracking-wide">Teléfono</span>
              </div>
              <p className="text-slate-900 font-medium">{apoderado.telefono}</p>
            </div>
          </div>

          {/* Dirección */}
          {apoderado.direccion && (
            <div className="p-4 bg-slate-50 rounded-xl">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Dirección</span>
              <p className="text-slate-900 mt-1">{apoderado.direccion}</p>
            </div>
          )}

          {/* Estudiantes Asignados */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-800">Estudiantes Asignados</h4>
              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                {apoderado.estudiantes?.length || 0}
              </span>
            </div>
            {apoderado.estudiantes && apoderado.estudiantes.length > 0 ? (
              <div className="space-y-2">
                {apoderado.estudiantes.map((estudiante, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-semibold">
                        {estudiante.nombre.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{estudiante.nombre} {estudiante.apellido}</p>
                        <p className="text-xs text-slate-500">DNI: {estudiante.dni} {estudiante.grado && `| ${estudiante.grado}° ${estudiante.seccion}`}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-white text-indigo-600 text-xs font-medium rounded-lg border border-indigo-200">
                      {estudiante.relacion || 'Apoderado'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50 rounded-xl">
                <p className="text-slate-500">No tiene estudiantes asignados</p>
              </div>
            )}
          </div>

          {/* Info del Sistema */}
          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-400">
              Registrado el {apoderado.fechaCreacion ? new Date(apoderado.fechaCreacion).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'fecha no disponible'}
            </p>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <button
          onClick={onClose}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/30"
        >
          Cerrar
        </button>
      </ModalFooter>
    </Modal>
  )
}
