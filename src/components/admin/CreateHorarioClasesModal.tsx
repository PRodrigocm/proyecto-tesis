'use client'

import React, { useState, useEffect } from 'react'

interface CreateHorarioClasesModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => Promise<boolean>
}

interface GradoSeccion {
  idGradoSeccion: number
  grado: {
    idGrado: number
    nombre: string
  }
  seccion: {
    idSeccion: number
    nombre: string
  }
}

export default function CreateHorarioClasesModal({ isOpen, onClose, onSave }: CreateHorarioClasesModalProps) {
  const [loading, setLoading] = useState(false)
  const [gradosSecciones, setGradosSecciones] = useState<GradoSeccion[]>([])
  const [loadingGrados, setLoadingGrados] = useState(false)
  
  const [formData, setFormData] = useState({
    idGradoSeccion: '',
    horaInicio: '08:00',
    horaFin: '13:30',
    aula: '',
    toleranciaMin: '10'
  })

  useEffect(() => {
    if (isOpen) {
      console.log('🔓 Modal abierto, verificando autenticación...')
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')
      
      if (!token) {
        console.error('❌ No hay token en localStorage')
        alert('No hay sesión activa. Por favor, inicia sesión.')
        onClose()
        return
      }
      
      if (!user) {
        console.error('❌ No hay información de usuario')
        alert('Información de usuario no encontrada. Por favor, inicia sesión nuevamente.')
        onClose()
        return
      }
      
      console.log('✅ Token y usuario encontrados')
      console.log('👤 Usuario:', JSON.parse(user))
      
      loadGradosSecciones()
    }
  }, [isOpen])

  const loadGradosSecciones = async () => {
    console.log('📚 === CARGANDO GRADOS Y SECCIONES ===')
    setLoadingGrados(true)
    try {
      const token = localStorage.getItem('token')
      console.log('🔑 Token para grados:', token ? 'Disponible' : 'NO disponible')
      
      // Intentar sin token primero (la API no requiere auth)
      const response = await fetch('/api/grados-secciones?ieId=1')

      console.log('📡 Response grados-secciones:', response.status, response.statusText)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Grados-secciones cargados:', data)
        console.log('📊 Total encontrados:', data.data?.length || 0)
        
        if (data.data && data.data.length > 0) {
          setGradosSecciones(data.data)
          console.log('✅ Estado actualizado con', data.data.length, 'grados-secciones')
        } else {
          console.log('⚠️ No se encontraron grados-secciones')
          setGradosSecciones([])
        }
      } else {
        const errorText = await response.text()
        console.error('❌ Error cargando grados-secciones:', errorText)
        setGradosSecciones([])
      }
    } catch (error) {
      console.error('💥 Error loading grados y secciones:', error)
      setGradosSecciones([])
    } finally {
      setLoadingGrados(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('🎯 === INICIANDO ENVÍO DE FORMULARIO ===')
    console.log('📋 Datos del formulario:', formData)
    
    // DEBUG: Verificar token
    const token = localStorage.getItem('token')
    console.log('🔑 Token disponible:', token ? 'SÍ' : 'NO')
    if (token) {
      console.log('🔑 Token (primeros 20 chars):', token.substring(0, 20) + '...')
    }
    
    // DEBUG: Verificar grados-secciones cargados
    console.log('📚 Grados-secciones disponibles:', gradosSecciones.length)
    console.log('📚 Grados-secciones:', gradosSecciones)
    
    if (!formData.idGradoSeccion) {
      console.error('❌ Validación: Grado y sección no seleccionados')
      alert('Por favor selecciona un grado y sección')
      return
    }

    if (!formData.horaInicio || !formData.horaFin) {
      console.error('❌ Validación: Horas no especificadas')
      alert('Por favor especifica las horas de inicio y fin')
      return
    }

    // Validar que hora inicio sea menor que hora fin
    if (formData.horaInicio >= formData.horaFin) {
      console.error('❌ Validación: Hora inicio >= hora fin', {
        horaInicio: formData.horaInicio,
        horaFin: formData.horaFin
      })
      alert('La hora de inicio debe ser menor que la hora de fin')
      return
    }
    console.log('✅ Todas las validaciones pasaron')
    console.log('🚀 Enviando datos al hook...')

    setLoading(true)
    try {
      console.log('🎯 Llamando a onSave con datos:', formData)
      const success = await onSave(formData)
      
      console.log('📡 Respuesta del hook:', success)
      console.log('📡 Tipo de respuesta:', typeof success)
      
      if (typeof success === 'boolean' && success === true) {
        console.log('✅ === HORARIO CREADO EXITOSAMENTE ===')
        console.log('🧹 Limpiando formulario...')
        resetForm()
        console.log('🚪 Cerrando modal...')
        onClose()
      } else {
        console.error('❌ === ERROR AL CREAR HORARIO ===')
        console.error('💥 El hook retornó:', success)
        console.error('💥 Tipo:', typeof success)
        alert('Error al crear el horario. Revisa los logs para más detalles.')
      }
    } catch (error) {
      console.error('💥 === ERROR CAPTURADO EN MODAL ===')
      console.error('Error details:', error)
      console.error('Error message:', error instanceof Error ? error.message : 'Error desconocido')
      alert(`Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      console.log('🏁 Finalizando envío - loading = false')
      setLoading(false)
    }
  }
  const resetForm = () => {
    setFormData({
      idGradoSeccion: '',
      horaInicio: '08:00',
      horaFin: '13:30',
      aula: '',
      toleranciaMin: '10'
    })
  }

  // Función para formatear hora en formato 24h
  const formatearHora = (hora: string) => {
    if (!hora) return 'No especificada'
    // Asegurar formato 24h (HH:MM)
    const [hours, minutes] = hora.split(':')
    const h = parseInt(hours, 10)
    const m = parseInt(minutes, 10)
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            📚 Crear Horario de Clases Anual
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Cerrar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">📚 Horario Base Simple</h4>
            <p className="text-sm text-blue-700">
              Crea un horario fijo de <strong>Lunes a Viernes</strong> con el mismo horario todos los días.
              Perfecto para tu concepto de horario base que solo cambia por resolución o decisión del director.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grado y Sección *
              </label>
              <select
                name="idGradoSeccion"
                value={formData.idGradoSeccion}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                required
                disabled={loadingGrados}
              >
                {loadingGrados ? (
                  <option value="">🔄 Cargando grados y secciones...</option>
                ) : gradosSecciones.length === 0 ? (
                  <option value="">❌ No hay grados disponibles</option>
                ) : (
                  <>
                    <option value="">📚 Seleccionar grado y sección...</option>
                    {gradosSecciones.map((gs) => (
                      <option key={gs.idGradoSeccion} value={gs.idGradoSeccion}>
                        {gs.grado.nombre}° {gs.seccion.nombre}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {loadingGrados && (
                <p className="text-sm text-blue-500 mt-1">🔄 Cargando grados y secciones...</p>
              )}
              {!loadingGrados && gradosSecciones.length === 0 && (
                <p className="text-sm text-red-500 mt-1">❌ No se encontraron grados y secciones. Verifica la configuración.</p>
              )}
              {!loadingGrados && gradosSecciones.length > 0 && (
                <p className="text-sm text-green-600 mt-1">✅ {gradosSecciones.length} grados disponibles</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aula
              </label>
              <input
                type="text"
                name="aula"
                value={formData.aula}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="Ej: Aula 3A, Laboratorio, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora de Inicio
              </label>
              <input
                type="time"
                name="horaInicio"
                value={formData.horaInicio}
                onChange={handleInputChange}
                step="900"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
              <p className="text-xs text-gray-500 mt-1">Formato 24 horas (ej: 08:00)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora de Fin
              </label>
              <input
                type="time"
                name="horaFin"
                value={formData.horaFin}
                onChange={handleInputChange}
                step="900"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
              <p className="text-xs text-gray-500 mt-1">Formato 24 horas (ej: 13:30)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tolerancia (minutos)
              </label>
              <input
                type="number"
                name="toleranciaMin"
                value={formData.toleranciaMin}
                onChange={handleInputChange}
                min="0"
                max="30"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="text-sm font-medium text-green-800 mb-2">✅ Lo que se creará:</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• <strong>Lunes a Viernes:</strong> {formatearHora(formData.horaInicio)} - {formatearHora(formData.horaFin)}</li>
              <li>• <strong>Aula:</strong> {formData.aula || 'Sin especificar'}</li>
              <li>• <strong>Tolerancia:</strong> {formData.toleranciaMin} minutos</li>
              <li>• <strong>Tipo:</strong> Clase Regular (horario base)</li>
            </ul>
            <p className="text-xs text-green-600 mt-2">
              💡 Para feriados, suspensiones o cambios temporales, usa el módulo de "Excepciones de Horario"
            </p>
          </div>

          {/* Botones */}
          <div className="flex justify-end items-center pt-4 border-t">
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Creando...' : 'Crear Horario Base'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
