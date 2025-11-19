'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, isAuthenticated, logoutCurrentSession } from '@/lib/multiSessionManager'
import SessionDebugger from '@/components/dev/SessionDebugger'
import NotificationBell from '@/components/NotificationBell'

interface User {
  id: string
  nombre: string
  apellido: string
  email: string
  rol: string
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openUsers, setOpenUsers] = useState(false)
  const [openCalendario, setOpenCalendario] = useState(
    pathname.startsWith('/admin/dashboard/calendarios') || pathname.startsWith('/admin/dashboard/horarios')
  )

  useEffect(() => {
    // Verificar autenticación usando el sistema de múltiples sesiones transparente
    if (!isAuthenticated()) {
      console.log('❌ Admin Layout - No authenticated session, redirecting to login')
      router.push('/login')
      return
    }

    const userData = getCurrentUser()
    if (!userData || userData.rol !== 'ADMINISTRATIVO') {
      console.log('❌ Admin Layout - Invalid role or no user, redirecting to login')
      router.push('/login')
      return
    }

    setUser(userData)
    console.log('✅ Admin Layout - Multi-session authenticated as:', userData.rol)
  }, [router])

  // Actualizar estados de menús desplegables basado en la ruta actual
  useEffect(() => {
    setOpenUsers(pathname.startsWith('/admin/dashboard/usuarios'))
    setOpenCalendario(pathname.startsWith('/admin/dashboard/calendarios') || pathname.startsWith('/admin/dashboard/horarios'))
  }, [pathname])

  const handleLogout = () => {
    logoutCurrentSession()
    router.push('/login')
  }

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: '📊',
      current: pathname === '/admin'
    },
    {
      name: 'Usuarios',
      href: '/admin/dashboard/usuarios',
      icon: '👥',
      current: pathname === '/admin/dashboard/usuarios',
      children: [
        {
          name: 'Apoderados',
          href: '/admin/dashboard/usuarios/apoderados',
          current: pathname === '/admin/dashboard/usuarios/apoderados'
        },
        {
          name: 'Docentes',
          href: '/admin/dashboard/usuarios/docentes',
          current: pathname === '/admin/dashboard/usuarios/docentes'
        },
        {
          name: 'Administrativos',
          href: '/admin/dashboard/usuarios/administrativos',
          current: pathname === '/admin/dashboard/usuarios/administrativos'
        },
        {
          name: 'Estudiantes',
          href: '/admin/dashboard/usuarios/estudiantes',
          current: pathname === '/admin/dashboard/usuarios/estudiantes'
        },
        {
          name: 'Auxiliares',
          href: '/admin/dashboard/usuarios/auxiliares',
          current: pathname === '/admin/dashboard/usuarios/auxiliares'
        }
      ]
    },
    {
      name: 'Salones',
      href: '/admin/dashboard/salones',
      icon: '🏫',
      current: pathname === '/admin/dashboard/salones'
    },
    {
      name: 'Calendario',
      href: '/admin/dashboard/calendarios/ano-lectivo',
      icon: '📅',
      current: pathname.startsWith('/admin/dashboard/calendarios') || pathname.startsWith('/admin/dashboard/horarios'),
      children: [
        {
          name: 'Año Lectivo',
          href: '/admin/dashboard/calendarios/ano-lectivo',
          current: pathname === '/admin/dashboard/calendarios/ano-lectivo',
          description: 'Gestiona el calendario escolar anual, feriados y suspensiones'
        },
        {
          name: 'Horario Clases',
          href: '/admin/dashboard/horarios/clases',
          current: pathname === '/admin/dashboard/horarios/clases',
          description: 'Administra horarios de clases, excepciones y suspensiones'
        },
      ]
    },
    {
      name: 'Retiros',
      href: '/admin/dashboard/retiros',
      icon: '🚪',
      current: pathname === '/admin/dashboard/retiros'
    },
    {
      name: 'Reportes',
      href: '/admin/dashboard/reportes',
      icon: '📈',
      current: pathname === '/admin/dashboard/reportes'
    }
  ]

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:flex lg:flex-col`}>
        <div className="flex items-center justify-center h-16 px-4 bg-indigo-600">
          <h1 className="text-xl font-bold text-white">Panel Admin</h1>
        </div>
        
        <nav className="mt-8 px-4">
          <div className="space-y-2">
            {navigation.map((item) => (
              <div key={item.name}>
                {item.children ? (
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        if (item.name === 'Usuarios') {
                          setOpenUsers(!openUsers)
                        } else if (item.name === 'Calendario') {
                          setOpenCalendario(!openCalendario)
                        }
                      }}
                      className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        item.current
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.name}
                      <svg
                        className={`ml-auto h-4 w-4 transform transition-transform ${
                          (item.name === 'Usuarios' && openUsers) || (item.name === 'Calendario' && openCalendario) 
                            ? 'rotate-90' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    {((item.name === 'Usuarios' && openUsers) || (item.name === 'Calendario' && openCalendario)) && (
                      <div className="ml-8 space-y-1 mt-1">
                        {item.children.map((child) => (
                          <div key={child.name}>
                            <Link
                              href={child.href}
                              className={`block px-4 py-2 text-sm rounded-lg transition-colors ${
                                child.current
                                  ? 'bg-indigo-100 text-indigo-700 font-medium'
                                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                              }`}
                            >
                              {child.name}
                            </Link>
                            {'description' in child && child.description && (
                              <p className="ml-4 text-xs text-gray-500 mt-1 mb-2">
                                {child.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      item.current
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <span className="sr-only">Open sidebar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Campanita de notificaciones */}
              <NotificationBell 
                userRole={user?.rol || 'ADMINISTRATIVO'} 
                userId={user?.id || '1'} 
              />
              
              <div className="flex items-center gap-x-4">
                <span className="text-sm font-medium text-gray-700">
                  {user?.nombre} {user?.apellido}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Session Debugger - Solo en desarrollo */}
      <SessionDebugger />
    </div>
  )
}
