/**
 * Utilidades para verificar el calendario escolar
 * Verifica feriados, días de recuperación y días lectivos
 */

interface DiaCalendario {
  esFeriado: boolean
  esFinDeSemana: boolean
  esRecuperacion: boolean
  esDiaLectivo: boolean
  descripcion?: string
  tipoDia?: string
}

/**
 * Verificar si una fecha es feriado consultando la API
 */
export async function verificarFeriado(
  fecha: string,
  ieId: number | string,
  token: string
): Promise<DiaCalendario> {
  try {
    const fechaObj = new Date(fecha)
    const diaSemana = fechaObj.getDay()
    const esFinDeSemana = diaSemana === 0 || diaSemana === 6

    // Obtener eventos del calendario para esa fecha
    const mes = fechaObj.getMonth() + 1
    const año = fechaObj.getFullYear()

    const response = await fetch(
      `/api/calendario?mes=${mes}&año=${año}&ieId=${ieId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )

    if (!response.ok) {
      // Si no hay API, asumir día lectivo normal
      return {
        esFeriado: false,
        esFinDeSemana,
        esRecuperacion: false,
        esDiaLectivo: !esFinDeSemana
      }
    }

    const data = await response.json()
    const eventos = data.data || []

    // Buscar si hay un evento para esta fecha
    const fechaStr = fechaObj.toISOString().split('T')[0]
    const eventoDelDia = eventos.find((evento: any) => {
      const fechaEvento = new Date(evento.fechaInicio).toISOString().split('T')[0]
      return fechaEvento === fechaStr
    })

    if (eventoDelDia) {
      const esFeriado = eventoDelDia.tipo === 'FERIADO' || !eventoDelDia.esLectivo
      const esRecuperacion = eventoDelDia.tipo === 'RECUPERACION'

      return {
        esFeriado,
        esFinDeSemana,
        esRecuperacion,
        esDiaLectivo: eventoDelDia.esLectivo || esRecuperacion,
        descripcion: eventoDelDia.descripcion || eventoDelDia.titulo,
        tipoDia: eventoDelDia.tipo
      }
    }

    // Si es fin de semana sin evento de recuperación, no es lectivo
    if (esFinDeSemana) {
      return {
        esFeriado: false,
        esFinDeSemana: true,
        esRecuperacion: false,
        esDiaLectivo: false
      }
    }

    // Día normal lectivo
    return {
      esFeriado: false,
      esFinDeSemana: false,
      esRecuperacion: false,
      esDiaLectivo: true
    }
  } catch (error) {
    console.error('Error verificando feriado:', error)
    // En caso de error, asumir día lectivo
    const fechaObj = new Date(fecha)
    const diaSemana = fechaObj.getDay()
    return {
      esFeriado: false,
      esFinDeSemana: diaSemana === 0 || diaSemana === 6,
      esRecuperacion: false,
      esDiaLectivo: diaSemana !== 0 && diaSemana !== 6
    }
  }
}

/**
 * Verificar si se puede registrar asistencia en una fecha
 */
export function puedeRegistrarAsistencia(diaCalendario: DiaCalendario): {
  permitido: boolean
  mensaje: string
} {
  if (diaCalendario.esFeriado) {
    return {
      permitido: false,
      mensaje: `No se puede registrar asistencia: ${diaCalendario.descripcion || 'Día feriado'}`
    }
  }

  if (diaCalendario.esFinDeSemana && !diaCalendario.esRecuperacion) {
    return {
      permitido: false,
      mensaje: 'No se puede registrar asistencia en fin de semana (no hay clase de recuperación programada)'
    }
  }

  if (diaCalendario.esRecuperacion) {
    return {
      permitido: true,
      mensaje: 'Día de recuperación - Se permite registro de asistencia'
    }
  }

  if (diaCalendario.esDiaLectivo) {
    return {
      permitido: true,
      mensaje: 'Día lectivo - Se permite registro de asistencia'
    }
  }

  return {
    permitido: false,
    mensaje: 'No se puede registrar asistencia en este día'
  }
}

/**
 * Hook para usar en componentes React
 */
export function useVerificarDia() {
  const verificar = async (fecha: string): Promise<DiaCalendario & { permitido: boolean; mensaje: string }> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    
    let ieId = 1
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        ieId = user.ieId || user.ie?.id || 1
      } catch {}
    }

    if (!token) {
      return {
        esFeriado: false,
        esFinDeSemana: false,
        esRecuperacion: false,
        esDiaLectivo: true,
        permitido: true,
        mensaje: 'Sin autenticación'
      }
    }

    const diaInfo = await verificarFeriado(fecha, ieId, token)
    const permiso = puedeRegistrarAsistencia(diaInfo)

    return {
      ...diaInfo,
      ...permiso
    }
  }

  return { verificar }
}
