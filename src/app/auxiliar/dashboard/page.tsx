'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  UserGroupIcon,
  ClockIcon,
  ArrowRightOnRectangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CogIcon,
  DocumentTextIcon,
  QrCodeIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline'

interface DashboardStats {
  estudiantesPresentes: number
  estudiantesAusentes: number
  retirosHoy: number
  estudiantesEnIE: number
  toleranciaPromedio: number
  alertasTolerancia: number
}

export default function AuxiliarDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [stats, setStats] = useState<DashboardStats>({
    estudiantesPresentes: 0,
    estudiantesAusentes: 0,
    retirosHoy: 0,
    estudiantesEnIE: 0,
    toleranciaPromedio: 10,
    alertasTolerancia: 0
  })

  // Actualizar hora cada segundo
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token')
        const userString = localStorage.getItem('user')
        
        if (!token) {
          console.log('❌ No hay token, redirigiendo al login')
          router.push('/login')
          return
        }

        if (userString) {
          const user = JSON.parse(userString)
          console.log('👤 Usuario auxiliar:', user)
          
          if (!['AUXILIAR', 'ADMINISTRATIVO'].includes(user.rol)) {
            console.log('❌ Usuario no tiene permisos de auxiliar:', user.rol)
            router.push('/login')
            return
          }
          
          setUserInfo(user)
          loadDashboardStats()
        } else {
          console.log('❌ No hay información de usuario')
          router.push('/login')
          return
        }
        
        console.log('✅ Autenticación de auxiliar verificada correctamente')
        setLoading(false)
      } catch (error) {
        console.error('❌ Error al verificar autenticación:', error)
        router.push('/login')
      }
    }

    checkAuth()
  }, [router])

  const loadDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auxiliar/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-orange-200 rounded-full animate-spin border-t-orange-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Cargando panel...</p>
        </div>
      </div>
    )
  }

  const quickActions = [
    {
      title: 'Escanear QR',
      description: 'Registrar asistencia',
      href: '/auxiliar/asistencia',
      icon: QrCodeIcon,
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      title: 'Nuevo Retiro',
      description: 'Registrar salida',
      href: '/auxiliar/retiros/crear',
      icon: ArrowRightOnRectangleIcon,
      gradient: 'from-orange-500 to-amber-600'
    }
  ]

  const menuItems = [
    {
      title: 'Control de Asistencia',
      description: 'Registrar entrada y salida de estudiantes mediante QR',
      href: '/auxiliar/asistencia',
      icon: ClockIcon,
      gradient: 'from-blue-500 to-indigo-600',
      stats: stats.estudiantesPresentes,
      statsLabel: 'presentes hoy'
    },
    {
      title: 'Gestión de Retiros',
      description: 'Administrar retiros y salidas anticipadas',
      href: '/auxiliar/retiros',
      icon: ArrowRightOnRectangleIcon,
      gradient: 'from-orange-500 to-red-500',
      stats: stats.retirosHoy,
      statsLabel: 'retiros hoy'
    },
    {
      title: 'Control de Tolerancia',
      description: 'Configurar tiempos de tolerancia por aula',
      href: '/auxiliar/tolerancia',
      icon: CogIcon,
      gradient: 'from-purple-500 to-pink-600',
      stats: stats.toleranciaPromedio,
      statsLabel: 'min promedio'
    },
    {
      title: 'Reportes',
      description: 'Generar y exportar reportes de asistencia',
      href: '/auxiliar/reportes',
      icon: DocumentTextIcon,
      gradient: 'from-teal-500 to-cyan-600',
      stats: null,
      statsLabel: 'PDF, Excel, Word'
    }
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header con fecha y hora */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Panel de Control
          </h1>
          <p className="text-gray-500 mt-1">
            Gestión de asistencia escolar
          </p>
        </div>
        <div className="flex items-center gap-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-3 rounded-xl shadow-lg">
          <CalendarDaysIcon className="h-5 w-5" />
          <div className="text-sm">
            <p className="font-semibold capitalize">
              {currentTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <p className="text-orange-100 text-lg font-mono">
              {currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quickActions.map((action, index) => (
          <Link
            key={index}
            href={action.href}
            className={`group relative overflow-hidden bg-gradient-to-br ${action.gradient} p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                <action.icon className="h-7 w-7 text-white" />
              </div>
              <div className="text-white flex-1">
                <h3 className="text-lg font-bold">{action.title}</h3>
                <p className="text-white/80 text-sm">{action.description}</p>
              </div>
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded-lg">
              <UserGroupIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.estudiantesPresentes}</p>
              <p className="text-xs text-gray-500">Presentes</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-100 rounded-lg">
              <ArrowRightOnRectangleIcon className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.retirosHoy}</p>
              <p className="text-xs text-gray-500">Retiros hoy</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.estudiantesEnIE}</p>
              <p className="text-xs text-gray-500">En IE ahora</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-100 rounded-lg">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.alertasTolerancia}</p>
              <p className="text-xs text-gray-500">Alertas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className="group bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-lg hover:border-orange-200 transition-all duration-300"
          >
            <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${item.gradient} shadow-lg mb-4`}>
              <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
              {item.title}
            </h3>
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
              {item.description}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm font-medium text-orange-600">
                {item.stats !== null ? `${item.stats} ${item.statsLabel}` : item.statsLabel}
              </span>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
