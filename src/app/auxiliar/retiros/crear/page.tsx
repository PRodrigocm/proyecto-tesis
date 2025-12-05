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
        // Mostrar todos los estudiantes, no solo los presentes
        setEstudiantes(data.estudiantes || [])
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-orange-200 rounded-full animate-spin border-t-orange-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Cargando formulario...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header mejorado */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/auxiliar/retiros"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              Crear Nuevo Retiro
            </h1>
            <p className="mt-1 text-gray-500">
              Registrar solicitud de retiro de estudiante
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información del Estudiante */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Información del Estudiante
            </h3>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔍 Buscar Estudiante
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchEstudiante}
                    onChange={(e) => setSearchEstudiante(e.target.value)}
                    placeholder="Escriba nombre, DNI o grado para filtrar..."
                    className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 bg-gray-50 transition-all"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  👤 Seleccionar Estudiante <span className="text-red-500">*</span>
                </label>
                <select
                  name="estudianteId"
                  value={formData.estudianteId}
                  onChange={(e) => handleEstudianteChange(e.target.value)}
                  required
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 bg-white transition-all appearance-none cursor-pointer"
                >
                  <option value="">-- Seleccionar estudiante --</option>
                  {filteredEstudiantes.map((estudiante) => (
                    <option key={estudiante.id} value={estudiante.id}>
                      {estudiante.apellido}, {estudiante.nombre} - {estudiante.grado}° {estudiante.seccion} (DNI: {estudiante.dni})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {filteredEstudiantes.length} estudiantes encontrados
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Detalles del Retiro */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <ClockIcon className="h-5 w-5" />
              Detalles del Retiro
            </h3>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📋 Tipo de Retiro <span className="text-red-500">*</span>
                </label>
                <select
                  name="tipoRetiroId"
                  value={formData.tipoRetiroId}
                  onChange={handleInputChange}
                  required
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 bg-white transition-all appearance-none cursor-pointer"
                >
                  <option value="">-- Seleccionar tipo --</option>
                  {tiposRetiro.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 Fecha del Retiro <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="fechaRetiro"
                  value={formData.fechaRetiro}
                  onChange={handleInputChange}
                  required
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🕐 Hora del Retiro <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="horaRetiro"
                  value={formData.horaRetiro}
                  onChange={handleInputChange}
                  required
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 bg-white transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  👨‍👩‍👧 Apoderado que Retira
                </label>
                <select
                  name="apoderadoQueRetiraId"
                  value={formData.apoderadoQueRetiraId}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 bg-white transition-all appearance-none cursor-pointer"
                >
                  <option value="">-- Seleccionar apoderado (opcional) --</option>
                  {apoderados.map((apoderado) => (
                    <option key={apoderado.id} value={apoderado.id}>
                      {apoderado.nombre} {apoderado.apellido} - {apoderado.relacion} (DNI: {apoderado.dni})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Se carga automáticamente al seleccionar estudiante
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Motivo y Observaciones */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5" />
              Motivo y Observaciones
            </h3>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📝 Motivo del Retiro <span className="text-red-500">*</span>
              </label>
              <textarea
                name="motivo"
                value={formData.motivo}
                onChange={handleInputChange}
                required
                rows={3}
                placeholder="Describa el motivo del retiro..."
                className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 bg-white transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💬 Observaciones Adicionales
              </label>
              <textarea
                name="observaciones"
                value={formData.observaciones}
                onChange={handleInputChange}
                rows={2}
                placeholder="Observaciones adicionales (opcional)..."
                className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 bg-white transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Información Importante */}
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl border border-amber-200 p-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div>
              <h4 className="text-base font-semibold text-amber-800 mb-3">Información Importante</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">⏳</span>
                  <p className="text-sm text-amber-700">El retiro se creará en estado PENDIENTE</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">✅</span>
                  <p className="text-sm text-amber-700">Requiere autorización del administrativo</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">📧</span>
                  <p className="text-sm text-amber-700">Se notificará al apoderado por correo</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">🔐</span>
                  <p className="text-sm text-amber-700">Verifique que el apoderado esté autorizado</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
          <Link
            href="/auxiliar/retiros"
            className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-200 text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Creando retiro...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Crear Retiro
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
