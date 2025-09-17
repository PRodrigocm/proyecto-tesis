'use client'

import { useState, useEffect } from 'react'
import EstudiantesTable from '@/components/admin/EstudiantesTable'

interface Estudiante {
  idEstudiante: number
  codigo: string
  dni: string
  nombre: string
  apellido: string
  fechaNacimiento: string
  genero: string
  direccion?: string
  telefono?: string
  email?: string
  estado: string
  ie: {
    nombre: string
  }
  gradoSeccion?: {
    grado: {
      nombre: string
    }
    seccion: {
      nombre: string
    }
  }
}

export default function EstudiantesPage() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEstudiantes()
  }, [])

  const fetchEstudiantes = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/estudiantes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Error al cargar estudiantes')
      }

      const data = await response.json()
      setEstudiantes(data.data || [])
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
          <h1 className="text-2xl font-semibold text-gray-900">Estudiantes</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gestión de estudiantes registrados en el sistema.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Agregar Estudiante
          </button>
        </div>
      </div>

      <EstudiantesTable 
        estudiantes={estudiantes.map(est => ({
          id: est.idEstudiante.toString(),
          nombre: est.nombre,
          apellido: est.apellido,
          dni: est.dni,
          fechaNacimiento: est.fechaNacimiento,
          grado: est.gradoSeccion?.grado.nombre || '',
          seccion: est.gradoSeccion?.seccion.nombre || '',
          institucionEducativa: est.ie.nombre,
          apoderado: {
            id: '',
            nombre: '',
            apellido: '',
            telefono: '',
            email: ''
          },
          estado: est.estado as 'ACTIVO' | 'INACTIVO' | 'RETIRADO',
          fechaRegistro: new Date().toISOString(),
          qrCode: ''
        }))}
        onEstadoChange={(id, estado) => {
          // TODO: Implementar cambio de estado
          console.log('Cambiar estado:', id, estado)
        }}
        onGenerateQR={(id) => {
          // TODO: Implementar generación de QR
          console.log('Generar QR:', id)
        }}
      />
    </div>
  )
}