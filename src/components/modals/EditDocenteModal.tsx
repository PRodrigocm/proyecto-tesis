'use client'

import { useState, useEffect } from 'react'
import { Docente } from '@/hooks/useDocentes'
import { Modal, ModalHeader, ModalBody, ModalFooter, FormSection } from '@/components/ui'

// Iconos
const EditIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

interface Grado {
  idGrado: number
  nombre: string
}

interface Seccion {
  idSeccion: number
  nombre: string
}

interface TipoAsignacion {
  idTipoAsignacion: number
  nombre: string
}

interface EditDocenteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  docente: Docente | null
}

export default function EditDocenteModal({ isOpen, onClose, onSuccess, docente }: EditDocenteModalProps) {
  const [loading, setLoading] = useState(false)
  const [grados, setGrados] = useState<Grado[]>([])
  const [secciones, setSecciones] = useState<Seccion[]>([])
  const [tiposAsignacion, setTiposAsignacion] = useState<TipoAsignacion[]>([])
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    telefono: '',
    especialidad: '',
    gradoId: '',
    seccionId: '',
    tipoAsignacionId: ''
  })

  // Reset form when modal opens/closes or docente changes
  useEffect(() => {
    if (docente && isOpen) {
      setFormData({
        nombre: docente.nombre || '',
        apellido: docente.apellido || '',
        dni: docente.dni || '',
        email: docente.email || '',
        telefono: docente.telefono || '',
        especialidad: docente.especialidad || '',
        gradoId: '', // Se llenará después de cargar grados
        seccionId: '', // Se llenará después de cargar secciones
        tipoAsignacionId: '' // Se llenará después de cargar tipos
      })
      
      // Load grados, secciones and tipos de asignación
      loadInitialData()
    }
  }, [docente, isOpen])

  const loadInitialData = async () => {
    await loadGrados()
    await loadTiposAsignacion()
  }

  // Precargar valores cuando se cargan los datos
  useEffect(() => {
    if (docente && grados.length > 0) {
      const gradoEncontrado = grados.find(g => g.nombre === docente.grado)
      if (gradoEncontrado) {
        setFormData(prev => ({ ...prev, gradoId: gradoEncontrado.idGrado.toString() }))
        loadSecciones(gradoEncontrado.idGrado.toString())
      }
    }
  }, [docente, grados])

  useEffect(() => {
    if (docente && secciones.length > 0) {
      const seccionEncontrada = secciones.find(s => s.nombre === docente.seccion)
      if (seccionEncontrada) {
        setFormData(prev => ({ ...prev, seccionId: seccionEncontrada.idSeccion.toString() }))
      }
    }
  }, [docente, secciones])

  useEffect(() => {
    if (docente && tiposAsignacion.length > 0) {
      // Necesitamos obtener el tipo de asignación del docente desde la API
      loadDocenteAsignacion()
    }
  }, [docente, tiposAsignacion])

  const loadDocenteAsignacion = async () => {
    if (!docente) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/docentes/${docente.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        const docenteData = data.data
        
        // Si el docente tiene tipo de asignación, precargar el valor
        if (docenteData.tipoAsignacion && docenteData.tipoAsignacion.idTipoAsignacion) {
          setFormData(prev => ({ 
            ...prev, 
            tipoAsignacionId: docenteData.tipoAsignacion.idTipoAsignacion.toString() 
          }))
        }
      }
    } catch (error) {
      console.error('Error loading docente asignacion:', error)
    }
  }

  const loadGrados = async () => {
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
      console.error('Error loading grados:', error)
    }
  }

  const loadSecciones = async (gradoId: string) => {
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
      console.error('Error loading secciones:', error)
    }
  }

  const loadTiposAsignacion = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/tipos-asignacion', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setTiposAsignacion(data.data || [])
      }
    } catch (error) {
      console.error('Error loading tipos de asignación:', error)
    }
  }

  // Load secciones when grado changes
  useEffect(() => {
    if (formData.gradoId) {
      loadSecciones(formData.gradoId)
    } else {
      setSecciones([])
      setFormData(prev => ({ ...prev, seccionId: '' }))
    }
  }, [formData.gradoId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!docente) return

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/docentes?id=${docente.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          gradoId: formData.gradoId ? parseInt(formData.gradoId) : null,
          seccionId: formData.seccionId ? parseInt(formData.seccionId) : null,
          tipoAsignacionId: formData.tipoAsignacionId ? parseInt(formData.tipoAsignacionId) : null
        })
      })

      if (response.ok) {
        alert('Docente actualizado exitosamente')
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        alert(`Error: ${error.message || 'No se pudo actualizar el docente'}`)
      }
    } catch (error) {
      console.error('Error updating docente:', error)
      alert('Error al actualizar el docente')
    } finally {
      setLoading(false)
    }
  }

  // Estilos reutilizables
  const inputClass = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 placeholder-slate-400 transition-all"
  const labelClass = "block text-sm font-medium text-slate-700 mb-1.5"
  const selectClass = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 transition-all appearance-none cursor-pointer"

  if (!isOpen || !docente) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalHeader 
        icon={<EditIcon />} 
        subtitle={`${docente.nombre} ${docente.apellido}`}
        variant="emerald"
        onClose={onClose}
      >
        Editar Docente
      </ModalHeader>

      <ModalBody>
        <form onSubmit={handleSubmit} id="edit-docente-form" className="space-y-6">
          {/* Información Personal */}
          <FormSection number={1} title="Información Personal">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Nombre <span className="text-red-500">*</span></label>
                <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} required className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Apellido <span className="text-red-500">*</span></label>
                <input type="text" name="apellido" value={formData.apellido} onChange={handleInputChange} required className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>DNI <span className="text-red-500">*</span></label>
                <input type="text" name="dni" value={formData.dni} onChange={handleInputChange} required className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Email <span className="text-red-500">*</span></label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Teléfono</label>
                <input type="tel" name="telefono" value={formData.telefono} onChange={handleInputChange} className={inputClass} />
              </div>
            </div>
          </FormSection>

          {/* Información Académica */}
          <FormSection number={2} title="Información Académica">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Especialidad <span className="text-red-500">*</span></label>
                <input type="text" name="especialidad" value={formData.especialidad} onChange={handleInputChange} required className={inputClass} placeholder="Ej: Matemáticas" />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Tipo de Asignación</label>
                <div className="relative">
                  <select name="tipoAsignacionId" value={formData.tipoAsignacionId} onChange={handleInputChange} className={selectClass}>
                    <option value="">Seleccionar tipo...</option>
                    {tiposAsignacion.map((tipo) => (
                      <option key={tipo.idTipoAsignacion} value={tipo.idTipoAsignacion}>{tipo.nombre}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Grado</label>
                <div className="relative">
                  <select name="gradoId" value={formData.gradoId} onChange={handleInputChange} className={selectClass}>
                    <option value="">Seleccionar grado...</option>
                    {grados.map((grado) => (
                      <option key={grado.idGrado} value={grado.idGrado}>{grado.nombre}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Sección</label>
                <div className="relative">
                  <select name="seccionId" value={formData.seccionId} onChange={handleInputChange} disabled={!formData.gradoId} className={`${selectClass} disabled:bg-slate-100`}>
                    <option value="">Seleccionar sección...</option>
                    {secciones.map((seccion) => (
                      <option key={seccion.idSeccion} value={seccion.idSeccion}>{seccion.nombre}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>
            </div>
          </FormSection>

          {/* Asignaciones Actuales */}
          {docente.materias && docente.materias.length > 0 && (
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <h4 className="text-sm font-semibold text-indigo-900 mb-3">Asignaciones Actuales</h4>
              <div className="flex flex-wrap gap-2">
                {docente.materias.map((materia, index) => (
                  <span key={index} className="px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700">
                    {materia.nombre}
                  </span>
                ))}
              </div>
              <p className="text-xs text-indigo-600 mt-3">Al asignar un nuevo grado y sección, se reemplazarán las asignaciones actuales.</p>
            </div>
          )}

          {/* Información del Sistema */}
          <div className="p-4 bg-slate-100 rounded-xl">
            <h4 className="text-sm font-semibold text-slate-800 mb-3">Información del Sistema</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Institución:</span>
                <span className="text-slate-900 font-medium">{docente.institucionEducativa}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Estado:</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  docente.estado === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>{docente.estado}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">ID:</span>
                <span className="text-slate-900 font-mono text-xs">{docente.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Registro:</span>
                <span className="text-slate-900">{new Date(docente.fechaRegistro).toLocaleDateString('es-ES')}</span>
              </div>
            </div>
          </div>
        </form>
      </ModalBody>

      <ModalFooter>
        <button type="button" onClick={onClose} className="px-5 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-100 transition-colors">
          Cancelar
        </button>
        <button type="submit" form="edit-docente-form" disabled={loading} className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/30">
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </ModalFooter>
    </Modal>
  )
}
