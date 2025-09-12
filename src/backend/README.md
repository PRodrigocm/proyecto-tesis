# Backend - Sistema de Control de Asistencia

API REST para el sistema de control de asistencia escolar con soporte multi-institución.

## 🚀 Características

- **Autenticación JWT** con roles diferenciados (ADMIN, ADMINISTRATIVO, DOCENTE, APODERADO)
- **Sistema de asistencias** AM/PM con códigos QR únicos
- **Gestión de retiros** con flujo completo de autorización
- **Talleres extracurriculares** con inscripciones y horarios
- **Trazabilidad completa** con histórico de cambios
- **Multi-institución** con soporte para múltiples IEs

## 📋 Requisitos

- Node.js 18+
- PostgreSQL 14+
- npm o yarn

## 🛠️ Instalación

1. **Instalar dependencias:**
```bash
cd backend
npm install
```

2. **Configurar variables de entorno:**
```bash
cp env.example .env
# Editar .env con tus configuraciones
```

3. **Configurar base de datos:**
```bash
# Generar cliente Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate
```

4. **Iniciar servidor de desarrollo:**
```bash
npm run dev
```

## 🏗️ Estructura del Proyecto

```
backend/
├── src/
│   ├── controllers/     # Lógica de negocio
│   ├── middleware/      # Middleware de autenticación y autorización
│   ├── routes/          # Definición de rutas API
│   ├── services/        # Servicios de aplicación
│   ├── utils/           # Utilidades (QR, password, etc.)
│   ├── types/           # Tipos TypeScript
│   └── index.ts         # Punto de entrada
├── prisma/              # Esquema de base de datos (compartido)
├── package.json
└── tsconfig.json
```

## 🔐 Autenticación

### Login Dual (RF-03)

**1. Login General** - `/api/auth/login`
- Para: ADMINISTRATIVO, DOCENTE, APODERADO
- Requiere: email, password, institucionEducativa, rol

**2. Login Administrativo** - `/api/auth/admin-login`  
- Para: ADMIN exclusivamente
- Requiere: email, password

### Autorización por Roles

```typescript
// Middleware disponibles
authenticateToken        // Verificar JWT válido
requireAdmin            // Solo ADMIN
requireAdminOrAdministrativo // ADMIN o ADMINISTRATIVO
requireDocente          // Solo DOCENTE
requireApoderado        // Solo APODERADO
```

## 📚 API Endpoints

### Autenticación
- `POST /api/auth/login` - Login general
- `POST /api/auth/admin-login` - Login administrativo
- `GET /api/auth/me` - Información del usuario

### Usuarios (RF-01, RF-02)
- `GET /api/users` - Listar usuarios
- `POST /api/users` - Crear usuario
- `GET /api/users/:id` - Obtener usuario

### Asistencias (RF-05 a RF-08)
- `POST /api/asistencias` - Registrar asistencia
- `GET /api/asistencias` - Consultar historial
- `PUT /api/asistencias/:id/estado` - Modificar estado

### Retiros (RF-09 a RF-12)
- `POST /api/retiros` - Registrar retiro
- `GET /api/retiros` - Consultar retiros
- `PUT /api/retiros/:id/contactar` - Contactar apoderado
- `PUT /api/retiros/:id/entregar` - Entregar estudiante
- `POST /api/retiros/:id/autorizar` - Autorizar retiro

### Talleres (RF-13 a RF-15)
- `POST /api/talleres` - Crear taller
- `GET /api/talleres` - Listar talleres
- `POST /api/talleres/inscribir` - Inscribir estudiante
- `GET /api/talleres/:id/estudiantes` - Estudiantes del taller

## 🔧 Utilidades

### Códigos QR (RF-23)
```typescript
import { generateQRFromDNI, generateQRImage } from './utils/qr';

// Generar QR único desde DNI
const qrCode = generateQRFromDNI('12345678'); // "QR-12345678"

// Generar imagen QR
const qrImage = await generateQRImage(qrCode);
```

### Seguridad de Contraseñas (RNF-09)
```typescript
import { hashPassword, comparePassword } from './utils/password';

// Hash seguro con bcrypt
const hash = await hashPassword('password123');

// Verificar contraseña
const isValid = await comparePassword('password123', hash);
```

## 🗄️ Base de Datos

El backend utiliza el esquema Prisma compartido en `/prisma/schema.prisma` que incluye:

- **27 modelos** principales
- **Relaciones complejas** entre entidades
- **Índices optimizados** para consultas frecuentes
- **Constraints únicos** y validaciones
- **Soporte multi-IE** con códigos de negocio

## 🚦 Estados y Flujos

### Estados de Asistencia
- `presente` - Estudiante presente
- `ausente` - Estudiante ausente  
- `tardanza` - Llegada tardía
- `justificado` - Ausencia justificada

### Estados de Retiro
- `reportado` - Retiro reportado por docente
- `contactado` - Apoderado contactado
- `en_proceso` - En proceso de entrega
- `entregado` - Estudiante entregado
- `cancelado` - Retiro cancelado

## 🔍 Validaciones

Todas las rutas incluyen validación con **Zod**:
- Tipos de datos correctos
- Campos requeridos
- Formatos válidos (email, DNI, etc.)
- Rangos numéricos apropiados

## 📊 Respuestas API

Formato estándar de respuesta:
```typescript
{
  "success": boolean,
  "data": any,           // Datos de respuesta
  "error": string,       // Mensaje de error (si aplica)
  "message": string      // Mensaje informativo (si aplica)
}
```

## 🔒 Seguridad

- **JWT** para autenticación (RNF-08)
- **bcrypt** para hash de contraseñas (RNF-09)
- **Helmet** para headers de seguridad
- **CORS** configurado para frontend
- **Validación** exhaustiva de entrada
- **Autorización** por roles en cada endpoint

## 🚀 Despliegue

```bash
# Compilar TypeScript
npm run build

# Iniciar en producción
npm start
```

## 📈 Monitoreo

- Health check: `GET /health`
- Logs estructurados con timestamps
- Manejo de errores centralizado
- Graceful shutdown con limpieza de conexiones
