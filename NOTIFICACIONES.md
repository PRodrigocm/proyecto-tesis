# Sistema de Notificaciones

Este documento describe el sistema de notificaciones implementado en el proyecto, que permite enviar y gestionar notificaciones a los usuarios del sistema.

## Características Principales

- **Notificaciones en tiempo real**: Sistema para enviar notificaciones a usuarios específicos
- **Múltiples tipos**: Soporte para diferentes tipos de notificaciones (INFO, ALERTA, RETIRO, ASISTENCIA, etc.)
- **Estado de lectura**: Control de notificaciones leídas y no leídas
- **Notificaciones masivas**: Capacidad de enviar notificaciones a múltiples usuarios
- **Limpieza automática**: Funcionalidad para limpiar notificaciones antiguas
- **API REST completa**: Endpoints para gestionar notificaciones

## Modelo de Datos

### Tabla `notificaciones`

```sql
CREATE TABLE notificaciones (
  id_notificacion SERIAL PRIMARY KEY,
  id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario),
  titulo VARCHAR NOT NULL,
  mensaje TEXT NOT NULL,
  tipo VARCHAR NOT NULL, -- INFO, ALERTA, JUSTIFICACION, RETIRO, ASISTENCIA, etc.
  leida BOOLEAN DEFAULT FALSE,
  fecha_envio TIMESTAMPTZ DEFAULT NOW(),
  fecha_lectura TIMESTAMPTZ,
  origen VARCHAR -- Módulo que generó la notificación
);

CREATE INDEX idx_notificaciones_usuario_leida ON notificaciones(id_usuario, leida);
```

## Tipos de Notificaciones

- **INFO**: Información general del sistema
- **ALERTA**: Alertas importantes que requieren atención
- **JUSTIFICACION**: Notificaciones relacionadas con justificaciones
- **RETIRO**: Notificaciones sobre retiros de estudiantes
- **ASISTENCIA**: Notificaciones sobre asistencias y tardanzas
- **SISTEMA**: Notificaciones del sistema (mantenimiento, actualizaciones)
- **RECORDATORIO**: Recordatorios de tareas pendientes

## API Endpoints

### GET `/api/notificaciones`

Obtiene las notificaciones del usuario autenticado.

**Parámetros de consulta:**
- `soloNoLeidas` (boolean): Solo notificaciones no leídas
- `limite` (number): Límite de resultados
- `tipo` (string): Filtrar por tipo de notificación
- `accion=contar`: Contar notificaciones no leídas

**Respuesta:**
```json
{
  "success": true,
  "notificaciones": [
    {
      "id": 1,
      "titulo": "Nueva solicitud de retiro",
      "mensaje": "Se ha creado una solicitud de retiro para Juan Pérez",
      "tipo": "RETIRO",
      "leida": false,
      "fechaEnvio": "2024-10-13T15:30:00Z",
      "fechaLectura": null,
      "origen": "Módulo de Retiros"
    }
  ]
}
```

### PUT `/api/notificaciones`

Acciones masivas sobre notificaciones.

**Body:**
```json
{
  "accion": "marcarTodasLeidas"
}
```

### PUT `/api/notificaciones/[id]`

Marca una notificación específica como leída.

### DELETE `/api/notificaciones/[id]`

Elimina una notificación específica.

## Utilidades de Notificaciones

### Funciones Principales

```typescript
// Crear una notificación
await crearNotificacion({
  idUsuario: 123,
  titulo: "Título de la notificación",
  mensaje: "Mensaje detallado",
  tipo: "INFO",
  origen: "Mi Módulo"
})

// Crear notificaciones masivas
await crearNotificacionMasiva(
  [123, 456, 789], // IDs de usuarios
  {
    titulo: "Notificación masiva",
    mensaje: "Mensaje para todos",
    tipo: "SISTEMA"
  }
)

// Obtener notificaciones de un usuario
const notificaciones = await obtenerNotificacionesUsuario(123, {
  soloNoLeidas: true,
  limite: 10
})

// Marcar como leída
await marcarComoLeida(456)

// Marcar todas como leídas
await marcarTodasComoLeidas(123)

// Contar no leídas
const count = await contarNotificacionesNoLeidas(123)
```

### Notificaciones Específicas por Módulo

