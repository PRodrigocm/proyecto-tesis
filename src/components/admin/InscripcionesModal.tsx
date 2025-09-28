import { useState, useEffect } from 'react'
import { Taller, EstudianteInscripcion } from '@/hooks/useTalleres'

interface InscripcionesModalProps {
  isOpen: boolean
  onClose: () => void
  taller: Taller | null
  onInscribir: (tallerId: string, estudianteId: string) => Promise<boolean>
  onDesinscribir: (tallerId: string, estudianteId: string) => Promise<boolean>
}

interface Estudiante {
  id: string
  nombre: string
  apellido: string
  dni: string
  grado: string
  seccion: string
}

interface Grado {
  idGrado: number
  nombre: string
}

interface Seccion {
  idSeccion: number
  nombre: string
}

export default function InscripcionesModal({ 
  isOpen, 
  onClose, 
  taller, 
  onInscribir, 
  onDesinscribir 
}: InscripcionesModalProps) {
  const [inscripciones, setInscripciones] = useState<EstudianteInscripcion[]>([])
  const [estudiantesDisponibles, setEstudiantesDisponibles] = useState<Estudiante[]>([])
  const [grados, setGrados] = useState<Grado[]>([])
  const [secciones, setSecciones] = useState<Seccion[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingInscripciones, setLoadingInscripciones] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [gradoSeccionFilter, setGradoSeccionFilter] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    if (isOpen && taller) {
      loadInscripciones()
      loadEstudiantesDisponibles()
      loadGrados()
      loadSecciones()
    }
  }, [isOpen, taller])

  const loadInscripciones = async () => {
    if (!taller) return
    
    setLoadingInscripciones(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/talleres/${taller.id}/inscripciones`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setInscripciones(data.data || [])
      }
    } catch (error) {
      console.error('Error loading inscripciones:', error)
    } finally {
      setLoadingInscripciones(false)
    }
  }

  const loadEstudiantesDisponibles = async () => {
    try {
      console.log('🔄 Cargando estudiantes disponibles...')
      const token = localStorage.getItem('token')
      
      // Obtener ieId del localStorage o usar un valor por defecto
      const userInfo = localStorage.getItem('userInfo')
      let ieId = '1' // Default
      
      if (userInfo) {
        try {
          const parsed = JSON.parse(userInfo)
          ieId = parsed.ieId?.toString() || '1'
          console.log('✅ ieId obtenido de userInfo:', ieId)
        } catch (error) {
          console.log('⚠️ Error parsing userInfo, usando ieId por defecto:', ieId)
        }
      } else {
        console.log('⚠️ No userInfo encontrado, usando ieId por defecto:', ieId)
      }

      const response = await fetch(`/api/estudiantes?ieId=${ieId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('📡 Response status estudiantes:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Datos de estudiantes recibidos:', data)
        console.log('📊 Cantidad de estudiantes:', data.data?.length || 0)
        
        if (data.data && data.data.length > 0) {
          console.log('🔍 Primer estudiante ejemplo:', data.data[0])
        }
        
        setEstudiantesDisponibles(data.data || [])
      } else {
        console.error('❌ Error response estudiantes:', response.status)
        const errorText = await response.text()
        console.error('❌ Error text:', errorText)
      }
    } catch (error) {
      console.error('💥 Error loading estudiantes:', error)
    }
  }

  const loadGrados = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/grados', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setGrados(data.data || [])
      }
    } catch (error) {
      console.error('Error loading grados:', error)
    }
  }

  const loadSecciones = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/secciones', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSecciones(data.data || [])
      }
    } catch (error) {
      console.error('Error loading secciones:', error)
    }
  }

  const handleInscribir = async (estudianteId: string) => {
    if (!taller) return

    setLoading(true)
    try {
      const success = await onInscribir(taller.id, estudianteId)
      if (success) {
        await loadInscripciones()
        setShowAddForm(false)
        setSearchTerm('')
      }
    } catch (error) {
      console.error('Error inscribiendo estudiante:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDesinscribir = async (estudianteId: string, nombreEstudiante: string) => {
    if (!taller) return

    if (confirm(`¿Estás seguro de que quieres desinscribir a ${nombreEstudiante} del taller "${taller.nombre}"?`)) {
      setLoading(true)
      try {
        const success = await onDesinscribir(taller.id, estudianteId)
        if (success) {
          await loadInscripciones()
        }
      } catch (error) {
        console.error('Error desinscribiendo estudiante:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  const estudiantesNoInscritos = estudiantesDisponibles.filter(estudiante => 
    !inscripciones.some(inscripcion => inscripcion.id === estudiante.id)
  )

  const filteredEstudiantes = estudiantesNoInscritos.filter(estudiante => {
    const matchesSearch = !searchTerm || 
      estudiante.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      estudiante.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      estudiante.dni.includes(searchTerm)
    
    const matchesGradoSeccion = !gradoSeccionFilter || 
      `${estudiante.grado}-${estudiante.seccion}` === gradoSeccionFilter

    return matchesSearch && matchesGradoSeccion
  })

  // Crear opciones de grado-sección combinadas
  const gradoSeccionOpciones = estudiantesDisponibles
    .filter(estudiante => estudiante.grado && estudiante.seccion) // Filtrar estudiantes con grado y sección válidos
    .reduce((opciones, estudiante) => {
      const key = `${estudiante.grado}-${estudiante.seccion}`
      const display = `${estudiante.grado}° ${estudiante.seccion}`
      
      if (!opciones.some(opcion => opcion.value === key)) {
        opciones.push({ value: key, display })
      }
      return opciones
    }, [] as { value: string; display: string }[])
    .sort((a, b) => {
      // Ordenar por grado primero, luego por sección
      const [gradoA, seccionA] = a.value.split('-')
      const [gradoB, seccionB] = b.value.split('-')
      
      if (gradoA !== gradoB) {
        return parseInt(gradoA) - parseInt(gradoB)
      }
      return seccionA.localeCompare(seccionB)
    })

  console.log('🔍 Debug - Estudiantes disponibles:', estudiantesDisponibles.length)
  console.log('🔍 Debug - Opciones grado-sección:', gradoSeccionOpciones)

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES')
  }

  if (!isOpen || !taller) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              👥 Gestionar Inscripciones
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Taller: {taller.nombre} | Inscripciones: {inscripciones.length}
              {taller.capacidadMaxima && ` / ${taller.capacidadMaxima}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="sr-only">Cerrar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de Inscritos */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h4 className="text-lg font-medium text-gray-900">
                📋 Estudiantes Inscritos ({inscripciones.length})
              </h4>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {loadingInscripciones ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : inscripciones.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-gray-500 mt-2">No hay estudiantes inscritos</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {inscripciones.map((inscripcion) => (
                    <div key={inscripcion.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                            {inscripcion.nombre.charAt(0)}{inscripcion.apellido.charAt(0)}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {inscripcion.nombre} {inscripcion.apellido}
                            </p>
                            <p className="text-sm text-gray-500">
                              DNI: {inscripcion.dni} | {inscripcion.grado}° {inscripcion.seccion}
                            </p>
                            <p className="text-xs text-gray-400">
                              Inscrito: {formatFecha(inscripcion.fechaInscripcion)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDesinscribir(inscripcion.id, `${inscripcion.nombre} ${inscripcion.apellido}`)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50"
                          title="Desinscribir estudiante"
                        >
                          🗑️ Desinscribir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Agregar Estudiantes */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-gray-900">
                  ➕ Agregar Estudiantes
                </h4>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                >
                  {showAddForm ? 'Ocultar' : 'Mostrar'} formulario
                </button>
              </div>
            </div>

            {showAddForm && (
              <div className="p-4 border-b border-gray-200 bg-blue-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Buscar Estudiante
                    </label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Nombre, apellido o DNI..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Filtrar por Grado y Sección
                    </label>
                    <select
                      value={gradoSeccionFilter}
                      onChange={(e) => setGradoSeccionFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    >
                      <option value="">Todos los grados y secciones</option>
                      {gradoSeccionOpciones.length > 0 ? (
                        gradoSeccionOpciones.map((opcion) => (
                          <option key={opcion.value} value={opcion.value}>
                            {opcion.display}
                          </option>
                        ))
                      ) : (
                        <option disabled>
                          {estudiantesDisponibles.length === 0 
                            ? 'Cargando grados y secciones...' 
                            : 'No hay grados y secciones disponibles'
                          }
                        </option>
                      )}
                    </select>
                  </div>
                </div>
                
                {/* Botón para limpiar filtros */}
                {(searchTerm || gradoSeccionFilter) && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setSearchTerm('')
                        setGradoSeccionFilter('')
                      }}
                      className="text-sm text-indigo-600 hover:text-indigo-900 font-medium"
                    >
                      🗑️ Limpiar filtros
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <div className="max-h-96 overflow-y-auto">
              {showAddForm ? (
                filteredEstudiantes.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      {estudiantesNoInscritos.length === 0 
                        ? 'Todos los estudiantes ya están inscritos'
                        : 'No se encontraron estudiantes con los filtros aplicados'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredEstudiantes.map((estudiante) => (
                      <div key={estudiante.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                              {estudiante.nombre.charAt(0)}{estudiante.apellido.charAt(0)}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {estudiante.nombre} {estudiante.apellido}
                              </p>
                              <p className="text-sm text-gray-500">
                                DNI: {estudiante.dni} | {estudiante.grado}° {estudiante.seccion}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleInscribir(estudiante.id)}
                            disabled={loading}
                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium disabled:opacity-50"
                            title="Inscribir estudiante"
                          >
                            ➕ Inscribir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Haz clic en "Mostrar formulario" para agregar estudiantes
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Información adicional */}
        {taller.capacidadMaxima && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-800">
                  Capacidad del taller
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Capacidad máxima: {taller.capacidadMaxima} estudiantes. 
                  Actualmente hay {inscripciones.length} inscritos.
                  {inscripciones.length >= taller.capacidadMaxima && 
                    ' El taller ha alcanzado su capacidad máxima.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
