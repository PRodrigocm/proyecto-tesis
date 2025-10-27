# 🔔 Sistema Completo de Notificaciones

## 📋 Descripción General

El sistema de notificaciones envía alertas a través de **3 canales diferentes**:

1. **📱 Notificaciones del Sistema** - Dentro de la aplicación
2. **📧 Email** - Correo electrónico
3. **💬 SMS** - Mensaje de texto

## 🎯 Tipos de Notificaciones

### 1. Notificaciones de Feriados
- **Cuándo:** Un día antes del feriado (8:00 AM)
- **Para quién:** Todos los padres y docentes
- **Contenido:** Recordatorio del feriado y que no habrá clases

### 2. Notificaciones de Reuniones
- **Cuándo:** Al programar la reunión
- **Para quién:** Padres según grados/secciones seleccionados
- **Contenido:** Detalles de la reunión (fecha, hora, descripción)

### 3. Notificaciones de Retiros
- **Cuándo:** Al autorizar/rechazar un retiro
- **Para quién:** Apoderado que solicitó el retiro
- **Contenido:** Estado del retiro y detalles

## 📊 Modelo de Base de Datos

```prisma
model Notificacion {
  idNotificacion Int       @id @default(autoincrement())
  idUsuario      Int       // Usuario que recibe la notificación
  titulo         String    // Título de la notificación
  mensaje        String    // Mensaje completo
  tipo           String    // FERIADO, REUNION, RETIRO, etc.
  leida          Boolean   @default(false)
  fechaEnvio     DateTime  @default(now())
  fechaLectura   DateTime?
  origen         String?   // Origen de la notificación
  usuario        Usuario   @relation(fields: [idUsuario], references: [idUsuario])
}
```

## 🔧 APIs Disponibles

### GET /api/notificaciones

Obtener notificaciones del usuario autenticado.

**Parámetros de consulta:**
- `soloNoLeidas` (boolean) - Solo notificaciones no leídas
- `limite` (number) - Límite de resultados
- `tipo` (string) - Filtrar por tipo
- `accion=contar` - Contar notificaciones no leídas

**Ejemplo:**
```typescript
// Obtener todas las notificaciones
const response = await fetch('/api/notificaciones', {
  headers: { 'Authorization': `Bearer ${token}` }
})

// Obtener solo no leídas
const response = await fetch('/api/notificaciones?soloNoLeidas=true', {
  headers: { 'Authorization': `Bearer ${token}` }
})

// Contar no leídas
const response = await fetch('/api/notificaciones?accion=contar', {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

**Respuesta:**
```json
{
  "success": true,
  "notificaciones": [
    {
      "id": 1,
      "titulo": "Recordatorio: Día de la Independencia",
      "mensaje": "Mañana jueves, 28 de julio de 2025 no habrá clases.",
      "tipo": "FERIADO",
      "leida": false,
      "fechaEnvio": "2025-07-27T08:00:00.000Z",
      "fechaLectura": null,
      "origen": "SISTEMA_AUTOMATICO"
    }
  ]
}
```

### PUT /api/notificaciones

Marcar notificaciones como leídas.

**Body:**
```json
{
  "accion": "marcarTodasLeidas"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Todas las notificaciones han sido marcadas como leídas",
  "actualizadas": 5
}
```

### PATCH /api/notificaciones/[id]

Marcar una notificación específica como leída.

**Ejemplo:**
```typescript
await fetch('/api/notificaciones/123', {
  method: 'PATCH',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ leida: true })
})
```

## 🎨 Componentes de UI

### 1. NotificationBell

Campana de notificaciones en el header.

**Características:**
- 🔴 Badge con contador de no leídas
- 🔔 Icono animado cuando hay nuevas
- 📋 Dropdown con lista de notificaciones
- ✅ Marcar como leída al hacer click

**Ubicación:** Header de la aplicación

**Uso:**
```tsx
import NotificationBell from '@/components/NotificationBell'

<NotificationBell />
```

### 2. NotificacionesPanel

Panel completo de notificaciones.

**Características:**
- 📊 Lista completa de notificaciones
- 🔍 Filtros por tipo y estado
- ✅ Marcar todas como leídas
- 🗑️ Eliminar notificaciones
- 📄 Paginación

**Ubicación:** Página dedicada de notificaciones

**Uso:**
```tsx
import NotificacionesPanel from '@/components/NotificacionesPanel'

<NotificacionesPanel />
```

### 3. NotificacionesBadge

Badge simple con contador.

**Características:**
- 🔴 Número de notificaciones no leídas
- 🎨 Estilos personalizables
- 🔄 Actualización automática

**Uso:**
```tsx
import NotificacionesBadge from '@/components/NotificacionesBadge'

<NotificacionesBadge count={5} />
```

## 📱 Flujo de Notificaciones

### Notificación de Feriado

```
1. Cron Job ejecuta a las 8:00 AM
   ↓
2. API verifica feriados de mañana
   ↓
3. Para cada padre y docente:
   a. Crea notificación en BD (SISTEMA)
   b. Envía SMS (si tiene teléfono)
   c. Envía Email (si tiene email)
   ↓
