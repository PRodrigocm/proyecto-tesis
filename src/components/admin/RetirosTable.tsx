import { useState } from 'react'
import { Retiro } from '@/hooks/useRetiros'
import ViewRetiroModal from './ViewRetiroModal'
import EditRetiroModal from './EditRetiroModal'

interface RetirosTableProps {
  retiros: Retiro[]
  onAutorizar: (retiroId: string, autorizado: boolean, observaciones?: string) => Promise<boolean>
  onModificar: (retiroId: string, data: any) => Promise<boolean>
  onEliminar: (retiroId: string) => Promise<boolean>
}

export default function RetirosTable({ retiros, onAutorizar, onModificar, onEliminar }: RetirosTableProps) {
  const [selectedRetiro, setSelectedRetiro] = useState<Retiro | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const handleViewRetiro = (retiro: Retiro) => {
    setSelectedRetiro(retiro)
    setShowViewModal(true)
  }

  const handleEditRetiro = (retiro: Retiro) => {
    setSelectedRetiro(retiro)
    setShowEditModal(true)
  }

  const handleCloseViewModal = () => {
    setShowViewModal(false)
    setSelectedRetiro(null)
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setSelectedRetiro(null)
  }

  if (retiros.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay retiros</h3>
          <p className="mt-1 text-sm text-gray-500">
            No se encontraron retiros para los filtros aplicados.
          </p>
        </div>
      </div>
    )
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800'
      case 'AUTORIZADO':
        return 'bg-green-100 text-green-800'
      case 'RECHAZADO':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estudiante
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Creado por
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Hora Retiro
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
          {retiros.map((retiro) => (
            <tr key={retiro.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-indigo-700">
                        {retiro.estudiante.nombre.charAt(0)}{retiro.estudiante.apellido.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {retiro.estudiante.nombre} {retiro.estudiante.apellido}
                    </div>
                    <div className="text-sm text-gray-500">
                      {retiro.estudiante.grado} - {retiro.estudiante.seccion}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {retiro.creadoPor ? (
                  <>
                    <div className="text-sm text-gray-900">
                      {retiro.creadoPor.nombre} {retiro.creadoPor.apellido}
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        retiro.creadoPor.rol === 'Docente' ? 'bg-blue-100 text-blue-800' :
                        retiro.creadoPor.rol === 'Apoderado' ? 'bg-purple-100 text-purple-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {retiro.creadoPor.rol}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-gray-400">Sin información</div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {new Date(`2000-01-01T${retiro.horaRetiro}`).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </div>
                {retiro.observaciones && (
                  <div className="text-xs text-gray-500 mt-1">{retiro.observaciones}</div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(retiro.estado)}`}>
                  {retiro.estado}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex flex-col gap-2">
                  {/* Acciones principales: Ver, Editar, Eliminar */}
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => handleViewRetiro(retiro)}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                      title="Ver detalles del retiro"
                    >
                      👁️ Ver
                    </button>
                    
                    <button
                      onClick={() => handleEditRetiro(retiro)}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200"
                      title="Editar retiro"
                    >
                      ✏️ Editar
                    </button>
                    
                    <button
                      onClick={() => {
                        if (confirm(`¿Estás seguro de que quieres eliminar el retiro de ${retiro.estudiante.nombre} ${retiro.estudiante.apellido}?`)) {
                          onEliminar(retiro.id)
                        }
                      }}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
                      title="Eliminar retiro"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>

                  {/* Botones de autorización */}
                  {retiro.estado === 'PENDIENTE' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => onAutorizar(retiro.id, true)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200"
                        title="Autorizar retiro"
                      >
                        ✅ Autorizar
                      </button>
                      <button
                        onClick={() => onAutorizar(retiro.id, false)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
                        title="Rechazar retiro"
                      >
                        ❌ Rechazar
                      </button>
                    </div>
                  )}
                  
                  {/* Mostrar quién autorizó/rechazó */}
                  {retiro.autorizadoPor && (retiro.estado === 'AUTORIZADO' || retiro.estado === 'RECHAZADO') && (
                    <div className={`text-xs mt-1 ${retiro.estado === 'RECHAZADO' ? 'text-red-500' : 'text-gray-500'}`}>
                      {retiro.estado === 'RECHAZADO' ? 'Rechazado por' : 'Autorizado por'}: {retiro.autorizadoPor.nombre} {retiro.autorizadoPor.apellido}
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Modal de visualización */}
      <ViewRetiroModal
        isOpen={showViewModal}
        onClose={handleCloseViewModal}
        retiro={selectedRetiro}
      />
      
      {/* Modal de edición */}
      <EditRetiroModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        retiro={selectedRetiro}
        onSave={onModificar}
      />
    </div>
  )
}
