'use client'

import { useEffect, useRef } from 'react'

/**
 * Hook para ejecutar el proceso automático de faltas
 * Se ejecuta cada 5 minutos después del horario de cierre
 */
export function useAutoAttendance(ieId?: number) {
  const lastCheck = useRef<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const checkAndProcessAbsences = async () => {
      const now = new Date()
      const today = now.toISOString().split('T')[0]
      
      // Solo ejecutar una vez por día
      if (lastCheck.current === today) {
        return
      }

      try {
        // Verificar si ya pasó la hora de cierre
        const configResponse = await fetch('/api/configuracion/horarios')
        if (!configResponse.ok) return

        const configData = await configResponse.json()
        const horaFinIngreso = configData.configuracion?.horaFinIngreso || '08:00'
        const horaActual = now.toTimeString().slice(0, 5)

        // Solo procesar si ya pasó la hora de cierre
        if (horaActual <= horaFinIngreso) {
          console.log(`⏰ Aún no es hora de procesar faltas (${horaActual} <= ${horaFinIngreso})`)
          return
        }

        console.log('🔄 Ejecutando proceso automático de faltas...')

        // Ejecutar proceso de faltas
        const response = await fetch('/api/cron/marcar-faltas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ ieId })
        })

        if (response.ok) {
          const data = await response.json()
          console.log(`✅ Proceso automático completado: ${data.resumen?.totalFaltasMarcadas || 0} faltas marcadas`)
          lastCheck.current = today
        }
      } catch (error) {
        console.error('Error en proceso automático de faltas:', error)
      }
    }

    // Ejecutar inmediatamente al cargar
    checkAndProcessAbsences()

    // Configurar intervalo para verificar cada 5 minutos
    intervalRef.current = setInterval(checkAndProcessAbsences, 5 * 60 * 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [ieId])
}
