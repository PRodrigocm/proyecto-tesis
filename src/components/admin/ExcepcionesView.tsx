'use client'

import { useState } from 'react'
import { useExcepciones } from '@/hooks/useExcepciones'
import CreateExcepcionModal from './CreateExcepcionModal'

interface ExcepcionesViewProps {
  ieId: number
}

const tipoLabels: Record<string, string> = {
  'FERIADO': '🎉 Feriado',
  'SUSPENSION_CLASES': '⚠️ Suspensión',
  'VACACIONES': '🏖️ Vacaciones',
  'HORARIO_ESPECIAL': '⏰ Horario Especial',
  'CAPACITACION': '📚 Capacitación',
  'DIA_NO_LABORABLE': '📅 No Laborable',
  'OTRO': '📝 Otro'
}

const alcanceLabels: Record<string, string> = {
  'AMBOS': '🏫 Toda la IE',
  'CLASE': '📚 Solo Clases',
  'TALLER': '🔧 Solo Talleres'
}

export default function ExcepcionesView({ ieId }: ExcepcionesViewProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [fechaConsulta, setFechaConsulta] = useState('')
  const [resultadoConsulta, setResultadoConsulta] = useState<any>(null)

  const {
    excepciones,
    loading,
    error,
    createExcepcion,
    deleteExcepcion,
    consultarSiHayClases
  } = useExcepciones(ieId)

  // Filtrar excepciones
  const excepcionesFiltradas = excepciones.filter(excepcion => {
    const matchesSearch = excepcion.motivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         excepcion.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTipo = !tipoFiltro || excepcion.tipoExcepcion === tipoFiltro
    return matchesSearch && matchesTipo
  })

  // Separar por fecha (futuras vs pasadas)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  
  const excepcionesFuturas = excepcionesFiltradas.filter(e => new Date(e.fecha) >= hoy)
  const excepcionesPasadas = excepcionesFiltradas.filter(e => new Date(e.fecha) < hoy)

  const handleCreateExcepcion = async (data: any) => {
    const success = await createExcepcion(data)
    if (success) {
      setIsCreateModalOpen(false)
    }
    return success
  }

  const handleDeleteExcepcion = async (id: string, motivo: string) => {
    if (confirm(`¿Estás seguro de que quieres eliminar la excepción "${motivo}"?`)) {
      await deleteExcepcion(id)
    }
  }

  const handleConsultarFecha = async () => {
    if (!fechaConsulta) {
      alert('Por favor selecciona una fecha')
      return
    }

    const resultado = await consultarSiHayClases(fechaConsulta)
    setResultadoConsulta(resultado)
  }

  const formatearFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr + 'T00:00:00')
    return fecha.toLocaleDateString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🚫 Feriados y Excepciones</h2>
          <p className="text-gray-600">Gestiona días sin clases y horarios especiales</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
        >
          <span>➕</span>
          <span>Agregar Excepción</span>
        </button>
      </div>

      {/* Consulta Rápida */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-lg font-medium text-blue-900 mb-3">🔍 Consulta Rápida</h3>
        <div className="flex items-center space-x-3">
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">
              ¿Hay clases el...?
            </label>
            <input
              type="date"
              value={fechaConsulta}
              onChange={(e) => setFechaConsulta(e.target.value)}
              className="px-3 py-2 border border-blue-300 rounded-md text-black"
            />
          </div>
          <button
            onClick={handleConsultarFecha}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 mt-6"
          >
            Consultar
          </button>
        </div>
        
        {resultadoConsulta && (
          <div className={`mt-4 p-3 rounded-md ${
            resultadoConsulta.hayClases 
              ? 'bg-green-100 border border-green-300' 
              : 'bg-red-100 border border-red-300'
          }`}>
            <div className="flex items-center space-x-2">
              <span className="text-lg">
                {resultadoConsulta.hayClases ? '✅' : '❌'}
              </span>
              <div>
                <p className={`font-medium ${
                  resultadoConsulta.hayClases ? 'text-green-800' : 'text-red-800'
                }`}>
                  {resultadoConsulta.hayClases ? 'SÍ hay clases' : 'NO hay clases'}
                </p>
                <p className={`text-sm ${
                  resultadoConsulta.hayClases ? 'text-green-600' : 'text-red-600'
                }`}>
                  {resultadoConsulta.motivo}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🔍 Buscar por motivo
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar excepciones..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📋 Filtrar por tipo
            </label>
            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
            >
              <option value="">Todos los tipos</option>
              {Object.entries(tipoLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{excepcionesFuturas.length}</div>
          <div className="text-sm text-blue-700">Excepciones Futuras</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-600">{excepcionesPasadas.length}</div>
          <div className="text-sm text-gray-700">Excepciones Pasadas</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">{excepciones.length}</div>
          <div className="text-sm text-green-700">Total Excepciones</div>
        </div>
      </div>

      {/* Lista de Excepciones Futuras */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">📅 Próximas Excepciones</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Cargando excepciones...</div>
          ) : excepcionesFuturas.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No hay excepciones futuras programadas
            </div>
          ) : (
            excepcionesFuturas.map((excepcion) => (
              <div key={excepcion.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">
                        {excepcion.tipoExcepcion === 'FERIADO' ? '🎉' : 
                         excepcion.tipoExcepcion === 'SUSPENSION_CLASES' ? '⚠️' : 
                         excepcion.tipoExcepcion === 'VACACIONES' ? '🏖️' : '📅'}
                      </span>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">
                          {excepcion.motivo}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {formatearFecha(excepcion.fecha)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center space-x-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {tipoLabels[excepcion.tipoExcepcion]}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {alcanceLabels[excepcion.tipoHorario]}
                      </span>
                      {excepcion.horaInicioAlt && excepcion.horaFinAlt && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ⏰ {excepcion.horaInicioAlt} - {excepcion.horaFinAlt}
                        </span>
                      )}
                    </div>
                    {excepcion.descripcion && (
                      <p className="mt-2 text-sm text-gray-600">{excepcion.descripcion}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDeleteExcepcion(excepcion.id, excepcion.motivo)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Lista de Excepciones Pasadas (colapsible) */}
      {excepcionesPasadas.length > 0 && (
        <details className="bg-white rounded-lg border border-gray-200">
          <summary className="px-6 py-4 border-b border-gray-200 cursor-pointer">
            <h3 className="text-lg font-medium text-gray-900 inline">
              📚 Historial de Excepciones ({excepcionesPasadas.length})
            </h3>
          </summary>
          <div className="divide-y divide-gray-200">
            {excepcionesPasadas.map((excepcion) => (
              <div key={excepcion.id} className="p-6 hover:bg-gray-50 opacity-75">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">
                    {excepcion.tipoExcepcion === 'FERIADO' ? '🎉' : 
                     excepcion.tipoExcepcion === 'SUSPENSION_CLASES' ? '⚠️' : 
                     excepcion.tipoExcepcion === 'VACACIONES' ? '🏖️' : '📅'}
                  </span>
                  <div>
                    <h4 className="text-lg font-medium text-gray-700">
                      {excepcion.motivo}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {formatearFecha(excepcion.fecha)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Modal de Crear Excepción */}
      <CreateExcepcionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateExcepcion}
      />
    </div>
  )
}
