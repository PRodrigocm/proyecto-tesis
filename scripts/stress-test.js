/**
 * Script de Prueba de Estrés para el Sistema de Asistencia
 * 
 * Ejecutar: node scripts/stress-test.js
 * 
 * Este script simula múltiples usuarios concurrentes realizando
 * operaciones típicas del sistema.
 */

const BASE_URL = 'http://localhost:3000'

// Configuración de la prueba
const CONFIG = {
  // Número de usuarios concurrentes por tipo
  concurrentUsers: {
    docentes: 25,
    apoderados: 0, // Deshabilitado - credenciales inválidas
    auxiliares: 0  // Deshabilitado - usuario no es auxiliar
  },
  // Duración de la prueba en segundos
  testDurationSeconds: 60,
  // Intervalo entre requests por usuario (ms)
  requestInterval: 200,
  // Credenciales de prueba
  credentials: {
    docente: { email: 'tivem16330@filipx.com', password: '123456789' },
    apoderado: { email: 'haloperseus@gmail.com', password: '123456' },
    auxiliar: { email: 'tivem16330@filipx.com', password: '123456789' }
  }
}

// Métricas
const metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  errors: [],
  requestsByEndpoint: {},
  startTime: null,
  endTime: null
}

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// Función para hacer requests con medición de tiempo
async function makeRequest(url, options = {}, endpoint = '') {
  const startTime = Date.now()
  metrics.totalRequests++
  
  if (!metrics.requestsByEndpoint[endpoint]) {
    metrics.requestsByEndpoint[endpoint] = { success: 0, failed: 0, times: [] }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    const responseTime = Date.now() - startTime
    metrics.responseTimes.push(responseTime)
    metrics.requestsByEndpoint[endpoint].times.push(responseTime)

    if (response.ok) {
      metrics.successfulRequests++
      metrics.requestsByEndpoint[endpoint].success++
      return { success: true, data: await response.json().catch(() => ({})), responseTime }
    } else {
      metrics.failedRequests++
      metrics.requestsByEndpoint[endpoint].failed++
      const errorText = await response.text().catch(() => 'Unknown error')
      metrics.errors.push({ endpoint, status: response.status, error: errorText.substring(0, 100) })
      return { success: false, status: response.status, responseTime }
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    metrics.failedRequests++
    metrics.requestsByEndpoint[endpoint].failed++
    metrics.errors.push({ endpoint, error: error.message })
    return { success: false, error: error.message, responseTime }
  }
}

// Login y obtener token
async function login(email, password) {
  const result = await makeRequest(
    `${BASE_URL}/api/auth/login`,
    {
      method: 'POST',
      body: JSON.stringify({ email, password })
    },
    'POST /api/auth/login'
  )
  
  // El token está en data.data.token según la API
  if (result.success && result.data?.data?.token) {
    console.log(`   ✓ Login exitoso: ${email}`)
    return result.data.data.token
  }
  console.log(`   ✗ Login fallido: ${email}`)
  return null
}

// Simulador de Docente
async function simulateDocente(userId, token, stopSignal) {
  const endpoints = [
    { method: 'GET', path: '/api/docentes/horarios', name: 'GET /api/docentes/horarios' },
    { method: 'GET', path: '/api/aulas', name: 'GET /api/aulas' },
    { method: 'GET', path: '/api/justificaciones', name: 'GET /api/justificaciones' },
    { method: 'GET', path: '/api/asistencia', name: 'GET /api/asistencia' },
  ]

  while (!stopSignal.stop) {
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)]
    
    await makeRequest(
      `${BASE_URL}${endpoint.path}`,
      {
        method: endpoint.method,
        headers: { 'Authorization': `Bearer ${token}` }
      },
      endpoint.name
    )

    await sleep(CONFIG.requestInterval + Math.random() * 200)
  }
}

