'use client'

import { useState } from 'react'
import { useCreateUser, CreateUserData } from '@/hooks/useCreateUser'
import { useRoles } from '@/hooks/useRoles'
import { useInstitucionesEducativas } from '@/hooks/useInstitucionesEducativas'

export default function CreateUserForm() {
  const { createUser, loading, error, success, resetState } = useCreateUser()
  const { roles, loading: rolesLoading } = useRoles()
  const { institucionesEducativas, loading: institutionsLoading } = useInstitucionesEducativas()

  const [formData, setFormData] = useState<CreateUserData>({
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: '',
    institucionEducativa: '',
    roles: [],
    especialidad: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleRoleChange = (roleId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      roles: checked 
        ? [...prev.roles, roleId]
        : prev.roles.filter(id => id !== roleId)
    }))
  }

  // Helper functions to determine field requirements based on selected roles
  const getSelectedRoleNames = () => {
    return roles.filter(role => formData.roles.includes(role.id)).map(role => role.nombre)
  }

  const isEstudianteOnly = () => {
    const selectedRoles = getSelectedRoleNames()
    return selectedRoles.length === 1 && selectedRoles.includes('ESTUDIANTE')
  }

  const hasDocenteRole = () => {
    return getSelectedRoleNames().includes('DOCENTE')
  }

  const requiresEmailPhone = () => {
    const selectedRoles = getSelectedRoleNames()
    return selectedRoles.some(role => ['APODERADO', 'DOCENTE', 'ADMIN', 'ADMINISTRATIVO'].includes(role))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    resetState()

    const result = await createUser(formData)
    if (result) {
      // Reset form on success
      setFormData({
        nombre: '',
        apellido: '',
        dni: '',
        email: '',
        telefono: '',
        password: '',
        confirmPassword: '',
        institucionEducativa: '',
        roles: [],
        especialidad: ''
      })
    }
  }

  if (rolesLoading || institutionsLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Crear Nuevo Usuario</h2>

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            Usuario creado exitosamente
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Personal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ingrese el nombre"
              />
            </div>

            <div>
              <label htmlFor="apellido" className="block text-sm font-medium text-gray-700 mb-1">
                Apellido *
              </label>
              <input
                type="text"
                id="apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ingrese el apellido"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dni" className="block text-sm font-medium text-gray-700 mb-1">
                DNI *
              </label>
              <input
                type="text"
                id="dni"
                name="dni"
                value={formData.dni}
                onChange={handleInputChange}
                required
                maxLength={8}
                pattern="[0-9]{8}"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="12345678"
              />
            </div>

            {requiresEmailPhone() && (
              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono {requiresEmailPhone() ? '*' : ''}
                </label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  required={requiresEmailPhone()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="987654321"
                />
              </div>
            )}
          </div>

          {requiresEmailPhone() && (
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required={requiresEmailPhone()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="usuario@ejemplo.com"
              />
            </div>
          )}

          {/* Contraseñas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Contraseña *
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Repita la contraseña"
              />
            </div>
          </div>

          {/* Institución Educativa */}
          <div>
            <label htmlFor="institucionEducativa" className="block text-sm font-medium text-gray-700 mb-1">
              Institución Educativa *
            </label>
            <select
              id="institucionEducativa"
              name="institucionEducativa"
              value={formData.institucionEducativa}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccione una institución</option>
              {institucionesEducativas.map((ie) => (
                <option key={ie.id} value={ie.id}>
                  {ie.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Roles */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Roles * (Seleccione al menos uno)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {roles.map((role) => (
                <div key={role.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`role-${role.id}`}
                    checked={formData.roles.includes(role.id)}
                    onChange={(e) => handleRoleChange(role.id, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`role-${role.id}`} className="ml-2 text-sm text-gray-700">
                    <span className="font-medium">{role.nombre}</span>
                    {role.descripcion && (
                      <span className="text-gray-500 block text-xs">{role.descripcion}</span>
                    )}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Campo Especialidad para Docentes */}
          {hasDocenteRole() && (
            <div>
              <label htmlFor="especialidad" className="block text-sm font-medium text-gray-700 mb-1">
                Especialidad *
              </label>
              <input
                type="text"
                id="especialidad"
                name="especialidad"
                value={formData.especialidad}
                onChange={handleInputChange}
                required={hasDocenteRole()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Matemáticas, Ciencias, Historia, etc."
              />
            </div>
          )}

          {/* Información sobre campos requeridos según rol */}
          {formData.roles.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Campos requeridos según rol seleccionado:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                {isEstudianteOnly() && (
                  <li>• <strong>Estudiante:</strong> Solo nombre, apellido, DNI, contraseña e institución</li>
                )}
                {requiresEmailPhone() && (
                  <li>• <strong>Apoderado/Docente/Admin:</strong> Se requiere email y teléfono</li>
                )}
                {hasDocenteRole() && (
                  <li>• <strong>Docente:</strong> Se requiere especialidad</li>
                )}
              </ul>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  nombre: '',
                  apellido: '',
                  dni: '',
                  email: '',
                  telefono: '',
                  password: '',
                  confirmPassword: '',
                  institucionEducativa: '',
                  roles: [],
                  especialidad: ''
                })
                resetState()
              }}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Limpiar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
