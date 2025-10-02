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
  DocumentTextIcon
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
  const [stats, setStats] = useState<DashboardStats>({
    estudiantesPresentes: 0,
    estudiantesAusentes: 0,
    retirosHoy: 0,
    estudiantesEnIE: 0,
    toleranciaPromedio: 10,
    alertasTolerancia: 0
  })

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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-black">Cargando panel auxiliar...</span>
        </div>
      </div>
    )
  }

  const menuItems = [
    {
      title: 'Control de Asistencia',
      description: 'Registrar entrada y salida de estudiantes',
      href: '/auxiliar/asistencia',
      icon: ClockIcon,
      color: 'bg-blue-500',
      stats: `${stats.estudiantesPresentes} presentes hoy`
    },
    {
      title: 'Gestión de Retiros',
      description: 'Crear, editar y gestionar retiros de estudiantes',
      href: '/auxiliar/retiros',
      icon: ArrowRightOnRectangleIcon,
      color: 'bg-orange-500',
      stats: `${stats.retirosHoy} retiros hoy`
    },
    {
      title: 'Control de Tolerancia',
      description: 'Ajustar tiempos de tolerancia por aula',
      href: '/auxiliar/tolerancia',
      icon: CogIcon,
      color: 'bg-purple-500',
      stats: `${stats.toleranciaPromedio} min promedio`
    },
    {
      title: 'Reportes',
      description: 'Generar reportes de asistencia y retiros',
      href: '/auxiliar/reportes',
      icon: DocumentTextIcon,
      color: 'bg-indigo-500',
      stats: 'Reportes disponibles'
    }
  ]

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Estudiantes Presentes
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.estudiantesPresentes}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowRightOnRectangleIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Retiros Hoy
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.retirosHoy}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    En IE Ahora
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.estudiantesEnIE}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Alertas Tolerancia
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.alertasTolerancia}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-orange-500 rounded-lg shadow hover:shadow-md transition-shadow duration-200"
          >
            <div>
              <span className={`rounded-lg inline-flex p-3 ${item.color} text-white ring-4 ring-white`}>
                <item.icon className="h-6 w-6" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 group-hover:text-orange-600">
                <span className="absolute inset-0" aria-hidden="true" />
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {item.description}
              </p>
              <p className="mt-2 text-xs font-medium text-orange-600">
                {item.stats}
              </p>
            </div>
            <span
              className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400"
              aria-hidden="true"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="m11.293 17.293 1.414 1.414L19.414 12l-6.707-6.707-1.414 1.414L15.586 11H5v2h10.586l-4.293 4.293z" />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
