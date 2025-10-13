# Generación de Códigos QR para Estudiantes

Este script genera códigos QR para todos los estudiantes registrados en la base de datos y los compila en un archivo PDF listo para imprimir.

## 🎯 Características

### **Generación de QR Codes:**
- **Basado en DNI**: Cada código QR contiene el DNI del estudiante
- **Formato estándar**: Compatible con lectores QR estándar
- **Alta calidad**: 200x200 píxeles con margen apropiado

### **PDF Organizado:**
- **Layout de tarjetas**: 2 columnas x 4 filas por página (8 tarjetas por página)
- **Información completa**: Nombre, DNI, grado, sección e ID del estudiante
- **Ordenamiento inteligente**: Por grado, sección y apellido
- **Diseño profesional**: Bordes, tipografía clara y espaciado apropiado

### **Actualización de Base de Datos:**
- **Campo QR actualizado**: El campo `qr` en la tabla `estudiante` se actualiza con el DNI
- **Sincronización automática**: Los códigos QR quedan registrados en la BD

## 🚀 Uso del Script

### **Ejecutar la Generación:**
```bash
npm run generate:qr-pdf
```

### **Salida del Script:**
```
🚀 INICIANDO GENERACIÓN DE CÓDIGOS QR PARA ESTUDIANTES
============================================================
📚 Obteniendo estudiantes de la base de datos...
✅ Encontrados 25 estudiantes
🔄 Generando QR para: Pérez, Juan (DNI: 12345678)
🔄 Generando QR para: García, María (DNI: 87654321)
...
📄 Generando PDF con códigos QR...
💾 Actualizando códigos QR en la base de datos...
✅ Códigos QR actualizados en la base de datos

📊 ESTADÍSTICAS DE GENERACIÓN:
==================================================
📚 Estudiantes por grado y sección:
   1° A: 5 estudiantes
   1° B: 4 estudiantes
   2° A: 6 estudiantes
   2° B: 5 estudiantes
   3° A: 5 estudiantes

📈 Total de códigos QR generados: 25
📅 Fecha de generación: 11/10/2024 15:52:30

🎉 PROCESO COMPLETADO EXITOSAMENTE
============================================================
📁 Archivo PDF generado: /ruta/output/codigos-qr-estudiantes-2024-10-11.pdf
💡 Los códigos QR están basados en el DNI de cada estudiante
💾 Los códigos QR han sido actualizados en la base de datos
```

## 📋 Estructura del PDF

### **Página de Título:**
- Título del documento
- Fecha de generación
- Total de estudiantes

### **Tarjetas de Estudiantes:**
Cada tarjeta contiene:
- **Nombre completo**: Apellido, Nombre
- **DNI**: Número de documento
- **Grado y Sección**: Ej. "1° A"
- **ID del estudiante**: Identificador único
- **Código QR**: Basado en el DNI

### **Layout de Tarjetas:**
```
┌─────────────────┬─────────────────┐
│ Pérez, Juan     │ García, María   │
│ DNI: 12345678   │ DNI: 87654321   │
│ Grado: 1° A     │ Grado: 1° A     │
│ ID: 1           │ ID: 2           │
│           [QR]  │           [QR]  │
├─────────────────┼─────────────────┤
│ López, Carlos   │ Martín, Ana     │
│ ...             │ ...             │
└─────────────────┴─────────────────┘
```

## 📁 Archivos Generados

### **Ubicación:**
- **Directorio**: `./output/`
- **Nombre**: `codigos-qr-estudiantes-YYYY-MM-DD.pdf`
- **Ejemplo**: `codigos-qr-estudiantes-2024-10-11.pdf`

### **Formato del Archivo:**
- **Tamaño**: A4 (210 x 297 mm)
- **Orientación**: Vertical
- **Calidad**: Alta resolución para impresión

## 🔧 Configuración Técnica

### **Dependencias Utilizadas:**
- **`@prisma/client`**: Acceso a la base de datos
- **`qrcode`**: Generación de códigos QR
- **`jspdf`**: Creación del archivo PDF
- **`fs` y `path`**: Manejo de archivos

### **Configuración de QR:**
```typescript
{
  width: 200,        // Tamaño en píxeles
  margin: 2,         // Margen interno
  color: {
    dark: '#000000', // Color del código
    light: '#FFFFFF' // Color de fondo
  }
}
```

### **Configuración de PDF:**
```typescript
{
  format: 'a4',           // Tamaño A4
  orientation: 'portrait', // Vertical
  unit: 'mm',             // Unidades en milímetros
  cardSize: '85x60mm',    // Tamaño de cada tarjeta
  cardsPerPage: 8         // 2x4 tarjetas por página
}
```

## ⚠️ Consideraciones Importantes

### **Requisitos Previos:**
1. **Base de datos configurada** con estudiantes
2. **DNI válido** para cada estudiante
3. **Permisos de escritura** en el directorio `./output/`

### **Validaciones del Script:**
- **DNI obligatorio**: Estudiantes sin DNI son omitidos con advertencia
- **Manejo de errores**: Errores de QR individual no detienen el proceso
- **Verificación de datos**: Validación de campos antes de procesar

### **Limitaciones:**
- **Memoria**: Para muchos estudiantes (>1000), considerar procesamiento por lotes
- **Tamaño de archivo**: PDFs grandes pueden tardar en generar
- **Formato de DNI**: Debe ser texto válido para QR

## 🎨 Personalización

### **Modificar Layout:**
```typescript
// En generate-qr-pdf.ts
const cardsPerRow = 3      // Cambiar a 3 columnas
const cardsPerColumn = 5   // Cambiar a 5 filas
const cardWidth = 60       // Reducir ancho de tarjeta
const cardHeight = 50      // Reducir alto de tarjeta
```

### **Cambiar Información Mostrada:**
```typescript
// Agregar más campos en la tarjeta
doc.text(`Código: ${estudiante.codigo}`, x + 2, y + 29)
doc.text(`Teléfono: ${estudiante.telefono}`, x + 2, y + 34)
```

### **Personalizar QR:**
```typescript
// Cambiar configuración del QR
const qrCodeDataURL = await QRCode.toDataURL(dni, {
  width: 150,              // Tamaño más pequeño
  errorCorrectionLevel: 'H', // Mayor corrección de errores
  type: 'image/png',       // Formato específico
  margin: 1                // Margen más pequeño
})
```

## 📊 Casos de Uso

### **1. Inicio de Año Escolar:**
- Generar QR para todos los estudiantes nuevos
- Imprimir y laminar las tarjetas
- Distribuir a estudiantes y docentes

### **2. Actualización de Datos:**
- Regenerar cuando hay cambios en la información
- Mantener sincronización con la base de datos

### **3. Control de Asistencia:**
- Los códigos QR se usan para registro de entrada/salida
- Integración con sistema de asistencia por QR

### **4. Identificación Rápida:**
- Docentes pueden escanear para identificar estudiantes
- Acceso rápido a información del estudiante

## 🔄 Mantenimiento

### **Ejecutar Periódicamente:**
- **Mensual**: Para incluir estudiantes nuevos
- **Semestral**: Para actualizar información cambiada
- **Anual**: Para regeneración completa

### **Backup de Archivos:**
- Mantener copias de PDFs anteriores
- Versionado por fecha de generación

### **Monitoreo:**
- Verificar que todos los estudiantes tengan DNI
- Revisar calidad de impresión de códigos QR
- Validar funcionamiento con lectores QR

¡El script está listo para generar códigos QR profesionales para todos tus estudiantes! 🎉
