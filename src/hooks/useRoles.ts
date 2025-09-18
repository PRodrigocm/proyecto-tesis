import { useState, useEffect } from 'react'

export interface Role {
  id: string
  name: string
  nombre: string
}

export const useRoles = () => {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/roles')
      
      if (!response.ok) {
        throw new Error('Error al cargar los roles')
      }

      const data = await response.json()
      setRoles(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  return {
    roles,
    loading,
    error,
    refetch: fetchRoles
  }
}
