import React, { useState, useEffect } from 'react'

interface RegistrarEventoModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (eventoData: {
    fecha: Date
    tipo: 'LECTIVO' | 'FERIADO' | 'SUSPENSION' | 'VACACIONES'
    descripcion?: string
  }) => Promise<void>
  selectedDate: Date | null
}

export default function RegistrarEventoModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  selectedDate 
}: RegistrarEventoModalProps) {
  const [formData, setFormData] = useState({
    tipo: 'LECTIVO' as 'LECTIVO' | 'FERIADO' | 'SUSPENSION' | 'VACACIONES',
    descripcion: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setFormData({
        tipo: 'LECTIVO',
        descripcion: ''
      })
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate) return

    setLoading(true)
    try {
      await onSubmit({
        fecha: selectedDate,
        ...formData
      })
      onClose()
    } catch (error) {
      console.error('Error al registrar evento:', error)
      alert('Error al registrar el evento. Por favor, inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Registrar Evento
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

          {/* Fecha seleccionada */}
          {selectedDate && (
            <div className="mb-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Fecha seleccionada:</span>{' '}
                {selectedDate.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tipo de evento */}
            <div>
              <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Evento
              </label>
              <select
                id="tipo"
                name="tipo"
                value={formData.tipo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black"
                required
              >
                <option value="LECTIVO">Día Lectivo</option>
                <option value="FERIADO">Feriado</option>
                <option value="SUSPENSION">Suspensión de Clases</option>
                <option value="VACACIONES">Vacaciones</option>
              </select>
            </div>


            {/* Descripción (solo para excepciones) */}
            {formData.tipo !== 'LECTIVO' && (
              <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  placeholder="Detalles adicionales sobre el evento..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black resize-none"
                />
              </div>
            )}

            {/* Información adicional */}
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-gray-600">
                  {formData.tipo === 'LECTIVO' ? (
                    <p>Se registrará este día como día lectivo en el calendario escolar.</p>
                  ) : (
                    <p>Se registrará como excepción en el calendario. Esto afectará los horarios de clases programados.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Registrando...' : 'Registrar Evento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
