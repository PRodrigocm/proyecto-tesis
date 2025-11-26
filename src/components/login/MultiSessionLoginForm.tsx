'use client'

import { useMultiLogin } from '@/hooks/useMultiLogin'
import { useMultiSession } from '@/hooks/useMultiSession'
import SessionManager from '@/components/SessionManager'

// Iconos
const MailIcon = () => (
  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const LockIcon = () => (
  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)

const BuildingIcon = () => (
  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

const UserIcon = () => (
  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const SchoolIcon = () => (
  <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
  </svg>
)

export function MultiSessionLoginForm() {
  const {
    formData,
    errors,
    isLoading,
    institucionesEducativas,
    roles,
    loadingData,
    activeSessions,
    sessionId,
    handleSubmit,
    handleChange,
  } = useMultiLogin()

  const { currentSession } = useMultiSession()

  const inputClass = "w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder-slate-400 transition-all"
  const selectClass = "w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 transition-all appearance-none cursor-pointer"

  // Si ya hay una sesión activa, mostrar el gestor de sesiones
  if (currentSession) {
    return (
      <div className="bg-white rounded-3xl shadow-2xl shadow-blue-500/10 p-8 md:p-10 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Sesión Activa</h2>
          <p className="text-slate-500 mt-1">Ya tienes una sesión iniciada</p>
        </div>
        
        <div className="space-y-4">
          <SessionManager showSessions={true} />
          
          <div className="pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-500 mb-4 text-center">
              ¿Quieres iniciar una nueva sesión?
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30"
            >
              Iniciar Nueva Sesión
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl shadow-2xl shadow-blue-500/10 p-8 md:p-10 w-full max-w-md">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl mb-4">
          <SchoolIcon />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Iniciar Sesión</h2>
        <p className="text-slate-500 mt-1">Sistema de Gestión Educativa</p>
        
        {/* Indicador de sesiones múltiples */}
        {activeSessions.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-sm text-blue-700">
              <span className="font-semibold">{activeSessions.length}</span> sesiones activas
            </p>
          </div>
        )}
        
        <p className="mt-2 text-xs text-slate-400">
          Pestaña: {sessionId.split('_')[2]?.substring(0, 8)}...
        </p>
      </div>

      {loadingData ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="text-slate-500 mt-3">Cargando...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2"><MailIcon /></div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={inputClass}
                placeholder="usuario@ejemplo.com"
                required
              />
            </div>
            {errors.email && <p className="text-red-500 text-sm mt-1.5">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2"><LockIcon /></div>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={inputClass}
                placeholder="••••••••"
                required
              />
            </div>
            {errors.password && <p className="text-red-500 text-sm mt-1.5">{errors.password}</p>}
          </div>

          {/* Institución Educativa */}
          <div>
            <label htmlFor="institucionEducativa" className="block text-sm font-medium text-slate-700 mb-2">
              Institución Educativa
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2"><BuildingIcon /></div>
              <select
                id="institucionEducativa"
                name="institucionEducativa"
                value={formData.institucionEducativa}
                onChange={handleChange}
                className={selectClass}
                required
              >
                <option value="">Seleccionar institución</option>
                {institucionesEducativas.map((institucion) => (
                  <option key={institucion.id} value={institucion.id}>
                    {institucion.nombre}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {errors.institucionEducativa && <p className="text-red-500 text-sm mt-1.5">{errors.institucionEducativa}</p>}
          </div>

          {/* Rol */}
          <div>
            <label htmlFor="rol" className="block text-sm font-medium text-slate-700 mb-2">
              Rol
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2"><UserIcon /></div>
              <select
                id="rol"
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                className={selectClass}
                required
              >
                <option value="">Seleccionar rol</option>
                {roles.map((rol) => (
                  <option key={rol.id} value={rol.nombre}>
                    {rol.nombre}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {errors.rol && <p className="text-red-500 text-sm mt-1.5">{errors.rol}</p>}
          </div>

          {/* Error general */}
          {errors.general && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {errors.general}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Iniciando sesión...
              </span>
            ) : (
              'Iniciar Sesión'
            )}
          </button>

          {/* Quick Login para desarrollo */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center mb-3">Acceso rápido (desarrollo)</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  handleChange({ target: { name: 'email', value: 'admin@colegio.edu' } } as any)
                  handleChange({ target: { name: 'password', value: 'admin123' } } as any)
                  handleChange({ target: { name: 'institucionEducativa', value: '1' } } as any)
                  handleChange({ target: { name: 'rol', value: 'ADMINISTRATIVO' } } as any)
                }}
                className="text-xs bg-slate-100 text-slate-600 py-2 px-3 rounded-lg hover:bg-slate-200 transition-colors font-medium"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  handleChange({ target: { name: 'email', value: 'docente@colegio.edu' } } as any)
                  handleChange({ target: { name: 'password', value: 'docente123' } } as any)
                  handleChange({ target: { name: 'institucionEducativa', value: '1' } } as any)
                  handleChange({ target: { name: 'rol', value: 'DOCENTE' } } as any)
                }}
                className="text-xs bg-slate-100 text-slate-600 py-2 px-3 rounded-lg hover:bg-slate-200 transition-colors font-medium"
              >
                Docente
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
