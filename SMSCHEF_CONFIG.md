# Configuración de SMSChef

## Variables de Entorno Requeridas

Para que el sistema de notificaciones SMS funcione con SMSChef, necesitas agregar las siguientes variables en tu archivo `.env`:

```env
# SMSChef - Servicio de SMS para Perú
SMSCHEF_API_KEY=tu_api_key_aqui
SMSCHEF_SENDER_ID=COLEGIO
```

## Cómo Obtener las Credenciales

1. **Regístrate en SMSChef:**
   - Visita: https://www.smschef.com/
   - Crea una cuenta

2. **Obtén tu API Key:**
   - Inicia sesión en tu panel de SMSChef
   - Ve a "API" o "Configuración"
   - Copia tu API Key

3. **Configura el Sender ID:**
   - El Sender ID es el nombre que aparecerá como remitente del SMS
   - Por defecto usa "COLEGIO"
   - Puedes cambiarlo por el nombre de tu institución (máximo 11 caracteres)

## Formato de Números de Teléfono

SMSChef espera números de teléfono peruanos en formato local:
- ✅ Correcto: `987654321` (9 dígitos, empieza con 9)
- ❌ Incorrecto: `+51987654321` o `51987654321`

El sistema automáticamente:
- Elimina el código de país (+51 o 51) si está presente
- Valida que sea un número peruano válido (9 dígitos que empieza con 9)

## API Endpoint

El sistema usa el endpoint oficial de SMSChef:
```
POST https://api.smschef.com/v1/sms/send
```

## Estructura de la Petición

```json
{
  "api_key": "tu_api_key",
  "sender_id": "COLEGIO",
  "to": "987654321",
  "message": "Tu mensaje aquí",
  "schedule": null
}
```

## Respuesta Exitosa

```json
{
  "success": true,
  "message_id": "msg_123456",
  "message": "SMS enviado correctamente"
}
```

## Logs del Sistema

Cuando se envía un SMS, verás estos logs:

```
🔍 Verificando credenciales de SMSChef:
   SMSCHEF_API_KEY: ✅ Configurado
   SMSCHEF_SENDER_ID: ✅ Configurado
📱 Número formateado: +51987654321 → 987654321
📱 Enviando SMS via SMSChef...
✅ SMS enviado via SMSChef: msg_123456
```

## Costos

- SMSChef cobra por SMS enviado
- Consulta los precios en: https://www.smschef.com/precios
- Asegúrate de tener saldo suficiente en tu cuenta

## Solución de Problemas

### SMS no se envía

1. **Verifica las credenciales:**
   ```bash
   # En el archivo .env
   SMSCHEF_API_KEY=tu_api_key_real
   ```

2. **Verifica el formato del teléfono:**
   - Debe ser un número peruano válido
   - 9 dígitos que empiece con 9

3. **Verifica el saldo:**
   - Revisa tu cuenta de SMSChef
   - Asegúrate de tener créditos disponibles

4. **Revisa los logs:**
   - Los errores se registran en la consola
   - Busca mensajes con ❌

### Error: "Número de teléfono inválido"

El número debe cumplir:
- 9 dígitos exactos
- Empezar con 9
- Solo números (sin espacios, guiones, etc.)

## Migración desde Twilio

Si estabas usando Twilio anteriormente, el sistema ahora usa SMSChef automáticamente. Solo necesitas:

1. Agregar las variables de SMSChef en `.env`
2. Eliminar (opcional) las variables de Twilio:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`
   - `TWILIO_MESSAGING_SERVICE_SID`

## Soporte

Para soporte técnico de SMSChef:
- Email: soporte@smschef.com
- Web: https://www.smschef.com/soporte
