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

  const loadEstudiantes = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auxiliar/asistencia/estudiantes', {
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
    const stats = {
      presentes: estudiantesList.filter(e => e.estado === 'PRESENTE').length,
      ausentes: estudiantesList.filter(e => e.estado === 'AUSENTE').length,
      retirados: estudiantesList.filter(e => e.estado === 'RETIRADO').length,
      total: estudiantesList.length
    }
    setStats(stats)
  }

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    filterEstudiantes(term, selectedGrado, selectedSeccion)
  }

  const handleGradoChange = (grado: string) => {
    setSelectedGrado(grado)
    filterEstudiantes(searchTerm, grado, selectedSeccion)
  }

  const handleSeccionChange = (seccion: string) => {
    setSelectedSeccion(seccion)
    filterEstudiantes(searchTerm, selectedGrado, seccion)
  }

  const filterEstudiantes = (term: string, grado: string, seccion: string) => {
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
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Presentes</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.presentes}</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Ausentes</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.ausentes}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Retirados</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.retirados}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
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

      {/* Botones Principales */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Botón Cámara QR */}
            <button
              onClick={() => setShowQRModal(true)}
              className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group"
            >
              <CameraIcon className="h-16 w-16 text-gray-400 group-hover:text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 group-hover:text-green-600 mb-2">
                Abrir Cámara QR
              </h3>
              <p className="text-sm text-gray-500 text-center">
                Escanea códigos QR para registrar entrada y salida de estudiantes
              </p>
            </button>

            {/* Botón Búsqueda Avanzada */}
            <button
              onClick={openSearchModal}
              className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors group"
            >
              <FunnelIcon className="h-16 w-16 text-gray-400 group-hover:text-purple-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 group-hover:text-purple-600 mb-2">
                Buscar Asistencia
              </h3>
              <p className="text-sm text-gray-500 text-center">
                Busca y filtra estudiantes por diferentes criterios
              </p>
            </button>
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
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Nombre, apellido o DNI"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grado
              </label>
              <select
                value={selectedGrado}
                onChange={(e) => handleGradoChange(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
              >
                <option value="">Todos los grados</option>
                {grados.map((grado) => (
                  <option key={grado.id} value={grado.nombre}>
                    {grado.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sección
              </label>
              <select
                value={selectedSeccion}
                onChange={(e) => handleSeccionChange(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
              >
                <option value="">Todas las secciones</option>
                {secciones.map((seccion) => (
                  <option key={seccion.id} value={seccion.nombre}>
                    {seccion.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedGrado('')
                  setSelectedSeccion('')
                  setFilteredEstudiantes(estudiantes)
                  calculateStats(estudiantes)
                }}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Lista de Estudiantes ({filteredEstudiantes.length})
            </h3>
            <div className="text-sm text-gray-600">
              📅 Fecha: <span className="font-semibold">{fechaActual || 'Cargando...'}</span>
            </div>
          </div>
          <div className="overflow-hidden shadow-sm border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estudiante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grado/Sección
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entrada/Salida
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEstudiantes.map((estudiante) => (
                  <tr key={estudiante.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {estudiante.apellido}, {estudiante.nombre}
                        </div>
                        <div className="text-sm text-gray-500">DNI: {estudiante.dni}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{estudiante.grado}</div>
                      <div>{estudiante.seccion}</div>
                      <div className="text-xs text-gray-400">{estudiante.nivel}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        estudiante.estado === 'PRESENTE' 
                          ? 'bg-green-100 text-green-800'
                          : estudiante.estado === 'RETIRADO'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {estudiante.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {estudiante.horaEntrada && estudiante.horaSalida ? (
                        // Ambas registradas
                        <div>
                          <div>Entrada: {estudiante.horaEntrada}</div>
                          <div>Salida: {estudiante.horaSalida}</div>
                        </div>
                      ) : estudiante.horaEntrada ? (
                        // Solo entrada
                        <div>Entrada: {estudiante.horaEntrada}</div>
                      ) : estudiante.horaSalida ? (
                        // Solo salida (caso raro pero posible)
                        <div>Salida: {estudiante.horaSalida}</div>
                      ) : (
                        // Sin registro
                        <div className="text-gray-400">Sin entrada</div>
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
