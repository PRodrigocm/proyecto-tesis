'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import NotificationBell from '@/components/NotificationBell'

export default function ApoderadoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  // Cargar datos del usuario
  useEffect(() => {
    setMounted(true)
    
    const loadUserData = async () => {
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('user')
        const token = localStorage.getItem('token')
        
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser)
            console.log('👤 Usuario cargado en layout apoderado:', parsedUser)
            setUser(parsedUser)
            
            // Si faltan datos importantes, intentar cargar desde el servidor
            if ((!parsedUser.nombre || !parsedUser.apellido || !parsedUser.ie?.nombre) && token) {
              try {
                const response = await fetch('/api/auth/me', {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                })
                
                if (response.ok) {
                  const userData = await response.json()
                  console.log('👤 Datos actualizados del servidor:', userData)
                  
                  // Actualizar localStorage con datos completos
                  localStorage.setItem('user', JSON.stringify(userData.user))
                  setUser(userData.user)
                }
              } catch (error) {
                console.log('⚠️ No se pudieron cargar datos adicionales del servidor:', error)
              }
            }
          } catch (error) {
            console.error('Error parsing user data:', error)
          }
        }
      }
    }
    
    loadUserData()
  }, [])

  const navigation = [
    {
      name: 'Dashboard',
      href: '/apoderado/dashboard',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z" />
        </svg>
      ),
    },
    {
      name: 'Retiros',
      href: '/apoderado/retiros',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
    },
    // TEMPORALMENTE OCULTO - Aprobar Retiros
    // {
    //   name: 'Aprobar Retiros',
    //   href: '/apoderado/retiros/aprobar',
    //   icon: (
    //     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
    //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    //     </svg>
    //   ),
    // },
    {
      name: 'Justificar Inasistencia',
      href: '/apoderado/justificaciones',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      name: 'Historial',
      href: '/apoderado/historial',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: 'Asistencias',
      href: '/apoderado/asistencias',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar móvil */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ease-linear duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setSidebarOpen(false)} />
        
        <div className={`relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-white transform transition ease-in-out duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" suppressHydrationWarning>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex-shrink-0 flex items-center px-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Portal Apoderado</p>
              </div>
            </div>
          </div>
          
          <div className="mt-5 flex-1 h-0 overflow-y-auto">
            <nav className="px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`${
                      isActive
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                  >
                    <div className={`${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'} mr-4 flex-shrink-0`}>
                      {item.icon}
                    </div>
                    {item.name}
                  </a>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow pt-5 bg-white overflow-y-auto border-r border-gray-200">
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Portal Apoderado</p>
              </div>
            </div>
          </div>
          
          <div className="mt-5 flex-grow flex flex-col">
            <nav className="flex-1 px-2 pb-4 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`${
                      isActive
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <div className={`${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'} mr-3 flex-shrink-0`}>
                      {item.icon}
                    </div>
                    {item.name}
                  </a>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" suppressHydrationWarning>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>
          
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" suppressHydrationWarning>
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  Portal Apoderado
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                {/* Campanita de notificaciones */}
                {mounted && user && (
                  <NotificationBell 
                    userRole="APODERADO" 
                    userId={user.id || user.idUsuario || '1'} 
                  />
                )}
                
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-900">
                      {mounted && user ? (() => {
                        console.log('🔍 Estructura del usuario apoderado:', {
                          nombre: user.nombre,
                          apellido: user.apellido,
                          'usuario.nombre': user.usuario?.nombre,
                          'usuario.apellido': user.usuario?.apellido,
                          keys: Object.keys(user)
                        })
                        // Obtener nombre y apellido reales del usuario
                        const nombre = user.nombre || user.usuario?.nombre || ''
                        const apellido = user.apellido || user.usuario?.apellido || ''
                        
                        if (nombre && apellido) {
                          return `${nombre} ${apellido}`
                        } else if (nombre) {
                          return nombre
                        } else if (apellido) {
                          return apellido
                        } else {
                          return 'Usuario Apoderado'
                        }
                      })() : 'Cargando...'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {mounted && user ? (() => {
                        // Obtener nombre real de la institución educativa
                        const institucion = user.ie?.nombre || 
                                           user.usuario?.ie?.nombre || 
                                           user.institucion?.nombre ||
                                           user.institucionEducativa?.nombre ||
                                           ''
                        return institucion || 'Institución no especificada'
                      })() : 'Cargando...'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    localStorage.removeItem('token')
                    localStorage.removeItem('user')
                    router.push('/login')
                  }}
                  className="p-2 text-gray-400 hover:text-gray-500"
                  title="Cerrar sesión"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <main className="flex-1">
          <div className="py-2">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
