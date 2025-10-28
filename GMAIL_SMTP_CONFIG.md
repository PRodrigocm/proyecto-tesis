# Configuración de Gmail SMTP

## Variables de Entorno Requeridas

Para que el sistema de notificaciones por email funcione con Gmail, necesitas agregar las siguientes variables en tu archivo `.env`:

```env
# Gmail SMTP
GMAIL_USER=tu_email@gmail.com
GMAIL_APP_PASSWORD=tu_contraseña_de_aplicacion
```

## Cómo Obtener una Contraseña de Aplicación de Gmail

Google requiere que uses una **Contraseña de Aplicación** en lugar de tu contraseña normal para aplicaciones de terceros.

### Paso 1: Habilitar la Verificación en 2 Pasos

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. En el menú lateral, selecciona **Seguridad**
3. Busca **Verificación en 2 pasos** y actívala si no lo está
4. Sigue los pasos para configurar la verificación en 2 pasos

### Paso 2: Crear una Contraseña de Aplicación

1. Una vez habilitada la verificación en 2 pasos, ve a: https://myaccount.google.com/apppasswords
2. Selecciona **Correo** como la aplicación
3. Selecciona **Otro (nombre personalizado)** como el dispositivo
4. Escribe un nombre descriptivo, por ejemplo: "Sistema Escolar"
5. Haz clic en **Generar**
6. Google te mostrará una contraseña de 16 caracteres
7. **Copia esta contraseña** (no podrás verla de nuevo)

### Paso 3: Configurar el .env

Agrega las credenciales en tu archivo `.env`:

```env
GMAIL_USER=tucorreo@gmail.com
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
```

**Nota:** Puedes escribir la contraseña con o sin espacios, Nodemailer los elimina automáticamente.

## Configuración del Transportador

El sistema usa Nodemailer con la siguiente configuración:

```javascript
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
})
```

## Formato del Email

```javascript
{
  from: '"Sistema de Asistencia Escolar" <tucorreo@gmail.com>',
  to: 'apoderado@example.com',
  subject: '✅ PRESENTE EN EL AULA Registrada - Juan Pérez',
  html: '...' // Contenido HTML del email
}
```

## Límites de Gmail

Gmail tiene límites de envío para evitar spam:

- **Cuentas gratuitas:** 500 emails por día
- **Google Workspace:** 2000 emails por día
- **Límite por minuto:** Aproximadamente 100 emails

Si necesitas enviar más emails, considera:
- Usar Google Workspace
- Implementar un sistema de cola
- Usar un servicio de email transaccional dedicado

## Logs del Sistema

Cuando se envía un email, verás estos logs:

```
🔍 Verificando credenciales de Gmail SMTP:
   GMAIL_USER: ✅ Configurado
   GMAIL_APP_PASSWORD: ✅ Configurado
📧 Enviando desde: tucorreo@gmail.com
📧 Enviando a: apoderado@example.com
✅ Email enviado via Gmail SMTP: <message-id@gmail.com>
```

## Solución de Problemas

### Error: "Invalid login"

**Causa:** Contraseña incorrecta o no es una contraseña de aplicación.

**Solución:**
1. Verifica que hayas copiado correctamente la contraseña de aplicación
2. Asegúrate de tener la verificación en 2 pasos habilitada
3. Genera una nueva contraseña de aplicación

### Error: "Username and Password not accepted"

**Causa:** Verificación en 2 pasos no habilitada.

**Solución:**
1. Habilita la verificación en 2 pasos en tu cuenta de Google
2. Genera una contraseña de aplicación

### Error: "Daily sending quota exceeded"

**Causa:** Has excedido el límite de 500 emails por día.

**Solución:**
1. Espera 24 horas para que se reinicie el límite
2. Considera usar Google Workspace para límites más altos
3. Implementa un sistema de cola para distribuir los envíos

### Error: "Connection timeout"

**Causa:** Firewall o problemas de red.

**Solución:**
1. Verifica tu conexión a internet
2. Asegúrate de que el puerto 587 (SMTP) no esté bloqueado
3. Prueba con otro puerto (465 para SSL)

## Configuración Alternativa (Puerto 465)

Si tienes problemas con el puerto 587, puedes usar el puerto 465 con SSL:

```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // SSL
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
})
```

## Seguridad

✅ **Buenas prácticas:**
- Nunca compartas tu contraseña de aplicación
- Usa una cuenta de Gmail dedicada para el sistema
- Revoca contraseñas de aplicación que no uses
- Mantén el archivo `.env` fuera del control de versiones

❌ **No hagas:**
- No uses tu contraseña personal de Gmail
- No compartas el archivo `.env`
- No subas el `.env` a GitHub

## Migración desde Resend

Si estabas usando Resend anteriormente:

1. Elimina (opcional) la variable:
   ```env
   RESEND_API_KEY=...
   ```

2. Agrega las nuevas variables de Gmail:
   ```env
   GMAIL_USER=tucorreo@gmail.com
   GMAIL_APP_PASSWORD=tu_contraseña_app
   ```

3. Reinicia el servidor de desarrollo

## Testing

Para probar el envío de emails:

1. Configura las variables en `.env`
2. Reinicia el servidor
3. Registra una asistencia
4. Revisa los logs en la terminal
5. Verifica la bandeja de entrada del apoderado

## Recursos Adicionales

- **Contraseñas de aplicación:** https://myaccount.google.com/apppasswords
- **Nodemailer Gmail:** https://nodemailer.com/usage/using-gmail/
- **Límites de Gmail:** https://support.google.com/mail/answer/22839

## Soporte

Si tienes problemas:
1. Revisa los logs en la terminal
2. Verifica que las credenciales sean correctas
3. Asegúrate de tener la verificación en 2 pasos habilitada
4. Genera una nueva contraseña de aplicación si es necesario
