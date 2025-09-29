'use client'

import { useState, useEffect } from 'react'
// import { XMarkIcon } from '@heroicons/react/24/outline'

interface Estudiante {
  id: string
  nombre: string
  apellido: string
  dni: string
  grado: string
  seccion: string
  estado: 'ACTIVO' | 'INACTIVO' | 'RETIRADO'
}

interface CreateApoderadoModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface HijoRelacion {
  estudianteId: string
  parentesco: string
  esTitular: boolean
}

export default function CreateApoderadoModal({ isOpen, onClose, onSuccess }: CreateApoderadoModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    dni: '',
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    ocupacion: '',
    password: ''
  })
  
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [loadingEstudiantes, setLoadingEstudiantes] = useState(false)
  const [hijosRelaciones, setHijosRelaciones] = useState<HijoRelacion[]>([
    { estudianteId: '', parentesco: 'PADRE', esTitular: false }
  ])

  // Cargar estudiantes cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadEstudiantes()
    }
  }, [isOpen])

  // Cargar estudiantes cuando se abre el modal
  const loadEstudiantes = async () => {
    setLoadingEstudiantes(true)
    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) return

      const user = JSON.parse(userStr)
      const ieId = user.idIe || user.institucionId || 1
      const token = localStorage.getItem('token')

      const response = await fetch(`/api/estudiantes?ieId=${ieId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setEstudiantes(data.data || [])
      }
    } catch (error) {
      console.error('Error loading estudiantes:', error)
    } finally {
      setLoadingEstudiantes(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        alert('Error: No se encontró información del usuario')
        return
      }

      const user = JSON.parse(userStr)
      const ieId = user.idIe || user.institucionId || 1
      const token = localStorage.getItem('token')

      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          ieId,
          rol: 'APODERADO',
          apoderado: {
            ocupacion: formData.ocupacion
          },
          // Relaciones con estudiantes (múltiples hijos)
          hijosRelaciones: hijosRelaciones.filter(hijo => hijo.estudianteId).map(hijo => ({
            estudianteId: parseInt(hijo.estudianteId),
            parentesco: hijo.parentesco,
            esTitular: hijo.esTitular
          }))
        })
      })

      if (response.ok) {
        alert('Apoderado creado exitosamente')
        onSuccess()
        onClose()
        setFormData({
          dni: '',
          nombre: '',
          apellido: '',
          email: '',
          telefono: '',
          ocupacion: '',
          password: ''
        })
        setHijosRelaciones([
          { estudianteId: '', parentesco: 'PADRE', esTitular: false }
        ])
      } else {
        const error = await response.json()
        alert(`Error: ${error.message || 'No se pudo crear el apoderado'}`)
      }
    } catch (error) {
      console.error('Error creating apoderado:', error)
      alert('Error al crear el apoderado')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const agregarHijo = () => {
    setHijosRelaciones(prev => [
      ...prev,
      { estudianteId: '', parentesco: 'PADRE', esTitular: false }
    ])
  }

  const eliminarHijo = (index: number) => {
    if (hijosRelaciones.length > 1) {
      setHijosRelaciones(prev => prev.filter((_, i) => i !== index))
    }
  }

  const handleHijoChange = (index: number, field: keyof HijoRelacion, value: string | boolean) => {
    setHijosRelaciones(prev => prev.map((hijo, i) => {
      if (i === index) {
        // Si se marca como titular, desmarcar todos los demás
        if (field === 'esTitular' && value === true) {
          const updatedRelaciones = prev.map((h, idx) => ({
            ...h,
            esTitular: idx === index
          }))
          return { ...hijo, [field]: value }
        }
        return { ...hijo, [field]: value }
      }
      // Si se está marcando otro como titular, desmarcar este
      if (field === 'esTitular' && value === true) {
        return { ...hijo, esTitular: false }
      }
      return hijo
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center pb-3">
          <h3 className="text-lg font-bold text-gray-900">Crear Nuevo Apoderado</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">DNI *</label>
              <input
                type="text"
                name="dni"
                value={formData.dni}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-4 py-3 text-black bg-white border-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                placeholder="12345678"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-4 py-3 text-black bg-white border-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Nombre *</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-4 py-3 text-black bg-white border-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Apellido *</label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-4 py-3 text-black bg-white border-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Teléfono *</label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-4 py-3 text-black bg-white border-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
              />
            </div>


            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Ocupación</label>
              <input
                type="text"
                name="ocupacion"
                value={formData.ocupacion}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 text-black bg-white border-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                placeholder="Profesión u ocupación"
              />
            </div>


            {/* Sección de hijos múltiples */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-3 border-t pt-4">
                <h4 className="text-md font-medium text-gray-900">
                  Hijos (Opcional)
                </h4>
                <button
                  type="button"
                  onClick={agregarHijo}
                  className="flex items-center space-x-1 px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Agregar Hijo</span>
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Puedes asignar múltiples hijos al apoderado. Solo uno puede ser titular (autorizar retiros).
              </p>
            </div>

            <div className="md:col-span-2 space-y-4">
              {hijosRelaciones.map((hijo, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-medium text-gray-800">
                      Hijo {index + 1}
                    </h5>
                    {hijosRelaciones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => eliminarHijo(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Selector de Estudiante */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Seleccionar Estudiante
                      </label>
                      <select
                        value={hijo.estudianteId}
                        onChange={(e) => handleHijoChange(index, 'estudianteId', e.target.value)}
                        className="w-full px-3 py-2 text-black bg-white border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                        disabled={loadingEstudiantes}
                      >
                        <option value="">Seleccionar estudiante...</option>
                        {estudiantes.map((estudiante) => (
                          <option key={estudiante.id} value={estudiante.id}>
                            {estudiante.nombre} {estudiante.apellido} - {estudiante.grado}° {estudiante.seccion} - DNI: {estudiante.dni}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Selector de Parentesco */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Parentesco
                      </label>
                      <select
                        value={hijo.parentesco}
                        onChange={(e) => handleHijoChange(index, 'parentesco', e.target.value)}
                        className="w-full px-3 py-2 text-black bg-white border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                        disabled={!hijo.estudianteId}
                      >
                        <option value="PADRE">Padre</option>
                        <option value="MADRE">Madre</option>
                        <option value="TUTOR">Tutor Legal</option>
                        <option value="ABUELO">Abuelo</option>
                        <option value="ABUELA">Abuela</option>
                        <option value="TIO">Tío</option>
                        <option value="TIA">Tía</option>
                        <option value="OTRO">Otro</option>
                      </select>
                    </div>
                  </div>

                  {/* Checkbox Es Titular */}
                  {hijo.estudianteId && (
                    <div className="mt-3">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hijo.esTitular}
                          onChange={(e) => handleHijoChange(index, 'esTitular', e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Es titular (puede autorizar retiros)
                        </span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Solo un apoderado puede ser titular por estudiante
                      </p>
                    </div>
                  )}
                </div>
              ))}
              
              {loadingEstudiantes && (
                <p className="text-sm text-gray-500 text-center">Cargando estudiantes...</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-base font-semibold text-gray-800 mb-2">Contraseña *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-4 py-3 text-black bg-white border-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear Apoderado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
