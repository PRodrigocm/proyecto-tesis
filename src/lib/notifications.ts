import { Resend } from 'resend'

// Inicializar Resend
const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Enviar email usando Resend
 */
export async function enviarEmail(
  destinatario: string,
  asunto: string,
  contenidoHTML: string
): Promise<boolean> {
  try {
    // Debug: Verificar credenciales de Resend
    console.log('🔍 Verificando credenciales de Resend:')
    console.log('   RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Configurado' : '❌ No configurado')
    
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY no configurado en .env')
      console.error('💡 Obtén tu API key en: https://resend.com/api-keys')
      return false
    }

    // Enviar siempre a tivem16330@filipx.com (email registrado en Resend)
    const emailDestinatario = 'tivem16330@filipx.com'
    
    console.log(`📧 Enviando desde: onboarding@resend.dev`)
    console.log(`📧 Enviando a: ${emailDestinatario}`)
    console.log(`📧 Destinatario original: ${destinatario}`)
    
    const { data, error } = await resend.emails.send({
      from: 'Sistema Escolar <onboarding@resend.dev>',
      to: emailDestinatario,
      subject: asunto,
      html: contenidoHTML
    })

    if (error) {
      console.error('❌ Error enviando email con Resend:', error)
      return false
    }

    console.log('✅ Email enviado via Resend:', data?.id)
    return true
  } catch (error: any) {
    console.error('❌ Error enviando email:', error.message || error)
    return false
  }
}

/**
 * Enviar SMS usando Twilio
 * Usa Messaging Service SID para envío automático
 */
export async function enviarSMS(
  telefono: string,
  mensaje: string
): Promise<boolean> {
  try {
    // Debug: Verificar variables de entorno
    console.log('🔍 Verificando credenciales de Twilio:')
    console.log('   TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? '✅ Configurado' : '❌ No configurado')
    console.log('   TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? '✅ Configurado' : '❌ No configurado')
    console.log('   TWILIO_MESSAGING_SERVICE_SID:', process.env.TWILIO_MESSAGING_SERVICE_SID ? '✅ Configurado' : '❌ No configurado')
    
    // Verificar si las credenciales de Twilio están configuradas
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.log('⚠️ Credenciales de Twilio no configuradas. SMS no enviado.')
      return false
    }

    // Formatear número de teléfono (agregar +51 si no tiene código de país)
    let telefonoFormateado = telefono.trim()
    if (!telefonoFormateado.startsWith('+')) {
      // Si no tiene +, agregar +51 (Perú)
      telefonoFormateado = '+51' + telefonoFormateado
    }
    
    console.log(`📱 Número formateado: ${telefono} → ${telefonoFormateado}`)

    const twilio = require('twilio')
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )

    // Configurar el mensaje
    const messageData: any = {
      body: mensaje,
      to: telefonoFormateado
    }

    // Usar número de teléfono si está disponible, sino usar Messaging Service SID
    if (process.env.TWILIO_PHONE_NUMBER) {
      messageData.from = process.env.TWILIO_PHONE_NUMBER
      console.log(`📱 Enviando desde: ${process.env.TWILIO_PHONE_NUMBER}`)
    } else if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
      messageData.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID
      console.log(`📱 Usando Messaging Service: ${process.env.TWILIO_MESSAGING_SERVICE_SID}`)
    } else {
      console.log('⚠️ No se configuró TWILIO_PHONE_NUMBER ni TWILIO_MESSAGING_SERVICE_SID')
      return false
    }

    const result = await client.messages.create(messageData)

    console.log('✅ SMS enviado via Twilio:', result.sid)
    return true
  } catch (error: any) {
    console.error('❌ Error enviando SMS via Twilio:', error.message || error)
    return false
  }
}

/**
 * Enviar SMS usando servicio gratuito alternativo (TextBelt)
 * Nota: TextBelt ofrece 1 SMS gratuito por día por IP
 */
export async function enviarSMSGratis(
  telefono: string,
  mensaje: string
): Promise<boolean> {
  try {
    const response = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: telefono,
        message: mensaje,
        key: 'textbelt' // Clave gratuita (1 SMS/día)
      })
    })

    const data = await response.json()
    
    if (data.success) {
      console.log('✅ SMS gratuito enviado via TextBelt')
      return true
    } else {
      console.log('⚠️ TextBelt:', data.error)
      return false
    }
  } catch (error) {
    console.error('❌ Error enviando SMS gratuito:', error)
    return false
  }
}

