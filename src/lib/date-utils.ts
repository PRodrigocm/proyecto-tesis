/**
 * Utilidades para manejo de fechas con zona horaria de Lima (UTC-5)
 * Centraliza la conversión de fechas para evitar inconsistencias
 */

/**
 * Convierte una fecha de la BD a string de fecha YYYY-MM-DD
 * IMPORTANTE: Para campos @db.Date de Prisma, la fecha viene como UTC medianoche.
 * Debemos extraer directamente los componentes UTC para evitar conversiones de zona horaria.
 * @param fechaDB - Fecha de la base de datos (Date object)
 * @returns String en formato YYYY-MM-DD
 */
export function fechaUTCaLima(fechaDB: Date): string {
  // Para campos @db.Date, Prisma devuelve la fecha en UTC medianoche
  // Extraemos directamente los componentes UTC para evitar problemas de zona horaria
  const year = fechaDB.getUTCFullYear()
  const month = String(fechaDB.getUTCMonth() + 1).padStart(2, '0')
  const day = String(fechaDB.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Convierte una fecha string (YYYY-MM-DD) a Date en medianoche UTC
 * Esto asegura que la fecha se guarde correctamente sin problemas de zona horaria
 * @param fechaStr - String en formato YYYY-MM-DD
 * @returns Date object en medianoche UTC del día especificado
 */
export function fechaStringAUTC(fechaStr: string): Date {
  const [anio, mes, dia] = fechaStr.split('-').map(Number)
  return new Date(Date.UTC(anio, mes - 1, dia, 0, 0, 0, 0))
}

/**
 * Obtiene la fecha actual en Lima como string YYYY-MM-DD
 * @returns String de fecha actual en Lima
 */
export function fechaHoyLima(): string {
  return fechaUTCaLima(new Date())
}

/**
 * Crea un rango de fechas para búsqueda en Prisma
 * @param fechaStr - String en formato YYYY-MM-DD
 * @returns Objeto con fechaInicio y fechaFin para usar en queries
 */
export function rangoFechaUTC(fechaStr: string): { fechaInicio: Date; fechaFin: Date } {
  const [anio, mes, dia] = fechaStr.split('-').map(Number)
  return {
    fechaInicio: new Date(Date.UTC(anio, mes - 1, dia, 0, 0, 0, 0)),
    fechaFin: new Date(Date.UTC(anio, mes - 1, dia, 23, 59, 59, 999))
  }
}

/**
 * Compara dos fechas ignorando la hora (solo día, mes, año)
 * Usa zona horaria de Lima para la comparación
 * @param fecha1 - Primera fecha
 * @param fecha2 - Segunda fecha
 * @returns true si son el mismo día en Lima
 */
export function mismaFechaLima(fecha1: Date, fecha2: Date): boolean {
  return fechaUTCaLima(fecha1) === fechaUTCaLima(fecha2)
}

/**
 * Obtiene la hora actual en Lima
 * @returns Objeto con horas y minutos en hora de Lima
 */
export function horaActualLima(): { horas: number; minutos: number; horaStr: string } {
  const ahora = new Date()
  const horaLimaStr = ahora.toLocaleTimeString('es-PE', { 
    timeZone: 'America/Lima', 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  })
  const [horaStr, minStr] = horaLimaStr.split(':')
  return {
    horas: parseInt(horaStr),
    minutos: parseInt(minStr),
    horaStr: horaLimaStr
  }
}

/**
 * Formatea una fecha para mostrar al usuario en formato legible
 * @param fecha - Fecha a formatear
 * @param incluirHora - Si debe incluir la hora
 * @returns String formateado en español
 */
export function formatearFechaLima(fecha: Date, incluirHora: boolean = false): string {
  const opciones: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    ...(incluirHora && { hour: '2-digit', minute: '2-digit' })
  }
  return fecha.toLocaleDateString('es-PE', opciones)
}

/**
 * Crea una clave única para estudiante+fecha usando zona horaria de Lima
 * Útil para evitar duplicados y comparaciones
 * @param idEstudiante - ID del estudiante
 * @param fecha - Fecha (Date o string)
 * @returns String en formato "idEstudiante-YYYY-MM-DD"
 */
export function claveEstudianteFecha(idEstudiante: number, fecha: Date | string): string {
  const fechaStr = typeof fecha === 'string' ? fecha : fechaUTCaLima(fecha)
  return `${idEstudiante}-${fechaStr}`
}
