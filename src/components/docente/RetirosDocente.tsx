'use client'

import { useState, useEffect } from 'react'
import { useRetiros, type Retiro } from '@/hooks/useRetiros'

// Modal para crear/editar retiro
interface RetiroModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => Promise<boolean>
  retiro?: Retiro | null
  estudiantes: Array<{
    id: string
    nombre: string
    apellido: string
    dni: string
    grado: string
    seccion: string
    apoderadoTitular?: {
      id: string
      nombre: string
      apellido: string
      dni: string
      telefono: string
      email: string
    } | null
  }>
}

function RetiroModal({ isOpen, onClose, onSave, retiro, estudiantes }: RetiroModalProps) {
  const [formData, setFormData] = useState({
    estudianteId: '',
    motivo: '',
    horaRetiro: '',
    observaciones: '',
    personaRecoge: '',
    dniPersonaRecoge: '',
    fecha: new Date().toISOString().split('T')[0] // Fecha actual por defecto
  })
  const [loading, setLoading] = useState(false)
  const [showApoderadoInfo, setShowApoderadoInfo] = useState(false)

  // Función para autocompletar datos del apoderado
  const handleEstudianteChange = (estudianteId: string) => {
    const estudiante = estudiantes.find(e => e.id === estudianteId)
    
    setFormData(prev => ({
      ...prev,
      estudianteId,
      // Autocompletar con datos del apoderado titular
      personaRecoge: estudiante?.apoderadoTitular 
        ? `${estudiante.apoderadoTitular.nombre} ${estudiante.apoderadoTitular.apellido}`
        : '',
      dniPersonaRecoge: estudiante?.apoderadoTitular?.dni || ''
    }))
    
    // Resetear la visibilidad de la información del apoderado
    setShowApoderadoInfo(false)
  }

  useEffect(() => {
    if (retiro) {
      setFormData({
        estudianteId: retiro.estudiante.id,
        motivo: retiro.motivo,
        horaRetiro: retiro.horaRetiro,
        observaciones: retiro.observaciones || '',
        personaRecoge: retiro.personaRecoge || '',
        dniPersonaRecoge: retiro.dniPersonaRecoge || '',
        fecha: retiro.fecha.split('T')[0] // Extraer solo la fecha
      })
    } else {
      setFormData({
        estudianteId: '',
        motivo: '',
        horaRetiro: '',
        observaciones: '',
        personaRecoge: '',
        dniPersonaRecoge: '',
        fecha: new Date().toISOString().split('T')[0]
      })
    }
    // Resetear la visibilidad de la información del apoderado al abrir/cerrar modal
    setShowApoderadoInfo(false)
  }, [retiro, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const success = await onSave(formData)
      if (success) {
        onClose()
      }
    } catch (error) {
      console.error('Error saving retiro:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const motivosComunes = [
    'Cita médica',
    'Emergencia familiar',
    'Malestar del estudiante',
    'Retiro temprano autorizado',
    'Actividad extracurricular',
    'Otro'
  ]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header del modal */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-4">
          <h3 className="text-xl font-bold text-white flex items-center">
            <span className="mr-2">{retiro ? '✏️' : '🚪'}</span>
            {retiro ? 'Editar Retiro' : 'Solicitar Retiro'}
          </h3>
        </div>
        
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-80px)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Fecha y Hora en grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  📅 Fecha *
                </label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  🕐 Hora *
                </label>
                <input
                  type="time"
                  value={formData.horaRetiro}
                  onChange={(e) => setFormData(prev => ({ ...prev, horaRetiro: e.target.value }))}
                  required
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white transition-all"
                />
              </div>
            </div>

            {/* Estudiante */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                👤 Estudiante *
              </label>
              <select
                value={formData.estudianteId}
                onChange={(e) => handleEstudianteChange(e.target.value)}
                required
                disabled={!!retiro}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white transition-all disabled:bg-gray-100"
              >
                <option value="">Seleccionar estudiante</option>
                {estudiantes.map(estudiante => (
                  <option key={estudiante.id} value={estudiante.id}>
                    {estudiante.nombre} {estudiante.apellido} - {estudiante.grado}° {estudiante.seccion}
                  </option>
                ))}
              </select>
              {formData.estudianteId && (
                <button
                  type="button"
                  onClick={() => setShowApoderadoInfo(!showApoderadoInfo)}
                  className="mt-2 text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors w-full"
                >
                  {showApoderadoInfo ? '🔼 Ocultar info del apoderado' : '🔽 Ver info del apoderado'}
                </button>
              )}
            </div>

            {/* Info apoderado colapsable */}
            {formData.estudianteId && showApoderadoInfo && (() => {
              const estudiante = estudiantes.find(e => e.id === formData.estudianteId)
              return estudiante?.apoderadoTitular ? (
                <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                  <h4 className="font-semibold text-blue-800 mb-2 text-sm">👤 Apoderado Titular</h4>
                  <div className="text-xs text-blue-700 grid grid-cols-2 gap-2">
                    <p><strong>Nombre:</strong> {estudiante.apoderadoTitular.nombre}</p>
                    <p><strong>DNI:</strong> {estudiante.apoderadoTitular.dni}</p>
                    <p><strong>Tel:</strong> {estudiante.apoderadoTitular.telefono}</p>
                    <p><strong>Email:</strong> {estudiante.apoderadoTitular.email}</p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-sm text-yellow-700">⚠️ Sin información del apoderado</p>
                </div>
              )
            })()}

            {/* Motivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                📋 Motivo *
              </label>
              <select
                value={formData.motivo}
                onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
                required
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white transition-all"
              >
                <option value="">Seleccionar motivo</option>
                {motivosComunes.map(motivo => (
                  <option key={motivo} value={motivo}>{motivo}</option>
                ))}
              </select>
            </div>

            {/* Persona que recoge y DNI */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  🧑 Quien recoge *
                </label>
                <input
                  type="text"
                  value={formData.personaRecoge}
                  onChange={(e) => setFormData(prev => ({ ...prev, personaRecoge: e.target.value }))}
                  placeholder="Nombre completo"
                  required
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  🪪 DNI *
                </label>
                <input
                  type="text"
                  value={formData.dniPersonaRecoge}
                  onChange={(e) => setFormData(prev => ({ ...prev, dniPersonaRecoge: e.target.value }))}
                  placeholder="12345678"
                  maxLength={8}
                  required
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white transition-all"
                />
              </div>
            </div>
            {formData.estudianteId && (
              <p className="text-xs text-green-600 -mt-2">✅ Datos autocompletados del apoderado</p>
            )}

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                📝 Observaciones
              </label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                placeholder="Información adicional..."
                rows={2}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white transition-all resize-none"
              />
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 font-medium transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:from-orange-600 hover:to-red-700 disabled:opacity-50 font-medium transition-all shadow-md"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </span>
                ) : (retiro ? 'Actualizar' : 'Solicitar Retiro')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function RetirosDocente() {
  const {
    retiros,
    loading,
    filters,
    grados,
    stats,
    loadRetiros,
    solicitarRetiro,
    modificarRetiro,
    eliminarRetiro,
    updateFilters
  } = useRetiros()

  const [showModal, setShowModal] = useState(false)
  const [editingRetiro, setEditingRetiro] = useState<Retiro | null>(null)
  const [estudiantes, setEstudiantes] = useState<Array<{
    id: string
    nombre: string
    apellido: string
    dni: string
    grado: string
    seccion: string
    apoderadoTitular?: {
      id: string
      nombre: string
      apellido: string
      dni: string
      telefono: string
      email: string
    } | null
  }>>([])

  // Cargar estudiantes al montar el componente
  useEffect(() => {
    loadEstudiantes()
  }, [])

  const loadEstudiantes = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/docentes/estudiantes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Estudiantes cargados:', data.estudiantes?.length || 0)
        setEstudiantes(data.estudiantes || [])
      } else {
        console.error('❌ Error al cargar estudiantes:', response.status)
        // Datos de ejemplo si falla la API
        setEstudiantes([
          { 
            id: '1', 
            nombre: 'Juan Carlos', 
            apellido: 'Pérez García', 
            dni: '12345678', 
            grado: '3', 
            seccion: 'A',
            apoderadoTitular: {
              id: '1',
              nombre: 'María Elena',
              apellido: 'García López',
              dni: '87654321',
              telefono: '987654321',
              email: 'maria.garcia@email.com'
            }
          },
          { 
            id: '2', 
            nombre: 'Ana Sofía', 
            apellido: 'Rodríguez Silva', 
            dni: '11223344', 
            grado: '3', 
            seccion: 'A',
            apoderadoTitular: {
              id: '2',
              nombre: 'Carlos Alberto',
              apellido: 'Rodríguez Torres',
              dni: '44332211',
              telefono: '912345678',
              email: 'carlos.rodriguez@email.com'
            }
          }
        ])
      }
    } catch (error) {
      console.error('❌ Error loading estudiantes:', error)
      // Usar datos de ejemplo en caso de error
      setEstudiantes([
        { 
          id: '1', 
          nombre: 'Juan Carlos', 
          apellido: 'Pérez García', 
          dni: '12345678', 
          grado: '3', 
          seccion: 'A',
          apoderadoTitular: {
            id: '1',
            nombre: 'María Elena',
            apellido: 'García López',
            dni: '87654321',
            telefono: '987654321',
            email: 'maria.garcia@email.com'
          }
        }
      ])
    }
  }

  const handleCreateRetiro = () => {
    setEditingRetiro(null)
    setShowModal(true)
  }

  const handleEditRetiro = (retiro: Retiro) => {
    if (retiro.estado === 'AUTORIZADO' || retiro.estado === 'COMPLETADO') {
      alert('No se puede editar un retiro que ya fue autorizado o completado')
      return
    }
    setEditingRetiro(retiro)
    setShowModal(true)
  }

  const handleSaveRetiro = async (data: any) => {
    try {
      if (editingRetiro) {
        return await modificarRetiro(editingRetiro.id, data)
      } else {
        return await solicitarRetiro(data)
      }
    } catch (error) {
      console.error('Error saving retiro:', error)
      return false
    }
  }

  const handleDeleteRetiro = async (retiro: Retiro) => {
    if (retiro.estado === 'AUTORIZADO' || retiro.estado === 'COMPLETADO') {
      alert('No se puede eliminar un retiro que ya fue autorizado o completado')
      return
    }

    if (confirm(`¿Estás seguro de eliminar el retiro de ${retiro.estudiante.nombre} ${retiro.estudiante.apellido}?`)) {
      await eliminarRetiro(retiro.id)
    }
  }

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatearHora = (hora: string) => {
    return hora.slice(0, 5) // HH:MM
  }

  const getEstadoBadge = (estado: string) => {
    const badges = {
      'PENDIENTE': 'bg-yellow-100 text-yellow-800',
      'AUTORIZADO': 'bg-green-100 text-green-800',
      'RECHAZADO': 'bg-red-100 text-red-800',
      'COMPLETADO': 'bg-blue-100 text-blue-800'
    }
    return badges[estado as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <button
            onClick={handleCreateRetiro}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Solicitar Retiro
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <input
              type="text"
              placeholder="Buscar estudiante, DNI o motivo..."
              value={filters.searchTerm}
              onChange={(e) => updateFilters({ searchTerm: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white shadow-sm transition-all duration-200 hover:border-gray-400"
            />
          </div>
          <div>
            <select
              value={filters.grado}
              onChange={(e) => updateFilters({ grado: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white shadow-sm transition-all duration-200 hover:border-gray-400"
            >
              <option value="">Todos los grados</option>
              {grados.map(grado => (
                <option key={grado} value={grado}>{grado}°</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filters.estado}
              onChange={(e) => updateFilters({ estado: e.target.value as any })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white shadow-sm transition-all duration-200 hover:border-gray-400"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="AUTORIZADO">Autorizados</option>
              <option value="RECHAZADO">Rechazados</option>
              <option value="COMPLETADO">Completados</option>
            </select>
          </div>
          <div>
            <input
              type="date"
              value={filters.fecha}
              onChange={(e) => updateFilters({ fecha: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white shadow-sm transition-all duration-200 hover:border-gray-400"
            />
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-black">Total</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pendientes}</div>
            <div className="text-sm text-black">Pendientes</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.autorizados}</div>
            <div className="text-sm text-black">Autorizados</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.rechazados}</div>
            <div className="text-sm text-black">Rechazados</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.completados}</div>
            <div className="text-sm text-black">Completados</div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-black">Cargando retiros...</span>
        </div>
      )}

      {/* Lista de retiros */}
      <div className="p-6">
        {retiros.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-6xl mb-4">🚪</div>
            <h3 className="text-lg font-medium text-black mb-2">No hay retiros</h3>
            <p className="text-black mb-4">
              {filters.searchTerm || filters.grado || filters.estado !== 'TODOS' 
                ? 'No se encontraron retiros que coincidan con los filtros' 
                : 'Aún no se han solicitado retiros'
              }
            </p>
            <button
              onClick={handleCreateRetiro}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Solicitar Primer Retiro
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {retiros.map((retiro) => (
              <div
                key={retiro.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Información principal */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-black">
                        {retiro.estudiante.nombre} {retiro.estudiante.apellido}
                      </h3>
                      <span className="text-sm text-black">
                        DNI: {retiro.estudiante.dni}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {retiro.estudiante.grado}° {retiro.estudiante.seccion}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getEstadoBadge(retiro.estado)}`}>
                        {retiro.estado}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-black">Fecha:</span>
                        <p className="text-black">{formatearFecha(retiro.fecha)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-black">Hora:</span>
                        <p className="text-black">{formatearHora(retiro.horaRetiro)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-black">Motivo:</span>
                        <p className="text-black">{retiro.motivo}</p>
                      </div>
                    </div>

                    {retiro.personaRecoge && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium text-black">Persona que recoge:</span>
                        <span className="text-black ml-2">
                          {retiro.personaRecoge}
                          {retiro.dniPersonaRecoge && ` (DNI: ${retiro.dniPersonaRecoge})`}
                        </span>
                      </div>
                    )}

                    {retiro.observaciones && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium text-black">Observaciones:</span>
                        <p className="text-black mt-1">{retiro.observaciones}</p>
                      </div>
                    )}

                    {retiro.autorizadoPor && (
                      <div className="mt-2 p-3 bg-gray-50 rounded border">
                        <div className="text-sm">
                          <span className="font-medium text-black">
                            {retiro.estado === 'AUTORIZADO' ? 'Autorizado' : 'Revisado'} por:
                          </span>
                          <span className="text-black ml-2">
                            {retiro.autorizadoPor.nombre} {retiro.autorizadoPor.apellido}
                          </span>
                          {retiro.fechaAutorizacion && (
                            <span className="text-black ml-4">
                              el {formatearFecha(retiro.fechaAutorizacion)}
                            </span>
                          )}
                        </div>
                        {retiro.observacionesAutorizacion && (
                          <div className="mt-2">
                            <span className="font-medium text-black">Observaciones:</span>
                            <p className="text-black mt-1">{retiro.observacionesAutorizacion}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2">
                    {retiro.estado === 'PENDIENTE' && (
                      <>
                        <button
                          onClick={() => handleEditRetiro(retiro)}
                          className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDeleteRetiro(retiro)}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          🗑️ Eliminar
                        </button>
                      </>
                    )}
                    {retiro.estado === 'AUTORIZADO' && (
                      <span className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm">
                        ✅ Listo para recoger
                      </span>
                    )}
                    {retiro.estado === 'COMPLETADO' && (
                      <span className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm">
                        ✅ Completado
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <RetiroModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveRetiro}
        retiro={editingRetiro}
        estudiantes={estudiantes}
      />
    </div>
  )
}
