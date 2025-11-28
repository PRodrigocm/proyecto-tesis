'use client'

import { useState, useEffect } from 'react'

interface ConfiguracionHorarios {
  horaIngreso: string
  horaFinIngreso: string
  horaSalida: string
  toleranciaMinutos: number
  diasLaborables: string[]
}

interface Feriado {
  fecha: string
  nombre: string
  tipoDia: string
}

const DIAS_SEMANA = [
  { value: 'LUNES', label: 'Lunes', diaSemana: 1 },
  { value: 'MARTES', label: 'Martes', diaSemana: 2 },
  { value: 'MIERCOLES', label: 'Miércoles', diaSemana: 3 },
  { value: 'JUEVES', label: 'Jueves', diaSemana: 4 },
  { value: 'VIERNES', label: 'Viernes', diaSemana: 5 },
  { value: 'SABADO', label: 'Sábado', diaSemana: 6 },
  { value: 'DOMINGO', label: 'Domingo', diaSemana: 0 },
]

export default function ConfiguracionPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [estadisticasFaltas, setEstadisticasFaltas] = useState<{
    totalEstudiantes: number
    conAsistencia: number
    sinAsistencia: number
    inasistenciasMarcadas: number
  } | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [feriados, setFeriados] = useState<Record<string, Feriado>>({})
  const [config, setConfig] = useState<ConfiguracionHorarios>({
    horaIngreso: '07:30',
    horaFinIngreso: '08:00',
    horaSalida: '13:00',
    toleranciaMinutos: 15,
    diasLaborables: ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']
  })

  useEffect(() => {
    fetchConfiguracion()
    fetchFeriados()
    fetchEstadisticasFaltas()
  }, [])

  const fetchEstadisticasFaltas = async () => {
    try {
      const response = await fetch('/api/cron/marcar-faltas')
      if (response.ok) {
        const data = await response.json()
        setEstadisticasFaltas(data.estadisticas)
      }
    } catch (error) {
      console.error('Error al obtener estadísticas:', error)
    }
  }

  // Obtener las fechas de la semana actual para cada día
  const getFechasDeSemana = () => {
    const hoy = new Date()
    const diaSemanaActual = hoy.getDay() // 0 = Domingo, 1 = Lunes, etc.
    const fechas: Record<string, Date> = {}
    
    DIAS_SEMANA.forEach(dia => {
      const diff = dia.diaSemana - diaSemanaActual
      const fecha = new Date(hoy)
      fecha.setDate(hoy.getDate() + diff)
      fechas[dia.value] = fecha
    })
    
    return fechas
  }

  const fechasSemana = getFechasDeSemana()

  const fetchFeriados = async () => {
    try {
      const token = localStorage.getItem('token')
      const year = new Date().getFullYear()
      const response = await fetch(`/api/calendario-escolar?year=${year}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        // Crear un mapa de feriados por día de la semana
        const feriadosMap: Record<string, Feriado> = {}
        
        if (data.eventos) {
          data.eventos.forEach((evento: any) => {
            const fechaEvento = new Date(evento.fecha || evento.fechaInicio)
            const diaSemana = fechaEvento.getDay()
            
            // Verificar si el feriado cae en esta semana
            Object.entries(fechasSemana).forEach(([diaKey, fechaSemana]) => {
              const fechaSemanaStr = fechaSemana.toISOString().split('T')[0]
              const fechaEventoStr = fechaEvento.toISOString().split('T')[0]
              
              if (fechaSemanaStr === fechaEventoStr && 
                  (evento.tipoDia === 'FERIADO' || evento.tipoDia === 'SUSPENSION' || evento.tipoDia === 'NO_LABORABLE')) {
                feriadosMap[diaKey] = {
                  fecha: fechaEventoStr,
                  nombre: evento.nombre || evento.descripcion || 'Día no laborable',
                  tipoDia: evento.tipoDia
                }
              }
            })
          })
        }
        
        setFeriados(feriadosMap)
      }
    } catch (error) {
      console.error('Error al cargar feriados:', error)
    }
  }

  const fetchConfiguracion = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/configuracion/horarios', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.configuracion) {
          setConfig(data.configuracion)
        }
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/configuracion/horarios', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(config)
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Configuración guardada correctamente' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al guardar configuración' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión' })
    } finally {
      setSaving(false)
    }
  }

  const handleDiaChange = (dia: string) => {
    // No permitir cambiar si es feriado
    if (feriados[dia]) return
    
    setConfig(prev => ({
      ...prev,
      diasLaborables: prev.diasLaborables.includes(dia)
        ? prev.diasLaborables.filter(d => d !== dia)
        : [...prev.diasLaborables, dia]
    }))
  }

  // Función para obtener el estado visual del día
  const getDiaEstado = (diaValue: string) => {
    const esFeriado = !!feriados[diaValue]
    const esSeleccionado = config.diasLaborables.includes(diaValue)
    
    return { esFeriado, esSeleccionado }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h1>
          <p className="mt-1 text-sm text-gray-500">
            Administra los horarios y tolerancias de la institución educativa
          </p>
        </div>
      </div>

      {/* Mensaje de estado */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {message.text}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Horario Escolar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Horario Escolar</h2>
              <p className="text-sm text-gray-500">Horarios de ingreso y salida</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora de Ingreso
              </label>
              <input
                type="time"
                value={config.horaIngreso}
                onChange={(e) => setConfig({ ...config, horaIngreso: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
              />
              <p className="mt-1 text-xs text-gray-500">Hora oficial de inicio de clases</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cierre de Ingreso
              </label>
              <input
                type="time"
                value={config.horaFinIngreso}
                onChange={(e) => setConfig({ ...config, horaFinIngreso: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
              />
              <p className="mt-1 text-xs text-gray-500">Después de esta hora se marca tardanza</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora de Salida
              </label>
              <input
                type="time"
                value={config.horaSalida}
                onChange={(e) => setConfig({ ...config, horaSalida: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
              />
              <p className="mt-1 text-xs text-gray-500">Hora de finalización del turno</p>
            </div>
          </div>
        </div>

        {/* Tolerancia */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Tolerancia</h2>
              <p className="text-sm text-gray-500">Tiempo de gracia para el ingreso</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minutos de Tolerancia
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="30"
                value={config.toleranciaMinutos}
                onChange={(e) => setConfig({ ...config, toleranciaMinutos: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="w-20 px-4 py-2 bg-indigo-50 rounded-lg text-center">
                <span className="text-xl font-bold text-indigo-600">{config.toleranciaMinutos}</span>
                <span className="text-xs text-indigo-500 block">min</span>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              Los estudiantes que lleguen hasta <strong>{config.toleranciaMinutos} minutos</strong> después 
              de la hora de ingreso serán marcados como "Presente". Después de este tiempo se registrará como "Tardanza".
            </p>
          </div>

          <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800">Nota importante</p>
                <p className="text-sm text-amber-700 mt-1">
                  Este cambio afectará la tolerancia global de todos los horarios de clase. 
                  Los docentes pueden tener tolerancias individuales diferentes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Días Laborables */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Días Laborables</h2>
              <p className="text-sm text-gray-500">Días de asistencia obligatoria</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DIAS_SEMANA.map((dia) => {
              const { esFeriado, esSeleccionado } = getDiaEstado(dia.value)
              const feriadoInfo = feriados[dia.value]
              const fechaDia = fechasSemana[dia.value]
              const fechaFormateada = fechaDia ? fechaDia.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) : ''
              
              return (
                <div
                  key={dia.value}
                  className="relative group"
                >
                  <label
                    className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                      esFeriado
                        ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-60'
                        : esSeleccionado
                          ? 'border-indigo-500 bg-indigo-50 cursor-pointer'
                          : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={esSeleccionado}
                      onChange={() => handleDiaChange(dia.value)}
                      disabled={esFeriado}
                      className={`w-5 h-5 mb-2 rounded focus:ring-indigo-500 ${
                        esFeriado 
                          ? 'text-gray-400 border-gray-300 cursor-not-allowed' 
                          : 'text-indigo-600 border-gray-300'
                      }`}
                    />
                    <span className={`text-sm font-semibold ${
                      esFeriado 
                        ? 'text-gray-400' 
                        : esSeleccionado 
                          ? 'text-indigo-700' 
                          : 'text-gray-700'
                    }`}>
                      {dia.label}
                    </span>
                    <span className={`text-xs mt-1 ${
                      esFeriado ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {fechaFormateada}
                    </span>
                    
                    {esFeriado && (
                      <div className="mt-2 flex items-center gap-1">
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        <span className="text-xs text-red-400 font-medium">No laborable</span>
                      </div>
                    )}
                  </label>
                  
                  {/* Tooltip para feriados */}
                  {esFeriado && feriadoInfo && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 shadow-lg">
                      <div className="font-semibold">{feriadoInfo.nombre}</div>
                      <div className="text-gray-300 mt-0.5">
                        {feriadoInfo.tipoDia === 'FERIADO' && '🎉 Feriado Nacional'}
                        {feriadoInfo.tipoDia === 'SUSPENSION' && '⚠️ Suspensión de clases'}
                        {feriadoInfo.tipoDia === 'NO_LABORABLE' && '📅 Día no laborable'}
                      </div>
                      {/* Flecha del tooltip */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-4 flex items-start gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4 mt-0.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>
              Selecciona los días en que se registrará asistencia. Los días marcados en gris son feriados 
              o días no laborables según el calendario escolar y no pueden ser seleccionados.
            </p>
          </div>

          {/* Leyenda */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-indigo-500 bg-indigo-50"></div>
              <span className="text-gray-600">Día laborable seleccionado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-gray-200 bg-white"></div>
              <span className="text-gray-600">Día no seleccionado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-gray-300 bg-gray-100 opacity-60"></div>
              <span className="text-gray-600">Feriado / No laborable</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sistema Automático de Asistencia */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Sistema Automático de Asistencia</h2>
            <p className="text-sm text-gray-500">Control automático de asistencias, tardanzas y faltas</p>
          </div>
        </div>

        {/* Estadísticas del día */}
        {estadisticasFaltas && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{estadisticasFaltas.totalEstudiantes}</div>
              <div className="text-xs text-gray-500">Total Estudiantes</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{estadisticasFaltas.conAsistencia}</div>
              <div className="text-xs text-gray-500">Con Asistencia</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{estadisticasFaltas.sinAsistencia}</div>
              <div className="text-xs text-gray-500">Pendientes</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{estadisticasFaltas.inasistenciasMarcadas}</div>
              <div className="text-xs text-gray-500">Faltas del Día</div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm text-blue-800 font-medium">Funcionamiento Automático</p>
              <ul className="text-sm text-blue-700 mt-2 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span><strong>PRESENTE:</strong> Ingreso hasta las {(() => {
                    const [h, m] = config.horaIngreso.split(':').map(Number)
                    const fecha = new Date()
                    fecha.setHours(h, m + config.toleranciaMinutos, 0, 0)
                    return fecha.toTimeString().slice(0, 5)
                  })()} (hora ingreso {config.horaIngreso} + {config.toleranciaMinutos} min tolerancia)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 font-bold">⚠</span>
                  <span><strong>TARDANZA:</strong> Ingreso después de las {(() => {
                    const [h, m] = config.horaIngreso.split(':').map(Number)
                    const fecha = new Date()
                    fecha.setHours(h, m + config.toleranciaMinutos, 0, 0)
                    return fecha.toTimeString().slice(0, 5)
                  })()}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✗</span>
                  <span><strong>FALTA:</strong> Sin registro de asistencia después del cierre ({config.horaFinIngreso})</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">📧</span>
                  <span><strong>Notificaciones:</strong> Se envían automáticamente a los apoderados por correo y sistema</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {estadisticasFaltas?.sinAsistencia === 0 && (
          <p className="text-center text-sm text-green-600 mt-4 py-2 bg-green-50 rounded-lg">
            ✅ Todos los estudiantes tienen registro de asistencia hoy
          </p>
        )}
      </div>

      {/* Botón Guardar */}
      <div className="flex justify-end gap-4">
        <button
          onClick={fetchConfiguracion}
          className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Guardando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Guardar Configuración
            </>
          )}
        </button>
      </div>
    </div>
  )
}
