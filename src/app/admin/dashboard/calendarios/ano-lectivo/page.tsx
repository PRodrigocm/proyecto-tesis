'use client'

import { useState, useEffect } from 'react'
import CalendarioAnual from '@/components/admin/CalendarioAnual'
import RegistrarEventoModal from '@/components/admin/RegistrarEventoModal'
import { useAnoLectivo } from '@/hooks/useAnoLectivo'

export default function AnoLectivoPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  
  const {
    calendarioEscolar,
    excepciones,
    loading,
    loadCalendarioEscolar,
    registrarEvento,
    eliminarEvento,
    stats
  } = useAnoLectivo(currentYear)

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setIsModalOpen(true)
  }

  const handleRegistrarEvento = async (eventoData: any) => {
    await registrarEvento(eventoData)
    setIsModalOpen(false)
    setSelectedDate(null)
  }

  // Asegurar que siempre inicie en el año actual
  useEffect(() => {
    const actualYear = new Date().getFullYear()
    if (currentYear !== actualYear) {
      console.log(`🔄 Ajustando al año actual: ${actualYear}`)
      setCurrentYear(actualYear)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Año Lectivo {currentYear}
            {currentYear === new Date().getFullYear() && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Actual
              </span>
            )}
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Gestiona el calendario escolar anual, días lectivos, feriados y suspensiones de clases
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <select
            value={currentYear}
            onChange={(e) => setCurrentYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
          >
            {Array.from({ length: 5 }, (_, i) => {
              const currentYearActual = new Date().getFullYear()
              const year = currentYearActual - 2 + i
              return (
                <option key={year} value={year}>
                  {year === currentYearActual ? `${year} (Actual)` : year}
                </option>
              )
            })}
          </select>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Registrar Evento
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Días Lectivos</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.diasLectivos}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Feriados</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.feriados}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Suspensiones</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.suspensiones}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Días</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalDias}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendario Anual */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Calendario Escolar {currentYear}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Haz clic en cualquier día para registrar un evento, feriado o suspensión de clases
          </p>
        </div>
        <div className="p-6">
          <CalendarioAnual
            year={currentYear}
            calendarioEscolar={calendarioEscolar}
            excepciones={excepciones}
            onDateClick={handleDateClick}
          />
        </div>
      </div>

      {/* Leyenda */}
      <div className="bg-white shadow rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Leyenda</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-200 border border-green-400 rounded"></div>
            <span className="text-sm text-gray-700">Día Lectivo</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-200 border border-red-400 rounded"></div>
            <span className="text-sm text-gray-700">Feriado</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-200 border border-yellow-400 rounded"></div>
            <span className="text-sm text-gray-700">Suspensión</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-200 border border-gray-400 rounded"></div>
            <span className="text-sm text-gray-700">Fin de Semana</span>
          </div>
        </div>
      </div>

      {/* Modal para registrar eventos */}
      <RegistrarEventoModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedDate(null)
        }}
        onSubmit={handleRegistrarEvento}
        selectedDate={selectedDate}
      />
    </div>
  )
}
