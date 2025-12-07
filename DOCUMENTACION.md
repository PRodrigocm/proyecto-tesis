# Documentación del Sistema de Gestión Escolar

## Índice
1. [Arquitectura General](#arquitectura-general)
2. [Estructura del Proyecto](#estructura-del-proyecto)
3. [Sistema de Autenticación](#sistema-de-autenticación)
4. [Panel de Administración](#panel-de-administración)
5. [APIs del Backend](#apis-del-backend)
6. [Mapa Completo de APIs](#mapa-completo-de-apis)
7. [Componentes del Frontend](#componentes-del-frontend)
8. [Servicios](#servicios)
9. [Hooks Personalizados](#hooks-personalizados)
10. [Base de Datos](#base-de-datos)

---

## Arquitectura General

El proyecto utiliza **Next.js 14** con App Router, combinando:
- **Frontend**: React con TypeScript, TailwindCSS
- **Backend**: API Routes de Next.js
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Autenticación**: JWT (JSON Web Tokens)

### Flujo de Datos
```
Usuario → Frontend (React) → API Routes → Prisma → PostgreSQL
                ↑                              ↓
                └──────── Respuesta JSON ──────┘
```

---

## Estructura del Proyecto

```
src/
├── app/                          # App Router de Next.js
│   ├── admin/                    # Panel de administración
│   │   ├── layout.tsx            # Layout con sidebar y navegación
│   │   ├── page.tsx              # Dashboard principal
│   │   └── dashboard/            # Subrutas del admin
│   │       ├── usuarios/         # Gestión de usuarios
│   │       ├── salones/          # Gestión de salones
│   │       ├── asistencia/       # Control de asistencia
│   │       ├── calendarios/      # Calendario escolar
│   │       ├── horarios/         # Horarios de clases
│   │       ├── retiros/          # Gestión de retiros
│   │       ├── reportes/         # Reportes
│   │       └── codigos-qr/       # Generador de QR
│   ├── api/                      # API Routes (Backend)
│   │   ├── auth/                 # Autenticación
│   │   ├── dashboard/            # Estadísticas
│   │   ├── usuarios/             # CRUD usuarios
│   │   ├── docentes/             # APIs de docentes
│   │   ├── apoderados/           # APIs de apoderados
│   │   ├── estudiantes/          # APIs de estudiantes
│   │   ├── retiros/              # APIs de retiros
│   │   ├── justificaciones/      # APIs de justificaciones
│   │   └── ...                   # Otras APIs
│   ├── docente/                  # Panel del docente
│   ├── apoderado/                # Panel del apoderado
│   ├── auxiliar/                 # Panel del auxiliar
│   └── login/                    # Página de login
├── components/                   # Componentes React
│   ├── admin/                    # Componentes del admin
│   ├── docente/                  # Componentes del docente
│   └── ...                       # Componentes compartidos
├── hooks/                        # Hooks personalizados
├── lib/                          # Utilidades y configuración
│   ├── prisma.ts                 # Cliente de Prisma
│   └── auth.ts                   # Funciones de autenticación
├── services/                     # Servicios de API
└── types/                        # Definiciones de TypeScript
```

---

## Sistema de Autenticación

### Archivo: `src/lib/auth.ts`

```typescript
/**
 * Módulo de autenticación JWT
 * Proporciona funciones para generar, verificar y extraer tokens
 */

interface JWTPayload {
  userId: number      // ID del usuario en la BD
  email: string       // Email del usuario
  rol: string         // Rol: ADMINISTRATIVO, DOCENTE, APODERADO, AUXILIAR
  idIe?: number       // ID de la Institución Educativa
}

// Funciones principales:
verifyToken(token)              // Verifica y decodifica un JWT
generateToken(payload)          // Genera un nuevo JWT
extractTokenFromHeader(header)  // Extrae token del header Authorization
verifyTokenFromRequest(request) // Helper para API routes
```

### API de Login: `src/app/api/auth/login/route.ts`

```typescript
/**
 * POST /api/auth/login
 * 
 * Autentica un usuario y devuelve un JWT
 * 
 * Request Body:
 * {
 *   email: string,
 *   password: string
 * }
 * 
 * Response:
 * {
 *   data: {
 *     token: string,        // JWT para autenticación
 *     user: {
 *       id: number,
 *       email: string,
 *       nombres: string,
 *       apellidos: string,
 *       rol: string,
 *       institucion: string,
 *       ieId: number
 *     }
 *   }
 * }
 * 
 * Flujo:
 * 1. Valida email y password
 * 2. Busca usuario en BD con Prisma
 * 3. Verifica que esté activo
 * 4. Compara contraseña con bcrypt
 * 5. Genera JWT con datos del usuario
 * 6. Retorna token y datos del usuario
 */
```

---

## Panel de Administración

### Layout: `src/app/admin/layout.tsx`

```typescript
/**
 * Layout principal del panel de administración
 * 
 * Funcionalidades:
 * - Sidebar con navegación (responsive)
 * - Verificación de autenticación al cargar
 * - Menús desplegables para Usuarios y Calendario
 * - Header con breadcrumb, notificaciones y logout
 * 
 * Estados:
 * - user: Usuario autenticado
 * - sidebarOpen: Control del sidebar móvil
 * - openUsers: Menú de usuarios expandido
 * - openCalendario: Menú de calendario expandido
 * 
 * Navegación:
 * - /admin                    → Dashboard
 * - /admin/dashboard/usuarios → Gestión de usuarios
 *   - /apoderados
 *   - /docentes
 *   - /administrativos
 *   - /estudiantes
 *   - /auxiliares
 * - /admin/dashboard/salones  → Gestión de salones
 * - /admin/dashboard/asistencia → Control de asistencia
 * - /admin/dashboard/calendarios → Calendario escolar
 * - /admin/dashboard/horarios → Horarios de clases
 * - /admin/dashboard/retiros  → Gestión de retiros
 * - /admin/dashboard/reportes → Reportes
 * - /admin/configuracion      → Configuración
 */
```

### Dashboard Principal: `src/app/admin/page.tsx`

```typescript
/**
 * Página principal del dashboard de administración
 * 
 * Estadísticas mostradas:
 * - totalUsuarios: Usuarios activos de la IE
 * - totalEstudiantes: Estudiantes matriculados
 * - totalDocentes: Docentes activos
 * - totalApoderados: Apoderados registrados
 * - asistenciasHoy: Registros de asistencia del día
 * - retirosHoy: Retiros procesados hoy
 * - justificacionesPendientes: Justificaciones por revisar
 * - promedioAsistencia: % de asistencia últimos 7 días
 * 
 * Acciones rápidas:
 * - Gestión de usuarios (menú desplegable)
 * - Horarios
 * - Estudiantes
 * - Salones
 * - Asistencias
 * - Retiros
 * - Calendario
 * - Códigos QR
 * 
 * API utilizada: GET /api/dashboard/stats
 */
```

---

## APIs del Backend

### API de Estadísticas: `src/app/api/dashboard/stats/route.ts`

```typescript
/**
 * GET /api/dashboard/stats
 * 
 * Obtiene estadísticas del dashboard para la IE del usuario
 * 
 * Headers requeridos:
 * - Authorization: Bearer <token>
 * 
 * Response:
 * {
 *   data: {
 *     totalUsuarios: number,
 *     totalEstudiantes: number,
 *     totalDocentes: number,
 *     totalApoderados: number,
 *     asistenciasHoy: number,
 *     retirosHoy: number,
 *     justificacionesPendientes: number,
 *     asistenciaPromedio: number
 *   }
 * }
 * 
 * Consultas realizadas:
 * 1. Cuenta usuarios activos de la IE
 * 2. Cuenta estudiantes activos
 * 3. Cuenta docentes activos
 * 4. Cuenta apoderados activos
 * 5. Cuenta asistencias del día actual
 * 6. Cuenta retiros del día actual
 * 7. Cuenta justificaciones pendientes/en revisión
 * 8. Calcula promedio de asistencia (7 días)
 */
```

### API de Retiros: `src/app/api/retiros/route.ts`

```typescript
/**
 * GET /api/retiros
 * Obtiene lista de retiros con filtros
 * 
 * Query params:
 * - fecha: string (YYYY-MM-DD)
 * - grado: string
 * - estado: TODOS | PENDIENTE | AUTORIZADO | RECHAZADO
 * - search: string (búsqueda por nombre/DNI)
 * 
 * POST /api/retiros
 * Crea un nuevo retiro
 * 
 * Body:
 * {
 *   estudianteId: string,
 *   fecha: string,
 *   horaRetiro: string (HH:MM),
 *   motivo: string,
 *   observaciones?: string,
 *   personaRecoge?: string,
 *   dniPersonaRecoge?: string,
 *   apoderadoQueRetira?: string
 * }
 * 
 * Validaciones:
 * 1. Estudiante debe existir
 * 2. Estudiante debe pertenecer a la IE del usuario
 * 3. Si es docente, estudiante debe estar en sus aulas
 * 
 * Acciones automáticas:
 * - Actualiza asistencia del estudiante
 * - Envía notificaciones según el creador
 */
```

### API de Justificaciones Pendientes: `src/app/api/apoderados/justificaciones/pendientes/route.ts`

```typescript
/**
 * GET /api/apoderados/justificaciones/pendientes
 * 
 * Obtiene inasistencias pendientes de justificación
 * para los estudiantes del apoderado autenticado
 * 
 * Lógica de filtrado:
 * 1. Obtiene estudiantes vinculados al apoderado
 * 2. Busca asistencias con estado AUSENTE o INASISTENCIA
 * 3. Excluye días que ya tienen retiro (cualquier estado)
 * 4. Excluye asistencias ya justificadas
 * 5. Elimina duplicados por estudiante+fecha
 * 
 * Response:
 * {
 *   success: true,
 *   inasistencias: [
 *     {
 *       id: string,
 *       fecha: string,
 *       estado: string,
 *       estudiante: { id, nombre, apellido, grado, seccion }
 *     }
 *   ]
 * }
 */
```

### API de Estudiantes del Docente: `src/app/api/docentes/estudiantes/route.ts`

```typescript
/**
 * GET /api/docentes/estudiantes
 * 
 * Obtiene estudiantes de las aulas asignadas al docente
 * 
 * Para ADMINISTRATIVO:
 * - Retorna todos los estudiantes de la IE
 * 
 * Para DOCENTE:
 * - Busca aulas asignadas (DocenteAula)
 * - Retorna estudiantes de esas aulas
 * - Filtra por IE del docente
 * - Incluye datos del apoderado titular
 * 
 * Response:
 * {
 *   success: true,
 *   estudiantes: [
 *     {
 *       id: string,
 *       nombre: string,
 *       apellido: string,
 *       dni: string,
 *       grado: string,
 *       seccion: string,
 *       apoderadoTitular: { id, nombre, apellido, dni, telefono, email }
 *     }
 *   ]
 * }
 */
```

---

## Componentes del Frontend

### Componentes de Admin (`src/components/admin/`)

| Componente | Descripción |
|------------|-------------|
| `DocentesTable.tsx` | Tabla de docentes con filtros y acciones |
| `EstudiantesTable.tsx` | Tabla de estudiantes con búsqueda |
| `ApoderadosTable.tsx` | Tabla de apoderados |
| `AuxiliaresTable.tsx` | Tabla de auxiliares |
| `AdministrativosTable.tsx` | Tabla de administrativos |
| `RetirosTable.tsx` | Tabla de retiros con estados |
| `RetirosStats.tsx` | Estadísticas de retiros |
| `SalonesTable.tsx` | Tabla de salones/aulas |
| `CalendariosTable.tsx` | Tabla de eventos del calendario |
| `HorariosTable.tsx` | Tabla de horarios |
| `CreateUserModal.tsx` | Modal para crear usuarios |
| `CreateRetiroModal.tsx` | Modal para crear retiros |
| `EditRetiroModal.tsx` | Modal para editar retiros |
| `ViewRetiroModal.tsx` | Modal para ver detalles de retiro |
| `GeneradorQRPDF.tsx` | Generador de PDFs con códigos QR |

### Ejemplo: RetirosTable.tsx

```typescript
/**
 * Componente de tabla de retiros
 * 
 * Props:
 * - retiros: Retiro[]
 * - onEdit: (retiro) => void
 * - onView: (retiro) => void
 * - onAutorizar: (retiro) => void
 * - onRechazar: (retiro) => void
 * 
 * Funcionalidades:
 * - Muestra lista de retiros en formato tabla
 * - Badges de estado (Pendiente/Autorizado/Rechazado)
 * - Acciones según estado del retiro
 * - Responsive (cards en móvil, tabla en desktop)
 */
```

---

## Servicios

### Servicio de Apoderado: `src/services/apoderado.service.ts`

```typescript
/**
 * Servicio para operaciones del apoderado
 * 
 * Interfaces:
 * - Estudiante: Datos del estudiante
 * - InasistenciaPendiente: Inasistencia por justificar
 * - Justificacion: Justificación enviada
 * - Retiro: Retiro del estudiante
 * 
 * Funciones:
 */

// Obtiene estudiantes vinculados al apoderado
getEstudiantes(): Promise<Estudiante[]>

// Obtiene inasistencias pendientes de justificación
getInasistenciasPendientes(): Promise<InasistenciaPendiente[]>

// Envía una nueva justificación
enviarJustificacion(data: FormData): Promise<Response>

// Obtiene historial de justificaciones
getJustificaciones(): Promise<Justificacion[]>

// Obtiene retiros de los estudiantes
getRetiros(): Promise<Retiro[]>

// Solicita un nuevo retiro
solicitarRetiro(data): Promise<Response>
```

---

## Hooks Personalizados

### useRetiros: `src/hooks/useRetiros.ts`

```typescript
/**
 * Hook para gestión de retiros
 * 
 * Estados:
 * - retiros: Retiro[]
 * - loading: boolean
 * - filters: RetirosFilters
 * 
 * Funciones:
 * - loadRetiros(): Carga retiros desde API
 * - solicitarRetiro(data): Crea nuevo retiro
 * - autorizarRetiro(id, autorizado, obs): Autoriza/rechaza
 * - modificarRetiro(id, data): Actualiza retiro
 * - eliminarRetiro(id): Elimina retiro
 * - updateFilters(filters): Actualiza filtros
 * 
 * Retorna:
 * {
 *   retiros,           // Lista filtrada
 *   loading,           // Estado de carga
 *   filters,           // Filtros actuales
 *   grados,            // Grados únicos
 *   stats,             // Estadísticas
 *   loadRetiros,
 *   solicitarRetiro,
 *   autorizarRetiro,
 *   modificarRetiro,
 *   eliminarRetiro,
 *   updateFilters
 * }
 */
```

---

## Base de Datos

### Cliente Prisma: `src/lib/prisma.ts`

```typescript
/**
 * Singleton de PrismaClient
 * 
 * Configuración:
 * - Logs de error y warning en desarrollo
 * - Solo errores en producción
 * - Singleton global para evitar múltiples conexiones en hot reload
 * 
 * Uso:
 * import { prisma } from '@/lib/prisma'
 * 
 * const usuarios = await prisma.usuario.findMany()
 */
```

### Modelos Principales (Prisma Schema)

```prisma
// Usuario base del sistema
model Usuario {
  idUsuario     Int
  nombre        String
  apellido      String
  email         String
  dni           String
  telefono      String?
  passwordHash  String
  estado        String      // ACTIVO, INACTIVO
  idIe          Int?        // Institución Educativa
  roles         UsuarioRol[]
  estudiante    Estudiante?
  docente       Docente?
  apoderado     Apoderado?
}

// Estudiante
model Estudiante {
  idEstudiante  Int
  idUsuario     Int
  idIe          Int?
  idGradoSeccion Int?
  codigoQR      String?
  usuario       Usuario
  gradoSeccion  GradoSeccion?
  apoderados    EstudianteApoderado[]
  asistencias   Asistencia[]
  retiros       Retiro[]
}

// Docente
model Docente {
  idDocente     Int
  idUsuario     Int
  especialidad  String?
  usuario       Usuario
  docenteAulas  DocenteAula[]
}

// Apoderado
model Apoderado {
  idApoderado   Int
  idUsuario     Int
  usuario       Usuario
  estudiantes   EstudianteApoderado[]
}

// Asistencia
model Asistencia {
  idAsistencia      Int
  idEstudiante      Int
  fecha             DateTime
  idEstadoAsistencia Int?
  observaciones     String?
  estudiante        Estudiante
  estadoAsistencia  EstadoAsistencia?
}

// Retiro
model Retiro {
  idRetiro          Int
  idEstudiante      Int
  idIe              Int
  fecha             DateTime
  hora              DateTime
  idTipoRetiro      Int?
  idEstadoRetiro    Int
  observaciones     String?
  estudiante        Estudiante
  estadoRetiro      EstadoRetiro
  tipoRetiro        TipoRetiro?
}

// Justificación
model Justificacion {
  idJustificacion       Int
  idEstudiante          Int
  idIe                  Int
  idTipoJustificacion   Int
  idEstadoJustificacion Int
  fechaInicio           DateTime
  fechaFin              DateTime
  motivo                String
  observaciones         String?
  estudiante            Estudiante
  tipoJustificacion     TipoJustificacion
  estadoJustificacion   EstadoJustificacion
}
```

---

## Flujos de Trabajo

### 1. Login de Usuario

```
1. Usuario ingresa email y password
2. Frontend envía POST /api/auth/login
3. Backend busca usuario en BD
4. Verifica estado activo
5. Compara password con bcrypt
6. Genera JWT con userId, email, rol, ieId
7. Frontend guarda token en localStorage
8. Redirige según rol:
   - ADMINISTRATIVO → /admin
   - DOCENTE → /docente
   - APODERADO → /apoderado
   - AUXILIAR → /auxiliar
```

### 2. Crear Retiro (Docente)

```
1. Docente selecciona estudiante de su aula
2. Completa formulario de retiro
3. Frontend envía POST /api/retiros
4. Backend valida:
   - Estudiante existe
   - Estudiante pertenece a IE del docente
   - Estudiante está en aulas del docente
5. Crea retiro con estado PENDIENTE
6. Actualiza asistencia del estudiante
7. Envía notificación a apoderados
8. Retorna confirmación
```

### 3. Justificar Inasistencia (Apoderado)

```
1. Apoderado ve lista de inasistencias pendientes
2. Frontend obtiene GET /api/apoderados/justificaciones/pendientes
3. Backend filtra:
   - Solo estudiantes del apoderado
   - Solo estados AUSENTE/INASISTENCIA
   - Excluye días con retiros
   - Excluye ya justificadas
4. Apoderado selecciona y completa formulario
5. Frontend envía POST /api/apoderados/justificaciones/crear
6. Backend valida y crea justificación
7. Estado queda EN_REVISION
8. Admin/Docente puede aprobar o rechazar
```

---

## API de Usuarios: `src/app/api/usuarios/route.ts`

### POST /api/usuarios - Crear Usuario

```typescript
/**
 * Crea un nuevo usuario en el sistema
 * 
 * Body:
 * {
 *   dni: string,              // DNI del usuario (obligatorio)
 *   nombre: string,           // Nombres (obligatorio)
 *   apellido: string,         // Apellidos (obligatorio)
 *   email?: string,           // Email (obligatorio para algunos roles)
 *   telefono?: string,        // Teléfono (obligatorio para algunos roles)
 *   password: string,         // Contraseña (obligatorio)
 *   ieId: number,             // ID de la IE (obligatorio)
 *   rol: string,              // Rol: DOCENTE, ESTUDIANTE, APODERADO, etc.
 *   especialidad?: string,    // Obligatorio para DOCENTE
 *   ocupacion?: string,       // Para APODERADO
 *   fechaNacimiento?: string, // Para ESTUDIANTE
 *   grado?: string,           // Para ESTUDIANTE
 *   seccion?: string,         // Para ESTUDIANTE
 *   apoderadoId?: string,     // Para vincular ESTUDIANTE con apoderado
 *   relacionApoderado?: string, // Tipo de relación
 *   estudianteId?: string,    // Para vincular APODERADO con estudiante
 *   parentescoEstudiante?: string
 * }
 * 
 * Flujo:
 * 1. Valida campos obligatorios
 * 2. Verifica que email y DNI no existan
 * 3. Hashea la contraseña con bcrypt
 * 4. Crea el usuario base
 * 5. Asigna roles (UsuarioRol)
 * 6. Crea registros específicos según rol:
 *    - DOCENTE: Crea registro en tabla Docente
 *    - ESTUDIANTE: Crea registro en tabla Estudiante + QR
 *    - APODERADO: Crea registro en tabla Apoderado
 * 7. Crea relaciones si se especifican
 * 
 * Response:
 * {
 *   message: "Usuario creado exitosamente",
 *   user: { ... datos del usuario con roles ... }
 * }
 */
```

### GET /api/usuarios - Listar Usuarios

```typescript
/**
 * Obtiene lista de usuarios de una IE
 * 
 * Query params:
 * - ieId: number (obligatorio)
 * 
 * Response:
 * [
 *   {
 *     id: number,
 *     nombre: string,
 *     apellido: string,
 *     dni: string,
 *     email: string,
 *     telefono: string,
 *     estado: string,
 *     institucion: string,
 *     roles: string[],
 *     fechaRegistro: Date
 *   }
 * ]
 */
```

### Subrutas de Usuarios

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/usuarios/[id]` | GET/PUT/DELETE | CRUD de usuario específico |
| `/api/usuarios/docentes` | GET | Lista docentes de la IE |
| `/api/usuarios/estudiantes` | GET | Lista estudiantes de la IE |
| `/api/usuarios/apoderados` | GET | Lista apoderados de la IE |
| `/api/usuarios/auxiliares` | GET | Lista auxiliares de la IE |
| `/api/usuarios/administrativos` | GET | Lista administrativos de la IE |
| `/api/usuarios/validate-dni` | POST | Valida si DNI está disponible |
| `/api/usuarios/validate-email` | POST | Valida si email está disponible |

---

## Mapa Completo de APIs

### Autenticación (`/api/auth/`)
| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/auth/login` | POST | Autenticar usuario y obtener JWT |
| `/api/auth/logout` | POST | Cerrar sesión |
| `/api/auth/me` | GET | Obtener datos del usuario actual |

### Dashboard (`/api/dashboard/`)
| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/dashboard/stats` | GET | Estadísticas del dashboard admin |

### Usuarios (`/api/usuarios/`)
| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/usuarios` | GET/POST | Listar/Crear usuarios |
| `/api/usuarios/[id]` | GET/PUT/DELETE | CRUD usuario específico |
| `/api/usuarios/docentes` | GET | Lista docentes |
| `/api/usuarios/estudiantes` | GET | Lista estudiantes |
| `/api/usuarios/apoderados` | GET | Lista apoderados |
| `/api/usuarios/auxiliares` | GET | Lista auxiliares |
| `/api/usuarios/administrativos` | GET | Lista administrativos |

### Docentes (`/api/docentes/`)
| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/docentes/estudiantes` | GET | Estudiantes de las aulas del docente |
| `/api/docentes/asistencia/tomar` | GET/POST | Tomar asistencia de clase |
| `/api/docentes/reportes` | GET | Obtener reportes de asistencia |
| `/api/docentes/reportes/exportar` | POST | Exportar reporte (PDF/Excel/Word) |
| `/api/docentes/clases` | GET | Clases asignadas al docente |
| `/api/docentes/horarios` | GET | Horarios del docente |

### Apoderados (`/api/apoderados/`)
| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/apoderados/estudiantes` | GET | Estudiantes vinculados |
| `/api/apoderados/justificaciones/pendientes` | GET | Inasistencias por justificar |
| `/api/apoderados/justificaciones/crear` | POST | Enviar justificación |
| `/api/apoderados/justificaciones/historial` | GET | Historial de justificaciones |
| `/api/apoderados/retiros` | GET/POST | Retiros de estudiantes |
| `/api/apoderados/notificaciones` | GET | Notificaciones del apoderado |

### Auxiliar (`/api/auxiliar/`)
| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/auxiliar/asistencia/estudiantes` | GET | Lista estudiantes con estado |
| `/api/auxiliar/asistencia/registrar` | POST | Registrar asistencia IE |
| `/api/auxiliar/asistencia/escanear` | POST | Escanear QR de estudiante |

### Retiros (`/api/retiros/`)
| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/retiros` | GET/POST | Listar/Crear retiros |
| `/api/retiros/[id]` | GET/PUT/DELETE | CRUD retiro específico |
| `/api/retiros/[id]/autorizar` | POST | Autorizar/Rechazar retiro |

### Justificaciones (`/api/justificaciones/`)
| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/justificaciones` | GET | Listar justificaciones |
| `/api/justificaciones/[id]` | GET/PUT | Ver/Actualizar justificación |
| `/api/justificaciones/[id]/aprobar` | POST | Aprobar justificación |
| `/api/justificaciones/[id]/rechazar` | POST | Rechazar justificación |

### Asistencia (`/api/asistencia/`)
| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/asistencia` | GET/POST | Listar/Registrar asistencia |
| `/api/asistencia/[id]` | PUT | Actualizar asistencia |
| `/api/asistencia/reporte` | GET | Reporte de asistencia |

### Salones/Aulas (`/api/salones/`, `/api/aulas/`)
| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/salones` | GET/POST | Listar/Crear salones |
| `/api/salones/[id]` | GET/PUT/DELETE | CRUD salón específico |
| `/api/aulas` | GET | Listar aulas (grado-sección) |

### Horarios (`/api/horarios/`)
| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/horarios` | GET/POST | Listar/Crear horarios |
| `/api/horarios/[id]` | PUT/DELETE | Actualizar/Eliminar horario |
| `/api/horarios/clases` | GET | Horarios de clases |
| `/api/horarios/excepciones` | GET/POST | Excepciones de horario |

### Calendario (`/api/calendario/`, `/api/calendario-escolar/`)
| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/calendario` | GET | Eventos del calendario |
| `/api/calendario-escolar` | GET/POST | Calendario escolar anual |
| `/api/calendario-escolar/[id]` | PUT/DELETE | Gestionar eventos |

### Notificaciones (`/api/notificaciones/`)
| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/notificaciones` | GET | Listar notificaciones |
| `/api/notificaciones/[id]/leer` | POST | Marcar como leída |
| `/api/notificaciones/leer-todas` | POST | Marcar todas como leídas |

### Catálogos
| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/grados` | GET | Lista de grados |
| `/api/secciones` | GET | Lista de secciones |
| `/api/grados-secciones` | GET | Combinaciones grado-sección |
| `/api/niveles` | GET | Niveles educativos |
| `/api/roles` | GET | Roles del sistema |
| `/api/tipos-retiro` | GET | Tipos de retiro |
| `/api/estados-retiro` | GET | Estados de retiro |
| `/api/tipos-asignacion` | GET | Tipos de asignación docente |
| `/api/instituciones` | GET | Instituciones educativas |

### Reportes (`/api/reportes/`)
| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/reportes/asistencia` | GET | Reporte de asistencia |
| `/api/reportes/retiros` | GET | Reporte de retiros |
| `/api/reportes/justificaciones` | GET | Reporte de justificaciones |

---

## Variables de Entorno

```env
# Base de datos
DATABASE_URL="postgresql://user:password@host:port/database"

# Autenticación
JWT_SECRET="clave-secreta-para-jwt"

# Aplicación
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

---

## Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Prisma
npx prisma generate      # Genera cliente
npx prisma db push       # Sincroniza schema
npx prisma studio        # Abre GUI de BD

# TypeScript
npx tsc --noEmit         # Verifica tipos
```
