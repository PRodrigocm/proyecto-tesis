# 🔧 Limpiar Estados Duplicados de Justificaciones

## Problema Detectado
Hay **2 estados de "Aprobada"** en la base de datos:
1. `APROBADO` (correcto) ✅
2. `APROBADA` (incorrecto, duplicado) ❌

Esto causa que:
- Aparezcan 2 botones de filtro "Aprobada"
- El badge se muestre en rojo en lugar de verde

## Solución Rápida

### Opción 1: Ejecutar desde la Consola del Navegador (RECOMENDADO)

1. **Inicia sesión como ADMINISTRADOR** en el sistema
2. **Abre la consola del navegador** (F12 → Console)
3. **Ejecuta este código:**

```javascript
// Obtener el token de autenticación
const token = localStorage.getItem('token')

// Llamar al endpoint de inicialización
fetch('/api/estados/justificacion/inicializar', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(response => response.json())
.then(data => {
  console.log('✅ Resultado:', data)
  alert('Estados limpiados correctamente. Recarga la página.')
  location.reload()
})
.catch(error => {
  console.error('❌ Error:', error)
  alert('Error al limpiar estados')
})
```

4. **Espera el mensaje de éxito**
5. **Recarga la página**

### Opción 2: Ejecutar desde Postman/Thunder Client

**Endpoint:** `POST http://localhost:3000/api/estados/justificacion/inicializar`

**Headers:**
```
Authorization: Bearer TU_TOKEN_AQUI
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Estados y tipos de justificación inicializados correctamente",
  "data": {
    "estadosActivos": 4,
    "estados": [
      { "codigo": "PENDIENTE", "nombre": "Pendiente" },
      { "codigo": "EN_REVISION", "nombre": "En Revisión" },
      { "codigo": "APROBADO", "nombre": "Aprobado" },
      { "codigo": "RECHAZADO", "nombre": "Rechazado" }
    ]
  }
}
```

## ¿Qué hace el endpoint?

1. **Desactiva estados incorrectos:**
   - `APROBADA` → desactivado
   - `RECHAZADA` → desactivado
   - `REQUIERE_DOCUMENTACION` → desactivado

2. **Asegura que existan los estados correctos:**
   - `PENDIENTE` ✅
   - `EN_REVISION` ✅ (pero filtrado en el frontend)
   - `APROBADO` ✅
   - `RECHAZADO` ✅

3. **Muestra logs detallados:**
   - Estados ANTES de limpiar
   - Estados DESPUÉS de limpiar

## Verificar que funcionó

Después de ejecutar el endpoint:

1. **Recargar la página de justificaciones**
2. **Verificar que solo haya 4 botones de filtro:**
   - 📋 Todos
   - ⏳ Pendiente
   - ✅ Aprobado (solo uno)
   - ❌ Rechazado

3. **Aprobar una justificación y verificar:**
   - Badge debe ser VERDE ✅
   - Texto debe decir "Aprobado"
   - No debe aparecer en rojo

## Si el problema persiste

### Verificar estados en la base de datos:

```sql
-- Ver todos los estados
SELECT * FROM EstadoJustificacion;

-- Ver solo estados activos
SELECT * FROM EstadoJustificacion WHERE activo = 1;

-- Desactivar manualmente estados incorrectos
UPDATE EstadoJustificacion 
SET activo = 0 
WHERE codigo IN ('APROBADA', 'RECHAZADA', 'REQUIERE_DOCUMENTACION');
```

### Verificar en Prisma Studio:

```bash
npx prisma studio
```

1. Ir a tabla `EstadoJustificacion`
2. Verificar que solo haya 4 estados activos
3. Desactivar manualmente los duplicados si es necesario

## Archivos Modificados

1. ✅ `src/lib/justificaciones-utils.ts` - Desactiva duplicados automáticamente
2. ✅ `src/app/api/estados/justificacion/inicializar/route.ts` - Logging mejorado
3. ✅ `src/components/docente/JustificacionesDocente.tsx` - Ya filtra EN_REVISION

## Resultado Esperado

Después de la limpieza:

**ANTES:**
```
Filtros: Todos | Pend. | Aprobada | ✅ Aprob. | Rech.
Badge: ❌ Aprobada (rojo)
```

**DESPUÉS:**
```
Filtros: Todos | Pend. | ✅ Aprob. | Rech.
Badge: ✅ Aprobado (verde)
```