// Simulador de Apoderado
async function simulateApoderado(userId, token, stopSignal) {
  const endpoints = [
    { method: 'GET', path: '/api/apoderados/estudiantes', name: 'GET /api/apoderados/estudiantes' },
    { method: 'GET', path: '/api/apoderados/estadisticas', name: 'GET /api/apoderados/estadisticas' },
    { method: 'GET', path: '/api/apoderados/asistencias/ie', name: 'GET /api/apoderados/asistencias/ie' },
    { method: 'GET', path: '/api/apoderados/asistencias/aulas', name: 'GET /api/apoderados/asistencias/aulas' },
    { method: 'GET', path: '/api/apoderados/justificaciones/pendientes', name: 'GET /api/apoderados/justificaciones/pendientes' },
    { method: 'GET', path: '/api/apoderados/notificaciones', name: 'GET /api/apoderados/notificaciones' },
  ]

  while (!stopSignal.stop) {
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)]
    
    await makeRequest(
      `${BASE_URL}${endpoint.path}`,
      {
        method: endpoint.method,
        headers: { 'Authorization': `Bearer ${token}` }
      },
      endpoint.name
    )

    await sleep(CONFIG.requestInterval + Math.random() * 300)
  }
}

// Simulador de Auxiliar
async function simulateAuxiliar(userId, token, stopSignal) {
  const endpoints = [
    { method: 'GET', path: '/api/auxiliar/retiros', name: 'GET /api/auxiliar/retiros' },
    { method: 'GET', path: '/api/auxiliar/asistencia/estudiantes', name: 'GET /api/auxiliar/asistencia/estudiantes' },
    { method: 'GET', path: '/api/aulas', name: 'GET /api/aulas' },
  ]

  while (!stopSignal.stop) {
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)]
    
    await makeRequest(
      `${BASE_URL}${endpoint.path}`,
      {
        method: endpoint.method,
        headers: { 'Authorization': `Bearer ${token}` }
      },
      endpoint.name
    )

    await sleep(CONFIG.requestInterval + Math.random() * 250)
  }
}

