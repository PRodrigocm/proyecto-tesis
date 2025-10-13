import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Inicializando datos básicos para retiros...')

  // Crear estados de retiro
  const estadosRetiro = [
    { codigo: 'SOLICITADO', nombre: 'Solicitado', orden: 1, esFinal: false },
    { codigo: 'EN_REVISION', nombre: 'En Revisión', orden: 2, esFinal: false },
    { codigo: 'APROBADO', nombre: 'Aprobado', orden: 3, esFinal: false },
    { codigo: 'RECHAZADO', nombre: 'Rechazado', orden: 4, esFinal: true },
    { codigo: 'EN_PROCESO', nombre: 'En Proceso', orden: 5, esFinal: false },
    { codigo: 'COMPLETADO', nombre: 'Completado', orden: 6, esFinal: true },
    { codigo: 'CANCELADO', nombre: 'Cancelado', orden: 7, esFinal: true }
  ]

  for (const estado of estadosRetiro) {
    await prisma.estadoRetiro.upsert({
      where: { codigo: estado.codigo },
      update: {
        nombre: estado.nombre,
        orden: estado.orden,
        esFinal: estado.esFinal
      },
      create: estado
    })
    console.log(`✓ Estado de retiro creado/actualizado: ${estado.nombre}`)
  }

  // Crear tipos de retiro
  const tiposRetiro = [
    { nombre: 'Retiro Médico' },
    { nombre: 'Retiro Familiar' },
    { nombre: 'Retiro Personal' },
    { nombre: 'Retiro de Emergencia' },
    { nombre: 'Cita Médica' },
    { nombre: 'Trámite Personal' },
    { nombre: 'Otro' }
  ]

  for (const tipo of tiposRetiro) {
    await prisma.tipoRetiro.upsert({
      where: { nombre: tipo.nombre },
      update: {},
      create: tipo
    })
    console.log(`✓ Tipo de retiro creado/actualizado: ${tipo.nombre}`)
  }

  // Crear estados de asistencia si no existen
  const estadosAsistencia = [
    { nombreEstado: 'Presente', codigo: 'PRESENTE', requiereJustificacion: false, afectaAsistencia: true },
    { nombreEstado: 'Tardanza', codigo: 'TARDANZA', requiereJustificacion: false, afectaAsistencia: true },
    { nombreEstado: 'Inasistencia', codigo: 'INASISTENCIA', requiereJustificacion: true, afectaAsistencia: false },
    { nombreEstado: 'Justificada', codigo: 'JUSTIFICADA', requiereJustificacion: false, afectaAsistencia: true },
    { nombreEstado: 'Excusada', codigo: 'EXCUSADA', requiereJustificacion: false, afectaAsistencia: true }
  ]

  for (const estado of estadosAsistencia) {
    await prisma.estadoAsistencia.upsert({
      where: { codigo: estado.codigo },
      update: {
        nombreEstado: estado.nombreEstado,
        requiereJustificacion: estado.requiereJustificacion,
        afectaAsistencia: estado.afectaAsistencia
      },
      create: estado
    })
    console.log(`✓ Estado de asistencia creado/actualizado: ${estado.nombreEstado}`)
  }

  // Crear tipos de justificación
  const tiposJustificacion = [
    { nombre: 'Médica', codigo: 'MEDICA', requiereDocumento: true, diasMaximos: 3 },
    { nombre: 'Familiar', codigo: 'FAMILIAR', requiereDocumento: false, diasMaximos: 2 },
    { nombre: 'Personal', codigo: 'PERSONAL', requiereDocumento: false, diasMaximos: 1 },
    { nombre: 'Académica', codigo: 'ACADEMICA', requiereDocumento: true, diasMaximos: 5 },
    { nombre: 'Otra', codigo: 'OTRO', requiereDocumento: false, diasMaximos: 1 }
  ]

  for (const tipo of tiposJustificacion) {
    await prisma.tipoJustificacion.upsert({
      where: { codigo: tipo.codigo },
      update: {
        nombre: tipo.nombre,
        requiereDocumento: tipo.requiereDocumento,
        diasMaximos: tipo.diasMaximos
      },
      create: tipo
    })
    console.log(`✓ Tipo de justificación creado/actualizado: ${tipo.nombre}`)
  }

  // Crear estados de justificación
  const estadosJustificacion = [
    { nombre: 'Pendiente', codigo: 'PENDIENTE', esFinal: false },
    { nombre: 'Aprobada', codigo: 'APROBADA', esFinal: true },
    { nombre: 'Rechazada', codigo: 'RECHAZADA', esFinal: true },
    { nombre: 'Vencida', codigo: 'VENCIDA', esFinal: true },
    { nombre: 'Requiere Documentos', codigo: 'REQUIERE_DOCS', esFinal: false }
  ]

  for (const estado of estadosJustificacion) {
    await prisma.estadoJustificacion.upsert({
      where: { codigo: estado.codigo },
      update: {
        nombre: estado.nombre,
        esFinal: estado.esFinal
      },
      create: estado
    })
    console.log(`✓ Estado de justificación creado/actualizado: ${estado.nombre}`)
  }

  console.log('✅ Inicialización completada exitosamente!')
}

main()
  .catch((e) => {
    console.error('❌ Error durante la inicialización:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
