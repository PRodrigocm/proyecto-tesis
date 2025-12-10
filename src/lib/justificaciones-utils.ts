import { prisma } from './prisma'

/**
 * Inicializa los estados de justificación en la base de datos
 */
export async function inicializarEstadosJustificacion() {
  console.log('🔧 Inicializando estados de justificación...')
  
  // Primero, desactivar estados duplicados o incorrectos
  const estadosIncorrectos = ['APROBADA', 'RECHAZADA', 'REQUIERE_DOCUMENTACION']
  for (const codigo of estadosIncorrectos) {
    await prisma.estadoJustificacion.updateMany({
      where: { codigo },
      data: { activo: false }
    })
    console.log(`⚠️ Estado "${codigo}" desactivado (incorrecto)`)
  }
  
  const estadosBasicos = [
    { codigo: 'PENDIENTE', nombre: 'Pendiente', activo: true },
    { codigo: 'EN_REVISION', nombre: 'En Revisión', activo: true },
    { codigo: 'APROBADO', nombre: 'Aprobado', activo: true },
    { codigo: 'RECHAZADO', nombre: 'Rechazado', activo: true }
  ]

  for (const estado of estadosBasicos) {
    try {
      const estadoExistente = await prisma.estadoJustificacion.findFirst({
        where: { codigo: estado.codigo }
      })

      if (!estadoExistente) {
        await prisma.estadoJustificacion.create({
          data: estado
        })
        console.log(`✅ Estado creado: ${estado.nombre} (${estado.codigo})`)
      } else {
        // Actualizar si existe pero está inactivo
        if (!estadoExistente.activo) {
          await prisma.estadoJustificacion.update({
            where: { idEstadoJustificacion: estadoExistente.idEstadoJustificacion },
            data: { activo: true }
          })
          console.log(`✅ Estado activado: ${estado.nombre} (${estado.codigo})`)
        } else {
          console.log(`ℹ️ Estado ya existe: ${estado.nombre} (${estado.codigo})`)
        }
      }
    } catch (error) {
      console.error(`❌ Error al crear estado ${estado.codigo}:`, error)
    }
  }

  console.log('✅ Inicialización de estados completada')
}

/**
 * Inicializa los tipos de justificación en la base de datos
 */
export async function inicializarTiposJustificacion() {
  console.log('🔧 Inicializando tipos de justificación...')
  
  const tiposBasicos = [
    { codigo: 'MEDICA', nombre: 'Médica', activo: true },
    { codigo: 'FAMILIAR', nombre: 'Familiar', activo: true },
    { codigo: 'PERSONAL', nombre: 'Personal', activo: true },
    { codigo: 'OTRO', nombre: 'Otro', activo: true }
  ]

  for (const tipo of tiposBasicos) {
    try {
      const tipoExistente = await prisma.tipoJustificacion.findFirst({
        where: { codigo: tipo.codigo }
      })

      if (!tipoExistente) {
        await prisma.tipoJustificacion.create({
          data: tipo
        })
        console.log(`✅ Tipo creado: ${tipo.nombre} (${tipo.codigo})`)
      } else {
        console.log(`ℹ️ Tipo ya existe: ${tipo.nombre} (${tipo.codigo})`)
      }
    } catch (error) {
      console.error(`❌ Error al crear tipo ${tipo.codigo}:`, error)
    }
  }

  console.log('✅ Inicialización de tipos completada')
}
