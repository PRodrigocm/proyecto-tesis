import { prisma } from '@/lib/prisma'

/**
 * Obtiene los IDs de estudiantes asociados a un apoderado
 */
export async function getEstudiantesDelApoderado(idApoderado: number): Promise<number[]> {
  const estudiantesApoderado = await prisma.estudianteApoderado.findMany({
    where: {
      idApoderado
    },
    select: {
      estudiante: {
        select: {
          idEstudiante: true
        }
      }
    }
  })

  return estudiantesApoderado.map(ea => ea.estudiante.idEstudiante)
}

/**
 * Obtiene los IDs de estados de retiro por códigos
 */
export async function getEstadosRetiroIds(codigos: string[]): Promise<number[]> {
  const estados = await prisma.estadoRetiro.findMany({
    where: {
      codigo: {
        in: codigos
      }
    },
    select: {
      idEstadoRetiro: true
    }
  })

  return estados.map(e => e.idEstadoRetiro)
}

/**
 * Verifica si un apoderado puede gestionar un estudiante específico
 * @param idUsuario - ID del usuario (no del apoderado)
 * @param idEstudiante - ID del estudiante
 */
export async function puedeGestionarEstudiante(idUsuario: number, idEstudiante: number): Promise<boolean> {
  // Primero buscar el apoderado por el idUsuario
  const apoderado = await prisma.apoderado.findFirst({
    where: { idUsuario: idUsuario }
  })

  if (!apoderado) {
    console.log(`⚠️ No se encontró apoderado para usuario ${idUsuario}`)
    return false
  }

  const relacion = await prisma.estudianteApoderado.findFirst({
    where: {
      idApoderado: apoderado.idApoderado,
      idEstudiante
    }
  })

  console.log(`🔍 Verificando permisos: usuario=${idUsuario}, apoderado=${apoderado.idApoderado}, estudiante=${idEstudiante}, tiene_relacion=${relacion !== null}`)

  return relacion !== null
}

/**
 * Inicializa estados de retiro básicos si no existen
 */
export async function inicializarEstadosRetiro() {
  const estadosBasicos = [
    { codigo: 'PENDIENTE', nombre: 'Pendiente', orden: 1 },
    { codigo: 'AUTORIZADO', nombre: 'Autorizado', orden: 2, esFinal: true },
    { codigo: 'RECHAZADO', nombre: 'Rechazado', orden: 3, esFinal: true }
  ]

  for (const estado of estadosBasicos) {
    await prisma.estadoRetiro.upsert({
      where: { codigo: estado.codigo },
      update: {},
      create: estado
    })
  }
}

/**
 * Inicializa tipos de retiro básicos si no existen
 */
export async function inicializarTiposRetiro() {
  const tiposBasicos = [
    { nombre: 'Cita médica' },
    { nombre: 'Emergencia familiar' },
    { nombre: 'Malestar del estudiante' },
    { nombre: 'Retiro temprano autorizado' },
    { nombre: 'Otro' }
  ]

  for (const tipo of tiposBasicos) {
    await prisma.tipoRetiro.upsert({
      where: { nombre: tipo.nombre },
      update: {},
      create: tipo
    })
  }
}
