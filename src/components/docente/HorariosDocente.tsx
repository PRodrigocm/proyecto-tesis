'use client'

import { useState, useEffect } from 'react'
import { useHorarios, type Horario } from '@/hooks/useHorarios'
import { formatTo12Hour, formatTo24Hour } from '@/utils/timeFormat'
import { verificarFeriado, puedeRegistrarAsistencia } from '@/lib/calendario-utils'

// Modal para editar tolerancia
interface ToleranciaModalProps {
  isOpen: boolean
  onClose: () => void
  horario: Horario | null
  onSave: (toleranciaMin: number) => Promise<boolean>
}

// Modal para editar horarios
interface HorarioModalProps {
  isOpen: boolean
  onClose: () => void
  horario: Horario | null
  onSave: (horaInicio: string, horaFin: string) => Promise<boolean>
}

function ToleranciaModal({ isOpen, onClose, horario, onSave }: ToleranciaModalProps) {
  const [toleranciaMin, setToleranciaMin] = useState(10)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (horario) {
      setToleranciaMin(horario.toleranciaMin)
    }
  }, [horario])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const success = await onSave(toleranciaMin)
      if (success) {
        onClose()
      }
    } catch (error) {
      console.error('Error saving tolerancia:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !horario) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4">
          <h3 className="text-xl font-bold text-white flex items-center">
            <span className="mr-2">⏰</span> Ajustar Tolerancia
          </h3>
        </div>
        
        <div className="p-5">
          {/* Info del horario */}
          <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-purple-900">{horario.materia}</h4>
                <p className="text-sm text-purple-700">{horario.grado}° {horario.seccion} • {horario.diaSemana}</p>
              </div>
              <div className="text-right text-sm text-purple-600">
                <p>{horario.horaInicio} - {horario.horaFin}</p>
                <p>Aula: {horario.aula}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Slider de tolerancia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tolerancia en minutos
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={toleranciaMin}
                  onChange={(e) => setToleranciaMin(parseInt(e.target.value))}
                  className="flex-1 h-3 bg-gray-200 rounded-full appearance-none cursor-pointer accent-purple-600"
                />
                <div className={`min-w-[70px] px-4 py-2 rounded-xl text-center font-bold text-lg ${
                  toleranciaMin <= 5 ? 'bg-red-100 text-red-700' :
                  toleranciaMin <= 15 ? 'bg-green-100 text-green-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {toleranciaMin} min
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
                <span>Estricto</span>
                <span>Estándar</span>
                <span>Flexible</span>
              </div>
            </div>

            {/* Indicador visual */}
            <div className={`p-3 rounded-xl text-sm ${
              toleranciaMin <= 5 ? 'bg-red-50 border border-red-200 text-red-700' :
              toleranciaMin <= 15 ? 'bg-green-50 border border-green-200 text-green-700' :
              'bg-yellow-50 border border-yellow-200 text-yellow-700'
            }`}>
              {toleranciaMin <= 5 && '🔴 Muy estricto - Ideal para evaluaciones'}
              {toleranciaMin > 5 && toleranciaMin <= 15 && '🟢 Estándar - Recomendado para clases regulares'}
              {toleranciaMin > 15 && '🟡 Flexible - Para actividades especiales'}
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 font-medium transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 font-medium transition-all shadow-md"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </span>
                ) : 'Guardar Tolerancia'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function HorarioModal({ isOpen, onClose, horario, onSave }: HorarioModalProps) {
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFin, setHoraFin] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (horario) {
      // Convertir de formato 12h (de la API) a formato 24h (para los inputs)
      const horaInicio24h = formatTo24Hour(horario.horaInicio)
      const horaFin24h = formatTo24Hour(horario.horaFin)
      
      console.log('🕐 Inicializando modal con horarios:')
      console.log(`API (12h): ${horario.horaInicio} → Input (24h): ${horaInicio24h}`)
      console.log(`API (12h): ${horario.horaFin} → Input (24h): ${horaFin24h}`)
      
      setHoraInicio(horaInicio24h)
      setHoraFin(horaFin24h)
    }
  }, [horario])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Los inputs ya están en formato 24h, enviar directamente
      console.log('🕐 Enviando horarios en formato 24h:')
      console.log(`Inicio: ${horaInicio}`)
      console.log(`Fin: ${horaFin}`)
      
      const success = await onSave(horaInicio, horaFin)
      if (success) {
        onClose()
      }
    } catch (error) {
      console.error('Error saving horario:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !horario) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4">
          <h3 className="text-xl font-bold text-white flex items-center">
            <span className="mr-2">🕐</span> Editar Horarios
          </h3>
        </div>
        
        <div className="p-5">
          {/* Info del horario */}
          <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-green-900">{horario.materia}</h4>
                <p className="text-sm text-green-700">{horario.grado}° {horario.seccion} • {horario.diaSemana}</p>
              </div>
              <div className="text-right text-sm text-green-600">
                <p>Aula: {horario.aula}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Horarios en grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  🕐 Hora Inicio *
                </label>
                <input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  🕐 Hora Fin *
                </label>
                <input
                  type="time"
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white transition-all"
                  required
                />
              </div>
            </div>

            {/* Aviso */}
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-700">
              <p className="font-medium mb-1">⚠️ Importante:</p>
              <p>Se verificarán conflictos con otros horarios antes de guardar.</p>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 font-medium transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 font-medium transition-all shadow-md"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </span>
                ) : 'Guardar Horarios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function HorariosDocente() {
  const {
    horarios,
    loading,
    filters,
    grados,
    secciones,
    docentes,
    stats,
    loadHorarios,
    actualizarTolerancia,
    actualizarHorarios,
    updateFilters
  } = useHorarios()

  const [showToleranciaModal, setShowToleranciaModal] = useState(false)
  const [showHorarioModal, setShowHorarioModal] = useState(false)
  const [selectedHorario, setSelectedHorario] = useState<Horario | null>(null)
  const [vistaActual, setVistaActual] = useState<'lista' | 'calendario'>('lista')
  
  // Estado para verificar si hoy es feriado
  const [esFeriadoHoy, setEsFeriadoHoy] = useState(false)
  const [mensajeFeriado, setMensajeFeriado] = useState('')
  const [loadingFeriado, setLoadingFeriado] = useState(true)

  // Verificar si hoy es feriado al cargar
  useEffect(() => {
    const verificarHoy = async () => {
      try {
        setLoadingFeriado(true)
        const token = localStorage.getItem('token')
        const userStr = localStorage.getItem('user')
        
        let ieId = 1
        if (userStr) {
          try {
            const user = JSON.parse(userStr)
            ieId = user.ieId || user.ie?.id || 1
          } catch {}
        }

        if (token) {
          const hoy = new Date().toISOString().split('T')[0]
          const diaInfo = await verificarFeriado(hoy, ieId, token)
          const permiso = puedeRegistrarAsistencia(diaInfo)
          
          setEsFeriadoHoy(!permiso.permitido)
          setMensajeFeriado(permiso.mensaje)
        }
      } catch (error) {
        console.error('Error verificando feriado:', error)
      } finally {
        setLoadingFeriado(false)
      }
    }

    verificarHoy()
  }, [])

  // Cargar horarios al montar el componente
  useEffect(() => {
    loadHorarios()
  }, [])

  const handleEditTolerancia = (horario: Horario) => {
    setSelectedHorario(horario)
    setShowToleranciaModal(true)
  }

  const handleEditHorario = (horario: Horario) => {
    setSelectedHorario(horario)
    setShowHorarioModal(true)
  }

  const handleSaveTolerancia = async (toleranciaMin: number) => {
    if (!selectedHorario) return false
    
    try {
      const success = await actualizarTolerancia(selectedHorario.id, toleranciaMin)
      if (success) {
        console.log('✅ Tolerancia actualizada exitosamente')
      }
      return success
    } catch (error) {
      console.error('❌ Error al actualizar tolerancia:', error)
      return false
    }
  }

  const handleSaveHorario = async (horaInicio: string, horaFin: string) => {
    if (!selectedHorario) return false
    
    console.log('🔄 Iniciando actualización de horario:')
    console.log(`ID del horario seleccionado: ${selectedHorario.id}`)
    console.log(`Día: ${selectedHorario.diaSemana}`)
    console.log(`Horario anterior: ${selectedHorario.horaInicio} - ${selectedHorario.horaFin}`)
    console.log(`Horario nuevo: ${horaInicio} - ${horaFin}`)
    
    try {
      const success = await actualizarHorarios(selectedHorario.id, horaInicio, horaFin)
      if (success) {
        console.log('✅ Horario actualizado exitosamente')
        console.log('🔄 Recargando lista de horarios...')
      } else {
        console.log('❌ Error: La actualización falló')
      }
      return success
    } catch (error) {
      console.error('❌ Error al actualizar horario:', error)
      return false
    }
  }

  const getDiaColor = (dia: string) => {
    const colores = {
      'LUNES': 'bg-blue-100 text-blue-800',
      'MARTES': 'bg-green-100 text-green-800',
      'MIERCOLES': 'bg-yellow-100 text-yellow-800',
      'JUEVES': 'bg-purple-100 text-purple-800',
      'VIERNES': 'bg-red-100 text-red-800',
      'SABADO': 'bg-gray-100 text-gray-800',
      'DOMINGO': 'bg-orange-100 text-orange-800'
    }
    return colores[dia as keyof typeof colores] || 'bg-gray-100 text-gray-800'
  }

  const getToleranciaColor = (tolerancia: number) => {
    if (tolerancia <= 5) return 'bg-red-100 text-red-800'
    if (tolerancia <= 15) return 'bg-green-100 text-green-800'
    return 'bg-yellow-100 text-yellow-800'
  }

  const diasSemana = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO']

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Banner de feriado */}
      {esFeriadoHoy && !loadingFeriado && (
        <div className="bg-red-50 border-b-2 border-red-200 p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <span className="text-3xl">🚫</span>
            </div>
            <div>
              <h3 className="font-bold text-red-800">Día No Lectivo</h3>
              <p className="text-sm text-red-700">{mensajeFeriado}</p>
              <p className="text-xs text-red-600 mt-1">No se permite registro de asistencia ni modificaciones de horarios hoy.</p>
            </div>
          </div>
        </div>
      )}

      {/* Header con toggle de vista */}
      <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3 sm:mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-black">Mis Horarios</h2>
            <p className="text-xs sm:text-sm text-gray-600">Gestiona horarios y tolerancias</p>
          </div>
          <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
            <button
              onClick={() => setVistaActual('lista')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors min-h-[40px] ${
                vistaActual === 'lista' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 Lista
            </button>
            <button
              onClick={() => setVistaActual('calendario')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors min-h-[40px] ${
                vistaActual === 'calendario' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📅 <span className="hidden sm:inline">Calendario</span><span className="sm:hidden">Cal.</span>
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-4 sm:grid-cols-4 gap-1.5 sm:gap-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3 text-center">
            <div className="text-lg sm:text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-[10px] sm:text-sm text-black">Total</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-3 text-center">
            <div className="text-lg sm:text-2xl font-bold text-gray-600">{stats.grados}</div>
            <div className="text-[10px] sm:text-sm text-black">Grados</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 sm:p-3 text-center">
            <div className="text-lg sm:text-2xl font-bold text-purple-600">
              {horarios.length > 0 ? Math.round(horarios.reduce((acc, h) => acc + h.toleranciaMin, 0) / horarios.length) : 0}
            </div>
            <div className="text-[10px] sm:text-sm text-black">Tol. Prom.</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 sm:p-3 text-center">
            <div className="text-lg sm:text-2xl font-bold text-yellow-600">
              {horarios.filter(h => h.toleranciaMin > 15).length}
            </div>
            <div className="text-[10px] sm:text-sm text-black">Alta Tol.</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          <div className="col-span-2 md:col-span-1">
            <input
              type="text"
              placeholder="Buscar..."
              value={filters.docente}
              onChange={(e) => updateFilters({ docente: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white text-sm"
            />
          </div>
          <div>
            <select
              value={filters.grado}
              onChange={(e) => updateFilters({ grado: e.target.value })}
              className="w-full px-2 sm:px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white text-sm"
            >
              <option value="">Grado</option>
              {grados.map(grado => (
                <option key={grado} value={grado}>{grado}°</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filters.seccion}
              onChange={(e) => updateFilters({ seccion: e.target.value })}
              className="w-full px-2 sm:px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white text-sm"
            >
              <option value="">Sección</option>
              {secciones.map(seccion => (
                <option key={seccion} value={seccion}>{seccion}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filters.diaSemana}
              onChange={(e) => updateFilters({ diaSemana: e.target.value })}
              className="w-full px-2 sm:px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white text-sm"
            >
              <option value="">Día</option>
              {diasSemana.map(dia => (
                <option key={dia} value={dia}>{dia.slice(0, 3)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-black">Cargando horarios...</span>
        </div>
      )}

      {/* Vista Lista */}
      {vistaActual === 'lista' && (
        <div className="p-3 sm:p-4 md:p-6">
          {horarios.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <div className="text-gray-400 text-4xl sm:text-6xl mb-3 sm:mb-4">📚</div>
              <h3 className="text-base sm:text-lg font-medium text-black mb-2">No hay horarios</h3>
              <p className="text-xs sm:text-sm text-gray-600">
                No tienes horarios asignados
              </p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-4">
              {horarios.map((horario) => (
                <div
                  key={horario.id}
                  className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md active:bg-gray-50 transition-all"
                >
                  <div className="flex flex-col gap-3">
                    {/* Header con badges */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <h3 className="font-semibold text-black text-sm sm:text-lg">
                        {horario.materia}
                      </h3>
                      <span className="px-1.5 sm:px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] sm:text-sm rounded-full">
                        {horario.grado}° {horario.seccion}
                      </span>
                      <span className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-sm rounded-full ${getDiaColor(horario.diaSemana)}`}>
                        {horario.diaSemana.slice(0, 3)}
                      </span>
                      <span className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs rounded-full ${getToleranciaColor(horario.toleranciaMin)}`}>
                        ⏰ {horario.toleranciaMin}m
                      </span>
                    </div>

                    {/* Info grid */}
                    <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm">
                      <div>
                        <span className="font-medium text-gray-600 block">Horario</span>
                        <p className="text-black">{horario.horaInicio} - {horario.horaFin}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600 block">Aula</span>
                        <p className="text-black">{horario.aula}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600 block">Tipo</span>
                        <p className="text-black truncate">{horario.tipoActividad.replace('_', ' ')}</p>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => handleEditHorario(horario)}
                        disabled={esFeriadoHoy}
                        className={`flex-1 px-3 py-2 rounded-lg transition-colors text-xs sm:text-sm min-h-[40px] ${
                          esFeriadoHoy 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                        }`}
                        title={esFeriadoHoy ? 'No disponible en día feriado' : 'Editar horario'}
                      >
                        🕐 <span className="hidden sm:inline">Editar </span>Horario
                      </button>
                      <button
                        onClick={() => handleEditTolerancia(horario)}
                        disabled={esFeriadoHoy}
                        className={`flex-1 px-3 py-2 rounded-lg transition-colors text-xs sm:text-sm min-h-[40px] ${
                          esFeriadoHoy 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                        }`}
                        title={esFeriadoHoy ? 'No disponible en día feriado' : 'Ajustar tolerancia'}
                      >
                        ⏰ <span className="hidden sm:inline">Ajustar </span>Tolerancia
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vista Calendario */}
      {vistaActual === 'calendario' && (
        <div className="p-3 sm:p-4 md:p-6">
          {/* Vista móvil - lista por días */}
          <div className="sm:hidden space-y-3">
            {diasSemana.map(dia => {
              const horariosDelDia = horarios.filter(h => h.diaSemana === dia)
              if (horariosDelDia.length === 0) return null
              return (
                <div key={dia} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className={`p-2 text-center font-medium text-sm ${getDiaColor(dia)}`}>
                    {dia}
                  </div>
                  <div className="p-2 space-y-1.5">
                    {horariosDelDia
                      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
                      .map(horario => (
                        <div
                          key={horario.id}
                          className="p-2 bg-blue-50 border border-blue-200 rounded text-xs cursor-pointer active:bg-blue-100 transition-colors"
                          onClick={() => handleEditTolerancia(horario)}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-blue-800">{horario.materia}</span>
                            <span className="text-blue-600">{horario.grado}°{horario.seccion}</span>
                          </div>
                          <div className="text-blue-600">{horario.horaInicio} - {horario.horaFin} • ⏰{horario.toleranciaMin}m</div>
                        </div>
                      ))}
                  </div>
                </div>
              )
            })}
          </div>
          {/* Vista desktop - grid de días */}
          <div className="hidden sm:grid grid-cols-3 lg:grid-cols-6 gap-3">
            {diasSemana.map(dia => (
              <div key={dia} className="border border-gray-200 rounded-lg">
                <div className={`p-2 sm:p-3 text-center font-medium text-xs sm:text-sm ${getDiaColor(dia)} rounded-t-lg`}>
                  {dia.slice(0, 3)}
                </div>
                <div className="p-2 space-y-1.5 min-h-[200px] lg:min-h-[300px]">
                  {horarios
                    .filter(h => h.diaSemana === dia)
                    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
                    .map(horario => (
                      <div
                        key={horario.id}
                        className="p-1.5 sm:p-2 bg-blue-50 border border-blue-200 rounded text-[10px] sm:text-xs cursor-pointer hover:bg-blue-100 active:bg-blue-200 transition-colors"
                        onClick={() => handleEditTolerancia(horario)}
                      >
                        <div className="font-medium text-blue-800 truncate">{horario.materia}</div>
                        <div className="text-blue-600">{horario.grado}° {horario.seccion}</div>
                        <div className="text-blue-600">{horario.horaInicio}</div>
                        <div className="text-blue-600">⏰ {horario.toleranciaMin}m</div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de tolerancia */}
      <ToleranciaModal
        isOpen={showToleranciaModal}
        onClose={() => setShowToleranciaModal(false)}
        horario={selectedHorario}
        onSave={handleSaveTolerancia}
      />

      {/* Modal de horarios */}
      <HorarioModal
        isOpen={showHorarioModal}
        onClose={() => setShowHorarioModal(false)}
        horario={selectedHorario}
        onSave={handleSaveHorario}
      />
    </div>
  )
}
