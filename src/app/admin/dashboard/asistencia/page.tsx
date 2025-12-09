'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

interface Grado {
  id: string
  nombre: string
}

interface Seccion {
  id: string
  nombre: string
}

interface Estudiante {
  id: string
  nombre: string
  apellido: string
  dni: string
  grado: string
  seccion: string
  aula?: string
  nivel?: string
  codigoQR?: string
  estado: 'PRESENTE' | 'AUSENTE' | 'RETIRADO' | 'TARDANZA' | 'JUSTIFICADO' | 'SIN_REGISTRAR'
  horaEntrada?: string
  horaSalida?: string
  asistenciaAula?: boolean
}

interface DetalleAsistencia {
  estudiante: {
    id: number
    nombre: string
    apellido: string
    dni: string
    grado: string
    seccion: string
  }
  fecha: string
  asistenciaAula: {
    id: number
    estado: string
    estadoNombre: string
    horaRegistro: string | null
    fechaRegistro: string | null
    registradoPor: {
      id: number
      nombre: string
      apellido: string
      rol: string
    } | null
    observaciones: string | null
  } | null
  asistenciaIE: {
    id: number
    estado: string
    horaIngreso: string | null
    horaSalida: string | null
    fechaRegistroIngreso: string | null
    registradoIngresoPor: {
      id: number
      nombre: string
      apellido: string
      rol: string
    } | null
    registradoSalidaPor: {
      id: number
      nombre: string
      apellido: string
      rol: string
    } | null
  } | null
  historialCambios: {
    id: number
    estadoAnterior: string
    estadoCodigo: string
    fechaCambio: string
    cambiadoPor: {
      id: number
      nombre: string
      apellido: string
    } | null
  }[]
  tieneAsistenciaAula: boolean
  tieneAsistenciaIE: boolean
  fueEditada: boolean
}

