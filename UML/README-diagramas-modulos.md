# Diagramas de Clases por Módulos - Sistema de Gestión Educativa

Este documento describe los diagramas de clases organizados por módulos según los diferentes actores del sistema.

## 📋 Índice de Diagramas

1. [Módulo Apoderado](#módulo-apoderado)
2. [Módulo Docente](#módulo-docente)
3. [Módulo Administrativo](#módulo-administrativo)
4. [Módulo Alumno/Estudiante](#módulo-alumnoestudiante)

---

## 🔵 Módulo Apoderado

**Archivo:** `diagrama-clases-modulo-apoderado.puml`

### Descripción
Diagrama enfocado en las funcionalidades y clases relevantes para el rol de **Apoderado** en el sistema.

### Clases Principales
- **Apoderado**: Clase central del módulo
- **Estudiante**: Estudiantes a cargo del apoderado
- **EstudianteApoderado**: Relación entre apoderado y estudiante

### Funcionalidades Clave
1. **Gestión de Asistencias**
   - Ver asistencias por clase de sus estudiantes
   - Ver asistencias de ingreso/salida a la IE
   - Consultar historial de asistencias
   - Calcular porcentaje de asistencia

2. **Gestión de Justificaciones**
   - Presentar justificaciones de inasistencias
   - Adjuntar documentos de respaldo
   - Consultar estado de justificaciones
   - Ver justificaciones aprobadas/rechazadas

3. **Gestión de Retiros**
   - Solicitar retiros anticipados
   - Autorizar retiros de estudiantes
   - Ver historial de retiros
   - Gestionar autorizaciones de retiro

4. **Comunicación**
   - Recibir notificaciones del sistema
   - Consultar reuniones programadas
   - Ver calendario escolar

### Clases Relacionadas
- `Asistencia`, `AsistenciaIE`, `EstadoAsistencia`
- `Justificacion`, `TipoJustificacion`, `DocumentoJustificacion`
- `Retiro`, `TipoRetiro`, `AutorizacionRetiro`
- `Notificacion`, `Reunion`
- `GradoSeccion`, `HorarioClase`

---

## 🟢 Módulo Docente

**Archivo:** `diagrama-clases-modulo-docente.puml`

### Descripción
Diagrama enfocado en las funcionalidades y clases relevantes para el rol de **Docente** en el sistema.

### Clases Principales
- **Docente**: Clase central del módulo
- **HorarioClase**: Horarios asignados al docente
- **DocenteAula**: Asignación de docentes a aulas

### Funcionalidades Clave
1. **Gestión de Asistencias**
   - Registrar asistencias por clase
   - Registrar ingresos/salidas a la IE
   - Modificar estados de asistencia
   - Consultar historial de asistencias

2. **Gestión de Horarios**
   - Ver horarios asignados
   - Consultar aulas asignadas
   - Ver estudiantes por clase
   - Gestionar tipo de actividad (clase, reforzamiento, evaluación)

3. **Gestión de Justificaciones**
   - Revisar justificaciones presentadas
   - Aprobar/rechazar justificaciones
   - Ver documentos adjuntos
   - Aplicar justificaciones a asistencias

4. **Gestión de Retiros**
   - Reportar retiros de estudiantes
   - Contactar apoderados
   - Registrar observaciones
   - Actualizar estados de retiro

5. **Reportes**
   - Generar reportes de asistencia
   - Consultar estadísticas por aula
   - Ver calendario escolar

### Clases Relacionadas
- `Asistencia`, `AsistenciaIE`, `EstadoAsistencia`, `HistoricoEstadoAsistencia`
- `HorarioClase`, `TipoActividadEnum`, `DocenteAula`, `TipoAsignacion`
- `Justificacion`, `TipoJustificacion`, `EstadoJustificacion`
- `Retiro`, `TipoRetiro`, `EstadoRetiro`
- `GradoSeccion`, `Estudiante`, `Apoderado`
- `CalendarioEscolar`, `Notificacion`

---

## 🟡 Módulo Administrativo

**Archivo:** `diagrama-clases-modulo-administrativo.puml`

### Descripción
Diagrama enfocado en las funcionalidades y clases relevantes para el rol **Administrativo** en el sistema. Este módulo tiene acceso completo a todas las funcionalidades del sistema.

### Clases Principales
- **Usuario**: Gestión completa de usuarios
- **Rol**: Gestión de roles y permisos
- **Ie**: Institución Educativa
- **Estudiante**, **Docente**, **Apoderado**: Gestión de todos los actores

### Funcionalidades Clave
1. **Gestión de Usuarios y Roles**
   - Crear, actualizar, eliminar usuarios
   - Asignar roles a usuarios
   - Gestionar permisos
   - Activar/desactivar usuarios

2. **Gestión de Institución Educativa**
   - Configurar datos de la IE
   - Gestionar modalidades
   - Crear estructura académica (niveles, grados, secciones)
   - Configurar calendario escolar

3. **Gestión Académica**
   - Crear y asignar grados y secciones
   - Gestionar horarios de clases
   - Asignar docentes a aulas
   - Configurar tipos de asignación

4. **Gestión de Estudiantes**
   - Registrar estudiantes
   - Asignar a grados y secciones
   - Generar códigos QR
   - Vincular con apoderados

5. **Gestión de Docentes**
   - Registrar docentes
   - Asignar especialidades
   - Asignar horarios y aulas
   - Gestionar tipos de asignación

6. **Supervisión de Asistencias**
   - Consultar todas las asistencias
   - Modificar estados de asistencia
   - Configurar estados de asistencia
   - Ver reportes generales

7. **Gestión de Justificaciones**
   - Aprobar/rechazar justificaciones
   - Configurar tipos de justificación
   - Configurar estados de justificación
   - Aplicar justificaciones masivas

8. **Gestión de Retiros**
   - Supervisar todos los retiros
   - Verificar retiros
   - Configurar tipos de retiro
   - Configurar estados de retiro
   - Gestionar autorizaciones

9. **Comunicación y Eventos**
   - Enviar notificaciones masivas
   - Crear y gestionar reuniones
   - Convocar a reuniones por grado/sección
   - Configurar calendario de eventos

10. **Reportes y Estadísticas**
    - Generar reportes generales
    - Estadísticas de asistencia
    - Reportes por estudiante/docente/aula
    - Exportar datos

### Clases Relacionadas
**Todas las clases del sistema**, incluyendo:
- Gestión de usuarios: `Usuario`, `Rol`, `UsuarioRol`
- Estructura IE: `Ie`, `Modalidad`, `Nivel`, `Grado`, `Seccion`, `GradoSeccion`
- Actores: `Estudiante`, `Docente`, `Apoderado`, `EstudianteApoderado`
- Horarios: `HorarioClase`, `DocenteAula`, `TipoAsignacion`
- Asistencias: `Asistencia`, `AsistenciaIE`, `EstadoAsistencia`
- Justificaciones: `Justificacion`, `TipoJustificacion`, `EstadoJustificacion`
- Retiros: `Retiro`, `TipoRetiro`, `EstadoRetiro`, `AutorizacionRetiro`
- Comunicación: `Notificacion`, `Reunion`, `CalendarioEscolar`

---

## 🟣 Módulo Alumno/Estudiante

**Archivo:** `diagrama-clases-modulo-alumno.puml`

### Descripción
Diagrama enfocado en las funcionalidades y clases relevantes para el rol de **Estudiante** en el sistema. Este módulo es principalmente de consulta.

### Clases Principales
- **Estudiante**: Clase central del módulo
- **Usuario**: Datos de acceso del estudiante
- **GradoSeccion**: Aula a la que pertenece

### Funcionalidades Clave
1. **Consulta de Asistencias**
   - Ver asistencias por clase
   - Ver asistencias de ingreso/salida a IE
   - Consultar historial de asistencias
   - Ver estados de asistencia
   - Calcular porcentaje de asistencia

2. **Consulta de Horarios**
   - Ver horario de clases
   - Ver materias y docentes
   - Ver aulas asignadas
   - Consultar tipo de actividad

3. **Consulta de Justificaciones**
   - Ver justificaciones presentadas
   - Consultar estado de justificaciones
   - Ver documentos adjuntos
   - Ver asistencias justificadas

4. **Consulta de Retiros**
   - Ver retiros registrados
   - Consultar estado de retiros
   - Ver apoderados autorizados para retiro
   - Ver historial de retiros

5. **Información Académica**
   - Ver datos de grado y sección
   - Consultar compañeros de aula
   - Ver docentes asignados
   - Acceder a código QR personal

6. **Información Personal**
   - Ver datos de apoderados
   - Consultar relación con apoderados
   - Ver datos de contacto

7. **Comunicación**
   - Recibir notificaciones
   - Ver reuniones programadas
   - Consultar calendario escolar
   - Ver eventos importantes

### Clases Relacionadas
- Datos personales: `Usuario`, `Estudiante`, `Apoderado`, `EstudianteApoderado`
- Estructura académica: `GradoSeccion`, `Grado`, `Seccion`, `Nivel`, `Ie`
- Horarios: `HorarioClase`, `Docente`, `TipoActividadEnum`
- Asistencias: `Asistencia`, `AsistenciaIE`, `EstadoAsistencia`, `HistoricoEstadoAsistencia`
- Justificaciones: `Justificacion`, `TipoJustificacion`, `EstadoJustificacion`, `DocumentoJustificacion`, `AsistenciaJustificacion`
- Retiros: `Retiro`, `TipoRetiro`, `EstadoRetiro`, `AutorizacionRetiro`
- Comunicación: `Notificacion`, `Reunion`, `CalendarioEscolar`

---

## 📊 Comparación de Módulos

| Funcionalidad | Apoderado | Docente | Administrativo | Alumno |
|---------------|-----------|---------|----------------|--------|
| **Ver asistencias** | ✅ (de sus hijos) | ✅ (de sus clases) | ✅ (todas) | ✅ (propias) |
| **Registrar asistencias** | ❌ | ✅ | ✅ | ❌ |
| **Presentar justificaciones** | ✅ | ❌ | ❌ | ❌ |
| **Revisar justificaciones** | ❌ | ✅ | ✅ | ❌ |
| **Solicitar retiros** | ✅ | ❌ | ❌ | ❌ |
| **Reportar retiros** | ❌ | ✅ | ✅ | ❌ |
| **Gestionar usuarios** | ❌ | ❌ | ✅ | ❌ |
| **Gestionar horarios** | ❌ | ❌ | ✅ | ❌ |
| **Ver horarios** | ✅ (de sus hijos) | ✅ (propios) | ✅ (todos) | ✅ (propios) |
| **Recibir notificaciones** | ✅ | ✅ | ✅ | ✅ |
| **Crear reuniones** | ❌ | ❌ | ✅ | ❌ |
| **Ver reuniones** | ✅ | ✅ | ✅ | ✅ |
| **Generar reportes** | ❌ | ✅ (limitados) | ✅ (completos) | ❌ |

---

## 🎯 Notación UML Utilizada

### Relaciones
- `*--` **Composición**: Relación fuerte, el componente no puede existir sin el contenedor
- `o--` **Agregación**: Relación débil, el componente puede existir independientemente
- `--` **Asociación**: Relación general entre clases
- `..>` **Dependencia**: Una clase usa otra temporalmente

### Multiplicidad
- `1` - Uno
- `0..1` - Cero o uno
- `*` - Muchos
- `1..*` - Uno o muchos

### Visibilidad
- `+` Público
- `-` Privado
- `#` Protegido

---

## 📝 Notas Importantes

1. **Separación de Responsabilidades**: Cada módulo tiene clases y funcionalidades específicas según el rol del usuario.

2. **Reutilización de Clases**: Algunas clases aparecen en múltiples módulos pero con diferentes métodos accesibles según el rol.

3. **Seguridad**: El acceso a las funcionalidades está controlado por el sistema de roles y permisos.

4. **Escalabilidad**: La arquitectura permite agregar nuevos módulos o funcionalidades sin afectar los existentes.

5. **Mantenibilidad**: La separación por módulos facilita el mantenimiento y la evolución del sistema.

---

## 🔧 Uso de los Diagramas

### Para Desarrollo
- Identificar clases y métodos necesarios para cada módulo
- Entender las relaciones entre clases
- Implementar funcionalidades específicas por rol

### Para Documentación
- Explicar la arquitectura del sistema
- Documentar funcionalidades por módulo
- Presentar en la tesis o documentación técnica

### Para Testing
- Identificar casos de prueba por módulo
- Verificar permisos y accesos
- Validar flujos de trabajo

---

## 📚 Referencias

- **Prisma Schema**: `prisma/schema.prisma` - Definición de modelos de datos
- **Documentación de Requisitos**: `documentos/RF_RNF_Sistema.md`
- **Diagrama Completo**: `diagrama-clases-sin-paquetes.puml` - Vista general del sistema

---

**Fecha de creación**: Noviembre 2025  
**Versión**: 1.0  
**Autor**: Sistema de Gestión Educativa - Proyecto Tesis
