# Scripts de Usuarios de Prueba

Este directorio contiene scripts para crear y eliminar usuarios de prueba en el sistema de gestión escolar.

## 📋 Scripts Disponibles

### 1. `seed-test-users.ts` - Crear Usuarios de Prueba

Crea usuarios de prueba con todos los roles en la institución educativa ID=1.

**Usuarios creados:**
- **2 Administrativos** (DNI: 10000001, 10000002)
- **3 Docentes** (DNI: 20000001, 20000002, 20000003)
- **4 Apoderados** (DNI: 30000001, 30000002, 30000003, 30000004)
- **2 Auxiliares** (DNI: 40000001, 40000002)
- **5 Estudiantes** (DNI: 50000001, 50000002, 50000003, 50000004, 50000005)

**Características:**
- Todos los usuarios tienen contraseñas simples para pruebas
- Los estudiantes se asignan automáticamente a grados/secciones existentes
- Se crean relaciones estudiante-apoderado automáticamente
- Se generan códigos únicos y QR para cada perfil

### 2. `cleanup-test-users.ts` - Eliminar Usuarios de Prueba

Elimina TODOS los usuarios de prueba y sus datos relacionados de forma segura.

**Proceso de eliminación:**
1. Busca usuarios por patrones de DNI de prueba
2. Elimina todas las relaciones y datos dependientes
3. Elimina perfiles específicos (estudiante, docente, apoderado)
4. Elimina roles de usuario
5. Elimina usuarios base
6. Solicita confirmación antes de ejecutar

## 🚀 Cómo Usar

### Opción 1: Usando npm scripts (Recomendado)

```bash
# Crear usuarios de prueba
npm run seed:test-users

# Eliminar usuarios de prueba
npm run cleanup:test-users
```

### Opción 2: Ejecutar directamente con tsx

```bash
# Crear usuarios de prueba
npx tsx prisma/seed-test-users.ts

# Eliminar usuarios de prueba
npx tsx prisma/cleanup-test-users.ts
```

## 🔑 Credenciales de Prueba

Después de ejecutar el seed, puedes usar estas credenciales para hacer login:

| Rol | DNI | Contraseña |
|-----|-----|------------|
| Administrativo | 10000001 | admin123 |
| Docente | 20000001 | docente123 |
| Apoderado | 30000001 | apoderado123 |
| Estudiante | 50000001 | estudiante123 |
| Auxiliar | 40000001 | auxiliar123 |

## ⚠️ Advertencias

1. **Solo para desarrollo**: Estos scripts están diseñados únicamente para entornos de desarrollo
2. **Contraseñas simples**: Las contraseñas no están hasheadas para facilitar las pruebas
3. **IE específica**: Todos los usuarios se crean en la institución educativa ID=1
4. **Eliminación completa**: El script de cleanup elimina TODOS los datos relacionados

## 🔧 Requisitos Previos

1. Base de datos configurada y migrada
2. Institución educativa con ID=1 existente
3. Al menos un grado y sección creados para asignar estudiantes
4. Dependencias instaladas (`npm install`)

## 📊 Estructura de Datos Creada

```
IE (ID=1)
├── Administrativos (2)
├── Docentes (3)
│   ├── Especialidades: Matemáticas, Comunicación, Ciencias
│   └── Códigos: DOC001, DOC002, DOC003
├── Apoderados (4)
│   ├── Ocupaciones: Ingeniero, Contador
│   ├── Códigos: APO001, APO002, APO003, APO004
│   └── Direcciones de prueba
├── Auxiliares (2)
└── Estudiantes (5)
    ├── Códigos: EST001, EST002, EST003, EST004, EST005
    ├── QR únicos generados
    ├── Fechas de nacimiento variadas
    └── Relaciones con apoderados (N:N)
```

## 🛠️ Personalización

Para modificar los datos de prueba:

1. Edita `seed-test-users.ts`
2. Cambia los rangos de DNI, nombres, o cantidades
3. Modifica las especialidades, ocupaciones, etc.
4. Ajusta las relaciones estudiante-apoderado

## 🧹 Limpieza Segura

El script de cleanup:
- Solicita confirmación antes de ejecutar
- Elimina datos en el orden correcto para evitar errores de FK
- Proporciona un resumen detallado de lo eliminado
- Maneja errores graciosamente
