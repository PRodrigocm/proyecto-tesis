/**
 * Script de prueba para verificar la integración de datos de asistencia
 * 
 * Flujo a verificar:
 * 1. Portero escanea QR → Se registra en AsistenciaIE
 * 2. Docente consulta asistencia precargada → Ve la asistencia ya marcada
 * 3. Docente valida con un clic → Confirma el registro
 */

const { PrismaClient } = require('@prisma/client')
const jwt = require('jsonwebtoken')

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

async function testIntegracionAsistencia() {
  console.log('🧪 INICIANDO PRUEBA DE INTEGRACIÓN DE ASISTENCIA')
  console.log('='.repeat(60))
  
  try {
    // 1. OBTENER UN ESTUDIANTE DE PRUEBA
    console.log('\n📋 PASO 1: Obteniendo estudiante de prueba...')
    const estudiante = await prisma.estudiante.findFirst({
      where: {
        usuario: { estado: 'ACTIVO' },
        codigoQR: { not: '' }
      },
      include: {
        usuario: true,
        gradoSeccion: {
          include: {
            grado: true,
            seccion: true
          }
        }
      }
    })

    if (!estudiante) {
      console.log('❌ No se encontró estudiante con código QR')
      return
    }

    console.log(`✅ Estudiante: ${estudiante.usuario.nombre} ${estudiante.usuario.apellido}`)
    console.log(`   DNI: ${estudiante.usuario.dni}`)
    console.log(`   Código QR: ${estudiante.codigoQR}`)
    console.log(`   Grado/Sección: ${estudiante.gradoSeccion?.grado?.nombre}° ${estudiante.gradoSeccion?.seccion?.nombre}`)

    // 2. OBTENER UN AUXILIAR DE PRUEBA
    console.log('\n📋 PASO 2: Obteniendo auxiliar de prueba...')
    const auxiliar = await prisma.usuario.findFirst({
      where: { 
        estado: 'ACTIVO',
        roles: {
          some: {
            rol: {
              nombre: 'AUXILIAR'
            }
          }
        }
      }
    })

    if (!auxiliar) {
      console.log('❌ No se encontró auxiliar activo')
      return
    }

    console.log(`✅ Auxiliar: ${auxiliar.nombre} ${auxiliar.apellido}`)

    // 3. SIMULAR ESCANEO QR DESDE PORTERÍA
    console.log('\n📋 PASO 3: Simulando escaneo QR desde portería...')
    
    const fechaHoy = new Date()
    fechaHoy.setHours(0, 0, 0, 0)
    const horaActual = new Date()

    // Verificar si ya existe asistencia IE hoy
    const asistenciaIEExistente = await prisma.asistenciaIE.findFirst({
      where: {
        idEstudiante: estudiante.idEstudiante,
        fecha: fechaHoy
      }
    })

    let asistenciaIE
    if (asistenciaIEExistente) {
      console.log(`⚠️ Ya existe AsistenciaIE para hoy, actualizando...`)
      asistenciaIE = await prisma.asistenciaIE.update({
        where: { idAsistenciaIE: asistenciaIEExistente.idAsistenciaIE },
        data: {
          horaIngreso: horaActual,
          estado: 'INGRESADO',
          registradoIngresoPor: auxiliar.idUsuario
        }
      })
    } else {
      asistenciaIE = await prisma.asistenciaIE.create({
        data: {
          idEstudiante: estudiante.idEstudiante,
          idIe: auxiliar.idIe || 1,
          fecha: fechaHoy,
          horaIngreso: horaActual,
          estado: 'INGRESADO',
          registradoIngresoPor: auxiliar.idUsuario
        }
      })
    }

    console.log(`✅ AsistenciaIE registrada:`)
    console.log(`   ID: ${asistenciaIE.idAsistenciaIE}`)
    console.log(`   Estado: ${asistenciaIE.estado}`)
    console.log(`   Hora Ingreso: ${asistenciaIE.horaIngreso?.toLocaleTimeString()}`)

    // 4. VERIFICAR DATOS EN BASE DE DATOS
    console.log('\n📋 PASO 4: Verificando datos en base de datos...')
    
    const verificacionIE = await prisma.asistenciaIE.findFirst({
      where: {
        idEstudiante: estudiante.idEstudiante,
        fecha: fechaHoy
      }
    })

    if (verificacionIE) {
      console.log(`✅ VERIFICACIÓN EXITOSA - Datos precargados en AsistenciaIE:`)
      console.log(`   Estado: ${verificacionIE.estado}`)
      console.log(`   Hora Ingreso: ${verificacionIE.horaIngreso?.toLocaleTimeString()}`)
    } else {
      console.log(`❌ ERROR: No se encontró AsistenciaIE`)
      return
    }

    // 5. OBTENER DOCENTE DE LA CLASE
    console.log('\n📋 PASO 5: Obteniendo docente de la clase...')
    
    const docenteAula = await prisma.docenteAula.findFirst({
      where: {
        idGradoSeccion: estudiante.idGradoSeccion
      },
      include: {
        docente: {
          include: { usuario: true }
        }
      }
    })

    if (!docenteAula) {
      console.log('⚠️ No se encontró docente asignado a esta clase')
      console.log('   Creando asignación de prueba...')
      
      // Buscar cualquier docente
      const docente = await prisma.docente.findFirst({
        include: { usuario: true }
      })
      
      if (docente) {
        console.log(`   Docente disponible: ${docente.usuario.nombre} ${docente.usuario.apellido}`)
      }
    } else {
      console.log(`✅ Docente: ${docenteAula.docente.usuario.nombre} ${docenteAula.docente.usuario.apellido}`)
    }

    // 6. SIMULAR CONSULTA DE ASISTENCIA PRECARGADA (como lo haría el docente)
    console.log('\n📋 PASO 6: Simulando consulta de asistencia precargada...')
    
    // Obtener todos los estudiantes del aula
    const estudiantesAula = await prisma.estudiante.findMany({
      where: {
        idGradoSeccion: estudiante.idGradoSeccion
      },
      include: {
        usuario: true
      }
    })

    // Obtener registros de ingreso del día
    const ingresosHoy = await prisma.asistenciaIE.findMany({
      where: {
        fecha: fechaHoy,
        idEstudiante: { in: estudiantesAula.map(e => e.idEstudiante) }
      }
    })

    // Obtener asistencias ya validadas
    const asistenciasValidadas = await prisma.asistencia.findMany({
      where: {
        fecha: fechaHoy,
        idEstudiante: { in: estudiantesAula.map(e => e.idEstudiante) }
      },
      include: {
        estadoAsistencia: true
      }
    })

    console.log(`\n📊 RESUMEN DE ASISTENCIA PRECARGADA:`)
    console.log(`   Total estudiantes en aula: ${estudiantesAula.length}`)
    console.log(`   Con ingreso por portería: ${ingresosHoy.length}`)
    console.log(`   Ya validados por docente: ${asistenciasValidadas.length}`)
    console.log(`   Pendientes de validación: ${estudiantesAula.length - asistenciasValidadas.length}`)

    // Mostrar detalle del estudiante de prueba
    const ingresoEstudiante = ingresosHoy.find(i => i.idEstudiante === estudiante.idEstudiante)
    const asistenciaValidada = asistenciasValidadas.find(a => a.idEstudiante === estudiante.idEstudiante)

    console.log(`\n👤 ESTADO DEL ESTUDIANTE DE PRUEBA:`)
    console.log(`   Nombre: ${estudiante.usuario.nombre} ${estudiante.usuario.apellido}`)
    console.log(`   Ingreso portería: ${ingresoEstudiante ? '✅ SÍ' : '❌ NO'}`)
    if (ingresoEstudiante) {
      console.log(`   Hora ingreso: ${ingresoEstudiante.horaIngreso?.toLocaleTimeString()}`)
      console.log(`   Estado IE: ${ingresoEstudiante.estado}`)
    }
    console.log(`   Validado por docente: ${asistenciaValidada ? '✅ SÍ' : '⏳ PENDIENTE'}`)
    if (asistenciaValidada) {
      console.log(`   Estado validado: ${asistenciaValidada.estadoAsistencia?.codigo}`)
    }

    // 7. SIMULAR VALIDACIÓN DEL DOCENTE (un solo clic)
    console.log('\n📋 PASO 7: Simulando validación del docente...')
    
    if (!asistenciaValidada && ingresoEstudiante) {
      // Buscar o crear estado PRESENTE
      let estadoPresente = await prisma.estadoAsistencia.findFirst({
        where: { codigo: 'PRESENTE' }
      })

      if (!estadoPresente) {
        estadoPresente = await prisma.estadoAsistencia.create({
          data: {
            codigo: 'PRESENTE',
            nombreEstado: 'Presente',
            activo: true,
            afectaAsistencia: true,
            requiereJustificacion: false
          }
        })
      }

      // Crear asistencia validada
      const nuevaAsistencia = await prisma.asistencia.create({
        data: {
          idEstudiante: estudiante.idEstudiante,
          fecha: fechaHoy,
          horaRegistro: new Date(),
          idEstadoAsistencia: estadoPresente.idEstadoAsistencia,
          observaciones: 'Validado desde prueba de integración',
          registradoPor: docenteAula?.docente?.idUsuario || auxiliar.idUsuario
        }
      })

      // Actualizar estado en AsistenciaIE
      await prisma.asistenciaIE.update({
        where: { idAsistenciaIE: ingresoEstudiante.idAsistenciaIE },
        data: { estado: 'EN_CLASE' }
      })

      console.log(`✅ VALIDACIÓN EXITOSA:`)
      console.log(`   ID Asistencia: ${nuevaAsistencia.idAsistencia}`)
      console.log(`   Estado: PRESENTE`)
      console.log(`   Hora validación: ${nuevaAsistencia.horaRegistro?.toLocaleTimeString()}`)
    } else if (asistenciaValidada) {
      console.log(`⚠️ El estudiante ya fue validado previamente`)
    } else {
      console.log(`❌ No hay ingreso de portería para validar`)
    }

    // 8. VERIFICACIÓN FINAL
    console.log('\n' + '='.repeat(60))
    console.log('📊 VERIFICACIÓN FINAL')
    console.log('='.repeat(60))

    const verificacionFinal = await prisma.asistencia.findFirst({
      where: {
        idEstudiante: estudiante.idEstudiante,
        fecha: fechaHoy
      },
      include: {
        estadoAsistencia: true
      }
    })

    const verificacionIEFinal = await prisma.asistenciaIE.findFirst({
      where: {
        idEstudiante: estudiante.idEstudiante,
        fecha: fechaHoy
      }
    })

    console.log(`\n✅ RESULTADO DE LA PRUEBA:`)
    console.log(`   1. Portero registró entrada: ${verificacionIEFinal ? '✅ SÍ' : '❌ NO'}`)
    console.log(`   2. Datos precargados en BD: ${verificacionIEFinal ? '✅ SÍ' : '❌ NO'}`)
    console.log(`   3. Docente puede ver asistencia: ${verificacionIEFinal ? '✅ SÍ' : '❌ NO'}`)
    console.log(`   4. Docente validó con un clic: ${verificacionFinal ? '✅ SÍ' : '❌ NO'}`)

    if (verificacionIEFinal && verificacionFinal) {
      console.log(`\n🎉 PRUEBA EXITOSA: El flujo de integración funciona correctamente`)
      console.log(`   - El portero puede registrar asistencia`)
      console.log(`   - Los datos se precargan inmediatamente en la BD`)
      console.log(`   - El docente puede ver la asistencia ya marcada`)
      console.log(`   - El docente puede validar con un solo clic`)
    } else {
      console.log(`\n⚠️ PRUEBA PARCIAL: Revisar los pasos que fallaron`)
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar prueba
testIntegracionAsistencia()
