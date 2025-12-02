'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import NotificacionesPanel from '@/components/apoderado/NotificacionesPanel'
import { 
  estudiantesService, 
  estadisticasService, 
  retirosService, 
  justificacionesService,
  type Estudiante,
  type RetiroPendiente,
  type InasistenciaPendiente,
  type Estadisticas
} from '@/services/apoderado.service'

export default function ApoderadoDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [retirosPendientes, setRetirosPendientes] = useState<RetiroPendiente[]>([])
  const [inasistenciasPendientes, setInasistenciasPendientes] = useState<InasistenciaPendiente[]>([])
  const [stats, setStats] = useState<Estadisticas>({
    totalEstudiantes: 0,
    retirosPendientes: 0,
    justificacionesPendientes: 0,
    asistenciaPromedio: 0
  })

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token')
      const userString = localStorage.getItem('user')
      
      if (!token || !userString) {
        router.push('/login')
        return false
      }

      try {
        const user = JSON.parse(userString)
        if (user.rol !== 'APODERADO') {
          router.push('/login')
          return false
        }
        return true
      } catch (error) {
        router.push('/login')
        return false
      }
    }

    if (checkAuth()) {
      loadDashboardData()
    }
  }, [router])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      
      // Cargar estudiantes del apoderado
      await Promise.all([
        loadEstudiantes(),
        loadRetirosPendientes(),
        loadInasistenciasPendientes(),
        loadEstadisticas()
      ])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadEstudiantes = async () => {
    try {
      const data = await estudiantesService.getAll()
      setEstudiantes(data)
    } catch (error) {
      console.error('Error loading estudiantes:', error)
    }
  }

  const loadRetirosPendientes = async () => {
    try {
      const data = await retirosService.getPendientes()
      setRetirosPendientes(data)
    } catch (error) {
      console.error('Error loading retiros pendientes:', error)
    }
  }

  const loadInasistenciasPendientes = async () => {
    try {
      const data = await justificacionesService.getPendientes()
      setInasistenciasPendientes(data)
    } catch (error) {
      console.error('Error loading inasistencias pendientes:', error)
    }
  }

  const loadEstadisticas = async () => {
    try {
      const data = await estadisticasService.get()
      setStats(data)
    } catch (error) {
      console.error('Error loading estadisticas:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">👨‍👩‍👧‍👦 Panel del Apoderado</h1>
        <p className="mt-1 text-xs sm:text-sm text-gray-600">
          Gestiona retiros y justificaciones de tus hijos
        </p>
      </div>

      {/* Estadísticas principales - Grid responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 overflow-hidden shadow-lg rounded-xl p-3 sm:p-4">
          <div className="flex flex-col items-center sm:flex-row sm:items-start">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center mb-2 sm:mb-0 sm:mr-3">
              <span className="text-xl sm:text-2xl">👨‍👩‍👧</span>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[10px] sm:text-xs text-blue-100 font-medium">Mis Hijos</p>
              <p className="text-2xl sm:text-3xl font-bold text-white">{stats.totalEstudiantes}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 overflow-hidden shadow-lg rounded-xl p-3 sm:p-4">
          <div className="flex flex-col items-center sm:flex-row sm:items-start">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center mb-2 sm:mb-0 sm:mr-3">
              <span className="text-xl sm:text-2xl">🚪</span>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[10px] sm:text-xs text-orange-100 font-medium">Retiros Pend.</p>
              <p className="text-2xl sm:text-3xl font-bold text-white">{stats.retirosPendientes}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 overflow-hidden shadow-lg rounded-xl p-3 sm:p-4">
          <div className="flex flex-col items-center sm:flex-row sm:items-start">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center mb-2 sm:mb-0 sm:mr-3">
              <span className="text-xl sm:text-2xl">📄</span>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[10px] sm:text-xs text-yellow-100 font-medium">Just. Pend.</p>
              <p className="text-2xl sm:text-3xl font-bold text-white">{stats.justificacionesPendientes}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 overflow-hidden shadow-lg rounded-xl p-3 sm:p-4">
          <div className="flex flex-col items-center sm:flex-row sm:items-start">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center mb-2 sm:mb-0 sm:mr-3">
              <span className="text-xl sm:text-2xl">📊</span>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[10px] sm:text-xs text-green-100 font-medium">Asistencia</p>
              <p className="text-2xl sm:text-3xl font-bold text-white">{stats.asistenciaPromedio}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas - Grid de botones grandes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-4 sm:mb-6">
        <button
          onClick={() => router.push('/apoderado/retiros/solicitar')}
          className="bg-white p-3 sm:p-4 rounded-xl shadow-md hover:shadow-lg active:bg-blue-50 transition-all border-2 border-transparent hover:border-blue-200 min-h-[90px] sm:min-h-[100px]"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-2">
              <span className="text-xl sm:text-2xl">🚪</span>
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-900">Solicitar Retiro</span>
          </div>
        </button>

        <button
          onClick={() => router.push('/apoderado/retiros/aprobar')}
          className="bg-white p-3 sm:p-4 rounded-xl shadow-md hover:shadow-lg active:bg-green-50 transition-all border-2 border-transparent hover:border-green-200 min-h-[90px] sm:min-h-[100px] relative"
        >
          {retirosPendientes.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {retirosPendientes.length}
            </span>
          )}
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center mb-2">
              <span className="text-xl sm:text-2xl">✅</span>
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-900">Aprobar Retiros</span>
          </div>
        </button>

        <button
          onClick={() => router.push('/apoderado/justificaciones')}
          className="bg-white p-3 sm:p-4 rounded-xl shadow-md hover:shadow-lg active:bg-yellow-50 transition-all border-2 border-transparent hover:border-yellow-200 min-h-[90px] sm:min-h-[100px] relative"
        >
          {inasistenciasPendientes.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-yellow-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {inasistenciasPendientes.length}
            </span>
          )}
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-2">
              <span className="text-xl sm:text-2xl">📝</span>
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-900">Justificar</span>
          </div>
        </button>

        <button
          onClick={() => router.push('/apoderado/asistencias')}
          className="bg-white p-3 sm:p-4 rounded-xl shadow-md hover:shadow-lg active:bg-indigo-50 transition-all border-2 border-transparent hover:border-indigo-200 min-h-[90px] sm:min-h-[100px]"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-2">
              <span className="text-xl sm:text-2xl">📋</span>
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-900">Asistencias</span>
          </div>
        </button>

        <button
          onClick={() => router.push('/apoderado/historial')}
          className="bg-white p-3 sm:p-4 rounded-xl shadow-md hover:shadow-lg active:bg-purple-50 transition-all border-2 border-transparent hover:border-purple-200 min-h-[90px] sm:min-h-[100px] col-span-2 sm:col-span-1"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-2">
              <span className="text-xl sm:text-2xl">📜</span>
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-900">Historial</span>
          </div>
        </button>
      </div>

      {/* Mis Hijos */}
      <div className="bg-white shadow-md rounded-xl overflow-hidden mb-4 sm:mb-6">
        <div className="px-3 sm:px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span>👨‍👩‍👧‍👦</span> Mis Hijos
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {estudiantes.length > 0 ? (
            estudiantes.map((estudiante) => (
              <div key={estudiante.id} className="p-3 sm:p-4 hover:bg-gray-50 active:bg-blue-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm sm:text-lg font-bold">
                      {estudiante.nombre[0]}{estudiante.apellido[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                      {estudiante.apellido}, {estudiante.nombre}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {estudiante.grado}° {estudiante.seccion} • DNI: {estudiante.dni}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="inline-flex items-center px-2 py-1 rounded-lg bg-blue-100 text-blue-800 text-[10px] sm:text-xs font-medium">
                      {estudiante.codigoEstudiante}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center">
              <span className="text-4xl mb-2 block">👨‍👩‍👧</span>
              <p className="text-gray-500 text-sm">No hay estudiantes registrados</p>
            </div>
          )}
        </div>
      </div>

      {/* Panel de Notificaciones */}
      <NotificacionesPanel />
    </div>
  )
}
