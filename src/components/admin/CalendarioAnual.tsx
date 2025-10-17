import React from 'react'

interface CalendarioEscolarItem {
  fecha: string
  esLectivo: boolean
  motivo?: string
}

interface ExcepcionItem {
  fecha: string
  fechaFin?: string
  tipoExcepcion: 'FERIADO' | 'DIA_NO_LABORABLE' | 'SUSPENSION_CLASES' | 'HORARIO_ESPECIAL' | 'VACACIONES' | 'CAPACITACION' | 'OTRO'
  motivo?: string
  descripcion?: string
}

interface CalendarioAnualProps {
  year: number
  calendarioEscolar: CalendarioEscolarItem[]
  excepciones: ExcepcionItem[]
  onDateClick: (date: Date) => void
}

const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export default function CalendarioAnual({ year, calendarioEscolar, excepciones, onDateClick }: CalendarioAnualProps) {
  
  const getDayType = (date: Date): 'lectivo' | 'feriado' | 'suspension' | 'vacaciones' | 'weekend' | 'normal' => {
    const dateStr = date.toISOString().split('T')[0]
    
    // Verificar si es fin de semana
    if (date.getDay() === 0 || date.getDay() === 6) {
      return 'weekend'
    }
    
    // Debug logging para todas las fechas cuando hay excepciones
    if (excepciones.length > 0) {
      console.log(`🔍 Verificando fecha ${dateStr} contra ${excepciones.length} excepciones`)
    }
    
    // Verificar excepciones (días NO lectivos)
    const excepcion = excepciones.find(exc => {
      const excFecha = new Date(exc.fecha)
      const excFechaFin = exc.fechaFin ? new Date(exc.fechaFin) : excFecha
      
      // Normalizar fechas para comparación (solo fecha, sin hora)
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const excFechaOnly = new Date(excFecha.getFullYear(), excFecha.getMonth(), excFecha.getDate())
      const excFechaFinOnly = new Date(excFechaFin.getFullYear(), excFechaFin.getMonth(), excFechaFin.getDate())
      
      const isInRange = dateOnly >= excFechaOnly && dateOnly <= excFechaFinOnly
      
      // Debug logging más detallado
      if (isInRange || dateStr === excFecha.toISOString().split('T')[0]) {
        console.log(`🔍 Comparando ${dateStr}:`)
        console.log('  - Excepción:', exc)
        console.log('  - Fecha excepción:', excFecha.toISOString().split('T')[0])
        console.log('  - Fecha normalizada:', excFechaOnly.toISOString().split('T')[0])
        console.log('  - Está en rango:', isInRange)
      }
      
      return isInRange
    })
    
    // Si hay una excepción, el día NO es lectivo
    if (excepcion) {
      console.log(`❌ Día ${dateStr} NO es lectivo por excepción:`, excepcion.tipoExcepcion)
      
      switch (excepcion.tipoExcepcion) {
        case 'FERIADO':
        case 'DIA_NO_LABORABLE':
          return 'feriado'
        case 'SUSPENSION_CLASES':
          return 'suspension'
        case 'VACACIONES':
          return 'vacaciones'
        default:
          return 'normal'
      }
    }
    
    // Por defecto, todos los días de semana son LECTIVOS
    // (excepto fines de semana y excepciones)
    console.log(`✅ Día ${dateStr} es LECTIVO por defecto`)
    return 'lectivo'
  }

  const getDayClass = (dayType: string, isToday: boolean): string => {
    const baseClass = 'w-8 h-8 flex items-center justify-center text-sm rounded cursor-pointer hover:ring-2 hover:ring-indigo-300 transition-all font-medium'
    
    if (isToday) {
      return `${baseClass} ring-2 ring-indigo-500 font-bold text-indigo-900 bg-indigo-100`
    }
    
    switch (dayType) {
      case 'lectivo':
        return `${baseClass} bg-green-200 text-green-900 hover:bg-green-300 font-semibold`
      case 'feriado':
        return `${baseClass} bg-red-200 text-red-900 hover:bg-red-300 font-semibold`
      case 'suspension':
        return `${baseClass} bg-yellow-200 text-yellow-900 hover:bg-yellow-300 font-semibold`
      case 'vacaciones':
        return `${baseClass} bg-blue-200 text-blue-900 hover:bg-blue-300 font-semibold`
      case 'weekend':
        return `${baseClass} bg-gray-200 text-gray-800 hover:bg-gray-300 font-semibold`
      default:
        return `${baseClass} hover:bg-gray-100 text-gray-900 font-semibold`
    }
  }

  const getTooltipText = (date: Date, dayType: string): string => {
    const dateStr = date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    
    const excepcion = excepciones.find(exc => {
      const excFecha = new Date(exc.fecha)
      const excFechaFin = exc.fechaFin ? new Date(exc.fechaFin) : excFecha
      return date >= excFecha && date <= excFechaFin
    })
    
    const calendarioItem = calendarioEscolar.find(item => 
      item.fecha === date.toISOString().split('T')[0]
    )
    
    let tooltip = dateStr
    
    if (excepcion) {
      tooltip += `\n${excepcion.tipoExcepcion}`
      if (excepcion.motivo) tooltip += `\n${excepcion.motivo}`
    } else if (calendarioItem && calendarioItem.motivo) {
      tooltip += `\n${calendarioItem.motivo}`
    }
    
    return tooltip
  }

  const renderMonth = (monthIndex: number) => {
    const firstDay = new Date(year, monthIndex, 1)
    const lastDay = new Date(year, monthIndex + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const today = new Date()
    
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + i)
      
      const isCurrentMonth = currentDate.getMonth() === monthIndex
      const isToday = currentDate.toDateString() === today.toDateString()
      const dayType = getDayType(currentDate)
      
      days.push(
        <div
          key={i}
          className={`${getDayClass(dayType, isToday)} ${
            !isCurrentMonth ? 'opacity-50 text-gray-500' : ''
          }`}
          onClick={() => isCurrentMonth && onDateClick(currentDate)}
          title={getTooltipText(currentDate, dayType)}
        >
          {currentDate.getDate()}
        </div>
      )
    }
    
    return (
      <div key={monthIndex} className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-3 text-center">
          {meses[monthIndex]} {year}
        </h4>
        
        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {diasSemana.map(dia => (
            <div key={dia} className="text-xs font-semibold text-gray-700 text-center py-1">
              {dia}
            </div>
          ))}
        </div>
        
        {/* Días del mes */}
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 12 }, (_, i) => renderMonth(i))}
    </div>
  )
}
