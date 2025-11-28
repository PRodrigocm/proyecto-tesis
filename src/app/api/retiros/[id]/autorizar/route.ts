import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { enviarEmail } from '@/lib/notifications'

/**
 * PATCH - Autorizar o rechazar un retiro
 * Envía notificaciones bidireccionales:
 * - Si Admin crea/autoriza: Notifica al Apoderado
 * - Si Apoderado aprueba: Notifica al Admin/Auxiliar
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const retiroId = parseInt(params.id)
    const body = await request.json()
    const { autorizado, observaciones, origenAprobacion } = body

    if (isNaN(retiroId)) {
      return NextResponse.json(
        { error: 'ID de retiro inválido' },
        { status: 400 }
      )
    }

    // Obtener usuario del token
    const authHeader = request.headers.get('authorization')
    let userId = 1
    let userRol = 'ADMINISTRATIVO'
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
        userId = decoded.userId || 1
        userRol = decoded.rol || 'ADMINISTRATIVO'
      } catch (error) {
        console.log('⚠️ Error decoding token')
      }
    }

    // Obtener información completa del retiro
    const retiro = await prisma.retiro.findUnique({
      where: { idRetiro: retiroId },
      include: {
        estudiante: {
          include: {
            usuario: true,
            gradoSeccion: {
              include: { grado: true, seccion: true }
            },
            apoderados: {
              include: {
                apoderado: {
                  include: { usuario: true }
                }
              }
            }
          }
        },
        ie: true
      }
    })

    if (!retiro) {
      return NextResponse.json(
        { error: 'Retiro no encontrado' },
        { status: 404 }
      )
    }

    // Buscar o crear estado correspondiente
    const codigoEstado = autorizado ? 'AUTORIZADO' : 'RECHAZADO'
    let estadoRetiro = await prisma.estadoRetiro.findFirst({
      where: { codigo: codigoEstado }
    })

    if (!estadoRetiro) {
      estadoRetiro = await prisma.estadoRetiro.create({
        data: { 
          codigo: codigoEstado,
          nombre: autorizado ? 'Autorizado' : 'Rechazado',
          orden: autorizado ? 2 : 3
        }
      })
    }

    // Actualizar el retiro
    const retiroActualizado = await prisma.retiro.update({
      where: { idRetiro: retiroId },
      data: {
        idEstadoRetiro: estadoRetiro.idEstadoRetiro,
        observaciones: observaciones,
        verificadoPor: userId
      }
    })

    // === NOTIFICACIONES BIDIRECCIONALES ===
    const estudianteNombre = `${retiro.estudiante.usuario.nombre} ${retiro.estudiante.usuario.apellido}`
    const fechaRetiro = retiro.fecha.toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })
    const horaRetiro = retiro.hora.toTimeString().slice(0, 5)

    // Determinar quién aprobó y a quién notificar
    const esAprobacionApoderado = origenAprobacion === 'APODERADO' || userRol === 'APODERADO'

    if (esAprobacionApoderado && autorizado) {
      // APODERADO APROBÓ -> Notificar a Admin/Auxiliar
      console.log('📧 Apoderado aprobó retiro, notificando a administración...')
      
      // Buscar usuarios administrativos de la IE
      const admins = await prisma.usuario.findMany({
        where: {
          idIe: retiro.idIe,
          roles: {
            some: {
              rol: {
                nombre: { in: ['ADMINISTRATIVO', 'AUXILIAR'] }
              }
            }
          },
          estado: 'ACTIVO'
        }
      })

      // Crear notificaciones en sistema para admins
      for (const admin of admins) {
        await prisma.notificacion.create({
          data: {
            idUsuario: admin.idUsuario,
            titulo: '✅ Retiro Aprobado por Apoderado',
            mensaje: `El apoderado ha aprobado el retiro de ${estudianteNombre} programado para ${fechaRetiro} a las ${horaRetiro}. El estudiante puede ser retirado.`,
            tipo: 'INFORMATIVO',
            leida: false
          }
        })

        // Enviar email si tiene correo
        if (admin.email) {
          await enviarEmailRetiroAprobado({
            destinatario: admin.email,
            nombreDestinatario: `${admin.nombre} ${admin.apellido}`,
            estudianteNombre,
            fechaRetiro,
            horaRetiro,
            aprobadoPor: 'Apoderado'
          })
        }
      }
    } else if (!esAprobacionApoderado) {
      // ADMIN CREÓ/MODIFICÓ -> Notificar a Apoderados
      console.log('📧 Admin modificó retiro, notificando a apoderados...')
      
      const apoderados = retiro.estudiante.apoderados || []
      
      for (const ea of apoderados) {
        const apoderado = ea.apoderado
        if (!apoderado?.usuario) continue

        // Crear notificación en sistema
        await prisma.notificacion.create({
          data: {
            idUsuario: apoderado.usuario.idUsuario,
            titulo: autorizado 
              ? '✅ Retiro Autorizado' 
              : '❌ Retiro Rechazado',
            mensaje: autorizado
              ? `El retiro de ${estudianteNombre} ha sido autorizado para ${fechaRetiro} a las ${horaRetiro}. Por favor, confirme su aprobación.`
              : `El retiro de ${estudianteNombre} programado para ${fechaRetiro} ha sido rechazado. ${observaciones || ''}`,
            tipo: autorizado ? 'INFORMATIVO' : 'ALERTA',
            leida: false
          }
        })

        // Enviar email
        if (apoderado.usuario.email) {
          await enviarEmailRetiroNotificacion({
            destinatario: apoderado.usuario.email,
            nombreDestinatario: `${apoderado.usuario.nombre} ${apoderado.usuario.apellido}`,
            estudianteNombre,
            fechaRetiro,
            horaRetiro,
            estado: autorizado ? 'AUTORIZADO' : 'RECHAZADO',
            observaciones: observaciones || ''
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Retiro ${autorizado ? 'autorizado' : 'rechazado'} exitosamente. Notificaciones enviadas.`,
      data: retiroActualizado
    })

  } catch (error) {
    console.error('Error authorizing retiro:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Función auxiliar para enviar email de retiro aprobado
async function enviarEmailRetiroAprobado(data: {
  destinatario: string
  nombreDestinatario: string
  estudianteNombre: string
  fechaRetiro: string
  horaRetiro: string
  aprobadoPor: string
}) {
  const contenido = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #10b981; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">✅ Retiro Aprobado</h1>
        </div>
        <div class="content">
          <h2>Estimado/a ${data.nombreDestinatario},</h2>
          <p>El retiro del estudiante ha sido aprobado por el apoderado.</p>
          <div class="info-box">
            <p><strong>Estudiante:</strong> ${data.estudianteNombre}</p>
            <p><strong>Fecha:</strong> ${data.fechaRetiro}</p>
            <p><strong>Hora:</strong> ${data.horaRetiro}</p>
            <p><strong>Aprobado por:</strong> ${data.aprobadoPor}</p>
          </div>
          <p>El estudiante puede ser retirado en el horario indicado.</p>
        </div>
        <div class="footer">
          <p>Sistema de Control Escolar</p>
        </div>
      </div>
    </body>
    </html>
  `
  
  await enviarEmail(data.destinatario, `✅ Retiro Aprobado - ${data.estudianteNombre}`, contenido)
}

// Función auxiliar para enviar email de notificación de retiro
async function enviarEmailRetiroNotificacion(data: {
  destinatario: string
  nombreDestinatario: string
  estudianteNombre: string
  fechaRetiro: string
  horaRetiro: string
  estado: string
  observaciones: string
}) {
  const esAutorizado = data.estado === 'AUTORIZADO'
  const colorHeader = esAutorizado ? '#10b981' : '#ef4444'
  const emoji = esAutorizado ? '✅' : '❌'
  
  const contenido = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${colorHeader}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid ${colorHeader}; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">${emoji} Retiro ${data.estado}</h1>
        </div>
        <div class="content">
          <h2>Estimado/a ${data.nombreDestinatario},</h2>
          <p>Le informamos sobre el estado del retiro de su hijo/a.</p>
          <div class="info-box">
            <p><strong>Estudiante:</strong> ${data.estudianteNombre}</p>
            <p><strong>Fecha:</strong> ${data.fechaRetiro}</p>
            <p><strong>Hora:</strong> ${data.horaRetiro}</p>
            <p><strong>Estado:</strong> ${data.estado}</p>
            ${data.observaciones ? `<p><strong>Observaciones:</strong> ${data.observaciones}</p>` : ''}
          </div>
          ${esAutorizado ? '<p>Por favor, confirme su aprobación ingresando al sistema.</p>' : ''}
        </div>
        <div class="footer">
          <p>Sistema de Control Escolar</p>
        </div>
      </div>
    </body>
    </html>
  `
  
  await enviarEmail(data.destinatario, `${emoji} Retiro ${data.estado} - ${data.estudianteNombre}`, contenido)
}
