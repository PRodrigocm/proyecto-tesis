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

// Interfaz para asignación de aula
interface AulaAsignacion {
  id: string
  idDocenteAula?: number
  gradoId: string
  seccionId: string
  tipoAsignacionId: string
  gradoNombre?: string
  seccionNombre?: string
  tipoNombre?: string
  isNew?: boolean
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
    especialidad: ''
  })
  
  // Estado para múltiples asignaciones
  const [asignaciones, setAsignaciones] = useState<AulaAsignacion[]>([])
  const [nuevaAsignacion, setNuevaAsignacion] = useState({
    gradoId: '',
    seccionId: '',
    tipoAsignacionId: ''
  })

  // Reset form when modal opens/closes or docente changes
  useEffect(() => {
    const cargarDatosDocente = async () => {
      if (!docente || !isOpen) return
      
      console.log('🔄 Modal abierto para docente:', docente.id)
      
      setFormData({
        nombre: docente.nombre || '',
        apellido: docente.apellido || '',
        dni: docente.dni || '',
        email: docente.email || '',
        telefono: docente.telefono || '',
        especialidad: docente.especialidad || ''
      })
      setNuevaAsignacion({ gradoId: '', seccionId: '', tipoAsignacionId: '' })
      // Resetear asignaciones antes de cargar las nuevas
      setAsignaciones([])
      
      // Load grados, secciones and tipos de asignación
      await loadInitialData()
      
      // Cargar asignaciones actuales del docente directamente aquí
      try {
        const token = localStorage.getItem('token')
        console.log('📡 Cargando asignaciones para docente ID:', docente.id)
        const response = await fetch(`/api/docentes/${docente.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const data = await response.json()
          const docenteData = data.data
          
          console.log('📋 Datos del docente cargados:', docenteData)
          console.log('📋 Asignaciones desde API:', docenteData.asignaciones)
          
          if (docenteData.asignaciones && Array.isArray(docenteData.asignaciones)) {
            const asignacionesCargadas: AulaAsignacion[] = docenteData.asignaciones.map((da: any) => ({
              id: da.idDocenteAula.toString(),
              idDocenteAula: da.idDocenteAula,
              gradoId: da.grado?.idGrado?.toString() || '',
              seccionId: da.seccion?.idSeccion?.toString() || '',
              tipoAsignacionId: da.tipoAsignacion?.idTipoAsignacion?.toString() || '',
              gradoNombre: da.grado?.nombre || '',
              seccionNombre: da.seccion?.nombre || '',
              tipoNombre: da.tipoAsignacion?.nombre || '',
              isNew: false
            }))
            console.log('📋 Asignaciones mapeadas:', asignacionesCargadas)
            setAsignaciones(asignacionesCargadas)
          }
        } else {
          console.error('❌ Error cargando docente:', response.status)
        }
      } catch (error) {
        console.error('Error loading docente asignaciones:', error)
      }
    }
    
    cargarDatosDocente()
  }, [docente, isOpen])

  const loadInitialData = async () => {
    await loadGrados()
    await loadTiposAsignacion()
  }

  // Cargar asignaciones actuales del docente
  const loadDocenteAsignaciones = async () => {
    if (!docente) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/docentes/${docente.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        const docenteData = data.data
        
        console.log('📋 Datos del docente cargados:', docenteData)
        console.log('📋 Asignaciones desde API:', docenteData.asignaciones)
        
        // Cargar las asignaciones existentes (la API devuelve 'asignaciones')
        if (docenteData.asignaciones && Array.isArray(docenteData.asignaciones)) {
          const asignacionesCargadas: AulaAsignacion[] = docenteData.asignaciones.map((da: any) => ({
            id: da.idDocenteAula.toString(),
            idDocenteAula: da.idDocenteAula,
            gradoId: da.grado?.idGrado?.toString() || '',
            seccionId: da.seccion?.idSeccion?.toString() || '',
            tipoAsignacionId: da.tipoAsignacion?.idTipoAsignacion?.toString() || '',
            gradoNombre: da.grado?.nombre || '',
            seccionNombre: da.seccion?.nombre || '',
            tipoNombre: da.tipoAsignacion?.nombre || '',
            isNew: false
          }))
          console.log('📋 Asignaciones mapeadas:', asignacionesCargadas)
          setAsignaciones(asignacionesCargadas)
        }
      }
    } catch (error) {
      console.error('Error loading docente asignaciones:', error)
    }
  }

  // Manejar cambio de grado en nueva asignación
  const handleNuevaAsignacionGradoChange = (gradoId: string) => {
    setNuevaAsignacion({
      ...nuevaAsignacion,
      gradoId,
      seccionId: ''
    })
    if (gradoId) {
      loadSecciones(gradoId)
    } else {
      setSecciones([])
    }
  }

  // Agregar nueva asignación
  const agregarAsignacion = () => {
    if (!nuevaAsignacion.gradoId || !nuevaAsignacion.seccionId || !nuevaAsignacion.tipoAsignacionId) {
      alert('Por favor, complete todos los campos de la asignación')
      return
    }

    // Verificar que no exista ya esta combinación
    const existe = asignaciones.some(
      a => a.gradoId === nuevaAsignacion.gradoId && 
           a.seccionId === nuevaAsignacion.seccionId &&
           a.tipoAsignacionId === nuevaAsignacion.tipoAsignacionId
    )

    if (existe) {
      alert('Esta asignación ya existe')
      return
    }

    const grado = grados.find(g => g.idGrado.toString() === nuevaAsignacion.gradoId)
    const seccion = secciones.find(s => s.idSeccion.toString() === nuevaAsignacion.seccionId)
    const tipo = tiposAsignacion.find(t => t.idTipoAsignacion.toString() === nuevaAsignacion.tipoAsignacionId)

    const nuevaAsignacionCompleta: AulaAsignacion = {
      id: `new-${Date.now()}`,
      gradoId: nuevaAsignacion.gradoId,
      seccionId: nuevaAsignacion.seccionId,
      tipoAsignacionId: nuevaAsignacion.tipoAsignacionId,
      gradoNombre: grado?.nombre || '',
      seccionNombre: seccion?.nombre || '',
      tipoNombre: tipo?.nombre || '',
      isNew: true
    }

    setAsignaciones([...asignaciones, nuevaAsignacionCompleta])
    setNuevaAsignacion({ gradoId: '', seccionId: '', tipoAsignacionId: '' })
    setSecciones([])
  }

  // Eliminar asignación
  const eliminarAsignacion = (id: string) => {
    setAsignaciones(asignaciones.filter(a => a.id !== id))
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

    // Verificar que haya al menos una asignación
    if (asignaciones.length === 0) {
      alert('⚠️ Debe agregar al menos una asignación de aula.\n\nSeleccione Grado, Sección y Tipo, luego haga clic en "Agregar".')
      return
    }

    setLoading(true)

    const asignacionesParaEnviar = asignaciones.map(a => ({
      id: a.idDocenteAula || null,
      gradoId: a.gradoId,
      seccionId: a.seccionId,
      tipoAsignacionId: a.tipoAsignacionId,
      isNew: a.isNew || false
    }))
    
    console.log('📤 Enviando asignaciones:', asignacionesParaEnviar)
    console.log('📤 Estado actual de asignaciones:', asignaciones)

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
          asignaciones: asignacionesParaEnviar
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
            <div className="space-y-1.5">
              <label className={labelClass}>Especialidad <span className="text-red-500">*</span></label>
              <input type="text" name="especialidad" value={formData.especialidad} onChange={handleInputChange} required className={inputClass} placeholder="Ej: Matemáticas" />
            </div>
          </FormSection>

          {/* Asignación de Aulas (Múltiple) */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <h4 className="text-sm font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Asignación de Aulas (Requerido)
            </h4>
            
            {/* Lista de asignaciones actuales */}
            {asignaciones.length > 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-xs font-medium text-blue-700 mb-2">Aulas asignadas ({asignaciones.length}):</p>
                {asignaciones.map((asig) => (
                  <div key={asig.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">
                        {asig.gradoNombre}° {asig.seccionNombre} - {asig.tipoNombre}
                      </span>
                      {asig.isNew && (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">Nueva</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => eliminarAsignacion(asig.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {asignaciones.length === 0 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-700 font-medium">
                  ⚠️ Debe agregar al menos una asignación. Seleccione Grado, Sección y Tipo, luego haga clic en "Agregar".
                </p>
              </div>
            )}

            {/* Formulario para agregar nueva asignación */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Grado</label>
                <select
                  value={nuevaAsignacion.gradoId}
                  onChange={(e) => handleNuevaAsignacionGradoChange(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Seleccionar...</option>
                  {grados.map((grado) => (
                    <option key={grado.idGrado} value={grado.idGrado}>{grado.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sección</label>
                <select
                  value={nuevaAsignacion.seccionId}
                  onChange={(e) => setNuevaAsignacion({ ...nuevaAsignacion, seccionId: e.target.value })}
                  className={selectClass}
                  disabled={!nuevaAsignacion.gradoId}
                >
                  <option value="">Seleccionar...</option>
                  {secciones.map((seccion) => (
                    <option key={seccion.idSeccion} value={seccion.idSeccion}>{seccion.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
                <select
                  value={nuevaAsignacion.tipoAsignacionId}
                  onChange={(e) => setNuevaAsignacion({ ...nuevaAsignacion, tipoAsignacionId: e.target.value })}
                  className={selectClass}
                >
                  <option value="">Seleccionar...</option>
                  {tiposAsignacion.map((tipo) => (
                    <option key={tipo.idTipoAsignacion} value={tipo.idTipoAsignacion}>{tipo.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  type="button"
                  onClick={agregarAsignacion}
                  className="w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar
                </button>
              </div>
            </div>
            
            <p className="text-xs text-blue-600 mt-3">
              💡 Puede asignar el docente a múltiples grados y secciones.
            </p>
          </div>

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
