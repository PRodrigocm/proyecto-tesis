'use client'

import { useState } from 'react'
import { useSalones, CreateSalonData } from '@/hooks/useSalones'
import { useNiveles } from '@/hooks/useNiveles'

export default function CreateSalonForm() {
  const { createSalon } = useSalones()
  const { niveles, loading: nivelesLoading } = useNiveles()
  
  const [formData, setFormData] = useState<CreateSalonData>({
    nivelId: '',
    gradoNombre: '',
    seccionNombre: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await createSalon(formData)
      setSuccess(true)
      setFormData({
        nivelId: '',
        gradoNombre: '',
        seccionNombre: ''
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const gradosComunes = [
    'Primero', 'Segundo', 'Tercero', 'Cuarto', 'Quinto', 'Sexto',
    '1°', '2°', '3°', '4°', '5°', '6°'
  ]

  const seccionesComunes = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'
  ]

  if (nivelesLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Crear Nuevo Salón</h2>

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            Salón creado exitosamente
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nivel */}
          <div>
            <label htmlFor="nivelId" className="block text-sm font-medium text-gray-700 mb-1">
              Nivel *
            </label>
            <select
              id="nivelId"
              name="nivelId"
              value={formData.nivelId}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccione un nivel</option>
              {niveles.map((nivel) => (
                <option key={nivel.id} value={nivel.id}>
                  {nivel.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Grado */}
          <div>
            <label htmlFor="gradoNombre" className="block text-sm font-medium text-gray-700 mb-1">
              Grado *
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                id="gradoNombre"
                name="gradoNombre"
                value={formData.gradoNombre}
                onChange={handleInputChange}
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Primero, 1°, etc."
              />
              <select
                onChange={(e) => setFormData(prev => ({ ...prev, gradoNombre: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar</option>
                {gradosComunes.map((grado) => (
                  <option key={grado} value={grado}>
                    {grado}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sección */}
          <div>
            <label htmlFor="seccionNombre" className="block text-sm font-medium text-gray-700 mb-1">
              Sección *
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                id="seccionNombre"
                name="seccionNombre"
                value={formData.seccionNombre}
                onChange={handleInputChange}
                required
                maxLength={2}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: A, B, C, etc."
              />
              <select
                onChange={(e) => setFormData(prev => ({ ...prev, seccionNombre: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar</option>
                {seccionesComunes.map((seccion) => (
                  <option key={seccion} value={seccion}>
                    {seccion}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Vista previa */}
          {formData.nivelId && formData.gradoNombre && formData.seccionNombre && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Vista previa del salón:</h4>
              <p className="text-blue-700">
                <strong>
                  {niveles.find(n => n.id === formData.nivelId)?.nombre} - {formData.gradoNombre} "{formData.seccionNombre}"
                </strong>
              </p>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  nivelId: '',
                  gradoNombre: '',
                  seccionNombre: ''
                })
                setError(null)
                setSuccess(false)
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
              {loading ? 'Creando...' : 'Crear Salón'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
