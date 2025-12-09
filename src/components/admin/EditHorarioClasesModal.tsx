'use client'

import { useState, useEffect } from 'react'

interface EditHorarioClasesModalProps {
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

interface HorarioDetalle {
  diaSemana: number
  horaInicio: string
  horaFin: string
  docente: string
  aula: string
  tipoActividad: 'CLASE_REGULAR' | 'RECUPERACION'
}

interface Docente {
  idDocente: number
  nombre: string
  apellido: string
  especialidad: string
}

interface Aula {
  idAula?: number
  nombre: string
  capacidad?: number
  tipo?: string
  ubicacion?: string
  equipamiento?: string
  recomendada?: boolean
}

export default function EditHorarioClasesModal({ isOpen, onClose, onSave }: EditHorarioClasesModalProps) {
  const [loading, setLoading] = useState(false)
  const [gradosSecciones, setGradosSecciones] = useState<GradoSeccion[]>([])
  const [loadingGrados, setLoadingGrados] = useState(false)
  const [selectedGradoSeccion, setSelectedGradoSeccion] = useState('')
  const [horarios, setHorarios] = useState<HorarioDetalle[]>([])
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [aulas, setAulas] = useState<Aula[]>([])
  const [loadingDocentes, setLoadingDocentes] = useState(false)
  const [loadingAulas, setLoadingAulas] = useState(false)
  const [selectedNivel, setSelectedNivel] = useState('')
  const [selectedGradoInicio, setSelectedGradoInicio] = useState('')
  const [selectedGradoFin, setSelectedGradoFin] = useState('')
  const [modoSeleccion, setModoSeleccion] = useState<'individual' | 'rango' | 'todos'>('individual')
  const [mostrarRecuperacion, setMostrarRecuperacion] = useState(false)
  const [diasRecuperacion, setDiasRecuperacion] = useState<Set<6 | 7>>(new Set()) // Set para múltiples días
  const [horaInicioRegular, setHoraInicioRegular] = useState('07:00')
  const [horaFinRegular, setHoraFinRegular] = useState('13:30')
  const [horaInicioRecuperacionSabado, setHoraInicioRecuperacionSabado] = useState('09:00')
  const [horaFinRecuperacionSabado, setHoraFinRecuperacionSabado] = useState('12:00')
  const [horaInicioRecuperacionDomingo, setHoraInicioRecuperacionDomingo] = useState('09:00')
  const [horaFinRecuperacionDomingo, setHoraFinRecuperacionDomingo] = useState('12:00')

  const diasSemana = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
    { value: 7, label: 'Domingo' }
  ]

  // Ya no se usa horasComunes - ahora usamos input type="time"

  useEffect(() => {
    if (isOpen) {
      loadGradosSecciones()
      loadDocentes()
      loadAulas()
    }
  }, [isOpen])

