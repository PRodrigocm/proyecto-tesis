'use client'

import { useMultiLogin } from '@/hooks/useMultiLogin'
import { useMultiSession } from '@/hooks/useMultiSession'
import SessionManager from '@/components/SessionManager'

export function MultiSessionLoginForm() {
  const {
    formData,
    errors,
    isLoading,
    showRoleSelection,
    institucionesEducativas,
    roles,
    loadingData,
    activeSessions,
    sessionId,
    handleSubmit,
    handleChange,
    handleBack
  } = useMultiLogin()

  const { currentSession } = useMultiSession()

  // Si ya hay una sesión activa, mostrar el gestor de sesiones
  if (currentSession) {
    return (
      <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Sesión Activa</h2>
          <p className="text-gray-600 mt-2">Ya tienes una sesión iniciada en esta pestaña</p>
        </div>
        
        <div className="space-y-4">
          <SessionManager showSessions={true} />
          
          <div className="border-t pt-4">
            <p className="text-sm text-gray-500 mb-4">
              ¿Quieres iniciar una nueva sesión en esta pestaña?
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Iniciar Nueva Sesión
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Iniciar Sesión</h2>
        <p className="text-gray-600 mt-2">Sistema de Gestión Educativa</p>
        
        {/* Indicador de sesiones múltiples */}
        {activeSessions.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Sesiones activas:</span> {activeSessions.length}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Puedes tener múltiples sesiones abiertas simultáneamente
            </p>
          </div>
        )}
        
        {/* ID de sesión para debugging */}
        <div className="mt-2 text-xs text-gray-400">
          Pestaña: {sessionId.split('_')[2]?.substring(0, 8)}...
        </div>
      </div>

      {loadingData ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Cargando...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="usuario@ejemplo.com"
              required
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="••••••••"
              required
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Institución Educativa */}
          <div>
            <label htmlFor="institucionEducativa" className="block text-sm font-medium text-gray-700 mb-1">
              Institución Educativa
            </label>
            <select
              id="institucionEducativa"
              name="institucionEducativa"
              value={formData.institucionEducativa}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              required
            >
              <option value="">Seleccionar institución</option>
              {institucionesEducativas.map((institucion) => (
                <option key={institucion.id} value={institucion.id}>
                  {institucion.nombre}
                </option>
              ))}
            </select>
            {errors.institucionEducativa && (
              <p className="text-red-500 text-sm mt-1">{errors.institucionEducativa}</p>
            )}
          </div>

          {/* Rol */}
          <div>
            <label htmlFor="rol" className="block text-sm font-medium text-gray-700 mb-1">
              Rol
            </label>
            <select
              id="rol"
              name="rol"
              value={formData.rol}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              required
            >
              <option value="">Seleccionar rol</option>
              {roles.map((rol) => (
                <option key={rol.id} value={rol.nombre}>
                  {rol.nombre}
                </option>
              ))}
            </select>
            {errors.rol && (
              <p className="text-red-500 text-sm mt-1">{errors.rol}</p>
            )}
          </div>

          {/* Error general */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-700 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Iniciando sesión...
              </div>
            ) : (
              'Iniciar Sesión'
            )}
          </button>

          {/* Quick Login para desarrollo */}
          <div className="border-t pt-4">
            <p className="text-xs text-gray-500 text-center mb-2">Acceso rápido (desarrollo)</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  handleChange({ target: { name: 'email', value: 'admin@colegio.edu' } } as any)
                  handleChange({ target: { name: 'password', value: 'admin123' } } as any)
                  handleChange({ target: { name: 'institucionEducativa', value: '1' } } as any)
                  handleChange({ target: { name: 'rol', value: 'ADMINISTRATIVO' } } as any)
                }}
                className="text-xs bg-gray-100 text-gray-700 py-1 px-2 rounded hover:bg-gray-200"
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
                className="text-xs bg-gray-100 text-gray-700 py-1 px-2 rounded hover:bg-gray-200"
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
