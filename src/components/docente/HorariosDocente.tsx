'use client'

import { useState, useEffect } from 'react'
import { useHorarios, type Horario } from '@/hooks/useHorarios'

// Modal para editar tolerancia
interface ToleranciaModalProps {
  isOpen: boolean
  onClose: () => void
  horario: Horario | null
  onSave: (toleranciaMin: number) => Promise<boolean>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-bold text-black mb-4">
            ⏰ Ajustar Tolerancia
          </h3>
          
          <div className="mb-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <h4 className="font-medium text-blue-800 mb-2">📚 Información del Horario:</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>Materia:</strong> {horario.materia}</p>
                <p><strong>Grado:</strong> {horario.grado}° {horario.seccion}</p>
                <p><strong>Día:</strong> {horario.diaSemana}</p>
                <p><strong>Horario:</strong> {horario.horaInicio} - {horario.horaFin}</p>
                <p><strong>Aula:</strong> {horario.aula}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Tolerancia en minutos *
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={toleranciaMin}
                  onChange={(e) => setToleranciaMin(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="min-w-[60px] px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-center font-bold">
                  {toleranciaMin} min
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0 min</span>
                <span>15 min</span>
                <span>30 min</span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                💡 La tolerancia permite que los estudiantes lleguen hasta {toleranciaMin} minutos tarde sin ser marcados como tardanza.
              </p>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-1">⚠️ Recomendaciones:</h4>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• <strong>0-5 min:</strong> Muy estricto, ideal para evaluaciones</li>
                <li>• <strong>10-15 min:</strong> Estándar recomendado para clases regulares</li>
                <li>• <strong>20-30 min:</strong> Flexible, para actividades especiales</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 text-black rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar Tolerancia'}
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
    updateFilters
  } = useHorarios()

  const [showToleranciaModal, setShowToleranciaModal] = useState(false)
  const [selectedHorario, setSelectedHorario] = useState<Horario | null>(null)
  const [vistaActual, setVistaActual] = useState<'lista' | 'calendario'>('lista')

  // Cargar horarios al montar el componente
  useEffect(() => {
    loadHorarios()
  }, [])

  const handleEditTolerancia = (horario: Horario) => {
    setSelectedHorario(horario)
    setShowToleranciaModal(true)
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
      {/* Header con toggle de vista */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-black">Mis Horarios de Clase</h2>
            <p className="text-black">Gestiona tus horarios y ajusta las tolerancias de asistencia</p>
          </div>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setVistaActual('lista')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                vistaActual === 'lista' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 Lista
            </button>
            <button
              onClick={() => setVistaActual('calendario')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                vistaActual === 'calendario' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📅 Calendario
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-black">Total Horarios</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.activos}</div>
            <div className="text-sm text-black">Activos</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.grados}</div>
            <div className="text-sm text-black">Grados</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {horarios.length > 0 ? Math.round(horarios.reduce((acc, h) => acc + h.toleranciaMin, 0) / horarios.length) : 0}
            </div>
            <div className="text-sm text-black">Tolerancia Promedio</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {horarios.filter(h => h.toleranciaMin > 15).length}
            </div>
            <div className="text-sm text-black">Alta Tolerancia</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="Buscar por materia..."
              value={filters.docente}
              onChange={(e) => updateFilters({ docente: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white shadow-sm transition-all duration-200 hover:border-gray-400"
            />
          </div>
          <div>
            <select
              value={filters.grado}
              onChange={(e) => updateFilters({ grado: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white shadow-sm transition-all duration-200 hover:border-gray-400"
            >
              <option value="">Todos los grados</option>
              {grados.map(grado => (
                <option key={grado} value={grado}>{grado}°</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filters.seccion}
              onChange={(e) => updateFilters({ seccion: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white shadow-sm transition-all duration-200 hover:border-gray-400"
            >
              <option value="">Todas las secciones</option>
              {secciones.map(seccion => (
                <option key={seccion} value={seccion}>{seccion}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filters.diaSemana}
              onChange={(e) => updateFilters({ diaSemana: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white shadow-sm transition-all duration-200 hover:border-gray-400"
            >
              <option value="">Todos los días</option>
              {diasSemana.map(dia => (
                <option key={dia} value={dia}>{dia}</option>
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
        <div className="p-6">
          {horarios.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-6xl mb-4">📚</div>
              <h3 className="text-lg font-medium text-black mb-2">No hay horarios asignados</h3>
              <p className="text-black">
                Aún no tienes horarios de clase asignados o no coinciden con los filtros aplicados.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {horarios.map((horario) => (
                <div
                  key={horario.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Información principal */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-black text-lg">
                          {horario.materia}
                        </h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          {horario.grado}° {horario.seccion}
                        </span>
                        <span className={`px-2 py-1 text-sm rounded-full ${getDiaColor(horario.diaSemana)}`}>
                          {horario.diaSemana}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getToleranciaColor(horario.toleranciaMin)}`}>
                          ⏰ {horario.toleranciaMin} min
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-black">Horario:</span>
                          <p className="text-black">{horario.horaInicio} - {horario.horaFin}</p>
                        </div>
                        <div>
                          <span className="font-medium text-black">Aula:</span>
                          <p className="text-black">{horario.aula}</p>
                        </div>
                        <div>
                          <span className="font-medium text-black">Tipo:</span>
                          <p className="text-black">{horario.tipoActividad.replace('_', ' ')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditTolerancia(horario)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        ⏰ Ajustar Tolerancia
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
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
            {diasSemana.map(dia => (
              <div key={dia} className="border border-gray-200 rounded-lg">
                <div className={`p-3 text-center font-medium ${getDiaColor(dia)} rounded-t-lg`}>
                  {dia}
                </div>
                <div className="p-3 space-y-2 min-h-[300px]">
                  {horarios
                    .filter(h => h.diaSemana === dia)
                    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
                    .map(horario => (
                      <div
                        key={horario.id}
                        className="p-2 bg-blue-50 border border-blue-200 rounded text-xs cursor-pointer hover:bg-blue-100 transition-colors"
                        onClick={() => handleEditTolerancia(horario)}
                      >
                        <div className="font-medium text-blue-800">{horario.materia}</div>
                        <div className="text-blue-600">{horario.grado}° {horario.seccion}</div>
                        <div className="text-blue-600">{horario.horaInicio} - {horario.horaFin}</div>
                        <div className="text-blue-600">⏰ {horario.toleranciaMin} min</div>
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
    </div>
  )
}
