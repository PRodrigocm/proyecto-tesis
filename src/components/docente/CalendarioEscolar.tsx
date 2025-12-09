'use client'

import { useState, useEffect } from 'react'

interface EventoCalendario {
  id: string
  titulo: string
  descripcion: string
  fechaInicio: string
  fechaFin: string
  tipo: 'ACADEMICO' | 'FERIADO' | 'SUSPENSION' | 'ESPECIAL'
  color: string
  esLectivo: boolean
}

interface CalendarioEscolarProps {
  className?: string
}

export default function CalendarioEscolar({ className = '' }: CalendarioEscolarProps) {
  const [eventos, setEventos] = useState<EventoCalendario[]>([])
  const [diasNoLectivos, setDiasNoLectivos] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [mesActual, setMesActual] = useState(new Date())
  const [vistaActual, setVistaActual] = useState<'mes' | 'lista'>('mes')

  useEffect(() => {
    loadEventos()
  }, [mesActual])

  const loadEventos = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const año = mesActual.getFullYear()
      
      // Usar la misma API que el admin (/api/calendario-escolar) para consistencia
      const response = await fetch(`/api/calendario-escolar?year=${año}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Calendario escolar cargado:', data.data?.length || 0, 'días')
        
        // Transformar los datos del calendario escolar al formato de eventos
        const eventosTransformados: EventoCalendario[] = []
        const eventosAgrupados = new Map<string, any>()
        
        // Agrupar por idCalendario para no duplicar eventos
        data.data?.forEach((item: any) => {
          if (!item.esLectivo) { // Solo mostrar días no lectivos como eventos
            const key = `${item.idCalendario}-${item.motivo}`
            if (!eventosAgrupados.has(key)) {
              eventosAgrupados.set(key, {
                id: item.idCalendario?.toString() || item.fecha,
                titulo: item.motivo || item.tipoDia || 'Día no lectivo',
                descripcion: item.motivo || '',
                fechaInicio: item.fecha,
                fechaFin: item.fecha,
                tipo: item.tipoDia === 'FERIADO' ? 'FERIADO' : 
                      item.tipoDia === 'VACACIONES' ? 'SUSPENSION' : 
                      item.tipoDia === 'SUSPENSION' ? 'SUSPENSION' : 'ESPECIAL',
                color: item.tipoDia === 'FERIADO' ? '#EF4444' : 
                       item.tipoDia === 'VACACIONES' ? '#3B82F6' : '#F59E0B',
                esLectivo: false
              })
            }
          }
        })
        
        eventosAgrupados.forEach(evento => eventosTransformados.push(evento))
        console.log('📅 Eventos transformados:', eventosTransformados.length)
        setEventos(eventosTransformados)
        
        // Guardar set de días no lectivos para marcar en el calendario
        const diasNoLectivosSet = new Set<string>()
        data.data?.forEach((item: any) => {
          if (!item.esLectivo) {
            diasNoLectivosSet.add(item.fecha)
          }
        })
        setDiasNoLectivos(diasNoLectivosSet)
        console.log('🚫 Días no lectivos:', diasNoLectivosSet.size)
      } else {
        const errorText = await response.text()
        console.error('❌ Error al cargar calendario escolar:', response.status, errorText)
        setEventos([])
      }
    } catch (error) {
      console.error('❌ Error loading calendario escolar:', error)
      setEventos([])
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
    
    const dias: { fecha: Date; esDelMes: boolean; eventos: any[] }[] = []
    
    // Días del mes anterior para completar la primera semana
    for (let i = primerDiaSemana - 1; i >= 0; i--) {
      const fecha = new Date(año, mes, -i)
      dias.push({
        fecha,
        esDelMes: false,
        eventos: []
      })
    }
    
    // Días del mes actual
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = new Date(año, mes, dia)
      const eventosDelDia = eventos.filter(evento => {
        const fechaEvento = new Date(evento.fechaInicio)
        return fechaEvento.toDateString() === fecha.toDateString()
      })
      
      dias.push({
        fecha,
        esDelMes: true,
        eventos: eventosDelDia
      })
    }
    
    // Días del mes siguiente para completar la última semana
    const diasRestantes = 42 - dias.length // 6 semanas * 7 días
    for (let dia = 1; dia <= diasRestantes; dia++) {
      const fecha = new Date(año, mes + 1, dia)
      dias.push({
        fecha,
        esDelMes: false,
        eventos: []
      })
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

  const esFeriado = (fecha: Date) => {
    // Usar el Set de días no lectivos para verificación más eficiente
    const fechaStr = fecha.toISOString().split('T')[0]
    return diasNoLectivos.has(fechaStr)
  }

  const esFinDeSemana = (fecha: Date) => {
    const dia = fecha.getDay()
    return dia === 0 || dia === 6 // Domingo o Sábado
  }

  const getDiaClase = (fecha: Date) => {
    if (esFinDeSemana(fecha)) return 'fin-semana'
    if (esFeriado(fecha)) return 'feriado'
    return 'lectivo'
  }

  const getDiaEstilo = (fecha: Date, esDelMes: boolean) => {
    let clases = 'min-h-[80px] p-2 border border-gray-200 '
    
    if (!esDelMes) {
      clases += 'bg-gray-50 text-gray-400 '
    } else {
      const tipoClase = getDiaClase(fecha)
      switch (tipoClase) {
        case 'feriado':
          clases += 'bg-red-50 text-red-800 '
          break
        case 'fin-semana':
          clases += 'bg-gray-100 text-gray-600 '
          break
        default:
          clases += 'bg-green-50 text-green-800 '
      }
    }
    
    if (esHoy(fecha)) {
      clases += 'ring-2 ring-blue-500 '
    }
    
    return clases
  }

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  const eventosDelMes = eventos.filter(evento => {
    const fechaEvento = new Date(evento.fechaInicio)
    return fechaEvento.getMonth() === mesActual.getMonth() && 
           fechaEvento.getFullYear() === mesActual.getFullYear()
  })

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-black">📅 Calendario Escolar</h3>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setVistaActual('mes')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                vistaActual === 'mes' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => setVistaActual('lista')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                vistaActual === 'lista' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Lista
            </button>
          </div>
        </div>

        {/* Navegación del mes */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => cambiarMes('anterior')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← Anterior
          </button>
          <h4 className="text-xl font-semibold text-black">
            {meses[mesActual.getMonth()]} {mesActual.getFullYear()}
          </h4>
          <button
            onClick={() => cambiarMes('siguiente')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Siguiente →
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-black text-sm">Cargando calendario...</span>
        </div>
      )}

      {/* Vista Mes */}
      {vistaActual === 'mes' && !loading && (
        <div className="p-6">
          {/* Leyenda */}
          <div className="flex flex-wrap gap-4 mb-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
              <span className="text-black">Día Lectivo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
              <span className="text-black">Feriado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
              <span className="text-black">Fin de Semana</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border-2 border-blue-500 rounded"></div>
              <span className="text-black">Hoy</span>
            </div>
          </div>

          {/* Calendario */}
          <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
            {/* Headers de días */}
            {diasSemana.map(dia => (
              <div key={dia} className="bg-gray-100 p-3 text-center font-medium text-gray-700 border-b border-gray-200">
                {dia}
              </div>
            ))}
            
            {/* Días del mes */}
            {getDiasDelMes().map((dia, index) => (
              <div
                key={index}
                className={getDiaEstilo(dia.fecha, dia.esDelMes)}
              >
                <div className="font-medium mb-1">
                  {dia.fecha.getDate()}
                </div>
                <div className="space-y-1">
                  {dia.eventos.slice(0, 2).map(evento => (
                    <div
                      key={evento.id}
                      className="text-xs p-1 rounded truncate"
                      style={{ backgroundColor: evento.color + '20', color: evento.color }}
                      title={evento.titulo}
                    >
                      {evento.titulo}
                    </div>
                  ))}
                  {dia.eventos.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{dia.eventos.length - 2} más
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vista Lista */}
      {vistaActual === 'lista' && !loading && (
        <div className="p-6">
          {eventosDelMes.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-2">📅</div>
              <p className="text-black">No hay eventos programados para este mes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {eventosDelMes
                .sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime())
                .map(evento => (
                  <div
                    key={evento.id}
                    className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: evento.color }}
                    ></div>
                    <div className="flex-1">
                      <div className="font-medium text-black">{evento.titulo}</div>
                      <div className="text-sm text-gray-600">{evento.descripcion}</div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(evento.fechaInicio).toLocaleDateString('es-ES')}
                    </div>
                    <div className={`px-2 py-1 text-xs rounded-full ${
                      evento.esLectivo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {evento.esLectivo ? 'Lectivo' : 'No Lectivo'}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
