'use client'

import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'

// Iconos
const AuxiliarIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
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

interface Auxiliar {
  idUsuario: number
  dni: string
  nombre: string
  apellido: string
  email: string
  telefono?: string
  estado: string
  ie: {
    nombre: string
  }
  roles: Array<{
    rol: {
      nombre: string
    }
  }>
}

interface ViewAuxiliarModalProps {
  isOpen: boolean
  onClose: () => void
  auxiliar: Auxiliar | null
}

export default function ViewAuxiliarModal({ isOpen, onClose, auxiliar }: ViewAuxiliarModalProps) {
  if (!isOpen || !auxiliar) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader 
        icon={<AuxiliarIcon />} 
        subtitle={`DNI: ${auxiliar.dni}`}
        variant="amber"
        onClose={onClose}
      >
        {auxiliar.nombre} {auxiliar.apellido}
      </ModalHeader>

      <ModalBody>
        <div className="space-y-6">
          {/* Perfil Principal */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {auxiliar.nombre.charAt(0)}{auxiliar.apellido.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{auxiliar.nombre} {auxiliar.apellido}</h3>
                <p className="text-sm text-amber-600 font-medium">{auxiliar.ie?.nombre || 'Sin institución'}</p>
              </div>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              auxiliar.estado === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}>
              {auxiliar.estado}
            </span>
          </div>

          {/* Contacto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <MailIcon />
                <span className="text-xs font-medium uppercase tracking-wide">Email</span>
              </div>
              <p className="text-slate-900 font-medium">{auxiliar.email}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <PhoneIcon />
                <span className="text-xs font-medium uppercase tracking-wide">Teléfono</span>
              </div>
              <p className="text-slate-900 font-medium">{auxiliar.telefono || 'No disponible'}</p>
            </div>
          </div>

          {/* Roles */}
          <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
            <h4 className="text-sm font-semibold text-orange-900 mb-3">Roles Asignados</h4>
            <div className="flex flex-wrap gap-2">
              {auxiliar.roles && auxiliar.roles.length > 0 ? (
                auxiliar.roles.map((roleItem, index) => (
                  <span key={index} className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium">
                    {roleItem?.rol?.nombre || 'Sin rol'}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 text-sm">No hay roles asignados</span>
              )}
            </div>
          </div>

          {/* Info del Sistema */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
            <span>ID: {auxiliar.idUsuario}</span>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <button
          onClick={onClose}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-medium rounded-xl hover:from-amber-700 hover:to-yellow-700 transition-all shadow-lg shadow-amber-500/30"
        >
          Cerrar
        </button>
      </ModalFooter>
    </Modal>
  )
}
