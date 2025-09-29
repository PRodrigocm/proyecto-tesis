'use client'

import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface Estudiante {
  id: number
  nombre: string
  codigo: string
  estado: 'pendiente' | 'presente' | 'tardanza'
  horaLlegada?: string
}

interface TomarAsistenciaModalProps {
  isOpen: boolean
  onClose: () => void
  claseSeleccionada: string
  fechaSeleccionada: string
  onSave: (asistencias: Estudiante[]) => void
}

interface CameraDevice {
  id: string
  label: string
}

export default function TomarAsistenciaModal({
  isOpen,
  onClose,
  claseSeleccionada,
  fechaSeleccionada,
  onSave
}: TomarAsistenciaModalProps) {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [loading, setLoading] = useState(false)

  const [ultimoEscaneo, setUltimoEscaneo] = useState<string>('')
  const [codigoManual, setCodigoManual] = useState<string>('')
  const [camaras, setCamaras] = useState<CameraDevice[]>([])
  const [camaraSeleccionada, setCamaraSeleccionada] = useState<string>('')
  const [camaraIP, setCamaraIP] = useState<string>('')
  const [ipValida, setIpValida] = useState<boolean>(false)
  const [usarCamaraIP, setUsarCamaraIP] = useState<boolean>(false)
  const [mostrarAyudaIP, setMostrarAyudaIP] = useState<boolean>(false)
  const [scannerActive, setScannerActive] = useState(false)
  const [modoEscaneo, setModoEscaneo] = useState<'camara' | 'manual'>('camara')
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [permisosCamara, setPermisosCamara] = useState<'granted' | 'denied' | 'pending'>('pending')
  const [error, setError] = useState<string>('')

  // Validar URL de cámara IP
  const validarIP = (url: string) => {
    if (!url.trim()) {
      setIpValida(false)
      return false
    }

    try {
      const urlObj = new URL(url)
      // Verificar que sea HTTP o HTTPS
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        setIpValida(false)
        return false
      }
      
      // Verificar que tenga un hostname válido
      if (!urlObj.hostname) {
        setIpValida(false)
        return false
      }

      // Verificar formato de IP local común
      const ipPattern = /^(http|https):\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|127\.)/
      const isLocalIP = ipPattern.test(url)
      
      if (isLocalIP || urlObj.hostname.includes('localhost')) {
        setIpValida(true)
        return true
      }

      // Permitir otras IPs válidas
      setIpValida(true)
      return true
    } catch {
      setIpValida(false)
      return false
    }
  }

  // Cargar estudiantes de la clase seleccionada
  const cargarEstudiantes = async () => {
    if (!claseSeleccionada || !fechaSeleccionada) return
    
    try {
      setLoading(true)
      setError('')
      console.log('🔍 Cargando estudiantes para clase:', claseSeleccionada, 'fecha:', fechaSeleccionada)

      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación')
      }

      const response = await fetch(`/api/asistencias/clase/${claseSeleccionada}?fecha=${fechaSeleccionada}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Estudiantes cargados:', data.data)
        
        // Transformar datos para el modal
        const estudiantesTransformados = data.data.map((est: any) => ({
          id: est.id,
          nombre: est.nombre,
          codigo: est.codigo,
          estado: est.estado === 'sin_registrar' ? 'pendiente' : 
                  est.estado === 'presente' ? 'presente' :
                  est.estado === 'tardanza' ? 'tardanza' : 'pendiente',
          horaLlegada: est.horaLlegada
        }))
        
        setEstudiantes(estudiantesTransformados)
      } else {
        console.error('❌ Error al cargar estudiantes:', response.status)
        // Datos de fallback si hay error
        setEstudiantes([
          {
            id: 1,
            nombre: 'Juan Pérez',
            codigo: 'EST001',
            estado: 'pendiente'
          },
          {
            id: 2,
            nombre: 'María González',
            codigo: 'EST002',
            estado: 'pendiente'
          }
        ])
      }
    } catch (error) {
      console.error('Error cargando estudiantes:', error)
      setError('Error al cargar estudiantes de la clase')
      // Datos de fallback
      setEstudiantes([
        {
          id: 1,
          nombre: 'Juan Pérez',
          codigo: 'EST001',
          estado: 'pendiente'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  // Función para reproducir sonido de confirmación
  const reproducirSonidoConfirmacion = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.2)
    } catch (error) {
      console.log('No se pudo reproducir el sonido:', error)
    }
  }

  // Procesar código QR o manual
  const procesarCodigo = (codigo: string) => {
    console.log('Procesando código:', codigo)
    setUltimoEscaneo(codigo)
    
    const estudiante = estudiantes.find(est => est.codigo === codigo)
    
    if (estudiante && estudiante.estado === 'pendiente') {
      const ahora = new Date()
      const horaActual = ahora.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
      
      // Determinar si es tardanza (después de las 8:10 AM)
      const horaLimite = new Date()
      horaLimite.setHours(8, 10, 0, 0)
      
      const nuevoEstado = ahora > horaLimite ? 'tardanza' : 'presente'
      
      setEstudiantes(prev => prev.map(est => 
        est.id === estudiante.id 
          ? { ...est, estado: nuevoEstado, horaLlegada: horaActual }
          : est
      ))
      
      reproducirSonidoConfirmacion()
      alert(`${estudiante.nombre} registrado como ${nuevoEstado} a las ${horaActual}`)
    } else if (estudiante && estudiante.estado !== 'pendiente') {
    } else {
      alert('Código no válido o estudiante no encontrado')
    }
  }

  // Detectar cámaras disponibles
  const detectarCamaras = async () => {
    try {
      console.log('🔍 Detectando cámaras disponibles...')
      setError('')
      
      // Verificar soporte del navegador
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador no soporta acceso a cámara')
      }
      
      // Solicitar permisos de cámara siempre que estemos en modo cámara
      if (modoEscaneo === 'camara') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true })
          stream.getTracks().forEach(track => track.stop())
          console.log('✅ Permisos de cámara obtenidos')
          setPermisosCamara('granted')
        } catch (permissionError) {
          console.error('❌ Error de permisos:', permissionError)
          setPermisosCamara('denied')
          setError('Se requieren permisos de cámara para escanear códigos QR. Puedes usar el modo manual como alternativa.')
          return // No lanzar error, solo mostrar mensaje
        }
      }
      
      // Obtener lista de dispositivos
      let devices: any[] = []
      try {
        devices = await Html5Qrcode.getCameras()
        console.log('📷 Dispositivos encontrados:', devices)
      } catch (cameraError) {
        console.error('❌ Error al obtener cámaras:', cameraError)
        throw new Error('No se pudieron detectar las cámaras disponibles')
      }
      
      if (devices.length === 0) {
        throw new Error('No se encontraron cámaras disponibles')
      }
      
      const camarasFormateadas = devices.map((device, index) => {
        let label = device.label || `Cámara ${index + 1}`
        
        if (label.toLowerCase().includes('back') || 
            label.toLowerCase().includes('rear') || 
            label.toLowerCase().includes('environment')) {
          label = `📱 ${label} (Trasera)`
        } else if (label.toLowerCase().includes('front') || 
                   label.toLowerCase().includes('user') || 
                   label.toLowerCase().includes('selfie')) {
          label = `🤳 ${label} (Frontal)`
        } else if (label.toLowerCase().includes('usb') || 
                   label.toLowerCase().includes('webcam')) {
          label = `💻 ${label} (USB/Webcam)`
        }
        
        return {
          id: device.id,
          label: label
        }
      })
      
      setCamaras(camarasFormateadas)
      
      // Seleccionar cámara por defecto (preferir trasera)
      if (camarasFormateadas.length > 0) {
        const camaraTrasera = camarasFormateadas.find(cam => 
          cam.label.toLowerCase().includes('trasera') || 
          cam.label.toLowerCase().includes('back') ||
          cam.label.toLowerCase().includes('rear') ||
          cam.label.toLowerCase().includes('environment')
        )
        
        const camaraDefault = camaraTrasera || camarasFormateadas[0]
        setCamaraSeleccionada(camaraDefault.id)
        console.log('🎯 Cámara seleccionada:', camaraDefault.label)
      }
      
      setPermisosCamara('granted')
      console.log('✅ Cámaras detectadas exitosamente')
      
    } catch (error) {
      console.error('❌ Error al detectar cámaras:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al detectar cámaras'
      setError(errorMessage)
      setPermisosCamara('denied')
      setCamaras([])
      setCamaraSeleccionada('')
    }
  }

  // Inicializar escáner QR con cámara IP
  const iniciarEscanerIP = async () => {
    if (!camaraIP.trim()) {
      setError('Por favor ingresa la URL de la cámara IP')
      return
    }

    try {
      console.log('📱 Iniciando escáner con cámara IP:', camaraIP)
      setError('')

      // Verificar que el elemento existe
      const qrReaderElement = document.getElementById('qr-reader')
      if (!qrReaderElement) {
        throw new Error('Elemento qr-reader no encontrado')
      }

      // Detener escáner anterior si existe
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop()
          scannerRef.current.clear()
        } catch (stopError) {
          console.log('Error al detener escáner anterior:', stopError)
        }
      }

      // Limpiar contenido anterior
      qrReaderElement.innerHTML = ''

      // Crear elemento de video para cámara IP
      const videoElement = document.createElement('video')
      videoElement.crossOrigin = 'anonymous'
      videoElement.autoplay = true
      videoElement.muted = true
      videoElement.playsInline = true
      videoElement.style.width = '100%'
      videoElement.style.height = '300px'
      videoElement.style.objectFit = 'cover'
      videoElement.style.backgroundColor = '#000'

      // Agregar video al contenedor
      qrReaderElement.appendChild(videoElement)

      // Configurar fuente de video
      videoElement.src = camaraIP

      // Esperar a que el video se cargue
      videoElement.onloadeddata = () => {
        console.log('✅ Video de cámara IP cargado exitosamente')
        setScannerActive(true)
        
        // Aquí podrías agregar detección de QR usando canvas + jsQR
        // Por ahora, mostrar el video de la cámara IP
      }

      videoElement.onerror = (error) => {
        console.error('❌ Error al cargar video de cámara IP:', error)
        setError('No se pudo conectar a la cámara IP. Verifica la URL y que la cámara esté disponible.')
        setScannerActive(false)
      }

      // Mostrar mensaje de conexión
      const statusDiv = document.createElement('div')
      statusDiv.className = 'absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-sm'
      statusDiv.textContent = '📱 Conectando a cámara IP...'
      qrReaderElement.style.position = 'relative'
      qrReaderElement.appendChild(statusDiv)

      // Remover mensaje después de 3 segundos
      setTimeout(() => {
        if (statusDiv.parentNode) {
          statusDiv.remove()
        }
      }, 3000)

      console.log('✅ Escáner con cámara IP configurado')

    } catch (error: any) {
      console.error('❌ Error al iniciar escáner IP:', error)
      setError('Error al conectar con la cámara IP. Verifica la URL y que la cámara esté disponible.')
      setScannerActive(false)
    }
  }

  // Inicializar escáner QR con mejor manejo de errores
  const iniciarEscaner = async () => {
    if (!camaraSeleccionada) {
      console.error('❌ No hay cámara seleccionada')
      setError('No hay cámara seleccionada')
      return
    }

    try {
      console.log('🎥 Iniciando escáner con cámara:', camaraSeleccionada)
      setError('')
      
      // Verificar que el elemento existe
      const qrReaderElement = document.getElementById('qr-reader')
      if (!qrReaderElement) {
        throw new Error('Elemento qr-reader no encontrado')
      }

      // Detener escáner anterior si existe
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop()
          scannerRef.current.clear()
        } catch (stopError) {
          console.log('Error al detener escáner anterior:', stopError)
        }
      }

      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner

      // Configuración optimizada
      const config = {
        fps: 10,
        qrbox: function(viewfinderWidth: number, viewfinderHeight: number) {
          const minEdgePercentage = 0.7
          const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight)
          const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage)
          return {
            width: qrboxSize,
            height: qrboxSize
          }
        },
        aspectRatio: 1.0
      }

      // Intentar iniciar con la cámara seleccionada
      await scanner.start(
        camaraSeleccionada,
        config,
        (decodedText) => {
          console.log('✅ QR escaneado:', decodedText)
          procesarCodigo(decodedText.trim())
        },
        (errorMessage) => {
          // Errores de escaneo son normales, no los mostramos
        }
      )

      setScannerActive(true)
      console.log('✅ Escáner iniciado exitosamente')

    } catch (error) {
      console.error('❌ Error al iniciar escáner:', error)
      let errorMessage = 'Error al iniciar la cámara'
      
      if (error instanceof Error) {
        if (error.message.includes('NotFoundError') || error.message.includes('Requested device not found')) {
          errorMessage = 'La cámara seleccionada no está disponible. Intenta con otra cámara.'
          // Intentar detectar cámaras nuevamente
          detectarCamaras()
        } else if (error.message.includes('NotAllowedError')) {
          errorMessage = 'Permisos de cámara denegados. Por favor, permite el acceso a la cámara.'
        } else if (error.message.includes('NotReadableError')) {
          errorMessage = 'La cámara está siendo usada por otra aplicación.'
        } else {
          errorMessage = error.message
        }
      }
      
      setError(errorMessage)
      setScannerActive(false)
    }
  }

  // Detener escáner
  const detenerEscaner = async () => {
    if (scannerRef.current && scannerActive) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
        scannerRef.current = null
        setScannerActive(false)
        console.log('✅ Escáner detenido')
      } catch (error) {
        console.error('Error al detener escáner:', error)
      }
    }
  }

  // Cambiar cámara
  const cambiarCamara = async (nuevaCamaraId: string) => {
    setCamaraSeleccionada(nuevaCamaraId)
    
    if (scannerActive) {
      await detenerEscaner()
      // Pequeña pausa antes de reiniciar
      setTimeout(() => {
        iniciarEscaner()
      }, 500)
    }
  }

  // Efectos
  useEffect(() => {
    if (isOpen) {
      cargarEstudiantes()
      detectarCamaras()
    }
  }, [isOpen, claseSeleccionada, fechaSeleccionada])

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        detenerEscaner()
      }
    }
  }, [])

  useEffect(() => {
    if (modoEscaneo === 'camara') {
      if (usarCamaraIP) {
        // Para cámara IP, no necesitamos permisos de cámara local
        setPermisosCamara('granted')
      } else {
        // Para cámara local, detectar cámaras y pedir permisos
        detectarCamaras()
      }
    }
  }, [usarCamaraIP, modoEscaneo])

  useEffect(() => {
    if (camaraSeleccionada && modoEscaneo === 'camara' && permisosCamara === 'granted' && !usarCamaraIP) {
      if (!scannerActive) {
        iniciarEscaner()
      }
    } else if (modoEscaneo === 'manual' || (permisosCamara !== 'granted' && !usarCamaraIP)) {
      detenerEscaner()
    }
  }, [camaraSeleccionada, modoEscaneo, permisosCamara, usarCamaraIP])

  // Limpiar al cerrar
  const handleClose = () => {
    detenerEscaner()
    setCodigoManual('')
    setUltimoEscaneo('')
    setScannerActive(false)
    onClose()
  }

  // Guardar asistencias
  const handleGuardar = () => {
    onSave(estudiantes)
    handleClose()
  }

  // Contar asistencias
  const contarAsistencias = () => {
    return estudiantes.reduce((acc: any, est) => {
      acc[est.estado] = (acc[est.estado] || 0) + 1
      return acc
    }, {})
  }

  const stats = contarAsistencias()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Tomar Asistencia</h2>
            <p className="text-sm text-gray-700 font-medium">
              Clase: {claseSeleccionada || 'Seleccionar clase'} | Fecha: {fechaSeleccionada}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* Selector de modo */}
          <div className="mb-6">
            <div className="flex space-x-4">
              <button
                onClick={() => setModoEscaneo('camara')}
                className={`px-4 py-2 rounded-md font-medium ${
                  modoEscaneo === 'camara'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                📷 Escanear QR
              </button>
              <button
                onClick={() => setModoEscaneo('manual')}
                className={`px-4 py-2 rounded-md font-medium ${
                  modoEscaneo === 'manual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                ⌨️ Código Manual
              </button>
            </div>
          </div>

          {/* Mostrar error si existe */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error de cámara</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <button
                    onClick={detectarCamaras}
                    className="mt-2 text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel de escaneo */}
            <div>
              {modoEscaneo === 'camara' ? (
                <div>
                  <h3 className="text-lg font-medium mb-4">Escanear Código QR</h3>
                  
                  {/* Selector de tipo de cámara */}
                  <div className="mb-4">
                    <div className="flex space-x-4 mb-3">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="tipoCamara"
                          checked={!usarCamaraIP}
                          onChange={() => setUsarCamaraIP(false)}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-800">Cámara Local</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="tipoCamara"
                          checked={usarCamaraIP}
                          onChange={() => setUsarCamaraIP(true)}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-800">📱 Cámara IP (Teléfono)</span>
                      </label>
                    </div>
                  </div>

                  {/* Selector de cámara local */}
                  {!usarCamaraIP && camaras.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Seleccionar Cámara Local:
                      </label>
                      <select
                        value={camaraSeleccionada}
                        onChange={(e) => cambiarCamara(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      >
                        {camaras.map((camara) => (
                          <option key={camara.id} value={camara.id}>
                            {camara.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Configuración de cámara IP */}
                  {usarCamaraIP && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        📱 Ingresa la IP de tu teléfono:
                      </label>
                      <div className="space-y-3">
                        <div className="relative">
                          <input
                            type="text"
                            value={camaraIP}
                            onChange={(e) => {
                              const valor = e.target.value
                              setCamaraIP(valor)
                              validarIP(valor)
                            }}
                            placeholder="Ejemplo: http://192.168.1.100:8080/video"
                            className={`w-full p-3 border-2 rounded-md focus:ring-2 text-sm text-gray-900 ${
                              camaraIP.trim() === '' 
                                ? 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                : ipValida 
                                ? 'border-green-300 focus:ring-green-500 focus:border-green-500 bg-green-50'
                                : 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
                            }`}
                          />
                          {camaraIP.trim() !== '' && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              {ipValida ? (
                                <span className="text-green-600 text-lg">✓</span>
                              ) : (
                                <span className="text-red-600 text-lg">✗</span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <h5 className="font-medium text-gray-800 mb-2">📋 Pasos rápidos:</h5>
                          <div className="text-xs text-gray-800 space-y-1">
                            <p><strong>1.</strong> Instala DroidCam o IP Webcam en tu teléfono</p>
                            <p><strong>2.</strong> Conecta teléfono y PC a la misma WiFi</p>
                            <p><strong>3.</strong> Abre la app y copia la IP que muestra</p>
                            <p><strong>4.</strong> Pégala aquí arriba y haz clic "Conectar"</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-xs text-gray-800">
                            <p><strong>🔗 Ejemplos comunes:</strong></p>
                            <div className="grid grid-cols-1 gap-1 mt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setCamaraIP('http://192.168.1.100:8080/video')
                                  validarIP('http://192.168.1.100:8080/video')
                                }}
                                className="text-left text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded text-xs font-medium"
                              >
                                📱 http://192.168.1.100:8080/video (IP Webcam)
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCamaraIP('http://192.168.1.100:4747/video')
                                  validarIP('http://192.168.1.100:4747/video')
                                }}
                                className="text-left text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded text-xs font-medium"
                              >
                                🤖 http://192.168.1.100:4747/video (DroidCam)
                              </button>
                            </div>
                            <p className="mt-2 text-gray-700 italic font-medium">💡 Cambia "192.168.1.100" por la IP de tu teléfono</p>
                          </div>
                          
                          <div className="flex justify-center">
                            <button
                              type="button"
                              onClick={() => setMostrarAyudaIP(true)}
                              className="text-xs bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium"
                            >
                              📖 Ver guía completa paso a paso
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Área de escaneo */}
                  <div className="relative">
                    <div 
                      id="qr-reader" 
                      className="w-full border-2 border-dashed border-gray-300 rounded-lg overflow-hidden"
                      style={{ minHeight: '300px' }}
                    />
                    
                    {!scannerActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <button
                          onClick={usarCamaraIP ? iniciarEscanerIP : iniciarEscaner}
                          disabled={
                            usarCamaraIP 
                              ? !ipValida 
                              : (!camaraSeleccionada || permisosCamara !== 'granted')
                          }
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {usarCamaraIP ? '📱 Conectar Cámara IP' : '📷 Iniciar Cámara Local'}
                        </button>
                      </div>
                    )}
                    
                    {permisosCamara === 'pending' && !usarCamaraIP && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-gray-600">Detectando cámaras...</p>
                        </div>
                      </div>
                    )}

                    {permisosCamara === 'denied' && !usarCamaraIP && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-50">
                        <div className="text-center p-4">
                          <div className="text-red-500 mb-2">
                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                          </div>
                          <p className="text-red-700 font-medium mb-2">Permisos de cámara denegados</p>
                          <p className="text-red-600 text-sm mb-3">Se necesitan permisos para usar la cámara local</p>
                          <button
                            onClick={detectarCamaras}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                          >
                            🔄 Solicitar permisos nuevamente
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {ultimoEscaneo && (
                    <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                      <p className="text-sm text-gray-800">
                        <strong>Último código escaneado:</strong> {ultimoEscaneo}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (codigoManual.trim()) {
                        procesarCodigo(codigoManual.trim())
                        setCodigoManual('')
                      }
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Código del Estudiante:
                      </label>
                      <input
                        type="text"
                        value={codigoManual}
                        onChange={(e) => setCodigoManual(e.target.value)}
                        placeholder="Ej: EST001"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        autoFocus
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!codigoManual.trim()}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Registrar Asistencia
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Lista de estudiantes */}
            <div>
              <h3 className="text-lg font-medium mb-4">Lista de Estudiantes</h3>
              
              {loading && (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-gray-600">Cargando estudiantes...</span>
                </div>
              )}
              
              {/* Estadísticas */}
              {!loading && (
                <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                  <div className="bg-green-100 text-green-800 p-2 rounded text-center">
                    <div className="font-bold">{stats.presente || 0}</div>
                    <div>Presentes</div>
                  </div>
                  <div className="bg-yellow-100 text-yellow-800 p-2 rounded text-center">
                    <div className="font-bold">{stats.tardanza || 0}</div>
                    <div>Tardanzas</div>
                  </div>
                  <div className="bg-gray-100 text-gray-800 p-2 rounded text-center">
                    <div className="font-bold">{stats.pendiente || 0}</div>
                    <div>Pendientes</div>
                  </div>
                </div>
              )}

              {/* Lista */}
              {!loading && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                {estudiantes.map((estudiante) => (
                  <div
                    key={estudiante.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      estudiante.estado === 'presente'
                        ? 'bg-green-50 border-green-200'
                        : estudiante.estado === 'tardanza'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      if (estudiante.estado === 'pendiente') {
                        procesarCodigo(estudiante.codigo)
                      }
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-800">
                          {estudiante.nombre}
                        </div>
                        <div className="text-sm text-gray-600">
                          {estudiante.codigo}
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            estudiante.estado === 'presente'
                              ? 'bg-green-100 text-green-800'
                              : estudiante.estado === 'tardanza'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {estudiante.estado === 'presente'
                            ? 'Presente'
                            : estudiante.estado === 'tardanza'
                            ? 'Tardanza'
                            : 'Pendiente'}
                        </div>
                        {estudiante.horaLlegada && (
                          <div className="text-xs text-gray-700 mt-1 font-medium">
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

          {/* Footer */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 text-gray-800 font-medium rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Guardar Asistencia
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Ayuda para Cámara IP */}
      {mostrarAyudaIP && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-bold text-gray-900">📱 Guía: Conectar Cámara del Teléfono</h3>
              <button
                onClick={() => setMostrarAyudaIP(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* DroidCam */}
              <div className="border rounded-lg p-4">
                <h4 className="font-bold text-green-700 mb-2">🤖 DroidCam (Recomendado para Android)</h4>
                <div className="space-y-2 text-sm text-gray-800">
                  <p><strong>1. Descargar:</strong></p>
                  <p>• <strong>Teléfono:</strong> DroidCam (Google Play Store)</p>
                  <p>• <strong>PC:</strong> DroidCam Client (droidcam.com)</p>
                  
                  <p><strong>2. Configurar:</strong></p>
                  <p>• Conectar teléfono y PC a la misma red WiFi</p>
                  <p>• Abrir DroidCam en el teléfono</p>
                  <p>• Copiar la IP que muestra (ej: 192.168.1.100:4747)</p>
                  <p>• Usar: <code className="bg-gray-100 px-1 text-gray-900">http://192.168.1.100:4747/video</code></p>
                </div>
              </div>

              {/* IP Webcam */}
              <div className="border rounded-lg p-4">
                <h4 className="font-bold text-blue-700 mb-2">📹 IP Webcam (Android)</h4>
                <div className="space-y-2 text-sm text-gray-800">
                  <p><strong>1. Descargar:</strong> IP Webcam (Google Play Store)</p>
                  <p><strong>2. Configurar:</strong></p>
                  <p>• Abrir IP Webcam</p>
                  <p>• Tocar "Iniciar servidor"</p>
                  <p>• Usar URL: <code className="bg-gray-100 px-1 text-gray-900">http://IP:8080/video</code></p>
                  <p>• Ejemplo: <code className="bg-gray-100 px-1 text-gray-900">http://192.168.1.100:8080/video</code></p>
                </div>
              </div>

              {/* EpocCam */}
              <div className="border rounded-lg p-4">
                <h4 className="font-bold text-purple-700 mb-2">🍎 EpocCam (iOS/Android)</h4>
                <div className="space-y-2 text-sm text-gray-800">
                  <p><strong>1. Descargar:</strong></p>
                  <p>• <strong>Teléfono:</strong> EpocCam (App Store/Play Store)</p>
                  <p>• <strong>PC:</strong> EpocCam Viewer (elgato.com)</p>
                  
                  <p><strong>2. Configurar:</strong></p>
                  <p>• Instalar ambas aplicaciones</p>
                  <p>• Conectar a la misma red WiFi</p>
                  <p>• La cámara aparecerá automáticamente como webcam</p>
                </div>
              </div>

              {/* Consejos */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-bold text-yellow-800 mb-2">💡 Consejos importantes:</h4>
                <div className="space-y-1 text-sm text-gray-800">
                  <p>• Asegúrate de que teléfono y PC estén en la misma red WiFi</p>
                  <p>• Usa la cámara trasera para mejor calidad de escaneo</p>
                  <p>• Mantén buena iluminación para detectar códigos QR</p>
                  <p>• Si no funciona, verifica el firewall de Windows</p>
                  <p>• Algunos routers bloquean conexiones entre dispositivos</p>
                </div>
              </div>

              {/* URLs de ejemplo */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-bold text-blue-800 mb-2">🔗 Ejemplos de URLs:</h4>
                <div className="space-y-1 text-sm font-mono text-gray-800">
                  <p>• http://192.168.1.100:4747/video (DroidCam)</p>
                  <p>• http://192.168.1.100:8080/video (IP Webcam)</p>
                  <p>• http://10.0.0.50:8080/video (Red diferente)</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end p-6 border-t">
              <button
                onClick={() => setMostrarAyudaIP(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
