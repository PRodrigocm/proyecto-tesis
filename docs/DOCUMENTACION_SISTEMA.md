# Documentación del Sistema de Gestión Escolar

## Índice
1. [Tablas y Componentes](#tablas-y-componentes)
2. [Funcionalidades Principales](#funcionalidades-principales)
3. [APIs y Endpoints](#apis-y-endpoints)

---

## Tablas y Componentes

### 1. DocentesTable (`src/components/admin/DocentesTable.tsx`)
**Propósito:** Muestra la lista de docentes de la institución educativa.

**Columnas:**
| Columna | Descripción |
|---------|-------------|
| Docente | Avatar con iniciales, nombre completo y DNI |
| Especialidad | Área de especialización e institución educativa |
| Contacto | Email y teléfono del docente |
| Aulas Asignadas | Badges con las aulas asignadas (máx 3 visibles + indicador "+X más") |
| Estado | Badge ACTIVO (verde) o INACTIVO (gris) |
| Acciones | Botones: Ver (ojo), Editar (lápiz), Activar/Desactivar |

**Props:**
```typescript
interface DocentesTableProps {
  docentes: Docente[]           // Lista de docentes a mostrar
  onView: (docente) => void     // Callback al hacer clic en "Ver"
  onEdit: (docente) => void     // Callback al hacer clic en "Editar"
  onEstadoChange: (id, estado) => void  // Callback para cambiar estado
}
```

**Funcionamiento:**
1. Si no hay docentes, muestra mensaje vacío con icono
2. Renderiza una fila por cada docente
3. Las asignaciones se muestran como badges azules
4. Los botones de acción tienen tooltips y efectos hover

---

### 2. RetirosTable (`src/components/admin/RetirosTable.tsx`)
**Propósito:** Muestra la lista de retiros de estudiantes.

**Columnas:**
| Columna | Descripción |
|---------|-------------|
| Estudiante | Nombre, DNI, grado y sección |
| Fecha/Hora | Fecha del retiro y hora programada |
| Motivo | Tipo de retiro (médico, familiar, etc.) |
| Persona que Recoge | Nombre y DNI de quien retira |
| Estado | PENDIENTE (amarillo), AUTORIZADO (verde), RECHAZADO (rojo) |
| Acciones | Ver, Editar, Autorizar/Rechazar, Eliminar |

**Estados del Retiro:**
- `PENDIENTE`: Esperando autorización del apoderado
- `AUTORIZADO`: Aprobado, estudiante puede ser retirado
- `RECHAZADO`: Denegado por el apoderado

---

### 3. EstudiantesTable (`src/components/admin/EstudiantesTable.tsx`)
**Propósito:** Gestión de estudiantes matriculados.

**Columnas:**
| Columna | Descripción |
|---------|-------------|
| Estudiante | Foto/avatar, nombre completo, DNI |
| Grado/Sección | Aula asignada |
| Apoderado | Nombre del apoderado principal |
| Contacto | Teléfono y email |
| Estado | ACTIVO/INACTIVO |
| Acciones | Ver, Editar, Generar QR |

---

### 4. AsistenciaTable (Docente) (`src/app/docente/asistencias/page.tsx`)
**Propósito:** Registro y verificación de asistencia por el docente.

**Columnas:**
| Columna | Descripción |
|---------|-------------|
| # | Número de orden |
| Estudiante | Nombre y DNI |
| Estado | PRESENTE, TARDANZA, AUSENTE, JUSTIFICADO, o botón "Verificar" |
| Hora | Hora de llegada o ingreso a IE |
| Acciones | Verificar asistencia (si está pendiente) |

**Estados de Asistencia:**
- `PRESENTE` (verde): Llegó a tiempo
- `TARDANZA` (amarillo): Llegó tarde pero dentro de tolerancia
- `AUSENTE` (rojo): No asistió
- `JUSTIFICADO` (azul): Falta justificada
- `PENDIENTE_VERIFICACION` (morado): Requiere verificación del docente

---

## Funcionalidades Principales

### 1. Toma de Asistencia

#### Flujo de Asistencia por QR (Portería)
```
1. Estudiante escanea QR en portería
   └── API: POST /api/porteria/registro-entrada
       └── Registra hora de ingreso a IE
       └── Crea registro en RegistroPorteria

2. Docente abre lista de asistencia
   └── API: GET /api/docentes/asistencia/precargada
       └── Obtiene estudiantes con registro de portería
       └── Marca como "pendiente verificación"

3. Docente verifica presencia en aula
   └── API: POST /api/docentes/asistencia/verificar
       └── Confirma o rechaza la asistencia
       └── Determina estado: PRESENTE o TARDANZA según hora
```

#### Flujo de Asistencia Manual
```
1. Docente escanea QR del estudiante en aula
   └── API: POST /api/docentes/asistencia/tomar
       └── Valida que estudiante pertenece a la IE
       └── Valida que docente tiene asignada el aula
       └── Registra asistencia con hora actual
       └── Envía notificación al apoderado
```

**Código clave (`/api/docentes/asistencia/tomar`):**
```typescript
// Determinar estado según hora
const horaActual = new Date()
const horaClase = new Date(clase.horaInicio)
const tolerancia = clase.toleranciaMinutos || 10

if (horaActual <= horaClase + tolerancia) {
  estado = 'PRESENTE'
} else {
  estado = 'TARDANZA'
}
```

---

### 2. Sistema de Retiros

#### Flujo de Creación de Retiro
```
1. Administrativo/Docente crea solicitud de retiro
   └── API: POST /api/retiros
       └── Valida estudiante y fecha
       └── Crea retiro con estado PENDIENTE
       └── Notifica al apoderado

2. Apoderado recibe notificación
   └── Puede autorizar o rechazar desde su app

3. Apoderado autoriza/rechaza
   └── API: POST /api/retiros/autorizar
       └── Actualiza estado del retiro
       └── Si autorizado, actualiza asistencia del día
```

**Campos del Retiro:**
```typescript
{
  estudianteId: string      // ID del estudiante
  fecha: string             // Fecha del retiro (YYYY-MM-DD)
  horaRetiro: string        // Hora programada (HH:MM)
  motivo: string            // Tipo de retiro
  personaRecoge: string     // Nombre de quien retira
  dniPersonaRecoge: string  // DNI de quien retira
  observaciones: string     // Notas adicionales
}
```

**Impacto en Asistencia:**
- Retiro antes de 8:30 AM → INASISTENCIA
- Retiro entre 8:30 AM y 10:00 AM → TARDANZA
- Retiro después de 10:00 AM → PRESENTE (asistencia parcial)

---

### 3. Justificaciones

#### Flujo de Justificación
```
1. Apoderado solicita justificación
   └── API: POST /api/justificaciones
       └── Adjunta documentos (certificado médico, etc.)
       └── Estado inicial: PENDIENTE

2. Administrativo revisa solicitud
   └── API: PUT /api/justificaciones/[id]
       └── Aprueba o rechaza
       └── Si aprueba, actualiza asistencia a JUSTIFICADO
```

**Estados de Justificación:**
- `PENDIENTE`: En espera de revisión
- `APROBADA`: Justificación aceptada
- `RECHAZADA`: Justificación denegada

---

### 4. Notificaciones

#### Tipos de Notificaciones
| Evento | Destinatario | Canal |
|--------|--------------|-------|
| Asistencia registrada | Apoderado | Email/Push |
| Tardanza detectada | Apoderado | Email/Push |
| Inasistencia | Apoderado | Email/Push |
| Retiro solicitado | Apoderado | Email/Push |
| Retiro autorizado | Docente/Admin | Sistema |

**Implementación (`/lib/notifications.ts`):**
```typescript
// Enviar notificación de asistencia
await enviarNotificacionAsistencia({
  estudianteId,
  estado: 'PRESENTE' | 'TARDANZA' | 'AUSENTE',
  hora: horaLlegada,
  apoderadoEmail
})
```

---

### 5. Reportes

#### Tipos de Reportes Disponibles

**1. Reporte de Asistencia por Aula**
- Endpoint: `GET /api/reportes/asistencia`
- Parámetros: `gradoSeccionId`, `fechaInicio`, `fechaFin`
- Muestra: Porcentaje de asistencia, tardanzas, faltas por estudiante

**2. Reporte de Retiros**
- Endpoint: `GET /api/reportes/retiros`
- Parámetros: `ieId`, `fechaInicio`, `fechaFin`
- Muestra: Cantidad de retiros por tipo, estado, estudiante

**3. Reporte Individual de Estudiante**
- Endpoint: `GET /api/reportes/estudiante/[id]`
- Muestra: Historial completo de asistencias, retiros, justificaciones

**Estructura de Respuesta:**
```typescript
{
  resumen: {
    totalDias: number,
    diasPresente: number,
    diasTardanza: number,
    diasAusente: number,
    diasJustificado: number,
    porcentajeAsistencia: number
  },
  detalle: [
    { fecha, estado, horaLlegada, observaciones }
  ]
}
```

---

## APIs y Endpoints

### Docentes
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/docentes` | Lista docentes de la IE |
| POST | `/api/docentes` | Crear nuevo docente |
| GET | `/api/docentes/[id]` | Obtener docente por ID |
| PUT | `/api/docentes/[id]` | Actualizar docente |
| PATCH | `/api/docentes?id=X` | Cambiar estado (ACTIVO/INACTIVO) |

### Asistencia
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/docentes/asistencia/precargada` | Obtener asistencia precargada |
| POST | `/api/docentes/asistencia/tomar` | Registrar asistencia por QR |
| POST | `/api/docentes/asistencia/verificar` | Verificar asistencia en aula |
| POST | `/api/docentes/asistencia/validar` | Validar presencia de estudiante |

### Retiros
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/retiros` | Lista retiros (filtros: fecha, grado, estado) |
| POST | `/api/retiros` | Crear solicitud de retiro |
| PUT | `/api/retiros/[id]` | Modificar retiro |
| DELETE | `/api/retiros/[id]` | Eliminar retiro |
| POST | `/api/retiros/autorizar` | Autorizar/Rechazar retiro |

### Estudiantes
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/estudiantes` | Lista estudiantes de la IE |
| POST | `/api/estudiantes` | Crear estudiante |
| GET | `/api/estudiantes/[id]` | Obtener estudiante |
| PUT | `/api/estudiantes/[id]` | Actualizar estudiante |

---

## Filtros y Búsqueda

### Filtros de Docentes (`useDocentes.ts`)
```typescript
interface DocentesFilters {
  searchTerm: string        // Busca en nombre, apellido, email, DNI, especialidad
  filterEstado: 'TODOS' | 'ACTIVO' | 'INACTIVO'
  filterGrado: string       // Filtra por grado asignado
  filterSeccion: string     // Filtra por sección asignada
}
```

### Filtros de Retiros (`useRetiros.ts`)
```typescript
interface RetirosFilters {
  fecha: string             // Fecha específica (YYYY-MM-DD)
  grado: string             // Filtrar por grado
  estado: 'TODOS' | 'PENDIENTE' | 'AUTORIZADO' | 'RECHAZADO'
  searchTerm: string        // Busca en nombre, apellido, DNI del estudiante
}
```

---

## Notas Técnicas

### Manejo de Fechas
- Las fechas se envían como strings `YYYY-MM-DD`
- El backend las parsea con hora local (`T12:00:00`) para evitar problemas de zona horaria
- Perú usa UTC-5, por lo que sin este ajuste las fechas pueden aparecer un día antes

### Autenticación
- Se usa JWT para autenticación
- El token contiene: `userId`, `ieId`, `rol`
- Se envía en header: `Authorization: Bearer <token>`

### Validaciones Importantes
1. **Asistencia**: El estudiante debe pertenecer a la misma IE del docente
2. **Retiros**: Solo el apoderado puede autorizar
3. **Docentes**: Pueden tener múltiples aulas asignadas (relación N:M via DocenteAula)
