'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useHorariosSemanales } from '@/hooks/useHorariosSemanales'
import { useExcepcionesHorario } from '@/hooks/useExcepcionesHorario'
import { useExcepciones } from '@/hooks/useExcepciones'
import CreateHorarioClasesModal from '@/components/admin/CreateHorarioClasesModal'
import EditHorarioClasesModal from '@/components/admin/EditHorarioClasesModal'
import {
  ClockIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  PencilSquareIcon,
  ArrowPathIcon,
  ChartBarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

export default function HorarioClasesPage() {
  const [activeTab, setActiveTab] = useState<'horarios' | 'excepciones'>('horarios')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [gradosSecciones, setGradosSecciones] = useState<any[]>([])
  const [loadingGradosSecciones, setLoadingGradosSecciones] = useState(false)
  const [filtroGrado, setFiltroGrado] = useState('')
  const [filtroSeccion, setFiltroSeccion] = useState('')
  const [vistaCompacta, setVistaCompacta] = useState(false)
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

  const handleDeleteAllHorarios = async () => {
    const confirmacion = window.confirm(
      '⚠️ ¿Estás seguro de que deseas eliminar TODOS los horarios de clases?\n\n' +
      'Esta acción eliminará todos los horarios de todos los grados y secciones.\n\n' +
      'Esta acción NO se puede deshacer.'
    )
    
    if (!confirmacion) return
    
    // Segunda confirmación para mayor seguridad
    const confirmacionFinal = window.confirm(
      '🚨 CONFIRMACIÓN FINAL\n\n' +
      '¿Realmente deseas eliminar TODOS los horarios?\n\n' +
      'Escribe "ELIMINAR" mentalmente y confirma.'
    )
    
    if (!confirmacionFinal) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/horarios/clases', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ deleteAll: true })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        alert(`✅ ${data.message || 'Todos los horarios han sido eliminados exitosamente'}`)
        await loadHorarios()
      } else {
        alert(`❌ Error: ${data.error || 'No se pudieron eliminar los horarios'}`)
      }
    } catch (error) {
      console.error('💥 Error eliminando horarios:', error)
      alert('❌ Error al conectar con el servidor')
    }
  }


  return (
    <div className="space-y-6">
      {/* Header Mejorado */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <CalendarDaysIcon className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Horarios de Clases</h1>
                <p className="text-indigo-100 mt-1">
                  Gestiona horarios, excepciones y suspensiones académicas
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => loadHorarios()}
              className="inline-flex items-center px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Actualizar
            </button>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-medium"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Nuevo Horario
            </button>
            <button 
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              <PencilSquareIcon className="h-4 w-4 mr-2" />
              Editar Horarios
            </button>
            <button 
              onClick={handleDeleteAllHorarios}
              className="inline-flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Eliminar Todos
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards Mejoradas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Horarios Activos</p>
              <p className="text-2xl font-bold text-gray-900">{statsHorarios.activos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
              <AcademicCapIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Clases Regulares</p>
              <p className="text-2xl font-bold text-gray-900">
                {horarios.reduce((acc, h) => acc + h.detalles.filter(d => d.tipoActividad === 'CLASE_REGULAR').length, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
              <ExclamationTriangleIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Excepciones</p>
              <p className="text-2xl font-bold text-gray-900">
                {excepciones.filter(e => e.tipoHorario === 'CLASE' || e.tipoHorario === 'AMBOS').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Suspensiones</p>
              <p className="text-2xl font-bold text-gray-900">{statsExcepciones.suspensiones}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Mejorados */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-1 px-4 pt-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-4 font-medium text-sm rounded-t-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
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
              {/* Filtros mejorados */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Horarios de Clases por Día
                  </h3>
                  <p className="text-sm text-gray-500">Vista semanal de todas las clases programadas</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <select 
                    value={filtroGrado}
                    onChange={(e) => setFiltroGrado(e.target.value)}
                    className="border-2 border-gray-200 rounded-lg px-4 py-2 text-sm text-black focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
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
                    className="border-2 border-gray-200 rounded-lg px-4 py-2 text-sm text-black focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    disabled={loadingGradosSecciones}
                  >
                    <option value="">Todas las secciones</option>
                    {[...new Set(gradosSecciones.map(gs => gs.seccion.nombre))].map((seccion) => (
                      <option key={seccion} value={seccion}>
                        Sección {seccion}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setVistaCompacta(!vistaCompacta)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      vistaCompacta 
                        ? 'bg-indigo-100 text-indigo-700' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {vistaCompacta ? '📋 Compacta' : '📊 Expandida'}
                  </button>
                </div>
              </div>

              {loadingHorarios ? (
                <div className="flex justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                    <span className="text-sm text-gray-500">Cargando horarios...</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
                  {diasSemana.map((dia, diaIndex) => {
                    const clasesDelDia = getHorariosPorDia(dia.value)
                      .filter(detalle => {
                        if (detalle.tipoActividad !== 'CLASE_REGULAR') return false
                        if (filtroGrado && detalle.grado !== filtroGrado) return false
                        if (filtroSeccion && detalle.seccion !== filtroSeccion) return false
                        return true
                      })
                    
                    const colores = [
                      'border-blue-500 bg-blue-50',
                      'border-green-500 bg-green-50',
                      'border-purple-500 bg-purple-50',
                      'border-orange-500 bg-orange-50',
                      'border-pink-500 bg-pink-50',
                      'border-cyan-500 bg-cyan-50',
                      'border-indigo-500 bg-indigo-50'
                    ]
                    
                    return (
                      <div key={dia.value} className="bg-gradient-to-b from-gray-50 to-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className={`py-3 px-4 text-center font-semibold text-white ${
                          diaIndex === 0 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                          diaIndex === 1 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                          diaIndex === 2 ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                          diaIndex === 3 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                          diaIndex === 4 ? 'bg-gradient-to-r from-pink-500 to-pink-600' :
                          diaIndex === 5 ? 'bg-gradient-to-r from-cyan-500 to-cyan-600' :
                          'bg-gradient-to-r from-indigo-500 to-indigo-600'
                        }`}>
                          {dia.label}
                          <span className="ml-2 text-xs opacity-80">({clasesDelDia.length})</span>
                        </div>
                        <div className={`p-3 space-y-2 ${vistaCompacta ? 'max-h-48' : 'max-h-96'} overflow-y-auto`}>
                          {clasesDelDia.map((detalle, index) => (
                            <div 
                              key={index} 
                              className={`p-3 rounded-lg border-l-4 ${colores[diaIndex]} hover:shadow-md transition-shadow cursor-pointer`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-700 bg-white px-2 py-0.5 rounded">
                                  {detalle.horaInicio} - {detalle.horaFin}
                                </span>
                              </div>
                              <div className="mt-2">
                                <div className="text-sm font-semibold text-gray-800">
                                  {detalle.grado}° "{detalle.seccion}"
                                </div>
                                {detalle.materia && !vistaCompacta && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    📚 {detalle.materia}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          {clasesDelDia.length === 0 && (
                            <div className="text-center py-8">
                              <div className="text-3xl mb-2">📅</div>
                              <p className="text-gray-400 text-sm">Sin clases</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
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