// Simulador de requests sin autenticación (páginas públicas)
async function simulatePublicRequests(stopSignal) {
  const endpoints = [
    { method: 'GET', path: '/api/auth/me', name: 'GET /api/auth/me (no auth)' },
  ]

  while (!stopSignal.stop) {
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)]
    
    await makeRequest(
      `${BASE_URL}${endpoint.path}`,
      { method: endpoint.method },
      endpoint.name
    )

    await sleep(CONFIG.requestInterval * 2)
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Calcular estadísticas
function calculateStats() {
  const times = metrics.responseTimes.sort((a, b) => a - b)
  const sum = times.reduce((a, b) => a + b, 0)
  
  return {
    totalRequests: metrics.totalRequests,
    successfulRequests: metrics.successfulRequests,
    failedRequests: metrics.failedRequests,
    successRate: ((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(2),
    avgResponseTime: (sum / times.length).toFixed(2),
    minResponseTime: times[0] || 0,
    maxResponseTime: times[times.length - 1] || 0,
    p50: times[Math.floor(times.length * 0.5)] || 0,
    p90: times[Math.floor(times.length * 0.9)] || 0,
    p95: times[Math.floor(times.length * 0.95)] || 0,
    p99: times[Math.floor(times.length * 0.99)] || 0,
    requestsPerSecond: (metrics.totalRequests / CONFIG.testDurationSeconds).toFixed(2),
    testDuration: CONFIG.testDurationSeconds
  }
}

// Imprimir reporte
function printReport() {
  const stats = calculateStats()
  
  console.log('\n')
  log('═══════════════════════════════════════════════════════════════', 'cyan')
  log('                    REPORTE DE PRUEBA DE ESTRÉS                 ', 'cyan')
  log('═══════════════════════════════════════════════════════════════', 'cyan')
  
  console.log('\n📊 RESUMEN GENERAL')
  log('───────────────────────────────────────────────────────────────', 'yellow')
  console.log(`   Duración de la prueba:     ${stats.testDuration} segundos`)
  console.log(`   Total de requests:         ${stats.totalRequests}`)
  console.log(`   Requests exitosos:         ${stats.successfulRequests}`)
  console.log(`   Requests fallidos:         ${stats.failedRequests}`)
  console.log(`   Tasa de éxito:             ${stats.successRate}%`)
  console.log(`   Requests por segundo:      ${stats.requestsPerSecond}`)
  
  console.log('\n⏱️  TIEMPOS DE RESPUESTA (ms)')
  log('───────────────────────────────────────────────────────────────', 'yellow')
  console.log(`   Promedio:                  ${stats.avgResponseTime} ms`)
  console.log(`   Mínimo:                    ${stats.minResponseTime} ms`)
  console.log(`   Máximo:                    ${stats.maxResponseTime} ms`)
  console.log(`   Percentil 50 (mediana):    ${stats.p50} ms`)
  console.log(`   Percentil 90:              ${stats.p90} ms`)
  console.log(`   Percentil 95:              ${stats.p95} ms`)
  console.log(`   Percentil 99:              ${stats.p99} ms`)
  
  console.log('\n📈 DESGLOSE POR ENDPOINT')
  log('───────────────────────────────────────────────────────────────', 'yellow')
  
  Object.entries(metrics.requestsByEndpoint)
    .sort((a, b) => (b[1].success + b[1].failed) - (a[1].success + a[1].failed))
    .forEach(([endpoint, data]) => {
      const total = data.success + data.failed
      const avgTime = data.times.length > 0 
        ? (data.times.reduce((a, b) => a + b, 0) / data.times.length).toFixed(0)
        : 0
      const successRate = ((data.success / total) * 100).toFixed(1)
      
      const statusColor = successRate >= 95 ? 'green' : successRate >= 80 ? 'yellow' : 'red'
      log(`   ${endpoint}`, 'reset')
      log(`      Total: ${total} | ✓ ${data.success} | ✗ ${data.failed} | ${successRate}% | ~${avgTime}ms`, statusColor)
    })
  
  if (metrics.errors.length > 0) {
    console.log('\n❌ ERRORES (primeros 10)')
    log('───────────────────────────────────────────────────────────────', 'red')
    metrics.errors.slice(0, 10).forEach((err, i) => {
      console.log(`   ${i + 1}. ${err.endpoint}: ${err.status || ''} ${err.error || ''}`)
    })
  }
  
  console.log('\n')
  
  // Evaluación del rendimiento
  log('📋 EVALUACIÓN', 'magenta')
  log('───────────────────────────────────────────────────────────────', 'yellow')
  
  if (parseFloat(stats.successRate) >= 99 && parseFloat(stats.avgResponseTime) < 200) {
    log('   ✅ EXCELENTE - El sistema maneja bien la carga', 'green')
  } else if (parseFloat(stats.successRate) >= 95 && parseFloat(stats.avgResponseTime) < 500) {
    log('   ✅ BUENO - El sistema funciona correctamente bajo carga', 'green')
  } else if (parseFloat(stats.successRate) >= 90) {
    log('   ⚠️  ACEPTABLE - Hay margen de mejora', 'yellow')
  } else {
    log('   ❌ NECESITA MEJORAS - El sistema tiene problemas bajo carga', 'red')
  }
  
  log('═══════════════════════════════════════════════════════════════\n', 'cyan')
}

// Función principal
async function runStressTest() {
  log('\n🚀 INICIANDO PRUEBA DE ESTRÉS', 'cyan')
  log('═══════════════════════════════════════════════════════════════', 'cyan')
  console.log(`   URL Base: ${BASE_URL}`)
  console.log(`   Duración: ${CONFIG.testDurationSeconds} segundos`)
  console.log(`   Usuarios simulados:`)
  console.log(`      - Docentes: ${CONFIG.concurrentUsers.docentes}`)
  console.log(`      - Apoderados: ${CONFIG.concurrentUsers.apoderados}`)
  console.log(`      - Auxiliares: ${CONFIG.concurrentUsers.auxiliares}`)
  log('═══════════════════════════════════════════════════════════════\n', 'cyan')

  // Verificar que el servidor esté corriendo
  log('🔍 Verificando conexión al servidor...', 'yellow')
  try {
    const response = await fetch(`${BASE_URL}/api/auth/me`)
    log('✅ Servidor accesible\n', 'green')
  } catch (error) {
    log('❌ No se puede conectar al servidor. Asegúrate de que esté corriendo.', 'red')
    log(`   Ejecuta: npm run dev\n`, 'yellow')
    process.exit(1)
  }

  // Obtener tokens de autenticación
  log('🔐 Obteniendo tokens de autenticación...', 'yellow')
  
  const docenteToken = await login(CONFIG.credentials.docente.email, CONFIG.credentials.docente.password)
  const apoderadoToken = await login(CONFIG.credentials.apoderado.email, CONFIG.credentials.apoderado.password)
  const auxiliarToken = await login(CONFIG.credentials.auxiliar.email, CONFIG.credentials.auxiliar.password)

  if (!docenteToken && !apoderadoToken && !auxiliarToken) {
    log('⚠️  No se pudo autenticar con las credenciales de prueba.', 'yellow')
    log('   Ejecutando prueba solo con endpoints públicos...\n', 'yellow')
  } else {
    log('✅ Tokens obtenidos\n', 'green')
  }

  // Señal para detener los simuladores
  const stopSignal = { stop: false }
  const simulators = []

  metrics.startTime = Date.now()

  // Iniciar simuladores de docentes
  if (docenteToken) {
    for (let i = 0; i < CONFIG.concurrentUsers.docentes; i++) {
      simulators.push(simulateDocente(i, docenteToken, stopSignal))
    }
    log(`👨‍🏫 ${CONFIG.concurrentUsers.docentes} docentes simulados iniciados`, 'blue')
  }

  // Iniciar simuladores de apoderados
  if (apoderadoToken) {
    for (let i = 0; i < CONFIG.concurrentUsers.apoderados; i++) {
      simulators.push(simulateApoderado(i, apoderadoToken, stopSignal))
    }
    log(`👨‍👩‍👧 ${CONFIG.concurrentUsers.apoderados} apoderados simulados iniciados`, 'blue')
  }

  // Iniciar simuladores de auxiliares
  if (auxiliarToken) {
    for (let i = 0; i < CONFIG.concurrentUsers.auxiliares; i++) {
      simulators.push(simulateAuxiliar(i, auxiliarToken, stopSignal))
    }
    log(`👮 ${CONFIG.concurrentUsers.auxiliares} auxiliares simulados iniciados`, 'blue')
  }

  // Simulador de requests públicos
  simulators.push(simulatePublicRequests(stopSignal))

  console.log('\n')

  // Mostrar progreso
  const progressInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - metrics.startTime) / 1000)
    const remaining = CONFIG.testDurationSeconds - elapsed
    const rps = (metrics.totalRequests / elapsed).toFixed(1)
    process.stdout.write(`\r⏳ Progreso: ${elapsed}s/${CONFIG.testDurationSeconds}s | Requests: ${metrics.totalRequests} | RPS: ${rps} | Errores: ${metrics.failedRequests}   `)
  }, 1000)

  // Esperar duración de la prueba
  await sleep(CONFIG.testDurationSeconds * 1000)

  // Detener simuladores
  stopSignal.stop = true
  clearInterval(progressInterval)
  
  metrics.endTime = Date.now()

  // Esperar a que terminen los requests pendientes
  await sleep(2000)

  // Imprimir reporte
  printReport()
}

// Ejecutar
runStressTest().catch(console.error)
