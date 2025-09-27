'use client'

import { useState, useEffect } from 'react'

interface CreateHorarioTalleresModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => Promise<boolean>
}

interface Taller {
  idTaller: number
  nombre: string
  descripcion: string
  instructor: string
}

interface HorarioTallerDetalle {
  diaSemana: number
  horaInicio: string
  horaFin: string
  lugar: string
  capacidadMaxima: number
  tipoActividad: 'TALLER_EXTRA' | 'REFORZAMIENTO' | 'RECUPERACION'
}

export default function CreateHorarioTalleresModal({ isOpen, onClose, onSave }: CreateHorarioTalleresModalProps) {
  const [loading, setLoading] = useState(false)
  const [talleres, setTalleres] = useState<Taller[]>([])
  const [loadingTalleres, setLoadingTalleres] = useState(false)
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    idTaller: ''
  })

  const [horarios, setHorarios] = useState<HorarioTallerDetalle[]>([])

  const diasSemana = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
    { value: 7, label: 'Domingo' }
  ]

  const horasComunes = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ]

  const tiposActividad = [
    { value: 'TALLER_EXTRA', label: 'Taller Extracurricular', color: 'purple' },
    { value: 'REFORZAMIENTO', label: 'Reforzamiento', color: 'green' },
    { value: 'RECUPERACION', label: 'Recuperación', color: 'orange' }
  ]

  useEffect(() => {
    if (isOpen) {
      loadTalleres()
      // Inicializar con un horario básico
      setHorarios([{
        diaSemana: 2, // Martes
        horaInicio: '14:00',
        horaFin: '16:00',
        lugar: '',
        capacidadMaxima: 20,
        tipoActividad: 'TALLER_EXTRA'
      }])
    }
  }, [isOpen])

  const loadTalleres = async () => {
    setLoadingTalleres(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/talleres', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setTalleres(data.data || [])
      }
    } catch (error) {
      console.error('Error loading talleres:', error)
    } finally {
      setLoadingTalleres(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleHorarioChange = (index: number, field: keyof HorarioTallerDetalle, value: string | number) => {
    setHorarios(prev => prev.map((horario, i) => 
      i === index ? { ...horario, [field]: value } : horario
    ))
  }

  const agregarHorario = () => {
    const nuevoHorario: HorarioTallerDetalle = {
      diaSemana: 6, // Sábado por defecto
      horaInicio: '09:00',
      horaFin: '12:00',
      lugar: '',
      capacidadMaxima: 20,
      tipoActividad: 'TALLER_EXTRA'
    }
    setHorarios(prev => [...prev, nuevoHorario])
  }

  const eliminarHorario = (index: number) => {
    if (horarios.length > 1) {
      setHorarios(prev => prev.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre || !formData.fechaInicio || !formData.fechaFin) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    if (horarios.length === 0) {
      alert('Debe agregar al menos un horario')
      return
    }

    setLoading(true)
    try {
      const success = await onSave({
        ...formData,
        horarios: horarios.map(h => ({
          ...h,
          idTaller: formData.idTaller ? parseInt(formData.idTaller) : null
        }))
      })

      if (success) {
        resetForm()
        onClose()
      }
    } catch (error) {
      console.error('Error creating horario taller:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      fechaInicio: '',
      fechaFin: '',
      idTaller: ''
    })
    setHorarios([])
  }

  const getTipoColor = (tipo: string) => {
    const tipoInfo = tiposActividad.find(t => t.value === tipo)
    return tipoInfo?.color || 'gray'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            🎨 Crear Horario de Talleres Anual
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Horario *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                placeholder="Ej: Talleres 2024 - Robótica"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taller (Opcional)
              </label>
              <select
                name="idTaller"
                value={formData.idTaller}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                disabled={loadingTalleres}
              >
                <option value="">Horario general de talleres...</option>
                {talleres.map((taller) => (
                  <option key={taller.idTaller} value={taller.idTaller}>
                    {taller.nombre}
                  </option>
                ))}
              </select>
              {loadingTalleres && (
                <p className="text-sm text-gray-500 mt-1">Cargando talleres...</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Inicio *
              </label>
              <input
                type="date"
                name="fechaInicio"
                value={formData.fechaInicio}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
              placeholder="Descripción del horario de talleres..."
            />
          </div>

          {/* Horarios */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900">
                Configuración de Horarios (Incluye Fin de Semana)
              </h4>
              <button
                type="button"
                onClick={agregarHorario}
                className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
              >
                + Agregar Horario
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {horarios.map((horario, index) => (
                <div key={index} className={`p-4 border rounded-lg ${
                  horario.tipoActividad === 'TALLER_EXTRA' ? 'bg-purple-50 border-purple-200' :
                  horario.tipoActividad === 'REFORZAMIENTO' ? 'bg-green-50 border-green-200' :
                  'bg-orange-50 border-orange-200'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-gray-900">
                      {horario.tipoActividad === 'TALLER_EXTRA' ? '🎨 Taller Extracurricular' :
                       horario.tipoActividad === 'REFORZAMIENTO' ? '🟢 Reforzamiento' :
                       '🟠 Recuperación'}
                    </h5>
                    {horarios.length > 1 && (
                      <button
                        type="button"
                        onClick={() => eliminarHorario(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Tipo de Actividad
                      </label>
                      <select
                        value={horario.tipoActividad}
                        onChange={(e) => handleHorarioChange(index, 'tipoActividad', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-black"
                      >
                        {tiposActividad.map(tipo => (
                          <option key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Día de la Semana
                      </label>
                      <select
                        value={horario.diaSemana}
                        onChange={(e) => handleHorarioChange(index, 'diaSemana', parseInt(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-black"
                      >
                        {diasSemana.map(dia => (
                          <option key={dia.value} value={dia.value}>
                            {dia.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Capacidad Máxima
                      </label>
                      <input
                        type="number"
                        value={horario.capacidadMaxima}
                        onChange={(e) => handleHorarioChange(index, 'capacidadMaxima', parseInt(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-black"
                        min="1"
                        max="100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Hora Inicio
                      </label>
                      <select
                        value={horario.horaInicio}
                        onChange={(e) => handleHorarioChange(index, 'horaInicio', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-black"
                      >
                        {horasComunes.map(hora => (
                          <option key={hora} value={hora}>{hora}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Hora Fin
                      </label>
                      <select
                        value={horario.horaFin}
                        onChange={(e) => handleHorarioChange(index, 'horaFin', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-black"
                      >
                        {horasComunes.map(hora => (
                          <option key={hora} value={hora}>{hora}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Lugar/Aula
                      </label>
                      <input
                        type="text"
                        value={horario.lugar}
                        onChange={(e) => handleHorarioChange(index, 'lugar', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-black"
                        placeholder="Lab, Aula, Cancha..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">ℹ️ Información sobre Horarios de Talleres</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Talleres Extracurriculares:</strong> Actividades opcionales (arte, música, deportes)</li>
              <li>• <strong>Reforzamiento:</strong> Clases adicionales para mejorar rendimiento (sábados)</li>
              <li>• <strong>Recuperación:</strong> Clases para estudiantes que necesitan ponerse al día (domingos)</li>
              <li>• <strong>Horarios anuales:</strong> Se aplican durante todo el año escolar</li>
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
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Creando...' : 'Crear Horario de Talleres'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
