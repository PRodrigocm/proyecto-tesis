'use client'

import { Docente } from '@/hooks/useDocentes'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'

// Iconos
const TeacherIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
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

interface ViewDocenteModalProps {
  isOpen: boolean
  onClose: () => void
  docente: Docente | null
}

export default function ViewDocenteModal({ isOpen, onClose, docente }: ViewDocenteModalProps) {
  if (!isOpen || !docente) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader 
        icon={<TeacherIcon />} 
        subtitle={`DNI: ${docente.dni}`}
        variant="emerald"
        onClose={onClose}
      >
        {docente.nombre} {docente.apellido}
      </ModalHeader>

      <ModalBody>
        <div className="space-y-6">
          {/* Perfil Principal */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {docente.nombre.charAt(0)}{docente.apellido.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{docente.nombre} {docente.apellido}</h3>
                <p className="text-sm text-emerald-600 font-medium">{docente.especialidad}</p>
                <p className="text-xs text-slate-500">{docente.institucionEducativa}</p>
              </div>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              docente.estado === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}>
              {docente.estado}
            </span>
          </div>

          {/* Contacto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <MailIcon />
                <span className="text-xs font-medium uppercase tracking-wide">Email</span>
              </div>
              <p className="text-slate-900 font-medium">{docente.email}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <PhoneIcon />
                <span className="text-xs font-medium uppercase tracking-wide">Teléfono</span>
              </div>
              <p className="text-slate-900 font-medium">{docente.telefono || 'No disponible'}</p>
            </div>
          </div>

          {/* Asignación Académica */}
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
            <h4 className="text-sm font-semibold text-indigo-900 mb-3">Asignación Académica</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wide">Aula</span>
                <div className="mt-1">
                  {docente.grado && docente.seccion ? (
                    <span className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium">
                      {docente.grado}° {docente.seccion}
                    </span>
                  ) : (
                    <span className="text-slate-500 text-sm">Sin asignar</span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wide">Materias</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {docente.materias && docente.materias.length > 0 ? (
                    docente.materias.map((materia, index) => (
                      <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
                        {materia.nombre}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 text-sm">Sin materias</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Info del Sistema */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
            <span>ID: {docente.id}</span>
            <span>Registrado el {new Date(docente.fechaRegistro).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <button
          onClick={onClose}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/30"
        >
          Cerrar
        </button>
      </ModalFooter>
    </Modal>
  )
}
