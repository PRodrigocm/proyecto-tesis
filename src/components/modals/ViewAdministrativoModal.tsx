'use client'

import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'

// Iconos
const AdminIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader 
        icon={<AdminIcon />} 
        subtitle={`DNI: ${administrativo.dni}`}
        variant="indigo"
        onClose={onClose}
      >
        {administrativo.nombre} {administrativo.apellido}
      </ModalHeader>

      <ModalBody>
        <div className="space-y-6">
          {/* Perfil Principal */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl border border-indigo-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {administrativo.nombre.charAt(0)}{administrativo.apellido.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{administrativo.nombre} {administrativo.apellido}</h3>
                <p className="text-sm text-indigo-600 font-medium">{administrativo.institucionEducativa || 'Sin institución'}</p>
              </div>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              administrativo.estado === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {administrativo.estado}
            </span>
          </div>

          {/* Contacto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <MailIcon />
                <span className="text-xs font-medium uppercase tracking-wide">Email</span>
              </div>
              <p className="text-slate-900 font-medium">{administrativo.email}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <PhoneIcon />
                <span className="text-xs font-medium uppercase tracking-wide">Teléfono</span>
              </div>
              <p className="text-slate-900 font-medium">{administrativo.telefono || 'No disponible'}</p>
            </div>
          </div>

          {/* Roles */}
          <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-100">
            <h4 className="text-sm font-semibold text-violet-900 mb-3">Roles Asignados</h4>
            <div className="flex flex-wrap gap-2">
              {administrativo.roles && administrativo.roles.length > 0 ? (
                administrativo.roles.map((roleItem, index) => (
                  <span key={index} className="px-3 py-1.5 bg-violet-100 text-violet-700 rounded-lg text-sm font-medium">
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
            <span>ID: {administrativo.id}</span>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <button
          onClick={onClose}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-500/30"
        >
          Cerrar
        </button>
      </ModalFooter>
    </Modal>
  )
}