  const loadGradosSecciones = async () => {
    setLoadingGrados(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/grados-secciones?ieId=1', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('📚 Grados y secciones cargados desde API:', data.data.length, 'registros')
        console.log('📊 Primer elemento:', data.data?.[0])
        
        // Listar TODOS los grados que vienen del API
        console.log('📋 TODOS los grados del API:')
        data.data.forEach((gs: any) => {
          console.log(`  - ID: ${gs.idGradoSeccion} | ${gs.grado?.nivel?.nombre} ${gs.grado?.nombre}° ${gs.seccion?.nombre}`)
        })
        
        // Verificar estructura de datos
        if (data.data && data.data.length > 0) {
          const primerGrado = data.data[0]
          console.log('🔍 Estructura del primer grado:', {
            idGradoSeccion: primerGrado.idGradoSeccion,
            grado: primerGrado.grado,
            nivel: primerGrado.grado?.nivel,
            seccion: primerGrado.seccion
          })
        }
        
        // Filtrar duplicados basados en idGradoSeccion (único en BD)
        const gradosUnicos = (data.data || []).filter((gs: GradoSeccion, index: number, array: GradoSeccion[]) => {
          // Usar idGradoSeccion que es único en la BD
          const isDuplicate = array.findIndex(item => 
            item.idGradoSeccion === gs.idGradoSeccion
          ) !== index
          
          if (isDuplicate) {
            console.log(`🔄 Eliminando duplicado: ID ${gs.idGradoSeccion} - ${gs.grado?.nivel?.nombre} - ${gs.grado?.nombre} ${gs.seccion?.nombre}`)
            return false
          }
          
          return true
        })
        
        console.log('📊 Total de grados-secciones después de filtrar:', gradosUnicos.length)
        
        console.log('✅ Grados únicos:', gradosUnicos.length, 'registros')
        
        // Extraer niveles únicos para debug
        const nivelesUnicos = [...new Set(gradosUnicos
          .map((gs: GradoSeccion) => gs.grado?.nivel?.nombre)
          .filter((nombre: string | undefined) => nombre))]
        console.log('📋 Niveles encontrados:', nivelesUnicos)
        
        // Extraer grados únicos por nivel para debug
        nivelesUnicos.forEach(nivel => {
          const gradosDelNivel = [...new Set(gradosUnicos
            .filter((gs: GradoSeccion) => gs.grado?.nivel?.nombre === nivel)
            .map((gs: GradoSeccion) => gs.grado?.nombre))]
            .sort((a: any, b: any) => parseInt(a) - parseInt(b))
          console.log(`📊 Grados de ${nivel}:`, gradosDelNivel)
          console.log(`   Total: ${gradosDelNivel.length} grados`)
        })
        
        setGradosSecciones(gradosUnicos)
      }
    } catch (error) {
      console.error('Error loading grados y secciones:', error)
    } finally {
      setLoadingGrados(false)
    }
  }

  const loadDocentes = async () => {
    setLoadingDocentes(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/docentes', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setDocentes(data.data || [])
      }
    } catch (error) {
      console.error('Error loading docentes:', error)
    } finally {
      setLoadingDocentes(false)
    }
  }

  const loadAulas = async (gradoSeccionId?: string) => {
    setLoadingAulas(true)
    try {
      const token = localStorage.getItem('token')
      const url = gradoSeccionId 
        ? `/api/aulas?gradoSeccionId=${gradoSeccionId}`
        : '/api/aulas'
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setAulas(data.data || [])
      }
    } catch (error) {
      console.error('Error loading aulas:', error)
    } finally {
      setLoadingAulas(false)
    }
  }

  const loadExistingHorarios = async (gradoSeccionId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/horarios/anuales?idGradoSeccion=${gradoSeccionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        const horariosExistentes = data.data.map((h: any) => ({
          diaSemana: h.diaSemana,
          horaInicio: h.horaInicio,
          horaFin: h.horaFin,
          docente: h.docente?.nombre || '',
          aula: h.aula || '',
          tipoActividad: h.tipoActividad
        }))
        setHorarios(horariosExistentes)
      } else {
        setHorarios([])
      }
    } catch (error) {
      console.error('Error loading existing horarios:', error)
      setHorarios([])
    }
  }

  const loadHorariosByMode = async () => {
    if (modoSeleccion === 'todos') {
      // Modo todos: cargar horarios de todos los grados-secciones
      console.log('🏫 Cargando horarios de TODOS los grados-secciones...')
      
      try {
        const token = localStorage.getItem('token')
        const todosHorarios: HorarioDetalle[] = []
        
        // Cargar horarios de cada grado-sección
        for (const gs of gradosSecciones) {
          const response = await fetch(`/api/horarios/anuales?idGradoSeccion=${gs.idGradoSeccion}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          
          if (response.ok) {
            const data = await response.json()
            const horariosGS = data.data.map((h: any) => ({
              diaSemana: h.diaSemana,
              horaInicio: h.horaInicio,
              horaFin: h.horaFin,
              docente: h.docente?.nombre || '',
              aula: h.aula || `Aula ${gs.grado.nombre}° ${gs.seccion.nombre}`,
              tipoActividad: h.tipoActividad
            }))
            todosHorarios.push(...horariosGS)
          }
        }
        
        console.log(`✅ Cargados ${todosHorarios.length} horarios de ${gradosSecciones.length} grados-secciones`)
        setHorarios(todosHorarios)
      } catch (error) {
        console.error('Error cargando horarios masivos:', error)
        setHorarios([])
      }
      
      loadAulas()
      
    } else if (modoSeleccion === 'rango' && selectedNivel && selectedGradoInicio && selectedGradoFin) {
      // Modo rango: cargar horarios del rango seleccionado
      console.log(`📊 Cargando horarios del rango: ${selectedNivel} ${selectedGradoInicio}° a ${selectedGradoFin}°`)
      
      try {
        const token = localStorage.getItem('token')
        const todosHorarios: HorarioDetalle[] = []
        
        // Filtrar grados-secciones del rango
        const gradosEnRango = gradosSecciones.filter(gs => {
          const gradoNum = parseInt(gs.grado.nombre)
          const inicioNum = parseInt(selectedGradoInicio)
          const finNum = parseInt(selectedGradoFin)
          return gs.grado.nivel.nombre === selectedNivel && 
                 gradoNum >= inicioNum && 
                 gradoNum <= finNum
        })
        
        console.log(`📊 Grados en rango: ${gradosEnRango.length}`)
        
        // Cargar horarios de cada grado-sección en el rango
        for (const gs of gradosEnRango) {
          const response = await fetch(`/api/horarios/anuales?idGradoSeccion=${gs.idGradoSeccion}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          
          if (response.ok) {
            const data = await response.json()
            const horariosGS = data.data.map((h: any) => ({
              diaSemana: h.diaSemana,
              horaInicio: h.horaInicio,
              horaFin: h.horaFin,
              docente: h.docente?.nombre || '',
              aula: h.aula || `Aula ${gs.grado.nombre}° ${gs.seccion.nombre}`,
              tipoActividad: h.tipoActividad
            }))
            todosHorarios.push(...horariosGS)
          }
        }
        
        console.log(`✅ Cargados ${todosHorarios.length} horarios del rango`)
        setHorarios(todosHorarios)
      } catch (error) {
        console.error('Error cargando horarios por rango:', error)
        setHorarios([])
      }
      
      loadAulas()
    }
  }

  useEffect(() => {
    // Limpiar horarios al cambiar de modo
    setHorarios([])
    setSelectedGradoSeccion('')
    setSelectedNivel('')
    setSelectedGradoInicio('')
    setSelectedGradoFin('')
    
    // Cargar horarios según el modo
    if (modoSeleccion === 'todos') {
      loadHorariosByMode()
    }
  }, [modoSeleccion])

  useEffect(() => {
    // Cargar horarios cuando se complete la selección por rango
    if (modoSeleccion === 'rango' && selectedNivel && selectedGradoInicio && selectedGradoFin) {
      loadHorariosByMode()
    }
  }, [selectedNivel, selectedGradoInicio, selectedGradoFin])

  const handleGradoSeccionChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target
    setSelectedGradoSeccion(value)
    
    if (value) {
      // Cargar aulas específicas
      loadAulas(value)
      
      // Obtener información del grado-sección para determinar el aula y docente automáticos
      const gradoSeccionSeleccionado = gradosSecciones.find(gs => gs.idGradoSeccion.toString() === value)
      const aulaAutomatica = gradoSeccionSeleccionado 
        ? `Aula ${gradoSeccionSeleccionado.grado.nombre}° ${gradoSeccionSeleccionado.seccion.nombre}`
        : ''
      
      // Buscar el docente asignado a este grado-sección
      let docenteAutomatico = ''
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`/api/docentes/asignacion?gradoSeccionId=${value}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.docente) {
            docenteAutomatico = `${data.docente.nombre} ${data.docente.apellido}`
            console.log(`✅ Docente automático encontrado: ${docenteAutomatico}`)
          }
        }
      } catch (error) {
        console.log('⚠️ No se pudo cargar el docente automático:', error)
      }
      
      // Cargar horarios existentes y aplicar docente/aula automáticos
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`/api/horarios/anuales?idGradoSeccion=${value}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          const data = await response.json()
          const horariosExistentes = data.data.map((h: any) => ({
            diaSemana: h.diaSemana,
            horaInicio: h.horaInicio,
            horaFin: h.horaFin,
            // Precargar docente: usar el del horario si existe, sino el automático
            docente: h.docente?.nombre ? `${h.docente.nombre} ${h.docente.apellido || ''}`.trim() : docenteAutomatico,
            aula: h.aula || aulaAutomatica,
            tipoActividad: h.tipoActividad
          }))
          setHorarios(horariosExistentes)
          console.log(`✅ ${horariosExistentes.length} horarios cargados con docente precargado`)
        } else {
          setHorarios([])
        }
      } catch (error) {
        console.error('Error loading existing horarios:', error)
        setHorarios([])
      }
      
      console.log(`✅ Aula automática: ${aulaAutomatica}`)
      if (docenteAutomatico) {
        console.log(`✅ Docente automático: ${docenteAutomatico}`)
      }
    } else {
      setHorarios([])
      loadAulas() // Cargar aulas generales
    }
  }

  const handleHorarioChange = (index: number, field: keyof HorarioDetalle, value: string | number) => {
    setHorarios(prev => prev.map((horario, i) => 
      i === index ? { ...horario, [field]: value } : horario
    ))
  }

  const agregarHorarioRecuperacion = async () => {
    if (selectedGradoSeccion === 'TODOS') {
      // Modo masivo: agregar recuperación para todos los grados-secciones
      console.log('🏫 Agregando recuperación para TODOS los grados-secciones...')
      
      const nuevosHorarios: HorarioDetalle[] = []
      
      for (const gs of gradosSecciones) {
        const aulaAutomatica = `Aula ${gs.grado.nombre}° ${gs.seccion.nombre}`
        
        // Buscar el docente asignado a este grado-sección
        let docenteAutomatico = ''
        try {
          const token = localStorage.getItem('token')
          const response = await fetch(`/api/docentes/asignacion?gradoSeccionId=${gs.idGradoSeccion}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.docente) {
              docenteAutomatico = `${data.docente.nombre} ${data.docente.apellido}`
            }
          }
        } catch (error) {
          console.log(`⚠️ No se pudo cargar el docente para ${gs.grado.nombre}° ${gs.seccion.nombre}:`, error)
        }
        
        const nuevoHorario: HorarioDetalle = {
          diaSemana: 6,
          horaInicio: '09:00',
          horaFin: '12:00',
          docente: docenteAutomatico,
          aula: aulaAutomatica,
          tipoActividad: 'RECUPERACION'
        }
        nuevosHorarios.push(nuevoHorario)
      }
      
      console.log(`✅ Agregadas ${nuevosHorarios.length} recuperaciones`)
      setHorarios(prev => [...prev, ...nuevosHorarios])
      
    } else if (selectedGradoSeccion) {
      // Modo individual: agregar recuperación para un grado-sección específico
      let aulaAutomatica = ''
      let docenteAutomatico = ''
      
      const gradoSeccionSeleccionado = gradosSecciones.find(gs => gs.idGradoSeccion.toString() === selectedGradoSeccion)
      if (gradoSeccionSeleccionado) {
        aulaAutomatica = `Aula ${gradoSeccionSeleccionado.grado.nombre}° ${gradoSeccionSeleccionado.seccion.nombre}`
        
        // Buscar el docente asignado a este grado-sección
        try {
          const token = localStorage.getItem('token')
          const response = await fetch(`/api/docentes/asignacion?gradoSeccionId=${selectedGradoSeccion}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.docente) {
              docenteAutomatico = `${data.docente.nombre} ${data.docente.apellido}`
            }
          }
        } catch (error) {
          console.log('⚠️ No se pudo cargar el docente automático para recuperación:', error)
        }
      }

      const nuevoHorario: HorarioDetalle = {
        diaSemana: 6,
        horaInicio: '09:00',
        horaFin: '12:00',
        docente: docenteAutomatico,
        aula: aulaAutomatica,
        tipoActividad: 'RECUPERACION'
      }
      setHorarios(prev => [...prev, nuevoHorario])
    }
  }

  const eliminarHorario = (index: number) => {
    setHorarios(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Solo validar en modo individual
    if (modoSeleccion === 'individual') {
      if (!selectedGradoSeccion) {
        alert('Por favor selecciona un grado y sección')
        return
      }

      if (horarios.length === 0) {
        alert('No hay horarios para editar. Selecciona un grado-sección que tenga horarios creados.')
        return
      }
    }

    setLoading(true)
    try {
      // En modo "Todos" o "Por Rango", generar horarios desde los estados
      let horariosToSend = horarios
      
      if (modoSeleccion === 'todos' || modoSeleccion === 'rango') {
        horariosToSend = []
        
        // Agregar horarios regulares (Lunes a Viernes)
        for (let dia = 1; dia <= 5; dia++) {
          horariosToSend.push({
            diaSemana: dia,
            horaInicio: horaInicioRegular,
            horaFin: horaFinRegular,
            docente: '',
            aula: '',
            tipoActividad: 'CLASE_REGULAR'
          })
        }
        
        // Agregar horarios de recuperación si están activados
        if (diasRecuperacion.has(6)) {
          horariosToSend.push({
            diaSemana: 6,
            horaInicio: horaInicioRecuperacionSabado,
            horaFin: horaFinRecuperacionSabado,
            docente: '',
            aula: '',
            tipoActividad: 'RECUPERACION'
          })
        }
        
        if (diasRecuperacion.has(7)) {
          horariosToSend.push({
            diaSemana: 7,
            horaInicio: horaInicioRecuperacionDomingo,
            horaFin: horaFinRecuperacionDomingo,
            docente: '',
            aula: '',
            tipoActividad: 'RECUPERACION'
          })
        }
        
        console.log('📋 Horarios generados:', horariosToSend)
      }
      
      // En modo "Todos", usar 'TODOS' como idGradoSeccion
      const gradoSeccionToSend = modoSeleccion === 'todos' ? 'TODOS' : selectedGradoSeccion
      
      console.log('💾 Guardando horarios...', { 
        modo: modoSeleccion,
        idGradoSeccion: gradoSeccionToSend, 
        horarios: horariosToSend.length 
      })

      const token = localStorage.getItem('token')
      const response = await fetch('/api/horarios/clases', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          idGradoSeccion: gradoSeccionToSend,
          horarios: horariosToSend
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        console.log('✅ Horarios guardados exitosamente:', data)
        alert(`✅ Horarios actualizados exitosamente para ${data.data.gradoSeccion}`)
        
        // Llamar onSave si existe (para compatibilidad)
        if (onSave) {
          await onSave({
            idGradoSeccion: selectedGradoSeccion,
            horarios: horarios
          })
        }
        
        resetForm()
        onClose()
      } else {
        console.error('❌ Error al guardar horarios:', data)
        alert(`❌ Error al guardar horarios: ${data.error || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('❌ Error updating horarios:', error)
      alert('❌ Error al conectar con el servidor. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedGradoSeccion('')
    setHorarios([])
  }


  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            ✏️ Editar Horario de Clases
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
          {/* Modo de Selección */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Modo de Selección *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setModoSeleccion('individual')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  modoSeleccion === 'individual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📚 Individual
              </button>
              <button
                type="button"
                onClick={() => setModoSeleccion('rango')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  modoSeleccion === 'rango'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📊 Por Rango
              </button>
              <button
                type="button"
                onClick={() => setModoSeleccion('todos')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  modoSeleccion === 'todos'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🏫 Todos
              </button>
            </div>
          </div>

          {/* Selección Individual */}
          {modoSeleccion === 'individual' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grado y Sección *
              </label>
              <select
                value={selectedGradoSeccion}
                onChange={handleGradoSeccionChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                required
                disabled={loadingGrados}
              >
                <option value="">Seleccionar grado y sección...</option>
                {gradosSecciones.map((gs, gsIndex) => (
                  <option key={`grado-seccion-${gs.idGradoSeccion || gsIndex}`} value={gs.idGradoSeccion}>
                    {gs.grado.nivel.nombre} - {gs.grado.nombre}° {gs.seccion.nombre}
                  </option>
                ))}
              </select>
              {loadingGrados && (
                <p className="text-sm text-gray-500 mt-1">Cargando grados y secciones...</p>
              )}
            </div>
          )}

          {/* Selección por Rango */}
          {modoSeleccion === 'rango' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nivel *
                </label>
                <select
                  value={selectedNivel}
                  onChange={(e) => setSelectedNivel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  required
                >
                  <option value="">Seleccionar nivel...</option>
                  {[...new Set(gradosSecciones
                    .map(gs => gs.grado?.nivel?.nombre)
                    .filter(nombre => nombre && nombre.trim() !== ''))]
                    .map((nivel, index) => (
                      <option key={`nivel-${nivel}-${index}`} value={nivel}>{nivel}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grado Inicio *
                </label>
                <select
                  value={selectedGradoInicio}
                  onChange={(e) => setSelectedGradoInicio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  required
                  disabled={!selectedNivel}
                >
                  <option value="">Desde...</option>
                  {[...new Set(gradosSecciones
                    .filter(gs => gs.grado?.nivel?.nombre === selectedNivel)
                    .map(gs => gs.grado?.nombre)
                    .filter(nombre => nombre))]
                    .sort((a, b) => parseInt(a) - parseInt(b))
                    .map((grado, index) => (
                      <option key={`grado-inicio-${grado}-${index}`} value={grado}>{grado}°</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grado Fin *
                </label>
                <select
                  value={selectedGradoFin}
                  onChange={(e) => setSelectedGradoFin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  required
                  disabled={!selectedGradoInicio}
                >
                  <option value="">Hasta...</option>
                  {[...new Set(gradosSecciones
                    .filter(gs => gs.grado?.nivel?.nombre === selectedNivel)
                    .map(gs => gs.grado?.nombre)
                    .filter(nombre => nombre))]
                    .filter(grado => parseInt(grado) >= parseInt(selectedGradoInicio))
                    .sort((a, b) => parseInt(a) - parseInt(b))
                    .map((grado, index) => (
                      <option key={`grado-fin-${grado}-${index}`} value={grado}>{grado}°</option>
                    ))}
                </select>
              </div>
            </div>
          )}

          {selectedGradoSeccion && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                {selectedGradoSeccion === 'TODOS' ? (
                  <>
                    🏫 <strong>Modo Masivo:</strong> Editando horarios para TODOS los grados y secciones ({gradosSecciones.length} grados).
                    Los cambios se aplicarán a todos los horarios existentes.
                  </>
                ) : (
                  <>
                    ✏️ <strong>Modo Edición:</strong> Editando horarios existentes para el grado-sección seleccionado.
                    Los cambios se aplicarán a todos los horarios de esta sección.
                  </>
                )}
              </p>
            </div>
          )}

          <div className="space-y-4">
            {/* Modo Todos o Por Rango: Mostrar solo campos de hora */}
            {(modoSeleccion === 'todos' || modoSeleccion === 'rango') && (
              <div className="space-y-4">
                {/* Configuración de Horario Regular */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border-2 border-blue-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="bg-blue-500 p-2 rounded-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        📚 Horario de Clases Regulares
                      </h4>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        🕐 Hora de Inicio *
                      </label>
                      <input
                        type="time"
                        value={horaInicioRegular}
                        onChange={(e) => setHoraInicioRegular(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black font-medium text-lg transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        🕐 Hora de Fin *
                      </label>
                      <input
                        type="time"
                        value={horaFinRegular}
                        onChange={(e) => setHoraFinRegular(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black font-medium text-lg transition-all"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4 bg-blue-100 border-l-4 border-blue-500 p-3 rounded-r-lg">
                    <p className="text-sm text-blue-800 flex items-start">
                      <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span>
                        Este horario se aplicará de <strong>Lunes a Viernes</strong> para {modoSeleccion === 'todos' ? 'todos los grados y secciones' : 'el rango seleccionado'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Sección de Recuperación */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border-2 border-green-200 shadow-sm">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="bg-green-500 p-2 rounded-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      🔄 Horarios de Recuperación (Opcional)
                    </h4>
                  </div>
                  
                  {/* Botones Toggle para Sábado y Domingo */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Sábado */}
                    <button
                      type="button"
                      onClick={() => {
                        const newSet = new Set(diasRecuperacion)
                        if (newSet.has(6)) {
                          newSet.delete(6)
                        } else {
                          newSet.add(6)
                        }
                        setDiasRecuperacion(newSet)
                      }}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        diasRecuperacion.has(6)
                          ? 'bg-green-500 border-green-600 text-white shadow-md'
                          : 'bg-white border-gray-300 text-gray-600 hover:border-green-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">📅 Sábado</span>
                        {diasRecuperacion.has(6) && (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                    
                    {/* Domingo */}
                    <button
                      type="button"
                      onClick={() => {
                        const newSet = new Set(diasRecuperacion)
                        if (newSet.has(7)) {
                          newSet.delete(7)
                        } else {
                          newSet.add(7)
                        }
                        setDiasRecuperacion(newSet)
                      }}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        diasRecuperacion.has(7)
                          ? 'bg-green-500 border-green-600 text-white shadow-md'
                          : 'bg-white border-gray-300 text-gray-600 hover:border-green-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">📅 Domingo</span>
                        {diasRecuperacion.has(7) && (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                  </div>
                  
                  {/* Horarios de Sábado */}
                  {diasRecuperacion.has(6) && (
                    <div className="mb-4 p-4 bg-white rounded-lg border border-green-200">
                      <h5 className="font-semibold text-gray-900 mb-3">⏰ Horario del Sábado</h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Hora Inicio</label>
                          <input
                            type="time"
                            value={horaInicioRecuperacionSabado}
                            onChange={(e) => setHoraInicioRecuperacionSabado(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Hora Fin</label>
                          <input
                            type="time"
                            value={horaFinRecuperacionSabado}
                            onChange={(e) => setHoraFinRecuperacionSabado(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Horarios de Domingo */}
                  {diasRecuperacion.has(7) && (
                    <div className="mb-4 p-4 bg-white rounded-lg border border-green-200">
                      <h5 className="font-semibold text-gray-900 mb-3">⏰ Horario del Domingo</h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Hora Inicio</label>
                          <input
                            type="time"
                            value={horaInicioRecuperacionDomingo}
                            onChange={(e) => setHoraInicioRecuperacionDomingo(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Hora Fin</label>
                          <input
                            type="time"
                            value={horaFinRecuperacionDomingo}
                            onChange={(e) => setHoraFinRecuperacionDomingo(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {diasRecuperacion.size === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">Selecciona Sábado y/o Domingo para agregar horarios de recuperación</p>
                    </div>
                  )}
                </div>
              </div>
            )}


            {/* Modo Individual: Mostrar tarjetas de horarios */}
            {modoSeleccion === 'individual' && (
              <>
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-medium text-gray-900">
                    Horarios de Clase {selectedGradoSeccion && '(Editando)'}
                  </h4>
                  <button
                    type="button"
                    onClick={agregarHorarioRecuperacion}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    disabled={!selectedGradoSeccion}
                  >
                    + Agregar Recuperación
                  </button>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {horarios.map((horario, index) => (
                <div key={`horario-${index}-${horario.diaSemana}-${horario.tipoActividad}`} className={`p-5 rounded-xl shadow-sm transition-all hover:shadow-md ${
                  horario.tipoActividad === 'RECUPERACION' 
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300' 
                    : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${
                        horario.tipoActividad === 'RECUPERACION' ? 'bg-green-500' : 'bg-blue-500'
                      }`}>
                        {horario.tipoActividad === 'RECUPERACION' ? (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        )}
                      </div>
                      <h5 className="font-semibold text-gray-900">
                        {horario.tipoActividad === 'RECUPERACION' ? 'Recuperación' : 'Clase Regular'}
                      </h5>
                    </div>
                    {horario.tipoActividad === 'RECUPERACION' && (
                      <button
                        type="button"
                        onClick={() => eliminarHorario(index)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-medium bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Eliminar
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                        Día
                      </label>
                      <select
                        value={horario.diaSemana}
                        onChange={(e) => handleHorarioChange(index, 'diaSemana', parseInt(e.target.value))}
                        className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg text-sm text-black font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                      >
                        {diasSemana.map(dia => (
                          <option key={`dia-${dia.value}`} value={dia.value}>
                            {dia.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                        🕐 Hora Inicio
                      </label>
                      <input
                        type="time"
                        value={horario.horaInicio}
                        onChange={(e) => handleHorarioChange(index, 'horaInicio', e.target.value)}
                        className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg text-sm text-black font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white cursor-pointer hover:border-blue-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                        🕐 Hora Fin
                      </label>
                      <input
                        type="time"
                        value={horario.horaFin}
                        onChange={(e) => handleHorarioChange(index, 'horaFin', e.target.value)}
                        className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg text-sm text-black font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white cursor-pointer hover:border-blue-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                        🏫 Aula
                      </label>
                      <select
                        value={horario.aula}
                        onChange={(e) => handleHorarioChange(index, 'aula', e.target.value)}
                        className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg text-sm text-black font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                        disabled={loadingAulas}
                      >
                        <option value="">Seleccionar aula...</option>
                        {/* Aulas recomendadas primero */}
                        {aulas.filter(aula => aula.recomendada).map((aula, aulaIndex) => {
                          const originalIndex = aulas.findIndex(a => a === aula)
                          return (
                            <option key={`aula-recomendada-${originalIndex}-${aula.nombre}`} value={aula.nombre}>
                              ⭐ {aula.nombre} ({aula.tipo})
                            </option>
                          )
                        })}
                        {/* Separador si hay aulas recomendadas */}
                        {aulas.some(aula => aula.recomendada) && aulas.some(aula => !aula.recomendada) && (
                          <option disabled>──── Otras aulas ────</option>
                        )}
                        {/* Otras aulas */}
                        {aulas.filter(aula => !aula.recomendada).map((aula, aulaIndex) => {
                          const originalIndex = aulas.findIndex(a => a === aula)
                          return (
                            <option key={`aula-${originalIndex}-${aula.nombre}`} value={aula.nombre}>
                              {aula.nombre} ({aula.tipo})
                            </option>
                          )
                        })}
                      </select>
                      {loadingAulas && (
                        <p className="text-xs text-gray-500 mt-1">Cargando aulas...</p>
                      )}
                    </div>

                    <div className="sm:col-span-2 lg:col-span-4">
                      <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                        👨‍🏫 Docente
                      </label>
                      <select
                        value={horario.docente}
                        onChange={(e) => handleHorarioChange(index, 'docente', e.target.value)}
                        className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg text-sm text-black font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                        disabled={loadingDocentes}
                      >
                        <option value="">Seleccionar docente...</option>
                        {docentes.map((docente, docenteIndex) => (
                          <option key={`docente-${docente.idDocente || docenteIndex}`} value={`${docente.nombre} ${docente.apellido}`}>
                            {docente.nombre} {docente.apellido} - {docente.especialidad}
                          </option>
                        ))}
                      </select>
                      {loadingDocentes && (
                        <p className="text-xs text-gray-500 mt-1">Cargando docentes...</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {horarios.length === 0 && selectedGradoSeccion && (
                <div className="text-center py-8 text-gray-500">
                  <p>No hay horarios creados para este grado-sección.</p>
                  <p className="text-sm">Primero crea horarios desde el "Horario General".</p>
                </div>
              )}

              {!selectedGradoSeccion && (
                <div className="text-center py-8 text-gray-500">
                  <p>Selecciona un grado y sección para ver sus horarios.</p>
                </div>
              )}
            </div>
              </>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
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
              disabled={loading || (modoSeleccion === 'individual' && (!selectedGradoSeccion || horarios.length === 0))}
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
