'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EstudiantesAulaModal from '@/components/docente/EstudiantesAulaModal'

export default function DocenteClases() {
  const router = useRouter()
  const [aulas, setAulas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [token, setToken] = useState<string | null>(null)
  const [modalEstudiantes, setModalEstudiantes] = useState({
    isOpen: false,
    aulaId: null as number | null,
    aulaNombre: ''
  })

  // Evitar errores de hidratación y cargar datos de autenticación
  useEffect(() => {
    setMounted(true)
    
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')
      
      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          setToken(storedToken)
          setUser(parsedUser)
          
          // Cargar aulas inmediatamente después de establecer el usuario
          setTimeout(() => {
            loadAulasDocenteWithData(storedToken, parsedUser)
          }, 100)
          
        } catch (error) {
          console.error('Error parsing user data:', error)
          router.push('/login')
        }
      } else {
        router.push('/login')
      }
    }
  }, [router])

  // Función auxiliar para cargar aulas con datos específicos
  const loadAulasDocenteWithData = async (tokenData: string, userData: any) => {
    try {
      setLoading(true)
      
      const userId = userData.idUsuario || userData.id

      if (!userId) {
        setLoading(false)
        return
      }

      const response = await fetch(`/api/docentes/${userId}/aulas`, {
        headers: {
          'Authorization': `Bearer ${tokenData}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.data && data.data.length > 0) {
          setAulas(data.data)
        } else {
          setAulas([])
        }
      } else {
        setAulas([])
      }
    } catch (error) {
      console.error('Error loading aulas:', error)
      setAulas([])
    } finally {
      setLoading(false)
    }
  }

  const loadAulasDocente = async () => {
    try {
      setLoading(true)
      
      if (!token || !user?.idUsuario) {
        return
      }

      const response = await fetch(`/api/docentes/${user.idUsuario}/aulas`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.data && data.data.length > 0) {
          setAulas(data.data)
        } else {
          setAulas([])
        }
      } else {
        setAulas([])
      }
    } catch (error) {
      console.error('Error loading aulas:', error)
      setAulas([])
    } finally {
      setLoading(false)
    }
  }

  // Prevenir renderizado hasta que el componente esté montado
  if (!mounted) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando...</span>
      </div>
    )
  }


  const handleTomarAsistencia = (aulaId: number) => {
    router.push('/docente/asistencias')
  }

  const handleVerEstudiantes = (aulaId: number) => {
    const aula = aulas.find(a => a.id === aulaId)
    const aulaNombre = aula ? `${aula.grado} ${aula.seccion} - ${aula.aula}` : `Aula ${aulaId}`
    
    setModalEstudiantes({
      isOpen: true,
      aulaId: aulaId,
      aulaNombre: aulaNombre
    })
  }

  const handleCloseModalEstudiantes = () => {
    setModalEstudiantes({
      isOpen: false,
      aulaId: null,
      aulaNombre: ''
    })
  }

  const handleVerReportes = (aulaId: number) => {
    router.push('/docente/reportes')
  }

  return (
    <div className="px-3 sm:px-4 md:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mis Aulas</h1>
        <p className="mt-1 text-xs sm:text-sm text-gray-700">
          Gestiona tus aulas y estudiantes
        </p>
      </div>


      {/* Lista de Aulas */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600 text-sm">Cargando...</span>
          </div>
        ) : (
          <>
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">
                Aulas Asignadas ({aulas.length})
              </h3>
            </div>
            
            <div className="divide-y divide-gray-200">
              {aulas.map((aula: any) => (
                <div key={aula.id} className="p-3 sm:p-4 md:p-6 hover:bg-gray-50 active:bg-gray-100">
                  <div className="flex flex-col gap-3">
                    {/* Header del aula */}
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-lg sm:text-xl">📚</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <h4 className="text-sm sm:text-lg font-medium text-gray-900">{aula.aula}</h4>
                          <span className="px-1.5 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-green-100 text-green-800">
                            {aula.estado}
                          </span>
                        </div>
                        <div className="mt-1 text-xs sm:text-sm text-gray-500">
                          <span>{aula.grado}° - {aula.seccion}</span>
                          <span className="mx-1.5">•</span>
                          <span className="truncate">{aula.materia}</span>
                        </div>
                        <div className="mt-0.5 text-xs text-gray-500 flex flex-wrap gap-x-3">
                          <span>🕐 {aula.horario}</span>
                          <span>👥 {aula.estudiantes}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Botones de acción */}
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => handleTomarAsistencia(aula.id)}
                        className="flex-1 px-2 sm:px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 text-xs sm:text-sm font-medium min-h-[40px] transition-colors"
                      >
                        📋 <span className="hidden sm:inline">Asistencia</span>
                      </button>
                      
                      <button
                        onClick={() => handleVerEstudiantes(aula.id)}
                        className="flex-1 px-2 sm:px-3 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 active:bg-gray-100 text-xs sm:text-sm font-medium min-h-[40px] transition-colors"
                      >
                        👥 <span className="hidden sm:inline">Estudiantes</span>
                      </button>
                      
                      <button
                        onClick={() => handleVerReportes(aula.id)}
                        className="flex-1 px-2 sm:px-3 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 active:bg-gray-100 text-xs sm:text-sm font-medium min-h-[40px] transition-colors"
                      >
                        📊 <span className="hidden sm:inline">Reportes</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {aulas.length === 0 && (
                <div className="text-center py-8 sm:py-12">
                  <div className="text-4xl sm:text-5xl mb-3">📚</div>
                  <h3 className="text-sm font-medium text-gray-900">No hay aulas asignadas</h3>
                  <p className="mt-1 text-xs sm:text-sm text-gray-500">
                    No tienes aulas asignadas
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Estadísticas Rápidas */}
      <div className="mt-4 sm:mt-6 grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm sm:text-lg">📚</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-gray-500 truncate">Aulas</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{aulas.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm sm:text-lg">👥</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-gray-500 truncate">Estudiantes</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {aulas.reduce((total, aula) => total + aula.estudiantes, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm sm:text-lg">📊</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-gray-500 truncate">Promedio</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {aulas.length > 0 ? Math.round(aulas.reduce((total, aula) => total + aula.estudiantes, 0) / aulas.length) : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Estudiantes */}
      <EstudiantesAulaModal
        isOpen={modalEstudiantes.isOpen}
        onClose={handleCloseModalEstudiantes}
        aulaId={modalEstudiantes.aulaId || 0}
        aulaNombre={modalEstudiantes.aulaNombre}
      />
    </div>
  )
}
