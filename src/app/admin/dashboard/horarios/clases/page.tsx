'use client'

import { useState } from 'react'
import { useHorariosSemanales } from '@/hooks/useHorariosSemanales'
import { useExcepcionesHorario } from '@/hooks/useExcepcionesHorario'
import CreateHorarioClasesModal from '@/components/admin/CreateHorarioClasesModal'

export default function HorarioClasesPage() {
  const [activeTab, setActiveTab] = useState<'horarios' | 'excepciones'>('horarios')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { 
    horarios, 
    loading: loadingHorarios, 
    getHorariosPorDia,
    diasSemana,
    stats: statsHorarios 
  } = useHorariosSemanales()
  
  const { 
    excepciones, 
    loading: loadingExcepciones, 
    tiposExcepcion,
    stats: statsExcepciones 
  } = useExcepcionesHorario()

  const tabs = [
    {
      id: 'horarios',
      name: 'Horarios de Clases',
      icon: '📚',
      description: 'Gestiona los horarios regulares de clases por grado y sección'
    },
    {
      id: 'excepciones',
      name: 'Excepciones y Suspensiones',
      icon: '⚠️',
      description: 'Administra excepciones, suspensiones y cambios de horario'
    }
  ]

  const handleCreateHorario = async (data: any) => {
    try {
      console.log('🎯 === CREANDO HORARIO DE CLASES ===')
      console.log('📋 Datos recibidos:', data)
      
      // Verificar token
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('❌ No hay token de autenticación')
        alert('No hay sesión activa. Por favor, inicia sesión.')
        return false
      }
      
      console.log('🔑 Token encontrado, enviando a API...')
      
      // Llamar a la API real de horarios base
      const response = await fetch('/api/horarios/base', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })
      
      console.log('📡 Response status:', response.status, response.statusText)
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Horario creado exitosamente:', result)
        
        if (result.data?.horariosCreados > 0) {
          alert(`✅ ${result.data.horariosCreados} horarios creados para ${result.data.gradoSeccion}`)
        } else {
          alert(`⚠️ Los horarios para ${result.data?.gradoSeccion} ya existían`)
        }
        
        return true
      } else {
        const error = await response.json()
        console.error('❌ Error de la API:', error)
        alert(`❌ Error: ${error.error}`)
        return false
      }
    } catch (error) {
      console.error('💥 Error creating horario:', error)
      alert(`💥 Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      return false
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              📚 Horario de Clases
            </h1>
            <p className="text-gray-600 mt-1">
              Administra horarios de clases regulares, excepciones y suspensiones
            </p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              + Nuevo Horario
            </button>
            <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors">
              + Nueva Excepción
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">📅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Horarios Activos</p>
              <p className="text-2xl font-semibold text-gray-900">{statsHorarios.activos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">📚</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Clases Regulares</p>
              <p className="text-2xl font-semibold text-gray-900">
                {horarios.reduce((acc, h) => acc + h.detalles.filter(d => d.tipoActividad === 'CLASE_REGULAR').length, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Excepciones Activas</p>
              <p className="text-2xl font-semibold text-gray-900">
                {excepciones.filter(e => e.tipoHorario === 'CLASE' || e.tipoHorario === 'AMBOS').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <span className="text-2xl">🚫</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Suspensiones</p>
              <p className="text-2xl font-semibold text-gray-900">{statsExcepciones.suspensiones}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'horarios' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Horarios de Clases por Día
                </h3>
                <div className="flex space-x-2">
                  <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                    <option value="">Todos los grados</option>
                    <option value="1">1er Grado</option>
                    <option value="2">2do Grado</option>
                    <option value="3">3er Grado</option>
                  </select>
                  <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                    <option value="">Todas las secciones</option>
                    <option value="A">Sección A</option>
                    <option value="B">Sección B</option>
                  </select>
                </div>
              </div>

              {loadingHorarios ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
                  {diasSemana.slice(0, 5).map((dia) => (
                    <div key={dia.value} className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3 text-center">
                        {dia.label}
                      </h4>
                      <div className="space-y-2">
                        {getHorariosPorDia(dia.value)
                          .filter(detalle => detalle.tipoActividad === 'CLASE_REGULAR')
                          .map((detalle, index) => (
                          <div key={index} className="bg-white p-3 rounded border-l-4 border-blue-500">
                            <div className="text-sm font-medium text-gray-900">
                              {detalle.horaInicio} - {detalle.horaFin}
                            </div>
                            <div className="text-sm text-gray-600">
                              {detalle.grado}° {detalle.seccion}
                            </div>
                            {detalle.materia && (
                              <div className="text-xs text-gray-500">
                                {detalle.materia}
                              </div>
                            )}
                          </div>
                        ))}
                        {getHorariosPorDia(dia.value)
                          .filter(detalle => detalle.tipoActividad === 'CLASE_REGULAR').length === 0 && (
                          <div className="text-center text-gray-500 text-sm py-4">
                            Sin clases
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'excepciones' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Excepciones y Suspensiones de Clases
                </h3>
                <div className="flex space-x-2">
                  <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                    <option value="">Todos los tipos</option>
                    {tiposExcepcion.map(tipo => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="Fecha"
                  />
                </div>
              </div>

              {loadingExcepciones ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {excepciones
                    .filter(exc => exc.tipoHorario === 'CLASE' || exc.tipoHorario === 'AMBOS')
                    .map((excepcion) => (
                    <div key={excepcion.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${
                            excepcion.tipoExcepcion === 'SUSPENSION_CLASES' ? 'bg-red-100' :
                            excepcion.tipoExcepcion === 'FERIADO' ? 'bg-green-100' :
                            'bg-yellow-100'
                          }`}>
                            <span className="text-lg">
                              {excepcion.tipoExcepcion === 'SUSPENSION_CLASES' ? '🚫' :
                               excepcion.tipoExcepcion === 'FERIADO' ? '🎉' : '⚠️'}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {excepcion.motivo || 'Sin motivo especificado'}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {new Date(excepcion.fecha).toLocaleDateString('es-ES', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                            {excepcion.descripcion && (
                              <p className="text-sm text-gray-500 mt-1">
                                {excepcion.descripcion}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            excepcion.tipoHorario === 'CLASE' ? 'bg-blue-100 text-blue-800' :
                            excepcion.tipoHorario === 'AMBOS' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {excepcion.tipoHorario === 'CLASE' ? 'Solo Clases' :
                             excepcion.tipoHorario === 'AMBOS' ? 'Clases y Talleres' : excepcion.tipoHorario}
                          </span>
                          <button className="text-indigo-600 hover:text-indigo-900 text-sm">
                            Editar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {excepciones.filter(exc => exc.tipoHorario === 'CLASE' || exc.tipoHorario === 'AMBOS').length === 0 && (
                    <div className="text-center py-8">
                      <span className="text-4xl mb-4 block">📅</span>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No hay excepciones registradas
                      </h3>
                      <p className="text-gray-600">
                        Las excepciones y suspensiones de clases aparecerán aquí
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal para crear horario */}
      <CreateHorarioClasesModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateHorario}
      />
    </div>
  )
}
