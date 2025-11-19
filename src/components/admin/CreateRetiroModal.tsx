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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            📝 Crear Nuevo Retiro
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Cerrar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Filtros de búsqueda */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grado y Sección
              </label>
              <select
                value={gradoSeccionFilter}
                onChange={(e) => setGradoSeccionFilter(e.target.value)}
                disabled={loadingGradosSecciones}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 disabled:bg-gray-100"
              >
                <option value="">
                  {loadingGradosSecciones ? 'Cargando grados y secciones...' : 'Todos los grados y secciones'}
                </option>
                {[...new Set(gradoSeccionCombinaciones)].map((combinacion, index) => (
                  <option key={`grado-seccion-${combinacion}-${index}`} value={combinacion}>{combinacion}</option>
                ))}
              </select>
              {loadingGradosSecciones && (
                <p className="text-xs text-gray-500 mt-1">Cargando desde base de datos...</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar Estudiante *
              </label>
              <input
                type="text"
                placeholder="Buscar por nombre o DNI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>

          {/* Lista de estudiantes */}
          {(searchTerm || gradoSeccionFilter) && (
            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
              {filteredEstudiantes.map((estudiante) => (
                <button
                  key={estudiante.id}
                  type="button"
                  onClick={() => {
                    // Buscar el idGradoSeccion correspondiente al estudiante
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
                    loadApoderados(estudiante.id) // Cargar apoderados del estudiante
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900">{estudiante.nombre} {estudiante.apellido}</div>
                  <div className="text-sm text-gray-500">{estudiante.grado}° {estudiante.seccion} - DNI: {estudiante.dni}</div>
                </button>
              ))}
              {filteredEstudiantes.length === 0 && (
                <div className="px-3 py-2 text-gray-500 text-center">
                  No se encontraron estudiantes
                </div>
              )}
            </div>
          )}

          {/* Estudiante seleccionado */}
          {selectedEstudiante && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-800">
                    Estudiante seleccionado: {selectedEstudiante.nombre} {selectedEstudiante.apellido}
                  </p>
                  <p className="text-sm text-blue-600">
                    {selectedEstudiante.grado}° {selectedEstudiante.seccion} - DNI: {selectedEstudiante.dni}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Motivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo del Retiro *
              </label>
              <select
                value={formData.motivo}
                onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                required
              >
                <option value="">Seleccionar motivo</option>
                {motivosComunes.map((motivo, index) => (
                  <option key={`motivo-${motivo}-${index}`} value={motivo}>{motivo}</option>
                ))}
              </select>
            </div>

            {/* Hora de retiro */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora de Retiro *
              </label>
              <input
                type="time"
                value={formData.horaRetiro}
                onChange={(e) => setFormData(prev => ({ ...prev, horaRetiro: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                required
              />
            </div>
          </div>

          {/* Persona que recoge - Selector de apoderados */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Persona que Recoge *
              </label>
              {apoderados.length > 0 ? (
                <select
                  value={`${formData.personaRecoge}|${formData.dniPersonaRecoge}`}
                  onChange={(e) => {
                    const [nombre, dni] = e.target.value.split('|')
                    setFormData(prev => ({
                      ...prev,
                      personaRecoge: nombre,
                      dniPersonaRecoge: dni
                    }))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  required
                >
                  <option value="">Seleccionar apoderado</option>
                  {apoderados.map((apoderado) => (
                    <option 
                      key={apoderado.id} 
                      value={`${apoderado.nombre} ${apoderado.apellido}|${apoderado.dni}`}
                    >
                      {apoderado.nombre} {apoderado.apellido} ({apoderado.relacion})
                      {apoderado.esTitular && ' - TITULAR'}
                    </option>
                  ))}
                  <option value="otro|">Otra persona...</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.personaRecoge}
                  onChange={(e) => setFormData(prev => ({ ...prev, personaRecoge: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
                  placeholder="Nombre completo"
                  required
                />
              )}
            </div>

            {/* DNI de la persona */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DNI de la Persona *
              </label>
              <input
                type="text"
                value={formData.dniPersonaRecoge}
                onChange={(e) => setFormData(prev => ({ ...prev, dniPersonaRecoge: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
                placeholder="12345678"
                required
              />
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones
            </label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
              placeholder="Información adicional sobre el retiro..."
            />
          </div>

          {/* Campos adicionales del modelo Prisma */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Origen del retiro */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Origen del Retiro
              </label>
              <select
                value={formData.origen}
                onChange={(e) => setFormData(prev => ({ ...prev, origen: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
              >
                <option value="">Seleccionar origen</option>
                <option value="ADMINISTRATIVO">Administrativo</option>
                <option value="DOCENTE">Reportado por Docente</option>
                <option value="APODERADO">Solicitado por Apoderado</option>
                <option value="ESTUDIANTE">Solicitado por Estudiante</option>
                <option value="EMERGENCIA">Emergencia</option>
              </select>
            </div>

            {/* Medio de contacto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medio de Contacto
              </label>
              <select
                value={formData.medioContacto}
                onChange={(e) => setFormData(prev => ({ ...prev, medioContacto: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
              >
                <option value="">Seleccionar medio</option>
                <option value="TELEFONO">Teléfono</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="EMAIL">Email</option>
                <option value="PRESENCIAL">Presencial</option>
                <option value="MENSAJE">Mensaje de texto</option>
                <option value="NO_CONTACTADO">No contactado</option>
              </select>
            </div>
          </div>

          {/* Apoderados relacionados */}
          {apoderados.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Apoderado contactado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apoderado Contactado
                </label>
                <select
                  value={formData.apoderadoContactado}
                  onChange={(e) => setFormData(prev => ({ ...prev, apoderadoContactado: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                >
                  <option value="">No contactado</option>
                  {apoderados.map((apoderado) => (
                    <option key={apoderado.id} value={apoderado.id}>
                      {apoderado.nombre} {apoderado.apellido} ({apoderado.relacion})
                    </option>
                  ))}
                </select>
              </div>

              {/* Apoderado que retira (diferente al que recoge) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apoderado Autorizado
                </label>
                <select
                  value={formData.apoderadoQueRetira}
                  onChange={(e) => setFormData(prev => ({ ...prev, apoderadoQueRetira: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                >
                  <option value="">Seleccionar apoderado</option>
                  {apoderados.map((apoderado) => (
                    <option key={apoderado.id} value={apoderado.id}>
                      {apoderado.nombre} {apoderado.apellido} ({apoderado.relacion})
                      {apoderado.esTitular && ' - TITULAR'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              disabled={loading || !formData.estudianteId}
            >
              {loading ? 'Creando...' : 'Crear Retiro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
