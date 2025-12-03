import { useState, useEffect } from 'react'
import { Retiro } from '@/hooks/useRetiros'

interface EditRetiroModalProps {
  isOpen: boolean
  onClose: () => void
  retiro: Retiro | null
  onSave: (retiroId: string, data: any) => Promise<boolean>
}

export default function EditRetiroModal({ isOpen, onClose, retiro, onSave }: EditRetiroModalProps) {
  const [formData, setFormData] = useState({
    idEstadoRetiro: '',
    observaciones: ''
  })
  const [estadosRetiro, setEstadosRetiro] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (retiro && isOpen) {
      setFormData({
        idEstadoRetiro: retiro.idEstadoRetiro?.toString() || '',
        observaciones: retiro.observaciones || ''
      })
    }
  }, [retiro, isOpen])

  // Cargar estados de retiro
  useEffect(() => {
    if (isOpen) {
      loadEstadosRetiro()
    }
  }, [isOpen])

  const loadEstadosRetiro = async () => {
    // Solo mostrar los 3 estados válidos: Pendiente, Autorizado, Rechazado
    const estadosValidos = [
      { idEstadoRetiro: 1, codigo: 'PENDIENTE', nombre: 'Pendiente' },
      { idEstadoRetiro: 2, codigo: 'AUTORIZADO', nombre: 'Autorizado' },
      { idEstadoRetiro: 3, codigo: 'RECHAZADO', nombre: 'Rechazado' }
    ]
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/estados-retiro', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        // Filtrar solo los estados válidos
        const estadosFiltrados = (data.estados || []).filter((e: any) => 
          ['PENDIENTE', 'AUTORIZADO', 'RECHAZADO'].includes(e.codigo)
        )
        setEstadosRetiro(estadosFiltrados.length > 0 ? estadosFiltrados : estadosValidos)
      } else {
        setEstadosRetiro(estadosValidos)
      }
    } catch (error) {
      console.error('Error loading estados retiro:', error)
      setEstadosRetiro(estadosValidos)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!retiro) return

    setLoading(true)
    try {
      console.log('Enviando datos del retiro:', formData)
      const success = await onSave(retiro.id, formData)
      if (success) {
        console.log('Retiro actualizado exitosamente')
        onClose()
      } else {
        console.error('Error: onSave retornó false')
      }
    } catch (error) {
      console.error('Error al actualizar retiro:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'AUTORIZADO':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'RECHAZADO':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return '⏳'
      case 'AUTORIZADO':
        return '✅'
      case 'RECHAZADO':
        return '❌'
      default:
        return '📋'
    }
  }

  if (!isOpen || !retiro) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            ✏️ Editar Retiro
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

        {/* Información del estudiante (solo lectura) */}
        <div className="mb-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
            👤 Información del Estudiante
          </h4>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3">
              {retiro.estudiante.nombre.charAt(0)}{retiro.estudiante.apellido.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {retiro.estudiante.nombre} {retiro.estudiante.apellido}
              </p>
              <p className="text-sm text-gray-600">
                DNI: {retiro.estudiante.dni} | {retiro.estudiante.grado}° {retiro.estudiante.seccion}
              </p>
            </div>
            <div className="ml-auto">
              <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-semibold border ${getEstadoColor(retiro.estado)}`}>
                <span className="mr-2">{getEstadoIcon(retiro.estado)}</span>
                {retiro.estado}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Estado del Retiro */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cambiar Estado del Retiro *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {estadosRetiro.map((estado) => (
                <button
                  key={estado.idEstadoRetiro}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, idEstadoRetiro: estado.idEstadoRetiro.toString() }))}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.idEstadoRetiro === estado.idEstadoRetiro.toString()
                      ? estado.codigo === 'PENDIENTE'
                        ? 'border-yellow-500 bg-yellow-50 ring-2 ring-yellow-200'
                        : estado.codigo === 'AUTORIZADO'
                        ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                        : 'border-red-500 bg-red-50 ring-2 ring-red-200'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="text-2xl mb-1">{getEstadoIcon(estado.codigo)}</div>
                  <div className={`font-medium ${
                    formData.idEstadoRetiro === estado.idEstadoRetiro.toString()
                      ? estado.codigo === 'PENDIENTE'
                        ? 'text-yellow-700'
                        : estado.codigo === 'AUTORIZADO'
                        ? 'text-green-700'
                        : 'text-red-700'
                      : 'text-gray-700'
                  }`}>
                    {estado.nombre}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones (opcional)
            </label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleInputChange}
              rows={3}
              placeholder="Agregar observación sobre el cambio de estado..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
            />
          </div>

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
              disabled={loading || !formData.idEstadoRetiro}
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
