'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  CameraIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import QRScannerModal from '@/components/modals/QRScannerModal'
import SearchModal from '@/components/modals/SearchModal'

interface Grado {
  id: string
  nombre: string
}

interface Seccion {
  id: string
  nombre: string
}

interface HorarioClase {
  horaInicio: string
  horaFin: string
  materia?: string
}

interface Estudiante {
  id: string
  nombre: string
  apellido: string
  dni: string
  grado: string
  seccion: string
  nivel: string
  codigoQR: string
  estado: 'PRESENTE' | 'AUSENTE' | 'RETIRADO' | 'TARDANZA'
  horaEntrada?: string
  horaSalida?: string
  horarioClase?: HorarioClase
}

export default function AsistenciaControl() {
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
  const [fechaActual, setFechaActual] = useState('')
  const [showQRModal, setShowQRModal] = useState(false)
  const [estudiantesEscaneados, setEstudiantesEscaneados] = useState<any[]>([])
  const [scanning, setScanning] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [searchModalFilters, setSearchModalFilters] = useState({
    searchTerm: '',
    grado: '',
    seccion: '',
    estado: '',
    fecha: ''
  })
  const [searchResults, setSearchResults] = useState<Estudiante[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [stats, setStats] = useState({
    presentes: 0,
    tardanzas: 0,
    ausentes: 0,
    retirados: 0,
    total: 0
  })
  const [accionSeleccionada, setAccionSeleccionada] = useState<'entrada' | 'salida'>('entrada')
  const [qrCode, setQrCode] = useState('')

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
        if (!['AUXILIAR', 'ADMINISTRATIVO'].includes(user.rol)) {
          router.push('/unauthorized')
          return
        }
      } catch (error) {
        router.push('/login')
        return
      }
    }

    checkAuth()
    loadEstudiantes()
    loadGrados()
    loadSecciones()
  }, [router])

  const loadEstudiantes = async (fecha?: string) => {
    try {
      const token = localStorage.getItem('token')
      const fechaParam = fecha || selectedFecha
      const response = await fetch(`/api/auxiliar/asistencia/estudiantes?fecha=${fechaParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setEstudiantes(data.estudiantes || [])
        setFilteredEstudiantes(data.estudiantes || [])
        setFechaActual(data.fecha || new Date().toISOString().split('T')[0])
        calculateStats(data.estudiantes || [])
        console.log('📅 Fecha de asistencia:', data.fecha)
        console.log('👥 Estudiantes cargados:', data.estudiantes.length)
      }
    } catch (error) {
      console.error('Error loading estudiantes:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadGrados = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/grados', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setGrados(data.grados || [])
      }
    } catch (error) {
      console.error('Error loading grados:', error)
    }
  }

  const loadSecciones = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/secciones', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSecciones(data.secciones || [])
      }
    } catch (error) {
      console.error('Error loading secciones:', error)
    }
  }

  const calculateStats = (estudiantesList: Estudiante[]) => {
    const newStats = {
      presentes: estudiantesList.filter(e => e.estado === 'PRESENTE').length,
      tardanzas: estudiantesList.filter(e => e.estado === 'TARDANZA').length,
      ausentes: estudiantesList.filter(e => e.estado === 'AUSENTE').length,
      retirados: estudiantesList.filter(e => e.estado === 'RETIRADO').length,
      total: estudiantesList.length
    }
    setStats(newStats)
  }

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    filterEstudiantes(term, selectedGrado, selectedSeccion, selectedEstado)
  }

  const handleGradoChange = (grado: string) => {
    setSelectedGrado(grado)
    filterEstudiantes(searchTerm, grado, selectedSeccion, selectedEstado)
  }

  const handleSeccionChange = (seccion: string) => {
    setSelectedSeccion(seccion)
    filterEstudiantes(searchTerm, selectedGrado, seccion, selectedEstado)
  }

  const handleEstadoChange = (estado: string) => {
    setSelectedEstado(estado)
    filterEstudiantes(searchTerm, selectedGrado, selectedSeccion, estado)
  }

  const handleFechaChange = (fecha: string) => {
    setSelectedFecha(fecha)
    loadEstudiantes(fecha)
  }

  const filterEstudiantes = (term: string, grado: string, seccion: string, estado: string) => {
    let filtered = estudiantes

    if (term) {
      filtered = filtered.filter(e => 
        e.nombre.toLowerCase().includes(term.toLowerCase()) ||
        e.apellido.toLowerCase().includes(term.toLowerCase()) ||
        e.dni.includes(term) ||
        e.codigoQR.includes(term)
      )
    }

    if (grado) {
      filtered = filtered.filter(e => e.grado === grado)
    }

    if (seccion) {
      filtered = filtered.filter(e => e.seccion === seccion)
    }

    if (estado) {
      filtered = filtered.filter(e => e.estado === estado)
    }

    setFilteredEstudiantes(filtered)
    calculateStats(filtered)
  }

  const handleQRScan = async () => {
    if (!qrCode.trim()) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auxiliar/asistencia/qr-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          qrCode: qrCode.trim(),
          accion: accionSeleccionada
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`✅ ${data.accion} registrada para ${data.estudiante.nombre} ${data.estudiante.apellido}`)
        setQrCode('')
        loadEstudiantes()
        
        // Agregar a la lista de escaneados
        const nuevoEscaneado = {
          id: data.estudiante.id,
          nombre: data.estudiante.nombre,
          apellido: data.estudiante.apellido,
          dni: data.estudiante.dni,
          grado: data.estudiante.grado,
          seccion: data.estudiante.seccion,
          accion: accionSeleccionada,
          hora: new Date().toLocaleTimeString()
        }
        setEstudiantesEscaneados(prev => [nuevoEscaneado, ...prev])
      } else {
        const error = await response.json()
        alert(`❌ Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error scanning QR:', error)
      alert('❌ Error al procesar código QR')
    }
  }

  const openSearchModal = () => {
    setShowSearchModal(true)
    setSearchModalFilters({
      searchTerm: '',
      grado: '',
      seccion: '',
      estado: '',
      fecha: new Date().toISOString().split('T')[0]
    })
    setSearchResults([])
  }

  const performSearch = async () => {
    setSearchLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      
      Object.entries(searchModalFilters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await fetch(`/api/auxiliar/asistencia/buscar?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.estudiantes || [])
      } else {
        console.error('Error en búsqueda')
        setSearchResults([])
      }
    } catch (error) {
      console.error('Error:', error)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  const clearSearchFilters = () => {
    setSearchModalFilters({
      searchTerm: '',
      grado: '',
      seccion: '',
      estado: '',
      fecha: ''
    })
    setSearchResults([])
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:px-8">
      {/* Stats Cards - Compactas en móvil */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 md:gap-4 mb-4 md:mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-2 sm:p-3 md:p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="ml-2 sm:ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Presentes</dt>
                  <dd className="text-base sm:text-lg font-bold text-green-600">{stats.presentes}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-2 sm:p-3 md:p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
              </div>
              <div className="ml-2 sm:ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Tardanzas</dt>
                  <dd className="text-base sm:text-lg font-bold text-yellow-600">{stats.tardanzas}</dd>
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
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Ausentes</dt>
                  <dd className="text-base sm:text-lg font-bold text-red-600">{stats.ausentes}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-2 sm:p-3 md:p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <div className="ml-2 sm:ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Retirados</dt>
                  <dd className="text-base sm:text-lg font-bold text-orange-600">{stats.retirados}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg col-span-2 sm:col-span-1">
          <div className="p-2 sm:p-3 md:p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
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

      {/* Botones Principales - Grandes y táctiles para móvil */}
      <div className="bg-white shadow rounded-lg mb-4 md:mb-8">
        <div className="p-3 sm:p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            {/* Botón Cámara QR - Principal y grande */}
            <button
              onClick={() => setShowQRModal(true)}
              className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 active:bg-green-100 transition-colors group min-h-[120px] sm:min-h-[160px]"
            >
              <CameraIcon className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 text-gray-400 group-hover:text-green-500 mb-2 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 group-hover:text-green-600 mb-1 sm:mb-2">
                Abrir Cámara QR
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 text-center hidden sm:block">
                Escanea códigos QR para registrar entrada y salida
              </p>
            </button>

            {/* Botón Búsqueda Avanzada */}
            <button
              onClick={openSearchModal}
              className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 active:bg-purple-100 transition-colors group min-h-[120px] sm:min-h-[160px]"
            >
              <FunnelIcon className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 text-gray-400 group-hover:text-purple-500 mb-2 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 group-hover:text-purple-600 mb-1 sm:mb-2">
                Buscar Asistencia
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 text-center hidden sm:block">
                Busca y filtra estudiantes por diferentes criterios
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Filters - Colapsables en móvil */}
      <div className="bg-white shadow rounded-lg mb-4 md:mb-8">
        <div className="p-3 sm:p-4 md:p-6">
          <div className="flex justify-between items-center mb-3 md:mb-4">
            <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900">Filtros</h3>
            <button
              onClick={() => loadEstudiantes()}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 min-h-[44px]"
            >
              <svg className="h-4 w-4 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
            {/* Fecha */}
            <div className="col-span-2 sm:col-span-1">
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

            {/* Buscar */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Nombre, DNI..."
                className="block w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black text-base sm:text-sm min-h-[44px]"
              />
            </div>
            
            {/* Grado */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Grado
              </label>
              <select
                value={selectedGrado}
                onChange={(e) => handleGradoChange(e.target.value)}
                className="block w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black text-base sm:text-sm min-h-[44px]"
              >
                <option value="">Todos</option>
                {grados.map((grado) => (
                  <option key={grado.id} value={grado.nombre}>
                    {grado.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Sección */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Sección
              </label>
              <select
                value={selectedSeccion}
                onChange={(e) => handleSeccionChange(e.target.value)}
                className="block w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black text-base sm:text-sm min-h-[44px]"
              >
                <option value="">Todas</option>
                {secciones.map((seccion) => (
                  <option key={seccion.id} value={seccion.nombre}>
                    {seccion.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Estado - Oculto en móvil muy pequeño */}
            <div className="hidden sm:block">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={selectedEstado}
                onChange={(e) => handleEstadoChange(e.target.value)}
                className="block w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black text-base sm:text-sm min-h-[44px]"
              >
                <option value="">Todos</option>
                <option value="PRESENTE">Presente</option>
                <option value="AUSENTE">Ausente</option>
                <option value="TARDANZA">Tardanza</option>
                <option value="RETIRADO">Retirado</option>
              </select>
            </div>

            {/* Limpiar */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedGrado('')
                  setSelectedSeccion('')
                  setSelectedEstado('')
                  setSelectedFecha(new Date().toISOString().split('T')[0])
                  loadEstudiantes(new Date().toISOString().split('T')[0])
                }}
                className="w-full inline-flex items-center justify-center px-3 py-2.5 sm:py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 min-h-[44px]"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Students Table - Responsive */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-3 sm:p-4 md:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 md:mb-4">
            <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900">
              Estudiantes ({filteredEstudiantes.length})
            </h3>
            <div className="text-xs sm:text-sm text-gray-600">
              📅 <span className="font-semibold">{fechaActual || 'Cargando...'}</span>
            </div>
          </div>
          
          {/* Vista de tarjetas en móvil */}
          <div className="block md:hidden space-y-3">
            {filteredEstudiantes.map((estudiante) => (
              <div key={estudiante.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {estudiante.apellido}, {estudiante.nombre}
                    </p>
                    <p className="text-xs text-gray-500">DNI: {estudiante.dni}</p>
                    <p className="text-xs text-gray-400">{estudiante.grado} - {estudiante.seccion}</p>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    estudiante.estado === 'PRESENTE' 
                      ? 'bg-green-100 text-green-800'
                      : estudiante.estado === 'TARDANZA'
                      ? 'bg-yellow-100 text-yellow-800'
                      : estudiante.estado === 'RETIRADO'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {estudiante.estado === 'PRESENTE' ? '✓' :
                     estudiante.estado === 'TARDANZA' ? '⚠' :
                     estudiante.estado === 'RETIRADO' ? '↩' : '✗'}
                  </span>
                </div>
                <div className="text-xs text-gray-500 border-t pt-2">
                  {estudiante.horaEntrada ? `Entrada: ${estudiante.horaEntrada}` : 'Sin entrada'}
                  {estudiante.horaSalida && ` | Salida: ${estudiante.horaSalida}`}
                </div>
              </div>
            ))}
          </div>
          
          {/* Tabla en desktop */}
          <div className="hidden md:block overflow-hidden shadow-sm border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estudiante
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grado/Sección
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entrada/Salida
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEstudiantes.map((estudiante) => (
                  <tr key={estudiante.id} className="hover:bg-gray-50">
                    <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {estudiante.apellido}, {estudiante.nombre}
                        </div>
                        <div className="text-xs lg:text-sm text-gray-500">DNI: {estudiante.dni}</div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{estudiante.grado} - {estudiante.seccion}</div>
                      <div className="text-xs text-gray-400">{estudiante.nivel}</div>
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        estudiante.estado === 'PRESENTE' 
                          ? 'bg-green-100 text-green-800'
                          : estudiante.estado === 'TARDANZA'
                          ? 'bg-yellow-100 text-yellow-800'
                          : estudiante.estado === 'RETIRADO'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {estudiante.estado === 'PRESENTE' ? '✓ Presente' :
                         estudiante.estado === 'TARDANZA' ? '⚠ Tardanza' :
                         estudiante.estado === 'RETIRADO' ? '↩ Retirado' :
                         '✗ Ausente'}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm text-gray-500">
                      {estudiante.horaEntrada ? (
                        <div>
                          <div>E: {estudiante.horaEntrada}</div>
                          {estudiante.horaSalida && <div>S: {estudiante.horaSalida}</div>}
                        </div>
                      ) : (
                        <div className="text-gray-400">-</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modales */}
      <QRScannerModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        accionSeleccionada={accionSeleccionada}
        setAccionSeleccionada={setAccionSeleccionada}
        qrCode={qrCode}
        setQrCode={setQrCode}
        handleQRScan={handleQRScan}
        estudiantesEscaneados={estudiantesEscaneados}
        setEstudiantesEscaneados={setEstudiantesEscaneados}
      />

      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        searchFilters={searchModalFilters}
        setSearchFilters={setSearchModalFilters}
        searchResults={searchResults}
        searchLoading={searchLoading}
        grados={grados}
        secciones={secciones}
        onSearch={performSearch}
        onClearFilters={clearSearchFilters}
      />
    </div>
  )
}
