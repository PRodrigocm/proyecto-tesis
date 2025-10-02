'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  UserIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface Estudiante {
  id: string
  nombre: string
  apellido: string
  dni: string
  grado: string
  seccion: string
  codigoQR: string
}

interface TipoRetiro {
  id: string
  nombre: string
  descripcion?: string
}

interface Apoderado {
  id: string
  nombre: string
  apellido: string
  dni: string
  relacion: string
}

export default function CrearRetiro() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [tiposRetiro, setTiposRetiro] = useState<TipoRetiro[]>([])
  const [apoderados, setApoderados] = useState<Apoderado[]>([])
  const [selectedEstudiante, setSelectedEstudiante] = useState('')
  const [searchEstudiante, setSearchEstudiante] = useState('')
  const [formData, setFormData] = useState({
    estudianteId: '',
    tipoRetiroId: '',
    fechaRetiro: new Date().toISOString().split('T')[0],
    horaRetiro: new Date().toTimeString().slice(0, 5),
    motivo: '',
    apoderadoQueRetiraId: '',
    observaciones: ''
  })

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token')
      const userString = localStorage.getItem('user')
      
      if (!token || !userString) {
        router.push('/login')
        return
      }

      const user = JSON.parse(userString)
      if (!['AUXILIAR', 'ADMINISTRATIVO'].includes(user.rol)) {
        router.push('/login')
        return
      }

      loadData()
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const loadData = async () => {
    await Promise.all([
      loadEstudiantes(),
      loadTiposRetiro()
    ])
  }

  const loadEstudiantes = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auxiliar/asistencia/estudiantes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setEstudiantes(data.estudiantes.filter((e: any) => e.estado === 'PRESENTE'))
      }
    } catch (error) {
      console.error('Error loading estudiantes:', error)
    }
  }

  const loadTiposRetiro = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/tipos-retiro', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTiposRetiro(data.data || [])
      }
    } catch (error) {
      console.error('Error loading tipos retiro:', error)
    }
  }

  const loadApoderados = async (estudianteId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/estudiantes/${estudianteId}/apoderados`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setApoderados(data.apoderados || [])
      }
    } catch (error) {
      console.error('Error loading apoderados:', error)
    }
  }

  const handleEstudianteChange = (estudianteId: string) => {
    setSelectedEstudiante(estudianteId)
    setFormData(prev => ({ ...prev, estudianteId }))
    
    if (estudianteId) {
      loadApoderados(estudianteId)
    } else {
      setApoderados([])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.estudianteId || !formData.tipoRetiroId || !formData.motivo) {
      alert('Por favor complete todos los campos requeridos')
      return
    }

    setSubmitting(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auxiliar/retiros', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        alert(`✅ Retiro creado exitosamente para ${data.retiro.estudiante.nombre} ${data.retiro.estudiante.apellido}`)
        router.push('/auxiliar/retiros')
      } else {
        const error = await response.json()
        alert(`❌ Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating retiro:', error)
      alert('❌ Error al crear retiro')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredEstudiantes = estudiantes.filter(e => 
    searchEstudiante === '' ||
    e.nombre.toLowerCase().includes(searchEstudiante.toLowerCase()) ||
    e.apellido.toLowerCase().includes(searchEstudiante.toLowerCase()) ||
    e.dni.includes(searchEstudiante) ||
    `${e.grado}° ${e.seccion}`.toLowerCase().includes(searchEstudiante.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-black">Cargando formulario...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Crear Nuevo Retiro
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Registrar solicitud de retiro de estudiante
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Información del Estudiante */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                <UserIcon className="h-5 w-5 inline mr-2" />
                Información del Estudiante
              </h3>
              
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buscar Estudiante *
                  </label>
                  <input
                    type="text"
                    value={searchEstudiante}
                    onChange={(e) => setSearchEstudiante(e.target.value)}
                    placeholder="Buscar por nombre, DNI o grado..."
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 mb-2"
                  />
                  
                  <select
                    name="estudianteId"
                    value={formData.estudianteId}
                    onChange={(e) => handleEstudianteChange(e.target.value)}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar estudiante...</option>
                    {filteredEstudiantes.map((estudiante) => (
                      <option key={estudiante.id} value={estudiante.id}>
                        {estudiante.apellido}, {estudiante.nombre} - {estudiante.grado}° {estudiante.seccion} (DNI: {estudiante.dni})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Solo se muestran estudiantes presentes en la IE
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Detalles del Retiro */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                <ClockIcon className="h-5 w-5 inline mr-2" />
                Detalles del Retiro
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Retiro *
                  </label>
                  <select
                    name="tipoRetiroId"
                    value={formData.tipoRetiroId}
                    onChange={handleInputChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar tipo...</option>
                    {tiposRetiro.map((tipo) => (
                      <option key={tipo.id} value={tipo.id}>
                        {tipo.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha del Retiro *
                  </label>
                  <input
                    type="date"
                    name="fechaRetiro"
                    value={formData.fechaRetiro}
                    onChange={handleInputChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora del Retiro *
                  </label>
                  <input
                    type="time"
                    name="horaRetiro"
                    value={formData.horaRetiro}
                    onChange={handleInputChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apoderado que Retira
                  </label>
                  <select
                    name="apoderadoQueRetiraId"
                    value={formData.apoderadoQueRetiraId}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar apoderado...</option>
                    {apoderados.map((apoderado) => (
                      <option key={apoderado.id} value={apoderado.id}>
                        {apoderado.nombre} {apoderado.apellido} - {apoderado.relacion} (DNI: {apoderado.dni})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Opcional - Se carga automáticamente al seleccionar estudiante
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Motivo y Observaciones */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                <DocumentTextIcon className="h-5 w-5 inline mr-2" />
                Motivo y Observaciones
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo del Retiro *
                  </label>
                  <textarea
                    name="motivo"
                    value={formData.motivo}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    placeholder="Describa el motivo del retiro..."
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observaciones Adicionales
                  </label>
                  <textarea
                    name="observaciones"
                    value={formData.observaciones}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="Observaciones adicionales (opcional)..."
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Información Importante */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Información Importante</h4>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>El retiro se creará en estado PENDIENTE</li>
                    <li>Requiere autorización antes de ser completado</li>
                    <li>Solo estudiantes presentes pueden ser retirados</li>
                    <li>Verifique que el apoderado esté autorizado para retirar al estudiante</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/auxiliar/retiros"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando...
                </>
              ) : (
                'Crear Retiro'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
