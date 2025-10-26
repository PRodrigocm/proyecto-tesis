import { useState, useEffect } from 'react'

export interface EstudianteSalon {
  id: number
  dni: string
  nombres: string
  apellidos: string
  email?: string
  telefono?: string
  fechaNacimiento?: string
  codigoQR?: string
  estado?: string
  createdAt: string
}

export interface DocenteSalon {
  id: number
  docenteId: number
  dni: string
  nombres: string
  apellidos: string
  email?: string
  telefono?: string
  especialidad?: string
  codigo?: string
  estado?: string
  tipoAsignacion: string
  fechaAsignacion: string
}

export interface SalonInfo {
  id: number
  grado: string
  seccion: string
  nivel: string
}

export interface SalonEstudiantesResponse {
  salon: SalonInfo
  estudiantes: EstudianteSalon[]
  total: number
}

export interface SalonDocentesResponse {
  salon: SalonInfo
  docentes: DocenteSalon[]
  total: number
}

export const useSalonDetails = (salonId: number | null) => {
  const [estudiantes, setEstudiantes] = useState<EstudianteSalon[]>([])
  const [docentes, setDocentes] = useState<DocenteSalon[]>([])
  const [salonInfo, setSalonInfo] = useState<SalonInfo | null>(null)
  const [loadingEstudiantes, setLoadingEstudiantes] = useState(false)
  const [loadingDocentes, setLoadingDocentes] = useState(false)
  const [errorEstudiantes, setErrorEstudiantes] = useState<string | null>(null)
  const [errorDocentes, setErrorDocentes] = useState<string | null>(null)

  const fetchEstudiantes = async (id: number) => {
    try {
      setLoadingEstudiantes(true)
      setErrorEstudiantes(null)
      
      const response = await fetch(`/api/salones/${id}/estudiantes`)
      
      if (!response.ok) {
        throw new Error('Error al cargar los estudiantes')
      }

      const data: SalonEstudiantesResponse = await response.json()
      setEstudiantes(data.estudiantes)
      setSalonInfo(data.salon)
    } catch (err) {
      setErrorEstudiantes(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoadingEstudiantes(false)
    }
  }

  const fetchDocentes = async (id: number) => {
    try {
      setLoadingDocentes(true)
      setErrorDocentes(null)
      
      const response = await fetch(`/api/salones/${id}/docentes`)
      
      if (!response.ok) {
        throw new Error('Error al cargar los docentes')
      }

      const data: SalonDocentesResponse = await response.json()
      setDocentes(data.docentes)
      if (!salonInfo) {
        setSalonInfo(data.salon)
      }
    } catch (err) {
      setErrorDocentes(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoadingDocentes(false)
    }
  }

  const fetchSalonDetails = async (id: number) => {
    await Promise.all([
      fetchEstudiantes(id),
      fetchDocentes(id)
    ])
  }

  useEffect(() => {
    if (salonId) {
      fetchSalonDetails(salonId)
    } else {
      // Reset data when no salon is selected
      setEstudiantes([])
      setDocentes([])
      setSalonInfo(null)
      setErrorEstudiantes(null)
      setErrorDocentes(null)
    }
  }, [salonId])

  return {
    estudiantes,
    docentes,
    salonInfo,
    loadingEstudiantes,
    loadingDocentes,
    errorEstudiantes,
    errorDocentes,
    refetchEstudiantes: () => salonId && fetchEstudiantes(salonId),
    refetchDocentes: () => salonId && fetchDocentes(salonId),
    refetchAll: () => salonId && fetchSalonDetails(salonId)
  }
}
