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
  estudiantesTitulares: {[key: string]: boolean}
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
      
      const url = `/api/apoderados/${apoderadoData.id}`
      console.log('URL construida:', url)
      console.log('ID del apoderado:', apoderadoData.id)
      console.log('Tipo de ID:', typeof apoderadoData.id)

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apoderadoData)
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        console.log('Response not ok, trying to get error data...')
        try {
          const responseText = await response.text()
          console.log('Raw response text:', responseText)
          
          if (responseText) {
            try {
              const errorData = JSON.parse(responseText)
              console.error('Error response parsed:', errorData)
              
              // Si hay información de debug, mostrarla
              if (errorData.debug) {
                console.log('Debug info from API:', errorData.debug)
                console.log('Searched ID:', errorData.debug.searchedId)
                console.log('All apoderados in DB:', errorData.debug.allApoderados)
                console.log('Simple search result:', errorData.debug.simpleSearch)
                console.log('Related user:', errorData.debug.relatedUser)
              }
              
              throw new Error(errorData.message || 'Error al actualizar el apoderado')
            } catch (parseError) {
              console.error('Error parsing JSON:', parseError)
              console.error('Raw response text:', responseText)
              throw new Error(`Error ${response.status}: ${responseText}`)
            }
          } else {
            throw new Error(`Error ${response.status}: ${response.statusText}`)
          }
        } catch (fetchError) {
          console.error('Error getting response text:', fetchError)
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }
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

  const testApiRoute = async (id: string) => {
    try {
      console.log('=== TESTING API ROUTE ===')
      const response = await fetch(`/api/apoderados/${id}`, {
        method: 'GET'
      })
      console.log('Test GET Response status:', response.status)
      const data = await response.json()
      console.log('Test GET Response data:', data)
      return response.ok
    } catch (error) {
      console.error('Test GET Error:', error)
      return false
    }
  }

  return {
    updateApoderado,
    testApiRoute,
    loading,
    error
  }
}
