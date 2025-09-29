'use client'

import { useState } from 'react'
import { useHorariosSemanales } from '@/hooks/useHorariosSemanales'
import { useExcepcionesHorario } from '@/hooks/useExcepcionesHorario'
import CreateHorarioGeneralModal from '@/components/admin/CreateHorarioGeneralModal'
import CreateExcepcionModal from '@/components/admin/CreateExcepcionModal'

export default function HorarioGeneralPage() {
  const [activeTab, setActiveTab] = useState<'vista' | 'excepciones'>('vista')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCreateExcepcionModal, setShowCreateExcepcionModal] = useState(false)
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

  const handleCreateExcepcion = async (data: any) => {
    try {
      console.log('🚫 === CREANDO EXCEPCIÓN ===')
      console.log('📋 Datos recibidos:', data)
      
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('❌ No hay token de autenticación')
        alert('No hay sesión activa. Por favor, inicia sesión.')
        return false
      }
      
      // Agregar ieId del usuario
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const ieId = user.idIe || user.institucionId || user.ieId || 1
      
      // Crear una sola excepción (con período para vacaciones)
      const response = await fetch('/api/excepciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...data,
          ieId: ieId
        })
      })
      
      console.log('📡 Response status:', response.status, response.statusText)
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Excepción creada exitosamente:', result)
        
        if (data.tipoExcepcion === 'VACACIONES' && data.fechaInicio && data.fechaFin) {
          const fechaInicio = new Date(data.fechaInicio)
          const fechaFin = new Date(data.fechaFin)
          const duracionDias = Math.ceil((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24)) + 1
          alert(`✅ Período de vacaciones creado: ${duracionDias} días (${data.fechaInicio} al ${data.fechaFin})`)
        } else {
          alert(`✅ ${result.message}`)
        }
        
        return true
      } else {
        const error = await response.json()
        console.error('❌ Error de la API:', error)
        alert(`❌ Error: ${error.error}`)
        return false
      }
    } catch (error) {
      console.error('💥 Error creating excepción:', error)
      alert(`💥 Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`)
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
              Administra horarios completos y suspensiones globales
            </p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              + Nuevo Horario
            </button>
            <button 
              onClick={() => setShowCreateExcepcionModal(true)}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              + Nueva Excepción
            </button>
            <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
              + Suspensión Global
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

        </div>
      </div>

      {/* Modal para crear horario general */}
      <CreateHorarioGeneralModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateHorario}
      />

      {/* Modal para crear excepción */}
      <CreateExcepcionModal
        isOpen={showCreateExcepcionModal}
        onClose={() => setShowCreateExcepcionModal(false)}
        onSave={handleCreateExcepcion}
      />
    </div>
  )
}
