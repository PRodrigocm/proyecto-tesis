'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DocenteDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [docente, setDocente] = useState<any>(null)
  const [stats, setStats] = useState({
    clasesHoy: 0,
    estudiantesTotal: 0,
    asistenciaPromedio: 0,
    justificacionesPendientes: 0,
    retirosPendientes: 0
  })

  const [aulasDocente, setAulasDocente] = useState<any[]>([])
  const [actividadReciente, setActividadReciente] = useState<any[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        router.push('/login')
        return
      }

      console.log('🔄 Cargando datos del dashboard del docente...')
      
      const response = await fetch('/api/docentes/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Datos del dashboard cargados:', data.data)
        console.log('🏫 Aulas del docente recibidas:', data.data.aulasDocente)
        
        setStats(data.data.stats)
        setAulasDocente(data.data.aulasDocente || [])
        setActividadReciente(data.data.actividadReciente)
        setDocente(data.data.docente)
      } else {
        console.error('❌ Error al cargar dashboard:', response.status)
        const errorData = await response.text()
        console.error('❌ Error details:', errorData)
        // Mantener datos por defecto en caso de error
      }
    } catch (error) {
      console.error('💥 Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, subtitle, icon, color }: any) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-8 h-8 ${color} rounded-md flex items-center justify-center`}>
              {icon}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-lg font-medium text-gray-900">{value}</dd>
              {subtitle && <dd className="text-sm text-gray-500">{subtitle}</dd>}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard Docente
          {docente && (
            <span className="text-lg font-normal text-gray-600 ml-2">
              - {docente.nombre} {docente.apellido}
            </span>
          )}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {docente?.especialidad && `${docente.especialidad} | `}
          Bienvenido de vuelta. Aquí tienes un resumen de tu día.
        </p>
        {loading && (
          <div className="mt-2 flex items-center text-sm text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Cargando datos...
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <StatCard
          title="Clases Hoy"
          value={stats.clasesHoy}
          icon={
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
          color="bg-blue-500"
        />
        
        <StatCard
          title="Estudiantes Total"
          value={stats.estudiantesTotal}
          icon={
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          }
          color="bg-green-500"
        />
        
        <StatCard
          title="Asistencia Promedio"
          value={`${stats.asistenciaPromedio}%`}
          icon={
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          color="bg-yellow-500"
        />
        
        <StatCard
          title="Justificaciones"
          value={stats.justificacionesPendientes}
          subtitle="Pendientes"
          icon={
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          color="bg-purple-500"
        />
        
        <StatCard
          title="Retiros"
          value={stats.retirosPendientes}
          subtitle="Pendientes"
          icon={
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          }
          color="bg-red-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Clases - Aulas donde enseña */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Clases</h3>
            <p className="text-sm text-gray-600">Aulas donde enseñas</p>
          </div>
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="px-6 py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Cargando aulas...</p>
              </div>
            ) : aulasDocente.length > 0 ? (
              aulasDocente.map((aulaInfo: any) => {
                console.log('🎨 Renderizando aula:', aulaInfo)
                return (
                <div key={aulaInfo.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">{aulaInfo.aula}</p>
                          <div className="mt-1 space-y-1">
                            {/* Clases regulares */}
                            {aulaInfo.clases.slice(0, 2).map((clase: any, index: number) => (
                              <p key={index} className="text-xs text-gray-500">
                                {clase.grado} • {clase.diaNombre} {clase.hora}
                              </p>
                            ))}
                            {aulaInfo.clases.length > 2 && (
                              <p className="text-xs text-gray-400">
                                +{aulaInfo.clases.length - 2} más...
                              </p>
                            )}
                            
                            {/* Recuperaciones */}
                            {aulaInfo.recuperaciones && aulaInfo.recuperaciones.length > 0 && (
                              <div className="mt-2 pt-1 border-t border-gray-200">
                                <p className="text-xs font-medium text-orange-600 mb-1">
                                  🔄 Recuperaciones:
                                </p>
                                {aulaInfo.recuperaciones.slice(0, 2).map((recuperacion: any, index: number) => (
                                  <p key={index} className="text-xs text-orange-500">
                                    {recuperacion.grado} • {recuperacion.diaNombre} {recuperacion.hora}
                                  </p>
                                ))}
                                {aulaInfo.recuperaciones.length > 2 && (
                                  <p className="text-xs text-orange-400">
                                    +{aulaInfo.recuperaciones.length - 2} más...
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {aulaInfo.clases.length} clase{aulaInfo.clases.length !== 1 ? 's' : ''}
                      </p>
                      {aulaInfo.recuperaciones && aulaInfo.recuperaciones.length > 0 && (
                        <p className="text-xs font-medium text-orange-600">
                          {aulaInfo.recuperaciones.length} recuperación{aulaInfo.recuperaciones.length !== 1 ? 'es' : ''}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        {aulaInfo.estudiantes || aulaInfo.clases[0]?.estudiantes || 0} estudiantes
                      </p>
                    </div>
                  </div>
                </div>
                )
              })
            ) : (
              <div className="px-6 py-8 text-center">
                <p className="text-sm text-gray-500">No tienes aulas asignadas</p>
              </div>
            )}
          </div>
          <div className="px-6 py-3 bg-gray-50 text-right">
            <button 
              onClick={() => router.push('/docente/horarios')}
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              Ver todos los horarios →
            </button>
          </div>
        </div>

        {/* Actividad Reciente */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Actividad Reciente</h3>
            <p className="text-sm text-gray-600">Últimas acciones realizadas</p>
          </div>
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="px-6 py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Cargando actividad...</p>
              </div>
            ) : actividadReciente.length > 0 ? (
              actividadReciente.map((actividad) => (
                <div key={actividad.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">
                        {actividad.icono}
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm text-gray-900">{actividad.descripcion}</p>
                      <p className="text-xs text-gray-500 mt-1">{actividad.tiempo}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center">
                <p className="text-sm text-gray-500">No hay actividad reciente</p>
              </div>
            )}
          </div>
          <div className="px-6 py-3 bg-gray-50 text-right">
            <button className="text-sm text-blue-600 hover:text-blue-500 font-medium">
              Ver toda la actividad →
            </button>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <button 
            onClick={() => router.push('/docente/asistencias')}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 text-left"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Tomar Asistencia</p>
                <p className="text-xs text-gray-500">Registrar asistencia de clase</p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => router.push('/docente/justificaciones')}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 text-left"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Revisar Justificaciones</p>
                <p className="text-xs text-gray-500">Aprobar o rechazar justificaciones</p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => router.push('/docente/retiros')}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 text-left"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Gestionar Retiros</p>
                <p className="text-xs text-gray-500">Solicitar y gestionar retiros</p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => router.push('/docente/horarios')}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 text-left"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Gestionar Horarios</p>
                <p className="text-xs text-gray-500">Ver horarios y ajustar tolerancias</p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => router.push('/docente/reportes')}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 text-left"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Generar Reportes</p>
                <p className="text-xs text-gray-500">Reportes de asistencia y retiros</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
