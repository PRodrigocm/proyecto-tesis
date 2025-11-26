'use client'

import React, { useState, useEffect } from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'

// Iconos
const ClockIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const BookIcon = () => (
  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
)

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
    nivel: {
      idNivel: number
      nombre: string
    }
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
          // Verificar duplicados
          const ids = data.data.map((gs: any) => gs.idGradoSeccion)
          const uniqueIds = [...new Set(ids)]
          
          if (ids.length !== uniqueIds.length) {
            console.warn('⚠️ Se detectaron IDs duplicados en grados-secciones:', ids)
            console.warn('⚠️ IDs únicos:', uniqueIds)
          }
          
          // Filtrar duplicados si existen
          const uniqueGradosSecciones = data.data.filter((gs: any, index: number, self: any[]) => 
            index === self.findIndex((g: any) => g.idGradoSeccion === gs.idGradoSeccion)
          )
          
          setGradosSecciones(uniqueGradosSecciones)
          console.log('✅ Estado actualizado con', uniqueGradosSecciones.length, 'grados-secciones únicos')
          console.log('📋 Grados-secciones cargados:', uniqueGradosSecciones.map((gs: GradoSeccion) => `${gs.grado.nivel} - ${gs.grado.nombre}° ${gs.seccion.nombre}`))
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
      alert('Por favor selecciona un grado y sección o "Todos los grados y secciones"')
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
    
    // Log específico para la opción seleccionada
    if (formData.idGradoSeccion === 'TODOS') {
      console.log('🏫 Opción seleccionada: TODOS los grados y secciones')
      console.log('📊 Se aplicará a', gradosSecciones.length, 'grados-secciones')
    } else {
      const selected = gradosSecciones.find(gs => gs.idGradoSeccion.toString() === formData.idGradoSeccion)
      console.log('🎯 Grado-sección específico seleccionado:', selected ? `${selected.grado.nivel} - ${selected.grado.nombre}° ${selected.seccion.nombre}` : 'No encontrado')
    }
    
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

  const inputClass = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 transition-all"
  const selectClass = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 transition-all appearance-none cursor-pointer"

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader 
        icon={<ClockIcon />} 
        subtitle="Configura el horario base para las clases"
        variant="blue"
        onClose={onClose}
      >
        Crear Horario de Clases
      </ModalHeader>

      <ModalBody>
        <form id="create-horario-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Info Card */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookIcon />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-blue-900">Horario Base Simple</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Crea un horario fijo de <strong>Lunes a Viernes</strong> con el mismo horario todos los días.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Grado y Sección */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Grado y Sección <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="idGradoSeccion"
                  value={formData.idGradoSeccion}
                  onChange={handleInputChange}
                  className={selectClass}
                  required
                  disabled={loadingGrados}
                >
                  {loadingGrados ? (
                    <option value="">Cargando grados y secciones...</option>
                  ) : gradosSecciones.length === 0 ? (
                    <option value="">No hay grados disponibles</option>
                  ) : (
                    <>
                      <option value="">Seleccionar grado y sección...</option>
                      <option value="TODOS">Todos los grados y secciones</option>
                      {gradosSecciones.map((gs) => (
                        <option key={`grado-seccion-${gs.idGradoSeccion}`} value={gs.idGradoSeccion}>
                          {gs.grado.nivel.nombre} - {gs.grado.nombre}° {gs.seccion.nombre}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {loadingGrados && (
                <p className="text-sm text-blue-500 mt-1.5 flex items-center gap-1">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Cargando...
                </p>
              )}
              {!loadingGrados && gradosSecciones.length > 0 && (
                <p className="text-sm text-emerald-600 mt-1.5">{gradosSecciones.length} grados disponibles</p>
              )}
              {formData.idGradoSeccion === 'TODOS' && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Modo masivo:</strong> Se creará el mismo horario para todos los {gradosSecciones.length} grados.
                  </p>
                </div>
              )}
            </div>

            {/* Aula */}
            {formData.idGradoSeccion !== 'TODOS' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Aula</label>
                <input
                  type="text"
                  name="aula"
                  value={formData.aula}
                  onChange={handleInputChange}
                  className={inputClass}
                  placeholder="Ej: Aula 3A, Laboratorio"
                />
              </div>
            )}

            {/* Hora Inicio */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Hora de Inicio</label>
              <input
                type="time"
                name="horaInicio"
                value={formData.horaInicio}
                onChange={handleInputChange}
                step="900"
                className={inputClass}
              />
              <p className="text-xs text-slate-500 mt-1">Formato 24 horas</p>
            </div>

            {/* Hora Fin */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Hora de Fin</label>
              <input
                type="time"
                name="horaFin"
                value={formData.horaFin}
                onChange={handleInputChange}
                step="900"
                className={inputClass}
              />
              <p className="text-xs text-slate-500 mt-1">Formato 24 horas</p>
            </div>

            {/* Tolerancia */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tolerancia (minutos)</label>
              <input
                type="number"
                name="toleranciaMin"
                value={formData.toleranciaMin}
                onChange={handleInputChange}
                min="0"
                max="30"
                className={inputClass}
              />
            </div>
          </div>

          {/* Resumen */}
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
            <h4 className="text-sm font-semibold text-emerald-900 mb-3">Resumen del horario</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                <span className="text-slate-600">Días:</span>
                <span className="font-medium text-slate-900">Lunes a Viernes</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                <span className="text-slate-600">Horario:</span>
                <span className="font-medium text-slate-900">{formatearHora(formData.horaInicio)} - {formatearHora(formData.horaFin)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                <span className="text-slate-600">Tolerancia:</span>
                <span className="font-medium text-slate-900">{formData.toleranciaMin} min</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                <span className="text-slate-600">Tipo:</span>
                <span className="font-medium text-slate-900">Clase Regular</span>
              </div>
            </div>
          </div>
        </form>
      </ModalBody>

      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-5 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          form="create-horario-form"
          disabled={loading}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creando...
            </>
          ) : formData.idGradoSeccion === 'TODOS' ? 'Crear Horarios Masivos' : 'Crear Horario'}
        </button>
      </ModalFooter>
    </Modal>
  )
}
