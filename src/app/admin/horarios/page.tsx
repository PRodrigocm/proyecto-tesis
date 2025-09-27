'use client'

import { useState, useEffect } from 'react'
import HorariosClasesView from '@/components/admin/HorariosClasesView'

export default function HorariosPage() {
  const [ieId, setIeId] = useState<number>(1) // Por defecto IE 1

  // En un caso real, obtendrías el ieId del usuario logueado
  useEffect(() => {
    // Aquí podrías obtener el ieId del contexto de usuario o localStorage
    const userIeId = localStorage.getItem('userIeId')
    if (userIeId) {
      setIeId(parseInt(userIeId))
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <HorariosClasesView ieId={ieId} />
      </div>
    </div>
  )
}
