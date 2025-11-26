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
 */
export async function puedeGestionarEstudiante(idApoderado: number, idEstudiante: number): Promise<boolean> {
  const relacion = await prisma.estudianteApoderado.findFirst({
    where: {
      idApoderado,
      idEstudiante
    }
  })

  return relacion !== null
}

/**
 * Inicializa estados de retiro básicos si no existen
 */
export async function inicializarEstadosRetiro() {
  const estadosBasicos = [
    { codigo: 'SOLICITADO', nombre: 'Solicitado', orden: 1 },
    { codigo: 'EN_REVISION', nombre: 'En Revisión', orden: 2 },
    { codigo: 'APROBADO', nombre: 'Aprobado', orden: 3 },
    { codigo: 'RECHAZADO', nombre: 'Rechazado', orden: 4, esFinal: true },
    { codigo: 'EN_PROCESO', nombre: 'En Proceso', orden: 5 },
    { codigo: 'COMPLETADO', nombre: 'Completado', orden: 6, esFinal: true },
    { codigo: 'CANCELADO', nombre: 'Cancelado', orden: 7, esFinal: true }
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
    { nombre: 'Retiro Médico' },
    { nombre: 'Retiro Familiar' },
    { nombre: 'Retiro Personal' },
    { nombre: 'Retiro de Emergencia' },
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
