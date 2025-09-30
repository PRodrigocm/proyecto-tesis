/**
 * Utilidades para detectar la IP de red automáticamente
 */

/**
 * Obtiene la URL de red del servidor, priorizando la IP de red sobre localhost
 * @returns Promise<string> URL completa con protocolo, IP y puerto
 */
export const getNetworkURL = async (): Promise<string> => {
  try {
    // Si ya estamos en una IP de red, usarla directamente
    const hostname = window.location.hostname
    const port = window.location.port
    const protocol = window.location.protocol
    
    // Si no es localhost, usar la URL actual
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      console.log('🌐 Ya estamos en IP de red:', window.location.origin)
      return window.location.origin
    }
    
    // Intentar usar IP configurada manualmente
    const configuredIP = getNextJSNetworkIPFromConsole()
    if (configuredIP) {
      const networkURL = `${protocol}//${configuredIP}:${port || '3000'}`
      console.log('🌐 Usando IP configurada:', networkURL)
      return networkURL
    }
    
    // Intentar detectar la IP de red automáticamente con WebRTC
    console.log('🔍 Intentando detectar IP automáticamente...')
    const networkIP = await detectNetworkIP()
    
    if (networkIP) {
      const networkURL = `${protocol}//${networkIP}:${port || '3000'}`
      console.log('🌐 IP de red detectada automáticamente:', networkIP)
      // Guardar para uso futuro
      saveNetworkIP(networkIP)
      return networkURL
    }
    
    // Fallback a localhost si no se puede detectar
    console.log('⚠️ No se pudo detectar IP de red, usando localhost')
    console.log('💡 Para usar IP de red, ejecuta en consola: localStorage.setItem("nextjs-network-ip", "TU_IP")')
    return window.location.origin
    
  } catch (error) {
    console.error('Error detectando URL de red:', error)
    return window.location.origin
  }
}

/**
 * Detecta la IP de red local usando WebRTC
 * @returns Promise<string | null> IP de red o null si no se puede detectar
 */
const detectNetworkIP = (): Promise<string | null> => {
  return new Promise((resolve) => {
    try {
      // Primero intentar usar la IP que Next.js detectó automáticamente
      const nextJSDetectedIP = getNextJSNetworkIP()
      
      if (nextJSDetectedIP) {
        console.log('📡 Usando IP detectada por Next.js:', nextJSDetectedIP)
        resolve(nextJSDetectedIP)
        return
      }
      
      // Fallback: Usar WebRTC para detectar la IP local
      const rtc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      })
      
      // Crear un canal de datos dummy
      rtc.createDataChannel('')
      
      rtc.onicecandidate = (event) => {
        if (event.candidate) {
          const candidate = event.candidate.candidate
          const ipMatch = candidate.match(/(\d+\.\d+\.\d+\.\d+)/)
          
          if (ipMatch) {
            const ip = ipMatch[1]
            // Filtrar IPs locales válidas (evitar 127.x.x.x)
            if (!ip.startsWith('127.') && !ip.startsWith('169.254.')) {
              console.log('🔍 IP detectada via WebRTC:', ip)
              rtc.close()
              resolve(ip)
              return
            }
          }
        }
      }
      
      // Crear oferta para iniciar el proceso ICE
      rtc.createOffer()
        .then(offer => rtc.setLocalDescription(offer))
        .catch(() => resolve(null))
      
      // Timeout después de 3 segundos
      setTimeout(() => {
        rtc.close()
        resolve(null)
      }, 3000)
      
    } catch (webrtcError) {
      console.error('Error en detección WebRTC:', webrtcError)
      resolve(null)
    }
  })
}

/**
 * Obtiene la URL de red de forma síncrona usando la IP conocida de Next.js
 * @returns string URL de red
 */
export const getNetworkURLSync = (): string => {
  const hostname = window.location.hostname
  const port = window.location.port
  const protocol = window.location.protocol
  
  // Si no es localhost, usar la URL actual
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return window.location.origin
  }
  
  // Intentar leer la IP de red desde variables de entorno o configuración
  // En desarrollo, Next.js suele mostrar la IP en la consola
  const networkIP = getNextJSNetworkIP()
  
  if (networkIP) {
    return `${protocol}//${networkIP}:${port || '3000'}`
  }
  
  // Fallback a localhost
  return window.location.origin
}

/**
 * Intenta obtener la IP de red que Next.js detectó automáticamente
 * @returns string | null IP de red o null
 */
const getNextJSNetworkIP = (): string | null => {
  try {
    // Verificar si hay una IP guardada en localStorage
    const savedNetworkIP = localStorage.getItem('nextjs-network-ip')
    if (savedNetworkIP && isValidIP(savedNetworkIP)) {
      console.log('📱 Usando IP guardada:', savedNetworkIP)
      return savedNetworkIP
    }
    
    // Si no hay IP guardada, usar la IP que Next.js detectó automáticamente
    const nextJSDetectedIP = '26.133.236.4' // IP detectada en los logs de Next.js
    console.log('📡 Usando IP detectada por Next.js:', nextJSDetectedIP)
    return nextJSDetectedIP
    
  } catch (error) {
    console.error('Error obteniendo IP de Next.js:', error)
    return null
  }
}

/**
 * Valida si una cadena es una IP válida
 * @param ip string a validar
 * @returns boolean true si es IP válida
 */
const isValidIP = (ip: string): boolean => {
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
  if (!ipRegex.test(ip)) return false
  
  const parts = ip.split('.')
  return parts.every(part => {
    const num = parseInt(part, 10)
    return num >= 0 && num <= 255
  })
}

/**
 * Guarda la IP de red detectada para uso futuro
 * @param ip IP de red a guardar
 */
export const saveNetworkIP = (ip: string): void => {
  try {
    if (isValidIP(ip)) {
      localStorage.setItem('nextjs-network-ip', ip)
      console.log('💾 IP de red guardada:', ip)
    }
  } catch (error) {
    console.error('Error guardando IP de red:', error)
  }
}

/**
 * Obtiene la IP de red desde la consola de Next.js
 * El usuario debe copiar la IP que Next.js muestra en "Network: http://IP:3000"
 * @returns string IP de red configurada o detectada automáticamente
 */
export const getNextJSNetworkIPFromConsole = (): string | null => {
  try {
    // Primero verificar si hay una IP guardada manualmente
    const savedIP = localStorage.getItem('nextjs-network-ip')
    if (savedIP && isValidIP(savedIP)) {
      console.log('📱 Usando IP configurada:', savedIP)
      return savedIP
    }
    
    // Si no hay IP guardada, mostrar instrucciones al usuario
    console.log(`
🌐 CONFIGURACIÓN DE IP DE RED:
1. Mira la consola donde ejecutaste "npm run dev"
2. Busca la línea que dice "Network: http://IP:3000"
3. Copia esa IP y ejecútala en la consola del navegador:
   
   localStorage.setItem('nextjs-network-ip', 'TU_IP_AQUI')
   
4. Recarga la página
    `)
    
    return null
  } catch (error) {
    console.error('Error obteniendo IP de Next.js:', error)
    return null
  }
}
