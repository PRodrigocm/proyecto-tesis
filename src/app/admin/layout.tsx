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

// Iconos modernos como componentes
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
  </svg>
)

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const SchoolIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const ExitIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
)

const ReportsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

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
      icon: DashboardIcon,
      current: pathname === '/admin'
    },
    {
      name: 'Usuarios',
      href: '/admin/dashboard/usuarios',
      icon: UsersIcon,
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
      icon: SchoolIcon,
      current: pathname === '/admin/dashboard/salones'
    },
    {
      name: 'Calendario',
      href: '/admin/dashboard/calendarios/ano-lectivo',
      icon: CalendarIcon,
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
      icon: ExitIcon,
      current: pathname === '/admin/dashboard/retiros'
    },
    {
      name: 'Reportes',
      href: '/admin/dashboard/reportes',
      icon: ReportsIcon,
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
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      {/* Sidebar - Diseño moderno con gradiente */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:flex lg:flex-col`}>
        {/* Logo y título */}
        <div className="flex items-center gap-3 h-20 px-6 border-b border-slate-700/50">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Panel Admin</h1>
            <p className="text-xs text-slate-400">Sistema de Gestión</p>
          </div>
        </div>
        
        {/* Navegación */}
        <nav className="flex-1 mt-6 px-4 overflow-y-auto">
          <div className="space-y-1">
            {navigation.map((item) => {
              const IconComponent = item.icon
              return (
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
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                          item.current
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                            : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                        }`}
                      >
                        <span className={`mr-3 ${item.current ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`}>
                          <IconComponent />
                        </span>
                        {item.name}
                        <ChevronIcon isOpen={(item.name === 'Usuarios' && openUsers) || (item.name === 'Calendario' && openCalendario)} />
                      </button>
                      {((item.name === 'Usuarios' && openUsers) || (item.name === 'Calendario' && openCalendario)) && (
                        <div className="ml-4 mt-2 space-y-1 border-l-2 border-slate-700 pl-4">
                          {item.children.map((child) => (
                            <div key={child.name}>
                              <Link
                                href={child.href}
                                className={`block px-4 py-2.5 text-sm rounded-lg transition-all duration-200 ${
                                  child.current
                                    ? 'bg-indigo-500/20 text-indigo-300 font-medium border-l-2 border-indigo-400 -ml-[2px] pl-[14px]'
                                    : 'text-slate-400 hover:bg-slate-700/30 hover:text-slate-200'
                                }`}
                              >
                                {child.name}
                              </Link>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                        item.current
                          ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                          : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                      }`}
                    >
                      <span className={`mr-3 ${item.current ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`}>
                        <IconComponent />
                      </span>
                      {item.name}
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </nav>

        {/* Usuario en sidebar */}
        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800/50">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-lg">
              {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.nombre} {user?.apellido}</p>
              <p className="text-xs text-slate-400 truncate">{user?.rol}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar - Diseño moderno */}
        <header className="flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <span className="sr-only">Abrir menú</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          {/* Separador */}
          <div className="hidden lg:block h-6 w-px bg-slate-200" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            {/* Breadcrumb o título de página */}
            <div className="flex flex-1 items-center">
              <h2 className="text-lg font-semibold text-slate-800 hidden sm:block">
                {pathname === '/admin' && 'Dashboard'}
                {pathname.includes('/usuarios') && 'Gestión de Usuarios'}
                {pathname.includes('/salones') && 'Gestión de Salones'}
                {pathname.includes('/calendarios') && 'Calendario Escolar'}
                {pathname.includes('/horarios') && 'Horarios de Clases'}
                {pathname.includes('/retiros') && 'Gestión de Retiros'}
                {pathname.includes('/reportes') && 'Reportes'}
              </h2>
            </div>
            
            <div className="flex items-center gap-x-3 lg:gap-x-4">
              {/* Campanita de notificaciones */}
              <NotificationBell 
                userRole={user?.rol || 'ADMINISTRATIVO'} 
                userId={user?.id || '1'} 
              />
              
              {/* Separador */}
              <div className="hidden lg:block h-6 w-px bg-slate-200" />
              
              {/* Botón de cerrar sesión */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Session Debugger - Solo en desarrollo */}
      <SessionDebugger />
    </div>
  )
}
