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
  const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false)
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

  // Ver detalle de justificación
  const handleVerDetalle = (justificacion: Justificacion) => {
    setJustificacionSeleccionada(justificacion)
    setMostrarModalDetalle(true)
  }

  // Descargar documento
  const handleDescargarDocumento = async (idDocumento: number, nombreArchivo: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/justificaciones/documentos/${idDocumento}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = nombreArchivo
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Error al descargar el documento')
      }
    } catch (error) {
      console.error('Error descargando documento:', error)
      alert('Error al descargar el documento')
    }
  }

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
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Filtros y búsqueda */}
      <div className="p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <div className="flex flex-col gap-3 mb-3 sm:mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white text-sm"
            />
          </div>
          <div className="grid grid-cols-5 gap-1.5 sm:flex sm:gap-2">
            {['', 'PENDIENTE', 'EN_REVISION', 'APROBADA', 'RECHAZADA'].map((estado) => (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado)}
                className={`px-2 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all min-h-[40px] ${
                  filtroEstado === estado
                    ? estado === 'PENDIENTE' ? 'bg-yellow-500 text-white shadow-md'
                    : estado === 'EN_REVISION' ? 'bg-orange-500 text-white shadow-md'
                    : estado === 'APROBADA' ? 'bg-green-500 text-white shadow-md'
                    : estado === 'RECHAZADA' ? 'bg-red-500 text-white shadow-md'
                    : 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                }`}
              >
                <span className="sm:hidden">{estado === '' ? '📋' : estado === 'PENDIENTE' ? '⏳' : estado === 'EN_REVISION' ? '🔍' : estado === 'APROBADA' ? '✅' : '❌'}</span>
                <span className="hidden sm:inline">{estado === '' ? 'Todos' : estado === 'PENDIENTE' ? '⏳ Pend.' : estado === 'EN_REVISION' ? '🔍 Revisión' : estado === 'APROBADA' ? '✅ Aprob.' : '❌ Rech.'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Estadísticas compactas */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center text-white shadow-md">
            <div className="text-lg sm:text-2xl font-bold">{estadisticas.total}</div>
            <div className="text-[10px] sm:text-xs opacity-90">Total</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center text-white shadow-md">
            <div className="text-lg sm:text-2xl font-bold">{estadisticas.pendientes}</div>
            <div className="text-[10px] sm:text-xs opacity-90">Pend.</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center text-white shadow-md">
            <div className="text-lg sm:text-2xl font-bold">{estadisticas.aprobadas}</div>
            <div className="text-[10px] sm:text-xs opacity-90">Aprob.</div>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center text-white shadow-md">
            <div className="text-lg sm:text-2xl font-bold">{estadisticas.rechazadas}</div>
            <div className="text-[10px] sm:text-xs opacity-90">Rech.</div>
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
      <div className="p-3 sm:p-4">
        {justificacionesFiltradas.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">No hay justificaciones</h3>
            <p className="text-gray-500 text-xs sm:text-sm">
              {busqueda ? 'No se encontraron resultados' : 'No hay justificaciones'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {justificacionesFiltradas.map((justificacion) => (
              <div
                key={justificacion.idJustificacion}
                className={`rounded-lg sm:rounded-xl border-2 p-3 sm:p-4 transition-all hover:shadow-lg active:bg-opacity-80 ${
                  justificacion.estadoJustificacion.codigo === 'PENDIENTE' 
                    ? 'border-yellow-200 bg-gradient-to-r from-yellow-50 to-white'
                    : justificacion.estadoJustificacion.codigo === 'EN_REVISION'
                    ? 'border-orange-200 bg-gradient-to-r from-orange-50 to-white'
                    : justificacion.estadoJustificacion.codigo === 'APROBADA'
                    ? 'border-green-200 bg-gradient-to-r from-green-50 to-white'
                    : 'border-red-200 bg-gradient-to-r from-red-50 to-white'
                }`}
              >
                <div className="flex flex-col gap-3">
                  {/* Header de la tarjeta */}
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                      {justificacion.estudiante.usuario.nombre[0]}{justificacion.estudiante.usuario.apellido[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                        {justificacion.estudiante.usuario.nombre} {justificacion.estudiante.usuario.apellido}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-gray-500">
                        <span className="hidden sm:inline">DNI: {justificacion.estudiante.usuario.dni}</span>
                        {justificacion.estudiante.gradoSeccion && (
                          <span className="px-1.5 sm:px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                            {justificacion.estudiante.gradoSeccion.grado.nombre}° {justificacion.estudiante.gradoSeccion.seccion.nombre}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`flex-shrink-0 px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-bold rounded-full ${
                      justificacion.estadoJustificacion.codigo === 'PENDIENTE' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : justificacion.estadoJustificacion.codigo === 'EN_REVISION'
                        ? 'bg-orange-100 text-orange-800'
                        : justificacion.estadoJustificacion.codigo === 'APROBADA'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {justificacion.estadoJustificacion.codigo === 'PENDIENTE' ? '⏳' : justificacion.estadoJustificacion.codigo === 'EN_REVISION' ? '🔍' : justificacion.estadoJustificacion.codigo === 'APROBADA' ? '✅' : '❌'}
                      <span className="hidden sm:inline ml-1">{justificacion.estadoJustificacion.nombre}</span>
                    </span>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-3 text-xs sm:text-sm">
                    <div className="bg-white/50 rounded-lg p-1.5 sm:p-2 border">
                      <span className="text-gray-500 text-[10px] sm:text-xs block">Tipo</span>
                      <span className="font-medium text-gray-900 text-xs sm:text-sm truncate block">{justificacion.tipoJustificacion.nombre}</span>
                    </div>
                    <div className="bg-white/50 rounded-lg p-1.5 sm:p-2 border">
                      <span className="text-gray-500 text-[10px] sm:text-xs block">Fechas</span>
                      <span className="font-medium text-gray-900 text-xs sm:text-sm truncate block">{formatearRangoFechas(justificacion.fechaInicio, justificacion.fechaFin)}</span>
                    </div>
                    <div className="bg-white/50 rounded-lg p-1.5 sm:p-2 border">
                      <span className="text-gray-500 text-[10px] sm:text-xs block">Presentado</span>
                      <span className="font-medium text-gray-900 text-xs sm:text-sm block">{formatearFecha(justificacion.fechaPresentacion)}</span>
                    </div>
                  </div>

                  {/* Motivo */}
                  <div className="bg-white/70 rounded-lg p-2 sm:p-3 border">
                    <span className="text-gray-500 text-[10px] sm:text-xs block mb-0.5">Motivo</span>
                    <p className="text-gray-900 text-xs sm:text-sm line-clamp-2">{justificacion.motivo}</p>
                  </div>

                  {/* Documentos - Clickeables para descargar */}
                  {justificacion.documentos.length > 0 && (
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {justificacion.documentos.map((doc) => (
                        <button
                          key={doc.idDocumento}
                          onClick={() => handleDescargarDocumento(doc.idDocumento, doc.nombreArchivo)}
                          className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-50 text-blue-700 text-[10px] sm:text-xs rounded-lg border border-blue-200 hover:bg-blue-100 active:bg-blue-200 transition-colors cursor-pointer"
                        >
                          📎 <span className="ml-1">{doc.nombreArchivo}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Info de revisión */}
                  {justificacion.usuarioRevisor && (
                    <div className="p-2 bg-gray-100 rounded-lg text-[10px] sm:text-xs text-gray-600">
                      <span className="font-medium">✓ {justificacion.usuarioRevisor.nombre} {justificacion.usuarioRevisor.apellido}</span>
                      {justificacion.observacionesRevision && (
                        <p className="mt-1 text-gray-500 italic">"{justificacion.observacionesRevision}"</p>
                      )}
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleVerDetalle(justificacion)}
                      className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 active:from-blue-700 active:to-indigo-800 transition-all shadow-md font-medium text-xs sm:text-sm min-h-[40px]"
                    >
                      👁️ <span className="hidden sm:inline">Ver Detalle</span>
                    </button>
                    {(justificacion.estadoJustificacion.codigo === 'PENDIENTE' || justificacion.estadoJustificacion.codigo === 'EN_REVISION') && (
                      <>
                        <button
                          onClick={() => handleRevisar(justificacion, 'APROBAR')}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 active:from-green-700 active:to-emerald-800 transition-all shadow-md font-medium text-xs sm:text-sm min-h-[40px]"
                        >
                          ✅ <span className="hidden sm:inline">Aprobar</span>
                        </button>
                        <button
                          onClick={() => handleRevisar(justificacion, 'RECHAZAR')}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg hover:from-red-600 hover:to-rose-700 active:from-red-700 active:to-rose-800 transition-all shadow-md font-medium text-xs sm:text-sm min-h-[40px]"
                        >
                          ❌ <span className="hidden sm:inline">Rechazar</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de confirmación */}
      {mostrarModal && justificacionSeleccionada && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Header del modal */}
            <div className={`p-4 ${accionModal === 'APROBAR' ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-rose-600'}`}>
              <h3 className="text-xl font-bold text-white flex items-center">
                {accionModal === 'APROBAR' ? '✅ Aprobar Justificación' : '❌ Rechazar Justificación'}
              </h3>
            </div>
            
            <div className="p-5">
              {/* Info del estudiante */}
              <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                  {justificacionSeleccionada.estudiante.usuario.nombre[0]}{justificacionSeleccionada.estudiante.usuario.apellido[0]}
                </div>
                <div>
                  <p className="font-bold text-gray-900">
                    {justificacionSeleccionada.estudiante.usuario.nombre} {justificacionSeleccionada.estudiante.usuario.apellido}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatearRangoFechas(justificacionSeleccionada.fechaInicio, justificacionSeleccionada.fechaFin)}
                  </p>
                </div>
              </div>

              {/* Motivo */}
              <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <span className="text-xs text-blue-600 font-medium">Motivo</span>
                <p className="text-gray-900 text-sm mt-1">{justificacionSeleccionada.motivo}</p>
              </div>

              {/* Observaciones */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones (opcional):
                </label>
                <textarea
                  value={observacionesRevision}
                  onChange={(e) => setObservacionesRevision(e.target.value)}
                  placeholder={`Escribe aquí las observaciones...`}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white transition-all resize-none"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3">
                <button
                  onClick={() => setMostrarModal(false)}
                  disabled={procesando}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 font-medium transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarRevision}
                  disabled={procesando}
                  className={`flex-1 px-4 py-3 text-white rounded-xl disabled:opacity-50 font-medium transition-all shadow-md ${
                    accionModal === 'APROBAR' 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' 
                      : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700'
                  }`}
                >
                  {procesando ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Procesando...
                    </span>
                  ) : (
                    `Confirmar ${accionModal === 'APROBAR' ? 'Aprobación' : 'Rechazo'}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalle */}
      {mostrarModalDetalle && justificacionSeleccionada && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header del modal */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
              <h3 className="text-xl font-bold text-white flex items-center">
                📋 Detalle de Justificación
              </h3>
            </div>
            
            <div className="p-5 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Info del estudiante */}
              <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                  {justificacionSeleccionada.estudiante.usuario.nombre[0]}{justificacionSeleccionada.estudiante.usuario.apellido[0]}
                </div>
                <div>
                  <p className="font-bold text-gray-900">
                    {justificacionSeleccionada.estudiante.usuario.nombre} {justificacionSeleccionada.estudiante.usuario.apellido}
                  </p>
                  <p className="text-sm text-gray-500">
                    DNI: {justificacionSeleccionada.estudiante.usuario.dni}
                    {justificacionSeleccionada.estudiante.gradoSeccion && (
                      <span className="ml-2">• {justificacionSeleccionada.estudiante.gradoSeccion.grado.nombre}° {justificacionSeleccionada.estudiante.gradoSeccion.seccion.nombre}</span>
                    )}
                  </p>
                </div>
                <span className={`ml-auto px-3 py-1 text-xs font-bold rounded-full ${
                  justificacionSeleccionada.estadoJustificacion.codigo === 'PENDIENTE' 
                    ? 'bg-yellow-100 text-yellow-800'
                    : justificacionSeleccionada.estadoJustificacion.codigo === 'EN_REVISION'
                    ? 'bg-orange-100 text-orange-800'
                    : justificacionSeleccionada.estadoJustificacion.codigo === 'APROBADA'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {justificacionSeleccionada.estadoJustificacion.nombre}
                </span>
              </div>

              {/* Información de la justificación */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <span className="text-xs text-blue-600 font-medium">Tipo</span>
                  <p className="text-gray-900 font-medium">{justificacionSeleccionada.tipoJustificacion.nombre}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <span className="text-xs text-purple-600 font-medium">Fechas</span>
                  <p className="text-gray-900 font-medium">{formatearRangoFechas(justificacionSeleccionada.fechaInicio, justificacionSeleccionada.fechaFin)}</p>
                </div>
              </div>

              {/* Motivo */}
              <div className="mb-4 p-3 bg-gray-50 rounded-xl border">
                <span className="text-xs text-gray-600 font-medium">Motivo</span>
                <p className="text-gray-900 mt-1">{justificacionSeleccionada.motivo}</p>
              </div>

              {/* Observaciones */}
              {justificacionSeleccionada.observaciones && (
                <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <span className="text-xs text-amber-600 font-medium">Observaciones del apoderado</span>
                  <p className="text-gray-900 mt-1">{justificacionSeleccionada.observaciones}</p>
                </div>
              )}

              {/* Documentos adjuntos */}
              {justificacionSeleccionada.documentos.length > 0 && (
                <div className="mb-4">
                  <span className="text-xs text-gray-600 font-medium block mb-2">Documentos adjuntos</span>
                  <div className="space-y-2">
                    {justificacionSeleccionada.documentos.map((doc) => (
                      <button
                        key={doc.idDocumento}
                        onClick={() => handleDescargarDocumento(doc.idDocumento, doc.nombreArchivo)}
                        className="w-full flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 rounded-xl border border-blue-200 transition-colors text-left"
                      >
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                          📄
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{doc.nombreArchivo}</p>
                          <p className="text-xs text-gray-500">Click para descargar</p>
                        </div>
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Info de revisión */}
              {justificacionSeleccionada.usuarioRevisor && (
                <div className="p-3 bg-gray-100 rounded-xl">
                  <span className="text-xs text-gray-600 font-medium">Revisado por</span>
                  <p className="text-gray-900 font-medium mt-1">
                    {justificacionSeleccionada.usuarioRevisor.nombre} {justificacionSeleccionada.usuarioRevisor.apellido}
                  </p>
                  {justificacionSeleccionada.observacionesRevision && (
                    <p className="text-gray-600 mt-1 italic">"{justificacionSeleccionada.observacionesRevision}"</p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => setMostrarModalDetalle(false)}
                className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-medium transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
