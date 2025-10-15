'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface EditHorarioTallerModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (horarioId: string, data: any) => Promise<boolean>
  horario: {
    id: string
    taller: {
      id: number
      nombre: string
      instructor?: string
    }
    diaSemana: number
    horaInicio: string
    horaFin: string
    lugar?: string
    toleranciaMin: number
    activo: boolean
  } | null
}

const diasSemana = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' }
]

export default function EditHorarioTallerModal({
  isOpen,
  onClose,
  onSave,
  horario
}: EditHorarioTallerModalProps) {
  const [formData, setFormData] = useState({
    diaSemana: 1,
    horaInicio: '',
    horaFin: '',
    lugar: '',
    toleranciaMin: 10,
    activo: true
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Cargar datos del horario cuando se abre el modal
  useEffect(() => {
    if (isOpen && horario) {
      setFormData({
        diaSemana: horario.diaSemana,
        horaInicio: horario.horaInicio,
        horaFin: horario.horaFin,
        lugar: horario.lugar || '',
        toleranciaMin: horario.toleranciaMin,
        activo: horario.activo
      })
      setErrors({})
    }
  }, [isOpen, horario])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
    
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.horaInicio) {
      newErrors.horaInicio = 'La hora de inicio es requerida'
    }

    if (!formData.horaFin) {
      newErrors.horaFin = 'La hora de fin es requerida'
    }

    if (formData.horaInicio && formData.horaFin) {
      const inicio = new Date(`2000-01-01T${formData.horaInicio}:00`)
      const fin = new Date(`2000-01-01T${formData.horaFin}:00`)
      
      if (fin <= inicio) {
        newErrors.horaFin = 'La hora de fin debe ser posterior a la hora de inicio'
      }
    }

    if (formData.toleranciaMin < 0 || formData.toleranciaMin > 60) {
      newErrors.toleranciaMin = 'La tolerancia debe estar entre 0 y 60 minutos'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !horario) {
      return
    }

    setLoading(true)
    try {
      const success = await onSave(horario.id, {
        diaSemana: parseInt(formData.diaSemana.toString()),
        horaInicio: formData.horaInicio,
        horaFin: formData.horaFin,
        lugar: formData.lugar || null,
        toleranciaMin: parseInt(formData.toleranciaMin.toString()),
        activo: formData.activo
      })

      if (success) {
        onClose()
      }
    } catch (error) {
      console.error('Error al guardar horario:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !horario) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Editar Horario - {horario.taller.nombre}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Información del taller */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Taller:</span> {horario.taller.nombre}
                </p>
                {horario.taller.instructor && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Instructor:</span> {horario.taller.instructor}
                  </p>
                )}
              </div>

              {/* Día de la semana */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Día de la semana
                </label>
                <select
                  name="diaSemana"
                  value={formData.diaSemana}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {diasSemana.map(dia => (
                    <option key={dia.value} value={dia.value}>
                      {dia.label}
                    </option>
                  ))}
                </select>
                {errors.diaSemana && (
                  <p className="text-red-500 text-sm mt-1">{errors.diaSemana}</p>
                )}
              </div>

              {/* Horarios */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora de inicio
                  </label>
                  <input
                    type="time"
                    name="horaInicio"
                    value={formData.horaInicio}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {errors.horaInicio && (
                    <p className="text-red-500 text-sm mt-1">{errors.horaInicio}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora de fin
                  </label>
                  <input
                    type="time"
                    name="horaFin"
                    value={formData.horaFin}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {errors.horaFin && (
                    <p className="text-red-500 text-sm mt-1">{errors.horaFin}</p>
                  )}
                </div>
              </div>

              {/* Lugar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lugar/Aula
                </label>
                <input
                  type="text"
                  name="lugar"
                  value={formData.lugar}
                  onChange={handleInputChange}
                  placeholder="Ej: Aula de Arte, Laboratorio, Cancha"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {errors.lugar && (
                  <p className="text-red-500 text-sm mt-1">{errors.lugar}</p>
                )}
              </div>

              {/* Tolerancia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tolerancia (minutos)
                </label>
                <input
                  type="number"
                  name="toleranciaMin"
                  value={formData.toleranciaMin}
                  onChange={handleInputChange}
                  min="0"
                  max="60"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {errors.toleranciaMin && (
                  <p className="text-red-500 text-sm mt-1">{errors.toleranciaMin}</p>
                )}
              </div>

              {/* Estado activo */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="activo"
                  checked={formData.activo}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Horario activo
                </label>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
