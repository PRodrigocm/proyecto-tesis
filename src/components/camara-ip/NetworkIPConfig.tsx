'use client'

import { useState, useEffect } from 'react'
import { saveNetworkIP } from '../../utils/networkUtils'

interface NetworkIPConfigProps {
  onIPConfigured?: (ip: string) => void
}

export default function NetworkIPConfig({ onIPConfigured }: NetworkIPConfigProps) {
  const [showConfig, setShowConfig] = useState(false)
  const [ipInput, setIpInput] = useState('')
  const [currentIP, setCurrentIP] = useState<string | null>(null)
  const [isLocalhost, setIsLocalhost] = useState(false)

  useEffect(() => {
    // Verificar si estamos en localhost
    const hostname = window.location.hostname
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1'
    setIsLocalhost(isLocal)

    // Obtener IP configurada actual
    const savedIP = localStorage.getItem('nextjs-network-ip')
    setCurrentIP(savedIP)

    // Mostrar configuración automáticamente si estamos en localhost y no hay IP configurada
    if (isLocal && !savedIP) {
      setShowConfig(true)
    }
  }, [])

  const handleSaveIP = () => {
    if (ipInput.trim()) {
      saveNetworkIP(ipInput.trim())
      setCurrentIP(ipInput.trim())
      setShowConfig(false)
      
      if (onIPConfigured) {
        onIPConfigured(ipInput.trim())
      }
      
      // Recargar la página para aplicar la nueva IP
      window.location.reload()
    }
  }

  const handleClearIP = () => {
    localStorage.removeItem('nextjs-network-ip')
    setCurrentIP(null)
    setIpInput('')
  }

  if (!isLocalhost) {
    return null // No mostrar si ya estamos en IP de red
  }

  return (
    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-blue-800">
          🌐 Configuración de IP de Red
        </h3>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          {showConfig ? 'Ocultar' : 'Configurar'}
        </button>
      </div>

      {currentIP ? (
        <div className="mb-2">
          <p className="text-xs text-green-700">
            ✅ IP configurada: <code className="bg-green-100 px-1 rounded">{currentIP}</code>
          </p>
          <button
            onClick={handleClearIP}
            className="text-xs text-red-600 hover:text-red-800 mt-1"
          >
            🗑️ Limpiar configuración
          </button>
        </div>
      ) : (
        <p className="text-xs text-orange-700 mb-2">
          ⚠️ Usando localhost - Para acceso móvil, configura la IP de red
        </p>
      )}

      {showConfig && (
        <div className="space-y-3">
          <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
            <p className="font-medium mb-1">📋 Instrucciones:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Mira la consola donde ejecutaste <code>npm run dev</code></li>
              <li>Busca la línea: <code>Network: http://IP:3000</code></li>
              <li>Copia esa IP y pégala abajo</li>
              <li>Haz clic en "Guardar"</li>
            </ol>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={ipInput}
              onChange={(e) => setIpInput(e.target.value)}
              placeholder="Ej: 192.168.1.100"
              className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleSaveIP}
              disabled={!ipInput.trim()}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              💾 Guardar
            </button>
          </div>

          <div className="text-xs text-gray-600">
            <p className="mb-1">💡 <strong>Ejemplos de IPs comunes:</strong></p>
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => setIpInput('192.168.1.100')}
                className="text-left text-blue-600 hover:text-blue-800"
              >
                192.168.1.100
              </button>
              <button
                onClick={() => setIpInput('192.168.0.100')}
                className="text-left text-blue-600 hover:text-blue-800"
              >
                192.168.0.100
              </button>
              <button
                onClick={() => setIpInput('10.0.0.100')}
                className="text-left text-blue-600 hover:text-blue-800"
              >
                10.0.0.100
              </button>
              <button
                onClick={() => setIpInput('172.16.0.100')}
                className="text-left text-blue-600 hover:text-blue-800"
              >
                172.16.0.100
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
