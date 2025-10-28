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
        return 'bg-green-100 text-green-800'
      case 'AUSENTE':
        return 'bg-red-100 text-red-800'
      case 'TARDANZA':
        return 'bg-yellow-100 text-yellow-800'
      case 'JUSTIFICADO':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const tabs = [
    { id: 'ie', name: 'Entrada/Salida IE', icon: '🏫' },
    { id: 'aulas', name: 'Asistencia Aulas', icon: '📚' },
    { id: 'notificaciones', name: 'Notificaciones', icon: '🔔' }
  ]

  if (loading && estudiantes.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Asistencias</h1>
        <p className="text-gray-600">Consulta las asistencias de tus hijos y configura notificaciones</p>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estudiante
            </label>
            <select
              value={selectedEstudiante}
              onChange={(e) => setSelectedEstudiante(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
            >
              {estudiantes.map((estudiante) => (
                <option key={estudiante.id} value={estudiante.id}>
                  {estudiante.apellido}, {estudiante.nombre} - {estudiante.grado}° {estudiante.seccion}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Fin
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'ie' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Entrada y Salida de la Institución</h3>
              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : asistenciasIE.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay registros de asistencia para el período seleccionado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora Entrada</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora Salida</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {asistenciasIE.map((asistencia) => (
                        <tr key={asistencia.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(asistencia.fecha).toLocaleDateString('es-ES')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {asistencia.horaEntrada || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {asistencia.horaSalida || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(asistencia.estado)}`}>
                              {asistencia.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'aulas' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Asistencia a Clases</h3>
              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : asistenciasAulas.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay registros de asistencia a clases para el período seleccionado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aula</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {asistenciasAulas.map((asistencia) => (
                        <tr key={asistencia.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(asistencia.fecha).toLocaleDateString('es-ES')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {asistencia.hora}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {asistencia.aula}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(asistencia.estado)}`}>
                              {asistencia.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
