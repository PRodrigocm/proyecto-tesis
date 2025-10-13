# Diagramas UML del Sistema de Gestión de Asistencias y Retiros

Este directorio contiene los diagramas UML del sistema desarrollado en PlantUML. Los diagramas documentan la arquitectura, diseño y funcionamiento del sistema desde diferentes perspectivas.

## 📋 Diagramas Incluidos

### 1. Diagrama de Casos de Uso (`casos-de-uso.puml`)
**Propósito:** Define las funcionalidades del sistema desde la perspectiva de los usuarios.

**Actores principales:**
- **Apoderado**: Gestiona retiros, justificaciones y consulta asistencias
- **Docente**: Registra asistencias de aula y talleres mediante escaneo de códigos QR
- **Auxiliar**: Gestiona asistencias de IE, retiros y tolerancias mediante escaneo de códigos QR
- **Administrador**: Configuración general del sistema y gestión de códigos QR

**Casos de uso principales:**
- Gestión de asistencias (IE, aulas, talleres)
- Gestión de retiros (solicitud, aprobación, verificación)
- Gestión de justificaciones
- Sistema de notificaciones
- Administración del sistema
- Gestión de códigos QR para identificación de estudiantes

### 2. Diagrama de Clases (`diagrama-clases.puml`)
**Propósito:** Muestra la estructura estática del sistema, incluyendo clases, atributos, métodos y relaciones.

**Paquetes principales:**
- **Autenticación y Usuarios**: Usuario, Rol, Estudiante, Apoderado, Docente
- **Institución Educativa**: IE, Modalidad, Nivel, Grado, Sección
- **Asistencias**: Asistencia, EstadoAsistencia, HistoricoEstadoAsistencia
- **Justificaciones**: Justificación, TipoJustificación, DocumentoJustificación
- **Retiros**: Retiro, TipoRetiro, EstadoRetiro, AutorizaciónRetiro
- **Horarios y Talleres**: HorarioClase, Taller, HorarioTaller
- **Notificaciones**: NotificaciónConfig, ServicioNotificación
- **Códigos QR**: CodigoQR, EscanerQR

**Características destacadas:**
- Herencia y composición bien definidas
- Relaciones 1:1, 1:N y N:M claramente establecidas
- Separación de responsabilidades por paquetes
- Métodos principales de cada clase documentados

### 3. Diagramas de Actividades (Separados por Funcionalidad)
**Propósito:** Describe los flujos de trabajo y procesos de negocio del sistema.

#### 3.1. Gestión de Retiros (`actividades-gestion-retiros.puml`)
- **Solicitud de retiro** por apoderado
- **Aprobación** por apoderado titular
- **Proceso de retiro** por auxiliar
- **Notificaciones** automáticas

#### 3.2. Registro de Asistencia (`actividades-registro-asistencia.puml`)
- **Registro de entrada** con código QR
- **Registro de salida** con código QR
- **Validación** de códigos QR
- **Notificaciones** a apoderados

#### 3.3. Justificación de Inasistencias (`actividades-justificacion-inasistencia.puml`)
- **Presentación** de justificaciones
- **Revisión** por docentes/auxiliares
- **Aprobación/Rechazo** con documentos
- **Aplicación** a asistencias

**Características:**
- Flujos paralelos y decisiones condicionales
- Separación por carriles (swimlanes) según actor
- Procesos de validación y notificación integrados

### 4. Diagrama de Componentes (`diagrama-componentes.puml`)
**Propósito:** Muestra la arquitectura de software y las dependencias entre componentes.

**Capas de la arquitectura:**
- **Frontend (Next.js App)**:
  - Componentes de UI específicos por módulo
  - Componentes compartidos (UI, Forms, Modals)
  - Layouts por tipo de usuario
  
- **API Layer (Next.js API Routes)**:
  - APIs REST por funcionalidad
  - Middleware de autenticación y validación
  
- **Business Logic Layer**:
  - Servicios de negocio
  - Utilidades compartidas (JWT, Email, SMS, etc.)
  
- **Data Access Layer**:
  - Prisma ORM
  - Modelos de base de datos
  - Pool de conexiones

**Servicios externos:**
- Base de datos PostgreSQL
- Servicios de email y SMS
- Almacenamiento de archivos
- Cámaras IP

### 5. Diagramas de Secuencia (Separados por Funcionalidad)
**Propósito:** Muestra las interacciones entre objetos a lo largo del tiempo para procesos específicos.

#### 5.1. Solicitud de Retiro (`secuencia-solicitud-retiro.puml`)
- **Flujo completo** desde formulario hasta notificación
- **Validaciones** de datos y permisos
- **Creación** de registro en base de datos
- **Notificación** a apoderado titular

#### 5.2. Consulta de Retiros Pendientes (`secuencia-consulta-retiros-pendientes.puml`)
- **Consulta** de retiros pendientes por apoderado titular
- **Listado** con detalles de cada retiro
- **Manejo** de casos sin retiros pendientes
- **Navegación** a opciones de gestión

#### 5.3. Aprobación/Rechazo de Retiro (`secuencia-aprobar-rechazar-retiro.puml`)
- **Proceso de aprobación** por apoderado titular
- **Proceso de rechazo** con motivos específicos
- **Validación** de estados y permisos
- **Notificaciones** diferenciadas según acción

