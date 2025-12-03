/**
 * Script para probar el envío de reportes mensuales a docentes
 * 
 * Ejecutar: node scripts/test-reportes-mensuales.js
 */

const BASE_URL = 'http://localhost:3000'

async function testReportesMensuales() {
  console.log('🧪 PRUEBA DE REPORTES MENSUALES AUTOMÁTICOS')
  console.log('═'.repeat(60))
  console.log('')

  try {
    // 1. Primero hacer login para obtener token
    console.log('🔐 Obteniendo token de autenticación...')
    
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'jesuspetrenco123@gmail.com',
        password: '123456789'
      })
    })

    if (!loginResponse.ok) {
      console.log('❌ Error en login:', await loginResponse.text())
      return
    }

    const loginData = await loginResponse.json()
    const token = loginData.data?.token

    if (!token) {
      console.log('❌ No se obtuvo token')
      return
    }

    console.log('✅ Token obtenido correctamente')
    console.log('')

    // 2. Probar el endpoint de reportes mensuales (simulación)
    console.log('📊 Ejecutando simulación de reportes mensuales...')
    console.log('')

    const reporteResponse = await fetch(`${BASE_URL}/api/reportes/enviar-mensual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'test-key' // API key de prueba
      },
      body: JSON.stringify({
        soloSimular: false, // Solo simular, no enviar emails reales
        enviarEmail: true
      })
    })

    if (!reporteResponse.ok) {
      console.log('❌ Error en reporte:', await reporteResponse.text())
      return
    }

    const reporteData = await reporteResponse.json()

    console.log('═'.repeat(60))
    console.log('📋 RESULTADO DE LA SIMULACIÓN')
    console.log('═'.repeat(60))
    console.log('')
    console.log(`📅 Período: ${reporteData.periodo}`)
    console.log(`📅 Desde: ${new Date(reporteData.fechaInicio).toLocaleDateString('es-ES')}`)
    console.log(`📅 Hasta: ${new Date(reporteData.fechaFin).toLocaleDateString('es-ES')}`)
    console.log('')
    console.log('📊 RESUMEN:')
    console.log(`   👨‍🏫 Docentes procesados: ${reporteData.resumen.docentesProcesados}`)
    console.log(`   📄 Reportes generados: ${reporteData.resumen.reportesGenerados}`)
    console.log(`   ❌ Errores: ${reporteData.resumen.errores}`)
    console.log('')

    if (reporteData.reportes && reporteData.reportes.length > 0) {
      console.log('═'.repeat(60))
      console.log('👨‍🏫 DETALLE POR DOCENTE')
      console.log('═'.repeat(60))
      
      reporteData.reportes.forEach((reporte, index) => {
        console.log('')
        console.log(`${index + 1}. ${reporte.docenteNombre}`)
        console.log(`   📧 Email: ${reporte.docenteEmail || 'No disponible'}`)
        console.log(`   📚 Aulas asignadas: ${reporte.aulas.length}`)
        
        if (reporte.aulas.length > 0) {
          console.log('   📊 Estadísticas por aula:')
          reporte.aulas.forEach(aula => {
            console.log(`      • ${aula.aulaNombre}: ${aula.totalEstudiantes} estudiantes`)
            console.log(`        ✅ Presentes: ${aula.estadisticas.presentes}`)
            console.log(`        ⏰ Tardanzas: ${aula.estadisticas.tardanzas}`)
            console.log(`        ❌ Ausentes: ${aula.estadisticas.ausentes}`)
            console.log(`        📄 Justificados: ${aula.estadisticas.justificados}`)
            console.log(`        📈 % Asistencia: ${aula.estadisticas.porcentajeAsistencia}%`)
          })
        }
        
        console.log(`   📈 Promedio general: ${reporte.resumenGeneral.promedioAsistencia}%`)
        console.log('   ' + '─'.repeat(50))
      })
    }

    if (reporteData.errores && reporteData.errores.length > 0) {
      console.log('')
      console.log('⚠️ ERRORES ENCONTRADOS:')
      reporteData.errores.forEach(err => {
        console.log(`   • Docente ${err.docenteId}: ${err.error}`)
      })
    }

    console.log('')
    console.log('═'.repeat(60))
    console.log('✅ PRUEBA COMPLETADA')
    console.log('═'.repeat(60))
    console.log('')
    
    if (reporteData.mensaje.includes('Simulación')) {
      console.log('⚠️ Modo simulación - No se enviaron emails reales')
      console.log('💡 Para enviar emails reales, configura:')
      console.log('   - soloSimular: false')
      console.log('   - enviarEmail: true')
      console.log('   - Variables de entorno GMAIL_USER y GMAIL_APP_PASSWORD')
    } else {
      console.log('📧 Emails enviados a los docentes')
      console.log('   Verifica las bandejas de entrada de los destinatarios')
    }
    console.log('')

  } catch (error) {
    console.error('💥 Error en la prueba:', error.message)
  }
}

// Ejecutar
testReportesMensuales()
