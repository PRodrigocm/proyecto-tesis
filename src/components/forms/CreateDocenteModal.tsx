'use client'

import { useState, useEffect } from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'

// Iconos
const TeacherIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
)

const UserIcon = () => (
  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const MailIcon = () => (
  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const PhoneIcon = () => (
  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
)

const IdCardIcon = () => (
  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
  </svg>
)

const LockIcon = () => (
  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)

interface CreateDocenteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

// Interfaz para asignación de aula
interface AulaAsignacion {
  id: string
  gradoId: string
  seccionId: string
  tipoAsignacionId: string
  gradoNombre?: string
  seccionNombre?: string
}

export default function CreateDocenteModal({ isOpen, onClose, onSuccess }: CreateDocenteModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    dni: '',
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    especialidad: '',
    password: ''
  })
  
  // Estado para múltiples asignaciones de aulas
  const [asignaciones, setAsignaciones] = useState<AulaAsignacion[]>([])
  const [nuevaAsignacion, setNuevaAsignacion] = useState({
    gradoId: '',
    seccionId: '',
    tipoAsignacionId: ''
  })
  
  const [grados, setGrados] = useState<any[]>([])
  const [secciones, setSecciones] = useState<any[]>([])
  const [tiposAsignacion, setTiposAsignacion] = useState<any[]>([])
  const [loadingGrados, setLoadingGrados] = useState(false)
  const [loadingSecciones, setLoadingSecciones] = useState(false)
  const [loadingTipos, setLoadingTipos] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ dni?: string; email?: string }>({})

  // Reset form cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setFormData({
        dni: '',
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        especialidad: '',
        password: ''
      })
      setAsignaciones([])
      setNuevaAsignacion({ gradoId: '', seccionId: '', tipoAsignacionId: '' })
      setFieldErrors({})
      setSecciones([])
    }
  }, [isOpen])

  // Validar DNI duplicado
  const validateDNI = async (dni: string) => {
    if (dni.length !== 8) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/usuarios/validate-dni?dni=${dni}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.exists) {
          setFieldErrors(prev => ({ 
            ...prev, 
            dni: `El DNI ${dni} ya está registrado` 
          }))
        } else {
          setFieldErrors(prev => ({ ...prev, dni: undefined }))
        }
      }
    } catch (error) {
      console.error('Error validating DNI:', error)
    }
  }

  // Validar email duplicado
  const validateEmail = async (email: string) => {
    if (!email || !email.includes('@')) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/usuarios/validate-email?email=${encodeURIComponent(email)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.exists) {
          setFieldErrors(prev => ({ 
            ...prev, 
            email: `El email ${email} ya está registrado` 
          }))
        } else {
          setFieldErrors(prev => ({ ...prev, email: undefined }))
        }
      }
    } catch (error) {
      console.error('Error validating email:', error)
    }
  }

  // Cargar grados y tipos de asignación cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadGrados()
      loadTiposAsignacion()
    }
  }, [isOpen])

  // Función para cargar grados
  const loadGrados = async () => {
    setLoadingGrados(true)
    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) return

      const user = JSON.parse(userStr)
      const ieId = user.idIe || user.institucionId || 1
      const token = localStorage.getItem('token')

      const response = await fetch(`/api/grados?ieId=${ieId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setGrados(data.data || [])
      }
    } catch (error) {
      console.error('Error loading grados:', error)
    } finally {
      setLoadingGrados(false)
    }
  }

  // Función para cargar secciones cuando se selecciona un grado
  const loadSecciones = async (gradoId: string) => {
    if (!gradoId) {
      setSecciones([])
      return
    }

    setLoadingSecciones(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/secciones?gradoId=${gradoId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSecciones(data.data || [])
      }
    } catch (error) {
      console.error('Error loading secciones:', error)
    } finally {
      setLoadingSecciones(false)
    }
  }

  // Función para cargar tipos de asignación
  const loadTiposAsignacion = async () => {
    setLoadingTipos(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/tipos-asignacion', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTiposAsignacion(data.data || [])
      }
    } catch (error) {
      console.error('Error loading tipos de asignación:', error)
    } finally {
      setLoadingTipos(false)
    }
  }

  // Manejar cambio de grado en nueva asignación
  const handleNuevaAsignacionGradoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const gradoId = e.target.value
    setNuevaAsignacion({
      ...nuevaAsignacion,
      gradoId,
      seccionId: '' // Reset sección cuando cambia el grado
    })
    loadSecciones(gradoId)
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
      id: Date.now().toString(),
      gradoId: nuevaAsignacion.gradoId,
      seccionId: nuevaAsignacion.seccionId,
      tipoAsignacionId: nuevaAsignacion.tipoAsignacionId,
      gradoNombre: grado?.nombre || '',
      seccionNombre: `${seccion?.nombre || ''} - ${tipo?.nombre || ''}`
    }

    setAsignaciones([...asignaciones, nuevaAsignacionCompleta])
    setNuevaAsignacion({ gradoId: '', seccionId: '', tipoAsignacionId: '' })
    setSecciones([])
  }

  // Eliminar asignación
  const eliminarAsignacion = (id: string) => {
    setAsignaciones(asignaciones.filter(a => a.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Verificar si hay errores de validación
    if (fieldErrors.dni || fieldErrors.email) {
      alert('Por favor, corrige los errores antes de continuar')
      return
    }
    
    setLoading(true)

    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        alert('Error: No se encontró información del usuario')
        return
      }

      const token = localStorage.getItem('token')
      
      console.log('📋 Datos del formulario:', formData)
      console.log('📚 Asignaciones a enviar:', asignaciones)
      console.log('🔑 Token:', token ? 'presente' : 'ausente')

      const bodyData = {
        ...formData,
        asignaciones: asignaciones.map(a => ({
          gradoId: a.gradoId,
          seccionId: a.seccionId,
          tipoAsignacionId: a.tipoAsignacionId
        })),
        userInfo: userStr
      }
      console.log('📤 Body completo:', JSON.stringify(bodyData, null, 2))

      const response = await fetch('/api/docentes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          asignaciones: asignaciones.map(a => ({
            gradoId: a.gradoId,
            seccionId: a.seccionId,
            tipoAsignacionId: a.tipoAsignacionId
          })),
          userInfo: userStr // Enviar información del usuario para obtener ieId
        })
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (response.ok) {
        const result = await response.json()
        console.log('Resultado exitoso:', result)
        alert('Docente creado exitosamente')
        onSuccess()
        onClose()
        setFormData({
          dni: '',
          nombre: '',
          apellido: '',
          email: '',
          telefono: '',
          especialidad: '',
          password: ''
        })
        setAsignaciones([])
      } else {
        const error = await response.json()
        console.log('Error de la API:', error)
        alert(`Error: ${error.message || 'No se pudo crear el docente'}`)
      }
    } catch (error) {
      console.error('Error creating docente:', error)
      alert('Error al crear el docente')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    // Limpiar errores cuando el usuario empiece a escribir
    if (name === 'dni') {
      setFieldErrors(prev => ({ ...prev, dni: undefined }))
    } else if (name === 'email') {
      setFieldErrors(prev => ({ ...prev, email: undefined }))
    }
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })

    // Validar DNI cuando tenga 8 dígitos
    if (name === 'dni' && value.length === 8 && /^\d{8}$/.test(value)) {
      validateDNI(value)
    }

    // Validar email cuando tenga formato válido
    if (name === 'email' && value.includes('@') && value.includes('.')) {
      validateEmail(value)
    }
  }

  if (!isOpen) return null

  const inputClass = "w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 placeholder-slate-400 transition-all"
  const inputErrorClass = "w-full pl-12 pr-4 py-3 bg-red-50 border border-red-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder-slate-400 transition-all"
  const selectClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 transition-all appearance-none cursor-pointer"

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader 
        icon={<TeacherIcon />} 
        subtitle="Complete los datos del nuevo docente"
        variant="emerald"
        onClose={onClose}
      >
        Crear Nuevo Docente
      </ModalHeader>

      <ModalBody className="max-h-[65vh] overflow-y-auto">
        <form id="create-docente-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Sección: Información Personal */}
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
            <h4 className="text-sm font-semibold text-emerald-900 mb-4 flex items-center gap-2">
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
                    className={fieldErrors.dni ? inputErrorClass : inputClass}
                    placeholder="12345678"
                  />
                </div>
                {fieldErrors.dni && <p className="mt-1.5 text-sm text-red-500">{fieldErrors.dni}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2"><MailIcon /></div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    autoComplete="off"
                    className={fieldErrors.email ? inputErrorClass : inputClass}
                    placeholder="docente@email.com"
                  />
                </div>
                {fieldErrors.email && <p className="mt-1.5 text-sm text-red-500">{fieldErrors.email}</p>}
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

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Teléfono</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2"><PhoneIcon /></div>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    maxLength={9}
                    pattern="[0-9]{9}"
                    className={inputClass}
                    placeholder="999999999"
                  />
                </div>
              </div>

              {/* Especialidad */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Especialidad <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2"><TeacherIcon /></div>
                  <input
                    type="text"
                    name="especialidad"
                    value={formData.especialidad}
                    onChange={handleChange}
                    required
                    className={inputClass}
                    placeholder="Matemáticas, Comunicación..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sección: Asignación de Aulas (Múltiple) */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <h4 className="text-sm font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Asignación de Aulas (Opcional - Puede asignar múltiples)
            </h4>
            
            {/* Lista de asignaciones actuales */}
            {asignaciones.length > 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-xs font-medium text-blue-700 mb-2">Aulas asignadas:</p>
                {asignaciones.map((asig) => (
                  <div key={asig.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">
                        {asig.gradoNombre}° - {asig.seccionNombre}
                      </span>
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

            {/* Formulario para agregar nueva asignación */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              {/* Grado */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Grado</label>
                <select
                  value={nuevaAsignacion.gradoId}
                  onChange={handleNuevaAsignacionGradoChange}
                  className={selectClass}
                  disabled={loadingGrados}
                >
                  <option value="">Seleccionar...</option>
                  {grados.map((grado) => (
                    <option key={grado.idGrado} value={grado.idGrado}>{grado.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Sección */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sección</label>
                <select
                  value={nuevaAsignacion.seccionId}
                  onChange={(e) => setNuevaAsignacion({ ...nuevaAsignacion, seccionId: e.target.value })}
                  className={selectClass}
                  disabled={loadingSecciones || !nuevaAsignacion.gradoId}
                >
                  <option value="">Seleccionar...</option>
                  {secciones.map((seccion) => (
                    <option key={seccion.idSeccion} value={seccion.idSeccion}>{seccion.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Tipo de Asignación */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
                <select
                  value={nuevaAsignacion.tipoAsignacionId}
                  onChange={(e) => setNuevaAsignacion({ ...nuevaAsignacion, tipoAsignacionId: e.target.value })}
                  className={selectClass}
                  disabled={loadingTipos}
                >
                  <option value="">Seleccionar...</option>
                  {tiposAsignacion.map((tipo) => (
                    <option key={tipo.idTipoAsignacion} value={tipo.idTipoAsignacion}>{tipo.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Botón Agregar */}
              <div>
                <button
                  type="button"
                  onClick={agregarAsignacion}
                  className="w-full px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar
                </button>
              </div>
            </div>
            
            <p className="text-xs text-blue-600 mt-3">
              💡 Puede asignar el docente a múltiples grados y secciones. Esto permite que varios docentes compartan la misma aula.
            </p>
          </div>

          {/* Sección: Contraseña */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Contraseña <span className="text-red-500">*</span></label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2"><LockIcon /></div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                autoComplete="new-password"
                className={inputClass}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </div>
        </form>
      </ModalBody>

      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          form="create-docente-form"
          disabled={loading}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creando...
            </>
          ) : 'Crear Docente'}
        </button>
      </ModalFooter>
    </Modal>
  )
}
