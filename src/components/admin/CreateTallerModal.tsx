import { useState, useEffect } from 'react'

interface HorarioData {
  diaSemana: number
  horaInicio: string
  horaFin: string
  lugar?: string
}

interface Docente {
  id: string
  nombre: string
  apellido: string
  especialidad: string
}

interface Estudiante {
  id: string
  nombre: string
  apellido: string
  grado: string
  seccion: string
  dni: string
}

interface CreateTallerModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    nombre: string
    descripcion?: string
    docentesIds?: string[]
    estudiantesIds?: string[]
    capacidadMaxima?: number
    horarios?: HorarioData[]
  }) => Promise<boolean>
}

export default function CreateTallerModal({ isOpen, onClose, onSubmit }: CreateTallerModalProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    capacidadMaxima: 20
  })
  const [horarioData, setHorarioData] = useState({
    horaInicio: '14:00',
    horaFin: '16:00',
    lugar: ''
  })
  const [diasSeleccionados, setDiasSeleccionados] = useState<number[]>([])
  const [docentesSeleccionados, setDocentesSeleccionados] = useState<string[]>([])
  const [estudiantesSeleccionados, setEstudiantesSeleccionados] = useState<string[]>([])
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingDocentes, setLoadingDocentes] = useState(false)
  const [loadingEstudiantes, setLoadingEstudiantes] = useState(false)

  const diasSemana = [
    { id: 1, nombre: 'Lunes', abrev: 'L' },
    { id: 2, nombre: 'Martes', abrev: 'M' },
    { id: 3, nombre: 'Miércoles', abrev: 'X' },
    { id: 4, nombre: 'Jueves', abrev: 'J' },
    { id: 5, nombre: 'Viernes', abrev: 'V' },
    { id: 6, nombre: 'Sábado', abrev: 'S' },
    { id: 7, nombre: 'Domingo', abrev: 'D' }
  ]

  // Cargar docentes y estudiantes cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadDocentes()
      loadEstudiantes()
    }
  }, [isOpen])

  const loadDocentes = async () => {
    setLoadingDocentes(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/docentes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        // Mostrar todos los docentes disponibles
        setDocentes(data.data || [])
      }
    } catch (error) {
      console.error('Error loading docentes:', error)
    } finally {
      setLoadingDocentes(false)
    }
  }

  const loadEstudiantes = async () => {
    setLoadingEstudiantes(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/estudiantes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setEstudiantes(data.data || [])
      }
    } catch (error) {
      console.error('Error loading estudiantes:', error)
    } finally {
      setLoadingEstudiantes(false)
    }
  }

  const talleresSugeridos = [
    'Inglés',
    'Fútbol',
    'Basketball',
    'Voleibol',
    'Robótica',
    'Danza',
    'Teatro',
    'Música',
    'Arte',
    'Computación',
    'Ajedrez',
    'Natación'
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacidadMaxima' ? parseInt(value) || 0 : value
    }))
  }

  const handleHorarioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setHorarioData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleDiaToggle = (diaId: number) => {
    setDiasSeleccionados(prev => {
      if (prev.includes(diaId)) {
        return prev.filter(id => id !== diaId)
      } else {
        return [...prev, diaId]
      }
    })
  }

  const handleDocenteToggle = (docenteId: string) => {
    setDocentesSeleccionados(prev => {
      if (prev.includes(docenteId)) {
        return prev.filter(id => id !== docenteId)
      } else {
        return [...prev, docenteId]
      }
    })
  }

  const handleEstudianteToggle = (estudianteId: string) => {
    setEstudiantesSeleccionados(prev => {
      if (prev.includes(estudianteId)) {
        return prev.filter(id => id !== estudianteId)
      } else {
        return [...prev, estudianteId]
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nombre.trim()) {
      alert('El nombre del taller es requerido')
      return
    }

    // Validar horarios si hay días seleccionados
    if (diasSeleccionados.length > 0) {
      if (!horarioData.horaInicio || !horarioData.horaFin) {
        alert('Debe especificar hora de inicio y fin para los días seleccionados')
        return
      }
      
      if (horarioData.horaInicio >= horarioData.horaFin) {
        alert('La hora de inicio debe ser anterior a la hora de fin')
        return
      }
    }

    setLoading(true)
    try {
      // Crear horarios basados en los días seleccionados
      const horarios: HorarioData[] = diasSeleccionados.map(diaSemana => ({
        diaSemana,
        horaInicio: horarioData.horaInicio,
        horaFin: horarioData.horaFin,
        lugar: horarioData.lugar.trim() || undefined
      }))

      const success = await onSubmit({
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || undefined,
        docentesIds: docentesSeleccionados.length > 0 ? docentesSeleccionados : undefined,
        estudiantesIds: estudiantesSeleccionados.length > 0 ? estudiantesSeleccionados : undefined,
        capacidadMaxima: formData.capacidadMaxima || undefined,
        horarios: horarios.length > 0 ? horarios : undefined
      })

      if (success) {
        resetForm()
        onClose()
      }
    } catch (error) {
      console.error('Error creating taller:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      capacidadMaxima: 20
    })
    setHorarioData({
      horaInicio: '14:00',
      horaFin: '16:00',
      lugar: ''
    })
    setDiasSeleccionados([])
    setDocentesSeleccionados([])
    setEstudiantesSeleccionados([])
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            🎯 Crear Nuevo Taller
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="sr-only">Cerrar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nombre del Taller */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Taller *
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              required
              placeholder="Ej: Inglés, Fútbol, Robótica..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
            />
            
            {/* Sugerencias de talleres */}
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-2">Talleres sugeridos:</p>
              <div className="flex flex-wrap gap-1">
                {talleresSugeridos.map((taller) => (
                  <button
                    key={taller}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, nombre: taller }))}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    {taller}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Capacidad Máxima */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Capacidad Máxima
            </label>
            <input
              type="number"
              name="capacidadMaxima"
              value={formData.capacidadMaxima}
              onChange={handleInputChange}
              min="1"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-1">
              Número máximo de estudiantes que pueden inscribirse
            </p>
          </div>

          {/* Sección de Docentes */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              👨‍🏫 Docentes del Taller
            </h4>
            
            {loadingDocentes ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                <span className="ml-2 text-gray-600">Cargando docentes...</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                  {docentes.map((docente) => (
                    <label key={docente.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={docentesSeleccionados.includes(docente.id)}
                        onChange={() => handleDocenteToggle(docente.id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {docente.nombre} {docente.apellido}
                        </div>
                        <div className="text-xs text-gray-500">
                          {docente.especialidad}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                
                {docentes.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No hay docentes de taller disponibles
                  </div>
                )}
                
                {docentesSeleccionados.length > 0 && (
                  <div className="mt-3 p-3 bg-green-50 rounded-md">
                    <p className="text-sm font-medium text-green-800 mb-2">
                      Docentes seleccionados ({docentesSeleccionados.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {docentesSeleccionados.map(docenteId => {
                        const docente = docentes.find(d => d.id === docenteId)
                        return (
                          <span key={docenteId} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {docente?.nombre} {docente?.apellido}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sección de Estudiantes */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              👨‍🎓 Estudiantes del Taller
            </h4>
            
            {loadingEstudiantes ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                <span className="ml-2 text-gray-600">Cargando estudiantes...</span>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                    <div className="grid grid-cols-1 gap-1">
                      {estudiantes.map((estudiante) => (
                        <label key={estudiante.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                          <input
                            type="checkbox"
                            checked={estudiantesSeleccionados.includes(estudiante.id)}
                            onChange={() => handleEstudianteToggle(estudiante.id)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {estudiante.nombre} {estudiante.apellido}
                            </div>
                            <div className="text-xs text-gray-500">
                              {estudiante.grado}° {estudiante.seccion} - DNI: {estudiante.dni}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                
                {estudiantes.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No hay estudiantes disponibles
                  </div>
                )}
                
                {estudiantesSeleccionados.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-gray-700">
                        Estudiantes seleccionados: {estudiantesSeleccionados.length}
                      </p>
                      <button
                        type="button"
                        onClick={() => setEstudiantesSeleccionados([])}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Limpiar selección
                      </button>
                    </div>
                    
                    {/* Tabla de estudiantes seleccionados */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-gray-900 mb-3">Estudiantes inscritos:</h5>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estudiante
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Grado
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                DNI
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acción
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {estudiantesSeleccionados.map(estudianteId => {
                              const estudiante = estudiantes.find(e => e.id === estudianteId)
                              if (!estudiante) return null
                              return (
                                <tr key={estudianteId} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                    {estudiante.nombre} {estudiante.apellido}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                    {estudiante.grado}° {estudiante.seccion}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                    {estudiante.dni}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                                    <button
                                      type="button"
                                      onClick={() => handleEstudianteToggle(estudianteId)}
                                      className="text-red-600 hover:text-red-800 text-xs"
                                    >
                                      Quitar
                                    </button>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              rows={4}
              placeholder="Describe las actividades, objetivos y beneficios del taller..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
            />
          </div>

          {/* Sección de Horarios */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              📅 Horarios del Taller
            </h4>
            
            {/* Días de la semana */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Días de clases
              </label>
              <div className="grid grid-cols-7 gap-2">
                {diasSemana.map((dia) => (
                  <div key={dia.id} className="text-center">
                    <label className="inline-flex flex-col items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={diasSeleccionados.includes(dia.id)}
                        onChange={() => handleDiaToggle(dia.id)}
                        className="sr-only"
                      />
                      <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-all ${
                        diasSeleccionados.includes(dia.id)
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-indigo-300'
                      }`}>
                        {dia.abrev}
                      </div>
                      <span className="text-xs text-gray-600 mt-1">{dia.nombre}</span>
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Selecciona los días en que se realizará el taller
              </p>
            </div>

            {/* Horarios */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora de inicio
                </label>
                <input
                  type="time"
                  name="horaInicio"
                  value={horarioData.horaInicio}
                  onChange={handleHorarioChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora de fin
                </label>
                <input
                  type="time"
                  name="horaFin"
                  value={horarioData.horaFin}
                  onChange={handleHorarioChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lugar/Aula
                </label>
                <input
                  type="text"
                  name="lugar"
                  value={horarioData.lugar}
                  onChange={handleHorarioChange}
                  placeholder="Ej: Aula 101, Laboratorio, Cancha"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>

            {/* Vista previa de horarios */}
            {diasSeleccionados.length > 0 && horarioData.horaInicio && horarioData.horaFin && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-700 mb-2">Vista previa de horarios:</p>
                <div className="flex flex-wrap gap-2">
                  {diasSeleccionados.map(diaId => {
                    const dia = diasSemana.find(d => d.id === diaId)
                    return (
                      <span key={diaId} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {dia?.nombre}: {horarioData.horaInicio} - {horarioData.horaFin}
                        {horarioData.lugar && ` (${horarioData.lugar})`}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Información adicional */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-800">
                  Información sobre talleres
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Los talleres son actividades extracurriculares que complementan la formación académica de los estudiantes. 
                  Puedes asignar múltiples docentes y estudiantes. Los horarios son opcionales.
                </p>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.nombre.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear Taller'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
