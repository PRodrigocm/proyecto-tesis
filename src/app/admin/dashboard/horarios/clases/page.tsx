'use client'

import React, { useState, useEffect } from 'react'
import { useHorariosSemanales } from '@/hooks/useHorariosSemanales'
import { useExcepcionesHorario } from '@/hooks/useExcepcionesHorario'
import { useExcepciones } from '@/hooks/useExcepciones'
import CreateHorarioClasesModal from '@/components/admin/CreateHorarioClasesModal'
import EditHorarioClasesModal from '@/components/admin/EditHorarioClasesModal'

export default function HorarioClasesPage() {
  const [activeTab, setActiveTab] = useState<'horarios' | 'excepciones'>('horarios')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [gradosSecciones, setGradosSecciones] = useState<any[]>([])
  const [loadingGradosSecciones, setLoadingGradosSecciones] = useState(false)
  const [filtroGrado, setFiltroGrado] = useState('')
  const [filtroSeccion, setFiltroSeccion] = useState('')
  const { 
    horarios, 
    loading: loadingHorarios, 
    getHorariosPorDia,
    diasSemana,
    stats: statsHorarios,
    loadHorarios
  } = useHorariosSemanales()
  
  const { 
    excepciones, 
    loading: loadingExcepciones,
    stats: statsExcepciones 
  } = useExcepcionesHorario()

  // Hook para excepciones reales
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {}
  const ieId = user.idIe || user.institucionId || user.ieId || 1
  const { 
    excepciones: excepcionesReales, 
    loading: loadingExcepcionesReales 
  } = useExcepciones(ieId)

  // Cargar grados y secciones desde BD
  const loadGradosSecciones = async () => {
    setLoadingGradosSecciones(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/grados-secciones', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setGradosSecciones(data.data || [])
      }
    } catch (error) {
      console.error('Error loading grados y secciones:', error)
    } finally {
      setLoadingGradosSecciones(false)
    }
  }

  // Cargar grados y secciones al montar el componente
  useEffect(() => {
    loadGradosSecciones()
  }, [])

  // Tipos de excepción para filtros
  const tiposExcepcion = [
    { value: 'FERIADO', label: '🎉 Feriado', description: 'Días festivos nacionales o locales' },
    { value: 'SUSPENSION_CLASES', label: '⚠️ Suspensión de Clases', description: 'Emergencias, clima, etc.' },
    { value: 'VACACIONES', label: '🏖️ Vacaciones', description: 'Períodos vacacionales' },
    { value: 'HORARIO_ESPECIAL', label: '⏰ Horario Especial', description: 'Ceremonias, eventos especiales' },
    { value: 'CAPACITACION', label: '📚 Capacitación', description: 'Formación docente' },
    { value: 'DIA_NO_LABORABLE', label: '📅 Día No Laborable', description: 'Días especiales sin clases' },
    { value: 'OTRO', label: '📝 Otro', description: 'Otras excepciones' }
  ]

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


  const handleEditHorario = async (data: any) => {
    try {
      console.log('✏️ === EDITANDO HORARIO ===')
      console.log('📋 Datos recibidos:', data)
      
      // La funcionalidad de edición ya está implementada en el modal EditHorarioClasesModal
      // que usa la API PUT /api/horarios/clases
      
      // Recargar horarios después de guardar
      console.log('🔄 Recargando horarios...')
      await loadHorarios()
      console.log('✅ Horarios recargados exitosamente')
      
      return true
    } catch (error) {
      console.error('💥 Error editing horario:', error)
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
            <button 
              onClick={() => setShowEditModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              ✏️ Editar Horarios
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
                  <select 
                    value={filtroGrado}
                    onChange={(e) => setFiltroGrado(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm text-black"
                    disabled={loadingGradosSecciones}
                  >
                    <option value="">Todos los grados</option>
                    {[...new Set(gradosSecciones.map(gs => gs.grado.nombre))].map((grado) => (
                      <option key={grado} value={grado}>
                        {grado}° Grado
                      </option>
                    ))}
                  </select>
                  <select 
                    value={filtroSeccion}
                    onChange={(e) => setFiltroSeccion(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm text-black"
                    disabled={loadingGradosSecciones}
                  >
                    <option value="">Todas las secciones</option>
                    {[...new Set(gradosSecciones.map(gs => gs.seccion.nombre))].map((seccion) => (
                      <option key={seccion} value={seccion}>
                        Sección {seccion}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {loadingHorarios ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
                  {diasSemana.map((dia) => (
                    <div key={dia.value} className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3 text-center">
                        {dia.label}
                      </h4>
                      <div className="space-y-2">
                        {getHorariosPorDia(dia.value)
                          .filter(detalle => {
                            if (detalle.tipoActividad !== 'CLASE_REGULAR') return false
                            if (filtroGrado && detalle.grado !== filtroGrado) return false
                            if (filtroSeccion && detalle.seccion !== filtroSeccion) return false
                            return true
                          })
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
                          .filter(detalle => {
                            if (detalle.tipoActividad !== 'CLASE_REGULAR') return false
                            if (filtroGrado && detalle.grado !== filtroGrado) return false
                            if (filtroSeccion && detalle.seccion !== filtroSeccion) return false
                            return true
                          }).length === 0 && (
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
                  <select className="border border-gray-300 rounded-md px-3 py-2 text-sm text-black">
                    <option value="">Todos los tipos</option>
                    {tiposExcepcion.map(tipo => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm text-black"
                    placeholder="Fecha"
                  />
                </div>
              </div>

              {loadingExcepcionesReales ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : excepcionesReales.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-4">
                    <span className="text-4xl">📅</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay excepciones registradas
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Agrega feriados, vacaciones o suspensiones de clases
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {excepcionesReales
                    .filter(exc => exc.tipoHorario === 'CLASE' || exc.tipoHorario === 'AMBOS')
                    .map((excepcion) => {
                      const tipoInfo = tiposExcepcion.find(t => t.value === excepcion.tipoExcepcion)
                      const esVacaciones = excepcion.tipoExcepcion === 'VACACIONES'
                      
                      return (
                        <div key={excepcion.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg ${
                                excepcion.tipoExcepcion === 'SUSPENSION_CLASES' ? 'bg-red-100' :
                                excepcion.tipoExcepcion === 'FERIADO' ? 'bg-green-100' :
                                excepcion.tipoExcepcion === 'VACACIONES' ? 'bg-blue-100' :
                                excepcion.tipoExcepcion === 'HORARIO_ESPECIAL' ? 'bg-purple-100' :
                                'bg-yellow-100'
                              }`}>
                                <span className="text-lg">
                                  {excepcion.tipoExcepcion === 'SUSPENSION_CLASES' ? '🚫' :
                                   excepcion.tipoExcepcion === 'FERIADO' ? '🎉' :
                                   excepcion.tipoExcepcion === 'VACACIONES' ? '🏖️' :
                                   excepcion.tipoExcepcion === 'HORARIO_ESPECIAL' ? '⏰' :
                                   excepcion.tipoExcepcion === 'CAPACITACION' ? '📚' :
                                   excepcion.tipoExcepcion === 'DIA_NO_LABORABLE' ? '📅' : '📝'}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {excepcion.motivo || 'Sin motivo especificado'}
                                </h4>
                                
                                {/* Mostrar fecha o período según el tipo */}
                                {esVacaciones && excepcion.fechaFin ? (
                                  <div className="text-sm text-gray-600">
                                    <span className="font-medium">Período:</span> {' '}
                                    {new Date(excepcion.fecha).toLocaleDateString('es-ES', {
                                      day: 'numeric',
                                      month: 'short'
                                    })} - {new Date(excepcion.fechaFin).toLocaleDateString('es-ES', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric'
                                    })}
                                    <span className="ml-2 text-blue-600">
                                      ({Math.ceil((new Date(excepcion.fechaFin).getTime() - new Date(excepcion.fecha).getTime()) / (1000 * 60 * 60 * 24)) + 1} días)
                                    </span>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-600">
                                    {new Date(excepcion.fecha).toLocaleDateString('es-ES', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </p>
                                )}
                                
                                {excepcion.descripcion && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    {excepcion.descripcion}
                                  </p>
                                )}
                                
                                {/* Mostrar tipo de excepción */}
                                <div className="flex items-center mt-2 space-x-2">
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    excepcion.tipoExcepcion === 'SUSPENSION_CLASES' ? 'bg-red-100 text-red-800' :
                                    excepcion.tipoExcepcion === 'FERIADO' ? 'bg-green-100 text-green-800' :
                                    excepcion.tipoExcepcion === 'VACACIONES' ? 'bg-blue-100 text-blue-800' :
                                    excepcion.tipoExcepcion === 'HORARIO_ESPECIAL' ? 'bg-purple-100 text-purple-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {tipoInfo?.label || excepcion.tipoExcepcion}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                excepcion.tipoHorario === 'CLASE' ? 'bg-blue-100 text-blue-800' :
                                excepcion.tipoHorario === 'AMBOS' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                Clases
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  
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

      {/* Modales */}
      <CreateHorarioClasesModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateHorario}
      />


      <EditHorarioClasesModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleEditHorario}
      />
    </div>
  )
}
