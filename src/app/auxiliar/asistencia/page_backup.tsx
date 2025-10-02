'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ClockIcon,
  UserGroupIcon,
  QrCodeIcon,
  MagnifyingGlassIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  CameraIcon,
  XMarkIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'

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
  const [qrCode, setQrCode] = useState('')
  const [grados, setGrados] = useState<any[]>([])
  const [secciones, setSecciones] = useState<any[]>([])
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

      loadData()
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const loadData = async () => {
    await Promise.all([
      loadEstudiantes(),
      loadGrados(),
      loadSecciones()
    ])
  }

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
        console.log('📊 Datos de estudiantes recibidos:', data.estudiantes)
        setEstudiantes(data.estudiantes)
        setFilteredEstudiantes(data.estudiantes)
        calculateStats(data.estudiantes)
      }
    } catch (error) {
      console.error('Error loading estudiantes:', error)
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
        setGrados(data.data || [])
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
    const presentes = estudiantesList.filter(e => e.estado === 'PRESENTE').length
    const ausentes = estudiantesList.filter(e => e.estado === 'AUSENTE').length
    const retirados = estudiantesList.filter(e => e.estado === 'RETIRADO').length
    
    setStats({
      presentes,
      ausentes,
      retirados,
      total: estudiantesList.length
    })
  }

  const handleSearch = (term: string) => {
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
      } else {
        const error = await response.json()
        alert(`❌ Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error scanning QR:', error)
      alert('❌ Error al procesar código QR')
    }
  }

  const handleCameraQRScan = async (qrCodeData: string) => {
    if (!qrCodeData.trim()) return

    try {
      setScanning(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auxiliar/asistencia/qr-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          qrCode: qrCodeData.trim(),
          accion: accionSeleccionada
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Agregar a la lista de escaneados
        const nuevoEscaneado = {
          id: data.estudiante.id,
          nombre: data.estudiante.nombre,
          apellido: data.estudiante.apellido,
          grado: data.estudiante.grado,
          seccion: data.estudiante.seccion,
          accion: data.accion,
          hora: new Date().toLocaleTimeString(),
          estado: data.estado
        }
        
        setEstudiantesEscaneados(prev => [nuevoEscaneado, ...prev])
        loadEstudiantes() // Actualizar la lista principal
      } else {
        const error = await response.json()
        alert(`❌ Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error scanning QR:', error)
      alert('❌ Error al procesar código QR')
    } finally {
      setScanning(false)
    }
  }

  const startQRScanner = () => {
    setShowQRModal(true)
    setEstudiantesEscaneados([])
  }

  const closeQRModal = () => {
    setShowQRModal(false)
    setScanning(false)
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
    performSearch()
  }

  const closeSearchModal = () => {
    setShowSearchModal(false)
    setSearchResults([])
  }

  const performSearch = async () => {
    setSearchLoading(true)
    try {
      // Por ahora usar los datos que ya tenemos cargados y filtrarlos localmente
      let resultados = [...estudiantes]

      // Filtrar por texto de búsqueda
      if (searchModalFilters.searchTerm) {
        const searchTerm = searchModalFilters.searchTerm.toLowerCase()
        resultados = resultados.filter(est => 
          est.nombre.toLowerCase().includes(searchTerm) ||
          est.apellido.toLowerCase().includes(searchTerm) ||
          est.dni.includes(searchTerm) ||
          est.codigoQR.includes(searchTerm)
        )
      }

      // Filtrar por grado
      if (searchModalFilters.grado) {
        resultados = resultados.filter(est => est.grado === searchModalFilters.grado)
      }

      // Filtrar por sección
      if (searchModalFilters.seccion) {
        resultados = resultados.filter(est => est.seccion === searchModalFilters.seccion)
      }

      // Filtrar por estado
      if (searchModalFilters.estado) {
        resultados = resultados.filter(est => est.estado === searchModalFilters.estado)
      }

      console.log('✅ Búsqueda local exitosa:', resultados.length, 'resultados')
      setSearchResults(resultados)
    } catch (error) {
      console.error('Error performing search:', error)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSearchFilterChange = (field: string, value: string) => {
    setSearchModalFilters(prev => ({
      ...prev,
      [field]: value
    }))
    // Ejecutar búsqueda automáticamente después de un pequeño delay
    setTimeout(() => {
      performSearch()
    }, 300)
  }

  const clearSearchFilters = () => {
    setSearchModalFilters({
      searchTerm: '',
      grado: '',
      seccion: '',
      estado: '',
      fecha: new Date().toISOString().split('T')[0]
    })
    performSearch()
  }

  const registrarEntrada = async (estudianteId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auxiliar/asistencia/entrada', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estudianteId })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`✅ Entrada registrada para ${data.estudiante.nombre}`)
        loadEstudiantes()
      } else {
        const error = await response.json()
        alert(`❌ Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error registering entrada:', error)
      alert('❌ Error al registrar entrada')
    }
  }

  const registrarSalida = async (estudianteId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auxiliar/asistencia/salida', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estudianteId })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`✅ Salida registrada para ${data.estudiante.nombre}`)
        loadEstudiantes()
      } else {
        const error = await response.json()
        alert(`❌ Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error registering salida:', error)
      alert('❌ Error al registrar salida')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-black">Cargando control de asistencia...</span>
        </div>
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
                <ArrowRightOnRectangleIcon className="h-6 w-6 text-orange-600" />
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

      {/* QR Scanner */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            <QrCodeIcon className="h-5 w-5 inline mr-2" />
            Escanear Código QR
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Escáner Manual */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ingreso Manual
              </label>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <input
                    type="text"
                    value={qrCode}
                    onChange={(e) => setQrCode(e.target.value)}
                    placeholder="Ingresar código QR del estudiante"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleQRScan()}
                  />
                </div>
                <button
                  onClick={handleQRScan}
                  disabled={!qrCode.trim()}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    accionSeleccionada === 'entrada' 
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                      : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                  }`}
                >
                  <QrCodeIcon className="h-4 w-4 mr-2" />
                  {accionSeleccionada === 'entrada' ? 'Registrar Entrada' : 'Registrar Salida'}
                </button>
              </div>
            </div>

            {/* Escáner con Cámara */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escaneo con Cámara
              </label>
              <button
                onClick={startQRScanner}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <CameraIcon className="h-4 w-4 mr-2" />
                Abrir Cámara QR
              </button>
            </div>

            {/* Buscar Asistencia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Búsqueda Avanzada
              </label>
              <button
                onClick={openSearchModal}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Buscar Asistencia
              </button>
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
                  placeholder="Nombre, DNI o código QR"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grado
              </label>
              <select
                value={selectedGrado}
                onChange={(e) => handleGradoChange(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los grados</option>
                {grados.map((grado, index) => (
                  <option key={`grado-${grado.id || index}`} value={grado.nombre}>
                    {grado.nombre}°
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
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas las secciones</option>
                {secciones.map((seccion, index) => (
                  <option key={`seccion-${seccion.id || index}`} value={seccion.nombre}>
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
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Lista de Estudiantes ({filteredEstudiantes.length})
          </h3>
          <div className="overflow-x-auto">
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
                    Horarios
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
                        <div className="text-sm text-gray-500">
                          DNI: {estudiante.dni}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {estudiante.grado}° {estudiante.seccion}
                      </div>
                      <div className="text-sm text-gray-500">
                        {estudiante.nivel}
                      </div>
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
                      {estudiante.horarioClase ? (
                        <div>
                          <div>Inicio: {estudiante.horarioClase.horaInicio}</div>
                          <div>Fin: {estudiante.horarioClase.horaFin}</div>
                          {estudiante.horarioClase.materia && (
                            <div className="text-xs text-gray-400">{estudiante.horarioClase.materia}</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-400">Sin horario</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {estudiante.horaEntrada ? (
                        <div>Entrada: {estudiante.horaEntrada}</div>
                      ) : (
                        <div className="text-gray-400">Sin entrada</div>
                      )}
                      {estudiante.horaSalida ? (
                        <div>Salida: {estudiante.horaSalida}</div>
                      ) : estudiante.estado !== 'AUSENTE' ? (
                        <div className="text-gray-400">Sin salida</div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Escáner QR */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={closeQRModal}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <CameraIcon className="h-6 w-6 mr-2" />
                  Escáner QR
                </h3>
                <button
                  onClick={closeQRModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

                {/* Selector de Acción */}
                <div className="mb-6">
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={() => setAccionSeleccionada('entrada')}
                      className={`inline-flex items-center px-6 py-3 border text-sm font-medium rounded-md transition-colors ${
                        accionSeleccionada === 'entrada'
                          ? 'border-transparent text-white bg-green-600 hover:bg-green-700'
                          : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                      Registrar Entrada
                    </button>
                    <button
                      onClick={() => setAccionSeleccionada('salida')}
                      className={`inline-flex items-center px-6 py-3 border text-sm font-medium rounded-md transition-colors ${
                        accionSeleccionada === 'salida'
                          ? 'border-transparent text-white bg-blue-600 hover:bg-blue-700'
                          : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2" />
                      Registrar Salida
                    </button>
                  </div>
                  <p className="text-center text-sm text-gray-500 mt-2">
                    Selecciona la acción que deseas realizar al escanear el código QR
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Área de la Cámara */}
                  <div>
                    <div className="bg-gray-100 rounded-lg p-4 text-center">
                      <CameraIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <p className="text-sm text-gray-600 mb-4">
                        Área de la cámara para escanear códigos QR
                      </p>
                      <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg h-64 flex items-center justify-center">
                        <div className="text-center">
                          <QrCodeIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">
                            Cámara QR se mostraría aquí
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            (Requiere implementación de librería QR)
                          </p>
                        </div>
                      </div>
                      
                      {/* Simulador de entrada manual para pruebas */}
                      <div className="mt-4">
                        <input
                          type="text"
                          placeholder="Simular código QR escaneado"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const target = e.target as HTMLInputElement
                              if (target.value.trim()) {
                                handleCameraQRScan(target.value.trim())
                                target.value = ''
                              }
                            }
                          }}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Presiona Enter para simular escaneo
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Lista de Estudiantes Escaneados */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">
                      Estudiantes Escaneados ({estudiantesEscaneados.length})
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 h-80 overflow-y-auto">
                      {estudiantesEscaneados.length > 0 ? (
                        <div className="space-y-3">
                          {estudiantesEscaneados.map((estudiante, index) => (
                            <div key={index} className="bg-white rounded-lg p-3 shadow-sm border">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {estudiante.apellido}, {estudiante.nombre}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {estudiante.grado}° {estudiante.seccion}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {estudiante.hora}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    estudiante.accion === 'Entrada'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {estudiante.accion}
                                  </span>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {estudiante.estado}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <QrCodeIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                          <p className="text-sm text-gray-500">
                            No hay estudiantes escaneados
                          </p>
                          <p className="text-xs text-gray-400">
                            Los estudiantes aparecerán aquí al escanear sus códigos QR
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t bg-gray-50 px-6 py-4 rounded-b-lg">
                <button
                  onClick={() => setEstudiantesEscaneados([])}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Limpiar Lista
                </button>
                <button
                  onClick={closeQRModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Finalizar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Búsqueda de Asistencia */}
      {showSearchModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-start justify-center min-h-screen pt-4 px-4 pb-20">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity" onClick={closeSearchModal}></div>

            <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-7xl mx-auto mt-8 z-[70] min-h-[600px]">
              {/* Header */}
              <div className="bg-white px-6 py-4 border-b border-gray-200 rounded-t-lg">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-900">
                    <FunnelIcon className="h-6 w-6 inline mr-2 text-purple-600" />
                    Búsqueda de Asistencia
                  </h3>
                  <button
                    onClick={closeSearchModal}
                    className="rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 p-2 focus:outline-none"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="bg-white px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Panel de Filtros */}
                  <div className="lg:col-span-1">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-md font-medium text-gray-900 mb-4">Filtros de Búsqueda</h4>
                      
                      <div className="space-y-4">
                        {/* Búsqueda por texto */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Buscar
                          </label>
                          <input
                            type="text"
                            value={searchModalFilters.searchTerm}
                            onChange={(e) => handleSearchFilterChange('searchTerm', e.target.value)}
                            placeholder="Nombre, DNI o código QR"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm"
                          />
                        </div>

                        {/* Filtro por grado */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Grado
                          </label>
                          <select
                            value={searchModalFilters.grado}
                            onChange={(e) => handleSearchFilterChange('grado', e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm"
                          >
                            <option value="">Todos los grados</option>
                            {grados.map((grado, index) => (
                              <option key={`search-grado-${grado.id || index}`} value={grado.nombre}>
                                {grado.nombre}°
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Filtro por sección */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sección
                          </label>
                          <select
                            value={searchModalFilters.seccion}
                            onChange={(e) => handleSearchFilterChange('seccion', e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm"
                          >
                            <option value="">Todas las secciones</option>
                            {secciones.map((seccion, index) => (
                              <option key={`search-seccion-${seccion.id || index}`} value={seccion.nombre}>
                                {seccion.nombre}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Filtro por estado */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Estado
                          </label>
                          <select
                            value={searchModalFilters.estado}
                            onChange={(e) => handleSearchFilterChange('estado', e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm"
                          >
                            <option value="">Todos los estados</option>
                            <option value="PRESENTE">Presente</option>
                            <option value="AUSENTE">Ausente</option>
                            <option value="TARDANZA">Tardanza</option>
                            <option value="RETIRADO">Retirado</option>
                          </select>
                        </div>

                        {/* Filtro por fecha */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha
                          </label>
                          <input
                            type="date"
                            value={searchModalFilters.fecha}
                            onChange={(e) => handleSearchFilterChange('fecha', e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm"
                          />
                        </div>

                        {/* Botones de acción */}
                        <div className="space-y-2 pt-4">
                          <button
                            onClick={performSearch}
                            disabled={searchLoading}
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                          >
                            {searchLoading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                              <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                            )}
                            Buscar
                          </button>
                          <button
                            onClick={clearSearchFilters}
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                          >
                            Limpiar Filtros
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tabla de Resultados */}
                  <div className="lg:col-span-3">
                    <div className="bg-white border border-gray-200 rounded-lg">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <h4 className="text-lg font-medium text-gray-900">
                          Resultados de Búsqueda ({searchResults.length})
                        </h4>
                      </div>
                      
                      <div className="overflow-hidden">
                        <div className="max-h-96 overflow-y-auto">
                          <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Estudiante
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Grado/Sección
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Estado
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Horarios
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Entrada/Salida
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {searchLoading ? (
                                <tr>
                                  <td colSpan={5} className="px-4 py-8 text-center">
                                    <div className="flex items-center justify-center">
                                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mr-2"></div>
                                      <span className="text-gray-500">Buscando estudiantes...</span>
                                    </div>
                                  </td>
                                </tr>
                              ) : searchResults.length > 0 ? (
                                searchResults.map((estudiante) => (
                                  <tr key={estudiante.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">
                                          {estudiante.apellido}, {estudiante.nombre}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          DNI: {estudiante.dni}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <div className="text-sm text-gray-900">
                                        {estudiante.grado}° {estudiante.seccion}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {estudiante.nivel}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        estudiante.estado === 'PRESENTE' 
                                          ? 'bg-green-100 text-green-800'
                                          : estudiante.estado === 'RETIRADO'
                                          ? 'bg-orange-100 text-orange-800'
                                          : estudiante.estado === 'TARDANZA'
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-red-100 text-red-800'
                                      }`}>
                                        {estudiante.estado}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                      {estudiante.horarioClase ? (
                                        <div>
                                          <div>Inicio: {estudiante.horarioClase.horaInicio}</div>
                                          <div>Fin: {estudiante.horarioClase.horaFin}</div>
                                          {estudiante.horarioClase.materia && (
                                            <div className="text-xs text-gray-400">{estudiante.horarioClase.materia}</div>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="text-gray-400">Sin horario</div>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                      {estudiante.horaEntrada ? (
                                        <div>Entrada: {estudiante.horaEntrada}</div>
                                      ) : (
                                        <div className="text-gray-400">Sin entrada</div>
                                      )}
                                      {estudiante.horaSalida ? (
                                        <div>Salida: {estudiante.horaSalida}</div>
                                      ) : estudiante.estado !== 'AUSENTE' ? (
                                        <div className="text-gray-400">Sin salida</div>
                                      ) : null}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={5} className="px-4 py-8 text-center">
                                    <div className="text-center">
                                      <UserGroupIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                                      <p className="text-sm text-gray-500">
                                        No se encontraron estudiantes
                                      </p>
                                      <p className="text-xs text-gray-400">
                                        Ajusta los filtros para refinar tu búsqueda
                                      </p>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-lg">
                <div className="flex justify-end">
                  <button
                    onClick={closeSearchModal}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}