export default function AdminAsistenciaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [filteredEstudiantes, setFilteredEstudiantes] = useState<Estudiante[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGrado, setSelectedGrado] = useState('')
  const [selectedSeccion, setSelectedSeccion] = useState('')
  const [selectedEstado, setSelectedEstado] = useState('')
  const [selectedFecha, setSelectedFecha] = useState(new Date().toISOString().split('T')[0])
  const [grados, setGrados] = useState<Grado[]>([])
  const [secciones, setSecciones] = useState<Seccion[]>([])
  const [stats, setStats] = useState({
    presentes: 0,
    tardanzas: 0,
    ausentes: 0,
    retirados: 0,
    justificados: 0,
    sinRegistrar: 0,
    total: 0
  })
  const [showDetalleModal, setShowDetalleModal] = useState(false)
  const [detalleAsistencia, setDetalleAsistencia] = useState<DetalleAsistencia | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token')
      const userString = localStorage.getItem('user')
      
      if (!token || !userString) {
        router.push('/login')
        return
      }

      try {
        const user = JSON.parse(userString)
        if (user.rol !== 'ADMINISTRATIVO') {
          router.push('/unauthorized')
          return
        }
      } catch (error) {
        router.push('/login')
      }
    }

    checkAuth()
    loadGrados()
  }, [router])

  // Cargar estudiantes cuando cambia la fecha, grado o sección
  useEffect(() => {
    loadEstudiantes()
  }, [selectedFecha, selectedGrado, selectedSeccion])

  useEffect(() => {
    filterEstudiantes()
  }, [estudiantes, searchTerm, selectedGrado, selectedSeccion, selectedEstado])

  useEffect(() => {
    if (selectedGrado) {
      loadSecciones(selectedGrado)
    } else {
      setSecciones([])
      setSelectedSeccion('')
    }
  }, [selectedGrado])

  const loadGrados = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/grados', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setGrados(data.grados || [])
      }
    } catch (error) {
      console.error('Error loading grados:', error)
    }
  }

  const loadSecciones = async (gradoId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/secciones?gradoId=${gradoId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setSecciones(data.secciones || [])
      }
    } catch (error) {
      console.error('Error loading secciones:', error)
    }
  }

  const loadEstudiantes = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({ fecha: selectedFecha })
      if (selectedGrado) params.append('grado', selectedGrado)
      if (selectedSeccion) params.append('seccion', selectedSeccion)

      const response = await fetch(`/api/asistencia/estudiantes?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setEstudiantes(data.estudiantes || [])
        calculateStats(data.estudiantes || [])
      }
    } catch (error) {
      console.error('Error loading estudiantes:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterEstudiantes = () => {
    let filtered = [...estudiantes]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(e =>
        e.nombre.toLowerCase().includes(term) ||
        e.apellido.toLowerCase().includes(term) ||
        e.dni.includes(term)
      )
    }

    if (selectedEstado) {
      filtered = filtered.filter(e => e.estado === selectedEstado)
    }

    setFilteredEstudiantes(filtered)
  }

  const calculateStats = (data: Estudiante[]) => {
    setStats({
      presentes: data.filter(e => e.estado === 'PRESENTE').length,
      tardanzas: data.filter(e => e.estado === 'TARDANZA').length,
      ausentes: data.filter(e => e.estado === 'AUSENTE').length,
      retirados: data.filter(e => e.estado === 'RETIRADO').length,
      justificados: data.filter(e => e.estado === 'JUSTIFICADO').length,
      sinRegistrar: data.filter(e => e.estado === 'SIN_REGISTRAR').length,
      total: data.length
    })
  }

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, string> = {
      'PRESENTE': 'bg-green-100 text-green-800',
      'TARDANZA': 'bg-yellow-100 text-yellow-800',
      'AUSENTE': 'bg-red-100 text-red-800',
      'RETIRADO': 'bg-blue-100 text-blue-800',
      'JUSTIFICADO': 'bg-purple-100 text-purple-800',
      'INASISTENCIA': 'bg-red-100 text-red-800',
      'SIN_REGISTRAR': 'bg-gray-100 text-gray-800'
    }
    return badges[estado] || 'bg-gray-100 text-gray-800'
  }

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      'PRESENTE': 'Presente',
      'TARDANZA': 'Tardanza',
      'AUSENTE': 'Ausente',
      'RETIRADO': 'Retirado',
      'JUSTIFICADO': 'Justificado',
      'INASISTENCIA': 'Inasistencia',
      'SIN_REGISTRAR': 'Sin registrar'
    }
    return labels[estado] || estado
  }

  const handleVerDetalle = async (estudiante: Estudiante) => {
    setLoadingDetalle(true)
    setShowDetalleModal(true)
    setDetalleAsistencia(null)
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `/api/asistencia/detalle?estudianteId=${estudiante.id}&fecha=${selectedFecha}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      )
      
      if (response.ok) {
        const data = await response.json()
        setDetalleAsistencia(data.data)
      } else {
        console.error('Error cargando detalle')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoadingDetalle(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Control de Asistencia</h1>
          <p className="text-gray-500 mt-1">Gestiona la asistencia de estudiantes</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserGroupIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.presentes}</p>
              <p className="text-sm text-gray-500">Presentes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{stats.tardanzas}</p>
              <p className="text-sm text-gray-500">Tardanzas</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircleIcon className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.ausentes}</p>
              <p className="text-sm text-gray-500">Ausentes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClockIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.retirados}</p>
              <p className="text-sm text-gray-500">Retirados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="w-5 h-5 text-gray-400" />
          <h3 className="font-medium text-gray-700">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              value={selectedFecha}
              onChange={(e) => setSelectedFecha(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grado</label>
            <select
              value={selectedGrado}
              onChange={(e) => setSelectedGrado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              {grados.map(g => (
                <option key={g.id} value={g.id}>{g.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sección</label>
            <select
              value={selectedSeccion}
              onChange={(e) => setSelectedSeccion(e.target.value)}
              disabled={!selectedGrado}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">Todas</option>
              {secciones.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="PRESENTE">Presente</option>
              <option value="TARDANZA">Tardanza</option>
              <option value="AUSENTE">Ausente</option>
              <option value="RETIRADO">Retirado</option>
              <option value="JUSTIFICADO">Justificado</option>
              <option value="SIN_REGISTRAR">Sin registrar</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Nombre o DNI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estudiante</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DNI</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aula</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entrada</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salida</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredEstudiantes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No se encontraron estudiantes
                  </td>
                </tr>
              ) : (
                filteredEstudiantes.map((estudiante) => (
                  <tr 
                    key={estudiante.id} 
                    className="hover:bg-indigo-50 cursor-pointer transition-colors"
                    onClick={() => handleVerDetalle(estudiante)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{estudiante.nombre} {estudiante.apellido}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{estudiante.dni}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{estudiante.grado}° {estudiante.seccion}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {estudiante.asistenciaAula ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {estudiante.aula || 'Sí'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getEstadoBadge(estudiante.estado)}`}>
                        {getEstadoLabel(estudiante.estado)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{estudiante.horaEntrada || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{estudiante.horaSalida || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalle de Asistencia */}
      {showDetalleModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Detalle de Asistencia</h3>
                  {detalleAsistencia && (
                    <p className="text-indigo-100 text-sm mt-1">
                      {detalleAsistencia.estudiante.nombre} {detalleAsistencia.estudiante.apellido} - {selectedFecha}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowDetalleModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6">
              {loadingDetalle ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              ) : detalleAsistencia ? (
                <div className="space-y-6">
                  {/* Información del Estudiante */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Estudiante
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Nombre:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {detalleAsistencia.estudiante.nombre} {detalleAsistencia.estudiante.apellido}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">DNI:</span>
                        <span className="ml-2 font-medium text-gray-900">{detalleAsistencia.estudiante.dni}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Grado:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {detalleAsistencia.estudiante.grado}° {detalleAsistencia.estudiante.seccion}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Asistencia de Aula (Docente) */}
                  <div className={`rounded-xl p-4 border-2 ${detalleAsistencia.tieneAsistenciaAula ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Asistencia de Aula (Docente)
                    </h4>
                    {detalleAsistencia.asistenciaAula ? (
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Estado:</span>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getEstadoBadge(detalleAsistencia.asistenciaAula.estado)}`}>
                            {getEstadoLabel(detalleAsistencia.asistenciaAula.estado)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Hora de registro:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {detalleAsistencia.asistenciaAula.horaRegistro || 'No registrada'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Registrado por:</span>
                          {detalleAsistencia.asistenciaAula.registradoPor ? (
                            <span className="ml-2 font-medium text-gray-900">
                              {detalleAsistencia.asistenciaAula.registradoPor.nombre} {detalleAsistencia.asistenciaAula.registradoPor.apellido}
                              <span className="text-blue-600 ml-1">({detalleAsistencia.asistenciaAula.registradoPor.rol})</span>
                            </span>
                          ) : (
                            <span className="ml-2 text-gray-400">No disponible</span>
                          )}
                        </div>
                        {detalleAsistencia.asistenciaAula.observaciones && (
                          <div>
                            <span className="text-gray-500">Observaciones:</span>
                            <span className="ml-2 text-gray-700">{detalleAsistencia.asistenciaAula.observaciones}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Sin registro de asistencia en aula</p>
                    )}
                  </div>

                  {/* Asistencia de IE (Auxiliar) */}
                  <div className={`rounded-xl p-4 border-2 ${detalleAsistencia.tieneAsistenciaIE ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Asistencia de I.E. (Auxiliar)
                    </h4>
                    {detalleAsistencia.asistenciaIE ? (
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Estado:</span>
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {detalleAsistencia.asistenciaIE.estado}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-gray-500">Hora ingreso:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {detalleAsistencia.asistenciaIE.horaIngreso || '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Hora salida:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {detalleAsistencia.asistenciaIE.horaSalida || '-'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Ingreso registrado por:</span>
                          {detalleAsistencia.asistenciaIE.registradoIngresoPor ? (
                            <span className="ml-2 font-medium text-gray-900">
                              {detalleAsistencia.asistenciaIE.registradoIngresoPor.nombre} {detalleAsistencia.asistenciaIE.registradoIngresoPor.apellido}
                              <span className="text-green-600 ml-1">({detalleAsistencia.asistenciaIE.registradoIngresoPor.rol})</span>
                            </span>
                          ) : (
                            <span className="ml-2 text-gray-400">No disponible</span>
                          )}
                        </div>
                        {detalleAsistencia.asistenciaIE.registradoSalidaPor && (
                          <div>
                            <span className="text-gray-500">Salida registrada por:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {detalleAsistencia.asistenciaIE.registradoSalidaPor.nombre} {detalleAsistencia.asistenciaIE.registradoSalidaPor.apellido}
                              <span className="text-green-600 ml-1">({detalleAsistencia.asistenciaIE.registradoSalidaPor.rol})</span>
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Sin registro de ingreso a la I.E.</p>
                    )}
                  </div>

                  {/* Historial de Cambios */}
                  {detalleAsistencia.fueEditada && detalleAsistencia.historialCambios.length > 0 && (
                    <div className="bg-amber-50 rounded-xl p-4 border-2 border-amber-200">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Historial de Modificaciones
                        <span className="bg-amber-200 text-amber-800 text-xs px-2 py-0.5 rounded-full">
                          {detalleAsistencia.historialCambios.length} cambio(s)
                        </span>
                      </h4>
                      <div className="space-y-3">
                        {detalleAsistencia.historialCambios.map((cambio, index) => (
                          <div key={cambio.id} className="bg-white rounded-lg p-3 border border-amber-100">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getEstadoBadge(cambio.estadoCodigo)}`}>
                                    {cambio.estadoAnterior}
                                  </span>
                                  {index < detalleAsistencia.historialCambios.length - 1 && (
                                    <>
                                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                      </svg>
                                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getEstadoBadge(detalleAsistencia.historialCambios[index + 1]?.estadoCodigo || '')}`}>
                                        {detalleAsistencia.historialCambios[index + 1]?.estadoAnterior}
                                      </span>
                                    </>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {cambio.cambiadoPor 
                                    ? `Por: ${cambio.cambiadoPor.nombre} ${cambio.cambiadoPor.apellido}`
                                    : 'Usuario no registrado'
                                  }
                                </p>
                              </div>
                              <span className="text-xs text-gray-400">{cambio.fechaCambio}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Indicador si no fue editada */}
                  {!detalleAsistencia.fueEditada && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center">
                      <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-gray-500">Esta asistencia no ha sido modificada</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No se pudo cargar el detalle de asistencia</p>
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl border-t">
              <button
                onClick={() => setShowDetalleModal(false)}
                className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
