import React from 'react'

interface CalendarioEscolarItem {
  fecha: string
  esLectivo: boolean
  motivo?: string
}

interface ReunionItem {
  fecha: string
  titulo: string
  tipoReunion: string
}

interface CalendarioAnualProps {
  year: number
  calendarioEscolar: CalendarioEscolarItem[]
  reuniones?: ReunionItem[]
  onDateClick: (date: Date, evento?: any) => void
}

const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export default function CalendarioAnual({ year, calendarioEscolar, reuniones = [], onDateClick }: CalendarioAnualProps) {
  
  // Log para debug
  console.log('📅 CalendarioAnual - Reuniones recibidas:', reuniones.length, reuniones)
  
  const getDayType = (date: Date): 'lectivo' | 'feriado' | 'suspension' | 'vacaciones' | 'reunion' | 'weekend' | 'normal' => {
    const dateStr = date.toISOString().split('T')[0]
    
    // Verificar si es fin de semana
    if (date.getDay() === 0 || date.getDay() === 6) {
      return 'weekend'
    }
    
    // Verificar si hay reunión en esta fecha
    const reunion = reuniones.find(r => {
      const reunionFecha = new Date(r.fecha)
      const reunionDateStr = reunionFecha.toISOString().split('T')[0]
      const match = reunionDateStr === dateStr
      
      if (match) {
        console.log('🎯 Reunión encontrada para', dateStr, ':', r)
      }
      
      return match
    })
    
    if (reunion) {
      return 'reunion'
    }
    
    // Verificar en calendario escolar
    const diaCalendario = calendarioEscolar.find(item => item.fecha === dateStr)
    
    if (diaCalendario) {
      // Si está en el calendario y NO es lectivo, determinar el tipo
      if (!diaCalendario.esLectivo) {
        const motivo = diaCalendario.motivo?.toLowerCase() || ''
        if (motivo.includes('feriado')) return 'feriado'
        if (motivo.includes('vacacion')) return 'vacaciones'
        if (motivo.includes('suspension')) return 'suspension'
        return 'normal'
      }
    }
    
    // Por defecto, todos los días de semana son LECTIVOS
    return 'lectivo'
  }

  const getDayClass = (dayType: string, isToday: boolean): string => {
    const baseClass = 'w-8 h-8 flex items-center justify-center text-sm rounded cursor-pointer hover:ring-2 hover:ring-indigo-300 transition-all font-medium'
    const todayRing = isToday ? 'ring-2 ring-indigo-500 font-bold' : ''
    
    switch (dayType) {
      case 'lectivo':
        return `${baseClass} ${todayRing} bg-green-200 text-green-900 hover:bg-green-300 font-semibold`
      case 'feriado':
        return `${baseClass} ${todayRing} bg-red-200 text-red-900 hover:bg-red-300 font-semibold`
      case 'suspension':
        return `${baseClass} ${todayRing} bg-yellow-200 text-yellow-900 hover:bg-yellow-300 font-semibold`
      case 'vacaciones':
        return `${baseClass} ${todayRing} bg-blue-200 text-blue-900 hover:bg-blue-300 font-semibold`
      case 'reunion':
        return `${baseClass} ${todayRing} bg-orange-200 text-orange-900 hover:bg-orange-300 font-semibold`
      case 'weekend':
        return `${baseClass} ${todayRing} bg-gray-200 text-gray-800 hover:bg-gray-300 font-semibold`
      default:
        return `${baseClass} ${todayRing} hover:bg-gray-100 text-gray-900 font-semibold`
    }
  }

  const getTooltipText = (date: Date, dayType: string): string => {
    const dateStr = date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    
    const reunion = reuniones.find(r => {
      const reunionFecha = new Date(r.fecha)
      return reunionFecha.toISOString().split('T')[0] === date.toISOString().split('T')[0]
    })
    
    const calendarioItem = calendarioEscolar.find(item => 
      item.fecha === date.toISOString().split('T')[0]
    )
    
    let tooltip = dateStr
    
    if (reunion) {
      tooltip += `\n📅 Reunión: ${reunion.titulo}`
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
      
      // Buscar si hay un evento en esta fecha
      const dateStr = currentDate.toISOString().split('T')[0]
      const eventoEnFecha = calendarioEscolar.find(item => item.fecha === dateStr && !item.esLectivo)
      
      days.push(
        <div
          key={i}
          className={`${getDayClass(dayType, isToday)} ${
            !isCurrentMonth ? 'opacity-50 text-gray-500' : ''
          }`}
          onClick={() => isCurrentMonth && onDateClick(currentDate, eventoEnFecha)}
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
