'use client'

import { useState } from 'react'
import { useExcepcionesHorario } from '@/hooks/useExcepcionesHorario'
import CreateHorarioTalleresModal from '@/components/admin/CreateHorarioTalleresModal'

export default function HorarioTalleresPage() {
  const [activeTab, setActiveTab] = useState<'horarios' | 'excepciones'>('horarios')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { 
    excepciones, 
    loading: loadingExcepciones, 
    tiposExcepcion,
    stats: statsExcepciones 
  } = useExcepcionesHorario()

  // Datos simulados de talleres para mostrar la estructura
  const talleres = [
    {
      id: '1',
      nombre: 'Robótica',
      instructor: 'Prof. García',
      horarios: [
        { dia: 'Martes', horaInicio: '14:00', horaFin: '16:00', aula: 'Lab 1' },
        { dia: 'Jueves', horaInicio: '14:00', horaFin: '16:00', aula: 'Lab 1' }
      ],
      participantes: 25,
      activo: true
    },
    {
      id: '2',
      nombre: 'Arte y Pintura',
      instructor: 'Prof. Martínez',
      horarios: [
        { dia: 'Lunes', horaInicio: '15:00', horaFin: '17:00', aula: 'Aula Arte' },
        { dia: 'Miércoles', horaInicio: '15:00', horaFin: '17:00', aula: 'Aula Arte' }
      ],
      participantes: 20,
      activo: true
    },
    {
      id: '3',
      nombre: 'Música',
      instructor: 'Prof. López',
      horarios: [
        { dia: 'Viernes', horaInicio: '14:30', horaFin: '16:30', aula: 'Aula Música' }
      ],
      participantes: 30,
      activo: true
    },
    {
      id: '4',
      nombre: 'Deportes',
      instructor: 'Prof. Rodríguez',
      horarios: [
        { dia: 'Sábado', horaInicio: '09:00', horaFin: '11:00', aula: 'Cancha' }
      ],
      participantes: 40,
      activo: true
    }
  ]

  const tabs = [
    {
      id: 'horarios',
      name: 'Horarios de Talleres',
      icon: '🎨',
      description: 'Gestiona los horarios de talleres extracurriculares'
    },
    {
      id: 'excepciones',
      name: 'Excepciones y Suspensiones',
      icon: '⚠️',
      description: 'Administra excepciones y suspensiones de talleres'
    }
  ]

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

  const handleCreateHorario = async (data: any) => {
    try {
      console.log('Creando horario de talleres:', data)
      // Aquí implementarías la lógica para crear el horario de talleres
      return true
    } catch (error) {
      console.error('Error creating horario talleres:', error)
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
              🎨 Horario de Talleres
            </h1>
            <p className="text-gray-600 mt-1">
              Administra horarios de talleres extracurriculares, excepciones y suspensiones
            </p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
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
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-2xl">🎨</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Talleres Activos</p>
              <p className="text-2xl font-semibold text-gray-900">{talleres.filter(t => t.activo).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Participantes</p>
              <p className="text-2xl font-semibold text-gray-900">
                {talleres.reduce((acc, t) => acc + t.participantes, 0)}
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
                {excepciones.filter(e => e.tipoHorario === 'TALLER' || e.tipoHorario === 'AMBOS').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">📅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Horarios Fin de Semana</p>
              <p className="text-2xl font-semibold text-gray-900">
                {talleres.filter(t => t.horarios.some(h => h.dia === 'Sábado' || h.dia === 'Domingo')).length}
              </p>
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
                    ? 'border-purple-500 text-purple-600'
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
                  Horarios de Talleres por Día
                </h3>
                <div className="flex space-x-2">
                  <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                    <option value="">Todos los talleres</option>
                    {talleres.map(taller => (
                      <option key={taller.id} value={taller.id}>
                        {taller.nombre}
                      </option>
                    ))}
                  </select>
                  <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                    <option value="">Todos los instructores</option>
                    {Array.from(new Set(talleres.map(t => t.instructor))).map(instructor => (
                      <option key={instructor} value={instructor}>
                        {instructor}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
                {diasSemana.map((dia) => (
                  <div key={dia} className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 text-center">
                      {dia}
                    </h4>
                    <div className="space-y-2">
                      {talleres
                        .filter(taller => taller.horarios.some(h => h.dia === dia))
                        .map((taller) => (
                          taller.horarios
                            .filter(h => h.dia === dia)
                            .map((horario, index) => (
                              <div key={`${taller.id}-${index}`} className="bg-white p-3 rounded border-l-4 border-purple-500">
                                <div className="text-sm font-medium text-gray-900">
                                  {horario.horaInicio} - {horario.horaFin}
                                </div>
                                <div className="text-sm text-purple-600 font-medium">
                                  {taller.nombre}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {taller.instructor}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {horario.aula} • {taller.participantes} participantes
                                </div>
                              </div>
                            ))
                        ))}
                      {!talleres.some(taller => taller.horarios.some(h => h.dia === dia)) && (
                        <div className="text-center text-gray-500 text-sm py-4">
                          Sin talleres
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Lista detallada de talleres */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Lista de Talleres
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {talleres.map((taller) => (
                    <div key={taller.id} className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium text-gray-900">
                          {taller.nombre}
                        </h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          taller.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {taller.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <span className="font-medium">Instructor:</span>
                          <span className="ml-2">{taller.instructor}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium">Participantes:</span>
                          <span className="ml-2">{taller.participantes}</span>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Horarios:</h5>
                        <div className="space-y-1">
                          {taller.horarios.map((horario, index) => (
                            <div key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                              <span className="font-medium">{horario.dia}:</span>
                              <span className="ml-2">{horario.horaInicio} - {horario.horaFin}</span>
                              <span className="ml-2 text-gray-500">({horario.aula})</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 flex space-x-2">
                        <button className="flex-1 text-purple-600 hover:text-purple-900 text-sm font-medium">
                          Editar
                        </button>
                        <button className="flex-1 text-gray-600 hover:text-gray-900 text-sm font-medium">
                          Ver Participantes
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'excepciones' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Excepciones y Suspensiones de Talleres
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
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {excepciones
                    .filter(exc => exc.tipoHorario === 'TALLER' || exc.tipoHorario === 'AMBOS')
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
                            excepcion.tipoHorario === 'TALLER' ? 'bg-purple-100 text-purple-800' :
                            excepcion.tipoHorario === 'AMBOS' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {excepcion.tipoHorario === 'TALLER' ? 'Solo Talleres' :
                             excepcion.tipoHorario === 'AMBOS' ? 'Clases y Talleres' : excepcion.tipoHorario}
                          </span>
                          <button className="text-purple-600 hover:text-purple-900 text-sm">
                            Editar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {excepciones.filter(exc => exc.tipoHorario === 'TALLER' || exc.tipoHorario === 'AMBOS').length === 0 && (
                    <div className="text-center py-8">
                      <span className="text-4xl mb-4 block">🎨</span>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No hay excepciones registradas
                      </h3>
                      <p className="text-gray-600">
                        Las excepciones y suspensiones de talleres aparecerán aquí
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal para crear horario de talleres */}
      <CreateHorarioTalleresModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateHorario}
      />
    </div>
  )
}
