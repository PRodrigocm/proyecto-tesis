'use client'

import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import CamaraIPHelper from '../camara-ip/CamaraIPHelper'

interface Estudiante {
  id: number
  nombre: string
  codigo: string
  dni: string
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [estudianteEscaneado, setEstudianteEscaneado] = useState<Estudiante | null>(null)
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)

  // Debug: Verificar props recibidas
  console.log('🔍 Props del modal:', {
    isOpen,
    claseSeleccionada,
    fechaSeleccionada,
    tiposClase: typeof claseSeleccionada,
    tiposFecha: typeof fechaSeleccionada
  })

  const [ultimoEscaneo, setUltimoEscaneo] = useState<string>('')
  const [codigoManual, setCodigoManual] = useState<string>('')
  const [camaras, setCamaras] = useState<CameraDevice[]>([])
  const [camaraSeleccionada, setCamaraSeleccionada] = useState<string>('')
  const [usarCamaraIP] = useState<boolean>(false) // Siempre usar cámara local
  const [camaraIP, setCamaraIP] = useState<string>('')
  const [ipValida, setIpValida] = useState<boolean>(false)
  const [mostrarAyudaIP, setMostrarAyudaIP] = useState<boolean>(false)
  const [scannerActive, setScannerActive] = useState<boolean>(false)
  const [modoEscaneo, setModoEscaneo] = useState<'camara' | 'manual'>('camara')
  const [escaneoMultiple, setEscaneoMultiple] = useState<boolean>(true)
  const [ultimosEscaneos, setUltimosEscaneos] = useState<string[]>([])
  const [mostrarListaEstudiantes, setMostrarListaEstudiantes] = useState<boolean>(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [permisosCamara, setPermisosCamara] = useState<'granted' | 'denied' | 'pending'>('pending')

  // Validar URL de cámara IP
  const validarIP = (url: string) => {
    if (!url.trim()) {
      setIpValida(false)
      return false
    }

    try {
      const urlObj = new URL(url)
      
      // Verificar protocolo
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
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
      
      setIpValida(false)
      return false
    } catch {
      setIpValida(false)
      return false
    }
  }


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
          dni: est.dni,
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
            dni: '99887766',
            estado: 'pendiente'
          },
          {
            id: 2,
            nombre: 'María González',
            codigo: 'EST002',
            dni: '88776655',
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
          dni: '99887766',
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
    console.log('🔍 Procesando código:', codigo)
    setUltimoEscaneo(codigo)
    
    // Verificar si ya fue escaneado recientemente (evitar duplicados)
    if (ultimosEscaneos.includes(codigo)) {
      console.log('⚠️ Código ya escaneado recientemente, ignorando duplicado')
      return
    }
    
    // Agregar a la lista de escaneos recientes
    setUltimosEscaneos(prev => [...prev.slice(-4), codigo]) // Mantener solo los últimos 5
    
    // El QR contiene el DNI del estudiante
    const estudiante = estudiantes.find(est => est.dni === codigo)
    
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
      
      // Primero mostrar el nombre del estudiante
      setEstudianteEscaneado({ ...estudiante, estado: 'pendiente', horaLlegada: undefined })
      
      // Después de un breve momento, procesar la asistencia
      setTimeout(async () => {
        try {
          // Enviar al servidor para guardar en BD
          const token = localStorage.getItem('token')
          
          // Preparar datos para enviar
          const asistenciaData = {
            estudianteId: estudiante.id,
            estado: nuevoEstado,
            horaLlegada: horaActual,
            fecha: fechaSeleccionada,
            claseId: claseSeleccionada
          }
          
          console.log('📤 Enviando datos al servidor:', asistenciaData)
          console.log('🔑 Token presente:', !!token)
          
          const response = await fetch('/api/docente/asistencias/guardar-qr', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              asistencias: [asistenciaData]
            })
          })
          
          console.log('📥 Response status:', response.status)
          console.log('📥 Response ok:', response.ok)

          if (response.ok) {
            console.log('✅ Asistencia guardada en BD')
            
            // Actualizar la lista de estudiantes local
            const estudiantesActualizados = estudiantes.map(est => 
              est.id === estudiante.id 
                ? { ...est, estado: nuevoEstado as 'presente' | 'tardanza', horaLlegada: horaActual }
                : est
            )
            setEstudiantes(estudiantesActualizados)
            
            // Notificar al componente padre sobre la actualización
            onSave(estudiantesActualizados)
            
            // Mostrar confirmación visual con círculo verde
            setEstudianteEscaneado({ ...estudiante, estado: nuevoEstado, horaLlegada: horaActual })
            setMostrarConfirmacion(true)
            
            reproducirSonidoConfirmacion()
            
            console.log(`✅ ${estudiante.nombre} registrado como ${nuevoEstado} a las ${horaActual}`)
            
          } else {
            const error = await response.json()
            console.error('❌ Error al guardar asistencia:', error)
            
            // Verificar si es un error de estudiante no encontrado o no pertenece a la clase
            if (response.status === 404) {
              alert(`❌ Código QR no válido: El estudiante no existe o no pertenece a esta clase`)
            } else if (error.error === 'Estudiante no pertenece a esta clase') {
              alert(`⚠️ ${error.message}`)
            } else if (error.message && error.message.includes('no pertenece a la clase')) {
              alert(`⚠️ El estudiante escaneado no pertenece a esta clase`)
            } else {
              alert(`❌ Error al guardar asistencia: ${error.error || 'Error desconocido'}`)
            }
            return
          }
        } catch (error) {
          console.error('❌ Error de conexión:', error)
          alert('❌ Error de conexión al guardar asistencia')
          return
        }
        
        // Ocultar confirmación después de 4 segundos
        setTimeout(() => {
          setMostrarConfirmacion(false)
          // Mantener la información del estudiante por un poco más
          setTimeout(() => {
            setEstudianteEscaneado(null)
          }, 1000)
        }, 4000)
      }, 800) // Mostrar nombre por 800ms antes de procesar
      
    } else if (estudiante && estudiante.estado !== 'pendiente') {
      // Mostrar información del estudiante ya registrado
      setEstudianteEscaneado(estudiante)
      setTimeout(() => {
        alert(`⚠️ ${estudiante.nombre} ya fue registrado como ${estudiante.estado}`)
        setEstudianteEscaneado(null)
      }, 1000)
    } else {
      // Código no válido
      setTimeout(() => {
        alert('❌ Código no válido o estudiante no encontrado')
      }, 500)
    }
  }

  // Detectar cámaras disponibles
  const detectarCamaras = async () => {
    try {
      console.log('🔍 Detectando cámaras disponibles...')
      setError('')
      setPermisosCamara('pending')
      
      // Verificar soporte del navegador
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador no soporta acceso a cámara')
      }
      
      // Primero verificar si hay dispositivos disponibles SIN solicitar permisos
      console.log('🔍 Verificando dispositivos disponibles...')
      let devices: any[] = []
      try {
        console.log('🔍 Obteniendo lista de dispositivos...')
        
        // Intentar múltiples métodos para obtener cámaras
        let html5Devices: any[] = []
        let mediaDevices: any[] = []
        
        // Método 1: Html5Qrcode.getCameras()
        try {
          html5Devices = await Html5Qrcode.getCameras()
          console.log('📷 Html5Qrcode devices:', html5Devices)
        } catch (html5Error) {
          console.log('⚠️ Html5Qrcode.getCameras() falló:', html5Error)
        }
        
        // Método 2: navigator.mediaDevices.enumerateDevices()
        try {
          const allDevices = await navigator.mediaDevices.enumerateDevices()
          mediaDevices = allDevices.filter(device => device.kind === 'videoinput')
          console.log('📷 MediaDevices devices:', mediaDevices)
        } catch (mediaError) {
          console.log('⚠️ enumerateDevices() falló:', mediaError)
        }
        
        // Combinar y usar la mejor fuente disponible
        if (html5Devices.length > 0) {
          devices = html5Devices
          console.log('✅ Usando dispositivos de Html5Qrcode')
        } else if (mediaDevices.length > 0) {
          devices = mediaDevices.map(device => ({
            id: device.deviceId,
            label: device.label || `Cámara ${device.deviceId.slice(-4)}`
          }))
          console.log('✅ Usando dispositivos de MediaDevices')
        } else {
          console.log('⚠️ No se encontraron dispositivos por ningún método')
        }
        
        console.log('📷 Dispositivos finales encontrados:', devices.length, devices)
      } catch (cameraError) {
        console.error('❌ Error al obtener cámaras:', cameraError)
        throw new Error('No se pudieron detectar las cámaras disponibles')
      }
      
      if (devices.length === 0) {
        throw new Error('No se encontraron cámaras disponibles en este dispositivo. Puedes usar el modo manual o conectar tu teléfono como cámara IP.')
      }
      
      const camarasFormateadas = devices.map((device, index) => {
        let label = device.label || `Cámara ${index + 1}`
        
        // Mejorar etiquetas de cámaras
        if (label.toLowerCase().includes('back') || 
            label.toLowerCase().includes('rear') || 
            label.toLowerCase().includes('environment')) {
          label = `📱 ${label} (Trasera - Recomendada)`
        } else if (label.toLowerCase().includes('front') || 
                   label.toLowerCase().includes('user') || 
                   label.toLowerCase().includes('selfie')) {
          label = `🤳 ${label} (Frontal)`
        } else if (label.toLowerCase().includes('usb') || 
                   label.toLowerCase().includes('webcam')) {
          label = `💻 ${label} (USB/Webcam)`
        } else {
          label = `📷 ${label}`
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
        console.log('🎯 Cámara seleccionada por defecto:', camaraDefault.label)
      }
      
      console.log('✅ Cámaras detectadas exitosamente:', camarasFormateadas.length, 'cámaras')
      
      // AHORA solicitar permisos ya que sabemos que hay cámaras disponibles
      console.log('🔐 Solicitando permisos de cámara...')
      try {
        // Intentar primero con configuración básica
        let stream
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: 'environment' // Preferir cámara trasera
            } 
          })
        } catch (envError) {
          console.log('⚠️ Cámara trasera no disponible, intentando con cualquier cámara...')
          // Si falla con facingMode, intentar sin restricciones
          stream = await navigator.mediaDevices.getUserMedia({ video: true })
        }
        
        // Detener el stream inmediatamente, solo necesitamos los permisos
        stream.getTracks().forEach(track => track.stop())
        console.log('✅ Permisos de cámara obtenidos')
        setPermisosCamara('granted')
      } catch (permissionError: any) {
        console.error('❌ Error de permisos:', permissionError)
        setPermisosCamara('denied')
        
        let errorMessage = 'Se requieren permisos de cámara para escanear códigos QR.'
        
        if (permissionError.name === 'NotAllowedError') {
          errorMessage = 'Permisos de cámara denegados. Haz clic en el ícono de cámara en la barra de direcciones para permitir el acceso.'
        } else if (permissionError.name === 'NotReadableError') {
          errorMessage = 'La cámara está siendo usada por otra aplicación. Cierra otras apps que usen la cámara.'
        } else {
          errorMessage = `Error de cámara: ${permissionError.message || permissionError.name || 'Error desconocido'}`
        }
        
        setError(errorMessage)
        // No hacer return aquí, las cámaras están detectadas pero sin permisos
      }
      
    } catch (error) {
      console.error('❌ Error al detectar cámaras:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al detectar cámaras'
      setError(errorMessage)
      setPermisosCamara('denied')
      setCamaras([])
      setCamaraSeleccionada('')
    }
  }

  // Función directa para pedir cámara (como el ejemplo)
  async function pedirCamara() {
    try {
      console.log('🔐 Pidiendo acceso a la cámara...')
      setError('')
      setPermisosCamara('pending')
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true // 👈 solo pedimos video
      })

      console.log("Cámara activada ✅")
      setPermisosCamara('granted')

      // Detener el stream inmediatamente, solo necesitamos los permisos
      stream.getTracks().forEach(track => track.stop())

    } catch (err: any) {
      console.error("No se pudo acceder a la cámara ❌", err)
      setPermisosCamara('denied')
      
      let errorMessage = 'Se requieren permisos de cámara para escanear códigos QR.'
      
      if (err.name === 'NotAllowedError') {
        errorMessage = '❌ Permisos de cámara denegados. Haz clic en el ícono de candado 🔒 en la barra de direcciones para permitir el acceso.'
      } else if (err.name === 'NotFoundError') {
        errorMessage = '⚠️ No se encontraron cámaras en este dispositivo. Puedes usar una cámara IP externa o conectar una cámara USB.'
        // Permitir continuar con cámara IP aunque no haya cámara local
        setPermisosCamara('granted')
        setError('')
        return
      } else if (err.name === 'NotReadableError') {
        errorMessage = '📷 La cámara está siendo usada por otra aplicación. Cierra otras apps que usen la cámara e intenta nuevamente.'
      } else {
        errorMessage = `❌ Error de cámara: ${err.message || err.name || 'Error desconocido'}`
      }
      
      setError(errorMessage)
    }
  }

  // Alias para mantener compatibilidad
  const solicitarPermisosCamara = pedirCamara

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

      // Corregir URL automáticamente si es necesario
      let urlCorregida = camaraIP.trim()
      
      // Detectar y corregir URLs según la app
      if (urlCorregida.includes(':4747')) {
        // DroidCam - usar imagen estática en lugar de video por problemas de CORS
        if (urlCorregida.includes('/video')) {
          urlCorregida = urlCorregida.replace('/video', '/shot.jpg')
        } else if (!urlCorregida.includes('/shot.jpg') && !urlCorregida.includes('/mjpegfeed')) {
          urlCorregida = urlCorregida + '/shot.jpg'
        }
        console.log('🔧 URL corregida para DroidCam (imagen estática):', urlCorregida)
      } else if (urlCorregida.includes(':8080/video')) {
        // IP Webcam - cambiar a videofeed
        urlCorregida = urlCorregida.replace('/video', '/videofeed')
        console.log('🔧 URL corregida para IP Webcam:', urlCorregida)
      }

      // Determinar si usar video o imagen según la URL
      const usarImagen = urlCorregida.includes(':4747') || urlCorregida.includes('/shot.jpg')
      
      if (usarImagen) {
        // Crear elemento de imagen para DroidCam (evita problemas de CORS)
        const imgElement = document.createElement('img')
        imgElement.style.width = '100%'
        imgElement.style.height = '300px'
        imgElement.style.objectFit = 'cover'
        imgElement.style.backgroundColor = '#000'
        imgElement.crossOrigin = 'anonymous'
        
        // Agregar imagen al contenedor
        qrReaderElement.appendChild(imgElement)
        
        // Función para actualizar la imagen
        const actualizarImagen = () => {
          const timestamp = new Date().getTime()
          imgElement.src = `${urlCorregida}?t=${timestamp}`
        }
        
        // Configurar eventos de la imagen
        imgElement.onload = () => {
          console.log('✅ Imagen de cámara IP cargada exitosamente')
          setScannerActive(true)
          
          // Actualizar imagen cada 500ms para simular video
          const intervalId = setInterval(actualizarImagen, 500)
          
          // Guardar el interval para limpiarlo después
          qrReaderElement.setAttribute('data-interval', intervalId.toString())
        }
        
        imgElement.onerror = () => {
          console.error('❌ Error al cargar imagen de cámara IP')
          console.error('URL intentada:', imgElement.src)
          
          setError('No se pudo conectar a la cámara IP. Verifica que:\n• DroidCam esté funcionando en tu teléfono\n• Ambos dispositivos estén en la misma WiFi\n• La URL sea correcta')
          setScannerActive(false)
        }
        
        // Cargar imagen inicial
        actualizarImagen()
        
      } else {
        // Crear elemento de video para IP Webcam y otras apps
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
        videoElement.src = urlCorregida

        // Esperar a que el video se cargue
        videoElement.onloadeddata = () => {
          console.log('✅ Video de cámara IP cargado exitosamente')
          setScannerActive(true)
          
          // Aquí podrías agregar detección de QR usando canvas + jsQR
          // Por ahora, mostrar el video de la cámara IP
        }

        videoElement.onerror = (event: Event | string) => {
        console.error('❌ Error al cargar video de cámara IP')
        console.error('Estado de la red:', videoElement.networkState)
        console.error('Estado de preparación:', videoElement.readyState)
        console.error('URL intentada:', videoElement.src)
        
        // Intentar URLs alternativas automáticamente
        const urlActual = videoElement.src
        let urlAlternativa = ''
        
        if (urlActual.includes(':4747/mjpegfeed')) {
          // Si falló mjpegfeed, intentar con /video
          urlAlternativa = urlActual.replace('/mjpegfeed?640x480', '/video')
          console.log('🔄 Intentando URL alternativa para DroidCam:', urlAlternativa)
        } else if (urlActual.includes(':4747/video')) {
          // Si falló /video, intentar sin path (solo IP:puerto)
          urlAlternativa = urlActual.replace('/video', '')
          console.log('🔄 Intentando URL base para DroidCam:', urlAlternativa)
        } else if (urlActual.includes(':8080/videofeed')) {
          // Si falló videofeed, intentar con /video
          urlAlternativa = urlActual.replace('/videofeed', '/video')
          console.log('🔄 Intentando URL alternativa para IP Webcam:', urlAlternativa)
        } else if (urlActual.includes(':8080/video')) {
          // Si falló /video, intentar con /shot.jpg para imagen estática
          urlAlternativa = urlActual.replace('/video', '/shot.jpg')
          console.log('🔄 Intentando imagen estática para IP Webcam:', urlAlternativa)
        }
        
        if (urlAlternativa && urlAlternativa !== urlActual) {
          console.log('🔄 Probando URL alternativa automáticamente...')
          videoElement.src = urlAlternativa
          return // No mostrar error aún, intentar la alternativa
        }
        
        // Si ya se intentaron las alternativas o no hay más opciones
        let errorMessage = 'No se pudo conectar a la cámara IP. '
        
        if (videoElement.networkState === 3) { // NETWORK_NO_SOURCE
          errorMessage += 'URL no válida o cámara no disponible.'
        } else if (videoElement.networkState === 2) { // NETWORK_LOADING
          errorMessage += 'Cargando... Verifica tu conexión WiFi.'
        } else {
          errorMessage += 'Verifica que:\n• Teléfono y PC estén en la misma WiFi\n• La app de cámara esté funcionando\n• La URL sea correcta'
        }
        
        errorMessage += '\n\n💡 URLs sugeridas:\n'
        errorMessage += '• DroidCam: http://IP:4747/mjpegfeed?640x480\n'
        errorMessage += '• IP Webcam: http://IP:8080/videofeed\n'
        errorMessage += '• Imagen estática: http://IP:8080/shot.jpg'
        
          setError(errorMessage)
          setScannerActive(false)
        }
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
      setError('No hay cámara seleccionada. Selecciona una cámara de la lista.')
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

      // Verificar que la cámara seleccionada aún existe
      const camaraExiste = camaras.find(cam => cam.id === camaraSeleccionada)
      if (!camaraExiste) {
        console.log('⚠️ Cámara seleccionada no existe, redetectando...')
        await detectarCamaras()
        return
      }

      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner

      // Configuración para que el área de escaneo sea igual al área de la cámara
      const config = {
        fps: 15,
        qrbox: function(viewfinderWidth: number, viewfinderHeight: number) {
          // Usar 100% del área disponible (toda la cámara)
          return {
            width: viewfinderWidth,
            height: viewfinderHeight
          }
        },
        aspectRatio: 16/9, // Aspecto más natural para móviles
        videoConstraints: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'environment' // Preferir cámara trasera
        },
        rememberLastUsedCamera: true,
        supportedScanTypes: [0] // Solo QR codes
      }

      console.log('🚀 Intentando iniciar cámara con ID:', camaraSeleccionada)
      
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
      console.log('✅ Escáner iniciado exitosamente con cámara:', camaraExiste.label)

    } catch (error: any) {
      console.error('❌ Error al iniciar escáner:', error)
      let errorMessage = 'Error al iniciar la cámara'
      let shouldRetryDetection = false
      
      if (error instanceof Error || typeof error === 'object') {
        const errorName = error.name || ''
        const errorMsg = error.message || error.toString()
        
        console.log('🔍 Tipo de error:', errorName, '- Mensaje:', errorMsg)
        
        if (errorName === 'NotFoundError' || errorMsg.includes('NotFoundError') || errorMsg.includes('Requested device not found')) {
          errorMessage = 'La cámara seleccionada no está disponible. Redetectando cámaras...'
          shouldRetryDetection = true
        } else if (errorName === 'NotAllowedError' || errorMsg.includes('NotAllowedError')) {
          errorMessage = 'Permisos de cámara denegados. Haz clic en el ícono de cámara en la barra de direcciones para permitir el acceso.'
          setPermisosCamara('denied')
        } else if (errorName === 'NotReadableError' || errorMsg.includes('NotReadableError')) {
          errorMessage = 'La cámara está siendo usada por otra aplicación. Cierra otras apps que usen la cámara.'
        } else if (errorName === 'OverconstrainedError' || errorMsg.includes('OverconstrainedError')) {
          errorMessage = 'La cámara no soporta la configuración solicitada. Probando con otra cámara...'
          shouldRetryDetection = true
        } else {
          errorMessage = `Error de cámara: ${errorMsg}`
        }
      }
      
      setError(errorMessage)
      setScannerActive(false)
      
      // Si es un error de dispositivo no encontrado, intentar redetectar
      if (shouldRetryDetection) {
        console.log('🔄 Redetectando cámaras debido al error...')
        setTimeout(() => {
          detectarCamaras()
        }, 1000)
      }
    }
  }

  // Detener escáner
  const detenerEscaner = async () => {
    console.log('🛑 Iniciando detención del escáner...')
    
    // Primero cambiar el estado para evitar reinicios
    setScannerActive(false)
    
    if (scannerRef.current) {
      // Limpiar directamente sin usar stop() que causa problemas
      try {
        const qrReaderElement = document.getElementById('qr-reader')
        if (qrReaderElement) {
          // Detener todos los tracks de video manualmente ANTES de limpiar
          const videos = qrReaderElement.querySelectorAll('video')
          videos.forEach(video => {
            try {
              // Remover event listeners para evitar onabort
              video.onabort = null
              video.onerror = null
              video.onended = null
              video.onloadstart = null
              
              // Pausar primero
              video.pause()
              
              if (video.srcObject) {
                const stream = video.srcObject as MediaStream
                stream.getTracks().forEach(track => {
                  try {
                    if (track.readyState !== 'ended') {
                      track.stop()
                      console.log('🎥 Track de video detenido:', track.kind)
                    }
                  } catch (trackError) {
                    console.log('⚠️ Error al detener track:', trackError)
                  }
                })
                // Limpiar srcObject gradualmente
                video.srcObject = null
              }
              
              // Remover el elemento del DOM suavemente
              video.remove()
            } catch (videoError) {
              console.log('⚠️ Error al limpiar video:', videoError)
            }
          })
          
          // Pequeña pausa para asegurar que los tracks se detengan
          await new Promise(resolve => setTimeout(resolve, 100))
          
          // Limpiar el HTML completamente
          qrReaderElement.innerHTML = ''
          console.log('🧹 Contenido del elemento limpiado')
        }
      } catch (cleanupError) {
        console.error('⚠️ Error durante limpieza:', cleanupError)
        // Forzar limpieza básica
        const qrReaderElement = document.getElementById('qr-reader')
        if (qrReaderElement) {
          qrReaderElement.innerHTML = ''
        }
      }
      
      // Limpiar la referencia
      scannerRef.current = null
      console.log('✅ Escáner completamente detenido y limpiado (sin usar stop())')
    } else {
      console.log('ℹ️ No hay escáner activo para detener')
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
    if (modoEscaneo === 'camara') {
      // Solicitar permisos inmediatamente al abrir el modal
      solicitarPermisosCamara()
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
  const handleClose = async () => {
    await detenerEscaner()
    setCodigoManual('')
    setUltimoEscaneo('')
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
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-6xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-black">Tomar Asistencia</h2>
            <p className="text-sm text-black font-medium">
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

        <div className="p-4 sm:p-6 flex flex-col">
          {/* Selector de modo */}
          <div className="mb-4">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => setModoEscaneo('camara')}
                className={`px-4 py-2 rounded-md font-medium text-sm ${
                  modoEscaneo === 'camara'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                📷 Escanear QR
              </button>
              <button
                onClick={() => setModoEscaneo('manual')}
                className={`px-4 py-2 rounded-md font-medium text-sm ${
                  modoEscaneo === 'manual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                ⌨️ Código Manual
              </button>
            </div>
          </div>

          {/* Controles de escaneo múltiple */}
          {modoEscaneo === 'camara' && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="escaneoMultiple"
                    checked={escaneoMultiple}
                    onChange={(e) => setEscaneoMultiple(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="escaneoMultiple" className="text-sm font-medium text-blue-800">
                    Escaneo múltiple
                  </label>
                </div>
                <div className="text-xs text-blue-600">
                  {ultimosEscaneos.length > 0 && `Últimos: ${ultimosEscaneos.length}`}
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                {escaneoMultiple 
                  ? 'Puedes escanear varios códigos seguidos. Se evitan duplicados automáticamente.'
                  : 'Solo se procesará un código a la vez.'
                }
              </p>
              {ultimosEscaneos.length > 0 && (
                <button
                  onClick={() => setUltimosEscaneos([])}
                  className="text-xs text-blue-500 hover:text-blue-700 mt-1"
                >
                  Limpiar historial
                </button>
              )}
            </div>
          )}

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
                    onClick={permisosCamara === 'denied' ? solicitarPermisosCamara : detectarCamaras}
                    className="mt-2 text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                  >
                    {permisosCamara === 'denied' ? '🔄 Solicitar permisos' : 'Reintentar'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-6 flex-1 min-h-0">
            {/* Panel de escaneo - Ocupa 2/3 del espacio en desktop, toda la pantalla en móvil */}
            <div className="lg:col-span-2 flex-1 min-h-0">
              {modoEscaneo === 'camara' ? (
                <div>
                  <h3 className="text-lg font-medium mb-4">Escanear Código QR</h3>
                  
                  {/* Siempre usar cámara local - opciones ocultas */}

                  {/* Selector de cámara local */}
                  {!usarCamaraIP && camaras.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-black mb-2">
                        Seleccionar Cámara Local:
                      </label>
                      <select
                        value={camaraSeleccionada}
                        onChange={(e) => cambiarCamara(e.target.value)}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white shadow-sm transition-all duration-200 hover:border-gray-400"
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
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-black">
                          🌐 Configuración de Cámara Externa:
                        </label>
                      </div>
                      
                      {/* Configuración de cámara externa */}
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
                            placeholder="Ejemplo: http://192.168.1.100:8080/videofeed o http://192.168.1.100:4747/shot.jpg"
                            className={`w-full p-3 border-2 rounded-lg focus:ring-2 text-black bg-white shadow-sm transition-all duration-200 ${
                              camaraIP.trim() === '' 
                                ? 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400'
                                : ipValida 
                                ? 'border-green-500 focus:ring-green-500 focus:border-green-500 bg-green-50'
                                : 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50'
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
                          <h5 className="font-medium text-black mb-2">📋 Pasos rápidos:</h5>
                          <div className="text-xs text-black space-y-1">
                            <p><strong>1.</strong> Instala DroidCam o IP Webcam en tu teléfono</p>
                            <p><strong>2.</strong> Conecta teléfono y PC a la misma WiFi</p>
                            <p><strong>3.</strong> Abre la app y copia la IP que muestra</p>
                            <p><strong>4.</strong> Pégala aquí arriba y haz clic "Conectar"</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-xs text-black">
                            <p><strong>🔗 Ejemplos comunes:</strong></p>
                            <div className="grid grid-cols-1 gap-1 mt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setCamaraIP('http://192.168.1.100:8080/videofeed')
                                  validarIP('http://192.168.1.100:8080/videofeed')
                                }}
                                className="text-left text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded text-xs font-medium"
                              >
                                📱 http://192.168.1.100:8080/videofeed (IP Webcam)
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCamaraIP('http://192.168.1.100:4747/shot.jpg')
                                  validarIP('http://192.168.1.100:4747/shot.jpg')
                                }}
                                className="text-left text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded text-xs font-medium"
                              >
                                🤖 http://192.168.1.100:4747/shot.jpg (DroidCam - Imagen)
                              </button>
                            </div>
                            <p className="mt-2 text-black italic font-medium">💡 Cambia "192.168.1.100" por la IP de tu teléfono</p>
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


                  {/* Área de escaneo - Pantalla completa */}
                  <div className="relative">
                    {/* Overlay con información del estudiante - Confirmación exitosa */}
                    {mostrarConfirmacion && estudianteEscaneado && (
                      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-xl shadow-2xl p-6 border-3 border-green-500 min-w-[300px] animate-bounce">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-green-800 text-xl">{estudianteEscaneado.nombre}</p>
                            <p className="text-green-600 text-base font-medium mt-1">
                              {estudianteEscaneado.estado === 'presente' ? '✅ Presente' : '⏰ Tardanza'}
                            </p>
                            <p className="text-green-500 text-sm">
                              Registrado a las {estudianteEscaneado.horaLlegada}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 text-center">
                          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            🎉 ¡Asistencia registrada exitosamente!
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Información del último estudiante escaneado */}
                    {ultimoEscaneo && estudianteEscaneado && !mostrarConfirmacion && (
                      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-40 bg-blue-600 text-white rounded-xl shadow-lg p-4 min-w-[250px]">
                        <div className="text-center">
                          <p className="font-bold text-lg">{estudianteEscaneado.nombre}</p>
                          <p className="text-sm opacity-90 mt-1">Código: {ultimoEscaneo}</p>
                          <div className="mt-2 flex justify-center">
                            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div 
                      id="qr-reader" 
                      className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden mx-auto w-full max-w-sm sm:max-w-md lg:max-w-lg"
                      style={{ 
                        height: '300px'
                      }}
                    />
                    
                    {/* Estilos para hacer que el video ocupe toda el área */}
                    <style jsx>{`
                      #qr-reader video {
                        width: 100% !important;
                        height: 100% !important;
                        object-fit: cover !important;
                        border-radius: 6px;
                      }
                      #qr-reader canvas {
                        display: none !important;
                      }
                      #qr-reader div {
                        margin: 0 !important;
                        padding: 0 !important;
                      }
                    `}</style>
                    
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
                            onClick={solicitarPermisosCamara}
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
                      <label className="block text-sm font-medium text-black mb-2">
                        Código del Estudiante:
                      </label>
                      <input
                        type="text"
                        value={codigoManual}
                        onChange={(e) => setCodigoManual(e.target.value)}
                        placeholder="Ej: EST001"
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white shadow-sm transition-all duration-200 hover:border-gray-400"
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

            {/* Lista de estudiantes - Siempre visible */}
            <div className="lg:col-span-1 flex flex-col min-h-0 lg:min-h-[400px]">
              <h3 className="text-lg font-medium mb-4">Lista de Estudiantes</h3>
              
              {loading && (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-gray-600">Cargando estudiantes...</span>
                </div>
              )}
              
              {/* Estadísticas - Siempre visibles */}
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

              {/* Lista - Siempre visible */}
              {!loading && (
                <div className="space-y-2 flex-1 overflow-y-auto min-h-0">
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
                        <div className="font-medium text-black">
                          {estudiante.nombre}
                        </div>
                        <div className="text-sm text-black">
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
              className="px-4 py-2 border border-gray-300 text-black font-medium rounded-md hover:bg-gray-50"
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
                  <p>• Usar: <code className="bg-gray-100 px-1 text-gray-900">http://192.168.1.100:4747/shot.jpg</code></p>
                  <p className="text-xs text-orange-600">⚠️ Nota: Usamos imagen estática por problemas de CORS con video</p>
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
                  <p>• Usar URL: <code className="bg-gray-100 px-1 text-gray-900">http://IP:8080/videofeed</code></p>
                  <p>• Ejemplo: <code className="bg-gray-100 px-1 text-gray-900">http://192.168.1.100:8080/videofeed</code></p>
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
                  <p>• http://192.168.1.100:4747/mjpegfeed?640x480 (DroidCam)</p>
                  <p>• http://192.168.1.100:8080/videofeed (IP Webcam)</p>
                  <p>• http://10.0.0.50:8080/shot.jpg (Imagen estática)</p>
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
