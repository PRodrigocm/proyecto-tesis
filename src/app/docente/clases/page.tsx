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
      
      console.log('🔍 Verificando autenticación...')
      console.log('🔑 Token en localStorage:', storedToken ? 'Presente' : 'Ausente')
      console.log('👤 User en localStorage:', storedUser ? 'Presente' : 'Ausente')
      
      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          console.log('✅ Datos de usuario parseados:', parsedUser)
          
          setToken(storedToken)
          setUser(parsedUser)
          
          // Cargar aulas inmediatamente después de establecer el usuario
          setTimeout(() => {
            console.log('🔄 Iniciando carga de aulas...')
            loadAulasDocenteWithData(storedToken, parsedUser)
          }, 100)
          
        } catch (error) {
          console.error('❌ Error parsing user data:', error)
          router.push('/login')
        }
      } else {
        console.log('⚠️ No hay datos de autenticación, redirigiendo al login')
        router.push('/login')
      }
    }
  }, [router])

  // Función auxiliar para cargar aulas con datos específicos
  const loadAulasDocenteWithData = async (tokenData: string, userData: any) => {
    try {
      setLoading(true)
      
      // Verificar qué propiedad tiene el ID del usuario
      const userId = userData.idUsuario || userData.id
      console.log('🔍 Cargando aulas para docente ID:', userId)
      console.log('👤 Usuario completo:', userData)
      console.log('🔍 Propiedades disponibles:', Object.keys(userData))

      if (!userId) {
        console.error('❌ No se encontró ID de usuario válido')
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
        console.log('✅ Datos de aulas recibidos:', data)
        
        if (data.data && data.data.length > 0) {
          setAulas(data.data)
          console.log('📚 Aulas cargadas desde BD:', data.data.length)
        } else {
          console.log('⚠️ No hay aulas asignadas en BD:', data.message)
          console.log('🔍 Debug info:', data.debug)
          setAulas([{
            id: 'no-asignadas',
            materia: 'Sin asignación',
            grado: 'N/A',
            seccion: 'N/A',
            estudiantes: 0,
            horario: 'No asignado',
            aula: 'Sin aula asignada - Contacte al administrador',
            estado: 'pendiente'
          }])
        }
      } else {
        console.error('❌ Error al cargar aulas del docente. Status:', response.status)
        const errorData = await response.text()
        console.error('❌ Error details:', errorData)
        // Datos de fallback solo si hay error
        setAulas([
        {
          id: 1,
          materia: 'Matemáticas',
          grado: '5to',
          seccion: 'A',
          estudiantes: 28,
          horario: 'Lunes, Miércoles, Viernes 08:00-09:30',
          aula: 'Aula 201',
          estado: 'activa'
        },
        {
          id: 2,
          materia: 'Física',
          grado: '4to',
          seccion: 'B',
          estudiantes: 25,
          horario: 'Martes, Jueves 10:00-11:30',
          aula: 'Lab. Física',
          estado: 'activa'
        },
        {
          id: 3,
          materia: 'Matemáticas',
          grado: '3ro',
          seccion: 'C',
          estudiantes: 30,
          horario: 'Lunes, Miércoles 14:00-15:30',
          aula: 'Aula 105',
          estado: 'activa'
        }
      ])
      }
    } catch (error) {
      console.error('❌ Error loading aulas:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAulasDocente = async () => {
    try {
      setLoading(true)
      
      if (!token || !user?.idUsuario) {
        console.error('No hay token o usuario válido')
        return
      }

      console.log('🔍 Cargando aulas para docente ID:', user.idUsuario)
      console.log('👤 Usuario completo:', user)

      const response = await fetch(`/api/docentes/${user.idUsuario}/aulas`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Datos de aulas recibidos:', data)
        
        if (data.data && data.data.length > 0) {
          setAulas(data.data)
          console.log('📚 Aulas cargadas desde BD:', data.data.length)
        } else {
          console.log('⚠️ No hay aulas asignadas en BD:', data.message)
          console.log('🔍 Debug info:', data.debug)
          // Mostrar mensaje informativo en lugar de datos de fallback
          setAulas([{
            id: 'no-asignadas',
            materia: 'Sin asignación',
            grado: 'N/A',
            seccion: 'N/A',
            estudiantes: 0,
            horario: 'No asignado',
            aula: 'Sin aula asignada - Contacte al administrador',
            estado: 'pendiente'
          }])
        }
      } else {
        console.error('❌ Error al cargar aulas del docente. Status:', response.status)
        const errorData = await response.text()
        console.error('❌ Error details:', errorData)
        // Datos de fallback solo si hay error
        setAulas([
        {
          id: 1,
          materia: 'Matemáticas',
          grado: '5to',
          seccion: 'A',
          estudiantes: 28,
          horario: 'Lunes, Miércoles, Viernes 08:00-09:30',
          aula: 'Aula 201',
          estado: 'activa'
        },
        {
          id: 2,
          materia: 'Física',
          grado: '4to',
          seccion: 'B',
          estudiantes: 25,
          horario: 'Martes, Jueves 10:00-11:30',
          aula: 'Lab. Física',
          estado: 'activa'
        },
        {
          id: 3,
          materia: 'Matemáticas',
          grado: '3ro',
          seccion: 'C',
          estudiantes: 30,
          horario: 'Lunes, Miércoles 14:00-15:30',
          aula: 'Aula 105',
          estado: 'activa'
        }
      ])
      }
    } catch (error) {
      console.error('Error loading aulas:', error)
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
    console.log('Redirigiendo a asistencias para aula:', aulaId)
    router.push('/docente/asistencias')
  }

  const handleVerEstudiantes = (aulaId: number) => {
    const aula = aulas.find(a => a.id === aulaId)
    const aulaNombre = aula ? `${aula.grado} ${aula.seccion} - ${aula.aula}` : `Aula ${aulaId}`
    
    console.log('Abriendo modal de estudiantes para aula:', aulaId, aulaNombre)
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
    console.log('Redirigiendo a reportes para aula:', aulaId)
    router.push('/docente/reportes')
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Mis Aulas</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gestiona tus aulas asignadas y estudiantes
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            onClick={() => {
              console.log('🔄 Debug: Forzando recarga de aulas...')
              console.log('👤 Usuario actual:', user)
              console.log('🔑 Token actual:', token ? 'Presente' : 'Ausente')
              loadAulasDocente()
            }}
            className="inline-flex items-center justify-center rounded-md bg-yellow-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600"
          >
            🔍 Debug Aulas
          </button>
        </div>
      </div>


      {/* Lista de Aulas */}
      <div className="mt-8 bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Cargando aulas...</span>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Aulas Asignadas ({aulas.length})
              </h3>
              {user && (
                <p className="text-sm text-gray-500 mt-1">
                  Usuario logueado: {user.nombre || user.nombres} {user.apellido || user.apellidos} (ID: {user.idUsuario || user.id})
                </p>
              )}
            </div>
            
            <div className="divide-y divide-gray-200">
              {aulas.map((aula: any) => (
                <div key={aula.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex items-center">
                            <h4 className="text-lg font-medium text-gray-900">{aula.aula}</h4>
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {aula.estado}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {aula.grado}° - Sección {aula.seccion}
                            <span className="mx-2">•</span>
                            <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            {aula.materia}
                          </div>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {aula.horario}
                          </div>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                            {aula.estudiantes} estudiantes
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2 ml-4">
                      <button
                        onClick={() => handleTomarAsistencia(aula.id)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        Asistencia
                      </button>
                      
                      <button
                        onClick={() => handleVerEstudiantes(aula.id)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        Estudiantes
                      </button>
                      
                      <button
                        onClick={() => handleVerReportes(aula.id)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Reportes
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {aulas.length === 0 && (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No hay aulas asignadas</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No tienes aulas asignadas en este momento.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Estadísticas Rápidas */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Aulas</dt>
                  <dd className="text-lg font-medium text-gray-900">{aulas.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Estudiantes</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {aulas.reduce((total, aula) => total + aula.estudiantes, 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Promedio por Aula</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {aulas.length > 0 ? Math.round(aulas.reduce((total, aula) => total + aula.estudiantes, 0) / aulas.length) : 0}
                  </dd>
                </dl>
              </div>
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
