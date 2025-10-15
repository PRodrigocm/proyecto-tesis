import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface CrearNotificacionData {
  idUsuario: number
  titulo: string
  mensaje: string
  tipo: TipoNotificacion
  origen?: string
}

export type TipoNotificacion = 
  | 'INFO' 
  | 'ALERTA' 
  | 'JUSTIFICACION' 
  | 'RETIRO' 
  | 'ASISTENCIA' 
  | 'SISTEMA'
  | 'RECORDATORIO'

/**
 * Crea una nueva notificación para un usuario
 */
export async function crearNotificacion(data: CrearNotificacionData) {
  try {
    const notificacion = await prisma.notificacion.create({
      data: {
        idUsuario: data.idUsuario,
        titulo: data.titulo,
        mensaje: data.mensaje,
        tipo: data.tipo,
        origen: data.origen || 'Sistema'
      }
    })
    
    return notificacion
  } catch (error) {
    console.error('Error al crear notificación:', error)
    throw error
  }
}

/**
 * Crea notificaciones para múltiples usuarios
 */
export async function crearNotificacionMasiva(
  usuarioIds: number[], 
  data: Omit<CrearNotificacionData, 'idUsuario'>
) {
  try {
    const notificaciones = await prisma.notificacion.createMany({
      data: usuarioIds.map(idUsuario => ({
        idUsuario,
        titulo: data.titulo,
        mensaje: data.mensaje,
        tipo: data.tipo,
        origen: data.origen || 'Sistema'
      }))
    })
    
    return notificaciones
  } catch (error) {
    console.error('Error al crear notificaciones masivas:', error)
    throw error
  }
}

/**
 * Obtiene las notificaciones de un usuario
 */
export async function obtenerNotificacionesUsuario(
  idUsuario: number, 
  opciones?: {
    soloNoLeidas?: boolean
    limite?: number
    tipo?: TipoNotificacion
  }
) {
  try {
    const where: any = { idUsuario }
    
    if (opciones?.soloNoLeidas) {
      where.leida = false
    }
    
    if (opciones?.tipo) {
      where.tipo = opciones.tipo
    }
    
    const notificaciones = await prisma.notificacion.findMany({
      where,
      orderBy: {
        fechaEnvio: 'desc'
      },
      take: opciones?.limite || undefined
    })
    
    return notificaciones
  } catch (error) {
    console.error('Error al obtener notificaciones:', error)
    throw error
  }
}

/**
 * Marca una notificación como leída
 */
export async function marcarComoLeida(idNotificacion: number) {
  try {
    const notificacion = await prisma.notificacion.update({
      where: { idNotificacion },
      data: {
        leida: true,
        fechaLectura: new Date()
      }
    })
    
    return notificacion
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error)
    throw error
  }
}

/**
 * Marca todas las notificaciones de un usuario como leídas
 */
export async function marcarTodasComoLeidas(idUsuario: number) {
  try {
    const resultado = await prisma.notificacion.updateMany({
      where: {
        idUsuario,
        leida: false
      },
      data: {
        leida: true,
        fechaLectura: new Date()
      }
    })
    
    return resultado
  } catch (error) {
    console.error('Error al marcar todas las notificaciones como leídas:', error)
    throw error
  }
}

/**
 * Cuenta las notificaciones no leídas de un usuario
 */
export async function contarNotificacionesNoLeidas(idUsuario: number) {
  try {
    const count = await prisma.notificacion.count({
      where: {
        idUsuario,
        leida: false
      }
    })
    
    return count
  } catch (error) {
    console.error('Error al contar notificaciones no leídas:', error)
    throw error
  }
}

/**
 * Elimina notificaciones antiguas (más de X días)
 */
export async function limpiarNotificacionesAntiguas(diasAntiguedad: number = 30) {
  try {
    const fechaLimite = new Date()
    fechaLimite.setDate(fechaLimite.getDate() - diasAntiguedad)
    
    const resultado = await prisma.notificacion.deleteMany({
      where: {
        fechaEnvio: {
          lt: fechaLimite
        },
        leida: true
      }
    })
    
    return resultado
  } catch (error) {
    console.error('Error al limpiar notificaciones antiguas:', error)
    throw error
  }
}

/**
 * Notificaciones específicas para el módulo de retiros
 */
