# 🔄 Migración del Modelo de Reuniones

## 📋 Cambios Implementados

Se actualizó completamente el modelo de Reuniones para simplificar su estructura y hacerlo más flexible.

## 🆕 Nuevo Modelo de Reunión

### Estructura Actualizada:

```prisma
model Reunion {
  idReunion     Int                @id @default(autoincrement())
  idIe          Int
  titulo        String
  descripcion   String?
  fecha         DateTime           @db.Timestamptz(6)
  horaInicio    DateTime           @db.Time(6)
  horaFin       DateTime           @db.Time(6)
  tipo          TipoReunionEnum    @default(GENERAL)
  createdAt     DateTime           @default(now())
  updatedAt     DateTime?          @updatedAt

  // Relaciones
  ie            Ie
  grados        Grado[]            @relation("ReunionGrados")
  secciones     Seccion[]          @relation("ReunionSecciones")
}
```

### Enum de Tipos de Reunión:

```prisma
enum TipoReunionEnum {
  GENERAL              // Reunión general para todos
  ENTREGA_LIBRETAS     // Entrega de libretas de notas
  ASAMBLEA_PADRES      // Asamblea de padres de familia
  TUTORIAL             // Reunión tutorial/orientación
  EMERGENCIA           // Reunión de emergencia
  OTRO                 // Otros tipos de reunión
}
```

## 🔄 Cambios Principales

### ❌ Campos Eliminados:

- `idUsuarioResponsable` - Ya no se requiere usuario responsable
- `idGrado` - Reemplazado por relación many-to-many
- `idSeccion` - Reemplazado por relación many-to-many
- `metodoRegistro` - Eliminado (ya no necesario)
- `estado` - Eliminado (simplificación)

### ✅ Campos Nuevos/Modificados:

- `tipo` - Nuevo campo con tipos específicos de reunión
- `fecha` - Ahora es `Timestamptz` (incluye hora)
- `horaFin` - Ahora es obligatorio (antes opcional)
- `grados` - Relación many-to-many con Grado
- `secciones` - Relación many-to-many con Seccion

## 📊 Relaciones Many-to-Many

### Grados y Secciones:

Las reuniones ahora pueden estar asociadas a múltiples grados y secciones:

```typescript
// Ejemplo: Reunión para 1°, 2° y 3° grado, secciones A y B
{
  titulo: "Entrega de Libretas",
  tipo: "ENTREGA_LIBRETAS",
  grados: [1, 2, 3],      // IDs de grados
  secciones: [1, 2]       // IDs de secciones (A, B)
}
```

## 🗑️ Limpieza de Datos

### Script de Limpieza:

Se creó un script para eliminar todos los datos existentes de reuniones:

```bash
npm run cleanup:reuniones
```

**Ubicación:** `scripts/cleanup-reuniones.ts`

**Función:**
- Elimina todos los registros de la tabla `reunion`
- Prepara la base de datos para la nueva estructura
- Muestra conteo de registros eliminados

## 🚀 Pasos para Migrar

### ⚠️ IMPORTANTE: Orden de Ejecución

Debido a que la tabla `reuniones` tiene datos existentes (110 registros), debemos limpiarlos ANTES de ejecutar la migración.

### Opción 1: Limpieza Manual con SQL (Recomendado)

**1. Conectarse a PostgreSQL:**
```bash
psql -U postgres -d postgres
```

**2. Ejecutar limpieza:**
```sql
-- Cambiar al schema correcto
SET search_path TO "proyecto-1";

-- Eliminar todos los registros
DELETE FROM reuniones;

-- Verificar
SELECT COUNT(*) FROM reuniones;
-- Debe mostrar: 0
```

**3. Salir de PostgreSQL:**
```sql
\q
```

**4. Generar Cliente Prisma:**
```bash
npx prisma generate
```

**5. Ejecutar Migración:**
```bash
npx prisma migrate dev --name update-reunion-model
```

**6. Verificar en Prisma Studio:**
```bash
npm run prisma:studio
```

### Opción 2: Forzar Migración (Pérdida de Datos)

Si no te importa perder los datos de reuniones:

```bash
# 1. Generar cliente
npx prisma generate

# 2. Forzar migración (elimina y recrea tablas)
npx prisma migrate reset

# 3. Aplicar migración
npx prisma migrate dev --name update-reunion-model
```

⚠️ **ADVERTENCIA:** `prisma migrate reset` eliminará TODOS los datos de TODAS las tablas.

