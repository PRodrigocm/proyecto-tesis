/**
 * Utilidades para verificar días feriados y no lectivos
 * Usa la misma fuente de datos que los calendarios de admin, docente y auxiliar
 */

import { fechaUTCaLima } from './date-utils'

export interface DiaNoLectivo {
  fecha: string
  esLectivo: boolean
  motivo?: string
  tipoDia?: string
}

/**
 * Obtiene los días no lectivos desde la API
 */
export async function obtenerDiasNoLectivos(year: number, token: string): Promise<Map<string, DiaNoLectivo>> {
  try {
    const response = await fetch(`/api/calendario-escolar?year=${year}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      console.error('❌ Error al cargar días no lectivos:', response.status)
      return new Map()
    }

    const data = await response.json()
    const diasMap = new Map<string, DiaNoLectivo>()
    
    data.data?.forEach((item: any) => {
      if (!item.esLectivo) {
        diasMap.set(item.fecha, {
          fecha: item.fecha,
          esLectivo: false,
          motivo: item.motivo,
          tipoDia: item.tipoDia
        })
      }
    })
    
    console.log(`📅 Días no lectivos cargados para ${year}:`, diasMap.size)
    return diasMap
  } catch (error) {
    console.error('❌ Error obteniendo días no lectivos:', error)
    return new Map()
  }
}

/**
 * Verifica si una fecha específica es un día no lectivo
 */
export function esDiaNoLectivo(fecha: Date | string, diasNoLectivos: Map<string, DiaNoLectivo>): boolean {
  const fechaStr = typeof fecha === 'string' 
    ? fecha 
    : fechaUTCaLima(fecha)
  
  return diasNoLectivos.has(fechaStr)
}

/**
 * Verifica si una fecha es fin de semana
 */
export function esFinDeSemana(fecha: Date | string): boolean {
  const fechaObj = typeof fecha === 'string' ? new Date(fecha + 'T12:00:00') : fecha
  const dia = fechaObj.getDay()
  return dia === 0 || dia === 6
}

/**
 * Verifica si se puede registrar asistencia en una fecha
 * Retorna true si es un día lectivo (no es feriado ni fin de semana)
 */
export function puedeRegistrarAsistencia(
  fecha: Date | string, 
  diasNoLectivos: Map<string, DiaNoLectivo>
): { permitido: boolean; motivo?: string } {
  // Verificar fin de semana
  if (esFinDeSemana(fecha)) {
    return { permitido: false, motivo: 'Es fin de semana' }
  }
  
  // Verificar día no lectivo - usar zona horaria de Lima
  const fechaStr = typeof fecha === 'string' 
    ? fecha 
    : fechaUTCaLima(fecha)
  
  const diaNoLectivo = diasNoLectivos.get(fechaStr)
  if (diaNoLectivo) {
    return { 
      permitido: false, 
      motivo: diaNoLectivo.motivo || `Día no lectivo (${diaNoLectivo.tipoDia || 'Feriado'})` 
    }
  }
  
  return { permitido: true }
}

/**
 * Obtiene información de un día no lectivo
 */
export function obtenerInfoDiaNoLectivo(
  fecha: Date | string, 
  diasNoLectivos: Map<string, DiaNoLectivo>
): DiaNoLectivo | null {
  const fechaStr = typeof fecha === 'string' 
    ? fecha 
    : fechaUTCaLima(fecha)
  
  return diasNoLectivos.get(fechaStr) || null
}
