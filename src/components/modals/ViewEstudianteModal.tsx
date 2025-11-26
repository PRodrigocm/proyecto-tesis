'use client'

import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'

// Iconos
const StudentIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
  </svg>
)

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const QRIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
  </svg>
)

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
      return new Date(dateString).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch {
      return 'Fecha inválida'
    }
  }

  const getEstadoStyle = (estado: string) => {
    switch (estado) {
      case 'ACTIVO': return 'bg-emerald-100 text-emerald-700'
      case 'INACTIVO': return 'bg-amber-100 text-amber-700'
      case 'RETIRADO': return 'bg-red-100 text-red-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader 
        icon={<StudentIcon />} 
        subtitle={`DNI: ${estudiante.dni}`}
        variant="blue"
        onClose={onClose}
      >
        {estudiante.nombre} {estudiante.apellido}
      </ModalHeader>

      <ModalBody>
        <div className="space-y-6">
          {/* Perfil Principal */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {estudiante.nombre.charAt(0)}{estudiante.apellido.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{estudiante.nombre} {estudiante.apellido}</h3>
                <p className="text-sm text-blue-600 font-medium">{estudiante.grado}° {estudiante.seccion}</p>
                <p className="text-xs text-slate-500">{estudiante.institucionEducativa}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getEstadoStyle(estudiante.estado)}`}>
                {estudiante.estado}
              </span>
              <span className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${
                estudiante.codigoQR ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                <QRIcon />
                {estudiante.codigoQR ? 'QR Activo' : 'QR Pendiente'}
              </span>
            </div>
          </div>

          {/* Información Personal */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <CalendarIcon />
                <span className="text-xs font-medium uppercase tracking-wide">Fecha Nacimiento</span>
              </div>
              <p className="text-slate-900 font-medium">{formatDate(estudiante.fechaNacimiento)}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Fecha Registro</span>
              <p className="text-slate-900 font-medium mt-2">{formatDate(estudiante.fechaRegistro)}</p>
            </div>
          </div>

          {/* Apoderado */}
          {estudiante.apoderado?.nombre && (
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
              <h4 className="text-sm font-semibold text-purple-900 mb-3">Apoderado</h4>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 font-semibold">
                    {estudiante.apoderado.nombre.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{estudiante.apoderado.nombre} {estudiante.apoderado.apellido}</p>
                    <p className="text-xs text-slate-500">{estudiante.apoderado.email || estudiante.apoderado.telefono}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-white text-purple-600 text-xs font-medium rounded-lg border border-purple-200">
                    {estudiante.apoderado.relacion}
                  </span>
                  {estudiante.apoderado.esTitular && (
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-lg">
                      Titular
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Info del Sistema */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
            <span>ID: {estudiante.id}</span>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <button
          onClick={onClose}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30"
        >
          Cerrar
        </button>
      </ModalFooter>
    </Modal>
  )
}
