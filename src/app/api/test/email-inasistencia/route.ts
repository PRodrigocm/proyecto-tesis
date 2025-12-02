import { NextRequest, NextResponse } from 'next/server'
import { enviarEmail } from '@/lib/notifications'

/**
 * Endpoint de prueba para verificar el envío de emails de inasistencia
 * GET: Envía un email de prueba
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const emailDestino = url.searchParams.get('email')
    
    if (!emailDestino) {
      return NextResponse.json({
        error: 'Se requiere el parámetro email',
        ejemplo: '/api/test/email-inasistencia?email=correo@ejemplo.com'
      }, { status: 400 })
    }

    // Datos de prueba
    const estudianteNombre = 'Juan Carlos'
    const estudianteApellido = 'Pérez García'
    const grado = '5'
    const seccion = 'A'
    const fecha = new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const asuntoEmail = `❌ Inasistencia Registrada - ${estudianteNombre} ${estudianteApellido}`
    
    const contenidoEmail = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #ef4444; }
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .label { font-weight: bold; color: #ef4444; }
          .value { color: #333; }
          .alerta { background: #fee2e2; padding: 20px; margin: 15px 0; border-radius: 8px; border: 2px solid #ef4444; text-align: center; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          .icon { font-size: 48px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">❌</div>
            <h1>Inasistencia Registrada</h1>
            <p>Sistema de Control de Asistencia Escolar</p>
          </div>
          
          <div class="content">
            <h2>Estimado Apoderado,</h2>
            <p>Le informamos que su hijo/a <strong>NO asistió</strong> a clases el día de hoy:</p>
            
            <div class="alerta">
              <h2 style="color: #dc2626; margin: 0;">⚠️ INASISTENCIA</h2>
              <p style="margin: 10px 0 0 0; color: #7f1d1d;">Se ha registrado la falta de su hijo/a</p>
            </div>

            <div class="info-box">
              <h3>👤 Información del Estudiante</h3>
              <div class="info-row">
                <span class="label">Nombre:</span>
                <span class="value">${estudianteNombre} ${estudianteApellido}</span>
              </div>
              <div class="info-row">
                <span class="label">Grado y Sección:</span>
                <span class="value">${grado}° ${seccion}</span>
              </div>
              <div class="info-row">
                <span class="label">Fecha:</span>
                <span class="value">${fecha}</span>
              </div>
            </div>

            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-top: 20px;">
              <strong>📋 ¿Qué hacer?</strong>
              <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                <li>Si la inasistencia fue justificada, por favor presente la justificación correspondiente.</li>
                <li>Puede justificar la falta a través del sistema o comunicándose con la institución.</li>
                <li>Las inasistencias no justificadas afectan el récord de asistencia del estudiante.</li>
              </ul>
            </div>
          </div>

          <div class="footer">
            <p>Este es un mensaje automático del Sistema de Control Escolar.</p>
            <p>Por favor, no responda a este correo.</p>
            <p style="color: #999; font-size: 10px;">📧 Email de prueba enviado desde el sistema</p>
          </div>
        </div>
      </body>
      </html>
    `

    console.log(`📧 Enviando email de prueba de inasistencia a: ${emailDestino}`)
    
    const emailEnviado = await enviarEmail(emailDestino, asuntoEmail, contenidoEmail)

    if (emailEnviado) {
      return NextResponse.json({
        success: true,
        mensaje: `✅ Email de prueba enviado exitosamente a ${emailDestino}`,
        detalles: {
          destinatario: emailDestino,
          asunto: asuntoEmail,
          tipo: 'Notificación de Inasistencia (PRUEBA)'
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'No se pudo enviar el email',
        mensaje: 'Verifica las credenciales de Gmail en las variables de entorno (GMAIL_USER y GMAIL_APP_PASSWORD)'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Error en test de email:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

/**
 * POST: Enviar notificación de inasistencia con datos personalizados
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, estudianteNombre, estudianteApellido, grado, seccion, fecha } = body

    if (!email) {
      return NextResponse.json({
        error: 'Se requiere el campo email'
      }, { status: 400 })
    }

    const fechaFormateada = fecha 
      ? new Date(fecha).toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : new Date().toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })

    const asuntoEmail = `❌ Inasistencia Registrada - ${estudianteNombre || 'Estudiante'} ${estudianteApellido || ''}`
    
    const contenidoEmail = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #ef4444; }
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .label { font-weight: bold; color: #ef4444; }
          .value { color: #333; }
          .alerta { background: #fee2e2; padding: 20px; margin: 15px 0; border-radius: 8px; border: 2px solid #ef4444; text-align: center; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          .icon { font-size: 48px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">❌</div>
            <h1>Inasistencia Registrada</h1>
            <p>Sistema de Control de Asistencia Escolar</p>
          </div>
          
          <div class="content">
            <h2>Estimado Apoderado,</h2>
            <p>Le informamos que su hijo/a <strong>NO asistió</strong> a clases:</p>
            
            <div class="alerta">
              <h2 style="color: #dc2626; margin: 0;">⚠️ INASISTENCIA</h2>
            </div>

            <div class="info-box">
              <h3>👤 Información del Estudiante</h3>
              <div class="info-row">
                <span class="label">Nombre:</span>
                <span class="value">${estudianteNombre || 'No especificado'} ${estudianteApellido || ''}</span>
              </div>
              <div class="info-row">
                <span class="label">Grado y Sección:</span>
                <span class="value">${grado || '?'}° ${seccion || '?'}</span>
              </div>
              <div class="info-row">
                <span class="label">Fecha:</span>
                <span class="value">${fechaFormateada}</span>
              </div>
            </div>

            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-top: 20px;">
              <strong>📋 ¿Qué hacer?</strong>
              <p style="margin: 10px 0 0 0;">Si la inasistencia fue justificada, presente la justificación correspondiente a través del sistema o comunicándose con la institución.</p>
            </div>
          </div>

          <div class="footer">
            <p>Este es un mensaje automático del Sistema de Control Escolar.</p>
            <p>Por favor, no responda a este correo.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const emailEnviado = await enviarEmail(email, asuntoEmail, contenidoEmail)

    return NextResponse.json({
      success: emailEnviado,
      mensaje: emailEnviado 
        ? `✅ Notificación de inasistencia enviada a ${email}`
        : '❌ No se pudo enviar la notificación'
    })

  } catch (error) {
    console.error('❌ Error enviando notificación de inasistencia:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
