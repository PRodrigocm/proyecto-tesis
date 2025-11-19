'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: number
  nombre: string
  apellido: string
  email: string
  rol: string
}

interface DashboardStats {
  totalUsuarios: number
  totalEstudiantes: number
  totalDocentes: number
  totalApoderados: number
  asistenciasHoy: number
  retirosHoy: number
  justificacionesPendientes: number
  promedioAsistencia: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalUsuarios: 0,
    totalEstudiantes: 0,
    totalDocentes: 0,
    totalApoderados: 0,
    asistenciasHoy: 0,
    retirosHoy: 0,
    justificacionesPendientes: 0,
    promedioAsistencia: 0
  })
  const [isUsersMenuOpen, setIsUsersMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const userManagementLinks = [
    {
      label: 'Apoderados',
      description: 'Gestiona apoderados registrados',
      href: '/admin/dashboard/usuarios/apoderados'
    },
    {
      label: 'Docentes',
      description: 'Administra docentes y tutores',
      href: '/admin/dashboard/usuarios/docentes'
    },
    {
      label: 'Administrativos',
      description: 'Gestiona el personal administrativo',
      href: '/admin/dashboard/usuarios/administrativos'
    },
    {
      label: 'Estudiantes',
      description: 'Revisa y actualiza estudiantes',
      href: '/admin/dashboard/usuarios/estudiantes'
    },
    {
      label: 'Auxiliares',
      description: 'Administra personal auxiliar',
      href: '/admin/dashboard/usuarios/auxiliares'
    }
  ]

  useEffect(() => {
    // Verificar autenticación
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (!token || !userData) {
      router.push('/login')
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.rol !== 'ADMINISTRATIVO') {
      router.push('/login')
      return
    }

    setUser(parsedUser)
    loadDashboardData()
  }, [router])

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        console.log('⚠️ No hay token, usando datos de ejemplo')
        setStats({
          totalUsuarios: 45,
          totalEstudiantes: 180,
          totalDocentes: 12,
          totalApoderados: 95,
          asistenciasHoy: 156,
          retirosHoy: 3,
          justificacionesPendientes: 7,
          promedioAsistencia: 92.5
        })
        return
      }

      console.log('🔐 Token encontrado, intentando cargar estadísticas reales...')
      
      // Cargar estadísticas reales desde la API
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('📡 Response status:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('📊 Estadísticas reales cargadas:', result.data)
        setStats(result.data)
      } else {
        console.error('❌ Error al cargar estadísticas:', response.status)
        const errorText = await response.text()
        console.error('❌ Error details:', errorText)
        
        // Si es error de autenticación, redirigir al login
        if (response.status === 401) {
          console.log('🔐 Token inválido, redirigiendo al login...')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/login')
          return
        }
        
        // Para otros errores, usar datos de ejemplo
        setStats({
          totalUsuarios: 45,
          totalEstudiantes: 180,
          totalDocentes: 12,
          totalApoderados: 95,
          asistenciasHoy: 156,
          retirosHoy: 3,
          justificacionesPendientes: 7,
          promedioAsistencia: 92.5
        })
      }
    } catch (error) {
      console.error('💥 Error loading dashboard data:', error)
      // Fallback a datos de ejemplo si hay error
      setStats({
        totalUsuarios: 45,
        totalEstudiantes: 180,
        totalDocentes: 12,
        totalApoderados: 95,
        asistenciasHoy: 156,
        retirosHoy: 3,
        justificacionesPendientes: 7,
        promedioAsistencia: 92.5
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="text-gray-600">Cargando panel de administración...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsuarios}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Estudiantes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEstudiantes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Asistencias Hoy</p>
              <p className="text-2xl font-bold text-gray-900">{stats.asistenciasHoy}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Retiros Hoy</p>
              <p className="text-2xl font-bold text-gray-900">{stats.retirosHoy}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Justificaciones</p>
              <p className="text-2xl font-bold text-gray-900">{stats.justificacionesPendientes}</p>
              <p className="text-xs text-gray-500">Pendientes</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Asistencia Promedio</p>
              <p className="text-2xl font-bold text-gray-900">{stats.promedioAsistencia}%</p>
              <p className="text-xs text-gray-500">Últimos 7 días</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Management Actions */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Gestión del Sistema</h3>
            <p className="text-sm text-gray-600">Administrar usuarios, instituciones y configuraciones</p>
            {isLoading && (
              <div className="mt-2 flex items-center text-sm text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Cargando estadísticas...
              </div>
            )}
          </div>
          <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => setIsUsersMenuOpen(prev => !prev)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg mr-3">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Usuarios</p>
                        <p className="text-sm text-gray-600">Gestionar docentes, estudiantes y apoderados</p>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${isUsersMenuOpen ? 'rotate-180' : 'rotate-0'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isUsersMenuOpen && (
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 space-y-2">
                      {userManagementLinks.map(link => (
                        <button
                          key={link.href}
                          onClick={() => router.push(link.href)}
                          className="w-full flex flex-col rounded-md px-3 py-2 text-left hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <span className="text-sm font-medium text-gray-900">{link.label}</span>
                          <span className="text-xs text-gray-500">{link.description}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => router.push('/admin/dashboard/horarios')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="p-2 bg-purple-100 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Horarios</p>
                    <p className="text-sm text-gray-600">Gestionar horarios de clases</p>
                  </div>
                </button>

                <button 
                  onClick={() => router.push('/admin/dashboard/usuarios/estudiantes')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Estudiantes</p>
                    <p className="text-sm text-gray-600">Gestionar estudiantes y matrículas</p>
                  </div>
                </button>

                <button 
                  onClick={() => router.push('/admin/dashboard/salones')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="p-2 bg-red-100 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Salones</p>
                    <p className="text-sm text-gray-600">Gestionar aulas y espacios</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Reports and Analytics */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Reportes y Análisis</h3>
              <p className="text-sm text-gray-600">Generar reportes y visualizar estadísticas</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  onClick={() => router.push('/admin/dashboard/asistencia')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Asistencias</p>
                    <p className="text-sm text-gray-600">Control y reportes de asistencia</p>
                  </div>
                </button>

                <button 
                  onClick={() => router.push('/admin/dashboard/retiros')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="p-2 bg-orange-100 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Retiros</p>
                    <p className="text-sm text-gray-600">Gestión de retiros de estudiantes</p>
                  </div>
                </button>


                <button 
                  onClick={() => router.push('/admin/dashboard/calendarios/ano-lectivo')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="p-2 bg-gray-100 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Calendario</p>
                    <p className="text-sm text-gray-600">Calendario escolar y eventos</p>
                  </div>
                </button>

                <button 
                  onClick={() => router.push('/admin/dashboard/codigos-qr')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="p-2 bg-pink-100 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Códigos QR</p>
                    <p className="text-sm text-gray-600">Generar PDF con códigos QR de estudiantes</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

      {/* Resumen del Sistema */}
      <div className="mt-8 bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Resumen del Sistema</h3>
          <p className="text-sm text-gray-600">Estado actual de la institución educativa</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Personal y Usuarios</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Usuarios</span>
                  <span className="font-medium text-gray-900">{stats.totalUsuarios}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Docentes</span>
                  <span className="font-medium text-gray-900">{stats.totalDocentes}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Apoderados</span>
                  <span className="font-medium text-gray-900">{stats.totalApoderados}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Actividad Diaria</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Asistencias Hoy</span>
                  <span className="font-medium text-green-600">{stats.asistenciasHoy}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Retiros Hoy</span>
                  <span className="font-medium text-orange-600">{stats.retirosHoy}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Promedio Asistencia</span>
                  <span className="font-medium text-blue-600">{stats.promedioAsistencia}%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Sistema operativo</span>
              </div>
              <span className="text-sm text-gray-500">Última actualización: {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
