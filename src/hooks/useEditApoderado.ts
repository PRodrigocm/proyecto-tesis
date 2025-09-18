import { useState } from 'react'

interface EditApoderadoData {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono: string
  dni: string
  direccion: string
  estado: 'ACTIVO' | 'INACTIVO'
  estudiantesIds: string[]
  estudiantesRelaciones: {[key: string]: string}
}

export const useEditApoderado = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateApoderado = async (apoderadoData: EditApoderadoData): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      console.log('=== INICIO ACTUALIZACIÓN DE APODERADO ===')
      console.log('Datos a actualizar:', apoderadoData)

      const response = await fetch(`/api/apoderados/${apoderadoData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apoderadoData)
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        throw new Error(errorData.message || 'Error al actualizar el apoderado')
      }

      const result = await response.json()
      console.log('Apoderado actualizado exitosamente:', result)
      
      return true
    } catch (error) {
      console.error('Error en updateApoderado:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    updateApoderado,
    loading,
    error
  }
}
