import { Retiro } from '@/hooks/useRetiros'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'

// Iconos
const ExitIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
)

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

interface ViewRetiroModalProps {
  isOpen: boolean
  onClose: () => void
  retiro: Retiro | null
}

export default function ViewRetiroModal({ isOpen, onClose, retiro }: ViewRetiroModalProps) {
  if (!isOpen || !retiro) return null

  const formatFecha = (fecha: string) => {
    // Extraer solo la parte de la fecha (YYYY-MM-DD) para evitar problemas de zona horaria
    const fechaStr = fecha.split('T')[0]
    const [year, month, day] = fechaStr.split('-').map(Number)
    const date = new Date(year, month - 1, day) // Crear fecha local
    return date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  const getEstadoStyle = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return 'bg-amber-100 text-amber-700'
      case 'AUTORIZADO': return 'bg-emerald-100 text-emerald-700'
      case 'RECHAZADO': return 'bg-red-100 text-red-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader 
        icon={<ExitIcon />} 
        subtitle={formatFecha(retiro.fecha)}
        variant="red"
        onClose={onClose}
      >
        Retiro #{retiro.id?.toString().slice(-4) || '0000'}
      </ModalHeader>

      <ModalBody>
        <div className="space-y-6">
          {/* Estado y Hora */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <ClockIcon />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{retiro.horaRetiro}</p>
                <p className="text-sm text-slate-500">Hora de retiro</p>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getEstadoStyle(retiro.estado)}`}>
              {retiro.estado}
            </span>
          </div>

          {/* Estudiante */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">Estudiante</h4>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                {retiro.estudiante.nombre.charAt(0)}{retiro.estudiante.apellido.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{retiro.estudiante.nombre} {retiro.estudiante.apellido}</p>
                <p className="text-sm text-slate-500">DNI: {retiro.estudiante.dni} | {retiro.estudiante.grado}° {retiro.estudiante.seccion}</p>
              </div>
            </div>
          </div>

          {/* Origen del Retiro */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Origen del Retiro</h4>
            <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-medium ${
              retiro.origenColor === 'blue' ? 'bg-blue-100 text-blue-800' :
              retiro.origenColor === 'purple' ? 'bg-purple-100 text-purple-800' :
              retiro.origenColor === 'orange' ? 'bg-orange-100 text-orange-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {retiro.origen || 'No especificado'}
            </span>
          </div>

          {/* Persona que Recoge */}
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
            <h4 className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-3">Persona que Recoge</h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 font-semibold">
                {retiro.personaRecoge?.charAt(0) || '?'}
              </div>
              <div>
                <p className="font-medium text-slate-900">{retiro.personaRecoge || 'No especificado'}</p>
                {retiro.dniPersonaRecoge && <p className="text-sm text-slate-500 font-mono">DNI: {retiro.dniPersonaRecoge}</p>}
              </div>
            </div>
          </div>

          {/* Autorización - Solo mostrar si el estado es AUTORIZADO o RECHAZADO */}
          {(retiro.estado === 'AUTORIZADO' || retiro.estado === 'RECHAZADO') && retiro.autorizadoPor && (
            <div className={`p-4 rounded-xl border ${retiro.estado === 'AUTORIZADO' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
              <h4 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${retiro.estado === 'AUTORIZADO' ? 'text-emerald-600' : 'text-red-600'}`}>
                {retiro.estado === 'AUTORIZADO' ? 'Autorizado por' : 'Rechazado por'}
              </h4>
              <p className="font-medium text-slate-900">{retiro.autorizadoPor.nombre} {retiro.autorizadoPor.apellido}</p>
              {retiro.fechaAutorizacion && (
                <p className="text-xs text-slate-500 mt-1">{new Date(retiro.fechaAutorizacion).toLocaleString('es-ES')}</p>
              )}
            </div>
          )}

          {/* Observaciones */}
          {retiro.observaciones && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">Observaciones</h4>
              <p className="text-slate-700 whitespace-pre-wrap">{retiro.observaciones}</p>
            </div>
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        <button
          onClick={onClose}
          className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-orange-600 text-white font-medium rounded-xl hover:from-red-700 hover:to-orange-700 transition-all shadow-lg shadow-red-500/30"
        >
          Cerrar
        </button>
      </ModalFooter>
    </Modal>
  )
}
