import { prisma } from '@/lib/prisma'
import { enviarEmail } from '@/lib/notifications'
import { notificacionesRetiro } from '@/lib/notificaciones-utils'

interface RetiroNotificationData {
  retiroId: number
  estudianteNombre: string
  estudianteApellido: string
  estudianteDNI: string
  grado: string
  seccion: string
  fecha: string
  horaRetiro: string
  motivo: string
  observaciones?: string
  personaRecoge?: string
  ieId: number
}

interface CreadorInfo {
  id: number
  nombre: string
  apellido: string
  rol: string
  email?: string
}

/**
 * Genera el contenido HTML del email para notificación de retiro
 */
function generarEmailRetiroHTML(data: RetiroNotificationData, accion: 'solicitud' | 'aprobado' | 'rechazado', info: {
  titulo: string
  mensaje: string
  color: string
  emoji: string
}): string {
  const fechaFormateada = new Date(data.fecha).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, ${info.color} 0%, #6366f1 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid ${info.color}; }
        .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .label { font-weight: bold; color: ${info.color}; }
        .value { color: #333; }
        .estado-badge { display: inline-block; padding: 12px 24px; border-radius: 25px; font-weight: bold; margin: 15px 0; background: ${info.color}20; color: ${info.color}; font-size: 16px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        .icon { font-size: 48px; margin-bottom: 10px; }
        .action-btn { display: inline-block; padding: 12px 24px; background: ${info.color}; color: white; text-decoration: none; border-radius: 8px; margin: 10px 5px; font-weight: bold; }
        .alerta { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 0 8px 8px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="icon">${info.emoji}</div>
          <h1>${info.titulo}</h1>
          <p>Sistema de Control Escolar</p>
        </div>
        
        <div class="content">
          <p style="font-size: 16px;">${info.mensaje}</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <span class="estado-badge">${info.emoji} ${accion === 'solicitud' ? 'PENDIENTE DE APROBACIÓN' : accion === 'aprobado' ? 'APROBADO' : 'RECHAZADO'}</span>
          </div>

          <div class="info-box">
            <h3>👤 Información del Estudiante</h3>
            <div class="info-row">
              <span class="label">Nombre:</span>
              <span class="value">${data.estudianteNombre} ${data.estudianteApellido}</span>
            </div>
            <div class="info-row">
              <span class="label">DNI:</span>
              <span class="value">${data.estudianteDNI}</span>
            </div>
            <div class="info-row">
              <span class="label">Grado y Sección:</span>
              <span class="value">${data.grado}° ${data.seccion}</span>
            </div>
          </div>

          <div class="info-box">
            <h3>🚪 Detalles del Retiro</h3>
            <div class="info-row">
              <span class="label">Fecha:</span>
              <span class="value">${fechaFormateada}</span>
            </div>
            <div class="info-row">
              <span class="label">Hora de Retiro:</span>
              <span class="value">${data.horaRetiro}</span>
            </div>
            <div class="info-row">
              <span class="label">Motivo:</span>
              <span class="value">${data.motivo}</span>
            </div>
            ${data.personaRecoge ? `
            <div class="info-row">
              <span class="label">Persona que Recoge:</span>
              <span class="value">${data.personaRecoge}</span>
            </div>
            ` : ''}
            ${data.observaciones ? `
            <div class="info-row">
              <span class="label">Observaciones:</span>
              <span class="value">${data.observaciones}</span>
            </div>
            ` : ''}
          </div>

          ${accion === 'solicitud' ? `
          <div class="alerta">
            <strong>⚠️ Acción Requerida:</strong> Por favor, ingrese al sistema para aprobar o rechazar esta solicitud de retiro.
          </div>
          ` : ''}
        </div>

        <div class="footer">
          <p>Este es un mensaje automático del Sistema de Control Escolar.</p>
          <p>Por favor, no responda a este correo.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Notifica a docentes y administradores cuando un apoderado crea un retiro
 */
export async function notificarRetiroCreadoPorApoderado(
  data: RetiroNotificationData,
  apoderado: CreadorInfo
): Promise<{ notificacionesEnviadas: number; emailsEnviados: number }> {
  let notificacionesEnviadas = 0
  let emailsEnviados = 0

  const fechaFormateada = new Date(data.fecha).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  const nombreCompleto = `${data.estudianteNombre} ${data.estudianteApellido}`
  const apoderadoNombre = `${apoderado.nombre} ${apoderado.apellido}`

  try {
    // Obtener el docente tutor del aula del estudiante
    const estudiante = await prisma.estudiante.findFirst({
      where: { 
        usuario: { 
          nombre: data.estudianteNombre,
          apellido: data.estudianteApellido 
        }
      },
      include: {
        gradoSeccion: true
      }
    })

    // Buscar docentes de la IE para notificar
    const docentes = await prisma.docente.findMany({
      where: {
        usuario: {
          idIe: data.ieId
        }
      },
      include: {
        usuario: true
      },
      take: 5 // Limitar a 5 docentes
    })

    // Notificar a los docentes
    for (const docente of docentes) {
      if (docente.usuario) {
        // Notificación in-app
        await notificacionesRetiro.requiereAprobacionDocente(
          docente.usuario.idUsuario,
          nombreCompleto,
          fechaFormateada,
          apoderadoNombre
        )
        notificacionesEnviadas++

        // Email
        if (docente.usuario.email) {
          const emailEnviado = await enviarEmail(
            docente.usuario.email,
            `🚪 Solicitud de Retiro - ${nombreCompleto}`,
            generarEmailRetiroHTML(data, 'solicitud', {
              titulo: 'Nueva Solicitud de Retiro',
              mensaje: `El apoderado ${apoderadoNombre} ha solicitado un retiro para el estudiante ${nombreCompleto}. Requiere su autorización.`,
              color: '#f59e0b',
              emoji: '🚪'
            })
          )
          if (emailEnviado) emailsEnviados++
        }
      }
    }

    // Notificar a todos los administradores de la IE
    const rolAdmin = await prisma.rol.findFirst({ where: { nombre: 'ADMINISTRATIVO' } })
    const administradores = rolAdmin ? await prisma.usuarioRol.findMany({
      where: {
        idRol: rolAdmin.idRol,
        usuario: {
          idIe: data.ieId
        }
      },
      include: {
        usuario: true
      }
    }) : []

    for (const adminRel of administradores) {
      // Notificación in-app
      await notificacionesRetiro.requiereAprobacionDocente(
        adminRel.usuario.idUsuario,
        nombreCompleto,
        fechaFormateada,
        apoderadoNombre
      )
      notificacionesEnviadas++

      // Email
      if (adminRel.usuario.email) {
        const emailEnviado = await enviarEmail(
          adminRel.usuario.email,
          `🚪 Solicitud de Retiro - ${nombreCompleto}`,
          generarEmailRetiroHTML(data, 'solicitud', {
            titulo: 'Nueva Solicitud de Retiro',
            mensaje: `El apoderado ${apoderadoNombre} ha solicitado un retiro para el estudiante ${nombreCompleto}. Requiere su autorización.`,
            color: '#f59e0b',
            emoji: '🚪'
          })
        )
        if (emailEnviado) emailsEnviados++
      }
    }

    console.log(`✅ Retiro creado por apoderado: ${notificacionesEnviadas} notificaciones, ${emailsEnviados} emails`)
  } catch (error) {
    console.error('Error notificando retiro creado por apoderado:', error)
  }

  return { notificacionesEnviadas, emailsEnviados }
}

/**
 * Notifica al apoderado y administradores cuando un docente crea un retiro
 */
export async function notificarRetiroCreadoPorDocente(
  data: RetiroNotificationData,
  docente: CreadorInfo,
  apoderadoId?: number
): Promise<{ notificacionesEnviadas: number; emailsEnviados: number }> {
  let notificacionesEnviadas = 0
  let emailsEnviados = 0

  const fechaFormateada = new Date(data.fecha).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  const nombreCompleto = `${data.estudianteNombre} ${data.estudianteApellido}`
  const docenteNombre = `${docente.nombre} ${docente.apellido}`

  try {
    // Obtener apoderados del estudiante
    const estudiante = await prisma.estudiante.findFirst({
      where: { 
        usuario: { 
          nombre: data.estudianteNombre,
          apellido: data.estudianteApellido 
        }
      },
      include: {
        apoderados: {
          include: {
            apoderado: {
              include: { usuario: true }
            }
          }
        }
      }
    })

    // Notificar a todos los apoderados del estudiante
    if (estudiante?.apoderados) {
      for (const relacion of estudiante.apoderados) {
        const apoderado = relacion.apoderado.usuario
        
        // Notificación in-app
        await notificacionesRetiro.requiereAprobacionApoderado(
          apoderado.idUsuario,
          nombreCompleto,
          fechaFormateada,
          docenteNombre
        )
        notificacionesEnviadas++

        // Email
        if (apoderado.email) {
          const emailEnviado = await enviarEmail(
            apoderado.email,
            `⚠️ Solicitud de Retiro para ${nombreCompleto}`,
            generarEmailRetiroHTML(data, 'solicitud', {
              titulo: 'Solicitud de Retiro Pendiente',
              mensaje: `El docente ${docenteNombre} ha solicitado un retiro para su hijo/a ${nombreCompleto}. Por favor, ingrese al sistema para aprobar o rechazar esta solicitud.`,
              color: '#f59e0b',
              emoji: '⚠️'
            })
          )
          if (emailEnviado) emailsEnviados++
        }
      }
    }

    // Notificar a todos los administradores de la IE
    const rolAdmin2 = await prisma.rol.findFirst({ where: { nombre: 'ADMINISTRATIVO' } })
    const administradores2 = rolAdmin2 ? await prisma.usuarioRol.findMany({
      where: {
        idRol: rolAdmin2.idRol,
        usuario: {
          idIe: data.ieId
        }
      },
      include: {
        usuario: true
      }
    }) : []

    for (const adminRel of administradores2) {
      // Notificación in-app
      await notificacionesRetiro.solicitudCreada(
        adminRel.usuario.idUsuario,
        nombreCompleto,
        fechaFormateada,
        docenteNombre
      )
      notificacionesEnviadas++

      // Email
      if (adminRel.usuario.email) {
        const emailEnviado = await enviarEmail(
          adminRel.usuario.email,
          `🚪 Solicitud de Retiro - ${nombreCompleto}`,
          generarEmailRetiroHTML(data, 'solicitud', {
            titulo: 'Nueva Solicitud de Retiro',
            mensaje: `El docente ${docenteNombre} ha solicitado un retiro para el estudiante ${nombreCompleto}. Puede aprobar esta solicitud.`,
            color: '#f59e0b',
            emoji: '🚪'
          })
        )
        if (emailEnviado) emailsEnviados++
      }
    }

    console.log(`✅ Retiro creado por docente: ${notificacionesEnviadas} notificaciones, ${emailsEnviados} emails`)
  } catch (error) {
    console.error('Error notificando retiro creado por docente:', error)
  }

  return { notificacionesEnviadas, emailsEnviados }
}

/**
 * Notifica cuando un retiro es aprobado
 */
export async function notificarRetiroAprobado(
  data: RetiroNotificationData,
  aprobador: CreadorInfo,
  creadorId: number
): Promise<{ notificacionesEnviadas: number; emailsEnviados: number }> {
  let notificacionesEnviadas = 0
  let emailsEnviados = 0

  const fechaFormateada = new Date(data.fecha).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  const nombreCompleto = `${data.estudianteNombre} ${data.estudianteApellido}`
  const aprobadorNombre = `${aprobador.nombre} ${aprobador.apellido}`

  try {
    // Notificar al creador del retiro
    const creador = await prisma.usuario.findUnique({
      where: { idUsuario: creadorId }
    })

    if (creador) {
      // Notificación in-app
      await notificacionesRetiro.retiroAprobado(
        creador.idUsuario,
        nombreCompleto,
        fechaFormateada,
        aprobadorNombre
      )
      notificacionesEnviadas++

      // Email
      if (creador.email) {
        const emailEnviado = await enviarEmail(
          creador.email,
          `✅ Retiro Aprobado - ${nombreCompleto}`,
          generarEmailRetiroHTML(data, 'aprobado', {
            titulo: 'Retiro Aprobado',
            mensaje: `El retiro de ${nombreCompleto} ha sido aprobado por ${aprobadorNombre}.`,
            color: '#10b981',
            emoji: '✅'
          })
        )
        if (emailEnviado) emailsEnviados++
      }
    }

    // Notificar a los apoderados del estudiante
    const estudiante = await prisma.estudiante.findFirst({
      where: { 
        usuario: { 
          nombre: data.estudianteNombre,
          apellido: data.estudianteApellido 
        }
      },
      include: {
        apoderados: {
          include: {
            apoderado: {
              include: { usuario: true }
            }
          }
        }
      }
    })

    if (estudiante?.apoderados) {
      for (const relacion of estudiante.apoderados) {
        const apoderado = relacion.apoderado.usuario
        
        // No notificar si el apoderado es el aprobador
        if (apoderado.idUsuario === aprobador.id) continue

        // Notificación in-app
        await notificacionesRetiro.retiroAprobado(
          apoderado.idUsuario,
          nombreCompleto,
          fechaFormateada,
          aprobadorNombre
        )
        notificacionesEnviadas++

        // Email
        if (apoderado.email) {
          const emailEnviado = await enviarEmail(
            apoderado.email,
            `✅ Retiro Aprobado - ${nombreCompleto}`,
            generarEmailRetiroHTML(data, 'aprobado', {
              titulo: 'Retiro Aprobado',
              mensaje: `El retiro de su hijo/a ${nombreCompleto} ha sido aprobado por ${aprobadorNombre}. El estudiante puede ser retirado.`,
              color: '#10b981',
              emoji: '✅'
            })
          )
          if (emailEnviado) emailsEnviados++
        }
      }
    }

    console.log(`✅ Retiro aprobado: ${notificacionesEnviadas} notificaciones, ${emailsEnviados} emails`)
  } catch (error) {
    console.error('Error notificando retiro aprobado:', error)
  }

  return { notificacionesEnviadas, emailsEnviados }
}

/**
 * Notifica cuando un retiro es rechazado
 */
export async function notificarRetiroRechazado(
  data: RetiroNotificationData,
  rechazador: CreadorInfo,
  creadorId: number,
  motivoRechazo?: string
): Promise<{ notificacionesEnviadas: number; emailsEnviados: number }> {
  let notificacionesEnviadas = 0
  let emailsEnviados = 0

  const fechaFormateada = new Date(data.fecha).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  const nombreCompleto = `${data.estudianteNombre} ${data.estudianteApellido}`

  try {
    // Notificar al creador del retiro
    const creador = await prisma.usuario.findUnique({
      where: { idUsuario: creadorId }
    })

    if (creador) {
      // Notificación in-app
      await notificacionesRetiro.retiroRechazado(
        creador.idUsuario,
        nombreCompleto,
        fechaFormateada,
        motivoRechazo
      )
      notificacionesEnviadas++

      // Email
      if (creador.email) {
        const emailEnviado = await enviarEmail(
          creador.email,
          `❌ Retiro Rechazado - ${nombreCompleto}`,
          generarEmailRetiroHTML(data, 'rechazado', {
            titulo: 'Retiro Rechazado',
            mensaje: `El retiro de ${nombreCompleto} ha sido rechazado.${motivoRechazo ? ` Motivo: ${motivoRechazo}` : ''}`,
            color: '#ef4444',
            emoji: '❌'
          })
        )
        if (emailEnviado) emailsEnviados++
      }
    }

    // Notificar a los apoderados del estudiante
    const estudiante = await prisma.estudiante.findFirst({
      where: { 
        usuario: { 
          nombre: data.estudianteNombre,
          apellido: data.estudianteApellido 
        }
      },
      include: {
        apoderados: {
          include: {
            apoderado: {
              include: { usuario: true }
            }
          }
        }
      }
    })

    if (estudiante?.apoderados) {
      for (const relacion of estudiante.apoderados) {
        const apoderado = relacion.apoderado.usuario
        
        // No notificar si el apoderado es el rechazador
        if (apoderado.idUsuario === rechazador.id) continue

        // Notificación in-app
        await notificacionesRetiro.retiroRechazado(
          apoderado.idUsuario,
          nombreCompleto,
          fechaFormateada,
          motivoRechazo
        )
        notificacionesEnviadas++

        // Email
        if (apoderado.email) {
          const emailEnviado = await enviarEmail(
            apoderado.email,
            `❌ Retiro Rechazado - ${nombreCompleto}`,
            generarEmailRetiroHTML(data, 'rechazado', {
              titulo: 'Retiro Rechazado',
              mensaje: `El retiro de su hijo/a ${nombreCompleto} ha sido rechazado.${motivoRechazo ? ` Motivo: ${motivoRechazo}` : ''}`,
              color: '#ef4444',
              emoji: '❌'
            })
          )
          if (emailEnviado) emailsEnviados++
        }
      }
    }

    console.log(`❌ Retiro rechazado: ${notificacionesEnviadas} notificaciones, ${emailsEnviados} emails`)
  } catch (error) {
    console.error('Error notificando retiro rechazado:', error)
  }

  return { notificacionesEnviadas, emailsEnviados }
}
