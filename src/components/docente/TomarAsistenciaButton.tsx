'use client'

import { useState, useEffect } from 'react'
import { openTomarAsistenciaTab } from '@/utils/popupUtils'

interface TomarAsistenciaButtonProps {
  claseId: string
  fecha: string
  onAsistenciaUpdated?: (estudiantes: any[]) => void
  disabled?: boolean
  className?: string
}

export default function TomarAsistenciaButton({
  claseId,
  fecha,
  onAsistenciaUpdated,
  disabled = false,
  className = ''
}: TomarAsistenciaButtonProps) {
  const [tabWindow, setTabWindow] = useState<Window | null>(null)
  const [isTabOpen, setIsTabOpen] = useState<boolean>(false)

  // Escuchar mensajes de la pestaña
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verificar origen por seguridad
      if (event.origin !== window.location.origin) return

      if (event.data.type === 'ASISTENCIA_UPDATED') {
        const { data } = event.data
        if (data.claseId === claseId && data.fecha === fecha) {
          onAsistenciaUpdated?.(data.estudiantes)
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [claseId, fecha, onAsistenciaUpdated])

  // Verificar si la pestaña sigue abierta
  useEffect(() => {
    if (!tabWindow) return

    const checkTab = setInterval(() => {
      if (tabWindow.closed) {
        setIsTabOpen(false)
        setTabWindow(null)
        clearInterval(checkTab)
      }
    }, 1000)

    return () => clearInterval(checkTab)
  }, [tabWindow])

  const handleOpenTab = () => {
    if (isTabOpen && tabWindow && !tabWindow.closed) {
      // Si ya está abierta, enfocarla
      tabWindow.focus()
      return
    }

    // Abrir nueva pestaña
    const newTab = openTomarAsistenciaTab(claseId, fecha, {
      focus: true
    })

    if (newTab) {
      setTabWindow(newTab)
      setIsTabOpen(true)
    }
  }

  const defaultClassName = `
    flex-1 sm:flex-none inline-flex items-center justify-center 
    px-3 sm:px-4 md:px-6 py-2.5 sm:py-2 md:py-3 
    bg-gradient-to-r from-blue-600 to-blue-700 
    text-white text-sm font-medium rounded-lg 
    hover:from-blue-700 hover:to-blue-800 
    active:from-blue-800 active:to-blue-900
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-all duration-200 shadow-lg
    min-h-[44px]
  `.trim().replace(/\s+/g, ' ')

  return (
    <button
      onClick={handleOpenTab}
      disabled={disabled || !claseId || !fecha}
      className={className || defaultClassName}
      title={isTabOpen ? 'Pestaña ya abierta - Click para enfocar' : 'Abrir pestaña de asistencia'}
    >
      <svg 
        className="w-5 h-5 mr-2" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
        />
      </svg>
      {isTabOpen ? (
        <>
          <span className="hidden sm:inline">🗂️ Pestaña Abierta</span>
          <span className="sm:hidden">🗂️ Abierta</span>
        </>
      ) : (
        <>
          <span className="hidden sm:inline">📋 Tomar Asistencia</span>
          <span className="sm:hidden">📋 Asistencia</span>
        </>
      )}
      {isTabOpen && (
        <div className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
      )}
    </button>
  )
}
