import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function initJustificaciones() {
  try {
    console.log('🚀 Inicializando datos de justificaciones...')

    // Actualizar estados de asistencia existentes
    await prisma.estadoAsistencia.updateMany({
      where: { nombreEstado: 'Presente' },
      data: {
        codigo: 'PRESENTE',
        requiereJustificacion: false,
        afectaAsistencia: true
      }
    })

    await prisma.estadoAsistencia.updateMany({
      where: { nombreEstado: 'Tardanza' },
      data: {
        codigo: 'TARDANZA',
        requiereJustificacion: false,
        afectaAsistencia: true
      }
    })

    // Crear nuevos estados de asistencia
    const nuevosEstados = [
      {
        nombreEstado: 'Inasistencia',
        codigo: 'INASISTENCIA',
        requiereJustificacion: true,
        afectaAsistencia: false,
        activo: true
      },
      {
        nombreEstado: 'Justificada',
        codigo: 'JUSTIFICADA',
        requiereJustificacion: false,
        afectaAsistencia: true,
        activo: true
      },
      {
        nombreEstado: 'Falta Médica',
        codigo: 'FALTA_MEDICA',
        requiereJustificacion: false,
        afectaAsistencia: true,
        activo: true
      },
      {
        nombreEstado: 'Permiso Especial',
        codigo: 'PERMISO_ESPECIAL',
        requiereJustificacion: false,
        afectaAsistencia: true,
        activo: true
      }
    ]

    for (const estado of nuevosEstados) {
      await prisma.estadoAsistencia.upsert({
        where: { nombreEstado: estado.nombreEstado },
        update: estado,
        create: estado
      })
    }

    // Crear tipos de justificación
    const tiposJustificacion = [
      {
        nombre: 'Justificación Médica',
        codigo: 'MEDICA',
        requiereDocumento: true,
        diasMaximos: 3,
        activo: true
      },
      {
        nombre: 'Asunto Familiar',
        codigo: 'FAMILIAR',
        requiereDocumento: false,
        diasMaximos: 1,
        activo: true
      },
      {
        nombre: 'Asunto Personal',
        codigo: 'PERSONAL',
        requiereDocumento: false,
        diasMaximos: 1,
        activo: true
      },
      {
        nombre: 'Actividad Académica',
        codigo: 'ACADEMICA',
        requiereDocumento: true,
        diasMaximos: 5,
        activo: true
      },
      {
        nombre: 'Emergencia',
        codigo: 'EMERGENCIA',
        requiereDocumento: false,
        diasMaximos: 7,
        activo: true
      },
      {
        nombre: 'Otro',
        codigo: 'OTRO',
        requiereDocumento: false,
        diasMaximos: 2,
        activo: true
      }
    ]

    for (const tipo of tiposJustificacion) {
      await prisma.tipoJustificacion.upsert({
        where: { nombre: tipo.nombre },
        update: tipo,
        create: tipo
      })
    }

    // Crear estados de justificación
    const estadosJustificacion = [
      {
        nombre: 'Pendiente de Revisión',
        codigo: 'PENDIENTE',
        esFinal: false,
        activo: true
      },
      {
        nombre: 'Aprobada',
        codigo: 'APROBADA',
        esFinal: true,
        activo: true
      },
      {
        nombre: 'Rechazada',
        codigo: 'RECHAZADA',
        esFinal: true,
        activo: true
      },
      {
        nombre: 'Requiere Documentación',
        codigo: 'REQUIERE_DOC',
        esFinal: false,
        activo: true
      },
      {
        nombre: 'Vencida',
        codigo: 'VENCIDA',
        esFinal: true,
        activo: true
      },
      {
        nombre: 'En Revisión',
        codigo: 'EN_REVISION',
        esFinal: false,
        activo: true
      }
    ]

    for (const estado of estadosJustificacion) {
      await prisma.estadoJustificacion.upsert({
        where: { nombre: estado.nombre },
        update: estado,
        create: estado
      })
    }

    console.log('✅ Datos de justificaciones inicializados correctamente')

    // Mostrar resumen
    const countEstados = await prisma.estadoAsistencia.count()
    const countTipos = await prisma.tipoJustificacion.count()
    const countEstadosJust = await prisma.estadoJustificacion.count()

    console.log(`📊 Resumen:`)
    console.log(`   - Estados de asistencia: ${countEstados}`)
    console.log(`   - Tipos de justificación: ${countTipos}`)
    console.log(`   - Estados de justificación: ${countEstadosJust}`)

  } catch (error) {
    console.error('❌ Error inicializando datos:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

initJustificaciones()
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })
