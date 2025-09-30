'use client'

import { useState, useEffect } from 'react'
import { getNetworkURL } from '../../utils/networkUtils'
import NetworkIPConfig from './NetworkIPConfig'
// import { QRCodeSVG } from 'qrcode.react' // Comentado temporalmente

interface CamaraIPHelperProps {
  onURLGenerated?: (url: string) => void
}

export default function CamaraIPHelper({ onURLGenerated }: CamaraIPHelperProps) {
  const [serverURL, setServerURL] = useState('')
  const [cameraURL, setCameraURL] = useState('')
  const [showQR, setShowQR] = useState(false)
  const [cameraStatus, setCameraStatus] = useState({
    isActive: false,
    lastFrameAge: 0,
    frameCount: 0
  })

  useEffect(() => {
    const setupNetworkURL = async () => {
      try {
        // Usar la utilidad para detectar la IP de red automáticamente
        const networkURL = await getNetworkURL()
        setServerURL(networkURL)
        
        const streamURL = `${networkURL}/api/camara-ip/stream`
        setCameraURL(streamURL)
        
        console.log('🌐 URL de red detectada:', networkURL)
        console.log('📹 URL de stream:', streamURL)
        
        // Notificar URL generada
        if (onURLGenerated) {
          onURLGenerated(streamURL)
        }
      } catch (error) {
        console.error('Error configurando URL de red:', error)
        // Fallback a localhost
        const fallbackURL = window.location.origin
        setServerURL(fallbackURL)
        setCameraURL(`${fallbackURL}/api/camara-ip/stream`)
      }
    }
    
    setupNetworkURL()
  }, [onURLGenerated])

  // Verificar estado de la cámara cada 2 segundos
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/camara-ip/status')
        if (response.ok) {
          const data = await response.json()
          setCameraStatus(data.status)
        }
      } catch (error) {
        console.error('Error verificando estado:', error)
      }
    }

    const interval = setInterval(checkStatus, 2000)
    checkStatus() // Verificar inmediatamente

    return () => clearInterval(interval)
  }, [])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('URL copiada al portapapeles')
    } catch (error) {
      console.error('Error copiando:', error)
    }
  }

  const openCameraPage = () => {
    const cameraPageURL = `${serverURL}/camara-ip`
    window.open(cameraPageURL, '_blank')
  }

  const handleIPConfigured = async (ip: string) => {
    // Reconfigurar URLs cuando se configure una nueva IP
    const networkURL = await getNetworkURL()
    setServerURL(networkURL)
    const streamURL = `${networkURL}/api/camara-ip/stream`
    setCameraURL(streamURL)
    
    if (onURLGenerated) {
      onURLGenerated(streamURL)
    }
  }

  return (
    <div className="space-y-4">
      {/* Configuración de IP de Red */}
      <NetworkIPConfig onIPConfigured={handleIPConfigured} />
      
      {/* Estado de la cámara */}
      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
        <div className={`w-3 h-3 rounded-full ${
          cameraStatus.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
        }`}></div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">
            {cameraStatus.isActive ? '🔴 Cámara IP Activa' : '⚫ Cámara IP Desconectada'}
          </p>
          {cameraStatus.isActive && (
            <p className="text-xs text-gray-600">
              Frames recibidos: {cameraStatus.frameCount} | 
              Última actualización: {Math.round(cameraStatus.lastFrameAge / 1000)}s
            </p>
          )}
        </div>
      </div>

      {/* URL de la cámara */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          URL de la Cámara IP:
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={cameraURL}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 font-mono"
          />
          <button
            onClick={() => copyToClipboard(cameraURL)}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            title="Copiar URL"
          >
            📋
          </button>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={openCameraPage}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
        >
          📱 Abrir Cámara
        </button>
        <button
          onClick={() => setShowQR(!showQR)}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium"
        >
          📱 Mostrar QR
        </button>
      </div>

      {/* Código QR */}
      {showQR && (
        <div className="flex flex-col items-center space-y-3 p-4 bg-white border-2 border-gray-200 rounded-lg">
          <p className="text-sm font-medium text-gray-700">
            URL para tu teléfono:
          </p>
          <div className="p-4 bg-gray-100 rounded border-2 border-dashed border-gray-300">
            <code className="text-sm font-mono text-gray-800 break-all">
              {serverURL}/camara-ip
            </code>
          </div>
          
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Haz clic en "📱 Abrir Cámara" o escanea el QR</li>
            <li>2. En tu teléfono, presiona "Iniciar Cámara"</li>
            <li>3. Copia la URL de arriba en el campo "Cámara IP"</li>
            <li>4. Selecciona "📱 Cámara IP (Teléfono)" como tipo</li>
            <li>5. ¡Tu teléfono ahora es una cámara IP!</li>
          </ol>
        </div>
      )}

      {/* Vista previa */}
      {cameraStatus.isActive && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Vista Previa:
          </label>
          <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-100">
            <img
              src={`${cameraURL}?t=${Date.now()}`}
              alt="Vista previa de cámara IP"
              className="w-full h-32 object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
