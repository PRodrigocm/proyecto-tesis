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
  estado: 'PENDIENTE' | 'AUTORIZADO' | 'RECHAZADO' | 'COMPLETADO'
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
    completados: 0,
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
    const completados = retirosList.filter(r => r.estado === 'COMPLETADO').length
    const rechazados = retirosList.filter(r => r.estado === 'RECHAZADO').length
    
    setStats({
      pendientes,
      autorizados,
      completados,
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
      'AUTORIZADO': 'bg-blue-100 text-blue-800',
      'COMPLETADO': 'bg-green-100 text-green-800',
      'RECHAZADO': 'bg-red-100 text-red-800'
    }
    return badges[estado as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return <ClockIcon className="h-4 w-4" />
      case 'AUTORIZADO':
      case 'COMPLETADO':
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
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Retiros
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Crear, editar y gestionar retiros de estudiantes
          </p>
        </div>
        <Link
          href="/auxiliar/retiros/crear"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Crear Retiro
        </Link>
      </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pendientes</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.pendientes}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Autorizados</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.autorizados}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Completados</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.completados}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XCircleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Rechazados</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.rechazados}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FunnelIcon className="h-6 w-6 text-gray-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Filtros</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Nombre, DNI o motivo"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={selectedEstado}
                  onChange={(e) => handleEstadoChange(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos los estados</option>
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="AUTORIZADO">Autorizado</option>
                  <option value="COMPLETADO">Completado</option>
                  <option value="RECHAZADO">Rechazado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={selectedFecha}
                  onChange={(e) => handleFechaChange(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Retiros Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Lista de Retiros ({filteredRetiros.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estudiante
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo/Motivo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha/Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Apoderado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRetiros.map((retiro) => (
                    <tr key={retiro.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {retiro.estudiante.apellido}, {retiro.estudiante.nombre}
                          </div>
                          <div className="text-sm text-gray-500">
                            {retiro.estudiante.grado}° {retiro.estudiante.seccion} - DNI: {retiro.estudiante.dni}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium">
                          {retiro.tipoRetiro}
                        </div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {retiro.motivo}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{retiro.fechaRetiro}</div>
                        <div>{retiro.horaRetiro}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoBadge(retiro.estado)}`}>
                          {getEstadoIcon(retiro.estado)}
                          <span className="ml-1">{retiro.estado}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {retiro.apoderadoQueRetira || 'No especificado'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Link
                          href={`/auxiliar/retiros/ver/${retiro.id}`}
                          className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-600 hover:text-blue-900"
                        >
                          <EyeIcon className="h-3 w-3 mr-1" />
                          Ver
                        </Link>
                        {['PENDIENTE', 'AUTORIZADO'].includes(retiro.estado) && (
                          <Link
                            href={`/auxiliar/retiros/editar/${retiro.id}`}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-indigo-600 hover:text-indigo-900"
                          >
                            <PencilIcon className="h-3 w-3 mr-1" />
                            Editar
                          </Link>
                        )}
                        {retiro.estado === 'PENDIENTE' && (
                          <button
                            onClick={() => eliminarRetiro(retiro.id)}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-3 w-3 mr-1" />
                            Eliminar
                          </button>
                        )}
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
