'use client'

import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface CameraDevice {
  id: string
  label: string
}

interface Estudiante {
  id: number
  nombre: string
  apellido: string
  dni: string
  codigo: string
  estado: 'presente' | 'tardanza' | 'pendiente' | 'sin_registrar'
  horaLlegada?: string
}

interface TomarAsistenciaPopupProps {
  claseSeleccionada: string
  fechaSeleccionada: string
  onSave: (estudiantes: Estudiante[]) => void
}

interface ClaseInfo {
  id: number
  nombre: string
  fecha: string
}

export default function TomarAsistenciaPopup({
  claseSeleccionada,
  fechaSeleccionada,
  onSave
}: TomarAsistenciaPopupProps) {
  // Estados principales
  const [loading, setLoading] = useState<boolean>(false)
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [estudianteEscaneado, setEstudianteEscaneado] = useState<Estudiante | null>(null)
  const [ultimoEscaneo, setUltimoEscaneo] = useState<string>('')
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState<boolean>(false)
  const [camaras, setCamaras] = useState<CameraDevice[]>([])
  const [camaraSeleccionada, setCamaraSeleccionada] = useState<string>('')
  const [scannerActive, setScannerActive] = useState<boolean>(false)
  const [modoEscaneo, setModoEscaneo] = useState<'camara' | 'manual'>('camara')
  const [codigoManual, setCodigoManual] = useState<string>('')
  const [procesandoEscaneo, setProcesandoEscaneo] = useState<boolean>(false)
  const [contadorProcesados, setContadorProcesados] = useState<number>(0)
  const [error, setError] = useState<string>('')
  const [permisosCamara, setPermisosCamara] = useState<'granted' | 'denied' | 'pending'>('pending')
  const [claseInfo, setClaseInfo] = useState<ClaseInfo | null>(null)
  const [cambiandoCamara, setCambiandoCamara] = useState<boolean>(false)
  const [notificacion, setNotificacion] = useState<{mensaje: string, tipo: 'info' | 'warning' | 'error'} | null>(null)

  // Referencias para debouncing
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const ultimoEscaneoRef = useRef<{ codigo: string, timestamp: number } | null>(null)
  const codigosCooldownRef = useRef<Map<string, number>>(new Map())
  const codigosProcesadosRef = useRef<Set<string>>(new Set())
  const COOLDOWN_DURACION = 5000
  const DEBOUNCE_DURACION = 300

  // Función para mostrar notificaciones temporales
  const mostrarNotificacion = (mensaje: string, tipo: 'info' | 'warning' | 'error' = 'info', duracion: number = 3000) => {
    setNotificacion({ mensaje, tipo })
    setTimeout(() => {
      setNotificacion(null)
    }, duracion)
  }

  // Cargar estudiantes
  const cargarEstudiantes = async () => {
    if (!claseSeleccionada || !fechaSeleccionada) return
    
    try {
      setLoading(true)
      setError('')
      
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No hay token de autenticación')

      const response = await fetch(`/api/docentes/asistencia/tomar?claseId=${claseSeleccionada}&fecha=${fechaSeleccionada}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setEstudiantes(data.estudiantes)
        setClaseInfo(data.clase)
      } else {
        const errorData = await response.json()
        setError(`Error: ${errorData.error || 'Error desconocido'}`)
        setEstudiantes([])
        setClaseInfo(null)
      }
    } catch (error) {
      console.error('Error cargando estudiantes:', error)
      setError('Error de conexión')
      setEstudiantes([])
    } finally {
      setLoading(false)
    }
  }

  // Detectar cámaras
  const detectarCamaras = async () => {
    try {
      setError('')
      setPermisosCamara('pending')
      
      const devices = await Html5Qrcode.getCameras()
      setCamaras(devices.map(device => ({
        id: device.id,
        label: device.label || `Cámara ${device.id}`
      })))
      
      if (devices.length > 0) {
        setCamaraSeleccionada(devices[0].id)
        setPermisosCamara('granted')
      }
    } catch (error) {
      console.error('Error detectando cámaras:', error)
      setError('No se pudieron detectar las cámaras')
      setPermisosCamara('denied')
    }
  }

  // Procesar código QR con debouncing
  const procesarCodigoQR = async (codigo: string) => {
    const ahora = Date.now()
    const codigoLimpio = codigo.trim()
    
    // Validaciones de debouncing
    if (ultimoEscaneoRef.current) {
      const tiempoTranscurrido = ahora - ultimoEscaneoRef.current.timestamp
      if (tiempoTranscurrido < DEBOUNCE_DURACION) return
    }
    
    // Si ya fue procesado, ignorar silenciosamente
    if (codigosProcesadosRef.current.has(codigoLimpio)) {
      console.log(`⏭️ Código ${codigoLimpio} ya procesado, ignorando...`)
      return
    }
    
    // Verificar si el estudiante ya tiene asistencia registrada
    const estudianteYaRegistrado = estudiantes.find(
      est => est.codigo === codigoLimpio && (est.estado === 'presente' || est.estado === 'tardanza')
    )
    
    if (estudianteYaRegistrado) {
      console.log(`⏭️ Estudiante ${estudianteYaRegistrado.nombre} ${estudianteYaRegistrado.apellido} ya tiene asistencia registrada, ignorando...`)
      // Marcar como procesado para no volver a intentar
      codigosProcesadosRef.current.add(codigoLimpio)
      setContadorProcesados(codigosProcesadosRef.current.size)
      return
    }
    
    const ultimoCooldown = codigosCooldownRef.current.get(codigoLimpio)
    if (ultimoCooldown && (ultimoCooldown + COOLDOWN_DURACION - ahora) > 0) {
      console.log(`⏭️ Código ${codigoLimpio} en cooldown, ignorando...`)
      return
    }
    
    if (procesandoEscaneo) return
    
    // Actualizar referencias
    ultimoEscaneoRef.current = { codigo: codigoLimpio, timestamp: ahora }
    codigosCooldownRef.current.set(codigoLimpio, ahora)
    setProcesandoEscaneo(true)
    setUltimoEscaneo(codigoLimpio)
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/docentes/asistencia/tomar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          qrCode: codigoLimpio,
          claseId: claseSeleccionada,
          fechaSeleccionada: fechaSeleccionada
        })
      })

      // Leer el body una sola vez
      const data = await response.json()
      
      if (response.ok) {
        if (data.duplicado) {
          // Ignorar silenciosamente duplicados
          console.log(`⏭️ Duplicado detectado: ${data.mensaje}, ignorando...`)
          // Marcar como procesado para no volver a intentar
          codigosProcesadosRef.current.add(codigoLimpio)
          setContadorProcesados(codigosProcesadosRef.current.size)
          setProcesandoEscaneo(false)
          return
        }

        // Marcar como procesado
        codigosProcesadosRef.current.add(codigoLimpio)
        setContadorProcesados(codigosProcesadosRef.current.size)
        
        // Recargar lista de estudiantes desde la API
        await cargarEstudiantes()
        
        console.log('🔔 Llamando a onSave')
        onSave(estudiantes)
        console.log('✅ onSave ejecutado')
        
        // Mostrar confirmación
        setEstudianteEscaneado({ 
          id: data.estudiante.id,
          nombre: data.estudiante.nombre,
          apellido: data.estudiante.apellido,
          dni: data.estudiante.dni,
          codigo: data.estudiante.codigo,
          estado: data.asistencia.estado.toLowerCase() as 'presente' | 'tardanza',
          horaLlegada: new Date(data.asistencia.horaRegistro).toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        })
        setMostrarConfirmacion(true)
        
        // Ocultar confirmación
        setTimeout(() => {
          setMostrarConfirmacion(false)
          setTimeout(() => {
            setEstudianteEscaneado(null)
            setProcesandoEscaneo(false)
          }, 1000)
        }, 4000)
        
      } else {
        // El body ya fue leído en 'data', usarlo directamente
        if (response.status === 404) {
          mostrarNotificacion(data.details || 'Estudiante no encontrado en esta clase', 'error', 4000)
        } else if (response.status === 403) {
          mostrarNotificacion(data.details || 'No autorizado para esta clase', 'error', 4000)
        } else {
          mostrarNotificacion(`Error: ${data.error || 'Error desconocido'}`, 'error', 4000)
        }
        setProcesandoEscaneo(false)
      }
      
    } catch (error) {
      console.error('❌ Error de conexión:', error)
      mostrarNotificacion('Error de conexión al registrar asistencia', 'error', 4000)
      setProcesandoEscaneo(false)
    }
  }

  // Iniciar escáner
  const iniciarEscaner = async () => {
    if (!camaraSeleccionada || scannerRef.current) {
      console.log('⚠️ No se puede iniciar escáner:', { camaraSeleccionada, scannerActive: !!scannerRef.current })
      return
    }
    
    try {
      console.log('🎥 Iniciando escáner con cámara:', camaraSeleccionada)
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner
      
      const config: any = {
        fps: 30, // Mayor FPS para mejor detección
        qrbox: undefined, // Sin qrbox = escanea toda el área de la cámara
        aspectRatio: 1.0,
        disableFlip: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true // Usar detector nativo del navegador si está disponible
        },
        videoConstraints: {
          facingMode: 'environment', // Cámara trasera preferida
          width: { ideal: 1920, min: 1280 }, // Alta resolución para detectar QR pequeños/lejanos
          height: { ideal: 1080, min: 720 }
        }
      }
      
      await scanner.start(
        camaraSeleccionada,
        config,
        (decodedText) => {
          procesarCodigoQR(decodedText.trim())
        },
        (errorMessage) => {
          if (errorMessage && !errorMessage.includes('NotFoundException')) {
            console.log('⚠️ Error de escaneo:', errorMessage)
          }
        }
      )

      setScannerActive(true)
      console.log('✅ Escáner iniciado correctamente')
      setError('') // Limpiar errores previos
    } catch (error) {
      console.error('❌ Error iniciando escáner:', error)
      setError('Error al iniciar el escáner. Verifica los permisos de cámara.')
      scannerRef.current = null
      setScannerActive(false)
    }
  }

  // Detener escáner
  const detenerEscaner = async () => {
    if (scannerRef.current) {
      try {
        // Solo intentar detener si está activo
        if (scannerActive) {
          await scannerRef.current.stop()
        }
        await scannerRef.current.clear()
        console.log('✅ Escáner detenido correctamente')
      } catch (error) {
        // Ignorar error si el escáner ya estaba detenido
        if (!String(error).includes('not running')) {
          console.error('Error deteniendo escáner:', error)
        }
      } finally {
        // Siempre limpiar referencias
        scannerRef.current = null
        setScannerActive(false)
      }
    }
  }

  // Efectos
  useEffect(() => {
    cargarEstudiantes()
    detectarCamaras()
    
    return () => {
      detenerEscaner()
    }
  }, [claseSeleccionada, fechaSeleccionada])

  // Auto-refresh cada 0.5 segundos para actualizar tarjetas en tiempo real
  useEffect(() => {
    if (!claseSeleccionada || !fechaSeleccionada) return

    console.log('🔄 Auto-refresh activado (cada 0.5s)')
    
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const response = await fetch(`/api/docentes/asistencia/tomar?claseId=${claseSeleccionada}&fecha=${fechaSeleccionada}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const data = await response.json()
          setEstudiantes(data.estudiantes)
        }
      } catch (error) {
        // Silencioso para no saturar consola
      }
    }, 3000) // Cada 3 segundos

    return () => {
      console.log('🛑 Auto-refresh detenido')
      clearInterval(interval)
    }
  }, [claseSeleccionada, fechaSeleccionada])

  useEffect(() => {
    if (camaraSeleccionada && modoEscaneo === 'camara' && permisosCamara === 'granted') {
      // Siempre detener primero y luego iniciar con la nueva cámara
      detenerEscaner().then(() => {
        setTimeout(() => {
          iniciarEscaner()
        }, 100) // Pequeño delay para asegurar que se detuvo completamente
      })
    } else {
      detenerEscaner()
    }
  }, [camaraSeleccionada, modoEscaneo, permisosCamara])

  return (
    <div className="min-h-full w-full">
      {/* Botón de cerrar flotante - Izquierda en móvil, derecha en desktop */}
      <button
        onClick={() => window.close()}
        className="fixed top-4 left-4 md:right-4 md:left-auto z-50 bg-red-600 text-white p-2 md:p-3 rounded-full shadow-lg hover:bg-red-700 transition-colors"
        title="Cerrar pestaña (Esc)"
      >
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Notificación flotante */}
      {notificacion && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-xl border transition-all duration-500 animate-pulse ${
          notificacion.tipo === 'info' ? 'bg-blue-600 text-white border-blue-700' :
          notificacion.tipo === 'warning' ? 'bg-yellow-600 text-white border-yellow-700' :
          'bg-red-600 text-white border-red-700'
        }`}>
          <div className="flex items-center space-x-3">
            <span className="text-xl">
              {notificacion.tipo === 'info' ? '✅' :
               notificacion.tipo === 'warning' ? '⚠️' :
               '❌'}
            </span>
            <span className="font-medium text-sm md:text-base">{notificacion.mensaje}</span>
          </div>
        </div>
      )}

      <div className="min-h-screen md:h-screen flex flex-col">
        {/* Layout responsivo */}
        <div className="flex-1 flex flex-col md:flex-row md:gap-4 pt-2 px-2 pb-2 md:p-4 md:px-6 overflow-y-auto md:overflow-hidden">
          {/* Panel de Escaneo - Más grande */}
          <div className="w-full md:w-3/5 bg-white rounded-lg shadow-lg p-3 md:p-4 mb-4 md:mb-0 flex flex-col">
            {/* Controles móvil - Visibles arriba */}
            <div className="md:hidden mb-2 sticky top-0 bg-white z-20 pb-2 -mx-3 px-3 pt-2 border-b border-gray-200">
              <div className="flex gap-2">
                <button
                  onClick={() => setModoEscaneo('camara')}
                  className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm ${
                    modoEscaneo === 'camara' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  📷 QR
                </button>
                <button
                  onClick={() => setModoEscaneo('manual')}
                  className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm ${
                    modoEscaneo === 'manual' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  ⌨️ Manual
                </button>
                <button
                  onClick={() => {
                    codigosProcesadosRef.current.clear()
                    codigosCooldownRef.current.clear()
                    ultimoEscaneoRef.current = null
                    setContadorProcesados(0)
                  }}
                  className="px-3 py-2 rounded-lg font-medium text-sm bg-orange-600 text-white shadow-sm"
                >
                  🧹 {contadorProcesados}
                </button>
              </div>
            </div>

            <h2 className="hidden md:block text-xl font-bold text-gray-900 mb-4">
              {modoEscaneo === 'camara' ? '📷 Escáner QR' : '⌨️ Código Manual'}
            </h2>
            
            {modoEscaneo === 'camara' ? (
              <div className="flex-1 flex flex-col space-y-2">
                {/* Selector de cámara - Visible en todos los dispositivos */}
                {camaras.length > 1 && (
                  <div className="sticky top-16 md:static bg-white z-10 pb-2 -mx-3 px-3 md:mx-0 md:px-0 border-b md:border-0 border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      📹 Cámara ({camaras.length}):
                    </label>
                    <select
                      value={camaraSeleccionada}
                      onChange={async (e) => {
                        const nuevaCamara = e.target.value
                        console.log('🔄 Cambiando cámara de', camaraSeleccionada, 'a', nuevaCamara)
                        
                        setCambiandoCamara(true)
                        
                        // Detener escáner actual
                        await detenerEscaner()
                        
                        // Cambiar cámara
                        setCamaraSeleccionada(nuevaCamara)
                        
                        // El useEffect se encargará de reiniciar el escáner
                        setTimeout(() => setCambiandoCamara(false), 1000)
                      }}
                      className="w-full p-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-black font-medium shadow-sm"
                      disabled={procesandoEscaneo}
                    >
                      {camaras.map((camara, index) => (
                        <option key={camara.id} value={camara.id}>
                          📷 {camara.label || `Cámara ${index + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Área del escáner - Expandida */}
                <div className="flex-1 flex items-center justify-center p-2">
                  <div className="relative w-full h-full max-w-lg">
                    <div 
                      id="qr-reader" 
                      className="w-full h-full border-2 border-blue-400 rounded-xl overflow-hidden bg-black shadow-lg"
                      style={{ minHeight: '350px', maxHeight: '500px' }}
                    />
                    
                    {!scannerActive && permisosCamara === 'pending' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-gray-600">Detectando cámaras...</p>
                        </div>
                      </div>
                    )}
                    
                    {permisosCamara === 'denied' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-lg">
                        <div className="text-center">
                          <p className="text-red-600 font-medium">❌ Sin acceso a cámara</p>
                          <p className="text-red-500 text-sm mt-1">Permite el acceso para escanear</p>
                        </div>
                      </div>
                    )}
                    
                    {cambiandoCamara && (
                      <div className="absolute inset-0 flex items-center justify-center bg-blue-50 rounded-lg">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-blue-600 font-medium">🔄 Cambiando cámara...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col space-y-2">
                {/* Búsqueda rápida con Enter */}
                <div>
                  <input
                    type="text"
                    value={codigoManual}
                    onChange={(e) => setCodigoManual(e.target.value)}
                    onKeyDown={(e) => {
                      const pendientes = estudiantes
                        .filter(est => est.estado === 'pendiente' || est.estado === 'sin_registrar')
                        .filter(est => {
                          if (!codigoManual.trim()) return true
                          const busqueda = codigoManual.toLowerCase()
                          const nombreCompleto = `${est.nombre} ${est.apellido}`.toLowerCase()
                          const apellidoNombre = `${est.apellido} ${est.nombre}`.toLowerCase()
                          return nombreCompleto.includes(busqueda) || apellidoNombre.includes(busqueda) ||
                                 est.codigo?.toLowerCase().includes(busqueda) || est.dni?.toLowerCase().includes(busqueda)
                        })
                      
                      // Enter = registrar el primero de la lista
                      if (e.key === 'Enter' && pendientes.length > 0 && !procesandoEscaneo) {
                        e.preventDefault()
                        procesarCodigoQR(pendientes[0].codigo)
                        setCodigoManual('')
                      }
                    }}
                    placeholder="🔍 Escribe y presiona ENTER..."
                    className="w-full p-4 border-2 border-blue-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-600 text-xl text-black font-medium shadow-sm"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-1 text-center">Escribe apellido/nombre y presiona <kbd className="bg-gray-200 px-1 rounded">Enter</kbd> para marcar</p>
                </div>
                
                {/* Lista filtrada - más compacta */}
                <div className="flex-1 overflow-y-auto rounded-lg bg-gray-50 border">
                  {(() => {
                    const pendientes = estudiantes
                      .filter(est => est.estado === 'pendiente' || est.estado === 'sin_registrar')
                      .filter(est => {
                        if (!codigoManual.trim()) return true
                        const busqueda = codigoManual.toLowerCase()
                        const nombreCompleto = `${est.nombre} ${est.apellido}`.toLowerCase()
                        const apellidoNombre = `${est.apellido} ${est.nombre}`.toLowerCase()
                        return nombreCompleto.includes(busqueda) || apellidoNombre.includes(busqueda) ||
                               est.codigo?.toLowerCase().includes(busqueda) || est.dni?.toLowerCase().includes(busqueda)
                      })
                    
                    if (pendientes.length === 0 && estudiantes.filter(e => e.estado === 'pendiente' || e.estado === 'sin_registrar').length === 0) {
                      return <div className="p-4 text-center text-green-600 font-medium">✅ Todos tienen asistencia</div>
                    }
                    
                    if (pendientes.length === 0) {
                      return <div className="p-4 text-center text-gray-500">No encontrado</div>
                    }
                    
                    return pendientes.map((estudiante, index) => (
                      <button
                        key={estudiante.id}
                        onClick={() => {
                          procesarCodigoQR(estudiante.codigo)
                          setCodigoManual('')
                        }}
                        disabled={procesandoEscaneo}
                        className={`w-full p-2 text-left border-b hover:bg-blue-100 transition-colors disabled:opacity-50 flex justify-between items-center ${
                          index === 0 && codigoManual.trim() ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                      >
                        <div className="font-medium text-gray-900 text-sm">
                          {estudiante.apellido}, {estudiante.nombre}
                        </div>
                        <span className="text-green-600 text-lg">✓</span>
                      </button>
                    ))
                  })()}
                </div>

                {/* Contador compacto */}
                <div className="text-center text-xs text-gray-500">
                  {estudiantes.filter(est => est.estado === 'pendiente' || est.estado === 'sin_registrar').length}/{estudiantes.length} pendientes
                </div>
              </div>
            )}
            
            {/* Estado del último escaneo */}
            {ultimoEscaneo && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 font-medium">
                  Último escaneo: {ultimoEscaneo}
                </p>
              </div>
            )}
            
            {/* Confirmación visual */}
            {mostrarConfirmacion && estudianteEscaneado && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">✓</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-green-800">
                      ¡Asistencia Registrada!
                    </h3>
                    <p className="text-green-700">
                      {estudianteEscaneado.nombre} {estudianteEscaneado.apellido}
                    </p>
                    <p className="text-green-600 text-sm">
                      Estado: {estudianteEscaneado.estado?.toUpperCase()} | 
                      Hora: {estudianteEscaneado.horaLlegada}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}
          </div>

          {/* Lista de Estudiantes - Más compacta */}
          <div className="w-full md:w-2/5 bg-white rounded-lg shadow-lg p-2 sm:p-3 md:p-4 flex flex-col">
            <div className="mb-2 sm:mb-3 md:mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
                  👥 <span className="hidden sm:inline">Estudiantes</span> ({estudiantes.length})
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-green-600 font-medium">✓ {estudiantes.filter(e => e.estado === 'presente' || e.estado === 'tardanza').length}</span>
                  <span className="text-xs text-gray-400">|</span>
                  <span className="text-xs text-orange-600 font-medium">⏳ {estudiantes.filter(e => e.estado === 'pendiente' || e.estado === 'sin_registrar').length}</span>
                </div>
              </div>
              {/* Info de clase - Solo móvil */}
              <p className="md:hidden text-[10px] sm:text-xs text-gray-600 mt-1 truncate">
                {claseInfo ? `${claseInfo.nombre} - ${fechaSeleccionada}` : `${fechaSeleccionada}`}
              </p>
            </div>
            
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <span className="text-gray-600 text-xs sm:text-sm">Cargando...</span>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-1.5 sm:space-y-2">
                {estudiantes.map((estudiante) => (
                  <div
                    key={estudiante.id}
                    className={`p-2 sm:p-3 rounded-lg border-2 cursor-pointer transition-colors active:scale-[0.98] ${
                      estudiante.estado === 'presente'
                        ? 'bg-green-50 border-green-200'
                        : estudiante.estado === 'tardanza'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100 active:bg-blue-50'
                    }`}
                    onClick={() => {
                      if (estudiante.estado === 'pendiente' || estudiante.estado === 'sin_registrar') {
                        procesarCodigoQR(estudiante.codigo)
                      }
                    }}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-xs sm:text-sm truncate">
                          {estudiante.apellido}, {estudiante.nombre}
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-600 truncate">
                          {estudiante.dni}
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                          estudiante.estado === 'presente'
                            ? 'bg-green-100 text-green-800'
                            : estudiante.estado === 'tardanza'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {estudiante.estado === 'presente' ? '✅' :
                           estudiante.estado === 'tardanza' ? '⏰' :
                           '⏳'}
                          <span className="hidden sm:inline ml-1">
                            {estudiante.estado === 'presente' ? 'Presente' :
                             estudiante.estado === 'tardanza' ? 'Tardanza' :
                             'Pendiente'}
                          </span>
                        </div>
                        {estudiante.horaLlegada && (
                          <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                            {estudiante.horaLlegada}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
