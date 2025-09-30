'use client'

import { useState, useEffect } from 'react'
import { useJustificaciones, type Justificacion } from '@/hooks/useJustificaciones'

export default function JustificacionesDocente() {
  const { 
    justificaciones, 
    loading, 
    error, 
    pagination,
    loadJustificaciones, 
    revisarJustificacion,
    getEstadisticas 
  } = useJustificaciones()

  const [filtroEstado, setFiltroEstado] = useState('PENDIENTE')
  const [busqueda, setBusqueda] = useState('')
  const [justificacionSeleccionada, setJustificacionSeleccionada] = useState<Justificacion | null>(null)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [accionModal, setAccionModal] = useState<'APROBAR' | 'RECHAZAR'>('APROBAR')
  const [observacionesRevision, setObservacionesRevision] = useState('')
  const [procesando, setProcesando] = useState(false)

  // Cargar justificaciones al montar el componente
  useEffect(() => {
    loadJustificaciones({ estado: filtroEstado })
  }, [filtroEstado])

  // Filtrar justificaciones por búsqueda
  const justificacionesFiltradas = justificaciones.filter(justificacion => {
    const nombreCompleto = `${justificacion.estudiante.usuario.nombre} ${justificacion.estudiante.usuario.apellido}`.toLowerCase()
    const dni = justificacion.estudiante.usuario.dni.toLowerCase()
    const motivo = justificacion.motivo.toLowerCase()
    const termino = busqueda.toLowerCase()
    
    return nombreCompleto.includes(termino) || dni.includes(termino) || motivo.includes(termino)
  })

  // Manejar revisión de justificación
  const handleRevisar = (justificacion: Justificacion, accion: 'APROBAR' | 'RECHAZAR') => {
    setJustificacionSeleccionada(justificacion)
    setAccionModal(accion)
    setObservacionesRevision('')
    setMostrarModal(true)
  }

  // Confirmar revisión
  const confirmarRevision = async () => {
    if (!justificacionSeleccionada) return

    try {
      setProcesando(true)
      await revisarJustificacion(
        justificacionSeleccionada.idJustificacion,
        accionModal,
        observacionesRevision.trim() || undefined
      )
      setMostrarModal(false)
      setJustificacionSeleccionada(null)
      
      // Recargar justificaciones
      await loadJustificaciones({ estado: filtroEstado })
    } catch (error) {
      console.error('Error al procesar justificación:', error)
    } finally {
      setProcesando(false)
    }
  }

  // Formatear fecha
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Formatear rango de fechas
  const formatearRangoFechas = (fechaInicio: string, fechaFin: string) => {
    const inicio = formatearFecha(fechaInicio)
    const fin = formatearFecha(fechaFin)
    return inicio === fin ? inicio : `${inicio} - ${fin}`
  }

  const estadisticas = getEstadisticas()

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-black mb-2">Justificaciones de Estudiantes</h2>
        <p className="text-black">
          Revisa y aprueba las justificaciones presentadas por los estudiantes
        </p>
      </div>

      {/* Filtros y búsqueda */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por estudiante, DNI o motivo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white shadow-sm transition-all duration-200 hover:border-gray-400"
            />
          </div>
          <div>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white shadow-sm transition-all duration-200 hover:border-gray-400"
            >
              <option value="">Todos los estados</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="APROBADA">Aprobadas</option>
              <option value="RECHAZADA">Rechazadas</option>
            </select>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{estadisticas.total}</div>
            <div className="text-sm text-black">Total</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-600">{estadisticas.pendientes}</div>
            <div className="text-sm text-black">Pendientes</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{estadisticas.aprobadas}</div>
            <div className="text-sm text-black">Aprobadas</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-600">{estadisticas.rechazadas}</div>
            <div className="text-sm text-black">Rechazadas</div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-black">Cargando justificaciones...</span>
        </div>
      )}

      {/* Lista de justificaciones */}
      <div className="p-6">
        {justificacionesFiltradas.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-black mb-2">No hay justificaciones</h3>
            <p className="text-black">
              {busqueda ? 'No se encontraron justificaciones que coincidan con tu búsqueda' : 'No hay justificaciones para mostrar'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {justificacionesFiltradas.map((justificacion) => (
              <div
                key={justificacion.idJustificacion}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Información principal */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-black">
                        {justificacion.estudiante.usuario.nombre} {justificacion.estudiante.usuario.apellido}
                      </h3>
                      <span className="text-sm text-black">
                        DNI: {justificacion.estudiante.usuario.dni}
                      </span>
                      {justificacion.estudiante.gradoSeccion && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {justificacion.estudiante.gradoSeccion.grado.nombre}° {justificacion.estudiante.gradoSeccion.seccion.nombre}
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        justificacion.estadoJustificacion.codigo === 'PENDIENTE' 
                          ? 'bg-yellow-100 text-yellow-800'
                          : justificacion.estadoJustificacion.codigo === 'APROBADA'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {justificacion.estadoJustificacion.nombre}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-black">Tipo:</span>
                        <p className="text-black">{justificacion.tipoJustificacion.nombre}</p>
                      </div>
                      <div>
                        <span className="font-medium text-black">Fechas:</span>
                        <p className="text-black">
                          {formatearRangoFechas(justificacion.fechaInicio, justificacion.fechaFin)}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-black">Presentado:</span>
                        <p className="text-black">
                          {formatearFecha(justificacion.fechaPresentacion)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <span className="font-medium text-black">Motivo:</span>
                      <p className="text-black mt-1">{justificacion.motivo}</p>
                    </div>

                    {justificacion.observaciones && (
                      <div className="mt-2">
                        <span className="font-medium text-black">Observaciones:</span>
                        <p className="text-black mt-1">{justificacion.observaciones}</p>
                      </div>
                    )}

                    {/* Documentos */}
                    {justificacion.documentos.length > 0 && (
                      <div className="mt-3">
                        <span className="font-medium text-black">Documentos adjuntos:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {justificacion.documentos.map((doc) => (
                            <span
                              key={doc.idDocumento}
                              className="px-2 py-1 bg-gray-100 text-black text-xs rounded border"
                            >
                              📎 {doc.nombreArchivo}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Información de revisión */}
                    {justificacion.usuarioRevisor && (
                      <div className="mt-3 p-3 bg-gray-50 rounded border">
                        <div className="text-sm">
                          <span className="font-medium text-black">Revisado por:</span>
                          <span className="text-black ml-2">
                            {justificacion.usuarioRevisor.nombre} {justificacion.usuarioRevisor.apellido}
                          </span>
                          <span className="text-black ml-4">
                            el {formatearFecha(justificacion.fechaRevision!)}
                          </span>
                        </div>
                        {justificacion.observacionesRevision && (
                          <div className="mt-2">
                            <span className="font-medium text-black">Observaciones de revisión:</span>
                            <p className="text-black mt-1">{justificacion.observacionesRevision}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  {justificacion.estadoJustificacion.codigo === 'PENDIENTE' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRevisar(justificacion, 'APROBAR')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        ✅ Aprobar
                      </button>
                      <button
                        onClick={() => handleRevisar(justificacion, 'RECHAZAR')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        ❌ Rechazar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de confirmación */}
      {mostrarModal && justificacionSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold text-black mb-4">
                {accionModal === 'APROBAR' ? '✅ Aprobar Justificación' : '❌ Rechazar Justificación'}
              </h3>
              
              <div className="mb-4">
                <p className="text-black mb-2">
                  <strong>Estudiante:</strong> {justificacionSeleccionada.estudiante.usuario.nombre} {justificacionSeleccionada.estudiante.usuario.apellido}
                </p>
                <p className="text-black mb-2">
                  <strong>Motivo:</strong> {justificacionSeleccionada.motivo}
                </p>
                <p className="text-black">
                  <strong>Fechas:</strong> {formatearRangoFechas(justificacionSeleccionada.fechaInicio, justificacionSeleccionada.fechaFin)}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-black mb-2">
                  Observaciones de revisión (opcional):
                </label>
                <textarea
                  value={observacionesRevision}
                  onChange={(e) => setObservacionesRevision(e.target.value)}
                  placeholder={`Escribe aquí las observaciones sobre ${accionModal === 'APROBAR' ? 'la aprobación' : 'el rechazo'}...`}
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white shadow-sm transition-all duration-200 hover:border-gray-400"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setMostrarModal(false)}
                  disabled={procesando}
                  className="px-4 py-2 border border-gray-300 text-black rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarRevision}
                  disabled={procesando}
                  className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 ${
                    accionModal === 'APROBAR' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {procesando ? 'Procesando...' : `Confirmar ${accionModal === 'APROBAR' ? 'Aprobación' : 'Rechazo'}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
