'use client'

import { useState, useEffect } from 'react'
import { useReportes, type FiltrosReporte, type ConfiguracionExportacion } from '@/hooks/useReportes'

// Modal de configuración de exportación automática
interface ConfiguracionModalProps {
  isOpen: boolean
  onClose: () => void
  configuracion: ConfiguracionExportacion | null
  onSave: (config: ConfiguracionExportacion) => Promise<boolean>
}

function ConfiguracionModal({ isOpen, onClose, configuracion, onSave }: ConfiguracionModalProps) {
  const [formData, setFormData] = useState<ConfiguracionExportacion>({
    habilitada: false,
    frecuencia: 'mensual',
    formato: 'pdf',
    diaDelMes: 1,
    diaDeLaSemana: 1,
    hora: '08:00',
    incluirResumen: true,
    incluirDetalle: true,
    incluirGraficos: false,
    email: '',
    notificarPorEmail: true
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (configuracion) {
      setFormData(configuracion)
    }
  }, [configuracion])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const success = await onSave(formData)
      if (success) {
        onClose()
      }
    } catch (error) {
      console.error('Error saving configuration:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-bold text-black mb-4">
            ⚙️ Configuración de Exportación Automática
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Habilitar/Deshabilitar */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="habilitada"
                checked={formData.habilitada}
                onChange={(e) => setFormData(prev => ({ ...prev, habilitada: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="habilitada" className="text-sm font-medium text-black">
                Habilitar exportación automática
              </label>
            </div>

            {formData.habilitada && (
              <>
                {/* Frecuencia */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Frecuencia *
                  </label>
                  <select
                    value={formData.frecuencia}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      frecuencia: e.target.value as 'semanal' | 'mensual' 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    required
                  >
                    <option value="semanal">Semanal</option>
                    <option value="mensual">Mensual</option>
                  </select>
                </div>

                {/* Formato */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Formato de exportación *
                  </label>
                  <select
                    value={formData.formato}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      formato: e.target.value as 'pdf' | 'excel' | 'word' 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    required
                  >
                    <option value="pdf">PDF (Recomendado)</option>
                    <option value="excel">Excel</option>
                    <option value="word">Word</option>
                  </select>
                </div>

                {/* Programación */}
                <div className="grid grid-cols-2 gap-4">
                  {formData.frecuencia === 'mensual' ? (
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Día del mes
                      </label>
                      <select
                        value={formData.diaDelMes}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          diaDelMes: parseInt(e.target.value) 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                      >
                        {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Día de la semana
                      </label>
                      <select
                        value={formData.diaDeLaSemana}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          diaDeLaSemana: parseInt(e.target.value) 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                      >
                        <option value={1}>Lunes</option>
                        <option value={2}>Martes</option>
                        <option value={3}>Miércoles</option>
                        <option value={4}>Jueves</option>
                        <option value={5}>Viernes</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Hora
                    </label>
                    <input
                      type="time"
                      value={formData.hora}
                      onChange={(e) => setFormData(prev => ({ ...prev, hora: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Email para notificaciones
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    placeholder="tu@email.com"
                  />
                </div>

                {/* Opciones adicionales */}
                <div className="space-y-3">
                  <h4 className="font-medium text-black">Contenido del reporte:</h4>
                  
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="incluirResumen"
                      checked={formData.incluirResumen}
                      onChange={(e) => setFormData(prev => ({ ...prev, incluirResumen: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="incluirResumen" className="text-sm text-black">
                      Incluir resumen ejecutivo
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="incluirDetalle"
                      checked={formData.incluirDetalle}
                      onChange={(e) => setFormData(prev => ({ ...prev, incluirDetalle: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="incluirDetalle" className="text-sm text-black">
                      Incluir detalle por estudiante
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="notificarPorEmail"
                      checked={formData.notificarPorEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, notificarPorEmail: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="notificarPorEmail" className="text-sm text-black">
                      Enviar notificación por email
                    </label>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
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
                {loading ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function ReportesDocente() {
  const {
    reporteData,
    loading,
    configuracion,
    filtros,
    clases,
    generarReporte,
    exportarReporte,
    guardarConfiguracion,
    getClasesDisponibles,
    getEstadisticasAvanzadas,
    setFiltros
  } = useReportes()

  const [showConfigModal, setShowConfigModal] = useState(false)
  const [vistaActual, setVistaActual] = useState<'resumen' | 'detalle'>('resumen')
  const [filtrosForm, setFiltrosForm] = useState<FiltrosReporte>({
    tipoReporte: 'semanal'
  })

  const handleGenerarReporte = async () => {
    await generarReporte(filtrosForm)
  }

  const handleExportar = async (formato: 'pdf' | 'excel' | 'word') => {
    if (!reporteData) return
    await exportarReporte(formato, reporteData)
  }

  const handleSaveConfig = async (config: ConfiguracionExportacion) => {
    return await guardarConfiguracion(config)
  }

  const estadisticasAvanzadas = getEstadisticasAvanzadas()

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-black">Reportes de Asistencia</h2>
            <p className="text-black">Genera reportes detallados con exportación automática</p>
          </div>
          <button
            onClick={() => setShowConfigModal(true)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ⚙️ Configurar Automático
          </button>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Tipo de Reporte
            </label>
            <select
              value={filtrosForm.tipoReporte}
              onChange={(e) => setFiltrosForm(prev => ({ 
                ...prev, 
                tipoReporte: e.target.value as 'semanal' | 'mensual' 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="semanal">Semanal</option>
              <option value="mensual">Mensual</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={filtrosForm.fechaInicio || ''}
              onChange={(e) => setFiltrosForm(prev => ({ ...prev, fechaInicio: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Fecha Fin
            </label>
            <input
              type="date"
              value={filtrosForm.fechaFin || ''}
              onChange={(e) => setFiltrosForm(prev => ({ ...prev, fechaFin: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Clase
            </label>
            <select
              value={filtrosForm.claseId || ''}
              onChange={(e) => setFiltrosForm(prev => ({ ...prev, claseId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="">Todas las clases</option>
              {getClasesDisponibles().map(clase => (
                <option key={clase.id} value={clase.id}>
                  {clase.materia} - {clase.grado}° {clase.seccion}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <button
            onClick={handleGenerarReporte}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Generando...' : '📊 Generar Reporte'}
          </button>

          {reporteData && (
            <div className="flex space-x-2">
              <button
                onClick={() => handleExportar('pdf')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                📄 PDF
              </button>
              <button
                onClick={() => handleExportar('excel')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                📊 Excel
              </button>
              <button
                onClick={() => handleExportar('word')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                📝 Word
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-black">Generando reporte...</span>
        </div>
      )}

      {/* Contenido del reporte */}
      {reporteData && !loading && (
        <div className="p-6">
          {/* Toggle de vista */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6 w-fit">
            <button
              onClick={() => setVistaActual('resumen')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                vistaActual === 'resumen' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Resumen
            </button>
            <button
              onClick={() => setVistaActual('detalle')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                vistaActual === 'detalle' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 Detalle
            </button>
          </div>

          {/* Vista Resumen */}
          {vistaActual === 'resumen' && (
            <div className="space-y-6">
              {/* Estadísticas principales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {reporteData.resumenEjecutivo.totalEstudiantes}
                  </div>
                  <div className="text-sm text-black">Estudiantes</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {reporteData.resumenEjecutivo.porcentajes.asistencia}%
                  </div>
                  <div className="text-sm text-black">Asistencia</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {reporteData.resumenEjecutivo.estadisticasAsistencia.tardanza}
                  </div>
                  <div className="text-sm text-black">Tardanzas</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {reporteData.resumenEjecutivo.totalRetiros}
                  </div>
                  <div className="text-sm text-black">Retiros</div>
                </div>
              </div>

              {/* Estadísticas avanzadas */}
              {estadisticasAvanzadas && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-black mb-2">🏆 Mejor Asistencia</h4>
                    <p className="text-sm text-black">
                      <strong>{estadisticasAvanzadas.mejorAsistencia.estudiante}</strong>
                    </p>
                    <p className="text-lg font-bold text-green-600">
                      {estadisticasAvanzadas.mejorAsistencia.porcentaje}%
                    </p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-black mb-2">⏰ Más Tardanzas</h4>
                    <p className="text-sm text-black">
                      <strong>{estadisticasAvanzadas.masTardanzas.estudiante}</strong>
                    </p>
                    <p className="text-lg font-bold text-yellow-600">
                      {estadisticasAvanzadas.masTardanzas.cantidad} tardanzas
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Vista Detalle */}
          {vistaActual === 'detalle' && (
            <div className="space-y-4">
              {reporteData.estudiantes.map((estudiante) => (
                <div
                  key={estudiante.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-black">
                        {estudiante.apellido}, {estudiante.nombre}
                      </h4>
                      <p className="text-sm text-gray-600">
                        DNI: {estudiante.dni} | {estudiante.grado}° {estudiante.seccion}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">
                        {estudiante.estadisticas.totalAsistencias > 0 ? 
                          ((estudiante.estadisticas.presente + estudiante.estadisticas.tardanza) / estudiante.estadisticas.totalAsistencias * 100).toFixed(1) : '0'}%
                      </div>
                      <div className="text-xs text-gray-500">Asistencia</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-green-600">{estudiante.estadisticas.presente}</div>
                      <div className="text-gray-600">Presente</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-yellow-600">{estudiante.estadisticas.tardanza}</div>
                      <div className="text-gray-600">Tardanzas</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-red-600">{estudiante.estadisticas.inasistencia}</div>
                      <div className="text-gray-600">Faltas</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-blue-600">{estudiante.estadisticas.justificada}</div>
                      <div className="text-gray-600">Justificadas</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-purple-600">{estudiante.estadisticas.totalRetiros}</div>
                      <div className="text-gray-600">Retiros</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de configuración */}
      <ConfiguracionModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        configuracion={configuracion}
        onSave={handleSaveConfig}
      />
    </div>
  )
}
