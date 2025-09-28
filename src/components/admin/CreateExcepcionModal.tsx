'use client'

import { useState } from 'react'

interface CreateExcepcionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => Promise<boolean>
}

const tiposExcepcion = [
  { value: 'FERIADO', label: '🎉 Feriado', description: 'Días festivos nacionales o locales' },
  { value: 'SUSPENSION_CLASES', label: '⚠️ Suspensión de Clases', description: 'Emergencias, clima, etc.' },
  { value: 'VACACIONES', label: '🏖️ Vacaciones', description: 'Períodos vacacionales' },
  { value: 'HORARIO_ESPECIAL', label: '⏰ Horario Especial', description: 'Ceremonias, eventos especiales' },
  { value: 'CAPACITACION', label: '📚 Capacitación', description: 'Formación docente' },
  { value: 'DIA_NO_LABORABLE', label: '📅 Día No Laborable', description: 'Días especiales sin clases' },
  { value: 'OTRO', label: '📝 Otro', description: 'Otras excepciones' }
]

const tiposHorario = [
  { value: 'AMBOS', label: '🏫 Toda la Institución', description: 'Suspende clases y talleres' },
  { value: 'CLASE', label: '📚 Solo Clases', description: 'Solo suspende clases regulares' },
  { value: 'TALLER', label: '🔧 Solo Talleres', description: 'Solo suspende talleres' }
]

export default function CreateExcepcionModal({ isOpen, onClose, onSave }: CreateExcepcionModalProps) {
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    fecha: '',
    fechaInicio: '',
    fechaFin: '',
    tipoExcepcion: 'FERIADO',
    tipoHorario: 'AMBOS',
    motivo: '',
    descripcion: '',
    horaInicioAlt: '',
    horaFinAlt: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validaciones según el tipo de excepción
    if (esVacaciones) {
      if (!formData.fechaInicio || !formData.fechaFin || !formData.tipoExcepcion || !formData.motivo) {
        alert('Por favor completa todos los campos requeridos (fecha inicio, fecha fin, motivo)')
        return
      }
      
      // Validar que fecha inicio sea menor o igual que fecha fin
      const fechaInicio = new Date(formData.fechaInicio)
      const fechaFin = new Date(formData.fechaFin)
      
      if (fechaInicio > fechaFin) {
        alert('La fecha de inicio debe ser menor o igual que la fecha de fin')
        return
      }
      
      // Validar que las fechas no sean pasadas
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      
      if (fechaInicio < hoy) {
        alert('No puedes crear excepciones para fechas pasadas')
        return
      }
    } else {
      if (!formData.fecha || !formData.tipoExcepcion || !formData.motivo) {
        alert('Por favor completa todos los campos requeridos')
        return
      }

      // Validar que la fecha no sea pasada
      const fechaSeleccionada = new Date(formData.fecha)
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      
      if (fechaSeleccionada < hoy) {
        alert('No puedes crear excepciones para fechas pasadas')
        return
      }
    }

    // Validar horario alternativo si se especifica
    if (formData.horaInicioAlt && formData.horaFinAlt) {
      if (formData.horaInicioAlt >= formData.horaFinAlt) {
        alert('La hora de inicio debe ser menor que la hora de fin')
        return
      }
    }

    setLoading(true)
    try {
      const success = await onSave(formData)

      if (success) {
        resetForm()
        onClose()
      }
    } catch (error) {
      console.error('Error creating excepción:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      fecha: '',
      fechaInicio: '',
      fechaFin: '',
      tipoExcepcion: 'FERIADO',
      tipoHorario: 'AMBOS',
      motivo: '',
      descripcion: '',
      horaInicioAlt: '',
      horaFinAlt: ''
    })
  }

  const tipoSeleccionado = tiposExcepcion.find(t => t.value === formData.tipoExcepcion)
  const esHorarioEspecial = formData.tipoExcepcion === 'HORARIO_ESPECIAL'
  const esVacaciones = formData.tipoExcepcion === 'VACACIONES'

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            🚫 Agregar Feriado o Excepción
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Cerrar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">💡 Concepto Simple</h4>
            <p className="text-sm text-yellow-700">
              Tu horario base (L-V 8:00-13:30) se mantiene fijo. Solo agrega excepciones cuando:
              <strong> feriados, suspensiones, vacaciones o eventos especiales</strong> cambien el horario normal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {esVacaciones ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    name="fechaInicio"
                    value={formData.fechaInicio}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Fin *
                  </label>
                  <input
                    type="date"
                    name="fechaFin"
                    value={formData.fechaFin}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    required
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha *
                </label>
                <input
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Excepción *
              </label>
              <select
                name="tipoExcepcion"
                value={formData.tipoExcepcion}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                required
              >
                {tiposExcepcion.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
              {tipoSeleccionado && (
                <p className="text-xs text-gray-500 mt-1">{tipoSeleccionado.description}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alcance de la Excepción *
            </label>
            <select
              name="tipoHorario"
              value={formData.tipoHorario}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              required
            >
              {tiposHorario.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {tiposHorario.find(t => t.value === formData.tipoHorario)?.description}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo *
            </label>
            <input
              type="text"
              name="motivo"
              value={formData.motivo}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="Ej: Día de la Independencia, Lluvia intensa, Capacitación docente..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción Adicional
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="Detalles adicionales sobre la excepción..."
            />
          </div>

          {esHorarioEspecial && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-2">⏰ Horario Alternativo</h4>
              <p className="text-xs text-blue-600 mb-3">
                Para eventos especiales, puedes definir un horario alternativo en lugar de suspender clases
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Hora Inicio Alternativa
                  </label>
                  <input
                    type="time"
                    name="horaInicioAlt"
                    value={formData.horaInicioAlt}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Hora Fin Alternativa
                  </label>
                  <input
                    type="time"
                    name="horaFinAlt"
                    value={formData.horaFinAlt}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-black"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="text-sm font-medium text-green-800 mb-2">✅ Resumen de la Excepción:</h4>
            <ul className="text-sm text-green-700 space-y-1">
              {esVacaciones ? (
                <>
                  <li>• <strong>Fecha Inicio:</strong> {formData.fechaInicio || 'No seleccionada'}</li>
                  <li>• <strong>Fecha Fin:</strong> {formData.fechaFin || 'No seleccionada'}</li>
                  {formData.fechaInicio && formData.fechaFin && (
                    <li>• <strong>Duración:</strong> {
                      Math.ceil((new Date(formData.fechaFin).getTime() - new Date(formData.fechaInicio).getTime()) / (1000 * 60 * 60 * 24)) + 1
                    } días</li>
                  )}
                </>
              ) : (
                <li>• <strong>Fecha:</strong> {formData.fecha || 'No seleccionada'}</li>
              )}
              <li>• <strong>Tipo:</strong> {tipoSeleccionado?.label || 'No seleccionado'}</li>
              <li>• <strong>Alcance:</strong> {tiposHorario.find(t => t.value === formData.tipoHorario)?.label}</li>
              <li>• <strong>Motivo:</strong> {formData.motivo || 'No especificado'}</li>
              {esHorarioEspecial && formData.horaInicioAlt && formData.horaFinAlt && (
                <li>• <strong>Horario Alt:</strong> {formData.horaInicioAlt} - {formData.horaFinAlt}</li>
              )}
            </ul>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Creando...' : 'Crear Excepción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
