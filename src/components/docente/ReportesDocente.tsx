'use client'

import { useState } from 'react'
import { useReportes, type FiltrosReporte } from '@/hooks/useReportes'

// Función para obtener las fechas del rango
const obtenerFechasDelRango = (fechaInicio: string, fechaFin: string): Date[] => {
  const fechas: Date[] = []
  const inicio = new Date(fechaInicio)
  const fin = new Date(fechaFin)
  
  for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
    fechas.push(new Date(d))
  }
  return fechas
}

// Función para formatear fecha corta (LUN01, MAR02, etc.)
const formatearFechaCorta = (fecha: Date): string => {
  const dias = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB']
  const dia = dias[fecha.getDay()]
  const numero = fecha.getDate().toString().padStart(2, '0')
  return `${dia}${numero}`
}

export default function ReportesDocente() {
  const {
    reporteData,
    loading,
    generarReporte,
    exportarReporte,
    getClasesDisponibles,
    getEstadisticasAvanzadas
  } = useReportes()

  const [vistaActual, setVistaActual] = useState<'resumen' | 'detalle'>('resumen')
  const [filtrosForm, setFiltrosForm] = useState<FiltrosReporte>({
    tipoReporte: 'mensual'
  })

  const handleGenerarReporte = async () => {
    await generarReporte(filtrosForm)
  }

  const handleExportar = async (formato: 'pdf' | 'excel' | 'word') => {
    if (!reporteData) return
    await exportarReporte(formato, reporteData)
  }

  // Exportar en todos los formatos
  const handleExportarTodos = async () => {
    if (!reporteData) return
    await Promise.all([
      exportarReporte('pdf', reporteData),
      exportarReporte('excel', reporteData),
      exportarReporte('word', reporteData)
    ])
  }

  const estadisticasAvanzadas = getEstadisticasAvanzadas()

  // Generar fechas para la tabla de detalle
  const generarFechasTabla = () => {
    if (!filtrosForm.fechaInicio || !filtrosForm.fechaFin) {
      // Si no hay fechas, usar el mes actual
      const hoy = new Date()
      const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
      return obtenerFechasDelRango(
        primerDia.toISOString().split('T')[0],
        ultimoDia.toISOString().split('T')[0]
      )
    }
    return obtenerFechasDelRango(filtrosForm.fechaInicio, filtrosForm.fechaFin)
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-black">Reportes de Asistencia</h2>
            <p className="text-gray-600 text-sm">Genera reportes mensuales en formato Excel, PDF y Word</p>
          </div>
          {/* Info de envío automático */}
          <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-2">
            <p className="text-xs text-teal-700 font-medium">📧 Envío automático mensual</p>
            <p className="text-xs text-teal-600">PDF, Excel y Word</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              📅 Tipo de Reporte
            </label>
            <select
              value={filtrosForm.tipoReporte}
              onChange={(e) => setFiltrosForm(prev => ({ 
                ...prev, 
                tipoReporte: e.target.value as 'semanal' | 'mensual' 
              }))}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white transition-all"
            >
              <option value="semanal">Semanal</option>
              <option value="mensual">Mensual</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              📆 Fecha Inicio
            </label>
            <input
              type="date"
              value={filtrosForm.fechaInicio || ''}
              onChange={(e) => setFiltrosForm(prev => ({ ...prev, fechaInicio: e.target.value }))}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              📆 Fecha Fin
            </label>
            <input
              type="date"
              value={filtrosForm.fechaFin || ''}
              onChange={(e) => setFiltrosForm(prev => ({ ...prev, fechaFin: e.target.value }))}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              🏫 Clase
            </label>
            <select
              value={filtrosForm.claseId || ''}
              onChange={(e) => setFiltrosForm(prev => ({ ...prev, claseId: e.target.value }))}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white transition-all"
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

        <div className="flex flex-wrap justify-between items-center mt-4 gap-3">
          <button
            onClick={handleGenerarReporte}
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:from-teal-600 hover:to-cyan-700 disabled:opacity-50 transition-all font-medium shadow-md"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generando...
              </span>
            ) : '📊 Generar Reporte'}
          </button>

          {reporteData && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleExportar('pdf')}
                className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors text-sm font-medium shadow-sm"
              >
                📕 PDF
              </button>
              <button
                onClick={() => handleExportar('excel')}
                className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors text-sm font-medium shadow-sm"
              >
                📊 Excel
              </button>
              <button
                onClick={() => handleExportar('word')}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-sm font-medium shadow-sm"
              >
                📝 Word
              </button>
              <button
                onClick={handleExportarTodos}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all text-sm font-medium shadow-sm"
              >
                📦 Exportar Todos
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mr-3"></div>
          <span className="text-gray-700 font-medium">Generando reporte...</span>
        </div>
      )}

      {/* Contenido del reporte */}
      {reporteData && !loading && (
        <div className="p-6">
          {/* Toggle de vista */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6 w-fit">
            <button
              onClick={() => setVistaActual('resumen')}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                vistaActual === 'resumen' 
                  ? 'bg-white text-teal-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Resumen
            </button>
            <button
              onClick={() => setVistaActual('detalle')}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                vistaActual === 'detalle' 
                  ? 'bg-white text-teal-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 Tabla de Asistencia
            </button>
          </div>

          {/* Vista Resumen */}
          {vistaActual === 'resumen' && (
            <div className="space-y-6">
              {/* Estadísticas principales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {reporteData.resumenEjecutivo.totalEstudiantes}
                  </div>
                  <div className="text-sm text-blue-700 font-medium">Estudiantes</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {reporteData.resumenEjecutivo.porcentajes.asistencia}%
                  </div>
                  <div className="text-sm text-green-700 font-medium">Asistencia</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    {reporteData.resumenEjecutivo.estadisticasAsistencia.tardanza}
                  </div>
                  <div className="text-sm text-yellow-700 font-medium">Tardanzas</div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {reporteData.resumenEjecutivo.totalRetiros}
                  </div>
                  <div className="text-sm text-red-700 font-medium">Retiros</div>
                </div>
              </div>

              {/* Estadísticas avanzadas */}
              {estadisticasAvanzadas && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
                    <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                      <span className="mr-2">🏆</span> Mejor Asistencia
                    </h4>
                    <p className="text-sm text-green-700">
                      <strong>{estadisticasAvanzadas.mejorAsistencia.estudiante}</strong>
                    </p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {estadisticasAvanzadas.mejorAsistencia.porcentaje}%
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-5">
                    <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                      <span className="mr-2">⏰</span> Más Tardanzas
                    </h4>
                    <p className="text-sm text-yellow-700">
                      <strong>{estadisticasAvanzadas.masTardanzas.estudiante}</strong>
                    </p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">
                      {estadisticasAvanzadas.masTardanzas.cantidad} tardanzas
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Vista Detalle - Tabla estilo Excel */}
          {vistaActual === 'detalle' && (
            <div className="space-y-6">
              {/* Agrupar por grado y sección */}
              {(() => {
                // Agrupar estudiantes por grado y sección
                const grupos = reporteData.estudiantes.reduce((acc, est) => {
                  const key = `${est.grado}° ${est.seccion}`
                  if (!acc[key]) acc[key] = []
                  acc[key].push(est)
                  return acc
                }, {} as Record<string, typeof reporteData.estudiantes>)

                const fechas = generarFechasTabla()

                return Object.entries(grupos).map(([gradoSeccion, estudiantes]) => (
                  <div key={gradoSeccion} className="border border-gray-200 rounded-xl overflow-hidden">
                    {/* Header del grupo */}
                    <div className="bg-gradient-to-r from-teal-500 to-cyan-600 px-4 py-3">
                      <h3 className="text-white font-bold">
                        Grado y sección: <span className="text-teal-100">{gradoSeccion}</span>
                      </h3>
                    </div>

                    {/* Tabla de asistencia */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-r border-gray-200 min-w-[200px]">
                              Apellidos y nombre
                            </th>
                            {fechas.map((fecha, idx) => (
                              <th 
                                key={idx} 
                                className="px-2 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 min-w-[60px]"
                              >
                                {formatearFechaCorta(fecha)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {estudiantes.map((estudiante, estIdx) => (
                            <tr key={estudiante.id} className={estIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="sticky left-0 bg-inherit px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200">
                                {estudiante.apellido}, {estudiante.nombre}
                              </td>
                              {fechas.map((fecha, fechaIdx) => {
                                // Buscar si hay asistencia para esta fecha
                                const fechaStr = fecha.toISOString().split('T')[0]
                                const asistencia = estudiante.asistencias?.find(
                                  (a: any) => a.fecha?.split('T')[0] === fechaStr
                                )
                                
                                let contenido = ''
                                let colorClass = 'text-gray-400'
                                
                                if (asistencia) {
                                  switch (asistencia.estado) {
                                    case 'presente':
                                      contenido = 'X'
                                      colorClass = 'text-green-600 font-bold'
                                      break
                                    case 'tardanza':
                                      contenido = 'T'
                                      colorClass = 'text-yellow-600 font-bold'
                                      break
                                    case 'inasistencia':
                                      contenido = 'F'
                                      colorClass = 'text-red-600 font-bold'
                                      break
                                    case 'justificada':
                                      contenido = 'J'
                                      colorClass = 'text-blue-600 font-bold'
                                      break
                                    default:
                                      contenido = '-'
                                  }
                                } else {
                                  contenido = '-'
                                }
                                
                                return (
                                  <td 
                                    key={fechaIdx} 
                                    className={`px-2 py-3 text-center text-sm ${colorClass}`}
                                  >
                                    {contenido}
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Leyenda */}
                    <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                      <div className="flex flex-wrap gap-4 text-xs">
                        <span className="flex items-center gap-1">
                          <span className="w-5 h-5 bg-green-100 text-green-600 rounded flex items-center justify-center font-bold">X</span>
                          Presente
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-5 h-5 bg-yellow-100 text-yellow-600 rounded flex items-center justify-center font-bold">T</span>
                          Tardanza
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-5 h-5 bg-red-100 text-red-600 rounded flex items-center justify-center font-bold">F</span>
                          Falta
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded flex items-center justify-center font-bold">J</span>
                          Justificada
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
