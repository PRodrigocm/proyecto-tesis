'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import TomarAsistenciaButton from '@/components/docente/TomarAsistenciaButton'

export default function DocenteAsistencias() {
  const router = useRouter()
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

  // Escuchar eventos de actualización de asistencia desde la pestaña de tomar asistencia
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verificar origen
      if (event.origin !== window.location.origin) return
      
      if (event.data?.type === 'ASISTENCIA_UPDATED') {
        console.log('📨 Mensaje recibido de pestaña de asistencia:', event.data)
        // Recargar estudiantes automáticamente
        if (token && claseSeleccionada) {
          loadEstudiantes()
        }
      }
    }

    window.addEventListener('message', handleMessage)
    
    // También escuchar cuando la ventana recupera el foco (usuario vuelve de la pestaña)
    const handleFocus = () => {
      console.log('🔄 Ventana recuperó el foco, recargando estudiantes...')
      if (token && claseSeleccionada) {
        loadEstudiantes()
      }
    }
    
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('message', handleMessage)
      window.removeEventListener('focus', handleFocus)
    }
  }, [token, claseSeleccionada, fechaSeleccionada])

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
    if (!token) {
      console.warn('⚠️ No hay token disponible para cargar estudiantes')
      return
    }
    
    try {
      setLoading(true)
      console.log('🔍 Cargando estudiantes para clase:', claseSeleccionada, 'fecha:', fechaSeleccionada)
      console.log('🔑 Token disponible:', token ? 'SÍ' : 'NO')

      const response = await fetch(`/api/docentes/asistencia/tomar?claseId=${claseSeleccionada}&fecha=${fechaSeleccionada}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('📡 Respuesta de estudiantes:', response.status, response.statusText)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Estudiantes cargados desde API:', data.estudiantes)
        console.log('📊 Estados de estudiantes:', data.estudiantes.map((e: any) => ({ nombre: e.nombre, estado: e.estado })))
        setEstudiantes(data.estudiantes || [])
      } else {
        console.error('❌ Error al cargar estudiantes:', response.status)
        setEstudiantes([])
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

  const handleGuardarAsistencia = async () => {
    if (!token || !claseSeleccionada) return
    
    try {
      setLoading(true)
      const estudiantesEditados = estudiantes.filter(e => e.editado)
      
      if (estudiantesEditados.length === 0) {
        alert('No hay cambios para guardar')
        setModoEdicion(false)
        return
      }

      // Guardar cada asistencia editada
      for (const estudiante of estudiantesEditados) {
        await fetch('/api/asistencia', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            estudianteId: estudiante.id,
            claseId: claseSeleccionada,
            fecha: fechaSeleccionada,
            estado: estudiante.estado,
            horaLlegada: estudiante.horaLlegada
          })
        })
      }

      alert(`✅ ${estudiantesEditados.length} asistencia(s) guardada(s) correctamente`)
      setModoEdicion(false)
      loadEstudiantes() // Recargar para ver cambios
    } catch (error) {
      console.error('Error guardando asistencia:', error)
      alert('Error al guardar asistencia')
    } finally {
      setLoading(false)
    }
  }

  const handleMarcarTodosPresentes = () => {
    if (!claseSeleccionada || estudiantes.length === 0) {
      alert('Primero selecciona una clase y carga los estudiantes')
      return
    }
    
    const horaActual = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    
    setEstudiantes(prev => prev.map(est => ({
      ...est,
      estado: est.estado === 'sin_registrar' ? 'presente' : est.estado,
      horaLlegada: est.estado === 'sin_registrar' ? horaActual : est.horaLlegada,
      editado: est.estado === 'sin_registrar' ? true : est.editado
    })))
    
    setModoEdicion(true)
  }

  // Marcar como INASISTENCIA a todos los estudiantes sin registro QR
  const handleMarcarInasistencias = async () => {
    if (!claseSeleccionada || estudiantes.length === 0) {
      alert('Primero selecciona una clase y carga los estudiantes')
      return
    }

    const sinRegistrar = estudiantes.filter(e => e.estado === 'sin_registrar')
    
    if (sinRegistrar.length === 0) {
      alert('✅ Todos los estudiantes ya tienen asistencia registrada')
      return
    }

    const confirmacion = confirm(
      `⚠️ ¿Estás seguro de marcar como INASISTENCIA a ${sinRegistrar.length} estudiante(s) sin registro?\n\n` +
      `Esto enviará notificaciones a los padres de familia.\n\n` +
      `Estudiantes afectados:\n${sinRegistrar.map(e => `• ${e.nombre}`).join('\n')}`
    )

    if (!confirmacion) return

    try {
      setLoading(true)
      let exitosos = 0
      let fallidos = 0

      for (const estudiante of sinRegistrar) {
        try {
          const response = await fetch('/api/asistencia', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              estudianteId: estudiante.id,
              claseId: claseSeleccionada,
              fecha: fechaSeleccionada,
              estado: 'AUSENTE',
              observaciones: 'Inasistencia registrada automáticamente - Sin registro QR'
            })
          })

          if (response.ok) {
            exitosos++
          } else {
            fallidos++
          }
        } catch (error) {
          console.error(`Error marcando inasistencia para ${estudiante.nombre}:`, error)
          fallidos++
        }
      }

      if (exitosos > 0) {
        alert(`✅ ${exitosos} inasistencia(s) registrada(s) correctamente.\n${fallidos > 0 ? `❌ ${fallidos} fallaron.` : ''}\n\nSe han enviado notificaciones a los padres.`)
        loadEstudiantes() // Recargar para ver cambios
      } else {
        alert('❌ No se pudo registrar ninguna inasistencia')
      }
    } catch (error) {
      console.error('Error marcando inasistencias:', error)
      alert('❌ Error al marcar inasistencias')
    } finally {
      setLoading(false)
    }
  }

  const handleTomarAsistenciaQR = async (estudiantesActualizados: any[]) => {
    console.log('📥 Callback directo recibido (no se usa, se prefiere el evento)')
    // No hacer nada aquí, el listener de eventos se encargará de recargar
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
    <div className="p-3 sm:p-4 md:p-6 lg:px-8">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Control de Asistencias</h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-700 hidden sm:block">
            Registra y gestiona la asistencia de tus estudiantes
          </p>
        </div>
        
        {/* Botones de acción - Grandes y táctiles */}
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <TomarAsistenciaButton
            claseId={claseSeleccionada}
            fecha={fechaSeleccionada}
            onAsistenciaUpdated={handleTomarAsistenciaQR}
            disabled={!claseSeleccionada || !esFechaHoy() || !hayClaseHoy}
          />
          <button
            onClick={() => setModoEdicion(!modoEdicion)}
            disabled={!claseSeleccionada || estudiantes.length === 0}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center rounded-md border border-transparent px-3 sm:px-4 py-2.5 sm:py-2 text-sm font-medium text-white shadow-sm min-h-[44px] ${
              !claseSeleccionada || estudiantes.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : modoEdicion 
                  ? 'bg-red-600 hover:bg-red-700 active:bg-red-800' 
                  : 'bg-orange-600 hover:bg-orange-700 active:bg-orange-800'
            }`}
          >
            <svg className="w-4 h-4 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {modoEdicion ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              )}
            </svg>
            <span>{modoEdicion ? 'Cancelar' : 'Editar'}</span>
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

      {/* Filtros - Responsive */}
      <div className="bg-gradient-to-br from-white to-gray-50 shadow-lg rounded-xl p-3 sm:p-4 md:p-6 border border-gray-200">
        <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4 md:mb-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-1.5 sm:p-2 rounded-lg">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">Fecha y Clase</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {/* Fecha */}
          <div>
            <label htmlFor="fecha" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2 flex items-center">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
              </svg>
              Fecha
            </label>
            <div className="relative">
              <input
                type="date"
                id="fecha"
                value={fechaSeleccionada}
                onChange={(e) => setFechaSeleccionada(e.target.value)}
                className="block w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black text-base sm:text-sm font-medium bg-white min-h-[44px]"
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
            <label htmlFor="clase" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2 flex items-center">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z"/>
              </svg>
              Clase
            </label>
            <select
              id="clase"
              value={claseSeleccionada}
              onChange={(e) => setClaseSeleccionada(e.target.value)}
              className="block w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black text-base sm:text-sm font-medium bg-white min-h-[44px]"
            >
              <option value="" className="text-gray-500">Seleccionar</option>
              {clases.map((clase) => (
                <option key={clase.id} value={clase.id} className="text-black font-medium">
                  {clase.nombre}
                </option>
              ))}
            </select>
            {clases.length === 0 && (
              <p className="mt-1 sm:mt-2 text-xs text-amber-600 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                Sin clases
              </p>
            )}
          </div>

          {/* Botón Cargar */}
          <div className="flex items-end col-span-1 sm:col-span-2 md:col-span-1">
            <button 
              onClick={loadEstudiantes}
              disabled={!claseSeleccionada || !fechaSeleccionada || loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 transition-all shadow-md disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed font-semibold flex items-center justify-center space-x-2 min-h-[44px]"
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

      {/* Estadísticas - Compactas en móvil */}
      <div className="mt-4 md:mt-6 grid grid-cols-5 gap-1.5 sm:gap-2 md:gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg p-2 sm:p-3">
          <div className="text-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-500 rounded-md flex items-center justify-center mx-auto mb-1">
              <span className="text-white text-xs sm:text-sm">👥</span>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-500">Total</p>
            <p className="text-base sm:text-lg font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-2 sm:p-3">
          <div className="text-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-md flex items-center justify-center mx-auto mb-1">
              <span className="text-white text-xs sm:text-sm">✓</span>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-500">Pres.</p>
            <p className="text-base sm:text-lg font-bold text-green-600">{stats.presente}</p>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-2 sm:p-3">
          <div className="text-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-500 rounded-md flex items-center justify-center mx-auto mb-1">
              <span className="text-white text-xs sm:text-sm">⏰</span>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-500">Tard.</p>
            <p className="text-base sm:text-lg font-bold text-yellow-600">{stats.tardanza}</p>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-2 sm:p-3">
          <div className="text-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-500 rounded-md flex items-center justify-center mx-auto mb-1">
              <span className="text-white text-xs sm:text-sm">✗</span>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-500">Inas.</p>
            <p className="text-base sm:text-lg font-bold text-red-600">{stats.inasistencia}</p>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-2 sm:p-3">
          <div className="text-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-md flex items-center justify-center mx-auto mb-1">
              <span className="text-white text-xs sm:text-sm">📄</span>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-500">Just.</p>
            <p className="text-base sm:text-lg font-bold text-blue-600">{stats.justificada}</p>
          </div>
        </div>
      </div>

      {/* Lista de Estudiantes */}
      <div className="mt-4 sm:mt-6 bg-white shadow rounded-lg overflow-hidden">
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Estudiantes</h3>
              <p className="text-sm text-gray-600">
                {fechaSeleccionada} - {claseSeleccionada ? clases.find(c => c.id.toString() === claseSeleccionada)?.nombre : 'Seleccionar clase'}
              </p>
              {modoEdicion && (
                <p className="text-xs text-orange-600 mt-1">
                  ⚠️ Modo edición activo - Las horas de llegada se actualizarán automáticamente
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Botón Marcar Inasistencias - Solo visible si hay estudiantes sin registrar */}
              {estudiantes.filter(e => e.estado === 'sin_registrar').length > 0 && esFechaHoy() && (
                <button
                  onClick={handleMarcarInasistencias}
                  disabled={loading}
                  className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-md shadow-sm transition-colors min-h-[40px] disabled:bg-gray-400"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="hidden sm:inline">Marcar Inasistencias</span>
                  <span className="sm:hidden">Inasist.</span>
                  <span className="ml-1 bg-red-800 px-1.5 py-0.5 rounded text-xs">
                    {estudiantes.filter(e => e.estado === 'sin_registrar').length}
                  </span>
                </button>
              )}
              {modoEdicion && (
                <button
                  onClick={handleGuardarAsistencia}
                  className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm transition-colors min-h-[40px]"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Guardar
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Vista móvil - tarjetas */}
        <div className="sm:hidden divide-y divide-gray-200">
          {estudiantes.map((estudiante) => (
            <div key={estudiante.id} className="p-3 hover:bg-gray-50 active:bg-gray-100">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-gray-700">
                      {estudiante.nombre.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{estudiante.nombre}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${getEstadoColor(estudiante.estado, estudiante.estadoVisual)}`}>
                        {getEstadoLabel(estudiante.estado)}
                      </span>
                      {estudiante.horaLlegada && (
                        <span className="text-[10px] text-green-600">{estudiante.horaLlegada}</span>
                      )}
                      {estudiante.tieneRetiro && (
                        <span className="text-[10px] text-orange-600">🚪</span>
                      )}
                    </div>
                  </div>
                </div>
                {modoEdicion && (
                  <select
                    value={estudiante.estado}
                    onChange={(e) => handleEstadoChange(estudiante.id, e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm text-xs text-black py-1.5 px-2 min-h-[36px]"
                  >
                    {estadosAsistencia.map((estado) => (
                      <option key={estado.value} value={estado.value}>
                        {estado.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Vista desktop - tabla */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estudiante
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Código
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hora
                </th>
                {modoEdicion && (
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {estudiantes.map((estudiante) => (
                <tr key={estudiante.id} className="hover:bg-gray-50">
                  <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10">
                        <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-xs md:text-sm font-medium text-gray-700">
                            {estudiante.nombre.split(' ').map((n: string) => n[0]).join('')}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3 md:ml-4">
                        <div className="text-sm font-medium text-gray-900">{estudiante.nombre}</div>
                        <div className="text-xs text-gray-500 md:hidden">{estudiante.codigo}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                    {estudiante.codigo}
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1 md:space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(estudiante.estado, estudiante.estadoVisual)}`}>
                        {getEstadoLabel(estudiante.estado)}
                      </span>
                      {estudiante.tieneRetiro && (
                        <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                          🚪
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500">
                    <div>
                      {estudiante.horaLlegada && (
                        <div className="text-green-600">{estudiante.horaLlegada}</div>
                      )}
                      {estudiante.horaSalida && (
                        <div className="text-orange-600">{estudiante.horaSalida}</div>
                      )}
                      {!estudiante.horaLlegada && !estudiante.horaSalida && '-'}
                    </div>
                  </td>
                  {modoEdicion && (
                    <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm font-medium">
                      <select
                        value={estudiante.estado}
                        onChange={(e) => handleEstadoChange(estudiante.id, e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm text-black min-h-[36px]"
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
      <div className="mt-4 sm:mt-6 grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 pb-4">
        <button 
          onClick={handleMarcarTodosPresentes}
          disabled={!claseSeleccionada || estudiantes.length === 0 || !esFechaHoy()}
          className={`bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow hover:shadow-md active:bg-gray-50 transition-all border border-gray-200 text-center sm:text-left ${
            !claseSeleccionada || estudiantes.length === 0 || !esFechaHoy() ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-lg">✅</span>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-900">Todos Presentes</p>
              <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">Sin registrar → Presente</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => router.push('/docente/reportes')}
          className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow hover:shadow-md active:bg-gray-50 transition-all border border-gray-200 text-center sm:text-left"
        >
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-lg">📊</span>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-900">Reportes</p>
              <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">Ver reportes</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => router.push('/docente/horarios')}
          className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow hover:shadow-md active:bg-gray-50 transition-all border border-gray-200 text-center sm:text-left"
        >
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🕐</span>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-900">Horarios</p>
              <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">Ver horarios</p>
            </div>
          </div>
        </button>
      </div>

    </div>
  )
}
