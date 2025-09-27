'use client'

import { useState } from 'react'
import { useHorariosSemanales } from '@/hooks/useHorariosSemanales'
import { useExcepcionesHorario } from '@/hooks/useExcepcionesHorario'
import CreateHorarioGeneralModal from '@/components/admin/CreateHorarioGeneralModal'

export default function HorarioGeneralPage() {
  const [activeTab, setActiveTab] = useState<'vista' | 'excepciones' | 'retiros'>('vista')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { 
    horarios, 
    loading: loadingHorarios, 
    getHorariosPorDia,
    getHorariosFinDeSemana,
    diasSemana,
    stats: statsHorarios 
  } = useHorariosSemanales()
  
  const { 
    excepciones, 
    loading: loadingExcepciones, 
    tiposExcepcion,
    stats: statsExcepciones 
  } = useExcepcionesHorario()

  // Datos simulados de retiros para mostrar la funcionalidad
  const retiros = [
    {
      id: '1',
      estudiante: 'Ana García Pérez',
      grado: '3°',
      seccion: 'A',
      apoderado: 'María Pérez',
      motivo: 'Cita médica',
      fecha: '2024-09-26',
      horaRetiro: '10:30',
      estado: 'APROBADO',
      observaciones: 'Cita con pediatra'
    }
  ]

  const tabs = [
    {
      id: 'vista',
      name: 'Vista General',
      icon: '📊',
      description: 'Vista consolidada de horarios de clases y talleres'
    },
    {
      id: 'excepciones',
      name: 'Excepciones Globales',
      icon: '⚠️',
      description: 'Suspensiones que afectan tanto clases como talleres'
    },
    {
      id: 'retiros',
      name: 'Gestión de Retiros',
      icon: '🚪',
      description: 'Administra retiros de estudiantes durante el horario escolar'
    }
  ]

  const handleCreateHorario = async (data: any) => {
    try {
      console.log('Creando horario general:', data)
      // Aquí implementarías la lógica para crear el horario general
      return true
    } catch (error) {
      console.error('Error creating horario general:', error)
      return false
    }
  }

  if (loadingHorarios) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              📅 Horario General
            </h1>
            <p className="text-gray-600 mt-1">
              Administra horarios completos, suspensiones globales y gestión de retiros
            </p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              + Nuevo Horario
            </button>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
              + Nuevo Retiro
            </button>
            <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
              + Suspensión Global
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">📚</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Clases Activas</p>
              <p className="text-2xl font-semibold text-gray-900">
                {horarios.reduce((acc, h) => acc + h.detalles.filter(d => d.tipoActividad === 'CLASE_REGULAR').length, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-2xl">🎨</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Talleres Activos</p>
              <p className="text-2xl font-semibold text-gray-900">
                {horarios.reduce((acc, h) => acc + h.detalles.filter(d => d.tipoActividad === 'TALLER_EXTRA').length, 0)}
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
              <p className="text-sm font-medium text-gray-600">Excepciones Globales</p>
              <p className="text-2xl font-semibold text-gray-900">
                {excepciones.filter(e => e.tipoHorario === 'AMBOS').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">🚪</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Retiros Hoy</p>
              <p className="text-2xl font-semibold text-gray-900">
                {retiros.filter(r => r.fecha === new Date().toISOString().split('T')[0]).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <span className="text-2xl">📅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Fin de Semana</p>
              <p className="text-2xl font-semibold text-gray-900">{statsHorarios.finDeSemana}</p>
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
          {activeTab === 'vista' && (
            <div className="text-center py-8">
              <span className="text-4xl mb-4 block">📊</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Vista General de Horarios
              </h3>
              <p className="text-gray-600">
                Aquí se mostrará la vista consolidada de todos los horarios
              </p>
            </div>
          )}

          {activeTab === 'excepciones' && (
            <div className="space-y-4">
              {excepciones
                .filter(exc => exc.tipoHorario === 'AMBOS')
                .map((excepcion) => (
                <div key={excepcion.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-red-100">
                        <span className="text-lg">🚫</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {excepcion.motivo || 'Sin motivo especificado'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {new Date(excepcion.fecha).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                      GLOBAL
                    </span>
                  </div>
                </div>
              ))}
              
              {excepciones.filter(exc => exc.tipoHorario === 'AMBOS').length === 0 && (
                <div className="text-center py-8">
                  <span className="text-4xl mb-4 block">📅</span>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay excepciones globales
                  </h3>
                  <p className="text-gray-600">
                    Las suspensiones que afecten tanto clases como talleres aparecerán aquí
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'retiros' && (
            <div className="space-y-4">
              {retiros.map((retiro) => (
                <div key={retiro.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <span className="text-lg">🚪</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {retiro.estudiante}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {retiro.grado} {retiro.seccion} • {retiro.motivo}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      {retiro.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal para crear horario general */}
      <CreateHorarioGeneralModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateHorario}
      />
    </div>
  )
}
