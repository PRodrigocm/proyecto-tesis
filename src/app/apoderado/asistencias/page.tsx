'use client'

import { useState, useEffect } from 'react'
import {
  estudiantesService,
  asistenciasService,
  notificacionesService,
  type Estudiante,
  type AsistenciaIE,
  type AsistenciaAula,
  type NotificacionConfig
} from '@/services/apoderado.service'

export default function AsistenciasPage() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [selectedEstudiante, setSelectedEstudiante] = useState('')
  const [asistenciasIE, setAsistenciasIE] = useState<AsistenciaIE[]>([])
  const [asistenciasAulas, setAsistenciasAulas] = useState<AsistenciaAula[]>([])
  const [notificaciones, setNotificaciones] = useState<NotificacionConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'ie' | 'aulas' | 'notificaciones'>('ie')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  useEffect(() => {
    loadEstudiantes()
    // Establecer fechas por defecto (último mes)
    const hoy = new Date()
    const hace30Dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000)
    setFechaFin(hoy.toISOString().split('T')[0])
    setFechaInicio(hace30Dias.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    if (selectedEstudiante && fechaInicio && fechaFin) {
      loadAsistencias()
    }
  }, [selectedEstudiante, fechaInicio, fechaFin])

  const loadEstudiantes = async () => {
    try {
      const data = await estudiantesService.getAll()
      setEstudiantes(data)
      if (data.length > 0) {
        setSelectedEstudiante(data[0].id)
      }
    } catch (error) {
      console.error('Error loading estudiantes:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAsistencias = async () => {
    if (!selectedEstudiante) return
    
    setLoading(true)
    try {
      // Cargar asistencias de IE y aulas en paralelo
      const [dataIE, dataAulas] = await Promise.all([
        asistenciasService.getIE(selectedEstudiante, fechaInicio, fechaFin),
        asistenciasService.getAulas(selectedEstudiante, fechaInicio, fechaFin)
      ])

      setAsistenciasIE(dataIE)
      setAsistenciasAulas(dataAulas)

      // Cargar configuración de notificaciones
      loadNotificaciones()
      
    } catch (error) {
      console.error('Error loading asistencias:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadNotificaciones = async () => {
    try {
      const data = await notificacionesService.getConfig()
      setNotificaciones(data)
    } catch (error) {
      console.error('Error loading notificaciones config:', error)
    }
  }

  const updateNotificacionConfig = async (estudianteId: string, config: Partial<NotificacionConfig>) => {
    try {
      await notificacionesService.updateConfig({
        estudianteId,
        ...config
      })
      loadNotificaciones()
    } catch (error) {
      console.error('Error updating notification config:', error)
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PRESENTE':
      case 'COMPLETO':
        return 'bg-green-100 text-green-800'
      case 'AUSENTE':
        return 'bg-red-100 text-red-800'
      case 'TARDANZA':
      case 'FALTA_SALIDA':
        return 'bg-yellow-100 text-yellow-800'
      case 'JUSTIFICADO':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'COMPLETO':
        return 'Completo'
      case 'PRESENTE':
        return 'Presente'
      case 'FALTA_SALIDA':
        return 'Falta Salida'
      case 'AUSENTE':
        return 'Ausente'
      case 'TARDANZA':
        return 'Tardanza'
      case 'JUSTIFICADO':
        return 'Justificado'
      default:
        return estado
    }
  }

  const tabs = [
    { id: 'ie', name: 'Entrada/Salida IE', icon: '🏫' },
    { id: 'aulas', name: 'Asistencia Aulas', icon: '📚' },
    { id: 'notificaciones', name: 'Notificaciones', icon: '🔔' }
  ]

  if (loading && estudiantes.length === 0) {
    return (
      <div className="p-3 sm:p-4 md:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 sm:w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span>📋</span> Asistencias
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">Consulta asistencias y configura notificaciones</p>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow-md rounded-xl p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="sm:col-span-1">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              👨‍🎓 Estudiante
            </label>
            <select
              value={selectedEstudiante}
              onChange={(e) => setSelectedEstudiante(e.target.value)}
              className="block w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black text-sm min-h-[44px]"
            >
              {estudiantes.map((estudiante) => (
                <option key={estudiante.id} value={estudiante.id}>
                  {estudiante.apellido}, {estudiante.nombre} - {estudiante.grado}° {estudiante.seccion}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              📅 Desde
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="block w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black text-sm min-h-[44px]"
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              📅 Hasta
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="block w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black text-sm min-h-[44px]"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-md rounded-xl overflow-hidden">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="-mb-px flex px-2 sm:px-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 sm:py-4 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="mr-1 sm:mr-2">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.name}</span>
                <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-3 sm:p-4 md:p-6">
          {activeTab === 'ie' && (
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">🏫 Entrada y Salida IE</h3>
              {loading ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-14 bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
              ) : asistenciasIE.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-4xl mb-2 block">📭</span>
                  <p className="text-gray-500 text-sm">No hay registros para este período</p>
                </div>
              ) : (
                <>
                  {/* Vista móvil - tarjetas */}
                  <div className="sm:hidden space-y-2">
                    {asistenciasIE.map((asistencia) => (
                      <div key={asistencia.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {new Date(asistencia.fecha).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </span>
                          <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${getEstadoColor(asistencia.estado)}`}>
                            {getEstadoLabel(asistencia.estado)}
                          </span>
                        </div>
                        <div className="flex gap-4 text-xs text-gray-600">
                          <span>🟢 {asistencia.horaEntrada || '--:--'}</span>
                          <span>🔴 {asistencia.horaSalida || '--:--'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Vista desktop - tabla */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entrada</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salida</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {asistenciasIE.map((asistencia) => (
                          <tr key={asistencia.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {new Date(asistencia.fecha).toLocaleDateString('es-ES')}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600 font-medium">
                              {asistencia.horaEntrada || '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600 font-medium">
                              {asistencia.horaSalida || '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(asistencia.estado)}`}>
                                {getEstadoLabel(asistencia.estado)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'aulas' && (
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">📚 Asistencia a Clases</h3>
              {loading ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-14 bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
              ) : asistenciasAulas.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-4xl mb-2 block">📭</span>
                  <p className="text-gray-500 text-sm">No hay registros para este período</p>
                </div>
              ) : (
                <>
                  {/* Vista móvil - tarjetas */}
                  <div className="sm:hidden space-y-2">
                    {asistenciasAulas.map((asistencia) => (
                      <div key={asistencia.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-sm font-medium text-gray-900 block">
                              {new Date(asistencia.fecha).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </span>
                            <span className="text-xs text-gray-500">{asistencia.aula}</span>
                          </div>
                          <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${getEstadoColor(asistencia.estado)}`}>
                            {getEstadoLabel(asistencia.estado)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          🕐 {asistencia.hora}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Vista desktop - tabla */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aula</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {asistenciasAulas.map((asistencia) => (
                          <tr key={asistencia.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {new Date(asistencia.fecha).toLocaleDateString('es-ES')}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                              {asistencia.hora}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {asistencia.aula}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(asistencia.estado)}`}>
                                {getEstadoLabel(asistencia.estado)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'notificaciones' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración de Notificaciones</h3>
              <p className="text-gray-600 mb-6">Configura cómo deseas recibir notificaciones sobre la asistencia de tus hijos</p>
              
              {estudiantes.map((estudiante) => {
                const config = notificaciones.find(n => n.estudianteId === estudiante.id) || {
                  estudianteId: estudiante.id,
                  entradaIE: { email: false, telefono: false },
                  salidaIE: { email: false, telefono: false },
                  asistenciaAulas: { email: false, telefono: false }
                }

                return (
                  <div key={estudiante.id} className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      {estudiante.apellido}, {estudiante.nombre} - {estudiante.grado}° {estudiante.seccion}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h5 className="font-medium text-gray-700">Entrada a la IE</h5>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={config.entradaIE.email}
                              onChange={(e) => updateNotificacionConfig(estudiante.id, {
                                entradaIE: { ...config.entradaIE, email: e.target.checked }
                              })}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Notificar por Email</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={config.entradaIE.telefono}
                              onChange={(e) => updateNotificacionConfig(estudiante.id, {
                                entradaIE: { ...config.entradaIE, telefono: e.target.checked }
                              })}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Notificar por SMS</span>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h5 className="font-medium text-gray-700">Salida de la IE</h5>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={config.salidaIE.email}
                              onChange={(e) => updateNotificacionConfig(estudiante.id, {
                                salidaIE: { ...config.salidaIE, email: e.target.checked }
                              })}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Notificar por Email</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={config.salidaIE.telefono}
                              onChange={(e) => updateNotificacionConfig(estudiante.id, {
                                salidaIE: { ...config.salidaIE, telefono: e.target.checked }
                              })}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Notificar por SMS</span>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h5 className="font-medium text-gray-700">Asistencia a Aulas</h5>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={config.asistenciaAulas.email}
                              onChange={(e) => updateNotificacionConfig(estudiante.id, {
                                asistenciaAulas: { ...config.asistenciaAulas, email: e.target.checked }
                              })}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Notificar por Email</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={config.asistenciaAulas.telefono}
                              onChange={(e) => updateNotificacionConfig(estudiante.id, {
                                asistenciaAulas: { ...config.asistenciaAulas, telefono: e.target.checked }
                              })}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Notificar por SMS</span>
                          </label>
                        </div>
                      </div>

                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
