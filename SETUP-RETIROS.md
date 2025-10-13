# Configuración del Sistema de Retiros

Este documento explica cómo configurar correctamente el sistema de retiros después de los cambios realizados para corregir los errores de Prisma.

## Problema Identificado

El sistema tenía errores porque:
1. El modelo `Retiro` no tiene un campo `estado` directo, sino `idEstadoRetiro`
2. Faltaban datos básicos en las tablas de estados y tipos de retiro
3. Los apoderados sin estudiantes asociados causaban arrays vacíos en las consultas

## Solución Implementada

### 1. Utilidades Creadas

Se creó el archivo `src/lib/retiros-utils.ts` con funciones utilitarias:
- `getEstudiantesDelApoderado()`: Obtiene estudiantes de un apoderado
- `getEstadosRetiroIds()`: Obtiene IDs de estados por códigos
- `puedeGestionarEstudiante()`: Verifica permisos de gestión
- `inicializarEstadosRetiro()`: Crea estados básicos si no existen
- `inicializarTiposRetiro()`: Crea tipos básicos si no existen

### 2. Script de Inicialización

Se creó `scripts/init-retiros-data.ts` que inicializa:

**Estados de Retiro:**
- SOLICITADO
- EN_REVISION  
- APROBADO
- RECHAZADO
- EN_PROCESO
- COMPLETADO
- CANCELADO

**Tipos de Retiro:**
- Retiro Médico
- Retiro Familiar
- Retiro Personal
- Retiro de Emergencia
- Cita Médica
- Trámite Personal
- Otro

**Estados de Asistencia:**
- PRESENTE
- TARDANZA
- INASISTENCIA
- JUSTIFICADA
- EXCUSADA

**Tipos y Estados de Justificación:**
- Tipos: MEDICA, FAMILIAR, PERSONAL, ACADEMICA, OTRO
- Estados: PENDIENTE, APROBADA, RECHAZADA, VENCIDA, REQUIERE_DOCS

## Pasos para Configurar

### 1. Ejecutar el Script de Inicialización

```bash
npm run init:retiros-data
```

Este comando:
- Crea todos los estados y tipos necesarios
- No duplica datos existentes (usa `upsert`)
- Es seguro ejecutar múltiples veces

### 2. Verificar la Base de Datos

Después de ejecutar el script, verifica que se crearon los datos:

```bash
npm run prisma:studio
```

Revisa las tablas:
- `estados_retiro`
- `tipo_retiro`
- `estados_asistencia`
- `tipos_justificacion`
- `estados_justificacion`

### 3. Asociar Estudiantes a Apoderados

Asegúrate de que los apoderados tengan estudiantes asociados en la tabla `estudiante_apoderado`:

```sql
-- Ejemplo de inserción
INSERT INTO estudiante_apoderado (id_estudiante, id_apoderado, es_titular, parentesco)
VALUES (1, 1, true, 'PADRE');
```

## Archivos Modificados

### APIs Corregidas:
- `src/app/api/apoderados/retiros/pendientes/route.ts`
- `src/app/api/apoderados/estadisticas/route.ts`

### Cambios Principales:
1. **Uso de `idEstadoRetiro`** en lugar de `estado`
2. **Validación de arrays vacíos** antes de consultas
3. **Inicialización automática** de datos básicos
4. **Manejo de campos opcionales** con operador `?.`

## Estructura de Respuesta Actualizada

### Retiros Pendientes:
```json
{
  "success": true,
  "retiros": [
    {
      "id": "1",
      "fecha": "2024-10-09",
      "hora": "14:30",
      "observaciones": "Cita médica",
      "tipoRetiro": "Retiro Médico",
      "estado": "Solicitado",
      "estadoCodigo": "SOLICITADO",
      "estudiante": {
        "id": "1",
        "nombre": "Juan",
        "apellido": "Pérez",
        "dni": "12345678",
        "grado": "1ro",
        "seccion": "A"
      },
      "fechaSolicitud": "2024-10-09T10:00:00.000Z",
      "origen": "Sistema"
    }
  ]
}
```

## Próximos Pasos

1. **Ejecutar el script de inicialización**
2. **Verificar que los apoderados tengan estudiantes asociados**
3. **Probar las APIs corregidas**
4. **Corregir otros archivos con errores similares** (si los hay)

## Notas Importantes

- El script es **idempotente**: se puede ejecutar múltiples veces sin problemas
- Las **utilidades** manejan automáticamente casos de arrays vacíos
- Los **campos opcionales** están protegidos con el operador `?.`
- La **inicialización automática** asegura que siempre existan los datos básicos
