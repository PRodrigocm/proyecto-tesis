# Diagramas de Clases por Paquetes - Sistema de Gestión Educativa

Este documento describe los diagramas de clases organizados por paquetes funcionales del sistema, basados en el diagrama completo `diagrama-clases-completo.puml`.

## 📋 Índice de Paquetes

1. [Institución Educativa](#1-institución-educativa)
2. [Usuarios y Roles](#2-usuarios-y-roles)
3. [Horarios y Asignaciones](#3-horarios-y-asignaciones)
4. [Asistencias](#4-asistencias)
5. [Justificaciones](#5-justificaciones)
6. [Retiros](#6-retiros)
7. [Notificaciones y Reuniones](#7-notificaciones-y-reuniones)

---

## 1. Institución Educativa

**Archivo:** `paquete-institucion-educativa.puml`

### Descripción
Paquete que contiene las clases relacionadas con la estructura organizacional de la institución educativa.

### Clases del Paquete
- **Modalidad**: Tipo de modalidad educativa (EBR, EBA, etc.)
- **Ie**: Institución Educativa principal
- **Nivel**: Niveles educativos (Inicial, Primaria, Secundaria)
- **Grado**: Grados dentro de cada nivel (1°, 2°, 3°, etc.)
- **Seccion**: Secciones (A, B, C, etc.)
- **GradoSeccion**: Combinación de grado y sección (aula)
- **CalendarioEscolar**: Calendario de eventos y días hábiles

### Relaciones Principales
- `Ie *-- Nivel` - Composición: IE contiene niveles
- `Ie *-- CalendarioEscolar` - Composición: IE contiene calendario
- `Nivel *-- Grado` - Composición: Nivel contiene grados
- `Grado o-- GradoSeccion` - Agregación: Grado agrupa grado-secciones
- `Seccion o-- GradoSeccion` - Agregación: Sección agrupa grado-secciones
- `Modalidad -- Ie` - Asociación: Modalidad clasifica IE

### Responsabilidades
- Definir la estructura jerárquica de la IE
- Gestionar niveles, grados y secciones
- Administrar el calendario escolar
- Organizar aulas (grado-sección)

---

## 2. Usuarios y Roles

**Archivo:** `paquete-usuarios-roles.puml`

### Descripción
Paquete que contiene las clases relacionadas con la gestión de usuarios, roles y actores del sistema.

### Clases del Paquete
- **Usuario**: Clase base para todos los usuarios
- **Rol**: Roles del sistema (Administrativo, Docente, Apoderado, etc.)
- **UsuarioRol**: Clase asociativa para asignación de roles
- **Estudiante**: Estudiante de la IE
- **Apoderado**: Apoderado/tutor de estudiantes
- **Docente**: Docente de la IE
- **EstudianteApoderado**: Clase asociativa entre estudiante y apoderado

### Relaciones Principales
- `Usuario *-- Estudiante` - Composición: Usuario contiene estudiante
- `Usuario *-- Apoderado` - Composición: Usuario contiene apoderado
- `Usuario *-- Docente` - Composición: Usuario contiene docente
- `Usuario -- UsuarioRol` - Asociación: Usuario tiene roles
- `Rol -- UsuarioRol` - Asociación: Rol asignado a usuarios
- `Estudiante -- EstudianteApoderado` - Asociación: Estudiante vinculado a apoderados
- `Apoderado -- EstudianteApoderado` - Asociación: Apoderado vinculado a estudiantes

### Responsabilidades
- Gestionar autenticación y autorización
- Administrar usuarios del sistema
- Asignar roles y permisos
- Vincular estudiantes con apoderados
- Gestionar datos de docentes

### Roles del Sistema
1. **Administrativo**: Acceso completo al sistema
2. **Docente**: Registro de asistencias y gestión de aulas
3. **Apoderado**: Consulta y gestión de sus estudiantes
4. **Estudiante**: Consulta de información personal
5. **Auxiliar**: Registro de ingresos/salidas

---

## 3. Horarios y Asignaciones

**Archivo:** `paquete-horarios-asignaciones.puml`

### Descripción
Paquete que contiene las clases relacionadas con la gestión de horarios de clases y asignación de docentes a aulas.

### Clases del Paquete
- **HorarioClase**: Horario de una clase específica
- **TipoAsignacion**: Tipo de asignación de docente (Tutor, Auxiliar, etc.)
- **DocenteAula**: Clase asociativa para asignación docente-aula
- **TipoActividadEnum**: Enumeración de tipos de actividad

### Relaciones Principales
- `HorarioClase ..> TipoActividadEnum` - Dependencia: Horario usa tipo de actividad
- `TipoAsignacion -- DocenteAula` - Asociación: Tipo clasifica asignación

### Responsabilidades
- Definir horarios de clases por aula
- Asignar docentes a aulas
- Especificar materias y horarios
- Gestionar tipos de actividad (clase regular, reforzamiento, etc.)
- Controlar conflictos de horarios

### Tipos de Actividad
- **CLASE_REGULAR**: Clase normal programada
- **REFORZAMIENTO**: Clase de apoyo o refuerzo
- **RECUPERACION**: Clase de recuperación
- **EVALUACION**: Evaluación o examen

---

## 4. Asistencias

**Archivo:** `paquete-asistencias.puml`

### Descripción
Paquete que contiene las clases relacionadas con el registro y gestión de asistencias de estudiantes.

### Clases del Paquete
- **Asistencia**: Asistencia a una clase específica
- **AsistenciaIE**: Asistencia de ingreso/salida a la IE
- **EstadoAsistencia**: Estados de asistencia (Presente, Falta, etc.)
- **HistoricoEstadoAsistencia**: Histórico de cambios de estado

### Relaciones Principales
- `EstadoAsistencia -- Asistencia` - Asociación: Estado clasifica asistencia
- `Asistencia *-- HistoricoEstadoAsistencia` - Composición: Asistencia contiene histórico
- `EstadoAsistencia -- HistoricoEstadoAsistencia` - Asociación: Estado en histórico

### Responsabilidades
- Registrar asistencias por clase
- Registrar ingresos/salidas a la IE
- Gestionar estados de asistencia
- Mantener histórico de cambios
- Calcular porcentajes de asistencia

### Estados de Asistencia
1. **Presente**: Estudiante asistió a tiempo
2. **Tardanza**: Estudiante llegó tarde
3. **Falta**: Estudiante no asistió
4. **Justificado**: Falta con justificación aprobada
5. **Permiso**: Permiso autorizado
6. **Falta Injustificada**: Falta sin justificación

### Tipos de Asistencia
- **Asistencia por Clase**: Registro por cada clase según horario
- **Asistencia a IE**: Registro de ingreso/salida general a la institución

---

## 5. Justificaciones

**Archivo:** `paquete-justificaciones.puml`

### Descripción
Paquete que contiene las clases relacionadas con la presentación y gestión de justificaciones de inasistencias.

### Clases del Paquete
- **Justificacion**: Justificación de inasistencias
- **TipoJustificacion**: Tipos de justificación (Enfermedad, Cita médica, etc.)
- **EstadoJustificacion**: Estados de justificación (Pendiente, Aprobada, etc.)
- **DocumentoJustificacion**: Documentos de respaldo
- **AsistenciaJustificacion**: Clase asociativa entre justificación y asistencias

### Relaciones Principales
- `TipoJustificacion -- Justificacion` - Asociación: Tipo clasifica justificación
- `EstadoJustificacion -- Justificacion` - Asociación: Estado clasifica justificación
- `Justificacion *-- DocumentoJustificacion` - Composición: Justificación contiene documentos
- `Justificacion -- AsistenciaJustificacion` - Asociación: Justificación afecta asistencias

### Responsabilidades
- Presentar justificaciones de inasistencias
- Adjuntar documentos de respaldo
- Aprobar o rechazar justificaciones
- Aplicar justificaciones a asistencias
- Gestionar tipos y estados

### Flujo de Justificación
1. **Presentación**: Apoderado presenta justificación
2. **Revisión**: Docente/Administrativo revisa
3. **Decisión**: Se aprueba o rechaza
4. **Aplicación**: Se aplica a asistencias afectadas

### Tipos de Justificación
- Enfermedad
- Cita médica
- Viaje
- Duelo familiar
- Trámite personal
- Otros

### Estados de Justificación
- Pendiente
- En revisión
- Aprobada
- Rechazada
- Vencida

---

## 6. Retiros

**Archivo:** `paquete-retiros.puml`

### Descripción
Paquete que contiene las clases relacionadas con el proceso de retiro anticipado de estudiantes.

### Clases del Paquete
- **Retiro**: Retiro anticipado de estudiante
- **TipoRetiro**: Tipos de retiro (Programado, Emergencia, etc.)
- **EstadoRetiro**: Estados del proceso de retiro
- **AutorizacionRetiro**: Autorizaciones de apoderados para retirar

### Relaciones Principales
- `TipoRetiro -- Retiro` - Asociación: Tipo clasifica retiro
- `EstadoRetiro -- Retiro` - Asociación: Estado clasifica retiro

### Responsabilidades
- Solicitar retiros anticipados
- Contactar apoderados
- Autorizar retiros
- Verificar identidad del apoderado
- Registrar entrega del estudiante
- Gestionar autorizaciones permanentes

### Flujo de Retiro
1. **Solicitud**: Apoderado solicita o docente reporta
2. **Contacto**: Se contacta al apoderado
3. **Autorización**: Apoderado autoriza el retiro
4. **Verificación**: Se verifica identidad (DNI)
5. **Entrega**: Se entrega el estudiante
6. **Completado**: Se completa el proceso

### Tipos de Retiro
- Programado
- Emergencia médica
- Emergencia familiar
- Cita médica
- Trámite personal
- Otros

### Estados del Retiro
1. Solicitado
2. Contactando apoderado
3. Apoderado contactado
4. Autorizado
5. En verificación
6. Completado
7. Cancelado

---

## 7. Notificaciones y Reuniones

**Archivo:** `paquete-notificaciones-reuniones.puml`

### Descripción
Paquete que contiene las clases relacionadas con el sistema de notificaciones y gestión de reuniones.

### Clases del Paquete
- **Notificacion**: Notificaciones del sistema
- **Reunion**: Reuniones programadas
- **TipoReunionEnum**: Enumeración de tipos de reunión

### Relaciones Principales
- `Reunion ..> TipoReunionEnum` - Dependencia: Reunión usa tipo de reunión

### Responsabilidades
- Enviar notificaciones a usuarios
- Programar reuniones
- Convocar a reuniones por grado/sección
- Notificar automáticamente
- Gestionar lectura de notificaciones

### Tipos de Notificación
- **Asistencia**: Inasistencias, tardanzas
- **Justificación**: Aprobada, rechazada
- **Retiro**: Solicitado, completado
- **Reunión**: Convocatoria
- **Sistema**: Notificaciones generales

### Tipos de Reunión
- **GENERAL**: Reunión general de apoderados
- **ENTREGA_LIBRETAS**: Entrega de libretas/boletas
- **ASAMBLEA_PADRES**: Asamblea de padres de familia
- **TUTORIAL**: Reunión tutorial (por aula)
- **EMERGENCIA**: Reunión de emergencia
- **OTRO**: Otros tipos de reunión

---

## 📊 Resumen de Paquetes

| Paquete | Clases | Enums | Responsabilidad Principal |
|---------|--------|-------|---------------------------|
| **Institución Educativa** | 7 | 0 | Estructura organizacional |
| **Usuarios y Roles** | 7 | 0 | Gestión de usuarios y permisos |
| **Horarios y Asignaciones** | 3 | 1 | Programación de clases |
| **Asistencias** | 4 | 0 | Registro de asistencias |
| **Justificaciones** | 5 | 0 | Gestión de justificaciones |
| **Retiros** | 4 | 0 | Proceso de retiros |
| **Notificaciones y Reuniones** | 2 | 1 | Comunicación y eventos |
| **TOTAL** | **32** | **2** | **Sistema completo** |

---

## 🔗 Relaciones Entre Paquetes

### Dependencias Principales

```
Institución Educativa
    ↓
Usuarios y Roles
    ↓
Horarios y Asignaciones
    ↓
Asistencias ←→ Justificaciones
    ↓
Retiros
    ↓
Notificaciones y Reuniones
```

### Interacciones Clave

1. **Institución Educativa → Usuarios y Roles**
   - IE agrupa usuarios y estudiantes
   - GradoSeccion contiene estudiantes

2. **Usuarios y Roles → Horarios y Asignaciones**
   - Docente imparte HorarioClase
   - DocenteAula asigna docentes a aulas

3. **Horarios y Asignaciones → Asistencias**
   - HorarioClase registra asistencias
   - Estudiante tiene asistencias

4. **Asistencias ↔ Justificaciones**
   - Justificación afecta asistencias
   - Asistencia puede requerir justificación

5. **Usuarios y Roles → Retiros**
   - Estudiante tiene retiros
   - Docente reporta retiros
   - Apoderado autoriza retiros

6. **Todos → Notificaciones y Reuniones**
   - Todos los paquetes pueden generar notificaciones
   - Reuniones convocan a usuarios

---

## 🎯 Uso de los Diagramas

### Para Desarrollo
1. **Implementación por paquetes**: Desarrollar cada paquete de forma independiente
2. **Pruebas unitarias**: Probar cada paquete por separado
3. **Integración**: Integrar paquetes siguiendo las dependencias

### Para Documentación
1. **Capítulos de tesis**: Un capítulo por paquete
2. **Presentaciones**: Explicar el sistema por módulos funcionales
3. **Manuales**: Documentar funcionalidades por paquete

### Para Mantenimiento
1. **Modificaciones**: Identificar rápidamente el paquete afectado
2. **Escalabilidad**: Agregar nuevas funcionalidades al paquete correspondiente
3. **Refactorización**: Mejorar un paquete sin afectar otros

---

## 📝 Ventajas de la Organización por Paquetes

✅ **Modularidad**: Cada paquete es independiente y cohesivo  
✅ **Mantenibilidad**: Fácil de mantener y actualizar  
✅ **Escalabilidad**: Fácil agregar nuevas funcionalidades  
✅ **Comprensión**: Más fácil de entender que un diagrama monolítico  
✅ **Reutilización**: Los paquetes pueden reutilizarse en otros proyectos  
✅ **Testing**: Facilita las pruebas unitarias por paquete  
✅ **Documentación**: Mejor organización de la documentación  

---

## 🔧 Notación UML Utilizada

### Relaciones
- `*--` **Composición**: Relación fuerte (el componente no puede existir sin el contenedor)
- `o--` **Agregación**: Relación débil (el componente puede existir independientemente)
- `--` **Asociación**: Relación general entre clases
- `..>` **Dependencia**: Una clase usa otra temporalmente

### Visibilidad
- `+` Público
- `-` Privado
- `#` Protegido

---

## 📚 Referencias

- **Diagrama Completo**: `diagrama-clases-completo.puml` - Vista general con paquetes
- **Diagrama Sin Paquetes**: `diagrama-clases-sin-paquetes.puml` - Vista plana
- **Prisma Schema**: `prisma/schema.prisma` - Definición de modelos de datos
- **Documentación de Requisitos**: `documentos/RF_RNF_Sistema.md`

---

**Fecha de creación**: Noviembre 2025  
**Versión**: 1.0  
**Autor**: Sistema de Gestión Educativa - Proyecto Tesis
