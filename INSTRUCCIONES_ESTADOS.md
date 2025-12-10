# Instrucciones para Inicializar Estados de Justificación

## Problema Resuelto
El error "El estado configurado no existe" ocurría porque los estados `APROBADO` y `RECHAZADO` no existían en la base de datos.

## Solución Implementada

### 1. Creación Automática de Estados
El sistema ahora **crea automáticamente** los estados faltantes cuando se intenta aprobar o rechazar una justificación.

**Estados que se crean automáticamente:**
- `PENDIENTE` - Pendiente
- `EN_REVISION` - En Revisión  
- `APROBADO` - Aprobado
- `RECHAZADO` - Rechazado

### 2. Endpoint de Inicialización Manual (Opcional)

Si necesitas inicializar todos los estados manualmente, puedes usar:

**Endpoint:** `POST /api/estados/justificacion/inicializar`

**Requisitos:**
- Token de autenticación de un usuario ADMINISTRATIVO
- Método: POST

**Ejemplo con cURL:**
```bash
curl -X POST http://localhost:3000/api/estados/justificacion/inicializar \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

**Ejemplo con JavaScript:**
```javascript
const token = localStorage.getItem('token')

fetch('/api/estados/justificacion/inicializar', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => console.log(data))
```

### 3. Verificar Estados Existentes

**Endpoint:** `GET /api/estados/justificacion`

Este endpoint devuelve todos los estados activos en la base de datos.

**Ejemplo:**
```javascript
const token = localStorage.getItem('token')

fetch('/api/estados/justificacion', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => {
  console.log('Estados disponibles:', data.data)
})
```

## Archivos Creados/Modificados

### Nuevos Archivos:
1. `src/lib/justificaciones-utils.ts` - Funciones de inicialización
2. `src/app/api/estados/justificacion/route.ts` - Endpoint para obtener estados
3. `src/app/api/estados/justificacion/inicializar/route.ts` - Endpoint para inicializar

### Archivos Modificados:
1. `src/app/api/justificaciones/[id]/revisar/route.ts` - Crea estados automáticamente
2. `src/app/api/justificaciones/[id]/aprobar/route.ts` - Crea estados automáticamente
3. `src/hooks/useJustificaciones.ts` - Mejora manejo de errores
4. `src/components/docente/JustificacionesDocente.tsx` - Usa estados dinámicos

## Flujo de Trabajo

1. **Primera vez que se aprueba/rechaza una justificación:**
   - El sistema verifica si el estado existe
   - Si no existe, lo crea automáticamente
   - Continúa con la operación normalmente

2. **Subsecuentes operaciones:**
   - Los estados ya existen
   - Las operaciones funcionan sin crear nuevos estados

## Notas Importantes

- ✅ Los estados se crean **automáticamente** cuando se necesitan
- ✅ No es necesario ejecutar scripts manualmente
- ✅ El sistema es **auto-reparable**
- ✅ Los errores son informativos y guían al usuario
- ✅ Solo usuarios ADMINISTRATIVO pueden inicializar manualmente

## Solución de Problemas

### Si el error persiste:

1. **Verificar que los estados existen:**
   ```sql
   SELECT * FROM EstadoJustificacion WHERE activo = 1;
   ```

2. **Inicializar manualmente desde la consola del navegador:**
   ```javascript
   // Como administrador
   const token = localStorage.getItem('token')
   fetch('/api/estados/justificacion/inicializar', {
     method: 'POST',
     headers: { 'Authorization': `Bearer ${token}` }
   }).then(r => r.json()).then(console.log)
   ```

3. **Verificar permisos de base de datos:**
   - Asegúrate de que el usuario de la BD tenga permisos de INSERT
   - Verifica que no haya restricciones de clave única

4. **Revisar logs del servidor:**
   - Busca mensajes como "⚠️ El estado X no existe"
   - Verifica si hay errores al crear estados
