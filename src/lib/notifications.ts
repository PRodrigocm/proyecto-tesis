import nodemailer from 'nodemailer'

interface EmailAttachment {
  filename: string
  content: Buffer
  contentType?: string
}

/**
 * Enviar email usando Gmail SMTP
 */
export async function enviarEmail(
  destinatario: string,
  asunto: string,
  contenidoHTML: string
): Promise<boolean> {
  try {
    // Debug: Verificar credenciales de Gmail
    console.log('🔍 Verificando credenciales de Gmail SMTP:')
    console.log('   GMAIL_USER:', process.env.GMAIL_USER ? '✅ Configurado' : '❌ No configurado')
    console.log('   GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? '✅ Configurado' : '❌ No configurado')
    
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error('❌ Credenciales de Gmail no configuradas en .env')
      console.error('💡 Configura GMAIL_USER y GMAIL_APP_PASSWORD')
      return false
    }

    console.log(`📧 Enviando desde: ${process.env.GMAIL_USER}`)
    console.log(`📧 Enviando a: ${destinatario}`)
    console.log(`📧 Asunto: ${asunto}`)
    
    // Crear transportador de Nodemailer con Gmail SMTP directo
    console.log('🔧 Creando transportador SMTP...')
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false // Permite certificados auto-firmados
      },
      // Timeout de 30 segundos
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000
    })

    // Verificar conexión SMTP
    console.log('🔌 Verificando conexión SMTP...')
    try {
      await transporter.verify()
      console.log('✅ Conexión SMTP verificada')
    } catch (verifyError: any) {
      console.error('❌ Error verificando conexión SMTP:', verifyError.message)
      console.error('💡 Verifica que GMAIL_APP_PASSWORD sea una App Password válida')
      return false
    }

    // Configurar el email
    const mailOptions = {
      from: `"Sistema de Asistencia Escolar" <${process.env.GMAIL_USER}>`,
      to: destinatario,
      subject: asunto,
      html: contenidoHTML
    }

    // Enviar el email
    console.log('📤 Enviando email...')
    const info = await transporter.sendMail(mailOptions)

    console.log('✅ Email enviado via Gmail SMTP:', info.messageId)
    console.log('📬 Respuesta:', info.response)
    return true
  } catch (error: any) {
    console.error('❌ Error enviando email via Gmail:', error.message || error)
    console.error('📋 Stack:', error.stack)
    console.error('🔢 Código:', error.code)
    return false
  }
}

/**
 * Enviar email con adjuntos usando Gmail SMTP
 */
export async function enviarEmailConAdjuntos(
  destinatario: string,
  asunto: string,
  contenidoHTML: string,
  adjuntos: EmailAttachment[]
): Promise<boolean> {
  try {
    console.log('🔍 Verificando credenciales de Gmail SMTP:')
    console.log('   GMAIL_USER:', process.env.GMAIL_USER ? '✅ Configurado' : '❌ No configurado')
    console.log('   GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? '✅ Configurado' : '❌ No configurado')
    
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error('❌ Credenciales de Gmail no configuradas en .env')
      return false
    }

    console.log(`📧 Enviando a: ${destinatario}`)
    console.log(`📎 Adjuntos: ${adjuntos.length} archivos`)
    
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000
    })

    // Verificar conexión
    try {
      await transporter.verify()
      console.log('✅ Conexión SMTP verificada')
    } catch (verifyError: any) {
      console.error('❌ Error verificando SMTP:', verifyError.message)
      return false
    }

    const mailOptions = {
      from: `"Sistema de Asistencia Escolar" <${process.env.GMAIL_USER}>`,
      to: destinatario,
      subject: asunto,
      html: contenidoHTML,
      attachments: adjuntos.map(adj => ({
        filename: adj.filename,
        content: adj.content,
        contentType: adj.contentType
      }))
    }

    console.log('📤 Enviando email con adjuntos...')
    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Email con adjuntos enviado:', info.messageId)
    return true
  } catch (error: any) {
    console.error('❌ Error enviando email con adjuntos:', error.message || error)
    console.error('🔢 Código:', error.code)
    return false
  }
}

/**
 * Enviar SMS usando SMSChef
 * API de SMS para Perú
 */
