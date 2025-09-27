'use client'

import { useState, useEffect } from 'react'

interface CreateHorarioGeneralModalProps {
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

interface HorarioGeneralDetalle {
  diaSemana: number
  horaInicio: string
  horaFin: string
  aula: string
  tipoActividad: 'CLASE_REGULAR' | 'TALLER_EXTRA' | 'REFORZAMIENTO' | 'RECUPERACION' | 'EVALUACION'
}

export default function CreateHorarioGeneralModal({ isOpen, onClose, onSave }: CreateHorarioGeneralModalProps) {
  const [loading, setLoading] = useState(false)
  const [gradosSecciones, setGradosSecciones] = useState<GradoSeccion[]>([])
  const [loadingGrados, setLoadingGrados] = useState(false)
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    idGradoSeccion: '',
    incluirFinDeSemana: false
  })

  // Estado para controlar si aplicar a todas las aulas
  const [aplicarTodasAulas, setAplicarTodasAulas] = useState(false)

  const [horarios, setHorarios] = useState<HorarioGeneralDetalle[]>([])

  const diasSemana = [
    { value: 1, label: 'Lunes', tipo: 'regular' },
    { value: 2, label: 'Martes', tipo: 'regular' },
    { value: 3, label: 'Miércoles', tipo: 'regular' },
    { value: 4, label: 'Jueves', tipo: 'regular' },
    { value: 5, label: 'Viernes', tipo: 'regular' },
    { value: 6, label: 'Sábado', tipo: 'finSemana' },
    { value: 7, label: 'Domingo', tipo: 'finSemana' }
  ]

  const horasComunes = [
    '07:00', '07:45', '08:30', '09:15', '10:00', '10:45', 
    '11:30', '12:15', '13:00', '13:45', '14:30', '15:15', '16:00', '17:00'
  ]

  const tiposActividad = [
    { value: 'CLASE_REGULAR', label: 'Clase Regular', color: 'blue', dias: 'regular' },
    { value: 'TALLER_EXTRA', label: 'Taller Extracurricular', color: 'purple', dias: 'todos' },
    { value: 'REFORZAMIENTO', label: 'Reforzamiento', color: 'green', dias: 'finSemana' },
    { value: 'RECUPERACION', label: 'Recuperación', color: 'orange', dias: 'finSemana' },
    { value: 'EVALUACION', label: 'Evaluación', color: 'red', dias: 'todos' }
  ]

  useEffect(() => {
    if (isOpen) {
      loadGradosSecciones()
      inicializarHorarios()
    }
  }, [isOpen])

  useEffect(() => {
    if (formData.incluirFinDeSemana) {
      inicializarHorarios()
    } else {
      // Filtrar solo horarios de lunes a viernes
      setHorarios(prev => prev.filter(h => h.diaSemana <= 5))
    }
  }, [formData.incluirFinDeSemana])

  const inicializarHorarios = () => {
    const diasAIncluir = formData.incluirFinDeSemana 
      ? diasSemana 
      : diasSemana.filter(dia => dia.tipo === 'regular')
    
    const horariosIniciales: HorarioGeneralDetalle[] = diasAIncluir.map(dia => ({
      diaSemana: dia.value,
      horaInicio: dia.tipo === 'finSemana' ? '09:00' : '08:00',
      horaFin: dia.tipo === 'finSemana' ? '12:00' : '13:00',
      aula: '', // Se usará el aula del grado-sección
      tipoActividad: (dia.tipo === 'finSemana' ? 'REFORZAMIENTO' : 'CLASE_REGULAR') as 'CLASE_REGULAR' | 'TALLER_EXTRA' | 'REFORZAMIENTO' | 'RECUPERACION' | 'EVALUACION'
    }))
    
    setHorarios(horariosIniciales)
  }

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleHorarioChange = (index: number, field: keyof HorarioGeneralDetalle, value: string | number) => {
    setHorarios(prev => prev.map((horario, i) => 
      i === index ? { ...horario, [field]: value } : horario
    ))
  }


  const agregarHorario = () => {
    const nuevoHorario: HorarioGeneralDetalle = {
      diaSemana: 6, // Sábado por defecto
      horaInicio: '09:00',
      horaFin: '12:00',
      aula: '', // Se usará el aula del grado-sección
      tipoActividad: 'REFORZAMIENTO'
    }
    setHorarios(prev => [...prev, nuevoHorario])
  }

  const eliminarHorario = (index: number) => {
    setHorarios(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre || !formData.idGradoSeccion || !formData.fechaInicio || !formData.fechaFin) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    if (horarios.length === 0) {
      alert('Debe agregar al menos un horario')
      return
    }

    setLoading(true)
    try {
      // Crear horarios anuales directamente en HorarioClase
      const token = localStorage.getItem('token')
      const response = await fetch('/api/horarios/anuales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          idGradoSeccion: parseInt(formData.idGradoSeccion),
          fechaInicio: formData.fechaInicio,
          fechaFin: formData.fechaFin,
          aplicarTodasAulas: aplicarTodasAulas,
          horarios: horarios.map(h => ({
            diaSemana: h.diaSemana,
            horaInicio: h.horaInicio,
            horaFin: h.horaFin,
            // En primaria no se maneja materia específica
            aula: aplicarTodasAulas ? null : (h.aula || ''),
            // El docente se obtiene automáticamente del grado-sección
            tipoActividad: h.tipoActividad,
            toleranciaMin: 10,
            sesiones: 1,
            activo: true
          }))
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Horarios anuales creados:', result)
        resetForm()
        onClose()
        // Llamar onSave para actualizar la lista
        await onSave({ success: true })
      } else {
        const error = await response.json()
        console.error('Error creating horarios anuales:', error)
        alert('Error al crear los horarios: ' + (error.error || 'Error desconocido'))
      }
    } catch (error) {
      console.error('Error creating horario general:', error)
      alert('Error de conexión al crear los horarios')
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
      idGradoSeccion: '',
      incluirFinDeSemana: false
    })
    setAplicarTodasAulas(false)
    setHorarios([])
  }

  const getTipoColor = (tipo: string) => {
    const tipoInfo = tiposActividad.find(t => t.value === tipo)
    return tipoInfo?.color || 'gray'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-5xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            📅 Crear Horario General Anual (Clases + Talleres)
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                placeholder="Ej: Horario Completo 2024 - 3° A"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grado y Sección *
              </label>
              <select
                name="idGradoSeccion"
                value={formData.idGradoSeccion}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Inicio *
              </label>
              <input
                type="date"
                name="fechaInicio"
                value={formData.fechaInicio}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
              placeholder="Descripción del horario general..."
            />
          </div>

          {/* Opción de fin de semana */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="incluirFinDeSemana"
              checked={formData.incluirFinDeSemana}
              onChange={handleInputChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Incluir fines de semana (reforzamiento/recuperación)
            </label>
          </div>

          {/* Aplicar a todas las aulas */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                checked={aplicarTodasAulas}
                onChange={(e) => setAplicarTodasAulas(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm font-medium text-gray-900">
                🏫 Crear horario para el aula del grado-sección
              </label>
            </div>
            
            {aplicarTodasAulas && (
              <div className="ml-6 p-3 bg-indigo-50 rounded-lg">
                <p className="text-sm text-indigo-700 mb-2">
                  ✅ El horario se creará automáticamente para el aula del grado-sección (ej: "Aula 3° A")
                </p>
                <p className="text-xs text-indigo-600">
                  💡 El docente del grado-sección se asignará automáticamente a todas las aulas
                </p>
              </div>
            )}
          </div>

          {/* Horarios */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900">
                Configuración de Horarios Completos
              </h4>
              <button
                type="button"
                onClick={agregarHorario}
                className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
              >
                + Agregar Horario
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {horarios.map((horario, index) => {
                const tipoInfo = tiposActividad.find(t => t.value === horario.tipoActividad)
                const colorClass = `bg-${tipoInfo?.color || 'gray'}-50 border-${tipoInfo?.color || 'gray'}-200`
                
                return (
                  <div key={index} className={`p-4 border rounded-lg ${colorClass}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-900">
                        {tipoInfo?.label || horario.tipoActividad} - {diasSemana.find(d => d.value === horario.diaSemana)?.label}
                      </h5>
                      <button
                        type="button"
                        onClick={() => eliminarHorario(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Eliminar
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                          Día
                        </label>
                        <select
                          value={horario.diaSemana}
                          onChange={(e) => handleHorarioChange(index, 'diaSemana', e.target.value)}
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
                          Aula/Lugar {aplicarTodasAulas && '(Se aplicará a todas las aulas)'}
                        </label>
                        <input
                          type="text"
                          value={horario.aula}
                          onChange={(e) => handleHorarioChange(index, 'aula', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-black"
                          placeholder={aplicarTodasAulas ? "Se aplicará a todas las aulas automáticamente" : "Aula, Lab, Cancha..."}
                          disabled={aplicarTodasAulas}
                        />
                      </div>

                      {/* En primaria no se maneja materia específica - un docente enseña todo */}

                      {/* El docente se asigna automáticamente según el grado-sección */}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h5 className="font-medium text-indigo-900 mb-2">ℹ️ Horario General para Grado-Sección</h5>
            <div className="text-sm text-indigo-700 space-y-1">
              <p>• <strong>Docente:</strong> Se asigna automáticamente el docente del grado-sección seleccionado</p>
              <p>• <strong>Aulas:</strong> {aplicarTodasAulas ? 'Se crea para el aula del grado-sección (ej: "Aula 3° A")' : 'Se aplica al aula específica configurada'}</p>
              <p>• <strong>Clases regulares:</strong> Lunes a viernes (horario académico normal)</p>
              <p>• <strong>Reforzamiento/Recuperación:</strong> Fines de semana (apoyo académico)</p>
              <p>• <strong>Cobertura anual:</strong> Desde fecha inicio hasta fecha fin</p>
              <p>• <strong>Evaluaciones:</strong> Cualquier día (exámenes especiales)</p>
            </div>
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
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Creando...' : 'Crear Horario General'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
