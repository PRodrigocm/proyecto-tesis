'use client'

import React, { useState, useEffect } from 'react'

interface Grado {
  idGrado: number
  nombre: string
  nivel: {
    nombre: string
  }
}

interface Seccion {
  idSeccion: number
  nombre: string
}

interface ProgramarReunionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (reunionData: {
    titulo: string
    descripcion?: string
    fecha: string
    horaInicio: string
    horaFin?: string
    tipoReunion: 'GENERAL' | 'POR_GRADO' | 'POR_AULA'
    idGrado?: number
    idSeccion?: number
    metodoRegistro: 'QR' | 'MANUAL'
  }) => Promise<void>
}

export default function ProgramarReunionModal({ isOpen, onClose, onSubmit }: ProgramarReunionModalProps) {
  const [loading, setLoading] = useState(false)
  const [grados, setGrados] = useState<Grado[]>([])
  const [secciones, setSecciones] = useState<Seccion[]>([])
  const [loadingData, setLoadingData] = useState(false)

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    tipoReunion: 'GENERAL' as 'GENERAL' | 'POR_GRADO' | 'POR_AULA',
    idGrado: '',
    idSeccion: '',
    metodoRegistro: 'MANUAL' as 'QR' | 'MANUAL'
  })

  useEffect(() => {
    if (isOpen) {
      loadData()
      // Establecer fecha actual por defecto
      const today = new Date().toISOString().split('T')[0]
      setFormData(prev => ({ ...prev, fecha: today }))
    }
  }, [isOpen])

  const loadData = async () => {
    setLoadingData(true)
    try {
      const token = localStorage.getItem('token')
      
      // Cargar grados
      const gradosRes = await fetch('/api/grados?ieId=1', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (gradosRes.ok) {
        const data = await gradosRes.json()
        setGrados(data.data || [])
      }

      // Cargar secciones
      const seccionesRes = await fetch('/api/secciones', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (seccionesRes.ok) {
        const data = await seccionesRes.json()
        setSecciones(data.data || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.titulo || !formData.fecha || !formData.horaInicio) {
      alert('Por favor completa los campos requeridos')
      return
    }

    setLoading(true)
    try {
      await onSubmit({
        titulo: formData.titulo,
        descripcion: formData.descripcion || undefined,
        fecha: formData.fecha,
        horaInicio: formData.horaInicio,
        horaFin: formData.horaFin || undefined,
        tipoReunion: formData.tipoReunion,
        idGrado: formData.idGrado ? parseInt(formData.idGrado) : undefined,
        idSeccion: formData.idSeccion ? parseInt(formData.idSeccion) : undefined,
        metodoRegistro: formData.metodoRegistro
      })
      
      // Reset form
      setFormData({
        titulo: '',
        descripcion: '',
        fecha: '',
        horaInicio: '',
        horaFin: '',
        tipoReunion: 'GENERAL',
        idGrado: '',
        idSeccion: '',
        metodoRegistro: 'MANUAL'
      })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Programar Reunión
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
            {/* Título */}
            <div>
              <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-1">
                Título de la Reunión *
              </label>
              <input
                type="text"
                id="titulo"
                name="titulo"
                value={formData.titulo}
                onChange={handleInputChange}
                placeholder="Ej: Asamblea General de Padres"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                required
                maxLength={100}
              />
            </div>

            {/* Descripción */}
            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                placeholder="Detalles sobre el propósito de la reunión..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black resize-none"
              />
            </div>

            {/* Fecha y Horas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha *
                </label>
                <input
                  type="date"
                  id="fecha"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                  required
                />
              </div>
              <div>
                <label htmlFor="horaInicio" className="block text-sm font-medium text-gray-700 mb-1">
                  Hora Inicio *
                </label>
                <input
                  type="time"
                  id="horaInicio"
                  name="horaInicio"
                  value={formData.horaInicio}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                  required
                />
              </div>
              <div>
                <label htmlFor="horaFin" className="block text-sm font-medium text-gray-700 mb-1">
                  Hora Fin
                </label>
                <input
                  type="time"
                  id="horaFin"
                  name="horaFin"
                  value={formData.horaFin}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                />
              </div>
            </div>

            {/* Tipo de Reunión */}
            <div>
              <label htmlFor="tipoReunion" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Reunión *
              </label>
              <select
                id="tipoReunion"
                name="tipoReunion"
                value={formData.tipoReunion}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                required
              >
                <option value="GENERAL">🏫 General (Todos los padres)</option>
                <option value="POR_GRADO">📚 Por Grado</option>
                <option value="POR_AULA">🎓 Por Aula Específica</option>
              </select>
            </div>

            {/* Grado (si es por grado o aula) */}
            {(formData.tipoReunion === 'POR_GRADO' || formData.tipoReunion === 'POR_AULA') && (
              <div>
                <label htmlFor="idGrado" className="block text-sm font-medium text-gray-700 mb-1">
                  Grado *
                </label>
                <select
                  id="idGrado"
                  name="idGrado"
                  value={formData.idGrado}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                  required
                >
                  <option value="">Seleccionar grado...</option>
                  {grados.map(grado => (
                    <option key={grado.idGrado} value={grado.idGrado}>
                      {grado.nivel.nombre} - {grado.nombre}°
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sección (si es por aula) */}
            {formData.tipoReunion === 'POR_AULA' && (
              <div>
                <label htmlFor="idSeccion" className="block text-sm font-medium text-gray-700 mb-1">
                  Sección *
                </label>
                <select
                  id="idSeccion"
                  name="idSeccion"
                  value={formData.idSeccion}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                  required
                >
                  <option value="">Seleccionar sección...</option>
                  {secciones.map(seccion => (
                    <option key={seccion.idSeccion} value={seccion.idSeccion}>
                      Sección {seccion.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Método de Registro */}
            <div>
              <label htmlFor="metodoRegistro" className="block text-sm font-medium text-gray-700 mb-1">
                Método de Registro de Asistencia
              </label>
              <select
                id="metodoRegistro"
                name="metodoRegistro"
                value={formData.metodoRegistro}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
              >
                <option value="MANUAL">✍️ Manual</option>
                <option value="QR">📱 Código QR</option>
              </select>
            </div>

            {/* Información */}
            <div className="bg-purple-50 p-3 rounded-md">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-purple-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-purple-700">
                  <p>La reunión se programará con estado "Programada". Los padres de familia recibirán una notificación automática.</p>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || loadingData}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Programando...' : '📅 Programar Reunión'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
