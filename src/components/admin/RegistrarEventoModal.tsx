import React, { useState, useEffect } from 'react'

interface GradoSeccion {
  idGradoSeccion: number
  grado: {
    idGrado: number
    nombre: string
    nivel: {
      idNivel: number
      nombre: string
    }
  }
  seccion: {
    idSeccion: number
    nombre: string
  }
}

interface RegistrarEventoModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (eventoData: {
    fecha: Date
    fechaInicio: Date
    fechaFin?: Date
    horaInicio?: string
    horaFin?: string
    tipo: 'FERIADO' | 'SUSPENSION' | 'VACACIONES' | 'EVENTO'
    descripcion?: string
    alcance?: 'TODOS' | 'RANGO' | 'INDIVIDUAL'
    nivel?: string
    gradoInicio?: string
    gradoFin?: string
    idGradoSeccion?: number
    idHorarioClase?: number
    notificarPadres?: boolean
  }) => Promise<void>
  selectedDate: Date | null
  selectedEvento?: any
  onDelete?: (idExcepcion: string) => Promise<void>
}

export default function RegistrarEventoModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  selectedDate,
  selectedEvento,
  onDelete
}: RegistrarEventoModalProps) {
  const [formData, setFormData] = useState({
    tipo: 'FERIADO' as 'FERIADO' | 'SUSPENSION' | 'VACACIONES' | 'EVENTO',
    descripcion: '',
    fechaInicio: null as Date | null,
    fechaFin: null as Date | null,
    alcance: 'TODOS' as 'TODOS' | 'RANGO' | 'INDIVIDUAL',
    nivel: '',
    gradoInicio: '',
    gradoFin: '',
    idGradoSeccion: undefined as number | undefined,
    idHorarioClase: undefined as number | undefined,
    notificarPadres: false
  })
  const [loading, setLoading] = useState(false)
  const [gradosSecciones, setGradosSecciones] = useState<GradoSeccion[]>([])
  const [loadingGrados, setLoadingGrados] = useState(false)
  
  // Fecha mínima: hoy (no permitir fechas pasadas)
  const today = new Date()
  const minDateString = today.toISOString().split('T')[0]

  useEffect(() => {
    if (isOpen && selectedDate) {
      // Debug: Ver qué datos tiene selectedEvento
      console.log('📝 Modal abierto con selectedEvento:', selectedEvento)
      console.log('🔍 onDelete disponible:', !!onDelete)
      
      if (selectedEvento) {
        // Cargar datos del evento existente
        setFormData({
          tipo: selectedEvento.tipoExcepcion === 'FERIADO' ? 'FERIADO' : 
                selectedEvento.tipoExcepcion === 'SUSPENSION_CLASES' ? 'SUSPENSION' :
                selectedEvento.tipoExcepcion === 'VACACIONES' ? 'VACACIONES' : 'EVENTO',
          descripcion: selectedEvento.motivo || '',
          fechaInicio: new Date(selectedEvento.fecha),
          fechaFin: selectedEvento.fechaFin ? new Date(selectedEvento.fechaFin) : null,
          alcance: 'TODOS',
          nivel: '',
          gradoInicio: '',
          gradoFin: '',
          idGradoSeccion: undefined,
          idHorarioClase: undefined,
          notificarPadres: false
        })
      } else {
        // Nuevo evento
        setFormData({
          tipo: 'FERIADO',
          descripcion: '',
          fechaInicio: selectedDate,
          fechaFin: null,
          alcance: 'TODOS',
          nivel: '',
          gradoInicio: '',
          gradoFin: '',
          idGradoSeccion: undefined,
          idHorarioClase: undefined,
          notificarPadres: false
        })
      }
      loadGradosSecciones()
    }
  }, [isOpen, selectedDate, selectedEvento])

  const loadGradosSecciones = async () => {
    setLoadingGrados(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/grados-secciones?ieId=1', {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('🔍 Validando datos:', {
      selectedDate,
      fechaInicio: formData.fechaInicio,
      fechaFin: formData.fechaFin
    })
    
    // Validar que haya fecha de inicio (del input o del calendario)
    const fechaInicioFinal = formData.fechaInicio || selectedDate
    
    if (!fechaInicioFinal) {
      alert('Por favor selecciona una fecha de inicio')
      return
    }
    
    console.log('✅ Enviando datos:', {
      fecha: fechaInicioFinal,
      fechaInicio: fechaInicioFinal,
      fechaFin: formData.fechaFin
    })

    setLoading(true)
    try {
      await onSubmit({
        fecha: fechaInicioFinal,
        fechaInicio: fechaInicioFinal,
        fechaFin: formData.fechaFin || undefined,
        tipo: formData.tipo,
        descripcion: formData.descripcion,
        alcance: formData.alcance,
        nivel: formData.nivel,
        gradoInicio: formData.gradoInicio,
        gradoFin: formData.gradoFin,
        idGradoSeccion: formData.idGradoSeccion,
        idHorarioClase: formData.idHorarioClase,
        notificarPadres: formData.notificarPadres
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
              {selectedEvento ? 'Editar Evento' : 'Registrar Evento'}
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

          {/* Mostrar información del evento existente */}
          {selectedEvento && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <span className="font-medium">📝 Editando evento:</span> {selectedEvento.motivo}
              </p>
            </div>
          )}

          {/* Fecha seleccionada */}
          {selectedDate && (
            <div className="mb-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Fecha de inicio:</span>{' '}
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
            {/* Fecha Inicio */}
            <div>
              <label htmlFor="fechaInicio" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Inicio *
              </label>
              <input
                type="date"
                id="fechaInicio"
                value={formData.fechaInicio ? formData.fechaInicio.toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  fechaInicio: e.target.value ? new Date(e.target.value + 'T00:00:00') : null 
                }))}
                min={minDateString}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black"
                required
              />
              <p className="text-xs text-gray-500 mt-1">No se pueden seleccionar fechas pasadas</p>
            </div>

            {/* Fecha Fin (opcional) */}
            <div>
              <label htmlFor="fechaFin" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Fin (Opcional)
              </label>
              <input
                type="date"
                id="fechaFin"
                value={formData.fechaFin ? formData.fechaFin.toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  fechaFin: e.target.value ? new Date(e.target.value + 'T00:00:00') : null 
                }))}
                min={formData.fechaInicio ? formData.fechaInicio.toISOString().split('T')[0] : minDateString}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black"
              />
              <p className="text-xs text-gray-500 mt-1">
                Si no se especifica, el evento será solo para la fecha de inicio
              </p>
            </div>

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
                <option value="FERIADO">🎉 Feriado (Para todos)</option>
                <option value="SUSPENSION">⛔ Suspensión de Clases (Para todos)</option>
                <option value="VACACIONES">🏖️ Vacaciones (Para todos)</option>
                <option value="EVENTO">📅 Evento (Específico por grados)</option>
              </select>
            </div>

            {/* Alcance del evento (solo para EVENTO) */}
            {formData.tipo === 'EVENTO' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alcance del Evento *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, alcance: 'TODOS' }))}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        formData.alcance === 'TODOS'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      🏫 Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, alcance: 'RANGO' }))}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        formData.alcance === 'RANGO'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      📊 Rango
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, alcance: 'INDIVIDUAL' }))}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        formData.alcance === 'INDIVIDUAL'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      📚 Individual
                    </button>
                  </div>
                </div>

                {/* Selección Individual */}
                {formData.alcance === 'INDIVIDUAL' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grado y Sección *
                    </label>
                    <select
                      value={formData.idGradoSeccion || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, idGradoSeccion: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                      required
                    >
                      <option value="">Seleccionar...</option>
                      {gradosSecciones.map((gs) => (
                        <option key={gs.idGradoSeccion} value={gs.idGradoSeccion}>
                          {gs.grado.nivel.nombre} - {gs.grado.nombre}° {gs.seccion.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Selección por Rango */}
                {formData.alcance === 'RANGO' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nivel *
                      </label>
                      <select
                        value={formData.nivel}
                        onChange={(e) => setFormData(prev => ({ ...prev, nivel: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                        required
                      >
                        <option value="">Seleccionar...</option>
                        {[...new Set(gradosSecciones
                          .map(gs => gs.grado?.nivel?.nombre)
                          .filter(nombre => nombre))]
                          .map((nivel, index) => (
                            <option key={`nivel-${index}`} value={nivel}>{nivel}</option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grado Inicio *
                      </label>
                      <select
                        value={formData.gradoInicio}
                        onChange={(e) => setFormData(prev => ({ ...prev, gradoInicio: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                        required
                        disabled={!formData.nivel}
                      >
                        <option value="">Desde...</option>
                        {[...new Set(gradosSecciones
                          .filter(gs => gs.grado?.nivel?.nombre === formData.nivel)
                          .map(gs => gs.grado?.nombre)
                          .filter(nombre => nombre))]
                          .sort((a: any, b: any) => parseInt(a) - parseInt(b))
                          .map((grado, index) => (
                            <option key={`inicio-${index}`} value={grado}>{grado}°</option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grado Fin *
                      </label>
                      <select
                        value={formData.gradoFin}
                        onChange={(e) => setFormData(prev => ({ ...prev, gradoFin: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                        required
                        disabled={!formData.gradoInicio}
                      >
                        <option value="">Hasta...</option>
                        {[...new Set(gradosSecciones
                          .filter(gs => gs.grado?.nivel?.nombre === formData.nivel)
                          .map(gs => gs.grado?.nombre)
                          .filter(nombre => nombre))]
                          .filter((grado: any) => parseInt(grado) >= parseInt(formData.gradoInicio))
                          .sort((a: any, b: any) => parseInt(a) - parseInt(b))
                          .map((grado, index) => (
                            <option key={`fin-${index}`} value={grado}>{grado}°</option>
                          ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Checkbox Notificar Padres */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="notificarPadres"
                    checked={formData.notificarPadres}
                    onChange={(e) => setFormData(prev => ({ ...prev, notificarPadres: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="notificarPadres" className="ml-2 block text-sm text-gray-900">
                    📧 Notificar a los padres de familia
                  </label>
                </div>
              </>
            )}

            {/* Descripción (siempre visible) */}
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

            {/* Información adicional */}
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-gray-600">
                  {formData.tipo === 'EVENTO' ? (
                    <p>
                      Se creará un evento específico para los grados seleccionados.
                      {formData.notificarPadres && ' Los padres de familia recibirán una notificación.'}
                    </p>
                  ) : formData.tipo === 'FERIADO' || formData.tipo === 'SUSPENSION' ? (
                    <p>Se aplicará a TODOS los grados y secciones. Esto afectará los horarios de clases programados.</p>
                  ) : (
                    <p>Se registrará como excepción en el calendario.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200">
              {/* Botón Eliminar (solo si hay evento seleccionado) */}
              {selectedEvento && onDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    console.log('🗑️ Eliminando evento:', selectedEvento)
                    const eventoId = selectedEvento.idCalendario || selectedEvento.idExcepcion || selectedEvento.id
                    if (eventoId) {
                      onDelete(String(eventoId))
                    } else {
                      console.error('❌ No se encontró ID del evento:', selectedEvento)
                      alert('No se puede eliminar: ID de evento no encontrado')
                    }
                  }}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Eliminar Evento
                  </span>
                </button>
              ) : (
                <div></div>
              )}
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (selectedEvento ? 'Actualizando...' : 'Registrando...') : (selectedEvento ? 'Actualizar Evento' : 'Registrar Evento')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
