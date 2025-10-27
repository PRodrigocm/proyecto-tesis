import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { enviarEmail, enviarSMS } from '@/lib/notifications'

const prisma = new PrismaClient()

/**
 * Verificar y enviar notificaciones de feriados
 * Se ejecuta diariamente para notificar sobre feriados del día siguiente
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔔 Verificando feriados para notificar...')

    // Obtener la fecha de mañana
    const manana = new Date()
    manana.setDate(manana.getDate() + 1)
    manana.setHours(0, 0, 0, 0)

    const mananaFin = new Date(manana)
    mananaFin.setHours(23, 59, 59, 999)

    // Buscar feriados para mañana en calendario escolar
    const feriados = await prisma.calendarioEscolar.findMany({
      where: {
        tipoDia: 'FERIADO',
        fechaInicio: {
          lte: mananaFin
        },
        fechaFin: {
          gte: manana
        }
      }
    })

    if (feriados.length === 0) {
      console.log('✅ No hay feriados mañana')
      return NextResponse.json({
        success: true,
        message: 'No hay feriados para notificar',
        count: 0
      })
    }

    console.log(`📅 Encontrados ${feriados.length} feriados para mañana`)

    let notificacionesEnviadas = 0

    for (const feriado of feriados) {
      // Obtener todos los padres de familia
      const padres = await prisma.apoderado.findMany({
        include: {
          usuario: {
            select: {
              idUsuario: true,
              nombre: true,
              apellido: true,
              email: true,
              telefono: true
            }
          }
        }
      })

      // Obtener todos los docentes
      const docentes = await prisma.docente.findMany({
        include: {
          usuario: {
            select: {
              idUsuario: true,
              nombre: true,
              apellido: true,
              email: true,
              telefono: true
            }
          }
        }
      })

      const fechaFormateada = new Date(feriado.fechaInicio).toLocaleDateString('es-PE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

      // Mensaje para SMS
      const mensajeSMS = `Recordatorio: Mañana ${fechaFormateada} es ${feriado.descripcion || 'feriado'}. No habrá clases.`

      // Mensaje para Email
      const mensajeEmail = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recordatorio de Feriado</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                🎉 Recordatorio de Feriado
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                Le recordamos que:
              </p>
              
              <!-- Fecha -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="padding: 15px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
                    <p style="margin: 0; color: #666; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      📅 Fecha
                    </p>
                    <p style="margin: 5px 0 0 0; color: #333; font-size: 18px; font-weight: bold;">
                      ${fechaFormateada}
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Motivo -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="padding: 15px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
                    <p style="margin: 0; color: #666; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      🎊 Motivo
                    </p>
                    <p style="margin: 10px 0 0 0; color: #555; font-size: 16px; line-height: 1.6;">
                      ${feriado.descripcion || 'Feriado'}
                    </p>
                  </td>
                </tr>
              </table>
              
              ${feriado.descripcion ? `
              <!-- Descripción -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="padding: 15px; background-color: #f8f9fa; border-left: 4px solid #6b7280; border-radius: 4px;">
                    <p style="margin: 0; color: #666; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      📝 Información Adicional
                    </p>
                    <p style="margin: 10px 0 0 0; color: #555; font-size: 16px; line-height: 1.6;">
                      ${feriado.descripcion}
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- Mensaje importante -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                <tr>
                  <td style="padding: 20px; background-color: #fef3c7; border-radius: 4px; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0; color: #92400e; font-size: 15px; line-height: 1.5;">
                      ⚠️ <strong>No habrá clases</strong> en esta fecha. Las actividades se reanudarán el siguiente día hábil.
                    </p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #6c757d; font-size: 13px;">
                Sistema de Gestión Escolar
              </p>
              <p style="margin: 5px 0 0 0; color: #adb5bd; font-size: 12px;">
                Este es un mensaje automático, por favor no responder.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `

      // Enviar notificaciones a padres
      for (const padre of padres) {
        try {
          // Crear notificación en el sistema
          await prisma.notificacion.create({
            data: {
              idUsuario: padre.usuario.idUsuario,
              titulo: `Recordatorio: ${feriado.descripcion || 'Feriado'}`,
              mensaje: `Mañana ${fechaFormateada} no habrá clases.`,
              tipo: 'FERIADO',
              leida: false
            }
          })

          // Enviar SMS
          if (padre.usuario.telefono) {
            await enviarSMS(padre.usuario.telefono, mensajeSMS)
          }

          // Enviar Email
          if (padre.usuario.email) {
            await enviarEmail(
              padre.usuario.email,
              `Recordatorio: ${feriado.descripcion || 'Feriado'}`,
              mensajeEmail
            )
          }

          notificacionesEnviadas++
        } catch (error) {
          console.error(`Error notificando a padre ${padre.usuario.idUsuario}:`, error)
        }
      }

      // Enviar notificaciones a docentes
      for (const docente of docentes) {
        try {
          // Crear notificación en el sistema
          await prisma.notificacion.create({
            data: {
              idUsuario: docente.usuario.idUsuario,
              titulo: `Recordatorio: ${feriado.descripcion || 'Feriado'}`,
              mensaje: `Mañana ${fechaFormateada} no habrá clases.`,
              tipo: 'FERIADO',
              leida: false
            }
          })

          // Enviar SMS
          if (docente.usuario.telefono) {
            await enviarSMS(docente.usuario.telefono, mensajeSMS)
          }

          // Enviar Email
          if (docente.usuario.email) {
            await enviarEmail(
              docente.usuario.email,
              `Recordatorio: ${feriado.descripcion || 'Feriado'}`,
              mensajeEmail
            )
          }

          notificacionesEnviadas++
        } catch (error) {
          console.error(`Error notificando a docente ${docente.usuario.idUsuario}:`, error)
        }
      }

      console.log(`✅ Notificaciones enviadas para feriado: ${feriado.descripcion || 'Feriado'}`)
    }

    return NextResponse.json({
      success: true,
      message: `Notificaciones de feriados enviadas exitosamente`,
      feriadosNotificados: feriados.length,
      notificacionesEnviadas
    })

  } catch (error) {
    console.error('❌ Error verificando feriados:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
