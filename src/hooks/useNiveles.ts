import { useState, useEffect } from 'react'

export interface Nivel {
  id: string
  nombre: string
}

export const useNiveles = () => {
  const [niveles, setNiveles] = useState<Nivel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNiveles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/niveles')
      
      if (!response.ok) {
        throw new Error('Error al cargar los niveles')
      }

      const data = await response.json()
      setNiveles(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNiveles()
  }, [])

  return {
    niveles,
    loading,
    error,
    refetch: fetchNiveles
  }
}
