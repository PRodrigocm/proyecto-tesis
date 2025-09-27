'use client'

import { useState } from 'react'

export default function TestHorariosPage() {
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'
    setLogs(prev => [...prev, `[${timestamp}] ${emoji} ${message}`])
  }

  const clearLogs = () => setLogs([])

  const doLogin = async () => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@sistema.com',
          password: 'admin123',
          institucionEducativa: '1',
          rol: 'ADMINISTRATIVO'
        })
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('token', data.data.token)
        addLog('Login exitoso', 'success')
        return true
      } else {
        addLog('Error en login', 'error')
        return false
      }
    } catch (error: any) {
      addLog(`Error login: ${error.message}`, 'error')
      return false
    }
  }

  const getGrados = async () => {
    try {
      const response = await fetch('/api/grados-secciones?ieId=1')
      if (response.ok) {
        const data = await response.json()
        addLog(`${data.data.length} grados-secciones encontrados`, 'success')
        return data.data
      } else {
        addLog('Error obteniendo grados', 'error')
        return null
      }
    } catch (error: any) {
      addLog(`Error grados: ${error.message}`, 'error')
      return null
    }
  }

  const getHorariosExistentes = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/horarios/base?ieId=1', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        addLog(`${data.data.length} horarios existentes encontrados`, 'info')
        
        // Agrupar por grado-sección
        const agrupados: any = {}
        data.data.forEach((horario: any) => {
          if (!agrupados[horario.idGradoSeccion]) {
            agrupados[horario.idGradoSeccion] = []
          }
          agrupados[horario.idGradoSeccion].push(horario)
        })
        
        addLog(`Grados con horarios: ${Object.keys(agrupados).join(', ')}`, 'info')
        return agrupados
      } else {
        addLog('Error obteniendo horarios existentes', 'error')
        return {}
      }
    } catch (error: any) {
      addLog(`Error horarios: ${error.message}`, 'error')
      return {}
    }
  }

  const findGradoSinHorarios = (grados: any[], horariosExistentes: any) => {
    for (const grado of grados) {
      if (!horariosExistentes[grado.idGradoSeccion]) {
        addLog(`Grado sin horarios encontrado: ${grado.grado.nombre}° ${grado.seccion.nombre} (ID: ${grado.idGradoSeccion})`, 'success')
        return grado
      }
    }
    
    addLog('Todos los grados ya tienen horarios. Usando el primero para probar...', 'warning')
    return grados[0]
  }

  const createHorario = async (grado: any) => {
    try {
      const token = localStorage.getItem('token')
      const testData = {
        idGradoSeccion: grado.idGradoSeccion.toString(),
        horaInicio: "08:00",
        horaFin: "13:30",
        aula: `Aula ${grado.grado.nombre}${grado.seccion.nombre}`,
        toleranciaMin: "10"
      }

      addLog(`Enviando datos: ${JSON.stringify(testData, null, 2)}`, 'info')

      const response = await fetch('/api/horarios/base', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(testData)
      })

      addLog(`Response: ${response.status} ${response.statusText}`, 'info')

      if (response.ok) {
        const result = await response.json()
        addLog('API retornó éxito!', 'success')
        addLog(`Horarios creados según API: ${result.data.horariosCreados}`, 'success')
        
        if (result.data.horariosCreados > 0) {
          addLog('¡Horarios nuevos creados! Verifica en Prisma Studio.', 'success')
        } else {
          addLog('API dice éxito pero 0 horarios creados (ya existían)', 'warning')
        }
        
        addLog('Revisa los logs del servidor para más detalles', 'info')
      } else {
        const error = await response.json()
        addLog(`Error API: ${error.error}`, 'error')
      }
    } catch (error: any) {
      addLog(`Error creando: ${error.message}`, 'error')
    }
  }

  const testCompleto = async () => {
    addLog('=== INICIANDO TEST COMPLETO ===', 'info')
    
    // Paso 1: Login
    addLog('Paso 1: Haciendo login...', 'info')
    const loginSuccess = await doLogin()
    if (!loginSuccess) return
    
    // Paso 2: Obtener grados disponibles
    addLog('Paso 2: Obteniendo grados-secciones...', 'info')
    const grados = await getGrados()
    if (!grados || grados.length === 0) return
    
    // Paso 3: Obtener horarios existentes
    addLog('Paso 3: Verificando horarios existentes...', 'info')
    const horariosExistentes = await getHorariosExistentes()
    
    // Paso 4: Encontrar grado sin horarios
    addLog('Paso 4: Buscando grado sin horarios...', 'info')
    const gradoSinHorarios = findGradoSinHorarios(grados, horariosExistentes)
    if (!gradoSinHorarios) return
    
    // Paso 5: Crear horario para ese grado
    addLog('Paso 5: Creando horario nuevo...', 'info')
    await createHorario(gradoSinHorarios)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">🆕 Test Crear Horario Nuevo</h1>
        <p className="text-gray-600 mb-6">Esta prueba busca un grado-sección sin horarios y crea uno nuevo</p>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex gap-4 mb-4">
            <button
              onClick={testCompleto}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              🚀 Test Completo
            </button>
            <button
              onClick={clearLogs}
              className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Limpiar
            </button>
          </div>
          
          <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">
                🔧 Test Crear Horario Nuevo iniciado<br/>
                💡 Haz clic en "Test Completo" para ejecutar todas las pruebas
              </div>
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
