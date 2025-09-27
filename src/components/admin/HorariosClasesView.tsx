'use client'

import { useState } from 'react'
import { useHorariosBase } from '@/hooks/useHorariosBase'
import CreateHorarioClasesModal from './CreateHorarioClasesModal'

interface HorariosClasesViewProps {
  ieId: number
}

export default function HorariosClasesView({ ieId }: HorariosClasesViewProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const {
    horariosBase,
    loading,
    error,
    createHorarioBase,
    loadHorariosBase
  } = useHorariosBase(ieId)

  const handleCreateHorario = async (data: any) => {
    console.log('🎯 === MANEJADOR DE CREACIÓN EN VISTA ===')
    console.log('📋 Datos recibidos del modal:', data)
    
    console.log('🚀 Llamando al hook createHorarioBase...')
    const success = await createHorarioBase(data)
    
    console.log('📡 Resultado del hook:', success)
    
    if (success) {
      console.log('✅ Éxito - Cerrando modal')
      setIsCreateModalOpen(false)
      // No recargamos aquí porque el hook ya lo hace
    } else {
      console.error('❌ Error en la creación - Modal permanece abierto')
    }
    
    console.log('🏁 Retornando resultado:', success)
    return success
  }

  // Filtrar horarios
  const horariosFiltrados = horariosBase.filter(horario => {
    const searchLower = searchTerm.toLowerCase()
    return (
      horario.grado.toLowerCase().includes(searchLower) ||
      horario.seccion.toLowerCase().includes(searchLower) ||
      horario.aula.toLowerCase().includes(searchLower) ||
      horario.docente.toLowerCase().includes(searchLower)
    )
  })

  // Agrupar por grado-sección
  const horariosAgrupados = horariosFiltrados.reduce((acc, horario) => {
    const key = `${horario.grado}° ${horario.seccion}`
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(horario)
    return acc
  }, {} as Record<string, typeof horariosFiltrados>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📚 Horarios de Clases</h2>
          <p className="text-gray-600">Gestiona los horarios base de cada grado y sección</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <span>➕</span>
          <span>Crear Horario Base</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🔍 Buscar horarios
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por grado, sección, aula o docente..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
            />
          </div>
          <div className="flex items-center space-x-2 mt-6">
            <button
              onClick={() => loadHorariosBase()}
              className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200"
              disabled={loading}
            >
              {loading ? '🔄' : '🔄'} Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{Object.keys(horariosAgrupados).length}</div>
          <div className="text-sm text-blue-700">Grados con Horario</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">{horariosBase.length}</div>
          <div className="text-sm text-green-700">Total Horarios</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-600">
            {horariosBase.filter(h => h.docente === 'Sin asignar').length}
          </div>
          <div className="text-sm text-yellow-700">Sin Docente</div>
        </div>
      </div>

      {/* Lista de Horarios */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">📅 Horarios Base Configurados</h3>
        </div>
        
        {loading ? (
          <div className="p-6 text-center text-gray-500">Cargando horarios...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">Error: {error}</div>
        ) : Object.keys(horariosAgrupados).length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No hay horarios configurados. Crea el primer horario base.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {Object.entries(horariosAgrupados).map(([gradoSeccion, horarios]) => (
              <div key={gradoSeccion} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900">
                    🎓 {gradoSeccion}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {horarios[0].horaInicio} - {horarios[0].horaFin}
                    </span>
                    <span className="text-sm text-gray-500">
                      📍 {horarios[0].aula || 'Sin aula'}
                    </span>
                  </div>
                </div>
                
                {/* Información del horario */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">⏰ Horario:</span>
                      <span className="ml-2 text-gray-600">{horarios[0].horaInicio} - {horarios[0].horaFin}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">📍 Aula:</span>
                      <span className="ml-2 text-gray-600">{horarios[0].aula || 'Sin especificar'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">⏱️ Tolerancia:</span>
                      <span className="ml-2 text-gray-600">{horarios[0].toleranciaMin || 10} min</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">📚 Tipo:</span>
                      <span className="ml-2 text-gray-600">Clase Regular</span>
                    </div>
                  </div>
                </div>

                {/* Calendario semanal L-V */}
                <div className="grid grid-cols-5 gap-3">
                  {[
                    { nombre: 'Lunes', numero: 1, emoji: '📅' },
                    { nombre: 'Martes', numero: 2, emoji: '📅' },
                    { nombre: 'Miércoles', numero: 3, emoji: '📅' },
                    { nombre: 'Jueves', numero: 4, emoji: '📅' },
                    { nombre: 'Viernes', numero: 5, emoji: '📅' }
                  ].map((dia) => {
                    const horarioDia = horarios.find(h => h.diaNumero === dia.numero)
                    return (
                      <div
                        key={dia.nombre}
                        className={`p-4 rounded-lg border-2 text-center transition-all ${
                          horarioDia 
                            ? 'bg-green-50 border-green-300 shadow-sm' 
                            : 'bg-red-50 border-red-300'
                        }`}
                      >
                        <div className="text-sm font-bold text-gray-800 mb-2">
                          {dia.emoji} {dia.nombre}
                        </div>
                        {horarioDia ? (
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-green-700">
                              ✅ Configurado
                            </div>
                            <div className="text-xs text-green-600">
                              {horarioDia.horaInicio} - {horarioDia.horaFin}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              👨‍🏫 {horarioDia.docente || 'Sin asignar'}
                            </div>
                            {horarioDia.aula && (
                              <div className="text-xs text-gray-500">
                                📍 {horarioDia.aula}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 mt-1">Sin configurar</div>
                        )}
                      </div>
                    )
                  })}
                </div>
                
                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span>📊 {horarios.length} días configurados</span>
                    <span>🎯 Horario base (L-V)</span>
                  </div>
                  <div>
                    Creado: {new Date(horarios[0].createdAt).toLocaleDateString('es-PE')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Crear Horario */}
      <CreateHorarioClasesModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateHorario}
      />
    </div>
  )
}
