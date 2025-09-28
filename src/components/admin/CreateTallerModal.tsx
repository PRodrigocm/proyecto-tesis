import { useState } from 'react'

interface CreateTallerModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    nombre: string
    descripcion?: string
    instructor?: string
    capacidadMaxima?: number
  }) => Promise<boolean>
}

export default function CreateTallerModal({ isOpen, onClose, onSubmit }: CreateTallerModalProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    instructor: '',
    capacidadMaxima: 20
  })
  const [loading, setLoading] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nombre.trim()) {
      alert('El nombre del taller es requerido')
      return
    }

    setLoading(true)
    try {
      const success = await onSubmit({
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || undefined,
        instructor: formData.instructor.trim() || undefined,
        capacidadMaxima: formData.capacidadMaxima || undefined
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
      instructor: '',
      capacidadMaxima: 20
    })
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Instructor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructor/Docente
              </label>
              <input
                type="text"
                name="instructor"
                value={formData.instructor}
                onChange={handleInputChange}
                placeholder="Nombre del instructor"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
              />
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
                  Una vez creado, podrás inscribir estudiantes y asignar horarios.
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
