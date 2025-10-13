import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyQRCodes() {
  try {
    console.log('🔍 VERIFICANDO CÓDIGOS QR EN LA BASE DE DATOS')
    console.log('=' .repeat(50))
    
    const estudiantes = await prisma.estudiante.findMany({
      include: {
        usuario: true,
        gradoSeccion: {
          include: {
            grado: true,
            seccion: true
          }
        }
      },
      orderBy: {
        usuario: {
          apellido: 'asc'
        }
      }
    })

    console.log(`📊 Total de estudiantes: ${estudiantes.length}`)
    console.log('')

    estudiantes.forEach((estudiante, index) => {
      const nombre = `${estudiante.usuario.apellido}, ${estudiante.usuario.nombre}`
      const dni = estudiante.usuario.dni
      const qr = estudiante.qr
      const grado = estudiante.gradoSeccion ? 
        `${estudiante.gradoSeccion.grado.nombre}° ${estudiante.gradoSeccion.seccion.nombre}` : 
        'Sin grado'

      console.log(`${index + 1}. ${nombre}`)
      console.log(`   📋 DNI: ${dni}`)
      console.log(`   📱 QR Code: ${qr}`)
      console.log(`   🎓 Grado: ${grado}`)
      console.log(`   ✅ QR = DNI: ${qr === dni ? 'SÍ' : 'NO'}`)
      console.log('')
    })

    // Verificar que todos los QR codes coincidan con los DNI
    const qrCodesCorrectos = estudiantes.filter(est => est.qr === est.usuario.dni)
    const qrCodesIncorrectos = estudiantes.filter(est => est.qr !== est.usuario.dni)

    console.log('📈 RESUMEN DE VERIFICACIÓN:')
    console.log('=' .repeat(30))
    console.log(`✅ QR Codes correctos: ${qrCodesCorrectos.length}`)
    console.log(`❌ QR Codes incorrectos: ${qrCodesIncorrectos.length}`)
    
    if (qrCodesIncorrectos.length > 0) {
      console.log('')
      console.log('⚠️  ESTUDIANTES CON QR INCORRECTO:')
      qrCodesIncorrectos.forEach(est => {
        console.log(`   - ${est.usuario.apellido}, ${est.usuario.nombre}`)
        console.log(`     DNI: ${est.usuario.dni} | QR: ${est.qr}`)
      })
    }

    console.log('')
    console.log('🎯 CÓDIGOS QR ÚNICOS:')
    const qrCodes = estudiantes.map(est => est.qr)
    const qrCodesUnicos = [...new Set(qrCodes)]
    console.log(`   Total QR codes: ${qrCodes.length}`)
    console.log(`   QR codes únicos: ${qrCodesUnicos.length}`)
    console.log(`   ✅ Todos únicos: ${qrCodes.length === qrCodesUnicos.length ? 'SÍ' : 'NO'}`)

    if (qrCodes.length !== qrCodesUnicos.length) {
      console.log('')
      console.log('⚠️  QR CODES DUPLICADOS ENCONTRADOS:')
      const duplicados = qrCodes.filter((qr, index) => qrCodes.indexOf(qr) !== index)
      duplicados.forEach(qr => {
        const estudiantesConEsteQR = estudiantes.filter(est => est.qr === qr)
        console.log(`   QR "${qr}" usado por:`)
        estudiantesConEsteQR.forEach(est => {
          console.log(`     - ${est.usuario.apellido}, ${est.usuario.nombre}`)
        })
      })
    }

    console.log('')
    console.log('🎉 VERIFICACIÓN COMPLETADA')
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  verifyQRCodes()
}

export { verifyQRCodes }
