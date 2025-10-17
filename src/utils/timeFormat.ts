/**
 * Convierte una hora en formato 24h (HH:MM) a formato 12h (h:MM AM/PM)
 * @param time24 - Hora en formato 24h (ej: "14:30")
 * @returns Hora en formato 12h (ej: "2:30 PM")
 */
export function formatTo12Hour(time24: string): string {
  if (!time24 || !time24.includes(':')) {
    return time24 || ''
  }

  const [hours, minutes] = time24.split(':')
  const hour24 = parseInt(hours, 10)
  const minute = minutes

  if (isNaN(hour24)) {
    return time24
  }

  let hour12 = hour24
  let period = 'AM'

  if (hour24 === 0) {
    hour12 = 12
  } else if (hour24 === 12) {
    period = 'PM'
  } else if (hour24 > 12) {
    hour12 = hour24 - 12
    period = 'PM'
  }

  return `${hour12}:${minute} ${period}`
}

/**
 * Convierte un rango de horas a formato 12h
 * @param startTime - Hora de inicio en formato 24h
 * @param endTime - Hora de fin en formato 24h
 * @returns Rango en formato 12h (ej: "8:00 AM - 1:30 PM")
 */
export function formatTimeRange12Hour(startTime: string, endTime: string): string {
  const start12 = formatTo12Hour(startTime)
  const end12 = formatTo12Hour(endTime)
  return `${start12} - ${end12}`
}

/**
 * Convierte una hora en formato 12h (h:MM AM/PM) a formato 24h (HH:MM)
 * @param time12 - Hora en formato 12h (ej: "2:30 PM")
 * @returns Hora en formato 24h (ej: "14:30")
 */
export function formatTo24Hour(time12: string): string {
  if (!time12 || !time12.includes(':')) {
    return time12 || ''
  }

  const parts = time12.trim().split(' ')
  if (parts.length !== 2) {
    return time12 // Si no tiene AM/PM, asumir que ya está en formato 24h
  }

  const [time, period] = parts
  const [hours, minutes] = time.split(':')
  let hour24 = parseInt(hours, 10)

  if (isNaN(hour24)) {
    return time12
  }

  if (period.toLowerCase() === 'pm' && hour24 !== 12) {
    hour24 += 12
  } else if (period.toLowerCase() === 'am' && hour24 === 12) {
    hour24 = 0
  }

  return `${hour24.toString().padStart(2, '0')}:${minutes}`
}
