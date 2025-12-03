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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-orange-200 rounded-full animate-spin border-t-orange-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Cargando retiros...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Gestión de Retiros
          </h1>
          <p className="mt-1 text-gray-500">
            Administra los retiros de estudiantes
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => loadRetiros()}
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2.5 border-2 border-gray-200 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors min-h-[44px]"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </button>
          <Link
            href="/auxiliar/retiros/crear"
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl transition-all min-h-[44px]"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuevo Retiro
          </Link>
        </div>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-100 rounded-lg">
              <ClockIcon className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendientes}</p>
              <p className="text-xs text-gray-500">Pendientes</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.autorizados}</p>
              <p className="text-xs text-gray-500">Autorizados</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-100 rounded-lg">
              <XCircleIcon className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.rechazados}</p>
              <p className="text-xs text-gray-500">Rechazados</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded-lg">
              <FunnelIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Nombre, DNI, motivo..."
                className="block w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black"
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <select
              value={selectedEstado}
              onChange={(e) => handleEstadoChange(e.target.value)}
              className="block w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black"
            >
              <option value="">Todos</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="AUTORIZADO">Autorizado</option>
              <option value="RECHAZADO">Rechazado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
            <input
              type="date"
              value={selectedFecha}
              onChange={(e) => handleFechaChange(e.target.value)}
              className="block w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black"
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
              className="w-full px-4 py-2.5 border-2 border-gray-200 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Retiros */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
          <h3 className="text-lg font-semibold text-white">
            Retiros ({filteredRetiros.length})
          </h3>
        </div>
        
        {/* Vista móvil - Tarjetas */}
        <div className="block md:hidden p-4 space-y-3">
          {filteredRetiros.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay retiros que mostrar
            </div>
          ) : (
            filteredRetiros.map((retiro) => (
              <div key={retiro.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {retiro.estudiante.apellido}, {retiro.estudiante.nombre}
                    </p>
                    <p className="text-sm text-gray-500">
                      {retiro.estudiante.grado}° {retiro.estudiante.seccion}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getEstadoBadge(retiro.estado)}`}>
                    {getEstadoIcon(retiro.estado)}
                    <span className="ml-1">{retiro.estado}</span>
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">{retiro.tipoRetiro}</span>
                  <span className="mx-2">•</span>
                  {retiro.fechaRetiro} {retiro.horaRetiro}
                </div>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{retiro.motivo}</p>
                <div className="flex gap-2 pt-3 border-t border-gray-200">
                  <Link
                    href={`/auxiliar/retiros/ver/${retiro.id}`}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border-2 border-gray-200 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    Ver
                  </Link>
                  {['PENDIENTE', 'AUTORIZADO'].includes(retiro.estado) && (
                    <Link
                      href={`/auxiliar/retiros/editar/${retiro.id}`}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Editar
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
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
  )
}
