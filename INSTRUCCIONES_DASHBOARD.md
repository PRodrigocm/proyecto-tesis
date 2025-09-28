# INSTRUCCIONES PARA ARREGLAR DASHBOARD CON DATOS REALES

## PROBLEMA IDENTIFICADO:
El dashboard sigue mostrando datos estáticos (45, 180, 8, 156) porque no se aplicaron los cambios al archivo principal.

## SOLUCIÓN RÁPIDA:

### 1. Abrir el archivo:
```
src/app/admin/page.tsx
```

### 2. Buscar la función `loadDashboardData` (líneas 58-78) y reemplazar COMPLETAMENTE por:

```typescript
const loadDashboardData = async () => {
  try {
    const token = localStorage.getItem('token')
    
    // Cargar estadísticas reales desde la API
    const response = await fetch('/api/dashboard/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      console.log('📊 Estadísticas reales cargadas:', result.data)
      setStats(result.data)
    } else {
      console.error('❌ Error al cargar estadísticas:', response.status)
      const errorText = await response.text()
      console.error('❌ Error details:', errorText)
      
      // Fallback a datos de ejemplo si la API falla
      setStats({
        totalUsuarios: 0,
        totalEstudiantes: 0,
        totalDocentes: 0,
        totalApoderados: 0,
        totalTalleres: 0,
        asistenciasHoy: 0
      })
    }
  } catch (error) {
    console.error('💥 Error loading dashboard data:', error)
    
    // Fallback a datos de ejemplo si hay error
    setStats({
      totalUsuarios: 0,
      totalEstudiantes: 0,
      totalDocentes: 0,
      totalApoderados: 0,
      totalTalleres: 0,
      asistenciasHoy: 0
    })
  } finally {
    setIsLoading(false)
  }
}
```

### 3. Guardar el archivo y recargar el navegador

### 4. Verificar en la consola del navegador:
- Buscar logs que digan: "📊 Estadísticas reales cargadas:"
- Si hay errores, buscar: "❌ Error al cargar estadísticas:"

## VERIFICACIÓN ADICIONAL:

Si sigue sin funcionar, verificar:

1. **Token válido**: Asegúrate de estar logueado
2. **API funcionando**: Verificar que `/api/dashboard/stats` existe
3. **Consola del servidor**: Revisar errores en el terminal donde corre Next.js

## RESULTADO ESPERADO:
El dashboard mostrará los conteos reales de tu base de datos en lugar de los números fijos.
