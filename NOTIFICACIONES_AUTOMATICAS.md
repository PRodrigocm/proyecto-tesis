# 🔔 Notificaciones Automáticas de Feriados

## 📋 Descripción

El sistema envía notificaciones automáticas a padres de familia y docentes **un día antes** de cada feriado registrado en el calendario escolar.

## ✨ Características

- ✅ **Notificación en el sistema** - Aparece en el panel de notificaciones
- ✅ **SMS** - Mensaje de texto al teléfono registrado
- ✅ **Email** - Correo electrónico con formato HTML profesional
- ✅ **Automático** - Se ejecuta diariamente sin intervención manual

## 🎯 ¿Quiénes Reciben las Notificaciones?

### 👨‍👩‍👧‍👦 Padres de Familia
- Todos los apoderados registrados en el sistema
- Reciben notificación por todos los canales disponibles

### 👨‍🏫 Docentes
- Todos los docentes registrados en el sistema
- Reciben notificación por todos los canales disponibles

## 📧 Contenido de las Notificaciones

### SMS:
```
Recordatorio: Mañana jueves, 28 de julio de 2025 es Día de la Independencia. No habrá clases.
```

### Email:
- Header con gradiente rojo
- Fecha del feriado
- Motivo del feriado
- Descripción adicional (si existe)
- Mensaje de que no habrá clases
- Footer con información del sistema

### Notificación del Sistema:
- Título: "Recordatorio: [Motivo del Feriado]"
- Mensaje: "Mañana [fecha] no habrá clases."
- Tipo: FERIADO
- Icono: 🎉

## 🔧 Configuración

### Opción 1: Cron Job Manual (Desarrollo)

Ejecutar manualmente cada día:

```bash
curl http://localhost:3000/api/notificaciones/feriados
```

### Opción 2: Cron Job del Sistema (Producción)

**Linux/Mac (crontab):**

```bash
# Editar crontab
crontab -e

# Agregar línea para ejecutar todos los días a las 8:00 AM
0 8 * * * curl http://tu-dominio.com/api/notificaciones/feriados
```

**Windows (Task Scheduler):**

1. Abrir "Programador de tareas"
2. Crear tarea básica
3. Nombre: "Notificaciones de Feriados"
4. Desencadenador: Diariamente a las 8:00 AM
5. Acción: Iniciar un programa
6. Programa: `curl`
7. Argumentos: `http://localhost:3000/api/notificaciones/feriados`

### Opción 3: Vercel Cron Jobs (Recomendado para Producción)

Crear archivo `vercel.json` en la raíz del proyecto:

```json
{
  "crons": [
    {
      "path": "/api/notificaciones/feriados",
      "schedule": "0 8 * * *"
    }
  ]
}
```

Esto ejecutará la verificación todos los días a las 8:00 AM automáticamente.

### Opción 4: GitHub Actions (Gratis)

Crear `.github/workflows/notificaciones-feriados.yml`:

```yaml
name: Notificaciones de Feriados

on:
  schedule:
    # Ejecutar todos los días a las 8:00 AM (UTC)
    - cron: '0 8 * * *'
  workflow_dispatch: # Permite ejecución manual

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Enviar notificaciones
        run: |
          curl -X GET https://tu-dominio.com/api/notificaciones/feriados
```

## 📊 Respuesta del API

### Éxito (sin feriados):
```json
{
  "success": true,
  "message": "No hay feriados para notificar",
  "count": 0
}
```

### Éxito (con feriados):
```json
{
  "success": true,
  "message": "Notificaciones de feriados enviadas exitosamente",
  "feriadosNotificados": 1,
  "notificacionesEnviadas": 45
}
```

### Error:
```json
{
  "error": "Error interno del servidor"
}
```

## 🔍 Logs del Sistema

Cuando se ejecuta la verificación, verás en los logs:

```
🔔 Verificando feriados para notificar...
📅 Encontrados 1 feriados para mañana
✅ Notificaciones enviadas para feriado: Día de la Independencia

Resumen:
  📱 45 notificaciones en sistema
  📱 45 SMS enviados
  📧 45 emails enviados
```

## 🧪 Prueba Manual

Para probar la funcionalidad:

1. Registra un feriado para mañana en el calendario
2. Ejecuta manualmente:
   ```bash
   curl http://localhost:3000/api/notificaciones/feriados
   ```
3. Verifica que lleguen las notificaciones

## ⚙️ Variables de Entorno Requeridas

```env
# Email (Resend)
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxx"

# SMS (Twilio)
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_PHONE_NUMBER="+17657059154"
```

## 📅 Flujo de Trabajo

```
1. Cron Job se ejecuta diariamente (8:00 AM)
   ↓
2. Sistema verifica si hay feriados mañana
   ↓
3. Si hay feriados:
   a. Obtiene lista de padres y docentes
   b. Crea notificación en el sistema
   c. Envía SMS
   d. Envía Email
   ↓
4. Registra en logs el resultado
```

## 🎯 Ejemplo de Uso

**Escenario:**
- Hoy es 27 de julio de 2025
- Mañana (28 de julio) es "Día de la Independencia" (Feriado)

**Resultado:**
- A las 8:00 AM del 27 de julio
- Todos los padres y docentes reciben:
  - Notificación en el sistema
  - SMS en su teléfono
  - Email en su correo
- Mensaje: "Recordatorio: Mañana jueves, 28 de julio de 2025 es Día de la Independencia. No habrá clases."

## 🔒 Seguridad

- ✅ El endpoint es público pero solo consulta datos
- ✅ No expone información sensible
- ✅ Los errores no revelan detalles del sistema
- ✅ Las credenciales están en variables de entorno

## 📝 Notas

- Las notificaciones se envían solo UNA VEZ por feriado
- Si el cron job falla, no se reenvían automáticamente
- Los feriados deben estar registrados con tipo "FERIADO" en el calendario
- El sistema verifica feriados para el día siguiente (mañana)

## 🚀 Recomendación

Para producción, usar **Vercel Cron Jobs** ya que:
- ✅ Es gratis
- ✅ No requiere servidor adicional
- ✅ Se configura fácilmente
- ✅ Es confiable y escalable
