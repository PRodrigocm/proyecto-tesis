'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import TomarAsistenciaPopup from '@/components/docente/TomarAsistenciaPopup'
import { closeTabAndRefresh } from '@/utils/popupUtils'

interface Estudiante {
  id: number
  nombre: string
  apellido: string
  dni: string
  codigo: string
  estado: 'presente' | 'tardanza' | 'pendiente' | 'sin_registrar'
  horaLlegada?: string
}

function TomarAsistenciaTabContent() {
  const searchParams = useSearchParams()
  const [claseId, setClaseId] = useState<string>('')
  const [fecha, setFecha] = useState<string>('')
  const [isReady, setIsReady] = useState<boolean>(false)

  useEffect(() => {
    const claseIdParam = searchParams.get('claseId')
    const fechaParam = searchParams.get('fecha')
    
    if (claseIdParam && fechaParam) {
      setClaseId(claseIdParam)
      setFecha(fechaParam)
      setIsReady(true)
    } else {
      alert('❌ Parámetros faltantes: claseId y fecha son requeridos')
      window.close()
    }
  }, [searchParams])

  const handleSave = (estudiantes: Estudiante[]) => {
    console.log('📤 handleSave llamado con estudiantes:', estudiantes)
    console.log('🔍 window.opener existe:', !!window.opener)
    console.log('🔍 window.opener cerrado:', window.opener?.closed)
    
    // Notificar a la pestaña padre sobre los cambios
    if (window.opener && !window.opener.closed) {
      const mensaje = {
        type: 'ASISTENCIA_UPDATED',
        data: { claseId, fecha, estudiantes }
      }
      console.log('📨 Enviando mensaje a ventana padre:', mensaje)
      window.opener.postMessage(mensaje, window.location.origin)
      console.log('✅ Mensaje enviado exitosamente')
    } else {
      console.warn('⚠️ No se pudo enviar mensaje: ventana padre no disponible')
    }
  }

  const handleClose = () => {
    closeTabAndRefresh()
  }

  // Manejar cierre con Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Configurar título de la pestaña
  useEffect(() => {
    if (isReady) {
      document.title = `📋 Tomar Asistencia - ${fecha}`
    }
  }, [isReady, fecha])

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <TomarAsistenciaPopup
      claseSeleccionada={claseId}
      fechaSeleccionada={fecha}
      onSave={handleSave}
    />
  )
}

export default function TomarAsistenciaTabPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Inicializando pestaña...</p>
        </div>
      </div>
    }>
      <TomarAsistenciaTabContent />
    </Suspense>
  )
}
