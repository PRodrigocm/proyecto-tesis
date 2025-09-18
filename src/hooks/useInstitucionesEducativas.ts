import { useState, useEffect } from 'react'

export interface InstitucionEducativa {
  id: string
  nombre: string
  codigo: string
  created_at: string
}

export const useInstitucionesEducativas = () => {
  const [institucionesEducativas, setInstitucionesEducativas] = useState<InstitucionEducativa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInstituciones = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/instituciones')
      
      if (!response.ok) {
        throw new Error('Error al cargar las instituciones educativas')
      }

      const data = await response.json()
      setInstitucionesEducativas(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInstituciones()
  }, [])

  return {
    institucionesEducativas,
    loading,
    error,
    refetch: fetchInstituciones
  }
}
