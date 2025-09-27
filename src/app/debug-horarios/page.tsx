'use client'

import { useState } from 'react'

export default function DebugHorariosPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [token, setToken] = useState('')

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'
    setLogs(prev => [...prev, `[${timestamp}] ${emoji} ${message}`])
  }

  const clearLogs = () => setLogs([])

  const setTestToken = () => {
    if (token) {
      localStorage.setItem('token', token)
      addLog(`Token establecido: ${token.substring(0, 20)}...`, 'success')
    }
  }

  const clearToken = () => {
    localStorage.removeItem('token')
    setToken('')
    addLog('Token eliminado', 'warning')
  }

  const testGradosSecciones = async () => {
    addLog('Probando /api/grados-secciones...')
    
    try {
      const token = localStorage.getItem('token')
      const headers: any = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch('/api/grados-secciones?ieId=1', { headers })
      
      addLog(`Response status: ${response.status} ${response.statusText}`)
      
      if (response.ok) {
        const data = await response.json()
        addLog(`Grados-Secciones encontrados: ${data.data?.length || 0}`, 'success')
        addLog(`Datos: ${JSON.stringify(data, null, 2)}`)
      } else {
        const error = await response.text()
        addLog(`Error: ${error}`, 'error')
      }
    } catch (error: any) {
      addLog(`Error de red: ${error.message}`, 'error')
    }
  }

  const testCreateHorario = async () => {
    addLog('Probando /api/horarios/base POST...')
    
    const testData = {
      idGradoSeccion: "1",
      horaInicio: "08:00",
      horaFin: "13:30",
      aula: "Aula 1B",
      toleranciaMin: "10"
    }

    addLog(`Enviando datos: ${JSON.stringify(testData, null, 2)}`)
    
    try {
      const token = localStorage.getItem('token')
      const headers: any = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch('/api/horarios/base', {
        method: 'POST',
        headers,
        body: JSON.stringify(testData)
      })
      
      addLog(`Response status: ${response.status} ${response.statusText}`)
      
      if (response.ok) {
        const result = await response.json()
        addLog('Horario creado exitosamente!', 'success')
        addLog(`Resultado: ${JSON.stringify(result, null, 2)}`)
      } else {
        const error = await response.text()
        addLog(`Error al crear: ${error}`, 'error')
      }
    } catch (error: any) {
      addLog(`Error de red: ${error.message}`, 'error')
    }
  }

  const testHorariosBase = async () => {
    addLog('Probando /api/horarios/base GET...')
    
    try {
      const token = localStorage.getItem('token')
      const headers: any = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch('/api/horarios/base?ieId=1', { headers })
      
      addLog(`Response status: ${response.status} ${response.statusText}`)
      
      if (response.ok) {
        const data = await response.json()
        addLog(`Horarios base encontrados: ${data.data?.length || 0}`, 'success')
        addLog(`Datos: ${JSON.stringify(data, null, 2)}`)
      } else {
        const error = await response.text()
        addLog(`Error: ${error}`, 'error')
      }
    } catch (error: any) {
      addLog(`Error de red: ${error.message}`, 'error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">🔧 Debug Horarios</h1>
        
        {/* Token Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🔑 Configurar Token</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Pegar token aquí..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={setTestToken}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Establecer
            </button>
            <button
              onClick={clearToken}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Limpiar
            </button>
          </div>
          <p className="text-sm text-gray-600">
            💡 Tip: Si no tienes token, las APIs pueden funcionar sin autenticación en desarrollo
          </p>
        </div>

        {/* Test Buttons */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🧪 Pruebas de API</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={testGradosSecciones}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Test Grados-Secciones
            </button>
            <button
              onClick={testHorariosBase}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Test Horarios GET
            </button>
            <button
              onClick={testCreateHorario}
              className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
            >
              Test Crear Horario
            </button>
          </div>
        </div>

        {/* Logs Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">📋 Logs</h2>
            <button
              onClick={clearLogs}
              className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
            >
              Limpiar
            </button>
          </div>
          <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">No hay logs aún...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
