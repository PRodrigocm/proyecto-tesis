# 📄 Generador de Códigos QR - Instrucciones de Uso

## 🎯 Funcionalidad Implementada

Se ha creado un sistema completo para generar un PDF con todos los códigos QR de los estudiantes registrados en el sistema.

## 📁 Archivos Creados

### 1. Componente Principal
- **`/src/components/admin/GeneradorQRPDF.tsx`**
  - Componente React que maneja la generación del PDF
  - Carga estudiantes desde la API
  - Genera códigos QR individuales
  - Crea PDF con layout optimizado

### 2. Página de Administración
- **`/src/app/admin/dashboard/codigos-qr/page.tsx`**
  - Página completa con instrucciones
  - Integración con el componente generador
  - Guías paso a paso para el usuario

### 3. API de Estudiantes
- **`/src/app/api/usuarios/estudiantes/route.ts`**
  - Endpoint para obtener lista de estudiantes
  - Filtrado por institución educativa
  - Datos optimizados para generación de QR

## 🚀 Cómo Usar

### Paso 1: Acceder al Generador
1. Inicia sesión como **Administrador**
2. Ve al **Dashboard de Administración**
3. Haz clic en **"📱 Códigos QR"**

### Paso 2: Generar PDF
1. Haz clic en **"Cargar Estudiantes"**
2. Revisa la lista de estudiantes encontrados
3. Haz clic en **"📄 Generar PDF"**
4. El PDF se descargará automáticamente

## 📋 Características del PDF

### Formato
- **Tamaño**: A4 (210 x 297 mm)
- **Orientación**: Vertical
- **Layout**: 2 columnas x 4 filas = 8 tarjetas por página
- **Márgenes**: Optimizados para impresión

### Contenido de Cada Tarjeta
- **Código QR**: 40mm x 40mm (tamaño óptimo para escaneo)
- **Nombre Completo**: Del estudiante
- **Código Único**: Formato EST0001, EST0002, etc.
- **Grado y Sección**: Ej: "1° - Sección A"

### Ejemplo de Tarjeta
```
┌─────────────────────────────────┐
│ [QR CODE]  Juan Pérez García    │
│  40x40mm   Código: EST0001      │
│            1° - Sección A       │
└─────────────────────────────────┘
```

## 🔧 Funcionalidades Técnicas

### Generación de QR
- **Librería**: `qrcode` v1.5.4
- **Formato**: PNG con alta resolución
- **Contenido**: Código único del estudiante
- **Configuración**: Margen mínimo, colores negro/blanco

### Generación de PDF
- **Librería**: `jspdf` v3.0.3
- **Paginación**: Automática cuando se supera el límite
- **Numeración**: Páginas numeradas automáticamente
- **Título**: En cada página

### Carga de Datos
- **API**: `/api/usuarios/estudiantes`
- **Autenticación**: JWT requerido
- **Filtrado**: Solo estudiantes activos de la IE
- **Ordenamiento**: Por grado, sección, apellido, nombre

## 📊 Datos de Ejemplo

Si no hay estudiantes en la base de datos, el sistema mostrará datos de ejemplo:

```javascript
[
  { nombre: 'Juan Pérez', codigo: 'EST001', grado: '1°', seccion: 'A' },
  { nombre: 'María González', codigo: 'EST002', grado: '1°', seccion: 'A' },
  { nombre: 'Carlos López', codigo: 'EST003', grado: '1°', seccion: 'B' },
  // ... más estudiantes
]
```

## 🎨 Interfaz de Usuario

### Dashboard Principal
El botón **"📱 Códigos QR"** se agregó al dashboard de administración con:
- **Icono**: QR code rosa
- **Descripción**: "Generar PDF con códigos QR de estudiantes"
- **Ubicación**: Sección "Reportes y Análisis"

### Página de Códigos QR
- **Header**: Título y descripción clara
- **Componente Principal**: Generador con estadísticas
- **Instrucciones**: Guía paso a paso numerada
- **Características**: Información técnica del PDF

## ⚙️ Configuración Técnica

### Dependencias Requeridas
```json
{
  "qrcode": "^1.5.4",
  "jspdf": "^3.0.3",
  "@types/qrcode": "^1.5.5"
}
```

### Variables de Entorno
- **JWT_SECRET**: Para autenticación de API
- **DATABASE_URL**: Conexión a base de datos

### Permisos Requeridos
- **Rol**: ADMINISTRATIVO
- **Acceso**: Dashboard de administración
- **API**: Lectura de estudiantes

## 🔍 Casos de Uso

### 1. Inicio de Año Escolar
- Generar códigos QR para todos los estudiantes nuevos
- Imprimir y distribuir tarjetas de identificación
- Configurar sistema de asistencia por QR

### 2. Estudiantes Nuevos
- Generar códigos individuales para nuevos ingresos
- Agregar al sistema de control de asistencia
- Entregar tarjeta personalizada

### 3. Reposición de Tarjetas
- Regenerar códigos para tarjetas perdidas
- Mantener mismo código único del estudiante
- Imprimir tarjetas de reemplazo

## 📱 Integración con Sistema de Asistencia

Los códigos QR generados son compatibles con:
- **Modal de Asistencia**: Escaneo directo con cámara
- **Cámara IP**: Uso de teléfono como cámara
- **Cámara Local**: Webcam integrada del dispositivo

### Flujo de Asistencia
1. **Docente** abre modal de tomar asistencia
2. **Estudiante** presenta su código QR
3. **Sistema** escanea y registra asistencia automáticamente
4. **Confirmación** visual y sonora del registro

## 🚨 Consideraciones Importantes

### Seguridad
- Solo administradores pueden generar códigos
- Códigos únicos por estudiante
- No contienen información personal sensible

### Calidad de Impresión
- Usar papel blanco de buena calidad
- Impresora con resolución mínima 300 DPI
- Evitar escalado que distorsione los códigos QR

### Mantenimiento
- Regenerar códigos si cambia el formato
- Actualizar cuando hay nuevos estudiantes
- Revisar periódicamente la funcionalidad de escaneo

## 📞 Soporte

Si encuentras problemas:
1. Verifica que tengas permisos de administrador
2. Asegúrate de que hay estudiantes registrados
3. Revisa la consola del navegador para errores
4. Reinicia el servidor si es necesario

---

**¡El sistema está listo para generar códigos QR profesionales para todos tus estudiantes!** 🎓✨
