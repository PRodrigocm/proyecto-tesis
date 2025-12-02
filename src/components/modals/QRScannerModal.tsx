'use client'

import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import {
  XMarkIcon,
  QrCodeIcon,
  CameraIcon,
  UserGroupIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline'

interface Estudiante {
  id: string
  nombre: string
  apellido: string
  dni: string
  grado: string
  seccion: string
  accion: string
  hora: string
  codigo?: string
  estado?: 'PRESENTE' | 'AUSENTE' | 'RETIRADO' | 'TARDANZA'
  duplicado?: boolean
  mensajeDuplicado?: string
}

interface CameraDevice {
  id: string
  label: string
}

interface QRScannerModalProps {
  isOpen: boolean
  onClose: () => void
  accionSeleccionada: 'entrada' | 'salida'
  setAccionSeleccionada: (accion: 'entrada' | 'salida') => void
  qrCode: string
  setQrCode: (code: string) => void
  handleQRScan: () => void
  estudiantesEscaneados: Estudiante[]
  setEstudiantesEscaneados: (estudiantes: Estudiante[] | ((prev: Estudiante[]) => Estudiante[])) => void
}

export default function QRScannerModal({
  isOpen,
  onClose,
  accionSeleccionada,
  setAccionSeleccionada,
  qrCode,
  setQrCode,
  handleQRScan,
  estudiantesEscaneados,
  setEstudiantesEscaneados
}: QRScannerModalProps) {
  const [ultimoEscaneo, setUltimoEscaneo] = useState<string>('')
  const [estudianteEscaneado, setEstudianteEscaneado] = useState<Estudiante | null>(null)
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState<boolean>(false)
  const [camaras, setCamaras] = useState<CameraDevice[]>([])
  const [camaraSeleccionada, setCamaraSeleccionada] = useState<string>('')
  const [scannerActive, setScannerActive] = useState<boolean>(false)
  const [modoEscaneo, setModoEscaneo] = useState<'camara' | 'manual'>('camara')
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [permisosCamara, setPermisosCamara] = useState<'granted' | 'denied' | 'pending'>('pending')
  const [error, setError] = useState<string>('')
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [procesandoEscaneo, setProcesandoEscaneo] = useState<boolean>(false)
  const [contadorProcesados, setContadorProcesados] = useState<number>(0)
  
  // Sistema de debouncing robusto
  const ultimoEscaneoRef = useRef<{ codigo: string, timestamp: number } | null>(null)
  const codigosCooldownRef = useRef<Map<string, number>>(new Map())
  const codigosProcesadosRef = useRef<Set<string>>(new Set()) // Códigos ya procesados exitosamente
  const COOLDOWN_DURACION = 5000 // 5 segundos de cooldown por código (reducido)
  const DEBOUNCE_DURACION = 300 // 300ms entre escaneos (reducido)

  // Cargar estudiantes para mostrar información
  useEffect(() => {
    if (isOpen) {
      // Solo cargar estudiantes si la lista está vacía
      if (estudiantes.length === 0) {
        loadEstudiantes()
      }
      detectarCamaras()
    }
  }, [isOpen])

  // Limpieza automática de cooldowns antiguos cada 30 segundos
  useEffect(() => {
    if (!isOpen) return

    const intervalo = setInterval(() => {
      const ahora = Date.now()
      const codigosAEliminar: string[] = []
      
      codigosCooldownRef.current.forEach((timestamp, codigo) => {
        if (ahora - timestamp > COOLDOWN_DURACION * 2) { // Limpiar después del doble del cooldown
          codigosAEliminar.push(codigo)
        }
      })
      
      codigosAEliminar.forEach(codigo => {
        codigosCooldownRef.current.delete(codigo)
      })
      
      if (codigosAEliminar.length > 0) {
        console.log(`🧹 Limpiados ${codigosAEliminar.length} códigos antiguos del cooldown`)
      }
    }, 30000) // Cada 30 segundos

    return () => clearInterval(intervalo)
  }, [isOpen])

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
      }
    } catch (error) {
      console.error('Error loading estudiantes:', error)
    }
  }

  // Detectar cámaras disponibles
  const detectarCamaras = async () => {
    try {
      setError('')
      setPermisosCamara('pending')
      
      const devices = await Html5Qrcode.getCameras()
      if (devices && devices.length) {
        const camarasFormateadas = devices.map((device, index) => ({
          id: device.id,
          label: device.label || `Cámara ${index + 1}`
        }))
        setCamaras(camarasFormateadas)
        setCamaraSeleccionada(camarasFormateadas[0].id)
        setPermisosCamara('granted')
      } else {
        setError('No se encontraron cámaras disponibles')
        setPermisosCamara('denied')
      }
    } catch (error) {
      console.error('Error detecting cameras:', error)
      setError('Error al acceder a las cámaras. Verifica los permisos.')
      setPermisosCamara('denied')
    }
  }

  // Sistema de debouncing robusto para evitar escaneos múltiples
  const procesarCodigoQR = async (codigo: string) => {
    const ahora = Date.now()
    const codigoLimpio = codigo.trim()
    
    console.log('🔍 Código detectado:', codigoLimpio)
    console.log('📊 Estado actual:', {
      procesandoEscaneo,
      codigosProcesados: Array.from(codigosProcesadosRef.current),
      cooldownActivos: Array.from(codigosCooldownRef.current.keys())
    })
    
    // 1. VERIFICAR DEBOUNCE TEMPORAL (evitar escaneos muy rápidos)
    if (ultimoEscaneoRef.current) {
      const tiempoTranscurrido = ahora - ultimoEscaneoRef.current.timestamp
      if (tiempoTranscurrido < DEBOUNCE_DURACION) {
        console.log(`⏱️ Debounce activo: ${tiempoTranscurrido}ms < ${DEBOUNCE_DURACION}ms`)
        return
      }
    }
    
    try {
      // 2. VERIFICAR SI YA FUE PROCESADO EXITOSAMENTE (solo para esta sesión)
      if (codigosProcesadosRef.current.has(codigoLimpio)) {
        console.log(`🚫 Código ${codigoLimpio} ya fue procesado en esta sesión, ignorando`)
        setUltimoEscaneo(`${codigoLimpio} - Ya procesado en esta sesión`)
        setTimeout(() => setUltimoEscaneo(''), 2000)
        return
      }
      
      console.log(`🔍 Código ${codigoLimpio} no está en procesados, continuando...`)

      // 3. VERIFICAR COOLDOWN POR CÓDIGO ESPECÍFICO
      const ultimoCooldown = codigosCooldownRef.current.get(codigoLimpio)
      if (ultimoCooldown) {
        const tiempoRestante = ultimoCooldown + COOLDOWN_DURACION - ahora
        if (tiempoRestante > 0) {
          const segundosRestantes = Math.ceil(tiempoRestante / 1000)
          console.log(`🚫 Código ${codigoLimpio} en cooldown: ${segundosRestantes}s restantes`)
          setUltimoEscaneo(`${codigoLimpio} - Espera ${segundosRestantes}s`)
          setTimeout(() => setUltimoEscaneo(''), 2000)
          return
        }
      }
      
      // 4. VERIFICAR SI YA SE ESTÁ PROCESANDO
      if (procesandoEscaneo) {
        console.log('⚠️ Ya se está procesando un escaneo, ignorando')
        return
      }
      
      // 5. ACTUALIZAR REFERENCIAS DE CONTROL
      ultimoEscaneoRef.current = { codigo: codigoLimpio, timestamp: ahora }
      codigosCooldownRef.current.set(codigoLimpio, ahora)
      setProcesandoEscaneo(true)
      setUltimoEscaneo(codigoLimpio)
      
      console.log('✅ Procesando código:', codigoLimpio)
      
      // 6. VERIFICAR SI YA FUE ESCANEADO EN ESTA SESIÓN
      const yaEscaneado = estudiantesEscaneados.find(escaneado => escaneado.dni === codigoLimpio || escaneado.codigo === codigoLimpio)
      if (yaEscaneado) {
        console.log(`⚠️ Estudiante ya registrado: ${yaEscaneado.nombre} ${yaEscaneado.apellido}`)
        setUltimoEscaneo(`${codigoLimpio} - Ya registrado como ${yaEscaneado.accion}`)
        
        setTimeout(() => {
          alert(`⚠️ ${yaEscaneado.nombre} ${yaEscaneado.apellido} ya fue registrado como ${yaEscaneado.accion.toUpperCase()}`)
          setUltimoEscaneo('')
          setProcesandoEscaneo(false)
        }, 1000)
        return
      }
      
      // 7. ENVIAR DIRECTAMENTE A LA API (sin validar localmente)
      // La API buscará el estudiante en TODA la base de datos
      console.log('📡 Enviando código a la API para validación:', codigoLimpio)
      
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auxiliar/asistencia/qr-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          qrCode: codigoLimpio,
          accion: accionSeleccionada
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Verificar si es un duplicado - mostrar notificación temporal
        if (data.duplicado) {
          console.log('⚠️ Asistencia duplicada:', data.mensaje)
          
          // Mostrar información del estudiante con mensaje de duplicado
          setEstudianteEscaneado({
            id: data.estudiante.id.toString(),
            nombre: data.estudiante.nombre,
            apellido: data.estudiante.apellido,
            dni: data.estudiante.dni,
            grado: data.estudiante.grado,
            seccion: data.estudiante.seccion,
            accion: accionSeleccionada,
            hora: new Date().toLocaleTimeString(),
            duplicado: true,
            mensajeDuplicado: data.mensaje
          })
          
          // Mostrar overlay brevemente
          setMostrarConfirmacion(true)
          
          // Cerrar automáticamente después de 1.5 segundos
          setTimeout(() => {
            setMostrarConfirmacion(false)
            setEstudianteEscaneado(null)
            setUltimoEscaneo('')
            setProcesandoEscaneo(false)
          }, 1500)
          return
        }
        
        console.log('✅ Asistencia registrada exitosamente:', data.mensaje)
        
        // Marcar como procesado para evitar futuros escaneos
        codigosProcesadosRef.current.add(codigoLimpio)
        setContadorProcesados(codigosProcesadosRef.current.size)
        console.log(`✅ Código ${codigoLimpio} marcado como procesado (exitoso)`)
        
        // Mostrar estudiante escaneado
        setEstudianteEscaneado({
          id: data.estudiante.id.toString(),
          nombre: data.estudiante.nombre,
          apellido: data.estudiante.apellido,
          dni: data.estudiante.dni,
          grado: data.estudiante.grado,
          seccion: data.estudiante.seccion,
          accion: accionSeleccionada,
          hora: new Date().toLocaleTimeString()
        })
        
        // Mostrar confirmación exitosa
        setMostrarConfirmacion(true)
        
        // Agregar a lista de escaneados
        const nuevoEscaneado: Estudiante = {
          id: data.estudiante.id.toString(),
          nombre: data.estudiante.nombre,
          apellido: data.estudiante.apellido,
          dni: data.estudiante.dni,
          grado: data.estudiante.grado,
          seccion: data.estudiante.seccion,
          accion: accionSeleccionada,
          hora: new Date().toLocaleTimeString()
        }
        setEstudiantesEscaneados((prev: Estudiante[]) => [nuevoEscaneado, ...prev])
        
        // Limpiar después de 4 segundos
        setTimeout(() => {
          setMostrarConfirmacion(false)
          setTimeout(() => {
            setEstudianteEscaneado(null)
            setProcesandoEscaneo(false)
          }, 1000)
        }, 4000)
        
      } else {
        let errorMsg = 'Error desconocido'
        try {
          const responseText = await response.text()
          console.log('📄 Respuesta del servidor:', responseText)
          
          if (responseText) {
            try {
              const error = JSON.parse(responseText)
              errorMsg = error.error || error.mensaje || error.details || 'Error al procesar código QR'
              console.error('❌ Error de API:', error)
            } catch (parseError) {
              console.error('❌ Respuesta no es JSON válido:', responseText)
              errorMsg = `Error del servidor (${response.status}): ${responseText.substring(0, 100)}`
            }
          } else {
            errorMsg = `Error del servidor (${response.status}): Respuesta vacía`
          }
        } catch (e) {
          console.error('❌ Error al leer respuesta:', e)
          errorMsg = `Error al leer respuesta del servidor (${response.status})`
        }
        alert(`❌ ${errorMsg}`)
        setEstudianteEscaneado(null)
        setProcesandoEscaneo(false)
      }
    } catch (error) {
      console.error('❌ Error general:', error)
      alert('❌ Error al procesar código QR')
      setProcesandoEscaneo(false)
    }
  }

  // Iniciar scanner
  const iniciarEscaner = async () => {
    if (!camaraSeleccionada) return
    
    try {
      const scanner = new Html5Qrcode('qr-reader-auxiliar')
      scannerRef.current = scanner

      const config = {
        fps: 15,
        qrbox: function(viewfinderWidth: number, viewfinderHeight: number) {
          // Usar 90% del área disponible para maximizar el área de escaneo
          const qrboxPercentage = 0.9
          const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight)
          const calculatedSize = Math.floor(minEdgeSize * qrboxPercentage)
          // Asegurar que el tamaño mínimo sea 50px y máximo 600px
          const qrboxSize = Math.max(Math.min(calculatedSize, 600), 50)
          return {
            width: qrboxSize,
            height: qrboxSize
          }
        },
        aspectRatio: 1,
        videoConstraints: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'environment'
        }
      }

      await scanner.start(
        camaraSeleccionada,
        config,
        (decodedText) => {
          console.log('✅ QR escaneado:', decodedText)
          procesarCodigoQR(decodedText)
        },
        (errorMessage) => {
          // Error silencioso durante escaneo
        }
      )
      
      setScannerActive(true)
      setError('')
    } catch (error) {
      console.error('Error starting scanner:', error)
      setError('Error al iniciar el escáner')
    }
  }

  // Detener scanner
  const detenerEscaner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
        scannerRef.current = null
        setScannerActive(false)
      } catch (error) {
        console.error('Error stopping scanner:', error)
      }
    }
  }

  // Limpiar al cerrar
  const handleClose = () => {
    detenerEscaner()
    setUltimoEscaneo('')
    setEstudianteEscaneado(null)
    setMostrarConfirmacion(false)
    setProcesandoEscaneo(false)
    
    // Limpiar referencias de debouncing
    ultimoEscaneoRef.current = null
    codigosCooldownRef.current.clear()
    codigosProcesadosRef.current.clear()
    setContadorProcesados(0)
    
    console.log('🧹 Modal cerrado - Referencias de debouncing y códigos procesados limpiadas')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-center justify-center p-0 md:p-4">
      <div className="bg-white rounded-none md:rounded-lg shadow-xl w-full h-full md:max-w-6xl md:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header - Botón de cierre grande y accesible */}
        <div className="flex justify-between items-center p-3 md:p-6 border-b flex-shrink-0">
          <div className="flex-1">
            <h2 className="text-base md:text-xl font-bold text-black">Scanner QR</h2>
            <p className="text-xs md:text-sm text-black font-medium">
              {accionSeleccionada === 'entrada' ? '🟢 Entrada' : '🔵 Salida'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-600 text-xl font-bold transition-colors"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="p-3 md:p-6 flex-1 flex flex-col overflow-y-auto">
          {/* Selector de Modo */}
          <div className="mb-3 md:mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setModoEscaneo('camara')}
                className={`flex-1 md:flex-none px-3 md:px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  modoEscaneo === 'camara'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                📷 Cámara
              </button>
              <button
                onClick={() => setModoEscaneo('manual')}
                className={`flex-1 md:flex-none px-3 md:px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  modoEscaneo === 'manual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                ⌨️ Manual
              </button>
              <button
                onClick={() => {
                  const procesadosCount = codigosProcesadosRef.current.size
                  const cooldownCount = codigosCooldownRef.current.size
                  codigosProcesadosRef.current.clear()
                  codigosCooldownRef.current.clear()
                  setContadorProcesados(0)
                  console.log('🧹 Códigos procesados limpiados manualmente')
                  alert(`✅ Limpiados ${procesadosCount} códigos procesados y ${cooldownCount} en cooldown. Ahora puedes volver a escanear.`)
                }}
                className="px-3 md:px-4 py-2 rounded-lg font-medium text-sm bg-orange-600 text-white hover:bg-orange-700 transition-colors"
                title="Limpiar códigos ya procesados para permitir re-escaneo"
              >
                🧹 ({contadorProcesados})
              </button>
            </div>
          </div>

          {/* Selector de Acción */}
          <div className="mb-3 md:mb-6">
            <div className="flex items-center justify-center gap-2 md:gap-4">
              <button
                onClick={() => setAccionSeleccionada('entrada')}
                className={`flex-1 md:flex-none inline-flex items-center justify-center px-3 md:px-6 py-2 md:py-3 border text-xs md:text-sm font-medium rounded-md transition-colors ${
                  accionSeleccionada === 'entrada'
                    ? 'border-transparent text-white bg-green-600 hover:bg-green-700'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                <span className="hidden md:inline">Registrar </span>Entrada
              </button>
              <button
                onClick={() => setAccionSeleccionada('salida')}
                className={`flex-1 md:flex-none inline-flex items-center justify-center px-3 md:px-6 py-2 md:py-3 border text-xs md:text-sm font-medium rounded-md transition-colors ${
                  accionSeleccionada === 'salida'
                    ? 'border-transparent text-white bg-blue-600 hover:bg-blue-700'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <ArrowLeftOnRectangleIcon className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                <span className="hidden md:inline">Registrar </span>Salida
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Panel de escaneo - Ocupa 2/3 del espacio en desktop, toda la pantalla en móvil */}
            <div className="lg:col-span-2">
              {modoEscaneo === 'camara' ? (
                <div>
                  <h3 className="text-base md:text-lg font-medium mb-2 md:mb-4">Escanear Código QR</h3>
                  
                  {/* Selector de cámara */}
                  {camaras.length > 0 && (
                    <div className="mb-2 md:mb-4">
                      <label className="block text-xs md:text-sm font-medium text-black mb-1 md:mb-2">
                        Seleccionar Cámara:
                      </label>
                      <select
                        value={camaraSeleccionada}
                        onChange={(e) => setCamaraSeleccionada(e.target.value)}
                        className="w-full p-2 md:p-3 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                      >
                        {camaras.map((camara) => (
                          <option key={camara.id} value={camara.id}>
                            {camara.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Área de escaneo - Tamaño fijo */}
                  <div className="relative">
                    {/* Overlay con información del estudiante - Confirmación exitosa */}
                    {mostrarConfirmacion && estudianteEscaneado && (
                      <div className={`absolute top-6 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-xl shadow-2xl p-6 border-3 min-w-[300px] ${
                        estudianteEscaneado.duplicado ? 'border-yellow-500' : 'border-green-500 animate-bounce'
                      }`}>
                        <div className="flex items-center space-x-4">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center animate-pulse shadow-lg ${
                            estudianteEscaneado.duplicado ? 'bg-yellow-500' : 'bg-green-500'
                          }`}>
                            {estudianteEscaneado.duplicado ? (
                              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            ) : (
                              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className={`font-bold text-xl ${estudianteEscaneado.duplicado ? 'text-yellow-800' : 'text-green-800'}`}>
                              {estudianteEscaneado.nombre} {estudianteEscaneado.apellido}
                            </p>
                            <p className={`text-base font-medium mt-1 ${estudianteEscaneado.duplicado ? 'text-yellow-600' : 'text-green-600'}`}>
                              {estudianteEscaneado.duplicado 
                                ? `⚠️ Ya tiene ${accionSeleccionada} registrada`
                                : accionSeleccionada === 'entrada' ? '✅ Entrada Registrada' : '🚪 Salida Registrada'
                              }
                            </p>
                            {!estudianteEscaneado.duplicado && (
                              <p className="text-green-500 text-sm">
                                Registrado a las {estudianteEscaneado.hora}
                              </p>
                            )}
                          </div>
                        </div>
                        {!estudianteEscaneado.duplicado && (
                          <div className="mt-3 text-center">
                            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                              🎉 ¡{accionSeleccionada === 'entrada' ? 'Entrada' : 'Salida'} registrada exitosamente!
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Información del último estudiante escaneado */}
                    {ultimoEscaneo && estudianteEscaneado && !mostrarConfirmacion && (
                      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-40 bg-blue-600 text-white rounded-xl shadow-lg p-4 min-w-[250px]">
                        <div className="text-center">
                          <p className="font-bold text-lg">{estudianteEscaneado.nombre} {estudianteEscaneado.apellido}</p>
                          <p className="text-sm opacity-90 mt-1">Código: {ultimoEscaneo}</p>
                          <div className="mt-2 flex justify-center">
                            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {!scannerActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <button
                          onClick={iniciarEscaner}
                          disabled={!camaraSeleccionada || permisosCamara !== 'granted'}
                          className="px-6 py-4 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed min-h-[56px] min-w-[200px]"
                        >
                          📷 Iniciar Cámara
                        </button>
                      </div>
                    )}

                    {permisosCamara === 'pending' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-gray-600">Detectando cámaras...</p>
                        </div>
                      </div>
                    )}

                    {permisosCamara === 'denied' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-50">
                        <div className="text-center p-4">
                          <div className="text-red-500 mb-2">
                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                          </div>
                          <p className="text-red-700 font-medium mb-2">Permisos de cámara denegados</p>
                          <p className="text-red-600 text-sm mb-3">Se necesitan permisos para usar la cámara</p>
                          <button
                            onClick={detectarCamaras}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                          >
                            🔄 Reintentar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-base md:text-lg font-medium mb-2 md:mb-4">Código Manual</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={qrCode}
                      onChange={(e) => setQrCode(e.target.value)}
                      placeholder="Ingresar código QR"
                      className="flex-1 px-3 py-3 text-base border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black min-h-[48px]"
                      onKeyPress={(e) => e.key === 'Enter' && handleQRScan()}
                    />
                    <button
                      onClick={handleQRScan}
                      disabled={!qrCode.trim()}
                      className={`inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white min-h-[48px] min-w-[100px] disabled:opacity-50 disabled:cursor-not-allowed ${
                        accionSeleccionada === 'entrada' 
                          ? 'bg-green-600 hover:bg-green-700 active:bg-green-800'
                          : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                      }`}
                    >
                      <QrCodeIcon className="h-5 w-5 mr-1" />
                      {accionSeleccionada === 'entrada' ? 'Entrada' : 'Salida'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Lista de estudiantes - Abajo en móvil, al lado en desktop */}
            <div className="lg:col-span-1 mt-4 lg:mt-0">
              <h3 className="text-base md:text-lg font-medium mb-2 md:mb-4">
                Registrados Hoy ({estudiantesEscaneados.length})
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-3 md:p-4 max-h-96 overflow-y-auto">
                {estudiantesEscaneados.length > 0 ? (
                  <div className="space-y-3">
                    {estudiantesEscaneados.map((estudiante, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 shadow-sm border">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {estudiante.nombre} {estudiante.apellido}
                            </p>
                            <p className="text-sm text-gray-500">DNI: {estudiante.dni}</p>
                            <p className="text-xs text-gray-400">
                              {estudiante.grado} - {estudiante.seccion}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              estudiante.accion === 'entrada' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {estudiante.accion === 'entrada' ? 'Entrada' : 'Salida'}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              {estudiante.hora}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <UserGroupIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500">
                      No hay estudiantes registrados aún
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Los estudiantes aparecerán aquí al escanear sus códigos QR
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer - Botones grandes y táctiles */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 md:gap-3 mt-3 md:mt-6 pt-3 md:pt-6 border-t flex-shrink-0">
            <button
              onClick={() => setEstudiantesEscaneados([])}
              className="px-4 py-3 border border-gray-300 text-black text-sm font-medium rounded-lg hover:bg-gray-50 active:bg-gray-100 min-h-[48px] order-2 sm:order-1"
            >
              🗑️ Limpiar
            </button>
            
            <div className="flex gap-2 md:gap-3 order-1 sm:order-2">
              <button
                onClick={async () => {
                  if (estudiantesEscaneados.length === 0) {
                    alert('No hay estudiantes para guardar')
                    return
                  }
                  
                  try {
                    const token = localStorage.getItem('token')
                    const response = await fetch('/api/auxiliar/asistencia/guardar', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        estudiantes: estudiantesEscaneados,
                        fecha: new Date().toISOString().split('T')[0]
                      })
                    })
                    
                    if (response.ok) {
                      alert(`✅ Asistencia guardada para ${estudiantesEscaneados.length} estudiantes`)
                      setEstudiantesEscaneados([])
                      onClose()
                    } else {
                      const error = await response.json()
                      alert(`❌ Error: ${error.message || 'No se pudo guardar'}`)
                    }
                  } catch (error) {
                    console.error('Error guardando asistencia:', error)
                    alert('❌ Error al guardar')
                  }
                }}
                disabled={estudiantesEscaneados.length === 0}
                className="flex-1 sm:flex-none px-4 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="hidden sm:inline">Guardar</span>
              </button>
              
              <button
                onClick={handleClose}
                className="flex-1 sm:flex-none px-4 py-3 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 active:bg-gray-800 min-h-[48px]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
