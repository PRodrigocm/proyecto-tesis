'use client'

import { useState, useEffect } from 'react'
import CalendarioAnual from '@/components/admin/CalendarioAnual'
import RegistrarEventoModal from '@/components/admin/RegistrarEventoModal'
import ProgramarReunionModal from '@/components/admin/ProgramarReunionModal'
import { useAnoLectivo } from '@/hooks/useAnoLectivo'

export default function AnoLectivoPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isReunionModalOpen, setIsReunionModalOpen] = useState(false)
  const [isReunionesListModalOpen, setIsReunionesListModalOpen] = useState(false)
  const [isEventosListModalOpen, setIsEventosListModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedEvento, setSelectedEvento] = useState<any | null>(null)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [reuniones, setReuniones] = useState<any[]>([])

  // Helper function to format time
  const formatTime = (timeValue: any) => {
    if (!timeValue) return 'No especificada'
    
    try {
      // Si ya es una cadena con formato HH:MM
      if (typeof timeValue === 'string' && timeValue.includes(':')) {
        return timeValue.slice(0, 5)
      }
      
      // Si es una fecha completa
      if (timeValue instanceof Date || (typeof timeValue === 'string' && timeValue.includes('T'))) {
        return new Date(timeValue).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
      }
      
      // Si es solo tiempo (HH:MM:SS)
      if (typeof timeValue === 'string') {
        const timeParts = timeValue.split(':')
        if (timeParts.length >= 2) {
          return `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}`
        }
      }
      
      return timeValue.toString()
    } catch (error) {
      console.error('Error formatting time:', timeValue, error)
      return 'Formato inválido'
    }
  }
  
  const {
    calendarioEscolar,
    loading,
    loadCalendarioEscolar,
    registrarEvento,
    actualizarEvento,
    eliminarEvento,
    stats
  } = useAnoLectivo(currentYear)

  const handleDateClick = (date: Date, evento?: any) => {
    setSelectedDate(date)
    setSelectedEvento(evento || null)
    setIsModalOpen(true)
  }

  const handleRegistrarEvento = async (eventoData: any) => {
    try {
      if (selectedEvento) {
        // Es una edición - usar actualizarEvento
        console.log('🔄 Editando evento existente:', selectedEvento.idCalendario)
        await actualizarEvento(selectedEvento.idCalendario, eventoData)
      } else {
        // Es un nuevo evento - usar registrarEvento
        console.log('➕ Creando nuevo evento')
        await registrarEvento(eventoData)
      }
      setIsModalOpen(false)
      setSelectedDate(null)
      setSelectedEvento(null)
    } catch (error) {
      console.error('Error al procesar evento:', error)
      alert('Error al procesar el evento. Por favor, inténtalo de nuevo.')
    }
  }

  const handleEliminarEvento = async (idExcepcion: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este evento?')) {
      await eliminarEvento(idExcepcion)
      setIsModalOpen(false)
      setSelectedDate(null)
      setSelectedEvento(null)
    }
  }

  const loadReuniones = async () => {
    try {
      const token = localStorage.getItem('token')
      console.log('🔍 Cargando reuniones para año:', currentYear)
      const response = await fetch(`/api/reuniones?year=${currentYear}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('📅 Reuniones cargadas:', data.data?.length || 0, data.data)
        setReuniones(data.data || [])
      } else {
        console.error('❌ Error al cargar reuniones:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('❌ Error loading reuniones:', error)
    }
  }

  const handleProgramarReunion = async (reunionData: any) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/reuniones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reunionData)
      })

      if (!response.ok) {
        throw new Error('Error al programar reunión')
      }

      setIsReunionModalOpen(false)
      await loadReuniones() // Recargar reuniones
      alert('Reunión programada exitosamente')
    } catch (error) {
      console.error('Error:', error)
      alert('Error al programar la reunión')
    }
  }

  // Cargar reuniones cuando cambie el año
  useEffect(() => {
    console.log('🔄 useEffect triggered, loading reuniones for year:', currentYear)
    loadReuniones()
  }, [currentYear])

  // Debug: log current state
  useEffect(() => {
    console.log('📊 Current state:', {
      reuniones: reuniones.length,
      calendarioEscolar: calendarioEscolar.length,
      loading,
      currentYear
    })
  }, [reuniones, calendarioEscolar, loading, currentYear])

  // Asegurar que siempre inicie en el año actual
  useEffect(() => {
    const actualYear = new Date().getFullYear()
    if (currentYear !== actualYear) {
      console.log(`🔄 Ajustando al año actual: ${actualYear}`)
      setCurrentYear(actualYear)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Año Lectivo {currentYear}
            {currentYear === new Date().getFullYear() && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Actual
              </span>
            )}
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Gestiona el calendario escolar anual, días lectivos, feriados y suspensiones de clases
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-3">
          <select
            value={currentYear}
            onChange={(e) => setCurrentYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
          >
            {Array.from({ length: 5 }, (_, i) => {
              const currentYearActual = new Date().getFullYear()
              const year = currentYearActual - 2 + i
              return (
                <option key={year} value={year}>
                  {year === currentYearActual ? `${year} (Actual)` : year}
                </option>
              )
            })}
          </select>
          
          {/* Botones de Ver */}
          <button
            type="button"
            onClick={() => setIsReunionesListModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-orange-300 rounded-md shadow-sm text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Ver Reuniones ({reuniones.length})
          </button>
          
          <button
            type="button"
            onClick={() => setIsEventosListModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Ver Eventos ({calendarioEscolar.filter(item => !item.esLectivo).length})
          </button>
          
          {/* Botones de Crear */}
          <button
            type="button"
            onClick={() => setIsReunionModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Programar Reunión
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Registrar Evento
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Días Lectivos</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.diasLectivos}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Feriados</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.feriados}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Suspensiones</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.suspensiones}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Días</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalDias}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendario Anual */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Calendario Escolar {currentYear}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Haz clic en cualquier día para registrar un evento, feriado o suspensión de clases
          </p>
        </div>
        <div className="p-6">
          <CalendarioAnual
            year={currentYear}
            calendarioEscolar={calendarioEscolar}
            reuniones={reuniones}
            onDateClick={handleDateClick}
          />
        </div>
      </div>

      {/* Leyenda */}
      <div className="bg-white shadow rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Leyenda</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-200 border border-green-400 rounded"></div>
            <span className="text-sm text-gray-700">Día Lectivo</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-200 border border-red-400 rounded"></div>
            <span className="text-sm text-gray-700">Feriado</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-200 border border-yellow-400 rounded"></div>
            <span className="text-sm text-gray-700">Suspensión</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-orange-200 border border-orange-400 rounded"></div>
            <span className="text-sm text-gray-700">Reunión</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-200 border border-gray-400 rounded"></div>
            <span className="text-sm text-gray-700">Fin de Semana</span>
          </div>
        </div>
      </div>

      {/* Modal para registrar eventos */}
      <RegistrarEventoModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedDate(null)
          setSelectedEvento(null)
        }}
        onSubmit={handleRegistrarEvento}
        selectedDate={selectedDate}
        selectedEvento={selectedEvento}
        onDelete={handleEliminarEvento}
      />

      {/* Modal para programar reunión */}
      <ProgramarReunionModal
        isOpen={isReunionModalOpen}
        onClose={() => setIsReunionModalOpen(false)}
        onSubmit={handleProgramarReunion}
      />

      {/* Modal para ver lista de reuniones */}
      {isReunionesListModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="flex items-center justify-center min-h-screen px-4 py-8">
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Reuniones del Año {currentYear}
                  </h3>
                  <button
                    onClick={() => setIsReunionesListModalOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="mt-4 max-h-96 overflow-y-auto">
                  {reuniones.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No hay reuniones programadas para este año</p>
                  ) : (
                    <div className="space-y-3">
                      {reuniones.map((reunion: any) => (
                        <div key={reunion.idReunion} className="border border-orange-200 rounded-lg p-4 hover:bg-orange-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-md font-semibold text-gray-900">{reunion.titulo}</h4>
                              <div className="mt-2 space-y-1">
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">📅 Fecha:</span> {new Date(reunion.fecha).toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">🕐 Hora:</span> {formatTime(reunion.horaInicio)}
                                </p>
                                {reunion.descripcion && (
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">📝 Descripción:</span> {reunion.descripcion}
                                  </p>
                                )}
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">👥 Tipo:</span> {reunion.tipoReunion === 'GENERAL' ? 'General' : reunion.tipoReunion === 'POR_GRADO' ? 'Por Grado' : 'Por Aula'}
                                </p>
                                {reunion.grado && (
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">🎓 Grado:</span> {reunion.grado.nivel?.nombre} - {reunion.grado.nombre}° {reunion.seccion?.nombre || ''}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className={`ml-4 px-3 py-1 text-xs font-medium rounded-full ${
                              reunion.estado === 'PROGRAMADA' ? 'bg-blue-100 text-blue-800' :
                              reunion.estado === 'REALIZADA' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {reunion.estado}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setIsReunionesListModalOpen(false)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver lista de eventos */}
      {isEventosListModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="flex items-center justify-center min-h-screen px-4 py-8">
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Eventos del Año {currentYear}
                  </h3>
                  <button
                    onClick={() => setIsEventosListModalOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="mt-4 max-h-96 overflow-y-auto">
                  <div className="mb-2 text-xs text-gray-500">
                    Debug: {calendarioEscolar.length} items total, {calendarioEscolar.filter(item => !item.esLectivo).length} eventos
                  </div>
                  {calendarioEscolar.filter(item => !item.esLectivo).length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No hay eventos registrados para este año</p>
                  ) : (
                    <div className="space-y-4">
                      {(() => {
                        // Agrupar eventos por mes
                        const eventosPorMes = calendarioEscolar
                          .filter(item => !item.esLectivo)
                          .reduce((grupos: any, evento: any) => {
                            const fecha = new Date(evento.fecha)
                            const mesAno = `${fecha.getFullYear()}-${fecha.getMonth()}`
                            const nombreMes = fecha.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })
                            
                            if (!grupos[mesAno]) {
                              grupos[mesAno] = {
                                nombre: nombreMes,
                                eventos: []
                              }
                            }
                            grupos[mesAno].eventos.push(evento)
                            return grupos
                          }, {})

                        return Object.entries(eventosPorMes)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([mesAno, grupo]: [string, any]) => (
                            <div key={mesAno} className="border-l-4 border-indigo-500 pl-4">
                              <h3 className="text-lg font-semibold text-gray-900 mb-3 capitalize">
                                📅 {grupo.nombre}
                              </h3>
                              <div className="space-y-2">
                                {grupo.eventos.map((evento: any, index: number) => (
                                  <div key={evento.idExcepcion || evento.idCalendario || `evento-${mesAno}-${index}`} 
                                       className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-3">
                                        <span className={`w-3 h-3 rounded-full ${
                                          evento.tipoEvento === 'FERIADO' ? 'bg-red-500' :
                                          evento.tipoEvento === 'SUSPENSION' ? 'bg-yellow-500' :
                                          'bg-blue-500'
                                        }`}></span>
                                        <div>
                                          <p className="font-medium text-gray-900">{evento.motivo}</p>
                                          <p className="text-sm text-gray-600">
                                            {new Date(evento.fecha).toLocaleDateString('es-PE', { 
                                              weekday: 'long', 
                                              day: 'numeric' 
                                            })}
                                            {evento.descripcion && ` • ${evento.descripcion}`}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                                      evento.tipoEvento === 'FERIADO' ? 'bg-red-100 text-red-700' :
                                      evento.tipoEvento === 'SUSPENSION' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-blue-100 text-blue-700'
                                    }`}>
                                      {evento.tipoEvento}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                      })()}
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setIsEventosListModalOpen(false)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
