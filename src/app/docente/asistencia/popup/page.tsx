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
  estado: 'presente' | 'tardanza' | 'pendiente'
  horaLlegada?: string
}

function TomarAsistenciaPopupContent() {
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
    // Notificar a la ventana padre sobre los cambios
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({
        type: 'ASISTENCIA_UPDATED',
        data: { claseId, fecha, estudiantes }
      }, window.location.origin)
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

  // Configurar título de la ventana
  useEffect(() => {
    if (isReady) {
      document.title = `Tomar Asistencia - ${fecha}`
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
    <>
      {/* Botón de cerrar flotante */}
      <button
        onClick={handleClose}
        className="fixed top-4 right-4 z-50 bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700 transition-colors"
        title="Cerrar ventana (Esc)"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <TomarAsistenciaPopup
        claseSeleccionada={claseId}
        fechaSeleccionada={fecha}
        onSave={handleSave}
      />
    </>
  )
}

export default function TomarAsistenciaPopupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Inicializando...</p>
        </div>
      </div>
    }>
      <TomarAsistenciaPopupContent />
    </Suspense>
  )
}
