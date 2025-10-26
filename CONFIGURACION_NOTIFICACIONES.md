# 📧 Configuración de Notificaciones

## 📧 Email con Resend

### 1. Crear Cuenta en Resend (Gratis)

1. Ve a: https://resend.com/signup
2. Regístrate con tu email
3. Verifica tu cuenta

### 2. Obtener API Key

1. Ve a: https://resend.com/api-keys
2. Click en "Create API Key"
3. Nombre: "Sistema Escolar"
4. Permisos: "Sending access"
5. Click en "Add"
6. Copia la API key (empieza con `re_`)

### 3. Agregar Variables de Entorno

Agrega esta línea a tu archivo `.env`:

```env
# Email (Resend)
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxx"
```

## 📱 SMS con Twilio

### Configuración de Twilio

Ya tienes una cuenta de Twilio configurada. Agrega estas credenciales a tu archivo `.env`:

```env
# SMS (Twilio)
TWILIO_ACCOUNT_SID="AC03d100726c8f17411bb90eb02ef11513"
TWILIO_AUTH_TOKEN="tu_auth_token_aqui"  # Obtenerlo del dashboard de Twilio
TWILIO_MESSAGING_SERVICE_SID="MG859bedc5a8dbc9738b6d7f1ff7d9691b"
```

### Obtener el Auth Token

1. Ve a: https://console.twilio.com/
2. Dashboard → Account Info
3. Copia el "Auth Token"
4. Pégalo en `.env`

### Ventajas de Twilio

- ✅ $15 USD de crédito gratuito
- ✅ Envío confiable y rápido
- ✅ Soporte para múltiples países
- ✅ Sin límite diario (hasta agotar crédito)
- 📊 ~$0.0075 USD por SMS en Perú

## 🔔 Notificaciones del Sistema

**Ya están activas**. Se guardan automáticamente en la base de datos y los usuarios las ven en la aplicación.

## ✅ Verificar Configuración

Después de configurar las variables de entorno:

1. Reinicia el servidor: `npm run dev`
2. Crea una reunión de prueba
3. Verifica los logs en la terminal:

```
✅ Notificación en sistema creada para usuario 10
✅ SMS enviado a +51987654321
✅ Email enviado a padre@example.com

✅ Resumen de notificaciones:
   📱 45 notificaciones en sistema
   📱 45 SMS enviados
   📧 45 emails enviados
   👥 Total de padres notificados: 45
```

## 📊 Estado Actual

- ✅ **Notificaciones del sistema**: ACTIVAS
- ✅ **Email (Resend)**: CONFIGURADO (requiere API Key)
- ✅ **SMS (Twilio)**: CONFIGURADO (requiere Auth Token)

## ✨ Ventajas de Resend

- ✅ **100 emails/día gratis** (plan gratuito)
- ✅ **Configuración simple** (solo API key)
- ✅ **Sin verificación en 2 pasos**
- ✅ **Entrega rápida y confiable**
- ✅ **Dashboard con estadísticas**

## 🔒 Seguridad

- ❌ **NUNCA** subas el archivo `.env` a Git
- ✅ Usa contraseñas de aplicación, no tu contraseña de Gmail
- ✅ Las credenciales están en `.gitignore`
