import { useState, useEffect } from 'react'
import { Taller } from '@/hooks/useTalleres'

interface EditTallerModalProps {
  isOpen: boolean
  onClose: () => void
  taller: Taller | null
  onSave: (tallerId: string, data: any) => Promise<boolean>
}

export default function EditTallerModal({ isOpen, onClose, taller, onSave }: EditTallerModalProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    instructor: '',
    capacidadMaxima: 20,
    activo: true
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (taller && isOpen) {
      setFormData({
        nombre: taller.nombre || '',
        descripcion: taller.descripcion || '',
        instructor: taller.instructor || '',
        capacidadMaxima: taller.capacidadMaxima || 20,
        activo: taller.activo
      })
    }
  }, [taller, isOpen])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : 
               type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
               value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taller) return

    if (!formData.nombre.trim()) {
      alert('El nombre del taller es requerido')
      return
    }

    setLoading(true)
    try {
      const success = await onSave(taller.id, {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || undefined,
        instructor: formData.instructor.trim() || undefined,
        capacidadMaxima: formData.capacidadMaxima || undefined,
        activo: formData.activo
      })

      if (success) {
        onClose()
      }
    } catch (error) {
      console.error('Error al actualizar taller:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEstadoColor = (activo: boolean) => {
    return activo
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200'
  }

  const getEstadoIcon = (activo: boolean) => {
    return activo ? '✅' : '❌'
  }

  if (!isOpen || !taller) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            ✏️ Editar Taller
          </h3>
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

        {/* Información del taller (solo lectura) */}
        <div className="mb-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
            📚 Información del Taller
          </h4>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3">
                {taller.nombre.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {taller.nombre}
                </p>
                <p className="text-sm text-gray-600">
                  {taller.codigo && `Código: ${taller.codigo} | `}
                  Inscripciones: {taller.inscripciones}
                </p>
              </div>
            </div>
            <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-semibold border ${getEstadoColor(taller.activo)}`}>
              <span className="mr-2">{getEstadoIcon(taller.activo)}</span>
              {taller.activo ? 'Activo' : 'Inactivo'}
            </div>
          </div>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
            />
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
                Actualmente: {taller.inscripciones} estudiantes inscritos
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

          {/* Estado del Taller */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado del Taller
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="activo"
                  checked={formData.activo === true}
                  onChange={() => setFormData(prev => ({ ...prev, activo: true }))}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-900">
                  ✅ Activo (acepta inscripciones)
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="activo"
                  checked={formData.activo === false}
                  onChange={() => setFormData(prev => ({ ...prev, activo: false }))}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-900">
                  ❌ Inactivo (no acepta inscripciones)
                </span>
              </label>
            </div>
          </div>

          {/* Advertencia sobre inscripciones */}
          {taller.inscripciones > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-800">
                    Taller con inscripciones activas
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Este taller tiene {taller.inscripciones} estudiantes inscritos. 
                    {formData.capacidadMaxima < taller.inscripciones && 
                      ` Ten cuidado: la nueva capacidad (${formData.capacidadMaxima}) es menor que las inscripciones actuales.`
                    }
                    {!formData.activo && 
                      ' Al desactivarlo, no se aceptarán nuevas inscripciones.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
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
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
