'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getNetworkURL } from '../../utils/networkUtils'

export default function CamaraIPPage() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [serverUrl, setServerUrl] = useState('')
  const [permissionStatus, setPermissionStatus] = useState<'pending' | 'granted' | 'denied'>('pending')
  const [isFlipped, setIsFlipped] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  // Configurar URL de red
  useEffect(() => {
    const setupNetworkURL = async () => {
      try {
        const networkUrl = await getNetworkURL()
        setServerUrl(networkUrl)
        console.log('🌐 URL de red para móvil:', networkUrl)
      } catch (error) {
        console.error('Error obteniendo IP de red:', error)
        setServerUrl(window.location.origin)
      }
    }
    
    setupNetworkURL()
  }, [])

  // Verificar estado de permisos usando Permissions API
  const checkPermissions = async () => {
    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName })
        setPermissionStatus(permission.state as 'pending' | 'granted' | 'denied')
        
        permission.onchange = () => {
          setPermissionStatus(permission.state as 'pending' | 'granted' | 'denied')
          console.log('🔐 Estado de permisos cambió a:', permission.state)
        }
        
        console.log('🔐 Estado inicial de permisos:', permission.state)
      }
    } catch (error) {
      console.log('⚠️ Permissions API no disponible:', error)
    }
  }

  // Función directa para pedir cámara (como tu ejemplo)
  async function pedirCamara() {
    try {
      console.log('🔐 Pidiendo acceso a la cámara...')
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true // 👈 solo pedimos video
      })

      console.log("Cámara activada ✅")
      setPermissionStatus('granted')
      setError('')

      // Detectar cámaras disponibles
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      
      console.log('📹 Cámaras detectadas:', videoDevices.length)
      setCameras(videoDevices)
      
      // Seleccionar cámara trasera por defecto
      const backCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('trasera') ||
        device.label.toLowerCase().includes('environment')
      )
      
      if (backCamera) {
        setDeviceId(backCamera.deviceId)
        console.log('📱 Cámara trasera seleccionada:', backCamera.label)
      } else if (videoDevices.length > 0) {
        setDeviceId(videoDevices[0].deviceId)
        console.log('📱 Primera cámara seleccionada:', videoDevices[0].label)
      }

      // Detener stream temporal
      stream.getTracks().forEach(track => track.stop())

    } catch (err: any) {
      console.error("No se pudo acceder a la cámara ❌", err)
      setPermissionStatus('denied')
      
      if (err.name === 'NotAllowedError') {
        setError('❌ Permisos de cámara denegados. Haz clic en el candado 🔒 para permitir.')
      } else if (err.name === 'NotFoundError') {
        setError('⚠️ No se encontraron cámaras. Puedes usar una cámara IP externa.')
        setPermissionStatus('granted') // Permitir continuar sin cámara local
      } else {
        setError(`❌ Error: ${err.message}`)
      }
    }
  }

  // Llamar a la función al cargar la página
  useEffect(() => {
    const initializeCamera = async () => {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Llamar inmediatamente
        await pedirCamara()
      } else {
        setError('❌ Tu navegador no soporta acceso a cámara')
        setPermissionStatus('denied')
      }
    }
    
    initializeCamera()
  }, [])

  // Iniciar streaming
  const startStreaming = async () => {
    try {
      setError('')
      console.log('🎥 Iniciando streaming de cámara...')
      
      if (!deviceId) {
        throw new Error('No hay cámara seleccionada')
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador no soporta acceso a cámara')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'environment',
          frameRate: { ideal: 30, min: 15 }
        },
        audio: false
      })

      console.log('✅ Stream de cámara obtenido exitosamente')
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        console.log('📹 Video reproduciéndose')
      }

      startFrameCapture()
      setIsStreaming(true)
      
    } catch (error: any) {
      console.error('Error iniciando streaming:', error)
      setError(`Error al iniciar la cámara: ${error.message}`)
    }
  }

  // Detener streaming
  const stopStreaming = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setIsStreaming(false)
  }

  // Capturar frames y enviar al servidor
  const startFrameCapture = () => {
    if (!videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    
    intervalRef.current = setInterval(() => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        const ctx = canvas.getContext('2d')
        if (ctx) {
          // Dibujar la imagen sin invertir (orientación normal)
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          
          canvas.toBlob((blob) => {
            if (blob) {
              const formData = new FormData()
              formData.append('frame', blob, 'frame.jpg')
              
              fetch(`${serverUrl}/api/camara-ip/frame`, {
                method: 'POST',
                body: formData
              }).catch(err => console.error('Error enviando frame:', err))
            }
          }, 'image/jpeg', 0.8)
        }
      }
    }, 100)
  }

  // Cambiar cámara
  const changeCamera = async (newDeviceId: string) => {
    const wasStreaming = isStreaming
    
    if (wasStreaming) {
      stopStreaming()
    }
    
    setDeviceId(newDeviceId)
    
    if (wasStreaming) {
      setTimeout(() => {
        startStreaming()
      }, 500)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold">📱 Cámara IP</h1>
          <p className="text-sm text-gray-300">Convierte tu teléfono en cámara IP</p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600"
        >
          ← Volver
        </button>
      </div>

      {/* Estado de permisos */}
      {permissionStatus === 'pending' && cameras.length === 0 && !error && (
        <div className="mb-4 p-3 bg-blue-900 border border-blue-700 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
            <p className="text-sm text-blue-200">
              🔐 Solicitando permisos de cámara...
            </p>
          </div>
          <p className="text-xs text-blue-300 mt-1">
            Por favor, permite el acceso a la cámara cuando aparezca la ventana de permisos.
          </p>
          <button
            onClick={async () => {
              try {
                console.log('🔐 Forzando solicitud de permisos...')
                
                // Solicitar permisos sin especificar dispositivo específico
                const stream = await navigator.mediaDevices.getUserMedia({ 
                  video: true,  // Solo video: true, sin restricciones específicas
                  audio: false 
                })
                
                console.log('✅ Permisos concedidos')
                setPermissionStatus('granted')
                setError('')
                
                // Detener stream temporal inmediatamente
                stream.getTracks().forEach(track => track.stop())
                
                // Ahora detectar cámaras disponibles
                const devices = await navigator.mediaDevices.enumerateDevices()
                const videoDevices = devices.filter(device => device.kind === 'videoinput')
                
                console.log('📹 Cámaras detectadas:', videoDevices.length)
                setCameras(videoDevices)
                
                if (videoDevices.length > 0) {
                  // Intentar seleccionar cámara trasera primero
                  const backCamera = videoDevices.find(device => 
                    device.label.toLowerCase().includes('back') || 
                    device.label.toLowerCase().includes('rear') ||
                    device.label.toLowerCase().includes('environment')
                  )
                  
                  if (backCamera) {
                    setDeviceId(backCamera.deviceId)
                    console.log('📱 Cámara trasera seleccionada:', backCamera.label)
                  } else {
                    setDeviceId(videoDevices[0].deviceId)
                    console.log('📱 Primera cámara seleccionada:', videoDevices[0].label)
                  }
                } else {
                  console.log('⚠️ No se detectaron cámaras, pero permisos concedidos')
                }
                
              } catch (error) {
                console.error('❌ Error forzando permisos:', error)
                setPermissionStatus('denied')
                
                if (error instanceof Error) {
                  if (error.name === 'NotAllowedError') {
                    setError('❌ Permisos denegados. Haz clic en el candado 🔒 en la barra de direcciones y permite la cámara.')
                  } else if (error.name === 'NotFoundError') {
                    setError('⚠️ No se encontraron cámaras, pero puedes intentar conectar una cámara externa.')
                    setPermissionStatus('granted') // Permitir continuar aunque no haya cámara
                  } else {
                    setError(`❌ Error: ${error.message}`)
                  }
                } else {
                  setError('❌ Error desconocido solicitando permisos')
                }
              }
            }}
            className="mt-2 px-4 py-2 bg-blue-600 rounded text-sm hover:bg-blue-700"
          >
            🔐 Permitir Acceso a Cámara
          </button>
        </div>
      )}

      {/* Éxito en permisos */}
      {permissionStatus === 'granted' && cameras.length > 0 && (
        <div className="mb-4 p-3 bg-green-900 border border-green-700 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-green-400">✅</span>
            <p className="text-sm text-green-200">
              Permisos concedidos - {cameras.length} cámara(s) detectada(s)
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded-lg">
          <p className="text-red-200 text-sm mb-2">{error}</p>
          {error.includes('Permisos de cámara denegados') && (
            <div className="space-y-2">
              <p className="text-xs text-red-300">
                💡 Para solucionar este problema:
              </p>
              <ol className="text-xs text-red-300 list-decimal list-inside space-y-1">
                <li>Haz clic en el ícono de candado 🔒 en la barra de direcciones</li>
                <li>Cambia los permisos de cámara a "Permitir"</li>
                <li>Recarga la página</li>
              </ol>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 px-3 py-1 bg-red-700 rounded text-xs hover:bg-red-600"
              >
                🔄 Recargar página
              </button>
            </div>
          )}
          {error.includes('No se encontraron cámaras') && (
            <p className="text-xs text-red-300 mt-1">
              💡 Asegúrate de que tu dispositivo tenga una cámara y que no esté siendo usada por otra aplicación.
            </p>
          )}
        </div>
      )}

      {/* URL del servidor */}
      <div className="mb-4 p-3 bg-gray-900 rounded-lg">
        <p className="text-sm text-gray-300 mb-1">URL para usar en PC:</p>
        <div className="flex items-center space-x-2">
          <code className="flex-1 p-2 bg-black rounded text-green-400 text-xs font-mono">
            {serverUrl}/api/camara-ip/stream
          </code>
          <button
            onClick={() => navigator.clipboard.writeText(`${serverUrl}/api/camara-ip/stream`)}
            className="px-2 py-1 bg-blue-600 rounded text-xs hover:bg-blue-700"
          >
            📋 Copiar
          </button>
        </div>
      </div>

      {/* Selector de cámara */}
      {cameras.length > 1 && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Seleccionar Cámara:</label>
          <select
            value={deviceId}
            onChange={(e) => changeCamera(e.target.value)}
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
          >
            {cameras.map((camera, index) => (
              <option key={camera.deviceId} value={camera.deviceId}>
                {camera.label || `Cámara ${index + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Botón para solicitar permisos manualmente */}
      {permissionStatus === 'denied' && (
        <div className="mb-4">
          <button
            onClick={async () => {
              try {
                console.log('🔐 Solicitando permisos manualmente...')
                
                // Múltiples estrategias para obtener permisos
                let stream
                try {
                  // Estrategia 1: Cualquier cámara disponible
                  stream = await navigator.mediaDevices.getUserMedia({ video: true })
                  console.log('✅ Permisos concedidos con cámara genérica')
                } catch (genericError) {
                  // Estrategia 2: Con configuración básica
                  try {
                    stream = await navigator.mediaDevices.getUserMedia({ 
                      video: {
                        width: { ideal: 640 },
                        height: { ideal: 480 }
                      }
                    })
                    console.log('✅ Permisos concedidos con configuración básica')
                  } catch (basicError) {
                    throw basicError
                  }
                }
                
                setPermissionStatus('granted')
                setError('')
                
                // Detener stream temporal inmediatamente
                stream.getTracks().forEach(track => track.stop())
                
                // Detectar cámaras disponibles
                const devices = await navigator.mediaDevices.enumerateDevices()
                const videoDevices = devices.filter(device => device.kind === 'videoinput')
                setCameras(videoDevices)
                
                if (videoDevices.length > 0) {
                  setDeviceId(videoDevices[0].deviceId)
                  console.log('📹 Cámaras detectadas:', videoDevices.length)
                } else {
                  console.log('⚠️ No se detectaron cámaras, pero permisos concedidos')
                }
                
              } catch (error) {
                console.error('❌ Error solicitando permisos:', error)
                
                if (error instanceof Error) {
                  if (error.name === 'NotAllowedError') {
                    setError('❌ Permisos denegados. Haz clic en el candado 🔒 en la barra de direcciones.')
                  } else if (error.name === 'NotFoundError') {
                    setError('⚠️ No se encontraron cámaras. Puedes conectar una cámara externa.')
                    setPermissionStatus('granted') // Permitir continuar
                  } else {
                    setError(`❌ Error: ${error.message}`)
                  }
                } else {
                  setError('❌ Error desconocido solicitando permisos')
                }
              }
            }}
            className="w-full py-3 bg-blue-600 rounded-lg font-medium hover:bg-blue-700"
          >
            🔐 Solicitar Permisos de Cámara
          </button>
        </div>
      )}

      {/* Controles */}
      <div className="mb-4 space-y-3">
        <div className="flex space-x-3">
          {!isStreaming ? (
            <button
              onClick={startStreaming}
              disabled={!deviceId || permissionStatus !== 'granted'}
              className="flex-1 py-3 bg-green-600 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              🎥 Iniciar Cámara
            </button>
          ) : (
            <button
              onClick={stopStreaming}
              className="flex-1 py-3 bg-red-600 rounded-lg font-medium hover:bg-red-700"
            >
              ⏹️ Detener Cámara
            </button>
          )}
        </div>
        
        {/* Botón para alternar orientación */}
        {isStreaming && (
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full py-2 bg-gray-600 rounded-lg font-medium hover:bg-gray-700 text-sm"
          >
            {isFlipped ? '🔄 Vista Normal' : '🔄 Vista Espejo'}
          </button>
        )}
      </div>

      {/* Estado */}
      <div className="mb-4 p-3 bg-gray-900 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isStreaming ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
          <span className="text-sm">
            {isStreaming ? '🔴 Transmitiendo' : '⚫ Desconectado'}
          </span>
        </div>
      </div>

      {/* Video */}
      <div className="relative bg-gray-800 rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-auto"
          style={{ transform: isFlipped ? 'scaleX(-1)' : 'none' }}
        />
        <canvas
          ref={canvasRef}
          className="hidden"
        />
      </div>
    </div>
  )
}