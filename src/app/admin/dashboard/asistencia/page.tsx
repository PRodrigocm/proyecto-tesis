'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  CameraIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import QRScannerModal from '@/components/modals/QRScannerModal'

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

// Interfaz para estudiantes escaneados (compatible con QRScannerModal)
interface EstudianteEscaneado {
  id: string
  nombre: string
  apellido: string
  dni: string
  grado: string
  seccion: string
  accion: string
  hora: string
  codigo?: string
  estado?: 'PRESENTE' | 'AUSENTE' | 'RETIRADO' | 'TARDANZA' | 'JUSTIFICADO'
  duplicado?: boolean
  mensajeDuplicado?: string
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
  const [showQRModal, setShowQRModal] = useState(false)
  const [accionSeleccionada, setAccionSeleccionada] = useState<'entrada' | 'salida'>('entrada')
  const [qrCode, setQrCode] = useState('')
  const [estudiantesEscaneados, setEstudiantesEscaneados] = useState<any[]>([])
  const [stats, setStats] = useState({
    presentes: 0,
    tardanzas: 0,
    ausentes: 0,
    retirados: 0,
    justificados: 0,
    sinRegistrar: 0,
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

  const handleQRScan = async () => {
    if (!qrCode.trim()) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/asistencia/registrar-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          codigoQR: qrCode,
          fecha: selectedFecha,
          accion: accionSeleccionada
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.estudiante) {
          setEstudiantesEscaneados(prev => [data.estudiante, ...prev])
        }
        setQrCode('')
        loadEstudiantes()
      }
    } catch (error) {
      console.error('Error registrando asistencia:', error)
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Control de Asistencia</h1>
          <p className="text-gray-500 mt-1">Gestiona la asistencia de estudiantes</p>
        </div>
        <button
          onClick={() => setShowQRModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30"
        >
          <CameraIcon className="w-5 h-5" />
          Escanear QR
        </button>
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
                  <tr key={estudiante.id} className="hover:bg-gray-50">
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

      {/* QR Scanner Modal */}
      {showQRModal && (
        <QRScannerModal
          isOpen={showQRModal}
          onClose={() => {
            setShowQRModal(false)
            setQrCode('')
          }}
          accionSeleccionada={accionSeleccionada}
          setAccionSeleccionada={setAccionSeleccionada}
          qrCode={qrCode}
          setQrCode={setQrCode}
          handleQRScan={handleQRScan}
          estudiantesEscaneados={estudiantesEscaneados}
          setEstudiantesEscaneados={setEstudiantesEscaneados}
        />
      )}
    </div>
  )
}
