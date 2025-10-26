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
