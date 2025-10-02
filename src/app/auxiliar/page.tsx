'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuxiliarRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirigir automáticamente al dashboard
    router.replace('/auxiliar/dashboard')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span className="text-black">Redirigiendo al panel auxiliar...</span>
      </div>
    </div>
  )
}
