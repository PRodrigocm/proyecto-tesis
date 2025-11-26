'use client'

import { useState, useEffect } from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'

// Iconos
const ClassroomIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

const QRIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
  </svg>
)

interface Estudiante {
  id: number
  nombres: string
  apellidos: string
  dni: string
  fechaNacimiento?: string
  codigoQR?: string
}

interface ViewSalonModalProps {
  isOpen: boolean
  onClose: () => void
  salonId: string
}

export default function ViewSalonModal({ isOpen, onClose, salonId }: ViewSalonModalProps) {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [loading, setLoading] = useState(true)
  const [salonInfo, setSalonInfo] = useState<any>(null)

  useEffect(() => {
    if (isOpen && salonId) {
      loadSalonData()
    }
  }, [isOpen, salonId])

  const loadSalonData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/salones/${salonId}/estudiantes`)
      if (response.ok) {
        const data = await response.json()
        setEstudiantes(data.estudiantes || [])
        setSalonInfo(data.salon)
      }
    } catch (error) {
      console.error('Error loading salon data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalHeader 
        icon={<ClassroomIcon />} 
        subtitle={salonInfo ? `${estudiantes.length} estudiantes` : 'Cargando...'}
        variant="amber"
        onClose={onClose}
      >
        {salonInfo ? `${salonInfo.grado}° ${salonInfo.seccion}` : 'Detalles del Salón'}
      </ModalHeader>

      <ModalBody>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Info del Salón */}
            {salonInfo && (
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    {salonInfo.grado}°{salonInfo.seccion}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{salonInfo.nivel}</h3>
                    <p className="text-sm text-slate-500">{salonInfo.grado}° Grado - Sección {salonInfo.seccion}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-amber-600">{estudiantes.length}</span>
                  <p className="text-xs text-slate-500">estudiantes</p>
                </div>
              </div>
            )}

            {/* Lista de Estudiantes */}
            <div>
              <h4 className="text-sm font-semibold text-slate-800 mb-3">Estudiantes Asignados</h4>
              
              {estudiantes.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl">
                  <p className="text-slate-500">No hay estudiantes asignados a este salón</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="max-h-80 overflow-y-auto">
                    <table className="min-w-full">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">#</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Estudiante</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">DNI</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">QR</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {estudiantes.map((estudiante, index) => (
                          <tr key={estudiante.id} className="hover:bg-amber-50/50 transition-colors">
                            <td className="px-4 py-3 text-sm text-slate-500 font-medium">{index + 1}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 font-semibold text-sm">
                                  {estudiante.nombres?.charAt(0)}{estudiante.apellidos?.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-900">{estudiante.apellidos}, {estudiante.nombres}</p>
                                  {estudiante.fechaNacimiento && (
                                    <p className="text-xs text-slate-400">{new Date(estudiante.fechaNacimiento).toLocaleDateString('es-ES')}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600 font-mono">{estudiante.dni}</td>
                            <td className="px-4 py-3">
                              {estudiante.codigoQR ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium">
                                  <QRIcon /> Activo
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <button
          onClick={onClose}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-medium rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg shadow-amber-500/30"
        >
          Cerrar
        </button>
      </ModalFooter>
    </Modal>
  )
}
