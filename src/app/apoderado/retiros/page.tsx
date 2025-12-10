'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Retiro {
  id: string
  estudiante: {
    id: number
    nombre: string
    apellido: string
    grado: string
    seccion: string
  }
  fecha: string
  hora: string
  motivo: string
  tipoRetiro: string
  observaciones: string
  estado: 'PENDIENTE' | 'AUTORIZADO' | 'RECHAZADO' | 'COMPLETADO'
  origen: string
  personaRecoge?: string
  dniPersonaRecoge?: string
  creadoEn: string
}

interface Estudiante {
  id: string
  nombre: string
  apellido: string
  grado: string
  seccion: string
}

interface TipoRetiro {
  id: string
  nombre: string
}

export default function RetirosApoderadoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [retiros, setRetiros] = useState<Retiro[]>([])
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [tiposRetiro, setTiposRetiro] = useState<TipoRetiro[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    estudianteId: '',
    fecha: '',
    hora: '',
    motivo: '',
    observaciones: '',
    tipoRetiro: ''
  })

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token')
        const userString = localStorage.getItem('user')
        
        if (!token) {
          router.push('/login')
          return false
        }

        if (userString) {
          const user = JSON.parse(userString)
          if (user.rol !== 'APODERADO') {
            router.push('/login')
            return false
          }
        } else {
          router.push('/login')
          return false
        }
        
        return true
      } catch (error) {
        console.error('Error al verificar autenticación:', error)
        router.push('/login')
        return false
      }
    }

    if (checkAuth()) {
      cargarRetiros()
      cargarEstudiantes()
      cargarTiposRetiro()
    }
  }, [router])

  const cargarRetiros = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/apoderados/retiros', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setRetiros(data.retiros || [])
      } else {
        console.error('Error al cargar retiros')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const cargarEstudiantes = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/apoderados/estudiantes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setEstudiantes(data.estudiantes || [])
      }
    } catch (error) {
      console.error('Error cargando estudiantes:', error)
    }
  }

  const cargarTiposRetiro = async () => {
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
        // Establecer el primer tipo como valor por defecto si hay tipos disponibles
        if (data.data && data.data.length > 0) {
          setFormData(prev => ({ ...prev, tipoRetiro: data.data[0].nombre }))
        }
      }
    } catch (error) {
      console.error('Error cargando tipos de retiro:', error)
    }
  }

  const abrirModal = () => {
    const now = new Date()
    setFormData({
      estudianteId: '',
      fecha: now.toISOString().split('T')[0],
      hora: now.toTimeString().slice(0, 5),
      motivo: '',
      observaciones: '',
      tipoRetiro: tiposRetiro.length > 0 ? tiposRetiro[0].nombre : ''
    })
    setModalAbierto(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.estudianteId || !formData.fecha || !formData.hora || !formData.motivo) {
      alert('Por favor complete todos los campos requeridos')
      return
    }

    setSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/apoderados/retiros', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert('Solicitud de retiro enviada exitosamente')
        setModalAbierto(false)
        cargarRetiros()
      } else {
        const error = await response.json()
        alert(error.error || 'Error al enviar la solicitud')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al enviar la solicitud')
    } finally {
      setSubmitting(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    const estilos: Record<string, string> = {
      'PENDIENTE': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'AUTORIZADO': 'bg-green-100 text-green-800 border-green-300',
      'RECHAZADO': 'bg-red-100 text-red-800 border-red-300',
      'COMPLETADO': 'bg-blue-100 text-blue-800 border-blue-300'
    }
    const iconos: Record<string, string> = {
      'PENDIENTE': '⏳',
      'AUTORIZADO': '✅',
      'RECHAZADO': '❌',
      'COMPLETADO': '✔️'
    }
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${estilos[estado] || 'bg-gray-100 text-gray-800'}`}>
        {iconos[estado]} {estado}
      </span>
    )
  }

  const getOrigenLabel = (origen: string) => {
    const origenes: Record<string, string> = {
      'AULA': '🏫 Desde Aula',
      'APODERADO': '👤 Solicitado por Apoderado',
      'PANEL_ADMINISTRATIVO': '🏢 Administración',
      'SOLICITUD_APODERADO': '👤 Solicitado por Apoderado'
    }
    return origenes[origen] || origen
  }

  const retirosFiltrados = filtroEstado === 'todos' 
    ? retiros 
    : retiros.filter(r => r.estado === filtroEstado)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-700">Cargando retiros...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              🚪 Retiros
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Gestiona los retiros de tus hijos
            </p>
          </div>
          <button
            onClick={abrirModal}
            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Solicitar Retiro
          </button>
        </div>

        {/* Filtros mejorados */}
        <div className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-2 inline-flex flex-wrap gap-2">
          <button
            onClick={() => setFiltroEstado('todos')}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              filtroEstado === 'todos' 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/30' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📊 Todos
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              filtroEstado === 'todos' ? 'bg-white/20' : 'bg-gray-200'
            }`}>
              {retiros.length}
            </span>
          </button>
          <button
            onClick={() => setFiltroEstado('PENDIENTE')}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              filtroEstado === 'PENDIENTE' 
                ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-md shadow-yellow-500/30' 
                : 'text-gray-600 hover:bg-yellow-50'
            }`}
          >
            ⏳ Pendientes
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              filtroEstado === 'PENDIENTE' ? 'bg-white/20' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {retiros.filter(r => r.estado === 'PENDIENTE').length}
            </span>
          </button>
          <button
            onClick={() => setFiltroEstado('AUTORIZADO')}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              filtroEstado === 'AUTORIZADO' 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md shadow-green-500/30' 
                : 'text-gray-600 hover:bg-green-50'
            }`}
          >
            ✅ Autorizados
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              filtroEstado === 'AUTORIZADO' ? 'bg-white/20' : 'bg-green-100 text-green-700'
            }`}>
              {retiros.filter(r => r.estado === 'AUTORIZADO').length}
            </span>
          </button>
          <button
            onClick={() => setFiltroEstado('RECHAZADO')}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              filtroEstado === 'RECHAZADO' 
                ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-md shadow-red-500/30' 
                : 'text-gray-600 hover:bg-red-50'
            }`}
          >
            ❌ Rechazados
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              filtroEstado === 'RECHAZADO' ? 'bg-white/20' : 'bg-red-100 text-red-700'
            }`}>
              {retiros.filter(r => r.estado === 'RECHAZADO').length}
            </span>
          </button>
        </div>

        {/* Lista de retiros como tarjetas */}
        <div className="space-y-4">
          {retirosFiltrados.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📭</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay retiros</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                {filtroEstado === 'todos' 
                  ? 'Aún no se han registrado retiros para tus hijos. Puedes solicitar uno usando el botón de arriba.'
                  : `No hay retiros con estado "${filtroEstado}"`}
              </p>
            </div>
          ) : (
            retirosFiltrados.map((retiro) => (
              <div 
                key={retiro.id} 
                className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden transition-all hover:shadow-md ${
                  retiro.estado === 'PENDIENTE' ? 'border-yellow-200' :
                  retiro.estado === 'AUTORIZADO' ? 'border-green-200' :
                  retiro.estado === 'RECHAZADO' ? 'border-red-200' :
                  'border-gray-100'
                }`}
              >
                {/* Header de la tarjeta con color según estado */}
                <div className={`px-5 py-3 flex items-center justify-between ${
                  retiro.estado === 'PENDIENTE' ? 'bg-yellow-50' :
                  retiro.estado === 'AUTORIZADO' ? 'bg-green-50' :
                  retiro.estado === 'RECHAZADO' ? 'bg-red-50' :
                  'bg-gray-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                      retiro.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-700' :
                      retiro.estado === 'AUTORIZADO' ? 'bg-green-100 text-green-700' :
                      retiro.estado === 'RECHAZADO' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {retiro.estudiante.nombre.charAt(0)}{retiro.estudiante.apellido.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {retiro.estudiante.nombre} {retiro.estudiante.apellido}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {retiro.estudiante.grado}° {retiro.estudiante.seccion}
                      </p>
                    </div>
                  </div>
                  {getEstadoBadge(retiro.estado)}
                </div>

                {/* Contenido de la tarjeta */}
                <div className="p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Fecha y Hora */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">📅</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Fecha y Hora</p>
                        <p className="text-sm font-semibold text-gray-900">{retiro.fecha}</p>
                        <p className="text-sm text-gray-600">{retiro.hora}</p>
                      </div>
                    </div>

                    {/* Tipo de Retiro y Motivo */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">📋</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Motivo</p>
                        <p className="text-sm font-semibold text-gray-900 truncate" title={retiro.tipoRetiro || retiro.motivo}>
                          {retiro.tipoRetiro || retiro.motivo || 'No especificado'}
                        </p>
                        {retiro.observaciones && (
                          <p className="text-xs text-gray-500 truncate" title={retiro.observaciones}>
                            {retiro.observaciones}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Origen */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">📍</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Origen</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {getOrigenLabel(retiro.origen)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Información mejorada */}
        <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">💡</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Información importante</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">✓</span>
                  <p className="text-sm text-gray-600">Los retiros son gestionados por la administración del colegio</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">✓</span>
                  <p className="text-sm text-gray-600">Recibirás una notificación por correo cuando un retiro sea autorizado</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">✓</span>
                  <p className="text-sm text-gray-600">Si tienes dudas sobre algún retiro, contacta con el colegio</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Solicitar Retiro */}
      {modalAbierto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setModalAbierto(false)}
        >
          {/* Fondo difuminado */}
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" />
          
          {/* Contenido del Modal */}
          <div 
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal con gradiente */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-xl">🚪</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Solicitar Retiro</h2>
                    <p className="text-blue-100 text-xs">Complete los datos del retiro</p>
                  </div>
                </div>
                <button
                  onClick={() => setModalAbierto(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Estudiante */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  👤 Estudiante
                </label>
                <select
                  name="estudianteId"
                  value={formData.estudianteId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-gray-50 transition-all"
                >
                  <option value="">Seleccionar estudiante</option>
                  {estudiantes.map((est) => (
                    <option key={est.id} value={est.id}>
                      {est.nombre} {est.apellido} - {est.grado}° {est.seccion}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha y Hora */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📅 Fecha
                  </label>
                  <input
                    type="date"
                    name="fecha"
                    value={formData.fecha}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-gray-50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🕐 Hora
                  </label>
                  <input
                    type="time"
                    name="hora"
                    value={formData.hora}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-gray-50 transition-all"
                  />
                </div>
              </div>

              {/* Tipo de Retiro dinámico desde BD */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📋 Tipo de Retiro *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {tiposRetiro.map((tipo) => {
                    // Asignar iconos según el nombre del tipo
                    const getIcon = (nombre: string) => {
                      const nombreLower = nombre.toLowerCase()
                      if (nombreLower.includes('médic') || nombreLower.includes('medic') || nombreLower.includes('cita')) return '🏥'
                      if (nombreLower.includes('emergencia')) return '🚨'
                      if (nombreLower.includes('familiar')) return '👨‍👩‍👧'
                      if (nombreLower.includes('malestar')) return '🤒'
                      if (nombreLower.includes('temprano')) return '🕐'
                      if (nombreLower.includes('otro')) return '📝'
                      return '📋'
                    }
                    return (
                      <button
                        key={tipo.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, tipoRetiro: tipo.nombre }))}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          formData.tipoRetiro === tipo.nombre
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <span className="text-lg mr-2">{getIcon(tipo.nombre)}</span>
                        <span className="text-sm font-medium">{tipo.nombre}</span>
                      </button>
                    )
                  })}
                </div>
                {tiposRetiro.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">Cargando tipos de retiro...</p>
                )}
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ✏️ Motivo
                </label>
                <input
                  type="text"
                  name="motivo"
                  value={formData.motivo}
                  onChange={handleInputChange}
                  placeholder="Describe brevemente el motivo..."
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-gray-50 transition-all"
                />
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📝 Observaciones <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="Información adicional..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-gray-50 transition-all resize-none"
                />
              </div>
            </form>

            {/* Botones fijos en la parte inferior */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <span>Solicitar</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
