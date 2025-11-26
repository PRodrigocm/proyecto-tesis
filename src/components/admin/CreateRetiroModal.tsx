'use client'

import { useState, useEffect } from 'react'

interface Estudiante {
  id: string
  nombre: string
  apellido: string
  dni: string
  grado: string
  seccion: string
}

interface Apoderado {
  id: string
  nombre: string
  apellido: string
  dni: string
  telefono?: string
  relacion: string
  esTitular: boolean
}

interface CreateRetiroModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    estudianteId: string
    idGradoSeccion?: string
    motivo: string
    horaRetiro: string
    observaciones?: string
    personaRecoge?: string
    dniPersonaRecoge?: string
    origen?: string
    medioContacto?: string
    apoderadoContactado?: string
    apoderadoQueRetira?: string
  }) => Promise<boolean>
}

export default function CreateRetiroModal({ isOpen, onClose, onSubmit }: CreateRetiroModalProps) {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [apoderados, setApoderados] = useState<Apoderado[]>([])
  const [gradosSecciones, setGradosSecciones] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingGradosSecciones, setLoadingGradosSecciones] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [gradoSeccionFilter, setGradoSeccionFilter] = useState('')
  const [selectedEstudiante, setSelectedEstudiante] = useState<Estudiante | null>(null)
  const [formData, setFormData] = useState({
    estudianteId: '',
    idGradoSeccion: '',
    motivo: '',
    horaRetiro: '',
    observaciones: '',
    personaRecoge: '',
    dniPersonaRecoge: '',
    origen: '',
    medioContacto: '',
    apoderadoContactado: '',
    apoderadoQueRetira: ''
  })

  const motivosComunes = [
    'Cita médica',
    'Emergencia familiar',
    'Viaje familiar',
    'Malestar',
    'Asuntos personales',
    'Otro'
  ]

  useEffect(() => {
    if (isOpen) {
      loadEstudiantes()
      loadGradosSecciones()
      // Establecer hora actual como default
      const now = new Date()
      const horaActual = now.toTimeString().slice(0, 5)
      setFormData(prev => ({ ...prev, horaRetiro: horaActual }))
    }
  }, [isOpen])

  const loadEstudiantes = async () => {
    try {
      const token = localStorage.getItem('token')
      const ieId = getIeId()
      const response = await fetch(`/api/estudiantes?ieId=${ieId}`, {
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
    }
  }

  const loadGradosSecciones = async () => {
    setLoadingGradosSecciones(true)
    try {
      const token = localStorage.getItem('token')
      const ieId = getIeId()
      const response = await fetch(`/api/grados-secciones?ieId=${ieId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setGradosSecciones(data.data || [])
      }
    } catch (error) {
      console.error('Error loading grados-secciones:', error)
    } finally {
      setLoadingGradosSecciones(false)
    }
  }

  // Obtener ieId del usuario
  const getIeId = () => {
    try {
      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        return user.ieId || user.idIe || user.institucionId || '1'
      }
    } catch (error) {
      console.error('Error getting ieId:', error)
    }
    return '1' // Fallback
  }

  // Cargar apoderados del estudiante seleccionado
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
        
        // Auto-seleccionar el apoderado titular si existe
        const apoderadoTitular = data.apoderados?.find((ap: Apoderado) => ap.esTitular)
        if (apoderadoTitular) {
          setFormData(prev => ({
            ...prev,
            personaRecoge: `${apoderadoTitular.nombre} ${apoderadoTitular.apellido}`,
            dniPersonaRecoge: apoderadoTitular.dni
          }))
        }
      }
    } catch (error) {
      console.error('Error loading apoderados:', error)
    }
  }

  // Obtener combinaciones de grado-sección desde la BD
  const gradoSeccionCombinaciones = gradosSecciones.map(gs => 
    `${gs.grado.nombre}° ${gs.seccion.nombre}`
  ).sort()

  const filteredEstudiantes = estudiantes.filter(estudiante => {
    const matchesSearch = searchTerm === '' || 
      `${estudiante.nombre} ${estudiante.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      estudiante.dni.includes(searchTerm)
    
    const matchesGradoSeccion = gradoSeccionFilter === '' || 
      `${estudiante.grado}° ${estudiante.seccion}` === gradoSeccionFilter
    
    return matchesSearch && matchesGradoSeccion
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.estudianteId || !formData.motivo || !formData.horaRetiro) {
      alert('Por favor completa todos los campos obligatorios')
      return
    }

    setLoading(true)
    try {
      const success = await onSubmit(formData)
      if (success) {
        resetForm()
        onClose()
        alert('Retiro creado exitosamente')
      } else {
        alert('Error al crear el retiro')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al crear el retiro')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      estudianteId: '',
      idGradoSeccion: '',
      motivo: '',
      horaRetiro: '',
      observaciones: '',
      personaRecoge: '',
      dniPersonaRecoge: '',
      origen: '',
      medioContacto: '',
      apoderadoContactado: '',
      apoderadoQueRetira: ''
    })
    setSearchTerm('')
    setGradoSeccionFilter('')
    setSelectedEstudiante(null)
    setApoderados([])
    setGradosSecciones([])
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay con blur */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
          {/* Header del modal */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Crear Nuevo Retiro</h3>
                  <p className="text-indigo-100 text-sm">Complete los datos del retiro</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Contenido del formulario */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {/* Sección: Búsqueda de estudiante */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 uppercase tracking-wide">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">1</div>
                Seleccionar Estudiante
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Grado y Sección
                  </label>
                  <select
                    value={gradoSeccionFilter}
                    onChange={(e) => setGradoSeccionFilter(e.target.value)}
                    disabled={loadingGradosSecciones}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 disabled:bg-slate-100 transition-all"
                  >
                    <option value="">
                      {loadingGradosSecciones ? 'Cargando...' : 'Todos los grados'}
                    </option>
                    {[...new Set(gradoSeccionCombinaciones)].map((combinacion, index) => (
                      <option key={`grado-seccion-${combinacion}-${index}`} value={combinacion}>{combinacion}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Buscar Estudiante <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Nombre o DNI..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 placeholder-slate-400 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de estudiantes */}
            {(searchTerm || gradoSeccionFilter) && (
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50">
                {filteredEstudiantes.map((estudiante) => (
                  <button
                    key={estudiante.id}
                    type="button"
                    onClick={() => {
                      const gradoSeccionCorrespondiente = gradosSecciones.find(gs => 
                        gs.grado.nombre === estudiante.grado && gs.seccion.nombre === estudiante.seccion
                      )
                      setFormData(prev => ({ 
                        ...prev, 
                        estudianteId: estudiante.id,
                        idGradoSeccion: gradoSeccionCorrespondiente ? gradoSeccionCorrespondiente.idGradoSeccion.toString() : ''
                      }))
                      setSelectedEstudiante(estudiante)
                      setSearchTerm(`${estudiante.nombre} ${estudiante.apellido} - ${estudiante.grado}° ${estudiante.seccion}`)
                      loadApoderados(estudiante.id)
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-slate-200 last:border-b-0 transition-colors"
                  >
                    <div className="font-medium text-slate-900">{estudiante.nombre} {estudiante.apellido}</div>
                    <div className="text-sm text-slate-500">{estudiante.grado}° {estudiante.seccion} • DNI: {estudiante.dni}</div>
                  </button>
                ))}
                {filteredEstudiantes.length === 0 && (
                  <div className="px-4 py-6 text-slate-500 text-center">
                    <svg className="w-8 h-8 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    No se encontraron estudiantes
                  </div>
                )}
              </div>
            )}

            {/* Estudiante seleccionado */}
            {selectedEstudiante && (
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg">
                    {selectedEstudiante.nombre.charAt(0)}{selectedEstudiante.apellido.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {selectedEstudiante.nombre} {selectedEstudiante.apellido}
                    </p>
                    <p className="text-sm text-slate-600">
                      {selectedEstudiante.grado}° {selectedEstudiante.seccion} • DNI: {selectedEstudiante.dni}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEstudiante(null)
                      setFormData(prev => ({ ...prev, estudianteId: '', idGradoSeccion: '' }))
                      setSearchTerm('')
                    }}
                    className="ml-auto p-1.5 rounded-lg hover:bg-indigo-100 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Sección: Detalles del retiro */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 uppercase tracking-wide">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">2</div>
                Detalles del Retiro
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Motivo del Retiro <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.motivo}
                    onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 transition-all"
                    required
                  >
                    <option value="">Seleccionar motivo</option>
                    {motivosComunes.map((motivo, index) => (
                      <option key={`motivo-${motivo}-${index}`} value={motivo}>{motivo}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Hora de Retiro <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.horaRetiro}
                    onChange={(e) => setFormData(prev => ({ ...prev, horaRetiro: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Sección: Persona que recoge */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 uppercase tracking-wide">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">3</div>
                Persona Autorizada
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Persona que Recoge <span className="text-red-500">*</span>
                  </label>
                  {apoderados.length > 0 ? (
                    <select
                      value={`${formData.personaRecoge}|${formData.dniPersonaRecoge}`}
                      onChange={(e) => {
                        const [nombre, dni] = e.target.value.split('|')
                        setFormData(prev => ({ ...prev, personaRecoge: nombre, dniPersonaRecoge: dni }))
                      }}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 transition-all"
                      required
                    >
                      <option value="">Seleccionar apoderado</option>
                      {apoderados.map((apoderado) => (
                        <option key={apoderado.id} value={`${apoderado.nombre} ${apoderado.apellido}|${apoderado.dni}`}>
                          {apoderado.nombre} {apoderado.apellido} ({apoderado.relacion})
                          {apoderado.esTitular && ' ★'}
                        </option>
                      ))}
                      <option value="otro|">Otra persona...</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData.personaRecoge}
                      onChange={(e) => setFormData(prev => ({ ...prev, personaRecoge: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 placeholder-slate-400 transition-all"
                      placeholder="Nombre completo"
                      required
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    DNI <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.dniPersonaRecoge}
                    onChange={(e) => setFormData(prev => ({ ...prev, dniPersonaRecoge: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 placeholder-slate-400 transition-all"
                    placeholder="12345678"
                    maxLength={8}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Observaciones */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Observaciones
              </label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 placeholder-slate-400 transition-all resize-none"
                placeholder="Información adicional sobre el retiro..."
              />
            </div>

            {/* Campos adicionales colapsables */}
            <details className="group">
              <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Campos adicionales (opcional)
              </summary>
              
              <div className="mt-4 space-y-4 pl-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Origen del Retiro</label>
                    <select
                      value={formData.origen}
                      onChange={(e) => setFormData(prev => ({ ...prev, origen: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 transition-all"
                    >
                      <option value="">Seleccionar origen</option>
                      <option value="ADMINISTRATIVO">Administrativo</option>
                      <option value="DOCENTE">Reportado por Docente</option>
                      <option value="APODERADO">Solicitado por Apoderado</option>
                      <option value="EMERGENCIA">Emergencia</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Medio de Contacto</label>
                    <select
                      value={formData.medioContacto}
                      onChange={(e) => setFormData(prev => ({ ...prev, medioContacto: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 transition-all"
                    >
                      <option value="">Seleccionar medio</option>
                      <option value="TELEFONO">Teléfono</option>
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="EMAIL">Email</option>
                      <option value="PRESENCIAL">Presencial</option>
                    </select>
                  </div>
                </div>
              </div>
            </details>
          </form>

          {/* Footer del modal */}
          <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-100 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="retiro-form"
              onClick={handleSubmit}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/30"
              disabled={loading || !formData.estudianteId}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creando...
                </span>
              ) : 'Crear Retiro'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