4. Usuario ve notificación en:
   - 🔔 Campana del header
   - 📧 Su correo electrónico
   - 💬 Su teléfono (SMS)
```

### Notificación de Reunión

```
1. Admin programa reunión
   ↓
2. API determina destinatarios según grados/secciones
   ↓
3. Para cada padre:
   a. Crea notificación en BD (SISTEMA)
   b. Envía SMS (si tiene teléfono)
   c. Envía Email (si tiene email)
   ↓
4. Padre ve notificación en:
   - 🔔 Campana del header
   - 📧 Su correo electrónico
   - 💬 Su teléfono (SMS)
```

## 🎯 Ejemplos de Código

### Crear Notificación Manualmente

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

await prisma.notificacion.create({
  data: {
    idUsuario: 123,
    titulo: "Título de la notificación",
    mensaje: "Mensaje completo de la notificación",
    tipo: "GENERAL",
    leida: false,
    origen: "SISTEMA_MANUAL"
  }
})
```

### Obtener Notificaciones No Leídas

```typescript
const notificaciones = await prisma.notificacion.findMany({
  where: {
    idUsuario: 123,
    leida: false
  },
  orderBy: {
    fechaEnvio: 'desc'
  },
  take: 10
})
```

### Marcar Como Leída

```typescript
await prisma.notificacion.update({
  where: {
    idNotificacion: 456
  },
  data: {
    leida: true,
    fechaLectura: new Date()
  }
})
```

### Contar No Leídas

```typescript
const count = await prisma.notificacion.count({
  where: {
    idUsuario: 123,
    leida: false
  }
})
```

## 🔄 Actualización en Tiempo Real

### Polling (Actual)

El sistema usa polling para actualizar notificaciones:

```typescript
// Cada 30 segundos
useEffect(() => {
  const interval = setInterval(() => {
    fetchNotificaciones()
  }, 30000)
  
  return () => clearInterval(interval)
}, [])
```

### WebSockets (Futuro)

Para notificaciones en tiempo real instantáneas:

```typescript
// Conectar a WebSocket
const ws = new WebSocket('ws://localhost:3000/notifications')

ws.onmessage = (event) => {
  const notificacion = JSON.parse(event.data)
  // Mostrar notificación inmediatamente
  mostrarNotificacion(notificacion)
}
```

## 🎨 Estilos de Notificaciones

### Por Tipo

```tsx
const estilosPorTipo = {
  FERIADO: {
    icono: '🎉',
    color: 'bg-red-100 text-red-800',
    borde: 'border-red-500'
  },
  REUNION: {
    icono: '👥',
    color: 'bg-purple-100 text-purple-800',
    borde: 'border-purple-500'
  },
  RETIRO: {
    icono: '🚪',
    color: 'bg-blue-100 text-blue-800',
    borde: 'border-blue-500'
  },
  GENERAL: {
    icono: '📢',
    color: 'bg-gray-100 text-gray-800',
    borde: 'border-gray-500'
  }
}
```

## 📊 Estadísticas de Notificaciones

### Dashboard de Admin

```typescript
// Total de notificaciones enviadas
const totalEnviadas = await prisma.notificacion.count()

// Por tipo
const porTipo = await prisma.notificacion.groupBy({
  by: ['tipo'],
  _count: true
})

// Tasa de lectura
const leidas = await prisma.notificacion.count({
  where: { leida: true }
})
const tasaLectura = (leidas / totalEnviadas) * 100
```

## ⚙️ Configuración

### Variables de Entorno

```env
# Email (Resend)
RESEND_API_KEY="re_xxxxxxxxxx"

# SMS (Twilio)
TWILIO_ACCOUNT_SID="ACxxxxxxxxxx"
TWILIO_AUTH_TOKEN="xxxxxxxxxx"
TWILIO_PHONE_NUMBER="+17657059154"

# Base de datos
DATABASE_URL="postgresql://..."
```

## 🚀 Mejoras Futuras

### 1. Notificaciones Push
- Usar Service Workers
- Notificaciones del navegador
- Soporte móvil

### 2. Preferencias de Usuario
- Elegir canales de notificación
- Horarios de silencio
- Tipos de notificaciones

### 3. Plantillas Personalizables
- Editor de plantillas
- Variables dinámicas
- Múltiples idiomas

### 4. Análisis y Reportes
- Tasa de apertura
- Tiempo de lectura
- Efectividad por canal

## ✅ Resumen

El sistema de notificaciones está **completamente implementado** con:

- ✅ **3 canales** - Sistema, Email, SMS
- ✅ **API completa** - GET, PUT, PATCH
- ✅ **Componentes UI** - Bell, Panel, Badge
- ✅ **Base de datos** - Modelo Notificacion
- ✅ **Tipos específicos** - Feriado, Reunión, Retiro
- ✅ **Notificaciones automáticas** - Feriados y Reuniones
- ✅ **Gestión completa** - Crear, leer, marcar como leída

**¡El sistema está listo para usar!** 🎉🔔
