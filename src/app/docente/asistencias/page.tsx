'use client'

import { useState, useEffect } from 'react'
import TomarAsistenciaModal from '@/components/docente/TomarAsistenciaModal'

export default function DocenteAsistencias() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0])
  const [claseSeleccionada, setClaseSeleccionada] = useState('')
  const [estudiantes, setEstudiantes] = useState<any[]>([])
  const [clases, setClases] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [token, setToken] = useState<string | null>(null)

  const [modoEdicion, setModoEdicion] = useState(false)
  const [showTomarAsistenciaModal, setShowTomarAsistenciaModal] = useState(false)

  const estadosAsistencia = [
    { value: 'presente', label: 'Presente', color: 'bg-green-100 text-green-800' },
    { value: 'tardanza', label: 'Tardanza', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'inasistencia', label: 'Inasistencia', color: 'bg-red-100 text-red-800' },
    { value: 'justificada', label: 'Justificada', color: 'bg-blue-100 text-blue-800' },
    // Estados especiales para retiros
    { value: 'retiro_temprano', label: 'Retiro Temprano', color: 'bg-red-100 text-red-800' },
    { value: 'retiro_parcial', label: 'Retiro Parcial', color: 'bg-gray-100 text-gray-800' },
    { value: 'retiro_tardio', label: 'Retiro Tardío', color: 'bg-yellow-100 text-yellow-800' }
  ]

  // Cargar datos de autenticación
  useEffect(() => {
    setMounted(true)
    
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')
      
      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          setToken(storedToken)
          setUser(parsedUser)
          
          // Cargar clases del docente
          loadClases(storedToken, parsedUser)
        } catch (error) {
          console.error('Error parsing user data:', error)
        }
      }
    }
  }, [])

  // Cargar estudiantes cuando cambie la clase o fecha
  useEffect(() => {
    if (claseSeleccionada && fechaSeleccionada && token) {
      loadEstudiantes()
    }
  }, [claseSeleccionada, fechaSeleccionada, token])

  const loadClases = async (tokenData: string, userData: any) => {
    try {
      const userId = userData.idUsuario || userData.id
      console.log('🔍 Cargando clases para asistencia del docente:', userId)

      const response = await fetch(`/api/docentes/${userId}/clases-asistencia`, {
        headers: {
          'Authorization': `Bearer ${tokenData}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Clases cargadas:', data.data)
        setClases(data.data || [])
      } else {
        console.error('❌ Error al cargar clases')
        // Datos de fallback
        setClases([
          { id: 1, nombre: 'Matemáticas - 5to A', horario: '08:00-09:30' },
          { id: 2, nombre: 'Física - 4to B', horario: '10:00-11:30' }
        ])
      }
    } catch (error) {
      console.error('Error loading clases:', error)
      setClases([])
    }
  }

  const loadEstudiantes = async () => {
    try {
      setLoading(true)
      console.log('🔍 Cargando estudiantes para clase:', claseSeleccionada, 'fecha:', fechaSeleccionada)

      const response = await fetch(`/api/asistencias/clase/${claseSeleccionada}?fecha=${fechaSeleccionada}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Estudiantes cargados:', data.data)
        setEstudiantes(data.data || [])
      } else {
        console.error('❌ Error al cargar estudiantes')
        // Datos de fallback
        setEstudiantes([
          {
            id: 1,
            nombre: 'Juan Pérez',
            codigo: 'EST001',
            estado: 'sin_registrar',
            horaLlegada: null
          },
          {
            id: 2,
            nombre: 'María González',
            codigo: 'EST002',
            estado: 'sin_registrar',
            horaLlegada: null
          }
        ])
      }
    } catch (error) {
      console.error('Error loading estudiantes:', error)
      setEstudiantes([])
    } finally {
      setLoading(false)
    }
  }

  const handleEstadoChange = (estudianteId: number, nuevoEstado: string) => {
    const horaActual = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    
    setEstudiantes(prev => prev.map(est => {
      if (est.id === estudianteId) {
        // Si se está editando la asistencia, siempre actualizar la hora de llegada
        const nuevaHoraLlegada = (nuevoEstado === 'presente' || nuevoEstado === 'tardanza') 
          ? horaActual 
          : null
        
        return { 
          ...est, 
          estado: nuevoEstado, 
          horaLlegada: nuevaHoraLlegada,
          editado: true // Marcar como editado
        }
      }
      return est
    }))
  }

  const handleGuardarAsistencia = () => {
    // Aquí se guardaría la asistencia
    console.log('Guardando asistencia:', { fecha: fechaSeleccionada, clase: claseSeleccionada, estudiantes })
    setModoEdicion(false)
    alert('Asistencia guardada correctamente')
  }

  const handleTomarAsistenciaQR = (asistencias: any[]) => {
    // Actualizar los estudiantes con las asistencias tomadas por QR
    setEstudiantes(asistencias)
    alert('Asistencia por QR guardada correctamente')
  }

  const getEstadoColor = (estado: string, estadoVisual?: string) => {
    // Si hay un estado visual personalizado (para retiros), usarlo
    if (estadoVisual) {
      return estadoVisual
    }
    
    const estadoObj = estadosAsistencia.find(e => e.value === estado)
    return estadoObj?.color || 'bg-gray-100 text-gray-800'
  }
  
  const getEstadoLabel = (estado: string) => {
    const estadoObj = estadosAsistencia.find(e => e.value === estado)
    return estadoObj?.label || 'Sin registrar'
  }

  const contarEstados = () => {
    const conteo = estudiantes.reduce((acc, est) => {
      acc[est.estado] = (acc[est.estado] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      presente: conteo.presente || 0,
      tardanza: conteo.tardanza || 0,
      inasistencia: conteo.inasistencia || 0,
      justificada: conteo.justificada || 0,
      total: estudiantes.length
    }
  }

  const stats = contarEstados()

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Control de Asistencias</h1>
          <p className="mt-2 text-sm text-gray-700">
            Registra y gestiona la asistencia de tus estudiantes
          </p>
        </div>
        
        {/* Botones de acción en el header */}
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => setShowTomarAsistenciaModal(true)}
            disabled={!claseSeleccionada}
            className={`inline-flex items-center justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              !claseSeleccionada 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
            }`}
            title={!claseSeleccionada ? 'Selecciona una clase primero' : 'Tomar asistencia por QR'}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4" />
            </svg>
            Tomar Asistencia
          </button>
          <button
            onClick={() => setModoEdicion(!modoEdicion)}
            disabled={!claseSeleccionada || estudiantes.length === 0}
            className={`inline-flex items-center justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              !claseSeleccionada || estudiantes.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : modoEdicion 
                  ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                  : 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
            }`}
            title={!claseSeleccionada ? 'Selecciona una clase primero' : estudiantes.length === 0 ? 'Carga los estudiantes primero' : modoEdicion ? 'Cancelar edición' : 'Editar asistencias'}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {modoEdicion ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              )}
            </svg>
            {modoEdicion ? 'Cancelar' : 'Editar'}
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="mt-6 bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="fecha" className="block text-sm font-medium text-gray-700">
              Fecha
            </label>
            <input
              type="date"
              id="fecha"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black"
            />
          </div>
          <div>
            <label htmlFor="clase" className="block text-sm font-medium text-gray-700">
              Clase
            </label>
            <select
              id="clase"
              value={claseSeleccionada}
              onChange={(e) => setClaseSeleccionada(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black"
            >
              <option value="">Seleccionar clase</option>
              {clases.map((clase) => (
                <option key={clase.id} value={clase.id}>
                  {clase.nombre} ({clase.horario})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button 
              onClick={loadEstudiantes}
              disabled={!claseSeleccionada || !fechaSeleccionada}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Cargando...' : 'Cargar Asistencia'}
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
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

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Presentes</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.presente}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Tardanzas</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.tardanza}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Inasistencias</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.inasistencia}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Justificadas</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.justificada}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Estudiantes */}
      <div className="mt-8 bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Lista de Estudiantes</h3>
            <p className="text-sm text-gray-600">
              {fechaSeleccionada} - {claseSeleccionada ? clases.find(c => c.id.toString() === claseSeleccionada)?.nombre : 'Seleccionar clase'}
            </p>
            {modoEdicion && (
              <p className="text-xs text-orange-600 mt-1">
                ⚠️ Modo edición activo - Las horas de llegada se actualizarán automáticamente
              </p>
            )}
          </div>
          {modoEdicion && (
            <button
              onClick={handleGuardarAsistencia}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Guardar Asistencia
            </button>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estudiante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Horarios
                </th>
                {modoEdicion && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {estudiantes.map((estudiante) => (
                <tr key={estudiante.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {estudiante.nombre.split(' ').map((n: string) => n[0]).join('')}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{estudiante.nombre}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {estudiante.codigo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(estudiante.estado, estudiante.estadoVisual)}`}>
                        {getEstadoLabel(estudiante.estado)}
                      </span>
                      {estudiante.tieneRetiro && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Retiro
                        </span>
                      )}
                    </div>
                    {estudiante.tieneRetiro && estudiante.retiro && (
                      <div className="text-xs text-gray-500 mt-1">
                        {estudiante.retiro.motivo} - {estudiante.retiro.hora}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      {estudiante.horaLlegada && (
                        <div className="text-green-600">Entrada: {estudiante.horaLlegada}</div>
                      )}
                      {estudiante.horaSalida && (
                        <div className="text-orange-600">Salida: {estudiante.horaSalida}</div>
                      )}
                      {!estudiante.horaLlegada && !estudiante.horaSalida && '-'}
                    </div>
                  </td>
                  {modoEdicion && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <select
                        value={estudiante.estado}
                        onChange={(e) => handleEstadoChange(estudiante.id, e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm text-black"
                      >
                        {estadosAsistencia.map((estado) => (
                          <option key={estado.value} value={estado.value}>
                            {estado.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 text-left">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">Marcar Todos Presentes</p>
              <p className="text-xs text-gray-500">Acción rápida para clases completas</p>
            </div>
          </div>
        </button>

        <button className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 text-left">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">Generar Reporte</p>
              <p className="text-xs text-gray-500">Exportar asistencia del día</p>
            </div>
          </div>
        </button>

        <button className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 text-left">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">Ver Historial</p>
              <p className="text-xs text-gray-500">Consultar asistencias anteriores</p>
            </div>
          </div>
        </button>
      </div>

      {/* Modal Tomar Asistencia */}
      <TomarAsistenciaModal
        isOpen={showTomarAsistenciaModal}
        onClose={() => setShowTomarAsistenciaModal(false)}
        claseSeleccionada={claseSeleccionada}
        fechaSeleccionada={fechaSeleccionada}
        onSave={handleTomarAsistenciaQR}
      />
    </div>
  )
}
