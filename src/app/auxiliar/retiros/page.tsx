'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

interface Retiro {
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
  estado: 'PENDIENTE' | 'AUTORIZADO' | 'RECHAZADO'
  apoderadoQueRetira?: string
  autorizadoPor?: string
  observaciones?: string
}

export default function RetirosGestion() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [retiros, setRetiros] = useState<Retiro[]>([])
  const [filteredRetiros, setFilteredRetiros] = useState<Retiro[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEstado, setSelectedEstado] = useState('')
  const [selectedFecha, setSelectedFecha] = useState('')
  const [stats, setStats] = useState({
    pendientes: 0,
    autorizados: 0,
    rechazados: 0,
    total: 0
  })

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token')
      const userString = localStorage.getItem('user')
      
      if (!token || !userString) {
        router.push('/login')
        return
      }

      const user = JSON.parse(userString)
      if (!['AUXILIAR', 'ADMINISTRATIVO'].includes(user.rol)) {
        router.push('/login')
        return
      }

      loadRetiros()
      setLoading(false)
    }

    checkAuth()

    // Recargar datos cada 30 segundos para mantener KPIs actualizados
    const interval = setInterval(() => {
      loadRetiros()
    }, 30000)

    return () => clearInterval(interval)
  }, [router])

  const loadRetiros = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auxiliar/retiros', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setRetiros(data.retiros)
        setFilteredRetiros(data.retiros)
        calculateStats(data.retiros)
      }
    } catch (error) {
      console.error('Error loading retiros:', error)
    }
  }

  const calculateStats = (retirosList: Retiro[]) => {
    const pendientes = retirosList.filter(r => r.estado === 'PENDIENTE').length
    const autorizados = retirosList.filter(r => r.estado === 'AUTORIZADO').length
    const rechazados = retirosList.filter(r => r.estado === 'RECHAZADO').length
    
    setStats({
      pendientes,
      autorizados,
      rechazados,
      total: retirosList.length
    })
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    filterRetiros(term, selectedEstado, selectedFecha)
  }

  const handleEstadoChange = (estado: string) => {
    setSelectedEstado(estado)
    filterRetiros(searchTerm, estado, selectedFecha)
  }

  const handleFechaChange = (fecha: string) => {
    setSelectedFecha(fecha)
    filterRetiros(searchTerm, selectedEstado, fecha)
  }

  const filterRetiros = (term: string, estado: string, fecha: string) => {
    let filtered = retiros

    if (term) {
      filtered = filtered.filter(r => 
        r.estudiante.nombre.toLowerCase().includes(term.toLowerCase()) ||
        r.estudiante.apellido.toLowerCase().includes(term.toLowerCase()) ||
        r.estudiante.dni.includes(term) ||
        r.motivo.toLowerCase().includes(term.toLowerCase())
      )
    }

    if (estado) {
      filtered = filtered.filter(r => r.estado === estado)
    }

    if (fecha) {
      filtered = filtered.filter(r => r.fechaRetiro === fecha)
    }

    setFilteredRetiros(filtered)
    calculateStats(filtered)
  }

  const eliminarRetiro = async (retiroId: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este retiro?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/auxiliar/retiros/${retiroId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        alert('✅ Retiro eliminado exitosamente')
        loadRetiros()
      } else {
        const error = await response.json()
        alert(`❌ Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting retiro:', error)
      alert('❌ Error al eliminar retiro')
    }
  }

  const getEstadoBadge = (estado: string) => {
    const badges = {
      'PENDIENTE': 'bg-yellow-100 text-yellow-800',
      'AUTORIZADO': 'bg-green-100 text-green-800',
      'RECHAZADO': 'bg-red-100 text-red-800'
    }
    return badges[estado as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return <ClockIcon className="h-4 w-4" />
      case 'AUTORIZADO':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'RECHAZADO':
        return <XCircleIcon className="h-4 w-4" />
      default:
        return <ClockIcon className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-black">Cargando gestión de retiros...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:px-8">
      {/* Header Actions - Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Gestión de Retiros
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 hidden sm:block">
            Administra los retiros de estudiantes
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => loadRetiros()}
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 min-h-[44px]"
          >
            <svg className="h-4 w-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">Actualizar</span>
          </button>
          <Link
            href="/auxiliar/retiros/crear"
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 sm:px-4 py-2.5 sm:py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 min-h-[44px]"
          >
            <PlusIcon className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Nuevo </span>Retiro
          </Link>
        </div>
      </div>
        {/* Stats Cards - Compactas en móvil */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 md:mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-2 sm:p-3 md:p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
                </div>
                <div className="ml-2 sm:ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Pendientes</dt>
                    <dd className="text-base sm:text-lg font-bold text-yellow-600">{stats.pendientes}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-2 sm:p-3 md:p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <div className="ml-2 sm:ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Autorizados</dt>
                    <dd className="text-base sm:text-lg font-bold text-green-600">{stats.autorizados}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-2 sm:p-3 md:p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                </div>
                <div className="ml-2 sm:ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Rechazados</dt>
                    <dd className="text-base sm:text-lg font-bold text-red-600">{stats.rechazados}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-2 sm:p-3 md:p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FunnelIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div className="ml-2 sm:ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total</dt>
                    <dd className="text-base sm:text-lg font-bold text-blue-600">{stats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters - Responsive */}
        <div className="bg-white shadow rounded-lg mb-4 md:mb-8">
          <div className="p-3 sm:p-4 md:p-6">
            <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900 mb-3 md:mb-4">Filtros</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Buscar
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Nombre, DNI..."
                    className="block w-full pl-9 pr-3 py-2.5 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black text-base sm:text-sm min-h-[44px]"
                  />
                  <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 absolute left-3 top-3 sm:top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={selectedEstado}
                  onChange={(e) => handleEstadoChange(e.target.value)}
                  className="block w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black text-base sm:text-sm min-h-[44px]"
                >
                  <option value="">Todos</option>
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="AUTORIZADO">Autorizado</option>
                  <option value="RECHAZADO">Rechazado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={selectedFecha}
                  onChange={(e) => handleFechaChange(e.target.value)}
                  className="block w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black text-base sm:text-sm min-h-[44px]"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedEstado('')
                    setSelectedFecha('')
                    setFilteredRetiros(retiros)
                    calculateStats(retiros)
                  }}
                  className="w-full inline-flex justify-center items-center px-3 py-2.5 sm:py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 min-h-[44px]"
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Retiros - Vista de tarjetas en móvil, tabla en desktop */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-3 sm:p-4 md:p-6">
            <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900 mb-3 md:mb-4">
              Retiros ({filteredRetiros.length})
            </h3>
            
            {/* Vista de tarjetas en móvil */}
            <div className="block md:hidden space-y-3">
              {filteredRetiros.map((retiro) => (
                <div key={retiro.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">
                        {retiro.estudiante.apellido}, {retiro.estudiante.nombre}
                      </p>
                      <p className="text-xs text-gray-500">
                        {retiro.estudiante.grado}° {retiro.estudiante.seccion}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEstadoBadge(retiro.estado)}`}>
                      {getEstadoIcon(retiro.estado)}
                      <span className="ml-1">{retiro.estado}</span>
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mb-2">
                    <span className="font-medium">{retiro.tipoRetiro}</span> - {retiro.fechaRetiro} {retiro.horaRetiro}
                  </div>
                  <div className="text-xs text-gray-500 mb-3 line-clamp-2">
                    {retiro.motivo}
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <Link
                      href={`/auxiliar/retiros/ver/${retiro.id}`}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 min-h-[40px]"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Ver
                    </Link>
                    {['PENDIENTE', 'AUTORIZADO'].includes(retiro.estado) && (
                      <Link
                        href={`/auxiliar/retiros/editar/${retiro.id}`}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 min-h-[40px]"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Editar
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Tabla en desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estudiante
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo/Motivo
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha/Hora
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Apoderado
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRetiros.map((retiro) => (
                    <tr key={retiro.id} className="hover:bg-gray-50">
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {retiro.estudiante.apellido}, {retiro.estudiante.nombre}
                          </div>
                          <div className="text-xs lg:text-sm text-gray-500">
                            {retiro.estudiante.grado}° {retiro.estudiante.seccion}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4">
                        <div className="text-sm text-gray-900 font-medium">
                          {retiro.tipoRetiro}
                        </div>
                        <div className="text-xs lg:text-sm text-gray-500 max-w-[150px] lg:max-w-xs truncate">
                          {retiro.motivo}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{retiro.fechaRetiro}</div>
                        <div className="text-xs">{retiro.horaRetiro}</div>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEstadoBadge(retiro.estado)}`}>
                          {getEstadoIcon(retiro.estado)}
                          <span className="ml-1">{retiro.estado}</span>
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                        {retiro.apoderadoQueRetira || '-'}
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/auxiliar/retiros/ver/${retiro.id}`}
                            className="inline-flex items-center px-2 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 hover:bg-gray-50"
                          >
                            <EyeIcon className="h-3.5 w-3.5" />
                          </Link>
                          {['PENDIENTE', 'AUTORIZADO'].includes(retiro.estado) && (
                            <Link
                              href={`/auxiliar/retiros/editar/${retiro.id}`}
                              className="inline-flex items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                              <PencilIcon className="h-3.5 w-3.5" />
                            </Link>
                          )}
                          {retiro.estado === 'PENDIENTE' && (
                            <button
                              onClick={() => eliminarRetiro(retiro.id)}
                              className="inline-flex items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
    </div>
  )
}