#### Módulo de Retiros
```typescript
import { notificacionesRetiro } from '@/lib/notificaciones-utils'

// Solicitud creada
await notificacionesRetiro.solicitudCreada(idUsuario, "Juan Pérez", "2024-10-15")

// Retiro aprobado
await notificacionesRetiro.retiroAprobado(idUsuario, "Juan Pérez", "2024-10-15")

// Retiro rechazado
await notificacionesRetiro.retiroRechazado(idUsuario, "Juan Pérez", "2024-10-15", "Documentación incompleta")
```

#### Módulo de Asistencias
```typescript
import { notificacionesAsistencia } from '@/lib/notificaciones-utils'

// Inasistencia registrada
await notificacionesAsistencia.inasistenciaRegistrada(idUsuario, "Juan Pérez", "2024-10-15")

// Tardanza registrada
await notificacionesAsistencia.tardanzaRegistrada(idUsuario, "Juan Pérez", "2024-10-15", "08:15")
```

#### Módulo de Justificaciones
```typescript
import { notificacionesJustificacion } from '@/lib/notificaciones-utils'

// Justificación presentada
await notificacionesJustificacion.justificacionPresentada(idUsuario, "Juan Pérez", "15-16 Oct 2024")

// Justificación aprobada
await notificacionesJustificacion.justificacionAprobada(idUsuario, "Juan Pérez", "15-16 Oct 2024")

// Justificación rechazada
await notificacionesJustificacion.justificacionRechazada(idUsuario, "Juan Pérez", "15-16 Oct 2024", "Documentos insuficientes")
```

## Scripts de Gestión

### Inicializar Notificaciones de Prueba
```bash
npm run init:notificaciones-test
```

Este script crea notificaciones de prueba para usuarios existentes en la base de datos.

### Limpieza de Notificaciones Antiguas
```typescript
import { limpiarNotificacionesAntiguas } from '@/lib/notificaciones-utils'

// Limpiar notificaciones leídas de más de 30 días
await limpiarNotificacionesAntiguas(30)
```

## Integración con Otros Módulos

### En el Módulo de Retiros

```typescript
// En src/app/api/apoderados/retiros/solicitar/route.ts
import { notificacionesRetiro } from '@/lib/notificaciones-utils'

// Después de crear el retiro
await notificacionesRetiro.solicitudCreada(
  decoded.userId,
  `${estudiante.usuario.apellido}, ${estudiante.usuario.nombre}`,
  nuevoRetiro.fecha.toISOString().split('T')[0]
)
```

### En el Módulo de Asistencias

```typescript
// En el registro de asistencias
import { notificacionesAsistencia } from '@/lib/notificaciones-utils'

// Si es tardanza
if (estadoAsistencia.codigo === 'TARDANZA') {
  // Obtener apoderados del estudiante
  const apoderados = await obtenerApoderadosDelEstudiante(idEstudiante)
  
  for (const apoderado of apoderados) {
    await notificacionesAsistencia.tardanzaRegistrada(
      apoderado.idUsuario,
      nombreEstudiante,
      fecha,
      hora
    )
  }
}
```

## Consideraciones de Rendimiento

1. **Índices**: Se han creado índices en `(id_usuario, leida)` para optimizar consultas frecuentes
2. **Limpieza**: Implementar limpieza periódica de notificaciones antiguas
3. **Paginación**: Usar límites en las consultas para evitar cargar demasiadas notificaciones
4. **Cache**: Considerar implementar cache para el conteo de notificaciones no leídas

## Seguridad

- **Autenticación**: Todos los endpoints requieren token JWT válido
- **Autorización**: Los usuarios solo pueden ver/modificar sus propias notificaciones
- **Validación**: Validación de parámetros en todos los endpoints
- **Sanitización**: Los mensajes se almacenan como texto plano (sin HTML)

## Próximas Mejoras

1. **Notificaciones Push**: Implementar notificaciones push para navegadores
2. **Plantillas**: Sistema de plantillas para notificaciones
3. **Configuración de Usuario**: Permitir a usuarios configurar qué notificaciones recibir
4. **Notificaciones por Email**: Integración con servicio de email
5. **Dashboard de Administración**: Panel para administradores para enviar notificaciones masivas
6. **Websockets**: Notificaciones en tiempo real usando WebSockets
