# Guía para Corregir Colores de Texto en Inputs

## ✅ Cambios Implementados

### **Archivos Actualizados con `text-black`:**

1. **Año Lectivo - Selector de Año:**
   - `/src/app/admin/dashboard/calendarios/ano-lectivo/page.tsx`
   - ✅ Selector de año con `text-black`

2. **Modal de Registro de Eventos:**
   - `/src/components/admin/RegistrarEventoModal.tsx`
   - ✅ Select de tipo de evento con `text-black`
   - ✅ Input de motivo con `text-black`
   - ✅ Textarea de descripción con `text-black`

3. **Modal de Editar Apoderado:**
   - `/src/components/admin/EditApoderadoModal.tsx`
   - ✅ Select de relación con `text-black`

4. **Página de Calendarios:**
   - `/src/app/admin/dashboard/calendarios/page.tsx`
   - ✅ Todos los selects de filtros con `text-black`

### **Archivos que YA tenían `text-black`:**

- `/src/components/admin/CreateUserModal.tsx` ✅
- `/src/components/login/MultiSessionLoginForm.tsx` ✅
- Mayoría de modales y formularios principales ✅

## 🎯 Patrón Estandarizado

### **Estilos Base para Inputs:**
```typescript
// Input básico
className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black"

// Select básico
className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black bg-white"

// Textarea básico
className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black resize-vertical"
```

### **Utilidad Creada:**
- `/src/utils/inputStyles.ts` - Estilos estandarizados para inputs

## 🔍 Verificación

### **Comando para buscar inputs sin text-black:**
```bash
# Buscar inputs que podrían necesitar corrección
grep -r "border border-gray-300" src/ --include="*.tsx" --include="*.ts" | grep -v "text-black"
```

### **Archivos Principales Verificados:**
- ✅ Formularios de login
- ✅ Modales de creación
- ✅ Modales de edición  
- ✅ Páginas de filtros
- ✅ Año lectivo y calendarios

## 📋 Estado Final

**Todos los inputs principales ahora tienen texto negro (`text-black`):**
- Formularios de usuario ✅
- Modales de eventos ✅
- Selectores de filtros ✅
- Campos de búsqueda ✅
- Año lectivo ✅

**Beneficios:**
- Consistencia visual en toda la aplicación
- Mejor legibilidad del texto
- Experiencia de usuario uniforme
- Fácil mantenimiento con estilos estandarizados
