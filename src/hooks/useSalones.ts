import { useState, useEffect } from 'react'

export interface Salon {
  id: string
  nivel: string
  grado: string
  seccion: string
  nombre: string
  cantidadEstudiantes: number
  createdAt: string
}

export interface CreateSalonData {
  nivelId: string
  gradoNombre: string
  seccionNombre: string
}

export const useSalones = () => {
  const [salones, setSalones] = useState<Salon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSalones = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/salones')
      
      if (!response.ok) {
        throw new Error('Error al cargar los salones')
      }

      const data = await response.json()
      setSalones(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const createSalon = async (salonData: CreateSalonData) => {
    try {
      const response = await fetch('/api/salones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(salonData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear el salón')
      }

      // Refresh the list
      await fetchSalones()
      return data.salon

    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error desconocido')
    }
  }

  useEffect(() => {
    fetchSalones()
  }, [])

  return {
    salones,
    loading,
    error,
    createSalon,
    refetch: fetchSalones
  }
}
