'use client'

import { useState, useEffect } from 'react'

interface DiaCalendario {
  fecha: string
  esLectivo: boolean
  motivo?: string
  tipoDia?: string
}

interface CalendarioCompactoProps {
  className?: string
}

export default function CalendarioCompacto({ className = '' }: CalendarioCompactoProps) {
  const [diasNoLectivos, setDiasNoLectivos] = useState<Map<string, DiaCalendario>>(new Map())
  const [loading, setLoading] = useState(true)
  const [mesActual, setMesActual] = useState(new Date())

  useEffect(() => {
    loadCalendario()
  }, [mesActual])

  const loadCalendario = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const año = mesActual.getFullYear()
      
      // Usar la misma API que admin y docente
      const response = await fetch(`/api/calendario-escolar?year=${año}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('📅 Calendario auxiliar cargado:', data.data?.length || 0, 'días')
        
        // Crear mapa de días no lectivos
        const diasMap = new Map<string, DiaCalendario>()
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
        setDiasNoLectivos(diasMap)
      }
    } catch (error) {
      console.error('❌ Error loading calendario:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDiasDelMes = () => {
    const año = mesActual.getFullYear()
    const mes = mesActual.getMonth()
    
    const primerDia = new Date(año, mes, 1)
    const ultimoDia = new Date(año, mes + 1, 0)
    const diasEnMes = ultimoDia.getDate()
    const primerDiaSemana = primerDia.getDay()
    
    const dias: { fecha: Date; esDelMes: boolean; info?: DiaCalendario }[] = []
    
    // Días del mes anterior
    for (let i = primerDiaSemana - 1; i >= 0; i--) {
      const fecha = new Date(año, mes, -i)
      dias.push({ fecha, esDelMes: false })
    }
    
    // Días del mes actual
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = new Date(año, mes, dia)
      const fechaStr = fecha.toISOString().split('T')[0]
      dias.push({
        fecha,
        esDelMes: true,
        info: diasNoLectivos.get(fechaStr)
      })
    }
    
    // Días del mes siguiente
    const diasRestantes = 42 - dias.length
    for (let dia = 1; dia <= diasRestantes; dia++) {
      const fecha = new Date(año, mes + 1, dia)
      dias.push({ fecha, esDelMes: false })
    }
    
    return dias
  }

  const cambiarMes = (direccion: 'anterior' | 'siguiente') => {
    setMesActual(prev => {
      const nuevaFecha = new Date(prev)
      if (direccion === 'anterior') {
        nuevaFecha.setMonth(prev.getMonth() - 1)
      } else {
        nuevaFecha.setMonth(prev.getMonth() + 1)
      }
      return nuevaFecha
    })
  }

  const esHoy = (fecha: Date) => {
    const hoy = new Date()
    return fecha.toDateString() === hoy.toDateString()
  }

  const esFinDeSemana = (fecha: Date) => {
    const dia = fecha.getDay()
    return dia === 0 || dia === 6
  }

  const getDiaClase = (fecha: Date, info?: DiaCalendario) => {
    let clases = 'w-8 h-8 flex items-center justify-center text-sm rounded-full cursor-pointer transition-all '
    
    if (esHoy(fecha)) {
      clases += 'ring-2 ring-orange-500 font-bold '
    }
    
    if (esFinDeSemana(fecha)) {
      clases += 'bg-gray-200 text-gray-500 '
    } else if (info && !info.esLectivo) {
      // Día no lectivo (feriado, vacaciones, etc.)
      if (info.tipoDia === 'FERIADO') {
        clases += 'bg-red-200 text-red-800 font-semibold '
      } else if (info.tipoDia === 'VACACIONES') {
        clases += 'bg-blue-200 text-blue-800 font-semibold '
      } else {
        clases += 'bg-yellow-200 text-yellow-800 font-semibold '
      }
    } else {
      clases += 'bg-green-100 text-green-800 hover:bg-green-200 '
    }
    
    return clases
  }

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const diasSemana = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

  // Obtener próximos eventos no lectivos
  const proximosEventos = Array.from(diasNoLectivos.values())
    .filter(d => new Date(d.fecha) >= new Date())
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    .slice(0, 3)

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <button
            onClick={() => cambiarMes('anterior')}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
          >
            ←
          </button>
          <h3 className="text-sm font-semibold text-gray-900">
            {meses[mesActual.getMonth()]} {mesActual.getFullYear()}
          </h3>
          <button
            onClick={() => cambiarMes('siguiente')}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
          >
            →
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
        </div>
      ) : (
        <div className="p-3">
          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {diasSemana.map((dia, i) => (
              <div key={i} className="text-xs font-medium text-gray-500 text-center py-1">
                {dia}
              </div>
            ))}
          </div>

          {/* Días del mes */}
          <div className="grid grid-cols-7 gap-1">
            {getDiasDelMes().map((dia, index) => (
              <div
                key={index}
                className={`${getDiaClase(dia.fecha, dia.info)} ${!dia.esDelMes ? 'opacity-30' : ''}`}
                title={dia.info?.motivo || ''}
              >
                {dia.fecha.getDate()}
              </div>
            ))}
          </div>

          {/* Leyenda */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-100 rounded-full"></div>
                <span className="text-gray-600">Lectivo</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-200 rounded-full"></div>
                <span className="text-gray-600">Feriado</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                <span className="text-gray-600">Fin de semana</span>
              </div>
            </div>
          </div>

          {/* Próximos eventos */}
          {proximosEventos.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Próximos días no lectivos:</h4>
              <div className="space-y-1">
                {proximosEventos.map((evento, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className={`w-2 h-2 rounded-full ${
                      evento.tipoDia === 'FERIADO' ? 'bg-red-400' : 
                      evento.tipoDia === 'VACACIONES' ? 'bg-blue-400' : 'bg-yellow-400'
                    }`}></div>
                    <span className="text-gray-600">
                      {new Date(evento.fecha + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className="text-gray-500 truncate">{evento.motivo}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
