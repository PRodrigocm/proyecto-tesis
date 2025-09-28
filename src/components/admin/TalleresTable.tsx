import { useState } from 'react'
import { Taller } from '@/hooks/useTalleres'
import ViewTallerModal from './ViewTallerModal'
import EditTallerModal from './EditTallerModal'
import InscripcionesModal from './InscripcionesModal'

interface TalleresTableProps {
  talleres: Taller[]
  onActualizar: (tallerId: string, data: any) => Promise<boolean>
  onEliminar: (tallerId: string) => Promise<boolean>
  onInscribir: (tallerId: string, estudianteId: string) => Promise<boolean>
  onDesinscribir: (tallerId: string, estudianteId: string) => Promise<boolean>
}

export default function TalleresTable({ 
  talleres, 
  onActualizar, 
  onEliminar, 
  onInscribir, 
  onDesinscribir 
}: TalleresTableProps) {
  const [selectedTaller, setSelectedTaller] = useState<Taller | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showInscripcionesModal, setShowInscripcionesModal] = useState(false)

  const handleViewTaller = (taller: Taller) => {
    setSelectedTaller(taller)
    setShowViewModal(true)
  }

  const handleEditTaller = (taller: Taller) => {
    setSelectedTaller(taller)
    setShowEditModal(true)
  }

  const handleInscripciones = (taller: Taller) => {
    setSelectedTaller(taller)
    setShowInscripcionesModal(true)
  }

  const handleEliminar = async (taller: Taller) => {
    const confirmMessage = taller.inscripciones > 0 
      ? `¿Estás seguro de que quieres desactivar el taller "${taller.nombre}"? Tiene ${taller.inscripciones} estudiantes inscritos.`
      : `¿Estás seguro de que quieres eliminar el taller "${taller.nombre}"?`
    
    if (confirm(confirmMessage)) {
      await onEliminar(taller.id)
    }
  }

  const handleToggleEstado = async (taller: Taller) => {
    const nuevoEstado = !taller.activo
    const confirmMessage = nuevoEstado 
      ? `¿Activar el taller "${taller.nombre}"?`
      : `¿Desactivar el taller "${taller.nombre}"?`
    
    if (confirm(confirmMessage)) {
      await onActualizar(taller.id, { activo: nuevoEstado })
    }
  }

  const handleCloseModals = () => {
    setShowViewModal(false)
    setShowEditModal(false)
    setShowInscripcionesModal(false)
    setSelectedTaller(null)
  }

  const getEstadoColor = (activo: boolean) => {
    return activo
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800'
  }

  const getEstadoIcon = (activo: boolean) => {
    return activo ? '✅' : '❌'
  }

  if (talleres.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay talleres</h3>
          <p className="mt-1 text-sm text-gray-500">
            Comienza creando un nuevo taller extracurricular.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Taller
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Instructor
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Capacidad
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Inscripciones
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {talleres.map((taller) => (
            <tr key={taller.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {taller.nombre.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {taller.nombre}
                    </div>
                    {taller.codigo && (
                      <div className="text-sm text-gray-500">
                        Código: {taller.codigo}
                      </div>
                    )}
                    {taller.descripcion && (
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {taller.descripcion}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {taller.instructor || 'Sin asignar'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {taller.capacidadMaxima || 'Sin límite'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900">
                    {taller.inscripciones}
                  </span>
                  {taller.capacidadMaxima && (
                    <span className="text-sm text-gray-500 ml-1">
                      / {taller.capacidadMaxima}
                    </span>
                  )}
                  {taller.inscripciones > 0 && (
                    <button
                      onClick={() => handleInscripciones(taller)}
                      className="ml-2 text-xs text-indigo-600 hover:text-indigo-900"
                      title="Ver inscripciones"
                    >
                      👥 Ver
                    </button>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(taller.activo)}`}>
                  <span className="mr-1">{getEstadoIcon(taller.activo)}</span>
                  {taller.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex flex-col gap-2">
                  {/* Acciones principales: Ver, Editar, Eliminar */}
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => handleViewTaller(taller)}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                      title="Ver detalles del taller"
                    >
                      👁️ Ver
                    </button>
                    
                    <button
                      onClick={() => handleEditTaller(taller)}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200"
                      title="Editar taller"
                    >
                      ✏️ Editar
                    </button>
                    
                    <button
                      onClick={() => handleEliminar(taller)}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
                      title="Eliminar taller"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>

                  {/* Acciones de estado */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleToggleEstado(taller)}
                      className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md ${
                        taller.activo
                          ? 'text-red-700 bg-red-100 hover:bg-red-200'
                          : 'text-green-700 bg-green-100 hover:bg-green-200'
                      }`}
                      title={taller.activo ? 'Desactivar taller' : 'Activar taller'}
                    >
                      {taller.activo ? '❌ Desactivar' : '✅ Activar'}
                    </button>
                    
                    {taller.activo && (
                      <button
                        onClick={() => handleInscripciones(taller)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-md hover:bg-purple-200"
                        title="Gestionar inscripciones"
                      >
                        👥 Inscripciones
                      </button>
                    )}
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Modales */}
      <ViewTallerModal
        isOpen={showViewModal}
        onClose={handleCloseModals}
        taller={selectedTaller}
      />
      
      <EditTallerModal
        isOpen={showEditModal}
        onClose={handleCloseModals}
        taller={selectedTaller}
        onSave={onActualizar}
      />
      
      <InscripcionesModal
        isOpen={showInscripcionesModal}
        onClose={handleCloseModals}
        taller={selectedTaller}
        onInscribir={onInscribir}
        onDesinscribir={onDesinscribir}
      />
    </div>
  )
}