#### 5.4. Ejecución Física del Retiro (`secuencia-ejecutar-retiro.puml`)
- **Verificación** de identidad del apoderado
- **Localización** y acompañamiento del estudiante
- **Registro automático** de salida
- **Manejo** de situaciones especiales (estudiante ausente, apoderado no autorizado)

#### 5.5. Registro de Entrada QR (`secuencia-registro-entrada-qr.puml`)
- **Escaneo** y validación de código QR
- **Verificación** de duplicados y horarios
- **Cálculo automático** de estado (PRESENTE/TARDANZA)
- **Notificaciones** configurables a apoderados

#### 5.6. Registro de Salida QR (`secuencia-registro-salida-qr.puml`)
- **Validación** de registro de entrada previo
- **Actualización** de hora de salida
- **Verificación** de duplicados
- **Notificaciones** de salida a apoderados

#### 5.7. Consulta de Inasistencias (`secuencia-consulta-inasistencias.puml`)
- **Consulta** de inasistencias pendientes de justificar
- **Validación** de permisos y autenticación
- **Listado** filtrado por apoderado y estudiante

#### 5.8. Presentar Justificación (`secuencia-presentar-justificacion.puml`)
- **Formulario** de justificación con documentos
- **Validación** de archivos y formatos
- **Almacenamiento** de documentos respaldo
- **Notificación** a revisores

#### 5.9. Revisión de Justificación (`secuencia-revision-justificacion.puml`)
- **Proceso de revisión** por docentes/auxiliares
- **Aprobación/Rechazo** con motivos
- **Solicitud** de documentación adicional
- **Notificaciones** de resultado

#### 5.10. Aplicación de Justificaciones (`secuencia-justificacion-inasistencia.puml`)
- **Proceso automático** programado
- **Aplicación** a registros de asistencia
- **Manejo de errores** y logs
- **Notificaciones** de confirmación

**Características:**
- Interacciones entre frontend, backend y servicios externos
- Manejo de autenticación y autorización
- Procesamiento de archivos y notificaciones
- Integración con sistema de códigos QR

### 6. Diagrama de Estados (`diagrama-estados.puml`)
**Propósito:** Modela los diferentes estados que pueden tener los objetos del sistema y las transiciones entre ellos.

**Estados modelados:**
- **Estados de Retiro**: Desde solicitud hasta completado/cancelado
- **Estados de Justificación**: Ciclo de vida de una justificación de inasistencia
- **Estados de Asistencia**: Diferentes tipos de registro de asistencia
- **Estados de Usuario**: Gestión del ciclo de vida de cuentas de usuario
- **Estados de Sesión**: Manejo de autenticación y sesiones
- **Estados de Códigos QR**: Estados de validez y activación de códigos

**Características:**
- Transiciones claramente definidas entre estados
- Estados finales e iniciales identificados
- Condiciones de transición documentadas
- Manejo de estados de error y excepciones

### 7. Diagrama de Despliegue (`diagrama-despliegue.puml`)
**Propósito:** Define la arquitectura física del sistema y la distribución de componentes en la infraestructura.

**Nodos de despliegue:**
- **Cliente Web**: Navegadores y aplicación React/Next.js
- **Servidor de Aplicación**: Next.js server con APIs y lógica de negocio
- **Servidor de Base de Datos**: PostgreSQL con Prisma ORM
- **Servidor de Archivos**: Almacenamiento de documentos y multimedia
- **Servidor de Notificaciones**: Procesamiento de emails y SMS
- **Red de Cámaras IP**: Dispositivos de captura de video
- **Servidor de Procesamiento de Video**: Análisis de imágenes y reconocimiento

**Especificaciones técnicas:**
- Requisitos de hardware por servidor
- Configuración de red y protocolos
- Especificaciones de rendimiento
- Configuración de seguridad
- Plan de backup y recuperación

## 🛠️ Cómo Visualizar los Diagramas

### Opción 1: PlantUML Online
1. Visita [PlantUML Online Server](http://www.plantuml.com/plantuml/uml/)
2. Copia y pega el contenido de cualquier archivo `.puml`
3. El diagrama se generará automáticamente

### Opción 2: VS Code con Extensión
1. Instala la extensión "PlantUML" en VS Code
2. Abre cualquier archivo `.puml`
3. Usa `Ctrl+Shift+P` → "PlantUML: Preview Current Diagram"

### Opción 3: PlantUML Local
1. Instala Java y PlantUML
2. Ejecuta: `java -jar plantuml.jar archivo.puml`
3. Se generará una imagen PNG del diagrama

## 📊 Información del Sistema

**Tecnologías principales:**
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Autenticación**: JWT (JSON Web Tokens)
- **Códigos QR**: Generación y validación de códigos QR para estudiantes
- **Notificaciones**: Email SMTP, SMS Gateway

**Características del sistema:**
- Arquitectura de capas bien definida
- Separación de responsabilidades
- Escalabilidad horizontal
- Seguridad mediante autenticación y autorización
- Sistema de identificación mediante códigos QR
- Sistema de notificaciones multi-canal
- Gestión completa del ciclo de vida de asistencias y retiros

## 🔄 Mantenimiento de Diagramas

Los diagramas deben actualizarse cuando:
- Se agreguen nuevas funcionalidades
- Se modifique la arquitectura del sistema
- Se cambien las relaciones entre entidades
- Se actualice la infraestructura de despliegue

**Responsable**: Equipo de desarrollo
**Frecuencia**: Con cada release mayor del sistema

---

*Última actualización: Octubre 2024*
*Versión del sistema: 1.0*
