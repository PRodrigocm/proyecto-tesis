import { NextRequest, NextResponse } from 'next/server'
import { enviarEmail } from '@/lib/notifications'

/**
 * API de prueba para enviar correo de inasistencia
 * GET /api/test/email-inasistencia?email=tu@email.com
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const emailDestino = url.searchParams.get('email') || 'haloperseus@gmail.com'

    console.log('🧪 Iniciando prueba de correo de inasistencia...')

    // Datos de prueba
    const estudianteNombre = 'Juan Carlos'
    const estudianteApellido = 'Pérez García'
    const estudianteDNI = '12345678'
    const grado = '5'
    const seccion = 'A'
    const nombreApoderado = 'María García'

    const fechaHoy = new Date()
    const fechaFormateada = fechaHoy.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const asunto = `❌ INASISTENCIA - ${estudianteNombre} ${estudianteApellido}`

    const contenido = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .alert-box { background: #fee2e2; border: 2px solid #ef4444; padding: 20px; margin: 15px 0; border-radius: 8px; text-align: center; }
          .info-box { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #ef4444; }
          .info-row { padding: 10px 0; border-bottom: 1px solid #eee; }
          .label { font-weight: bold; color: #ef4444; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">❌ Alerta de Inasistencia</h1>
            <p style="margin: 10px 0 0 0;">Sistema de Control de Asistencia Escolar</p>
          </div>
          
          <div class="content">
            <h2>Estimado/a ${nombreApoderado},</h2>
            
            <div class="alert-box">
              <h2 style="color: #ef4444; margin: 0;">INASISTENCIA REGISTRADA</h2>
              <p style="margin: 10px 0 0 0;">Su hijo/a no asistió a clases hoy</p>
            </div>

            <div class="info-box">
              <h3 style="margin-top: 0;">👤 Información del Estudiante</h3>
              <div class="info-row">
                <span class="label">Nombre:</span> ${estudianteNombre} ${estudianteApellido}
              </div>
              <div class="info-row">
                <span class="label">DNI:</span> ${estudianteDNI}
              </div>
              <div class="info-row">
                <span class="label">Grado y Sección:</span> ${grado}° "${seccion}"
              </div>
            </div>

            <div class="info-box">
              <h3 style="margin-top: 0;">📅 Detalles de la Inasistencia</h3>
              <div class="info-row">
                <span class="label">Fecha:</span> ${fechaFormateada}
              </div>
              <div class="info-row">
                <span class="label">Estado:</span> <span style="color: #ef4444; font-weight: bold;">INASISTENCIA</span>
              </div>
              <div class="info-row">
                <span class="label">Registrado por:</span> Sistema Automático
              </div>
            </div>

            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-top: 20px;">
              <h4 style="color: #92400e; margin-top: 0;">📝 ¿Tiene justificación?</h4>
              <p style="margin-bottom: 0;">Si la inasistencia fue por motivos justificados (enfermedad, cita médica, emergencia familiar, etc.), por favor comuníquese con la institución educativa para presentar la documentación correspondiente.</p>
            </div>

            <p style="margin-top: 20px; text-align: center; color: #666;">
              <strong>Es importante mantener una asistencia regular para el buen rendimiento académico.</strong>
            </p>
          </div>

          <div class="footer">
            <p>Este es un mensaje automático del Sistema de Control Escolar.</p>
            <p>Por favor, no responda a este correo.</p>
          </div>
        </div>
      </body>
      </html>
    `

    console.log('📧 Enviando correo de prueba a:', emailDestino)

    const resultado = await enviarEmail(emailDestino, asunto, contenido)

    if (resultado) {
      console.log('✅ ¡Correo enviado exitosamente!')
      return NextResponse.json({
        success: true,
        message: '✅ Correo de inasistencia enviado exitosamente',
        destinatario: emailDestino,
        asunto: asunto,
        estudiante: `${estudianteNombre} ${estudianteApellido}`,
        fecha: fechaFormateada
      })
    } else {
      console.log('❌ Error al enviar el correo')
      return NextResponse.json({
        success: false,
        error: 'Error al enviar el correo'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