/**
 * Notificar asistencia registrada por QR al apoderado
 */
export async function notificarAsistenciaQR(data: {
  estudianteNombre: string
  estudianteApellido: string
  estudianteDNI: string
  grado: string
  seccion: string
  aula: string
  estado: string
  hora: string
  fecha: string
  docenteNombre: string
  docenteApellido: string
  emailApoderado: string
  telefonoApoderado: string
}): Promise<{ emailEnviado: boolean; smsEnviado: boolean }> {
  
  const {
    estudianteNombre,
    estudianteApellido,
    estudianteDNI,
    grado,
    seccion,
    aula,
    estado,
    hora,
    fecha,
    docenteNombre,
    docenteApellido,
    emailApoderado,
    telefonoApoderado
  } = data

  // Formatear fecha y hora
  const fechaFormateada = new Date(fecha).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  
  const horaFormateada = new Date(hora).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })

  // Determinar emoji según estado
  const estadoEmoji = estado === 'PRESENTE' ? '✅' : 
                      estado === 'TARDANZA' ? '⏰' : 
                      estado === 'AUSENTE' ? '❌' : '📋'

  // CONTENIDO DEL EMAIL
  const asuntoEmail = `${estadoEmoji} Asistencia Registrada - ${estudianteNombre} ${estudianteApellido}`
  
  const contenidoEmail = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #667eea; }
        .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .label { font-weight: bold; color: #667eea; }
        .value { color: #333; }
        .estado-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
        .estado-presente { background: #10b981; color: white; }
        .estado-tardanza { background: #f59e0b; color: white; }
        .estado-ausente { background: #ef4444; color: white; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${estadoEmoji} Notificación de Asistencia</h1>
          <p>Sistema de Control Escolar</p>
        </div>
        
        <div class="content">
          <h2>Estimado Apoderado,</h2>
          <p>Le informamos que se ha registrado la asistencia de su hijo/a:</p>
          
          <div class="info-box">
            <h3>📚 Información del Estudiante</h3>
            <div class="info-row">
              <span class="label">Nombre:</span>
              <span class="value">${estudianteNombre} ${estudianteApellido}</span>
            </div>
            <div class="info-row">
              <span class="label">DNI:</span>
              <span class="value">${estudianteDNI}</span>
            </div>
            <div class="info-row">
              <span class="label">Grado y Sección:</span>
              <span class="value">${grado}° ${seccion}</span>
            </div>
          </div>

          <div class="info-box">
            <h3>⏰ Detalles de Asistencia</h3>
            <div class="info-row">
              <span class="label">Estado:</span>
              <span class="value">
                <span class="estado-badge estado-${estado.toLowerCase()}">${estado}</span>
              </span>
            </div>
            <div class="info-row">
              <span class="label">Fecha:</span>
              <span class="value">${fechaFormateada}</span>
            </div>
            <div class="info-row">
              <span class="label">Hora de Registro:</span>
              <span class="value">${horaFormateada}</span>
            </div>
            <div class="info-row">
              <span class="label">Aula:</span>
              <span class="value">${aula}</span>
            </div>
          </div>

          <div class="info-box">
            <h3>👨‍🏫 Docente Responsable</h3>
            <div class="info-row">
              <span class="label">Nombre:</span>
              <span class="value">${docenteNombre} ${docenteApellido}</span>
            </div>
          </div>

          <p style="margin-top: 20px; padding: 15px; background: #e0e7ff; border-radius: 8px;">
            <strong>📱 Registro mediante QR:</strong> Esta asistencia fue registrada automáticamente mediante el escaneo del código QR del estudiante.
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

  // CONTENIDO DEL SMS
  const mensajeSMS = `${estadoEmoji} ASISTENCIA REGISTRADA
Estudiante: ${estudianteNombre} ${estudianteApellido}
Estado: ${estado}
Fecha: ${fechaFormateada}
Hora: ${horaFormateada}
Aula: ${aula}
Docente: ${docenteNombre} ${docenteApellido}
- Sistema Escolar`

  // ENVIAR NOTIFICACIONES
  console.log('📧 Enviando notificaciones de asistencia...')
  
  const emailEnviado = await enviarEmail(emailApoderado, asuntoEmail, contenidoEmail)
  const smsEnviado = await enviarSMS(telefonoApoderado, mensajeSMS)

  console.log(`📧 Email: ${emailEnviado ? '✅ Enviado' : '❌ Falló'}`)
  console.log(`📱 SMS: ${smsEnviado ? '✅ Enviado' : '❌ Falló'}`)

  return { emailEnviado, smsEnviado }
}

/**
 * Notificar entrada/salida del estudiante al apoderado
 */
export async function notificarEntradaSalida(data: {
  estudianteNombre: string
  estudianteApellido: string
  estudianteDNI: string
  grado: string
  seccion: string
  accion: 'entrada' | 'salida'
  hora: string
  fecha: string
  emailApoderado: string
  telefonoApoderado: string
}): Promise<{ emailEnviado: boolean; smsEnviado: boolean }> {
  
  const {
    estudianteNombre,
    estudianteApellido,
    estudianteDNI,
    grado,
    seccion,
    accion,
    hora,
    fecha,
    emailApoderado,
    telefonoApoderado
  } = data

  // Formatear fecha y hora
  const fechaFormateada = new Date(fecha).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  
  const horaFormateada = new Date(hora).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })

  // Determinar emoji y colores según acción
  const accionEmoji = accion === 'entrada' ? '🟢' : '🔵'
  const accionTexto = accion === 'entrada' ? 'ENTRADA' : 'SALIDA'
  const accionColor = accion === 'entrada' ? '#10b981' : '#3b82f6'
  const accionBg = accion === 'entrada' ? '#d1fae5' : '#dbeafe'

  // CONTENIDO DEL EMAIL
  const asuntoEmail = `${accionEmoji} ${accionTexto} Registrada - ${estudianteNombre} ${estudianteApellido}`
  
  const contenidoEmail = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, ${accionColor} 0%, #6366f1 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid ${accionColor}; }
        .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .label { font-weight: bold; color: ${accionColor}; }
        .value { color: #333; }
        .accion-badge { display: inline-block; padding: 12px 24px; border-radius: 25px; font-weight: bold; margin: 15px 0; background: ${accionBg}; color: ${accionColor}; font-size: 18px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        .icon { font-size: 48px; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="icon">${accionEmoji}</div>
          <h1>${accionTexto} Registrada</h1>
          <p>Sistema de Control de Asistencia</p>
        </div>
        
        <div class="content">
          <h2>Estimado Apoderado,</h2>
          <p>Le informamos que se ha registrado la <strong>${accion}</strong> de su hijo/a:</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <span class="accion-badge">${accionEmoji} ${accionTexto}</span>
          </div>

          <div class="info-box">
            <h3>👤 Información del Estudiante</h3>
            <div class="info-row">
              <span class="label">Nombre:</span>
              <span class="value">${estudianteNombre} ${estudianteApellido}</span>
            </div>
            <div class="info-row">
              <span class="label">DNI:</span>
              <span class="value">${estudianteDNI}</span>
            </div>
            <div class="info-row">
              <span class="label">Grado y Sección:</span>
              <span class="value">${grado}° ${seccion}</span>
            </div>
          </div>

          <div class="info-box">
            <h3>⏰ Detalles del Registro</h3>
            <div class="info-row">
              <span class="label">Acción:</span>
              <span class="value"><strong>${accionTexto}</strong></span>
            </div>
            <div class="info-row">
              <span class="label">Fecha:</span>
              <span class="value">${fechaFormateada}</span>
            </div>
            <div class="info-row">
              <span class="label">Hora:</span>
              <span class="value"><strong>${horaFormateada}</strong></span>
            </div>
          </div>

          <p style="margin-top: 20px; padding: 15px; background: ${accionBg}; border-radius: 8px; border-left: 4px solid ${accionColor};">
            <strong>📱 Registro automático:</strong> Esta ${accion} fue registrada mediante el sistema de control de asistencia escolar.
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

  // CONTENIDO DEL SMS
  const mensajeSMS = `${accionEmoji} ${accionTexto} REGISTRADA
Estudiante: ${estudianteNombre} ${estudianteApellido}
Fecha: ${fechaFormateada}
Hora: ${horaFormateada}
Grado: ${grado}° ${seccion}
- Sistema Escolar`

  // ENVIAR NOTIFICACIONES
  console.log(`📧 Enviando notificaciones de ${accion}...`)
  
  const emailEnviado = await enviarEmail(emailApoderado, asuntoEmail, contenidoEmail)
  const smsEnviado = await enviarSMS(telefonoApoderado, mensajeSMS)

  console.log(`📧 Email: ${emailEnviado ? '✅ Enviado' : '❌ Falló'}`)
  console.log(`📱 SMS: ${smsEnviado ? '✅ Enviado' : '❌ Falló'}`)

  return { emailEnviado, smsEnviado }
}