### Opción 3: Migración Gradual (Más Segura)

**1. Backup de la base de datos:**
```bash
pg_dump -U postgres -d postgres -n "proyecto-1" > backup_reuniones.sql
```

**2. Limpiar solo tabla reuniones:**
```bash
psql -U postgres -d postgres -c "DELETE FROM \"proyecto-1\".reuniones;"
```

**3. Ejecutar migración:**
```bash
npx prisma migrate dev --name update-reunion-model
```

**4. Si algo sale mal, restaurar:**
```bash
psql -U postgres -d postgres < backup_reuniones.sql
```

## 📝 Ejemplos de Uso

### Crear Reunión General:

```typescript
await prisma.reunion.create({
  data: {
    idIe: 1,
    titulo: "Reunión General de Padres",
    descripcion: "Reunión informativa sobre el año escolar",
    fecha: new Date("2025-11-15T15:00:00"),
    horaInicio: new Date("1970-01-01T15:00:00"),
    horaFin: new Date("1970-01-01T17:00:00"),
    tipo: "GENERAL",
    grados: {
      connect: [{ idGrado: 1 }, { idGrado: 2 }, { idGrado: 3 }]
    },
    secciones: {
      connect: [{ idSeccion: 1 }, { idSeccion: 2 }]
    }
  }
})
```

### Crear Entrega de Libretas:

```typescript
await prisma.reunion.create({
  data: {
    idIe: 1,
    titulo: "Entrega de Libretas - Primer Bimestre",
    descripcion: "Entrega de libretas de notas del primer bimestre",
    fecha: new Date("2025-12-20T14:00:00"),
    horaInicio: new Date("1970-01-01T14:00:00"),
    horaFin: new Date("1970-01-01T18:00:00"),
    tipo: "ENTREGA_LIBRETAS",
    grados: {
      connect: [{ idGrado: 4 }]
    },
    secciones: {
      connect: [{ idSeccion: 1 }]
    }
  }
})
```

### Consultar Reuniones con Grados y Secciones:

```typescript
const reuniones = await prisma.reunion.findMany({
  where: {
    idIe: 1,
    fecha: {
      gte: new Date()
    }
  },
  include: {
    grados: true,
    secciones: true,
    ie: true
  },
  orderBy: {
    fecha: 'asc'
  }
})
```

## 🎯 Tipos de Reunión

### GENERAL:
- Reuniones para todos los grados y secciones
- Asambleas generales
- Eventos institucionales

### ENTREGA_LIBRETAS:
- Entrega de libretas de notas
- Por bimestre/trimestre
- Puede ser por grado específico

### ASAMBLEA_PADRES:
- Asambleas de padres de familia
- Elección de representantes
- Temas específicos por grado

### TUTORIAL:
- Reuniones de orientación
- Tutorías grupales
- Charlas educativas

### EMERGENCIA:
- Reuniones urgentes
- Comunicados importantes
- Situaciones especiales

### OTRO:
- Cualquier otro tipo de reunión
- Eventos especiales
- Reuniones no categorizadas

## 🔧 API Endpoints Afectados

Los siguientes endpoints necesitarán actualizarse:

- `POST /api/reuniones` - Crear reunión
- `GET /api/reuniones` - Listar reuniones
- `PUT /api/reuniones/[id]` - Actualizar reunión
- `DELETE /api/reuniones/[id]` - Eliminar reunión

## ⚠️ Notas Importantes

1. **Datos Antiguos:** Todos los datos de reuniones existentes serán eliminados
2. **Relaciones:** Las relaciones many-to-many requieren uso de `connect` en Prisma
3. **Fecha:** El campo `fecha` ahora incluye la hora (Timestamptz)
4. **Hora Fin:** Ahora es obligatorio especificar hora de fin

## ✅ Beneficios del Nuevo Modelo

- ✅ **Más Simple:** Menos campos, más fácil de usar
- ✅ **Más Flexible:** Relaciones many-to-many con grados y secciones
- ✅ **Tipos Claros:** Enum específico para tipos de reunión
- ✅ **Mejor Organización:** Estructura más limpia y mantenible
- ✅ **Escalable:** Fácil agregar nuevos tipos de reunión

## 📚 Documentación Adicional

Para más información sobre las relaciones many-to-many en Prisma:
- [Prisma Relations](https://www.prisma.io/docs/concepts/components/prisma-schema/relations)
- [Many-to-Many Relations](https://www.prisma.io/docs/concepts/components/prisma-schema/relations/many-to-many-relations)
