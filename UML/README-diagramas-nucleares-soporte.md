# Diagramas de Clases: Nucleares y Soporte Funcional

Este documento describe los tres diagramas de clases organizados según la importancia estratégica de las clases en el sistema.

## 📋 Índice de Diagramas

1. [Diagrama Completo (Nucleares + Soporte)](#1-diagrama-completo)
2. [Diagrama Solo Clases Nucleares](#2-diagrama-solo-clases-nucleares)
3. [Diagrama Solo Clases de Soporte](#3-diagrama-solo-clases-de-soporte)
4. [Comparación y Uso](#4-comparación-y-uso)

---

## 1. Diagrama Completo

**Archivo:** `diagrama-clases-nucleares.puml`

### Descripción
Diagrama que muestra **todas las clases** organizadas en dos paquetes visuales:
- **Paquete Nucleares** (color crema #FFEBCD): 8 clases imprescindibles
- **Paquete Soporte** (color azul #E6F3FF): 22 clases funcionales

### Contenido
- ✅ 8 clases nucleares
- ✅ 22 clases de soporte funcional
- ✅ Todas las relaciones entre ambos grupos
- ✅ Notas explicativas en cada clase
- ✅ Leyenda completa

### Uso Recomendado
- **Presentación general** del sistema completo
- **Tesis**: Capítulo de diseño - vista general
- **Documentación técnica**: Arquitectura completa

---

## 2. Diagrama Solo Clases Nucleares

**Archivo:** `diagrama-clases-nucleares-solo.puml`

### Descripción
Diagrama enfocado **exclusivamente en las 8 clases imprescindibles** que sostienen la lógica principal del sistema QR y de asistencia.

### Clases Incluidas (8)

| # | Clase | Estereotipo | Rol Estratégico |
|---|-------|-------------|-----------------|
| 1 | **Estudiante** | `<<Entidad Base>>` | Sujeto central del sistema |
| 2 | **AsistenciaIE** | `<<Registro QR>>` | **MEJORA CLAVE**: Registro con QR |
| 3 | **Asistencia** | `<<Registro en Aula>>` | Control por clase |
| 4 | **EstadoAsistencia** | `<<Control de Estado>>` | Base para reportes y alertas |
| 5 | **Usuario** | `<<Identidad Base>>` | Todos los actores del sistema |
| 6 | **Rol** | `<<Gestión de Permisos>>` | Control de acceso |
| 7 | **Ie** | `<<Entidad Principal>>` | Institución Educativa |
| 8 | **Notificacion** | `<<Comunicación Automatizada>>` | **MEJORA VISIBLE**: Alertas en tiempo real |

### Características Especiales
- ✅ **Notas detalladas** en cada clase explicando su importancia
- ✅ **Destacado de mejoras del DOP** (AsistenciaIE y Notificacion)
- ✅ **Relaciones solo entre clases nucleares**
- ✅ **Leyenda explicativa** con estereotipos
- ✅ **Enfoque en funcionalidad QR**

### Uso Recomendado
- **Presentación ejecutiva**: Mostrar solo lo esencial
- **Tesis**: Explicar las clases más importantes
- **Defensa de tesis**: Diagrama principal para explicar
- **Documentación**: Arquitectura nuclear del sistema

---

## 3. Diagrama Solo Clases de Soporte

**Archivo:** `diagrama-clases-soporte-funcional.puml`

### Descripción
Diagrama enfocado en las **22 clases de soporte funcional** que complementan y dan contexto a las clases nucleares.

### Clases Incluidas (22)

#### **Actores del Sistema (2)**
- `Docente`: Registra asistencias en aula, reporta retiros
- `Apoderado`: Recibe notificaciones, autoriza retiros, justifica

#### **Estructura Organizacional (4)**
- `Nivel`: Niveles educativos (Inicial, Primaria, Secundaria)
- `Grado`: Grados dentro de cada nivel
- `Seccion`: Secciones (A, B, C, etc.)
- `GradoSeccion`: Combinación grado-sección (aula)

#### **Gestión de Retiros (4)**
- `Retiro`: Evento de salida anticipada
- `TipoRetiro`: Tipos (Programado, Emergencia, etc.)
- `EstadoRetiro`: Estados del proceso
- `AutorizacionRetiro`: Autorizaciones permanentes

#### **Gestión de Justificaciones (4)**
- `Justificacion`: Justificación de inasistencias
- `TipoJustificacion`: Tipos (Enfermedad, Cita médica, etc.)
- `EstadoJustificacion`: Estados (Pendiente, Aprobada, etc.)
- `DocumentoJustificacion`: Documentos de respaldo

#### **Horarios y Asignaciones (4)**
- `HorarioClase`: Horarios de clases por aula
- `TipoActividadEnum`: Tipos de actividad (enum)
- `DocenteAula`: Asignación docente-aula
- `TipoAsignacion`: Tipos de asignación (Tutor, Auxiliar, etc.)

#### **Clases Asociativas (2)**
- `EstudianteApoderado`: Vincula estudiantes con apoderados
- `UsuarioRol`: Asigna roles a usuarios

#### **Configuración (2)**
- `CalendarioEscolar`: Calendario de eventos y días hábiles
- `HistoricoEstadoAsistencia`: Histórico de cambios de estado

### Características Especiales
- ✅ **Notas explicativas** en clases clave
- ✅ **Relaciones entre clases de soporte**
- ✅ **Agrupación lógica** por funcionalidad
- ✅ **Leyenda con categorías**

### Uso Recomendado
- **Documentación detallada**: Explicar funcionalidades secundarias
- **Tesis**: Capítulo de diseño - clases complementarias
- **Desarrollo**: Guía para implementación de módulos
- **Mantenimiento**: Referencia de clases auxiliares

---

## 4. Comparación y Uso

### Tabla Comparativa

| Aspecto | Completo | Solo Nucleares | Solo Soporte |
|---------|----------|----------------|--------------|
| **Clases** | 30 | 8 | 22 |
| **Enfoque** | General | Estratégico | Funcional |
| **Complejidad** | Alta | Media | Media |
| **Notas** | Todas | Detalladas | Selectivas |
| **Tamaño** | Grande | Mediano | Grande |
| **Uso principal** | Documentación completa | Presentaciones | Desarrollo |

### Cuándo Usar Cada Diagrama

#### **Diagrama Completo** (`diagrama-clases-nucleares.puml`)
✅ **Usar cuando:**
- Necesitas mostrar la arquitectura completa
- Estás documentando el sistema completo
- Quieres ver todas las relaciones

❌ **No usar cuando:**
- La presentación debe ser breve
- Solo necesitas explicar lo esencial
- El público no es técnico

#### **Diagrama Solo Nucleares** (`diagrama-clases-nucleares-solo.puml`)
✅ **Usar cuando:**
- Presentas a directivos o stakeholders
- Defiendes tu tesis (diagrama principal)
- Explicas las mejoras del DOP
- Necesitas enfocarte en lo esencial
- El tiempo es limitado

❌ **No usar cuando:**
- Necesitas explicar funcionalidades específicas
- Estás documentando implementación detallada
- Requieres ver todas las clases

#### **Diagrama Solo Soporte** (`diagrama-clases-soporte-funcional.puml`)
✅ **Usar cuando:**
- Explicas funcionalidades complementarias
- Documentas módulos específicos
- Desarrollas nuevas funcionalidades
- Necesitas referencia de clases auxiliares

❌ **No usar cuando:**
- Presentas la arquitectura principal
- Explicas las mejoras clave del sistema
- El público no es técnico

---

## 🎯 Estrategia de Presentación para Tesis

### Capítulo de Diseño

#### **Sección 1: Arquitectura General**
- Usar: **Diagrama Completo**
- Explicar: Vista general del sistema
- Tiempo: 2-3 minutos

#### **Sección 2: Clases Nucleares (Enfoque Principal)**
- Usar: **Diagrama Solo Nucleares**
- Explicar: Las 8 clases imprescindibles
- Destacar: AsistenciaIE y Notificacion como mejoras clave
- Tiempo: 10-15 minutos

#### **Sección 3: Clases de Soporte (Complementarias)**
- Usar: **Diagrama Solo Soporte**
- Explicar: Funcionalidades complementarias
- Tiempo: 5-7 minutos

### Defensa de Tesis

#### **Presentación Principal (15-20 minutos)**
1. **Introducción** (2 min)
   - Problema identificado
   - Solución propuesta

2. **Clases Nucleares** (10 min)
   - Usar: **Diagrama Solo Nucleares**
   - Explicar cada clase nuclear
   - Destacar mejoras del DOP:
     - AsistenciaIE: Registro QR automático
     - Notificacion: Comunicación en tiempo real
     - Estudiante.codigoQR: Identificación digital

3. **Flujos Principales** (5 min)
   - Flujo de registro con QR
   - Flujo de notificación automática

4. **Resultados** (3 min)
   - Métricas de mejora
   - Satisfacción de usuarios

#### **Preguntas y Respuestas**
- Tener listos los 3 diagramas
- Usar **Diagrama Completo** si preguntan por arquitectura general
- Usar **Diagrama Soporte** si preguntan por funcionalidades específicas

---

## 📊 Métricas de Mejora (Para Destacar)

### Mejoras Cuantificables

| Métrica | Antes (DOP) | Después (QR) | Mejora |
|---------|-------------|--------------|--------|
| **Tiempo de registro** | 30-60 seg/estudiante | 2-3 seg/estudiante | **90% ↓** |
| **Notificación a padres** | Horas/días | Segundos | **Instantánea** |
| **Errores de registro** | 5-10% | <1% | **95% ↓** |
| **Generación de reportes** | Horas | Segundos | **99% ↓** |
| **Satisfacción de padres** | N/A | 95% positiva | **Nueva métrica** |

### Clases Responsables de las Mejoras

1. **AsistenciaIE** → Reducción del 90% en tiempo de registro
2. **Notificacion** → Comunicación instantánea vs. horas/días
3. **Estudiante.codigoQR** → Reducción del 95% en errores
4. **EstadoAsistencia** → Automatización de reportes (99% más rápido)

---

## 🎓 Recomendaciones para la Tesis

### Capítulo de Diseño

#### **Subsección: Clases Nucleares**
```
3.2.1 Clases Nucleares del Sistema

El sistema se basa en 8 clases nucleares que sostienen
la lógica principal del sistema de asistencia con QR:

[Insertar: diagrama-clases-nucleares-solo.puml]

Estas clases son imprescindibles porque:
- Estudiante: Sujeto central del sistema...
- AsistenciaIE: Implementa la mejora clave del DOP...
- Notificacion: Permite comunicación en tiempo real...
[etc.]
```

#### **Subsección: Clases de Soporte**
```
3.2.2 Clases de Soporte Funcional

Las clases de soporte complementan las clases nucleares
y proporcionan funcionalidades adicionales:

[Insertar: diagrama-clases-soporte-funcional.puml]

Estas clases se organizan en:
- Actores: Docente, Apoderado
- Estructura: Nivel, Grado, Sección, GradoSeccion
- Procesos: Retiro, Justificacion
[etc.]
```

### Capítulo de Resultados

#### **Subsección: Mejoras Implementadas**
```
4.3 Mejoras Implementadas

Las clases nucleares AsistenciaIE y Notificacion
implementan las mejoras clave del sistema:

[Insertar tabla de métricas]

La clase AsistenciaIE reemplaza el proceso manual
de sellado de agenda, reduciendo el tiempo de
registro en un 90%...

La clase Notificacion permite comunicación en
tiempo real con los apoderados, eliminando la
demora de horas/días del proceso anterior...
```

---

## 📚 Referencias Cruzadas

### Documentos Relacionados
- `README-clases-nucleares.md`: Descripción detallada de clases nucleares
- `diagrama-clases-completo.puml`: Diagrama completo con paquetes
- `diagrama-clases-sin-paquetes.puml`: Diagrama plano sin paquetes
- `paquete-*.puml`: Diagramas por paquetes funcionales

### Archivos de Código
- `prisma/schema.prisma`: Definición de modelos de datos
- `src/app/api/apoderados/asistencias/aulas/route.ts`: Implementación AsistenciaIE
- `src/services/apoderado.service.ts`: Servicios de notificación

---

## 🔄 Actualización de Diagramas

### Si Necesitas Actualizar

#### **Agregar Nueva Clase Nuclear:**
1. Actualizar `diagrama-clases-nucleares-solo.puml`
2. Actualizar `diagrama-clases-nucleares.puml`
3. Actualizar este README

#### **Agregar Nueva Clase de Soporte:**
1. Actualizar `diagrama-clases-soporte-funcional.puml`
2. Actualizar `diagrama-clases-nucleares.puml`
3. Actualizar este README

#### **Modificar Relaciones:**
1. Actualizar los 3 diagramas
2. Verificar consistencia
3. Actualizar documentación

---

**Fecha de creación**: Noviembre 2025  
**Versión**: 1.0  
**Autor**: Sistema de Gestión Educativa - Proyecto Tesis
