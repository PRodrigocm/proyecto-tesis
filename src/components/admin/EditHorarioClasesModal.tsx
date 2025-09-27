'use client'

import { useState, useEffect } from 'react'

interface EditHorarioClasesModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => Promise<boolean>
}

interface GradoSeccion {
  idGradoSeccion: number
  grado: {
    idGrado: number
    nombre: string
  }
  seccion: {
    idSeccion: number
    nombre: string
  }
}

interface HorarioDetalle {
  diaSemana: number
  horaInicio: string
  horaFin: string
  docente: string
  aula: string
  tipoActividad: 'CLASE_REGULAR' | 'RECUPERACION'
}

export default function EditHorarioClasesModal({ isOpen, onClose, onSave }: EditHorarioClasesModalProps) {
  const [loading, setLoading] = useState(false)
  const [gradosSecciones, setGradosSecciones] = useState<GradoSeccion[]>([])
  const [loadingGrados, setLoadingGrados] = useState(false)
  const [selectedGradoSeccion, setSelectedGradoSeccion] = useState('')
  const [horarios, setHorarios] = useState<HorarioDetalle[]>([])

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
    '07:00', '07:45', '08:30', '09:15', '10:00', '10:45', 
    '11:30', '12:15', '13:00', '13:45', '14:30', '15:15'
  ]

  useEffect(() => {
    if (isOpen) {
      loadGradosSecciones()
    }
  }, [isOpen])

  const loadGradosSecciones = async () => {
    setLoadingGrados(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/grados-secciones', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setGradosSecciones(data.data || [])
      }
    } catch (error) {
      console.error('Error loading grados y secciones:', error)
    } finally {
      setLoadingGrados(false)
    }
  }

  const loadExistingHorarios = async (gradoSeccionId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/horarios/anuales?idGradoSeccion=${gradoSeccionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        const horariosExistentes = data.data.map((h: any) => ({
          diaSemana: h.diaSemana,
          horaInicio: h.horaInicio,
          horaFin: h.horaFin,
          docente: h.docente?.nombre || '',
          aula: h.aula || '',
          tipoActividad: h.tipoActividad
        }))
        setHorarios(horariosExistentes)
      } else {
        setHorarios([])
      }
    } catch (error) {
      console.error('Error loading existing horarios:', error)
      setHorarios([])
    }
  }

  const handleGradoSeccionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target
    setSelectedGradoSeccion(value)
    
    if (value) {
      loadExistingHorarios(value)
    } else {
      setHorarios([])
    }
  }

  const handleHorarioChange = (index: number, field: keyof HorarioDetalle, value: string) => {
    setHorarios(prev => prev.map((horario, i) => 
      i === index ? { ...horario, [field]: value } : horario
    ))
  }

  const agregarHorarioRecuperacion = () => {
    const nuevoHorario: HorarioDetalle = {
      diaSemana: 6,
      horaInicio: '09:00',
      horaFin: '12:00',
      docente: '',
      aula: '',
      tipoActividad: 'RECUPERACION'
    }
    setHorarios(prev => [...prev, nuevoHorario])
  }

  const eliminarHorario = (index: number) => {
    setHorarios(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGradoSeccion) {
      alert('Por favor selecciona un grado y sección')
      return
    }

    if (horarios.length === 0) {
      alert('No hay horarios para editar. Selecciona un grado-sección que tenga horarios creados.')
      return
    }

    setLoading(true)
    try {
      const success = await onSave({
        idGradoSeccion: selectedGradoSeccion,
        horarios: horarios
      })

      if (success) {
        resetForm()
        onClose()
      }
    } catch (error) {
      console.error('Error updating horarios:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedGradoSeccion('')
    setHorarios([])
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            ✏️ Editar Horario de Clases
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grado y Sección *
            </label>
            <select
              value={selectedGradoSeccion}
              onChange={handleGradoSeccionChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              required
              disabled={loadingGrados}
            >
              <option value="">Seleccionar grado y sección...</option>
              {gradosSecciones.map((gs) => (
                <option key={gs.idGradoSeccion} value={gs.idGradoSeccion}>
                  {gs.grado.nombre}° {gs.seccion.nombre}
                </option>
              ))}
            </select>
            {loadingGrados && (
              <p className="text-sm text-gray-500 mt-1">Cargando grados y secciones...</p>
            )}
          </div>

          {selectedGradoSeccion && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                ✏️ <strong>Modo Edición:</strong> Editando horarios existentes para el grado-sección seleccionado.
                Los cambios se aplicarán a todos los horarios de esta sección.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-medium text-gray-900">
                Horarios de Clase {selectedGradoSeccion && '(Editando)'}
              </h4>
              <button
                type="button"
                onClick={agregarHorarioRecuperacion}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                disabled={!selectedGradoSeccion}
              >
                + Agregar Recuperación
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {horarios.map((horario, index) => (
                <div key={index} className={`p-4 border rounded-lg ${
                  horario.tipoActividad === 'RECUPERACION' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-gray-900">
                      {horario.tipoActividad === 'RECUPERACION' ? '🔄 Recuperación' : '📚 Clase Regular'}
                    </h5>
                    {horario.tipoActividad === 'RECUPERACION' && (
                      <button
                        type="button"
                        onClick={() => eliminarHorario(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Día
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
                        Aula
                      </label>
                      <input
                        type="text"
                        value={horario.aula}
                        onChange={(e) => handleHorarioChange(index, 'aula', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-black"
                        placeholder="Aula"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Docente
                      </label>
                      <input
                        type="text"
                        value={horario.docente}
                        onChange={(e) => handleHorarioChange(index, 'docente', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-black"
                        placeholder="Nombre del docente"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {horarios.length === 0 && selectedGradoSeccion && (
                <div className="text-center py-8 text-gray-500">
                  <p>No hay horarios creados para este grado-sección.</p>
                  <p className="text-sm">Primero crea horarios desde el "Horario General".</p>
                </div>
              )}

              {!selectedGradoSeccion && (
                <div className="text-center py-8 text-gray-500">
                  <p>Selecciona un grado y sección para ver sus horarios.</p>
                </div>
              )}
            </div>
          </div>

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
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={loading || !selectedGradoSeccion || horarios.length === 0}
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