export async function enviarSMS(
  telefono: string,
  mensaje: string
): Promise<boolean> {
  try {
    // Debug: Verificar variables de entorno
    console.log('🔍 Verificando credenciales de SMSChef:')
    console.log('   SMSCHEF_API_KEY:', process.env.SMSCHEF_API_KEY ? '✅ Configurado' : '❌ No configurado')
    console.log('   SMSCHEF_SENDER_ID:', process.env.SMSCHEF_SENDER_ID ? '✅ Configurado' : '❌ No configurado')
    
    // Verificar si las credenciales de SMSChef están configuradas
    if (!process.env.SMSCHEF_API_KEY) {
      console.log('⚠️ Credenciales de SMSChef no configuradas. SMS no enviado.')
      return false
    }

    // Formatear número de teléfono (solo números, sin +51)
    let telefonoFormateado = telefono.trim().replace(/\D/g, '')
    
    // Si empieza con 51, quitarlo (SMSChef espera solo el número local)
    if (telefonoFormateado.startsWith('51')) {
      telefonoFormateado = telefonoFormateado.substring(2)
    }
    
    // Validar que sea un número peruano válido (9 dígitos que empieza con 9)
    if (telefonoFormateado.length !== 9 || !telefonoFormateado.startsWith('9')) {
      console.log(`⚠️ Número de teléfono inválido: ${telefono}`)
      return false
    }
    
    console.log(`📱 Número formateado: ${telefono} → ${telefonoFormateado}`)

    // Preparar datos para SMSChef
    const requestBody = {
      api_key: process.env.SMSCHEF_API_KEY,
      sender_id: process.env.SMSCHEF_SENDER_ID || 'COLEGIO',
      to: telefonoFormateado,
      message: mensaje,
      schedule: null // Enviar inmediatamente
    }

    console.log('📱 Enviando SMS via SMSChef...')
    console.log('📱 URL:', 'https://api.smschef.com/v1/sms/send')
    console.log('📱 Datos:', JSON.stringify(requestBody, null, 2))

    const response = await fetch('https://api.smschef.com/v1/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    console.log('📱 Status HTTP:', response.status, response.statusText)

    const result = await response.json()
    console.log('📱 Respuesta completa:', JSON.stringify(result, null, 2))

    if (response.ok && result.success) {
      console.log('✅ SMS enviado via SMSChef:', result.message_id || 'OK')
      return true
    } else {
      console.error('❌ Error en respuesta de SMSChef:', result)
      return false
    }
  } catch (error: any) {
    console.error('❌ Error enviando SMS via SMSChef:')
    console.error('   Tipo:', error.constructor.name)
    console.error('   Mensaje:', error.message)
    console.error('   Causa:', error.cause)
    console.error('   Stack:', error.stack)
    
    // Si es un error de fetch, puede ser problema de red o SSL
    if (error.message.includes('fetch failed')) {
      console.error('💡 Posibles causas:')
      console.error('   1. Problema de conexión a internet')
      console.error('   2. La API de SMSChef no está disponible')
      console.error('   3. Problema con certificados SSL')
      console.error('   4. Firewall bloqueando la conexión')
    }
    
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
  textoPersonalizado?: string // Texto personalizado para asistencia de clase
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
    telefonoApoderado,
    textoPersonalizado
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

  // Determinar emoji y colores según el estado de asistencia
  let accionEmoji = '🟢'
  let accionColor = '#10b981'
  let accionBg = '#d1fae5'
  
  if (textoPersonalizado) {
    const textoUpper = textoPersonalizado.toUpperCase()
    
    if (textoUpper.includes('PRESENTE')) {
      accionEmoji = '✅' // Check para presente
      accionColor = '#10b981' // Verde
      accionBg = '#d1fae5'
    } else if (textoUpper.includes('TARDANZA')) {
      accionEmoji = '⚠️' // Signo de riesgo para tardanza
      accionColor = '#f59e0b' // Amarillo/naranja
      accionBg = '#fef3c7'
    } else if (textoUpper.includes('PENDIENTE') || textoUpper.includes('SIN REGISTRAR')) {
      accionEmoji = '⚡' // Signo de atención para pendiente
      accionColor = '#ef4444' // Rojo
      accionBg = '#fee2e2'
    }
  } else {
    // Para entrada/salida normal (sin texto personalizado)
    accionEmoji = accion === 'entrada' ? '🟢' : '🔵'
    accionColor = accion === 'entrada' ? '#10b981' : '#3b82f6'
    accionBg = accion === 'entrada' ? '#d1fae5' : '#dbeafe'
  }
  
  const accionTexto = textoPersonalizado || (accion === 'entrada' ? 'ENTRADA' : 'SALIDA')

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
          <p>Le informamos que se ha registrado la <strong>${textoPersonalizado ? 'asistencia' : accion}</strong> de su hijo/a:</p>
          
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
            <strong>📱 Registro automático:</strong> Esta ${textoPersonalizado ? 'asistencia' : accion} fue registrada mediante el sistema de control de asistencia escolar.
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

/**
 * Notificar cambio/edición de asistencia al apoderado
 * Envía email, SMS y crea notificación interna en el sistema
 */
export async function notificarCambioAsistencia(data: {
  estudianteId: number
  estudianteNombre: string
  estudianteApellido: string
  estudianteDNI: string
  grado: string
  seccion: string
  estadoAnterior: string
  estadoNuevo: string
  fecha: string
  observaciones?: string
  modificadoPor: string
  emailApoderado: string
  telefonoApoderado: string
  apoderadoUsuarioId?: number
}): Promise<{ emailEnviado: boolean; smsEnviado: boolean; notificacionCreada: boolean }> {
  
  const {
    estudianteNombre,
    estudianteApellido,
    estudianteDNI,
    grado,
    seccion,
    estadoAnterior,
    estadoNuevo,
    fecha,
    observaciones,
    modificadoPor,
    emailApoderado,
    telefonoApoderado,
    apoderadoUsuarioId
  } = data

  // Formatear fecha
  const fechaFormateada = new Date(fecha).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // Determinar emoji y colores según el nuevo estado
  let estadoEmoji = '📝'
  let estadoColor = '#6366f1'
  let estadoBg = '#e0e7ff'
  
  const estadoUpper = estadoNuevo.toUpperCase()
  if (estadoUpper === 'PRESENTE') {
    estadoEmoji = '✅'
    estadoColor = '#10b981'
    estadoBg = '#d1fae5'
  } else if (estadoUpper === 'TARDANZA') {
    estadoEmoji = '⏰'
    estadoColor = '#f59e0b'
    estadoBg = '#fef3c7'
  } else if (estadoUpper === 'AUSENTE' || estadoUpper === 'INASISTENCIA') {
    estadoEmoji = '❌'
    estadoColor = '#ef4444'
    estadoBg = '#fee2e2'
  } else if (estadoUpper === 'JUSTIFICADA' || estadoUpper === 'JUSTIFICADO') {
    estadoEmoji = '📋'
    estadoColor = '#3b82f6'
    estadoBg = '#dbeafe'
  }

  // CONTENIDO DEL EMAIL
  const asuntoEmail = `📝 Modificación de Asistencia - ${estudianteNombre} ${estudianteApellido}`
  
  const contenidoEmail = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #6366f1; }
        .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .label { font-weight: bold; color: #6366f1; }
        .value { color: #333; }
        .cambio-box { background: #fef3c7; padding: 20px; margin: 15px 0; border-radius: 8px; border: 2px solid #f59e0b; }
        .estado-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 5px; }
        .estado-anterior { background: #fee2e2; color: #dc2626; text-decoration: line-through; }
        .estado-nuevo { background: ${estadoBg}; color: ${estadoColor}; }
        .flecha { font-size: 24px; margin: 0 10px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        .icon { font-size: 48px; margin-bottom: 10px; }
        .alerta { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 0 8px 8px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="icon">📝</div>
          <h1>Modificación de Asistencia</h1>
          <p>Sistema de Control Escolar</p>
        </div>
        
        <div class="content">
          <h2>Estimado Apoderado,</h2>
          <p>Le informamos que se ha <strong>modificado</strong> el registro de asistencia de su hijo/a:</p>
          
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

          <div class="cambio-box">
            <h3 style="margin-top: 0; color: #92400e;">⚠️ Cambio Realizado</h3>
            <div style="text-align: center; padding: 15px 0;">
              <span class="estado-badge estado-anterior">${estadoAnterior}</span>
              <span class="flecha">➡️</span>
              <span class="estado-badge estado-nuevo">${estadoEmoji} ${estadoNuevo}</span>
            </div>
            <div class="info-row">
              <span class="label">Fecha de Asistencia:</span>
              <span class="value">${fechaFormateada}</span>
            </div>
            ${observaciones ? `
            <div class="info-row">
              <span class="label">Observaciones:</span>
              <span class="value">${observaciones}</span>
            </div>
            ` : ''}
            <div class="info-row">
              <span class="label">Modificado por:</span>
              <span class="value">${modificadoPor}</span>
            </div>
          </div>

          <div class="alerta">
            <strong>📌 Nota:</strong> Si tiene alguna consulta sobre esta modificación, 
            por favor comuníquese con la institución educativa.
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

  // CONTENIDO DEL SMS
  const mensajeSMS = `📝 CAMBIO DE ASISTENCIA
${estudianteNombre} ${estudianteApellido}
${estadoAnterior} → ${estadoEmoji} ${estadoNuevo}
Fecha: ${fechaFormateada}
${observaciones ? `Obs: ${observaciones}` : ''}
- Sistema Escolar`

  // ENVIAR NOTIFICACIONES EXTERNAS
  console.log('📧 Enviando notificaciones de cambio de asistencia...')
  
  const emailEnviado = await enviarEmail(emailApoderado, asuntoEmail, contenidoEmail)
  const smsEnviado = await enviarSMS(telefonoApoderado, mensajeSMS)

  console.log(`📧 Email: ${emailEnviado ? '✅ Enviado' : '❌ Falló'}`)
  console.log(`📱 SMS: ${smsEnviado ? '✅ Enviado' : '❌ Falló'}`)

  // CREAR NOTIFICACIÓN INTERNA EN EL SISTEMA
  let notificacionCreada = false
  if (apoderadoUsuarioId) {
    try {
      const { prisma } = await import('@/lib/prisma')
      
      await prisma.notificacion.create({
        data: {
          idUsuario: apoderadoUsuarioId,
          titulo: `📝 Modificación de Asistencia - ${estudianteNombre}`,
          mensaje: `Se ha modificado la asistencia de ${estudianteNombre} ${estudianteApellido} del ${fechaFormateada}. Estado anterior: ${estadoAnterior} → Nuevo estado: ${estadoNuevo}.${observaciones ? ` Observaciones: ${observaciones}` : ''}`,
          tipo: 'ASISTENCIA_MODIFICADA',
          leida: false,
          origen: 'SISTEMA'
        }
      })
      
      notificacionCreada = true
      console.log('🔔 Notificación interna creada')
    } catch (error) {
      console.error('❌ Error creando notificación interna:', error)
    }
  }

  return { emailEnviado, smsEnviado, notificacionCreada }
}

/**
 * Notificar inasistencia del estudiante al apoderado
 * Se envía cuando el estudiante no asiste a clases
 */
export async function notificarInasistencia(data: {
  estudianteId: number
  estudianteNombre: string
  estudianteApellido: string
  estudianteDNI: string
  grado: string
  seccion: string
  fecha: string
  materia?: string
  emailApoderado: string
  telefonoApoderado: string
  apoderadoUsuarioId?: number
}): Promise<{ emailEnviado: boolean; smsEnviado: boolean; notificacionCreada: boolean }> {
  
  const {
    estudianteNombre,
    estudianteApellido,
    estudianteDNI,
    grado,
    seccion,
    fecha,
    materia,
    emailApoderado,
    telefonoApoderado,
    apoderadoUsuarioId
  } = data

  // Formatear fecha
  const fechaFormateada = new Date(fecha).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // CONTENIDO DEL EMAIL
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
        .accion-box { background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-top: 20px; }
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
            <p style="margin: 10px 0 0 0; color: #7f1d1d;">Se ha registrado la falta de su hijo/a</p>
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
            <h3>📅 Detalles de la Inasistencia</h3>
            <div class="info-row">
              <span class="label">Fecha:</span>
              <span class="value">${fechaFormateada}</span>
            </div>
            ${materia ? `
            <div class="info-row">
              <span class="label">Materia:</span>
              <span class="value">${materia}</span>
            </div>
            ` : ''}
          </div>

          <div class="accion-box">
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
        </div>
      </div>
    </body>
    </html>
  `

  // CONTENIDO DEL SMS
  const mensajeSMS = `❌ INASISTENCIA
${estudianteNombre} ${estudianteApellido}
Fecha: ${fechaFormateada}
Grado: ${grado}° ${seccion}
${materia ? `Materia: ${materia}` : ''}
Por favor justifique la falta.
- Sistema Escolar`

  // ENVIAR NOTIFICACIONES EXTERNAS
  console.log('📧 Enviando notificaciones de inasistencia...')
  
  const emailEnviado = await enviarEmail(emailApoderado, asuntoEmail, contenidoEmail)
  const smsEnviado = await enviarSMS(telefonoApoderado, mensajeSMS)

  console.log(`📧 Email inasistencia: ${emailEnviado ? '✅ Enviado' : '❌ Falló'}`)
  console.log(`📱 SMS inasistencia: ${smsEnviado ? '✅ Enviado' : '❌ Falló'}`)

  // CREAR NOTIFICACIÓN INTERNA EN EL SISTEMA
  let notificacionCreada = false
  if (apoderadoUsuarioId) {
    try {
      const { prisma } = await import('@/lib/prisma')
      
      await prisma.notificacion.create({
        data: {
          idUsuario: apoderadoUsuarioId,
          titulo: `❌ Inasistencia - ${estudianteNombre}`,
          mensaje: `Su hijo/a ${estudianteNombre} ${estudianteApellido} no asistió a clases el ${fechaFormateada}.${materia ? ` Materia: ${materia}.` : ''} Por favor justifique la falta si corresponde.`,
          tipo: 'INASISTENCIA',
          leida: false,
          origen: 'SISTEMA'
        }
      })
      
      notificacionCreada = true
      console.log('🔔 Notificación interna de inasistencia creada')
    } catch (error) {
      console.error('❌ Error creando notificación interna de inasistencia:', error)
    }
  }

  return { emailEnviado, smsEnviado, notificacionCreada }
}
