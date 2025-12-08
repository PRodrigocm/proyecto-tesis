# 📚 DOCUMENTACIÓN TÉCNICA COMPLETA DEL SISTEMA

## Índice
1. [Arquitectura General](#1-arquitectura-general)
2. [Base de Datos - Tablas y Relaciones](#2-base-de-datos---tablas-y-relaciones)
3. [APIs por Panel/Rol](#3-apis-por-panelrol)
4. [Métodos HTTP y Operaciones](#4-métodos-http-y-operaciones)
5. [Servicios y Hooks del Frontend](#5-servicios-y-hooks-del-frontend)
6. [Flujos de Datos](#6-flujos-de-datos)

---

## 1. Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │  Admin   │ │ Docente  │ │Apoderado │ │ Auxiliar │           │
│  │  Panel   │ │  Panel   │ │  Panel   │ │  Panel   │           │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘           │
│       │            │            │            │                   │
│       └────────────┴────────────┴────────────┘                   │
│                          │                                       │
│                    ┌─────┴─────┐                                 │
│                    │  Hooks &  │                                 │
│                    │ Services  │                                 │
│                    └─────┬─────┘                                 │
└──────────────────────────┼───────────────────────────────────────┘
                           │ HTTP (fetch)
┌──────────────────────────┼───────────────────────────────────────┐
│                    BACKEND (API Routes)                          │
│                    ┌─────┴─────┐                                 │
│                    │   /api/*  │                                 │
│                    └─────┬─────┘                                 │
│                          │                                       │
│                    ┌─────┴─────┐                                 │
│                    │  Prisma   │                                 │
│                    │   ORM     │                                 │
│                    └─────┬─────┘                                 │
└──────────────────────────┼───────────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────────┐
│                    ┌─────┴─────┐                                 │
│                    │PostgreSQL │                                 │
│                    │    DB     │                                 │
│                    └───────────┘                                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Base de Datos - Tablas y Relaciones

### 2.1 Tablas de Estructura Institucional

| Tabla | Descripción | Campos Clave |
|-------|-------------|--------------|
| `modalidad` | Tipos de modalidad educativa | `idModalidad`, `nombre` |
| `ie` | Instituciones Educativas | `idIe`, `nombre`, `codigoIe`, `idModalidad` |
| `nivel` | Niveles educativos (Primaria, Secundaria) | `idNivel`, `idIe`, `nombre` |
| `grado` | Grados por nivel | `idGrado`, `idNivel`, `nombre` |
| `seccion` | Secciones (A, B, C...) | `idSeccion`, `nombre` |
| `grado_seccion` | Combinación grado-sección | `idGradoSeccion`, `idGrado`, `idSeccion` |

**Relaciones:**
```
Modalidad 1──N Ie 1──N Nivel 1──N Grado 1──N GradoSeccion N──1 Seccion
```

### 2.2 Tablas de Usuarios y Roles

| Tabla | Descripción | Campos Clave |
|-------|-------------|--------------|
| `usuarios` | Todos los usuarios del sistema | `idUsuario`, `dni`, `email`, `passwordHash`, `estado`, `idIe` |
| `roles` | Roles disponibles | `idRol`, `nombre` (ADMINISTRATIVO, DOCENTE, APODERADO, AUXILIAR, ESTUDIANTE) |
| `usuario_rol` | Relación usuario-rol | `idUsuario`, `idRol` |
| `estudiante` | Datos específicos de estudiantes | `idEstudiante`, `idUsuario`, `idGradoSeccion`, `codigoQR` |
| `apoderado` | Datos específicos de apoderados | `idApoderado`, `idUsuario`, `codigo` |
| `docente` | Datos específicos de docentes | `idDocente`, `idUsuario`, `codigo`, `especialidad` |

**Relaciones:**
```
Usuario 1──1 Estudiante
Usuario 1──1 Apoderado
Usuario 1──1 Docente
Usuario N──N Rol (via usuario_rol)
```

### 2.3 Tablas de Asignaciones

| Tabla | Descripción | Campos Clave |
|-------|-------------|--------------|
| `estudiante_apoderado` | Relación estudiante-apoderado | `idEstudiante`, `idApoderado`, `relacion`, `esTitular`, `puedeRetirar` |
| `docente_aula` | Asignación docente a aulas | `idDocenteAula`, `idDocente`, `idGradoSeccion`, `idTipoAsignacion` |
| `tipos_asignacion` | Tipos de asignación docente | `idTipoAsignacion`, `nombre` (TUTOR, AUXILIAR, etc.) |

### 2.4 Tablas de Asistencia

| Tabla | Descripción | Campos Clave |
|-------|-------------|--------------|
| `asistencias` | Asistencia por clase/horario | `idAsistencia`, `idEstudiante`, `idHorarioClase`, `fecha`, `idEstadoAsistencia`, `horaRegistro` |
| `asistencia_ie` | Asistencia a la institución (entrada/salida) | `idAsistenciaIE`, `idEstudiante`, `idIe`, `fecha`, `horaIngreso`, `horaSalida`, `estado` |
| `estados_asistencia` | Estados posibles | `idEstadoAsistencia`, `codigo`, `nombreEstado` (PRESENTE, TARDANZA, AUSENTE, JUSTIFICADO) |
| `historico_estados_asistencia` | Historial de cambios de estado | `idHistorico`, `idAsistencia`, `idEstadoAsistencia`, `fechaCambio`, `cambiadoPor` |

**Estados de Asistencia:**
- `PRESENTE` - Estudiante presente
- `TARDANZA` - Llegó tarde
- `AUSENTE` - No asistió
- `JUSTIFICADO` - Ausencia justificada

### 2.5 Tablas de Justificaciones

| Tabla | Descripción | Campos Clave |
|-------|-------------|--------------|
| `justificaciones` | Justificaciones de inasistencias | `idJustificacion`, `idEstudiante`, `idTipoJustificacion`, `idEstadoJustificacion`, `fechaInicio`, `fechaFin`, `motivo` |
| `tipos_justificacion` | Tipos de justificación | `idTipoJustificacion`, `codigo`, `nombre` (MEDICA, FAMILIAR, EMERGENCIA) |
| `estados_justificacion` | Estados de justificación | `idEstadoJustificacion`, `codigo`, `nombre` (PENDIENTE, EN_REVISION, APROBADA, RECHAZADA) |
| `documentos_justificacion` | Documentos adjuntos | `idDocumento`, `idJustificacion`, `nombreArchivo`, `rutaArchivo` |
| `asistencias_justificaciones` | Relación asistencia-justificación | `idAsistencia`, `idJustificacion` |

### 2.6 Tablas de Retiros

| Tabla | Descripción | Campos Clave |
|-------|-------------|--------------|
| `retiros` | Solicitudes de retiro | `idRetiro`, `idEstudiante`, `fecha`, `hora`, `idTipoRetiro`, `idEstadoRetiro`, `apoderadoQueRetira` |
| `tipo_retiro` | Tipos de retiro | `idTipoRetiro`, `nombre` (MEDICO, FAMILIAR, EMERGENCIA) |
| `estados_retiro` | Estados de retiro | `idEstadoRetiro`, `codigo`, `nombre` (PENDIENTE, APROBADO, RECHAZADO, COMPLETADO) |
| `autorizaciones_retiro` | Autorizaciones permanentes | `idAut`, `idEstudiante`, `idApoderado`, `vigenteDesde`, `vigenteHasta` |

### 2.7 Tablas de Horarios y Calendario

| Tabla | Descripción | Campos Clave |
|-------|-------------|--------------|
| `horarios_clase` | Horarios de clases | `idHorarioClase`, `idGradoSeccion`, `idDocente`, `materia`, `diaSemana`, `horaInicio`, `horaFin` |
| `calendario_escolar` | Calendario de la IE | `idCalendario`, `idIe`, `fechaInicio`, `fechaFin`, `tipoDia` (CLASES, FERIADO, VACACIONES) |
| `configuracion_ie` | Configuración de horarios IE | `idConfiguracion`, `idIe`, `horaIngreso`, `horaSalida`, `toleranciaMinutos` |

### 2.8 Tablas Auxiliares

| Tabla | Descripción | Campos Clave |
|-------|-------------|--------------|
| `notificaciones` | Notificaciones del sistema | `idNotificacion`, `idUsuario`, `titulo`, `mensaje`, `tipo`, `leida` |
| `reunion` | Reuniones programadas | `idReunion`, `idIe`, `titulo`, `fecha`, `tipo` |

---

## 3. APIs por Panel/Rol

### 3.1 APIs de Autenticación (`/api/auth/`)

| Endpoint | Método | Descripción | Parámetros |
|----------|--------|-------------|------------|
| `/api/auth/login` | POST | Login general | `email`, `password` |
| `/api/auth/admin-login` | POST | Login admin | `email`, `password` |
| `/api/auth/me` | GET | Obtener usuario actual | Header: `Authorization` |

**Ejemplo de uso:**
```typescript
// POST /api/auth/login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
})
// Retorna: { token, user: { id, nombre, rol, ieId } }
```

### 3.2 APIs del Panel ADMIN (`/api/`)

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/usuarios` | GET | Listar usuarios por IE |
| `/api/usuarios` | POST | Crear usuario |
| `/api/usuarios/[id]` | PUT | Actualizar usuario |
| `/api/usuarios/[id]` | DELETE | Eliminar usuario |
| `/api/aulas` | GET | Listar aulas |
| `/api/aulas` | POST | Crear aula |
| `/api/grados` | GET | Listar grados |
| `/api/secciones` | GET | Listar secciones |
| `/api/dashboard/stats` | GET | Estadísticas del dashboard |
| `/api/asistencia/estudiantes` | GET | Listar estudiantes con asistencia |
| `/api/asistencia/[id]` | PUT | Actualizar asistencia |

### 3.3 APIs del Panel DOCENTE (`/api/docentes/`)

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/docentes/estudiantes` | GET | Estudiantes del docente |
| `/api/asistencia` | GET | Asistencias de sus aulas |
| `/api/asistencia` | POST | Registrar asistencia |
| `/api/asistencia/marcar-inasistencias` | POST | Marcar inasistencias masivas |
| `/api/retiros` | GET | Retiros de sus estudiantes |
| `/api/retiros` | POST | Crear solicitud de retiro |

### 3.4 APIs del Panel APODERADO (`/api/apoderados/`)

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/apoderados/estudiantes` | GET | Hijos del apoderado |
| `/api/apoderados/asistencias/ie` | GET | Asistencias IE de hijos |
| `/api/apoderados/asistencias/aulas` | GET | Asistencias por aula |
| `/api/apoderados/estadisticas` | GET | Estadísticas de asistencia |
| `/api/apoderados/historial` | GET | Historial completo |
| `/api/apoderados/justificaciones/crear` | POST | Crear justificación |
| `/api/apoderados/justificaciones/pendientes` | GET | Justificaciones pendientes |
| `/api/apoderados/justificaciones/rechazadas` | GET | Justificaciones rechazadas |
| `/api/apoderados/justificaciones/[id]/reenviar` | POST | Reenviar justificación |
| `/api/apoderados/retiros` | GET | Retiros de hijos |
| `/api/apoderados/retiros/solicitar` | POST | Solicitar retiro |
| `/api/apoderados/retiros/pendientes` | GET | Retiros pendientes |
| `/api/apoderados/retiros/[id]/aprobar` | POST | Aprobar retiro |
| `/api/apoderados/retiros/[id]/rechazar` | POST | Rechazar retiro |
| `/api/apoderados/notificaciones` | GET | Notificaciones |
| `/api/apoderados/notificaciones/config` | GET/PUT | Configuración notificaciones |

### 3.5 APIs del Panel AUXILIAR (`/api/auxiliar/`)

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/auxiliar/asistencia/estudiantes` | GET | Estudiantes para registro |
| `/api/auxiliar/asistencia/entrada` | POST | Registrar entrada |
| `/api/auxiliar/asistencia/salida` | POST | Registrar salida |
| `/api/auxiliar/asistencia/qr-scan` | POST | Escanear QR |
| `/api/auxiliar/asistencia/buscar` | GET | Buscar estudiante |
| `/api/auxiliar/asistencia/guardar` | POST | Guardar asistencia masiva |
| `/api/auxiliar/reportes/generar` | POST | Generar reporte |
| `/api/auxiliar/reportes/exportar` | POST | Exportar reporte |

---

## 4. Métodos HTTP y Operaciones

### 4.1 GET - Consultas (SELECT)

```typescript
// Ejemplo: Obtener estudiantes
// GET /api/asistencia/estudiantes?fecha=2024-12-08&grado=1
const estudiantes = await prisma.estudiante.findMany({
  where: {
    idIe: ieId,
    usuario: { estado: 'ACTIVO' }
  },
  include: {
    usuario: true,
    gradoSeccion: {
      include: { grado: true, seccion: true }
    }
  },
  orderBy: [
    { usuario: { apellido: 'asc' } }
  ]
})
```

### 4.2 POST - Crear (INSERT)

```typescript
// Ejemplo: Crear asistencia
// POST /api/asistencia
const asistencia = await prisma.asistencia.create({
  data: {
    idEstudiante: estudiante.idEstudiante,
    fecha: fechaAsistencia,
    idEstadoAsistencia: estadoPresente.idEstadoAsistencia,
    horaRegistro: new Date(),
    registradoPor: userId,
    observaciones: 'Registrado por QR'
  }
})
```

### 4.3 PUT - Actualizar (UPDATE)

```typescript
// Ejemplo: Actualizar estado de asistencia
// PUT /api/asistencia/[id]
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { estado, observaciones } = await request.json()
  
  const asistencia = await prisma.asistencia.update({
    where: { idAsistencia: parseInt(params.id) },
    data: {
      idEstadoAsistencia: estado,
      observaciones: observaciones,
      updatedAt: new Date()
    }
  })
  
  return NextResponse.json({ success: true, asistencia })
}
```

### 4.4 DELETE - Eliminar (DELETE)

```typescript
// Ejemplo: Eliminar retiro
// DELETE /api/retiros/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  await prisma.retiro.delete({
    where: { idRetiro: parseInt(params.id) }
  })
  
  return NextResponse.json({ success: true })
}
```

### 4.5 PATCH - Actualización Parcial

```typescript
// Ejemplo: Marcar notificación como leída
// PATCH /api/notificaciones/[id]
const notificacion = await prisma.notificacion.update({
  where: { idNotificacion: parseInt(id) },
  data: { 
    leida: true,
    fechaLectura: new Date()
  }
})
```

---

## 5. Servicios y Hooks del Frontend

### 5.1 Hooks Principales

| Hook | Ubicación | Descripción |
|------|-----------|-------------|
| `useRetiros` | `src/hooks/useRetiros.ts` | Gestión de retiros |
| `useAutoAttendance` | `src/hooks/useAutoAttendance.ts` | Auto-registro de asistencia |
| `useNotifications` | `src/hooks/useNotifications.ts` | Gestión de notificaciones |

**Ejemplo useRetiros:**
```typescript
// src/hooks/useRetiros.ts
export function useRetiros() {
  const [retiros, setRetiros] = useState<Retiro[]>([])
  const [loading, setLoading] = useState(true)
  
  const cargarRetiros = async (filtros: FiltrosRetiro) => {
    const params = new URLSearchParams(filtros)
    const response = await fetch(`/api/retiros?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await response.json()
    setRetiros(data.retiros)
  }
  
  const solicitarRetiro = async (datos: DatosRetiro) => {
    const response = await fetch('/api/retiros', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(datos)
    })
    return response.json()
  }
  
  return { retiros, loading, cargarRetiros, solicitarRetiro }
}
```

### 5.2 Componentes por Panel

#### Panel Admin
| Componente | Ubicación | Función |
|------------|-----------|---------|
| `AdminLayout` | `src/app/admin/layout.tsx` | Layout principal |
| `DashboardPage` | `src/app/admin/page.tsx` | Dashboard con estadísticas |
| `AsistenciaPage` | `src/app/admin/dashboard/asistencia/page.tsx` | Gestión de asistencia |
| `RetirosPage` | `src/app/admin/dashboard/retiros/page.tsx` | Gestión de retiros |
| `UsuariosPage` | `src/app/admin/dashboard/usuarios/page.tsx` | Gestión de usuarios |

#### Panel Docente
| Componente | Ubicación | Función |
|------------|-----------|---------|
| `DocenteLayout` | `src/app/docente/layout.tsx` | Layout docente |
| `RetirosDocente` | `src/components/docente/RetirosDocente.tsx` | Gestión de retiros |
| `AsistenciaDocente` | `src/components/docente/AsistenciaDocente.tsx` | Registro de asistencia |

#### Panel Apoderado
| Componente | Ubicación | Función |
|------------|-----------|---------|
| `ApoderadoLayout` | `src/app/apoderado/layout.tsx` | Layout apoderado |
| `JustificacionesPage` | `src/app/apoderado/justificaciones/page.tsx` | Gestión de justificaciones |
| `RetirosPage` | `src/app/apoderado/retiros/page.tsx` | Solicitud de retiros |

#### Panel Auxiliar
| Componente | Ubicación | Función |
|------------|-----------|---------|
| `AuxiliarLayout` | `src/app/auxiliar/layout.tsx` | Layout auxiliar |
| `AsistenciaPage` | `src/app/auxiliar/asistencia/page.tsx` | Registro de entrada/salida |
| `QRScannerModal` | `src/components/modals/QRScannerModal.tsx` | Escáner QR |

---

## 6. Flujos de Datos

### 6.1 Flujo de Registro de Asistencia

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│  Auxiliar   │────▶│ POST /api/   │────▶│   Prisma    │────▶│  asistencia  │
│  escanea QR │     │ auxiliar/    │     │   create()  │     │     _ie      │
└─────────────┘     │ asistencia/  │     └─────────────┘     └──────────────┘
                    │ entrada      │
                    └──────────────┘
```

### 6.2 Flujo de Justificación

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Apoderado  │────▶│ POST /api/   │────▶│ justifica-  │
│  crea       │     │ apoderados/  │     │   ciones    │
│ justifica-  │     │ justifica-   │     │  (PENDIENTE)│
│   ción      │     │ ciones/crear │     └──────┬──────┘
└─────────────┘     └──────────────┘            │
                                                ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│    Admin    │◀────│ GET /api/    │◀────│ justifica-  │
│   revisa    │     │ justifica-   │     │   ciones    │
└──────┬──────┘     │ ciones       │     │ (PENDIENTE) │
       │            └──────────────┘     └─────────────┘
       ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Aprobar/  │────▶│ PUT /api/    │────▶│ justifica-  │
│  Rechazar   │     │ justifica-   │     │   ciones    │
└─────────────┘     │ ciones/[id]  │     │ (APROBADA/  │
                    └──────────────┘     │  RECHAZADA) │
                                         └─────────────┘
```

### 6.3 Flujo de Retiro

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ Apoderado/  │────▶│ POST /api/   │────▶│   retiros   │
│  Docente    │     │ retiros      │     │ (PENDIENTE) │
│  solicita   │     └──────────────┘     └──────┬──────┘
└─────────────┘                                 │
                                                ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Auxiliar   │────▶│ PUT /api/    │────▶│   retiros   │
│  autoriza   │     │ retiros/[id] │     │ (APROBADO)  │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                                                ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Auxiliar   │────▶│ PUT /api/    │────▶│   retiros   │
│  completa   │     │ retiros/[id] │     │(COMPLETADO) │
│   retiro    │     │ /completar   │     └─────────────┘
└─────────────┘     └──────────────┘
```

---

## 7. APIs PUT - Actualizaciones Detalladas

### 7.1 Usuarios y Roles

| Endpoint | Descripción | Parámetros |
|----------|-------------|------------|
| `PUT /api/usuarios/[id]` | Actualizar usuario | `nombre`, `apellido`, `email`, `telefono`, `estado` |
| `PUT /api/usuarios/apoderados?id=X` | Actualizar apoderado | `ocupacion`, `direccion`, datos de usuario |
| `PUT /api/docentes?id=X` | Actualizar docente | `especialidad`, datos de usuario |
| `PUT /api/estudiantes?id=X` | Actualizar estudiante | `idGradoSeccion`, datos de usuario |
| `PUT /api/apoderados/[id]` | Actualizar apoderado específico | Todos los campos |

### 7.2 Asistencia

| Endpoint | Descripción | Parámetros |
|----------|-------------|------------|
| `PUT /api/asistencia/[id]` | Actualizar estado de asistencia | `idEstadoAsistencia`, `observaciones` |
| `PUT /api/auxiliar/tolerancia/global` | Tolerancia global IE | `toleranciaMinutos` |
| `PUT /api/auxiliar/tolerancia/individual` | Tolerancia por aula | `idGradoSeccion`, `toleranciaMinutos` |
| `PUT /api/auxiliar/tolerancia/seleccionadas` | Tolerancia múltiples aulas | `aulas[]`, `toleranciaMinutos` |

### 7.3 Justificaciones

| Endpoint | Descripción | Parámetros |
|----------|-------------|------------|
| `PUT /api/justificaciones/[id]` | Actualizar justificación | `motivo`, `observaciones`, `idTipoJustificacion` |
| `PUT /api/justificaciones/[id]/revisar` | Aprobar/Rechazar | `accion` (APROBAR/RECHAZAR), `observacionesRevision` |

### 7.4 Retiros

| Endpoint | Descripción | Parámetros |
|----------|-------------|------------|
| `PUT /api/retiros/[id]` | Modificar retiro | `hora`, `motivo`, `observaciones` |
| `PUT /api/auxiliar/retiros/[id]` | Actualizar estado retiro | `idEstadoRetiro`, `observaciones` |
| `PUT /api/apoderados/retiros/[id]/aprobar` | Aprobar retiro | `observaciones` |
| `PUT /api/apoderados/retiros/[id]/rechazar` | Rechazar retiro | `motivo` |

### 7.5 Horarios y Configuración

| Endpoint | Descripción | Parámetros |
|----------|-------------|------------|
| `PUT /api/horarios/clases` | Actualizar horario de clase | `idHorarioClase`, `horaInicio`, `horaFin`, `materia` |
| `PUT /api/horarios/excepciones` | Actualizar excepción | `idExcepcion`, `fecha`, `motivo` |
| `PUT /api/docentes/horarios/[id]/tolerancia` | Tolerancia de horario | `toleranciaMin` |
| `PUT /api/configuracion/horarios` | Config horarios IE | `horaIngreso`, `horaSalida`, `toleranciaMinutos` |
| `PUT /api/calendario-escolar/[id]` | Actualizar evento | `fechaInicio`, `fechaFin`, `tipoDia`, `descripcion` |

### 7.6 Notificaciones

| Endpoint | Descripción | Parámetros |
|----------|-------------|------------|
| `PUT /api/notificaciones/[id]` | Marcar como leída | - |
| `PUT /api/notificaciones` | Marcar todas como leídas | - |
| `PUT /api/apoderados/notificaciones/config` | Config notificaciones | `recibirEmail`, `recibirPush`, `tipos[]` |

### 7.7 Aulas y Salones

| Endpoint | Descripción | Parámetros |
|----------|-------------|------------|
| `PUT /api/salones/[id]/estudiantes` | Asignar estudiantes a salón | `estudiantes[]` |

---

### 7.8 Ejemplos de Código PUT

**Ejemplo 1: Actualizar Usuario**
```typescript
// PUT /api/usuarios/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: paramId } = await params
  const id = parseInt(paramId)
  const { nombre, apellido, email, telefono, estado } = await request.json()
  
  const usuario = await prisma.usuario.update({
    where: { idUsuario: id },
    data: {
      nombre,
      apellido,
      email,
      telefono,
      estado,
      updatedAt: new Date()
    }
  })
  
  return NextResponse.json({ success: true, usuario })
}
```

**Ejemplo 2: Aprobar/Rechazar Justificación**
```typescript
// PUT /api/justificaciones/[id]/revisar
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { accion, observacionesRevision } = await request.json()
  
  // Buscar estado según acción
  const estadoNuevo = await prisma.estadoJustificacion.findFirst({
    where: { codigo: accion === 'APROBAR' ? 'APROBADA' : 'RECHAZADA' }
  })
  
  const justificacion = await prisma.justificacion.update({
    where: { idJustificacion: parseInt(id) },
    data: {
      idEstadoJustificacion: estadoNuevo.idEstadoJustificacion,
      observacionesRevision,
      fechaRevision: new Date(),
      revisadoPor: userId
    }
  })
  
  return NextResponse.json({ success: true, justificacion })
}
```

**Ejemplo 3: Actualizar Estado de Retiro**
```typescript
// PUT /api/retiros/[id]
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const { idEstadoRetiro, observaciones, hora } = await request.json()
  
  const retiro = await prisma.retiro.update({
    where: { idRetiro: parseInt(id) },
    data: {
      idEstadoRetiro: idEstadoRetiro ? parseInt(idEstadoRetiro) : undefined,
      observaciones,
      hora: hora ? new Date(`1970-01-01T${hora}:00`) : undefined,
      updatedAt: new Date()
    }
  })
  
  return NextResponse.json({ success: true, retiro })
}
```

**Ejemplo 4: Actualizar Configuración de Horarios**
```typescript
// PUT /api/configuracion/horarios
export async function PUT(request: NextRequest) {
  const { horaIngreso, horaSalida, toleranciaMinutos, diasLaborables } = await request.json()
  
  const config = await prisma.configuracionIE.upsert({
    where: { idIe: ieId },
    update: {
      horaIngreso,
      horaSalida,
      toleranciaMinutos,
      diasLaborables,
      updatedAt: new Date()
    },
    create: {
      idIe: ieId,
      horaIngreso,
      horaSalida,
      toleranciaMinutos,
      diasLaborables
    }
  })
  
  return NextResponse.json({ success: true, config })
}
```

---

## 8. Resumen de Operaciones CRUD por Tabla

| Tabla | GET | POST | PUT | DELETE | API Principal |
|-------|-----|------|-----|--------|---------------|
| `usuarios` | ✅ | ✅ | ✅ | ✅ | `/api/usuarios` |
| `estudiante` | ✅ | ✅ | ✅ | ✅ | `/api/estudiantes` |
| `apoderado` | ✅ | ✅ | ✅ | ✅ | `/api/apoderados` |
| `docente` | ✅ | ✅ | ✅ | ✅ | `/api/docentes` |
| `asistencias` | ✅ | ✅ | ✅ | ❌ | `/api/asistencia` |
| `asistencia_ie` | ✅ | ✅ | ✅ | ❌ | `/api/auxiliar/asistencia` |
| `justificaciones` | ✅ | ✅ | ✅ | ❌ | `/api/justificaciones` |
| `retiros` | ✅ | ✅ | ✅ | ✅ | `/api/retiros` |
| `notificaciones` | ✅ | ✅ | ✅ | ✅ | `/api/notificaciones` |
| `grado_seccion` | ✅ | ✅ | ✅ | ✅ | `/api/aulas` |
| `horarios_clase` | ✅ | ✅ | ✅ | ✅ | `/api/horarios` |

---

## 9. Variables de Entorno

```env
# Base de datos
DATABASE_URL="postgresql://user:password@host:5432/database"

# JWT
JWT_SECRET="tu-secreto-jwt-seguro"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 10. Comandos Útiles

```bash
# Desarrollo
npm run dev

# Prisma
npx prisma generate      # Generar cliente
npx prisma db push       # Sincronizar schema
npx prisma db seed       # Ejecutar seed
npx prisma studio        # Abrir GUI de BD

# Build
npm run build
npm start
```
