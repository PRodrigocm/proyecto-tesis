'use client'

import { useState, useEffect } from 'react'
import AuxiliaresTable from '@/components/admin/AuxiliaresTable'
import CreateAuxiliarModal from '@/components/forms/CreateAuxiliarModal'

interface Auxiliar {
  idUsuario: number
  dni: string
  nombre: string
  apellido: string
  email: string
  telefono?: string
  estado: string
  ie: {
    nombre: string
  }
  roles: Array<{
    rol: {
      nombre: string
    }
  }>
  // auxiliar?: {
  //   area: string
  //   turno: string
  // }
}

export default function AuxiliaresPage() {
  const [auxiliares, setAuxiliares] = useState<Auxiliar[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchAuxiliares()
  }, [])

  const fetchAuxiliares = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Obtener ieId del usuario
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        console.error('No user data found')
        return
      }
      
      const user = JSON.parse(userStr)
      const ieId = user.idIe || user.institucionId || 1
      
      const response = await fetch(`/api/usuarios/auxiliares?ieId=${ieId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Error al cargar auxiliares')
      }

      const data = await response.json()
      setAuxiliares(data.data || [])
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Auxiliares</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gestión de personal auxiliar de la institución educativa.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Agregar Auxiliar
          </button>
        </div>
      </div>

      <AuxiliaresTable 
        auxiliares={auxiliares}
        onRefresh={fetchAuxiliares}
      />

      <CreateAuxiliarModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchAuxiliares}
      />
    </div>
  )
}
