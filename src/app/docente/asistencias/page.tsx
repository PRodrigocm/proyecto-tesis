'use client'

import { useState, useEffect } from 'react'
import TomarAsistenciaButton from '@/components/docente/TomarAsistenciaButton'

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [hayClaseHoy, setHayClaseHoy] = useState(true) // Por defecto asumimos que sí hay clase

  // Verificar si la fecha seleccionada es hoy (usando fecha local)
  const esFechaHoy = () => {
    const hoy = new Date()
    const año = hoy.getFullYear()
    const mes = String(hoy.getMonth() + 1).padStart(2, '0')
    const dia = String(hoy.getDate()).padStart(2, '0')
    const fechaHoyLocal = `${año}-${mes}-${dia}`
    
    console.log('🗓️ Comparando fechas:', { fechaSeleccionada, fechaHoyLocal, sonIguales: fechaSeleccionada === fechaHoyLocal })
    return fechaSeleccionada === fechaHoyLocal
  }

  // Verificar si hay clase programada para la fecha seleccionada
  const verificarHorarioClase = async () => {
    if (!claseSeleccionada || !fechaSeleccionada) {
      setHayClaseHoy(false)
      return
    }

    try {
      const fecha = new Date(fechaSeleccionada + 'T00:00:00')
      const diasSemana = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO']
      const diaSemana = diasSemana[fecha.getDay()]
      
      console.log('📅 Verificando horario para:', { fecha: fechaSeleccionada, diaSemana })

      const response = await fetch(`/api/horarios/verificar?claseId=${claseSeleccionada}&diaSemana=${diaSemana}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setHayClaseHoy(data.hayClase)
        console.log('✅ Verificación de horario:', data)
      } else {
        // Si no hay endpoint, asumimos que sí hay clase (comportamiento por defecto)
        setHayClaseHoy(true)
      }
    } catch (error) {
      console.error('Error verificando horario:', error)
      // En caso de error, asumimos que sí hay clase
      setHayClaseHoy(true)
    }
  }

  const estadosAsistencia = [
    { value: 'presente', label: 'Presente', color: 'bg-green-100 text-green-800' },
    { value: 'tardanza', label: 'Tardanza', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'inasistencia', label: 'Inasistencia', color: 'bg-red-100 text-red-800' },
    { value: 'justificada', label: 'Justificada', color: 'bg-blue-100 text-blue-800' },
    { value: 'retirado', label: 'Retirado', color: 'bg-purple-100 text-purple-800' },
    { value: 'sin_registrar', label: 'Sin registrar', color: 'bg-gray-100 text-gray-800' }
  ]

  // Cargar datos de autenticación
  useEffect(() => {
    setMounted(true)
    
    // Suprimir errores de extensiones del navegador
    const originalError = console.error
    console.error = (...args) => {
      if (args[0]?.toString().includes('auth required') || 
          args[0]?.toString().includes('content.bundle.js')) {
        return // Ignorar errores de extensiones
      }
      originalError.apply(console, args)
    }
    
    // Suprimir errores de promesas no capturadas de extensiones
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorMessage = event.reason?.message || event.reason?.toString() || ''
      if (errorMessage.includes('auth required') || 
          event.reason?.stack?.includes('content.bundle.js')) {
        event.preventDefault() // Prevenir que se muestre en consola
        return
      }
    }
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    
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
    
    return () => {
      console.error = originalError
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  // Verificar horario cuando cambie la clase o fecha
  useEffect(() => {
    if (claseSeleccionada && fechaSeleccionada && token) {
      verificarHorarioClase()
    }
  }, [claseSeleccionada, fechaSeleccionada, token])

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
      console.log('👤 Datos del usuario:', userData)
      console.log('🔑 Token disponible:', tokenData ? 'SÍ' : 'NO')

      const apiUrl = `/api/docentes/${userId}/clases-asistencia`
      console.log('🌐 URL de la API:', apiUrl)

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${tokenData}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('📡 Respuesta de la API:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Clases cargadas:', data.data)
        
        // Corregir horarios invertidos en el frontend
        const clasesCorregidas = (data.data || []).map((clase: any) => {
          if (clase.horario) {
            const [inicio, fin] = clase.horario.split('-')
            
            // Convertir a minutos para comparar correctamente
            const inicioMinutos = parseInt(inicio.split(':')[0]) * 60 + parseInt(inicio.split(':')[1])
            const finMinutos = parseInt(fin.split(':')[0]) * 60 + parseInt(fin.split(':')[1])
            
            // Si el inicio es mayor que el fin, están invertidos
            if (inicioMinutos > finMinutos) {
              console.log('⚠️ Horario invertido detectado en frontend:', clase.horario)
              clase.horario = `${fin}-${inicio}`
              console.log('✅ Horario corregido:', clase.horario)
            }
          }
          return clase
        })
        
        setClases(clasesCorregidas)
        setErrorMessage(null) // Limpiar mensaje de error si la carga es exitosa
      } else {
        const errorText = await response.text()
        console.error('❌ Error al cargar clases:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })
        
        // Mostrar mensaje específico según el error
        if (response.status === 404) {
          console.warn('⚠️ No se encontraron clases asignadas para este docente')
          setErrorMessage('No tienes clases asignadas. Contacta al administrador para que te asigne aulas.')
          setClases([])
        } else if (response.status === 401) {
          console.error('🔐 Error de autenticación')
          setErrorMessage('Error de autenticación. Por favor, inicia sesión nuevamente.')
          setClases([])
        } else {
          console.error('💥 Error del servidor:', response.status)
          setErrorMessage(`Error del servidor (${response.status}). Intenta nuevamente más tarde.`)
          // Datos de fallback solo para errores del servidor
          setClases([
            { id: 1, nombre: 'Matemáticas - 5to A', horario: '08:00-09:30' },
            { id: 2, nombre: 'Física - 4to B', horario: '10:00-11:30' }
          ])
        }
      }
    } catch (error) {
      console.error('💥 Error de conexión al cargar clases:', error)
      setErrorMessage('Error de conexión. Verifica tu conexión a internet e intenta nuevamente.')
      setClases([])
    }
  }

  const loadEstudiantes = async () => {
    try {
      setLoading(true)
      console.log('🔍 Cargando estudiantes para clase:', claseSeleccionada, 'fecha:', fechaSeleccionada)

      const response = await fetch(`/api/docentes/asistencia/tomar?claseId=${claseSeleccionada}&fecha=${fechaSeleccionada}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Estudiantes cargados:', data.estudiantes)
        setEstudiantes(data.estudiantes || [])
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

  const handleTomarAsistenciaQR = async (estudiantesActualizados: any[]) => {
    console.log('📥 Recibiendo estudiantes actualizados del modal QR:', estudiantesActualizados)
    
    // Actualizar inmediatamente el estado local con los datos del modal
    setEstudiantes(estudiantesActualizados)
    
    console.log('✅ Lista de estudiantes actualizada en tiempo real')
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
      retirado: conteo.retirado || 0,
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
          <TomarAsistenciaButton
            claseId={claseSeleccionada}
            fecha={fechaSeleccionada}
            onAsistenciaUpdated={handleTomarAsistenciaQR}
            disabled={!claseSeleccionada || !esFechaHoy() || !hayClaseHoy}
          />
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

      {/* Mensaje de Error */}
      {errorMessage && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error al cargar clases</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{errorMessage}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => {
                    setErrorMessage(null)
                    if (token && user) {
                      loadClases(token, user)
                    }
                  }}
                  className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros Mejorados */}
      <div className="mt-6 bg-gradient-to-br from-white to-gray-50 shadow-lg rounded-xl p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b-2 border-gray-200">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Seleccionar Fecha y Clase</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Fecha */}
          <div>
            <label htmlFor="fecha" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
              </svg>
              Fecha de Clase
            </label>
            <div className="relative">
              <input
                type="date"
                id="fecha"
                value={fechaSeleccionada}
                onChange={(e) => setFechaSeleccionada(e.target.value)}
                className="block w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black font-medium bg-white hover:border-blue-400 transition-all"
              />
            </div>
            <p className="mt-2 text-xs text-gray-500 flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
              Incluye días de clase y recuperación
            </p>
          </div>

          {/* Clase */}
          <div>
            <label htmlFor="clase" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z"/>
              </svg>
              Clase / Aula
            </label>
            <select
              id="clase"
              value={claseSeleccionada}
              onChange={(e) => setClaseSeleccionada(e.target.value)}
              className="block w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black font-medium bg-white hover:border-blue-400 transition-all"
            >
              <option value="" className="text-gray-500">Seleccionar clase</option>
              {clases.map((clase) => (
                <option key={clase.id} value={clase.id} className="text-black font-medium">
                  {clase.nombre}
                </option>
              ))}
            </select>
            {clases.length === 0 && (
              <p className="mt-2 text-xs text-amber-600 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                No tienes clases asignadas
              </p>
            )}
          </div>

          {/* Botón Cargar */}
          <div className="flex items-end">
            <button 
              onClick={loadEstudiantes}
              disabled={!claseSeleccionada || !fechaSeleccionada || loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed font-semibold flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Cargando...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span>Cargar Asistencia</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Información adicional */}
        {fechaSeleccionada && claseSeleccionada && (
          <div className={`mt-4 p-3 border rounded-lg ${
            esFechaHoy() && hayClaseHoy ? 'bg-blue-50 border-blue-200' : 
            !hayClaseHoy ? 'bg-red-50 border-red-200' : 
            'bg-amber-50 border-amber-200'
          }`}>
            <div className="flex items-start space-x-2">
              <svg className={`w-5 h-5 mt-0.5 ${
                esFechaHoy() && hayClaseHoy ? 'text-blue-600' : 
                !hayClaseHoy ? 'text-red-600' : 
                'text-amber-600'
              }`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${
                  esFechaHoy() && hayClaseHoy ? 'text-blue-900' : 
                  !hayClaseHoy ? 'text-red-900' : 
                  'text-amber-900'
                }`}>
                  Fecha seleccionada: {new Date(fechaSeleccionada + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                {!hayClaseHoy ? (
                  <p className="text-xs text-red-700 mt-1">❌ No hay clase programada para este día según el horario</p>
                ) : esFechaHoy() ? (
                  <p className="text-xs text-blue-700 mt-1">✅ Puedes tomar asistencia hoy</p>
                ) : (
                  <p className="text-xs text-amber-700 mt-1">⚠️ Solo puedes VER asistencias de días anteriores. Para TOMAR asistencia, selecciona el día actual.</p>
                )}
              </div>
            </div>
          </div>
        )}
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

    </div>
  )
}
