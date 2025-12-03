'use client'

import { useState, useEffect } from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'
import SearchableSelect from '@/components/ui/SearchableSelect'

// Iconos
const StudentIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
  </svg>
)

const UserIcon = () => (
  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const IdCardIcon = () => (
  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
  </svg>
)

const CalendarIcon = () => (
  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

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

interface Apoderado {
  id: number
  nombre: string
  apellido: string
  dni: string
}

interface ApoderadoRelacion {
  apoderadoId: number
  relacion: string
  esTitular: boolean
}

interface CreateEstudianteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

// Tipos de relación disponibles
const TIPOS_RELACION = [
  { value: 'PADRE', label: 'Padre' },
  { value: 'MADRE', label: 'Madre' },
  { value: 'TUTOR', label: 'Tutor' },
  { value: 'ABUELO', label: 'Abuelo' },
  { value: 'ABUELA', label: 'Abuela' },
  { value: 'TIO', label: 'Tío' },
  { value: 'TIA', label: 'Tía' },
  { value: 'HERMANO', label: 'Hermano' },
  { value: 'HERMANA', label: 'Hermana' },
  { value: 'OTRO', label: 'Otro' }
]

export default function CreateEstudianteModal({ isOpen, onClose, onSuccess }: CreateEstudianteModalProps) {
  const [loading, setLoading] = useState(false)
  const [grados, setGrados] = useState<Grado[]>([])
  const [secciones, setSecciones] = useState<Seccion[]>([])
  const [apoderados, setApoderados] = useState<Apoderado[]>([])
  const [apoderadosRelaciones, setApoderadosRelaciones] = useState<ApoderadoRelacion[]>([
    { apoderadoId: 0, relacion: '', esTitular: false }
  ])
  
  // Calcular fechas mínima y máxima para edades entre 6 y 12 años
  const today = new Date()
  const maxDate = new Date(today.getFullYear() - 6, today.getMonth(), today.getDate())
  const minDate = new Date(today.getFullYear() - 12, today.getMonth(), today.getDate())
  const maxDateString = maxDate.toISOString().split('T')[0]
  const minDateString = minDate.toISOString().split('T')[0]
  
  const [formData, setFormData] = useState({
    dni: '',
    nombre: '',
    apellido: '',
    fechaNacimiento: '',
    gradoId: '',
    seccionId: ''
  })

  // Reset form y cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setFormData({
        dni: '',
        nombre: '',
        apellido: '',
        fechaNacimiento: '',
        gradoId: '',
        seccionId: ''
      })
      setApoderadosRelaciones([{ apoderadoId: 0, relacion: '', esTitular: false }])
      setSecciones([])
      fetchGrados()
      fetchApoderados()
    }
  }, [isOpen])

  // Cargar secciones cuando cambia el grado
  useEffect(() => {
    if (formData.gradoId) {
      fetchSecciones(formData.gradoId)
    } else {
      setSecciones([])
      setFormData(prev => ({ ...prev, seccionId: '' }))
    }
  }, [formData.gradoId])

  const fetchGrados = async () => {
    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) return

      const user = JSON.parse(userStr)
      const ieId = user.idIe || user.institucionId || 1
      const token = localStorage.getItem('token')

      const response = await fetch(`/api/grados?ieId=${ieId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setGrados(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching grados:', error)
    }
  }

  const fetchSecciones = async (gradoId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/secciones?gradoId=${gradoId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setSecciones(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching secciones:', error)
    }
  }

  const fetchApoderados = async () => {
    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) return

      const user = JSON.parse(userStr)
      const ieId = user.idIe || user.institucionId || 1
      const token = localStorage.getItem('token')

      const response = await fetch(`/api/usuarios/apoderados?ieId=${ieId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setApoderados(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching apoderados:', error)
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

      const response = await fetch('/api/estudiantes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          ieId,
          gradoId: parseInt(formData.gradoId),
          seccionId: parseInt(formData.seccionId),
          apoderadosRelaciones: apoderadosRelaciones.filter(rel => rel.apoderadoId > 0 && rel.relacion),
          fechaNacimiento: formData.fechaNacimiento ? new Date(formData.fechaNacimiento).toISOString() : null
        })
      })

      if (response.ok) {
        alert('Estudiante creado exitosamente')
        onSuccess()
        onClose()
        resetForm()
      } else {
        const error = await response.json()
        alert(`Error: ${error.message || 'No se pudo crear el estudiante'}`)
      }
    } catch (error) {
      console.error('Error creating estudiante:', error)
      alert('Error al crear el estudiante')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      dni: '',
      nombre: '',
      apellido: '',
      fechaNacimiento: '',
      gradoId: '',
      seccionId: ''
    })
    setApoderadosRelaciones([{ apoderadoId: 0, relacion: '', esTitular: false }])
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleApoderadoChange = (index: number, field: 'apoderadoId' | 'relacion' | 'esTitular', value: string | number | boolean) => {
    setApoderadosRelaciones(prev => 
      prev.map((rel, i) => 
        i === index 
          ? { 
              ...rel, 
              [field]: field === 'apoderadoId' ? Number(value) : 
                      field === 'esTitular' ? Boolean(value) : value 
            }
          : rel
      )
    )
  }

  const agregarApoderado = () => {
    setApoderadosRelaciones(prev => [...prev, { apoderadoId: 0, relacion: '', esTitular: false }])
  }

  const eliminarApoderado = (index: number) => {
    if (apoderadosRelaciones.length > 1) {
      setApoderadosRelaciones(prev => prev.filter((_, i) => i !== index))
    }
  }

  if (!isOpen) return null

  const inputClass = "w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder-slate-400 transition-all"
  const selectClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 transition-all appearance-none cursor-pointer"

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader 
        icon={<StudentIcon />} 
        subtitle="Complete los datos del nuevo estudiante"
        variant="blue"
        onClose={onClose}
      >
        Crear Nuevo Estudiante
      </ModalHeader>

      <ModalBody className="max-h-[65vh] overflow-y-auto">
        <form id="create-estudiante-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Sección: Información Personal */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <h4 className="text-sm font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <UserIcon />
              Información Personal
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* DNI */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">DNI <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2"><IdCardIcon /></div>
                  <input
                    type="text"
                    name="dni"
                    value={formData.dni}
                    onChange={handleChange}
                    required
                    maxLength={8}
                    pattern="[0-9]{8}"
                    className={inputClass}
                    placeholder="12345678"
                  />
                </div>
              </div>

              {/* Fecha de Nacimiento */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Fecha de Nacimiento <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2"><CalendarIcon /></div>
                  <input
                    type="date"
                    name="fechaNacimiento"
                    value={formData.fechaNacimiento}
                    onChange={handleChange}
                    min={minDateString}
                    max={maxDateString}
                    required
                    className={inputClass}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">Edad: 6-12 años</p>
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nombre <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2"><UserIcon /></div>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    className={inputClass}
                    placeholder="Nombres"
                  />
                </div>
              </div>

              {/* Apellido */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Apellido <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2"><UserIcon /></div>
                  <input
                    type="text"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleChange}
                    required
                    className={inputClass}
                    placeholder="Apellidos"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sección: Asignación Académica */}
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
            <h4 className="text-sm font-semibold text-emerald-900 mb-4">Asignación Académica</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Grado */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Grado <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    name="gradoId"
                    value={formData.gradoId}
                    onChange={handleChange}
                    required
                    className={selectClass}
                  >
                    <option value="">Seleccionar grado</option>
                    {grados.map((grado) => (
                      <option key={grado.idGrado} value={grado.idGrado}>
                        {grado.nombre} - {grado.nivel.nombre}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Sección */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Sección <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    name="seccionId"
                    value={formData.seccionId}
                    onChange={handleChange}
                    required
                    disabled={!formData.gradoId}
                    className={`${selectClass} disabled:bg-slate-100 disabled:cursor-not-allowed`}
                  >
                    <option value="">Seleccionar sección</option>
                    {secciones.map((seccion) => (
                      <option key={seccion.idSeccion} value={seccion.idSeccion}>
                        {seccion.nombre}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sección: Apoderados */}
          <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-semibold text-violet-900">Apoderados y Relaciones</h4>
                <p className="text-xs text-violet-600 mt-1">Opcional: Asigna apoderados al estudiante</p>
              </div>
              <button
                type="button"
                onClick={agregarApoderado}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-violet-600 hover:text-violet-800 hover:bg-violet-100 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Agregar
              </button>
            </div>
            
            <div className="space-y-3">
              {apoderadosRelaciones.map((relacion, index) => (
                <div key={index} className="bg-white rounded-xl p-4 border border-violet-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-700">Apoderado {index + 1}</span>
                    {apoderadosRelaciones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => eliminarApoderado(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <SearchableSelect
                      label="Seleccionar Apoderado"
                      options={[
                        { value: '0', label: 'Ninguno', subtitle: 'No asignar' },
                        ...apoderados.map(apo => ({
                          value: String(apo.id),
                          label: `${apo.nombre} ${apo.apellido}`,
                          subtitle: `DNI: ${apo.dni}`
                        }))
                      ]}
                      value={String(relacion.apoderadoId)}
                      onChange={(value) => handleApoderadoChange(index, 'apoderadoId', value)}
                      placeholder="Buscar apoderado..."
                    />

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Relación</label>
                      <select
                        value={relacion.relacion}
                        onChange={(e) => handleApoderadoChange(index, 'relacion', e.target.value)}
                        required={relacion.apoderadoId > 0}
                        disabled={relacion.apoderadoId === 0}
                        className={`${selectClass} disabled:bg-slate-100`}
                      >
                        <option value="">Seleccionar...</option>
                        {TIPOS_RELACION.map((tipo) => (
                          <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 mt-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={relacion.esTitular}
                      onChange={(e) => handleApoderadoChange(index, 'esTitular', e.target.checked)}
                      className="w-4 h-4 text-violet-600 border-slate-300 rounded focus:ring-violet-500"
                    />
                    <span className="text-sm text-slate-700">Es titular (puede autorizar retiros)</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </form>
      </ModalBody>

      <ModalFooter>
        <button
          type="button"
          onClick={() => { onClose(); resetForm(); }}
          className="px-5 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          form="create-estudiante-form"
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
          ) : 'Crear Estudiante'}
        </button>
      </ModalFooter>
    </Modal>
  )
}
