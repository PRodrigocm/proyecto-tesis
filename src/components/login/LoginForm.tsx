'use client'

import { useLogin } from '@/hooks/useLogin'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

export const LoginForm = () => {
  const {
    formData,
    errors,
    isLoading,
    showRoleSelection,
    institucionesEducativas,
    roles,
    loadingData,
    handleSubmit,
    handleChange,
    handleBack
  } = useLogin()

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Iniciar Sesión
        </h2>
        <p className="text-gray-600">
          Ingresa tus credenciales para acceder
        </p>
      </div>

      {errors.general && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.general}</p>
        </div>
      )}

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="tu@email.com"
            autoComplete="email"
            error={errors.email}
            label="Email"
          />

          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password}
            label="Contraseña"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Recordarme
            </label>
          </div>

          <div className="text-sm">
            <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          loading={isLoading}
          className="w-full"
        >
          Iniciar Sesión
        </Button>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Sistema de Control de Asistencia Escolar
          </p>
        </div>
      </form>
    </div>
  )
}
