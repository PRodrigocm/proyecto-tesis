'use client'

import { useState, useEffect } from 'react'
// import { XMarkIcon } from '@heroicons/react/24/outline'

interface CreateDocenteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateDocenteModal({ isOpen, onClose, onSuccess }: CreateDocenteModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    dni: '',
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    especialidad: '',
    grado: '',
    seccion: '',
    tipoAsignacion: '',
    password: '',
    esDocenteTaller: false
  })
  
  const [grados, setGrados] = useState<any[]>([])
  const [secciones, setSecciones] = useState<any[]>([])
  const [tiposAsignacion, setTiposAsignacion] = useState<any[]>([])
  const [loadingGrados, setLoadingGrados] = useState(false)
  const [loadingSecciones, setLoadingSecciones] = useState(false)
  const [loadingTipos, setLoadingTipos] = useState(false)

  // Cargar grados y tipos de asignación cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadGrados()
      loadTiposAsignacion()
    }
  }, [isOpen])

  // Función para cargar grados
  const loadGrados = async () => {
    setLoadingGrados(true)
    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) return

      const user = JSON.parse(userStr)
      const ieId = user.idIe || user.institucionId || 1
      const token = localStorage.getItem('token')

      const response = await fetch(`/api/grados?ieId=${ieId}`, {
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
    } finally {
      setLoadingGrados(false)
    }
  }

  // Función para cargar secciones cuando se selecciona un grado
  const loadSecciones = async (gradoId: string) => {
    if (!gradoId) {
      setSecciones([])
      return
    }

    setLoadingSecciones(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/secciones?gradoId=${gradoId}`, {
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
    } finally {
      setLoadingSecciones(false)
    }
  }

  // Función para cargar tipos de asignación
  const loadTiposAsignacion = async () => {
    setLoadingTipos(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/tipos-asignacion', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTiposAsignacion(data.data || [])
      }
    } catch (error) {
      console.error('Error loading tipos de asignación:', error)
    } finally {
      setLoadingTipos(false)
    }
  }

  // Manejar cambio de grado
  const handleGradoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const gradoId = e.target.value
    setFormData({
      ...formData,
      grado: gradoId,
      seccion: '' // Reset sección cuando cambia el grado
    })
    loadSecciones(gradoId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        alert('Error: No se encontró información del usuario')
        return
      }

      const token = localStorage.getItem('token')
      
      console.log('Datos del formulario:', formData)
      console.log('Token:', token)

      const response = await fetch('/api/docentes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          userInfo: userStr // Enviar información del usuario para obtener ieId
        })
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (response.ok) {
        const result = await response.json()
        console.log('Resultado exitoso:', result)
        alert('Docente creado exitosamente')
        onSuccess()
        onClose()
        setFormData({
          dni: '',
          nombre: '',
          apellido: '',
          email: '',
          telefono: '',
          especialidad: '',
          grado: '',
          seccion: '',
          tipoAsignacion: '',
          password: '',
          esDocenteTaller: false
        })
      } else {
        const error = await response.json()
        console.log('Error de la API:', error)
        alert(`Error: ${error.message || 'No se pudo crear el docente'}`)
      }
    } catch (error) {
      console.error('Error creating docente:', error)
      alert('Error al crear el docente')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
    
    // Si se marca como docente de taller, limpiar grado y sección
    if (name === 'esDocenteTaller' && checked) {
      setFormData(prev => ({
        ...prev,
        [name]: checked,
        grado: '',
        seccion: ''
      }))
      setSecciones([])
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center pb-3">
          <h3 className="text-lg font-bold text-gray-900">Crear Nuevo Docente</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">DNI *</label>
              <input
                type="text"
                name="dni"
                value={formData.dni}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-4 py-3 text-black bg-white border-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                placeholder="12345678"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-4 py-3 text-black bg-white border-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Nombre *</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-4 py-3 text-black bg-white border-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Apellido *</label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-4 py-3 text-black bg-white border-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Teléfono</label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 text-black bg-white border-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Checkbox Docente de Taller */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <input
                  type="checkbox"
                  id="esDocenteTaller"
                  name="esDocenteTaller"
                  checked={formData.esDocenteTaller}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="esDocenteTaller" className="text-base font-medium text-gray-800">
                  🎨 Docente de taller
                </label>
                <div className="text-sm text-gray-600">
                  Marcar si este docente se encargará de talleres extracurriculares
                </div>
              </div>
              {formData.esDocenteTaller && (
                <p className="text-sm text-blue-600 mt-2">
                  ℹ️ Los docentes de taller no requieren asignación de grado y sección específicos
                </p>
              )}
            </div>

            {/* Grado - Solo visible si NO es docente de taller */}
            {!formData.esDocenteTaller && (
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-2">Grado</label>
                <select
                  name="grado"
                  value={formData.grado}
                  onChange={handleGradoChange}
                  className="mt-1 block w-full px-4 py-3 text-black bg-white border-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                  disabled={loadingGrados}
                >
                  <option value="">Seleccionar grado...</option>
                  {grados.map((grado) => (
                    <option key={grado.idGrado} value={grado.idGrado}>
                      {grado.nombre}
                    </option>
                  ))}
                </select>
                {loadingGrados && (
                  <p className="text-sm text-gray-500 mt-1">Cargando grados...</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Opcional: Grado al que será asignado el docente
                </p>
              </div>
            )}

            {/* Sección - Solo visible si NO es docente de taller */}
            {!formData.esDocenteTaller && (
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-2">Sección</label>
                <select
                  name="seccion"
                  value={formData.seccion}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 text-black bg-white border-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                  disabled={loadingSecciones || !formData.grado}
                >
                  <option value="">Seleccionar sección...</option>
                  {secciones.map((seccion) => (
                    <option key={seccion.idSeccion} value={seccion.idSeccion}>
                      {seccion.nombre}
                    </option>
                  ))}
                </select>
                {loadingSecciones && (
                  <p className="text-sm text-gray-500 mt-1">Cargando secciones...</p>
                )}
                {!formData.grado && (
                  <p className="text-sm text-gray-500 mt-1">Primero selecciona un grado</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Opcional: Sección específica del grado seleccionado
                </p>
              </div>
            )}

            {/* Tipo de Asignación - Solo visible si NO es docente de taller */}
            {!formData.esDocenteTaller && (
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-2">Tipo de Asignación</label>
                <select
                  name="tipoAsignacion"
                  value={formData.tipoAsignacion}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 text-black bg-white border-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                  disabled={loadingTipos}
                >
                  <option value="">Seleccionar tipo...</option>
                  {tiposAsignacion.map((tipo) => (
                    <option key={tipo.idTipoAsignacion} value={tipo.idTipoAsignacion}>
                      {tipo.nombre}
                    </option>
                  ))}
                </select>
                {loadingTipos && (
                  <p className="text-sm text-gray-500 mt-1">Cargando tipos de asignación...</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Opcional: Define el rol del docente (Tutor, Profesor de materia, etc.)
                </p>
              </div>
            )}

            <div className={formData.esDocenteTaller ? 'md:col-span-2' : ''}>
              <label className="block text-base font-semibold text-gray-800 mb-2">Especialidad *</label>
              <input
                type="text"
                name="especialidad"
                value={formData.especialidad}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-4 py-3 text-black bg-white border-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                placeholder={formData.esDocenteTaller ? "Robótica, Arte, Música, Deportes, etc." : "Matemáticas, Comunicación, etc."}
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.esDocenteTaller 
                  ? "Especialidad o área del taller que impartirá" 
                  : "Materia o área de especialización académica"
                }
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-base font-semibold text-gray-800 mb-2">Contraseña *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-4 py-3 text-black bg-white border-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear Docente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