export const notificacionesRetiro = {
  /**
   * Notifica cuando se solicita un retiro
   */
  async solicitudCreada(idUsuario: number, nombreEstudiante: string, fecha: string) {
    return crearNotificacion({
      idUsuario,
      titulo: 'Solicitud de Retiro Creada',
      mensaje: `Se ha creado una solicitud de retiro para ${nombreEstudiante} el día ${fecha}.`,
      tipo: 'RETIRO',
      origen: 'Módulo de Retiros'
    })
  },

  /**
   * Notifica cuando se aprueba un retiro
   */
  async retiroAprobado(idUsuario: number, nombreEstudiante: string, fecha: string) {
    return crearNotificacion({
      idUsuario,
      titulo: 'Retiro Aprobado',
      mensaje: `El retiro de ${nombreEstudiante} para el día ${fecha} ha sido aprobado.`,
      tipo: 'RETIRO',
      origen: 'Módulo de Retiros'
    })
  },

  /**
   * Notifica cuando se rechaza un retiro
   */
  async retiroRechazado(idUsuario: number, nombreEstudiante: string, fecha: string, motivo?: string) {
    const mensajeMotivo = motivo ? ` Motivo: ${motivo}` : ''
    return crearNotificacion({
      idUsuario,
      titulo: 'Retiro Rechazado',
      mensaje: `El retiro de ${nombreEstudiante} para el día ${fecha} ha sido rechazado.${mensajeMotivo}`,
      tipo: 'ALERTA',
      origen: 'Módulo de Retiros'
    })
  }
}

/**
 * Notificaciones específicas para el módulo de asistencias
 */
export const notificacionesAsistencia = {
  /**
   * Notifica sobre inasistencias
   */
  async inasistenciaRegistrada(idUsuario: number, nombreEstudiante: string, fecha: string) {
    return crearNotificacion({
      idUsuario,
      titulo: 'Inasistencia Registrada',
      mensaje: `Se ha registrado una inasistencia de ${nombreEstudiante} el día ${fecha}.`,
      tipo: 'ASISTENCIA',
      origen: 'Módulo de Asistencias'
    })
  },

  /**
   * Notifica sobre tardanzas
   */
  async tardanzaRegistrada(idUsuario: number, nombreEstudiante: string, fecha: string, hora: string) {
    return crearNotificacion({
      idUsuario,
      titulo: 'Tardanza Registrada',
      mensaje: `Se ha registrado una tardanza de ${nombreEstudiante} el día ${fecha} a las ${hora}.`,
      tipo: 'ASISTENCIA',
      origen: 'Módulo de Asistencias'
    })
  }
}

/**
 * Notificaciones específicas para el módulo de justificaciones
 */
export const notificacionesJustificacion = {
  /**
   * Notifica cuando se presenta una justificación
   */
  async justificacionPresentada(idUsuario: number, nombreEstudiante: string, fechas: string) {
    return crearNotificacion({
      idUsuario,
      titulo: 'Justificación Presentada',
      mensaje: `Se ha presentado una justificación para ${nombreEstudiante} por las fechas: ${fechas}.`,
      tipo: 'JUSTIFICACION',
      origen: 'Módulo de Justificaciones'
    })
  },

  /**
   * Notifica cuando se aprueba una justificación
   */
  async justificacionAprobada(idUsuario: number, nombreEstudiante: string, fechas: string) {
    return crearNotificacion({
      idUsuario,
      titulo: 'Justificación Aprobada',
      mensaje: `La justificación de ${nombreEstudiante} para las fechas ${fechas} ha sido aprobada.`,
      tipo: 'JUSTIFICACION',
      origen: 'Módulo de Justificaciones'
    })
  },

  /**
   * Notifica cuando se rechaza una justificación
   */
  async justificacionRechazada(idUsuario: number, nombreEstudiante: string, fechas: string, motivo?: string) {
    const mensajeMotivo = motivo ? ` Motivo: ${motivo}` : ''
    return crearNotificacion({
      idUsuario,
      titulo: 'Justificación Rechazada',
      mensaje: `La justificación de ${nombreEstudiante} para las fechas ${fechas} ha sido rechazada.${mensajeMotivo}`,
      tipo: 'ALERTA',
      origen: 'Módulo de Justificaciones'
    })
  }
}
