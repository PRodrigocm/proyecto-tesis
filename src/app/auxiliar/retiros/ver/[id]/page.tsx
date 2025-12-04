'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

interface RetiroDetalle {
  id: string
  estudiante: {
    nombre: string
    apellido: string
    dni: string
    grado: string
    seccion: string
  }
  tipoRetiro: string
  fechaRetiro: string
  horaRetiro: string
  motivo: string
  estado: 'PENDIENTE' | 'AUTORIZADO' | 'RECHAZADO' | 'COMPLETADO'
  apoderadoQueRetira?: string
  verificadoPor?: string
  observaciones?: string
}

export default function VerRetiroPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [retiro, setRetiro] = useState<RetiroDetalle | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token')
      const userString = localStorage.getItem('user')
      
      if (!token || !userString) {
        router.push('/login')
        return false
      }

      const user = JSON.parse(userString)
      if (!['AUXILIAR', 'ADMINISTRATIVO'].includes(user.rol)) {
        router.push('/login')
        return false
      }

      return true
    }

    if (checkAuth() && params.id) {
      loadRetiro(params.id as string)
    }
  }, [router, params.id])

  const loadRetiro = async (id: string) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/auxiliar/retiros/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setRetiro(data.retiro)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al cargar el retiro')
      }
    } catch (error) {
      console.error('Error loading retiro:', error)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    const badges = {
      'PENDIENTE': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'AUTORIZADO': 'bg-green-100 text-green-800 border-green-200',
      'RECHAZADO': 'bg-red-100 text-red-800 border-red-200',
      'COMPLETADO': 'bg-blue-100 text-blue-800 border-blue-200'
    }
    return badges[estado as keyof typeof badges] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return <ClockIcon className="h-5 w-5" />
      case 'AUTORIZADO':
      case 'COMPLETADO':
        return <CheckCircleIcon className="h-5 w-5" />
      case 'RECHAZADO':
        return <XCircleIcon className="h-5 w-5" />
      default:
        return <ClockIcon className="h-5 w-5" />
    }
  }

  const getEstadoTexto = (estado: string) => {
    const textos = {
      'PENDIENTE': 'Pendiente de autorización',
      'AUTORIZADO': 'Autorizado',
      'RECHAZADO': 'Rechazado',
      'COMPLETADO': 'Completado'
    }
    return textos[estado as keyof typeof textos] || estado
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-orange-200 rounded-full animate-spin border-t-orange-600 mx-auto"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Cargando retiro...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/auxiliar/retiros"
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Volver a retiros
          </Link>
        </div>
      </div>
    )
  }

  if (!retiro) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Retiro no encontrado</h2>
          <Link
            href="/auxiliar/retiros"
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Volver a retiros
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link
            href="/auxiliar/retiros"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Volver a retiros
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Detalle del Retiro
          </h1>
        </div>
        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${getEstadoBadge(retiro.estado)}`}>
          {getEstadoIcon(retiro.estado)}
          <span className="ml-2">{getEstadoTexto(retiro.estado)}</span>
        </span>
      </div>

      {/* Contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información del Estudiante */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-blue-100 rounded-lg">
              <UserIcon className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Estudiante</h2>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Nombre completo</p>
              <p className="text-base font-medium text-gray-900">
                {retiro.estudiante.apellido}, {retiro.estudiante.nombre}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">DNI</p>
              <p className="text-base font-medium text-gray-900">{retiro.estudiante.dni}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Grado y Sección</p>
              <p className="text-base font-medium text-gray-900">
                {retiro.estudiante.grado}° {retiro.estudiante.seccion}
              </p>
            </div>
          </div>
        </div>

        {/* Información del Retiro */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-orange-100 rounded-lg">
              <CalendarIcon className="h-5 w-5 text-orange-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Información del Retiro</h2>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Tipo de Retiro</p>
              <p className="text-base font-medium text-gray-900">{retiro.tipoRetiro}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Fecha</p>
                <p className="text-base font-medium text-gray-900">{retiro.fechaRetiro}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Hora</p>
                <p className="text-base font-medium text-gray-900">{retiro.horaRetiro}</p>
              </div>
            </div>
            {retiro.apoderadoQueRetira && (
              <div>
                <p className="text-sm text-gray-500">Apoderado que retira</p>
                <p className="text-base font-medium text-gray-900">{retiro.apoderadoQueRetira}</p>
              </div>
            )}
            {retiro.verificadoPor && (
              <div>
                <p className="text-sm text-gray-500">Verificado por</p>
                <p className="text-base font-medium text-gray-900">{retiro.verificadoPor}</p>
              </div>
            )}
          </div>
        </div>

        {/* Observaciones */}
        {retiro.observaciones && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-gray-100 rounded-lg">
                <DocumentTextIcon className="h-5 w-5 text-gray-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Observaciones</h2>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">{retiro.observaciones}</p>
          </div>
        )}
      </div>
    </div>
  )
}
