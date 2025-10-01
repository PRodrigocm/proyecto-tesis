'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import HorariosDocente from '@/components/docente/HorariosDocente'
import CalendarioEscolar from '@/components/docente/CalendarioEscolar'

export default function HorariosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [showInfo, setShowInfo] = useState(false)

  useEffect(() => {
    // Verificar autenticación
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token')
        const userString = localStorage.getItem('user')
        
        if (!token) {
          console.log('❌ No hay token, redirigiendo al login')
          router.push('/login')
          return
        }

        if (userString) {
          const user = JSON.parse(userString)
          console.log('👤 Usuario:', user)
          
          if (!['DOCENTE', 'ADMINISTRATIVO'].includes(user.rol)) {
            console.log('❌ Usuario no tiene permisos:', user.rol)
            router.push('/login')
            return
          }
        } else {
          console.log('❌ No hay información de usuario')
          router.push('/login')
          return
        }
        
        console.log('✅ Autenticación verificada correctamente')
        setLoading(false)
      } catch (error) {
        console.error('❌ Error al verificar autenticación:', error)
        router.push('/login')
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-black">Cargando horarios...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-4 flex items-center gap-3">
            <h1 className="text-2xl font-bold text-black">Horarios de Clase</h1>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold hover:bg-blue-600 transition-colors"
              title="Información sobre horarios"
            >
              i
            </button>
          </div>
          <p className="text-black">
            Gestiona tus horarios de clase y ajusta las tolerancias de asistencia según tus necesidades.
          </p>
        </div>

        {/* Layout con dos columnas */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Componente principal de horarios */}
          <div className="xl:col-span-2">
            <HorariosDocente />
          </div>
          
          {/* Calendario escolar */}
          <div className="xl:col-span-1">
            <CalendarioEscolar />
          </div>
        </div>

        {/* Información adicional (colapsable) */}
        {showInfo && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6 animate-fadeIn">
            <h3 className="text-lg font-semibold text-black mb-4">ℹ️ Información sobre Horarios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-black mb-2">⏰ Gestión de Tolerancias:</h4>
                <ul className="text-sm text-black space-y-1">
                  <li>• <strong>0-5 minutos:</strong> Muy estricto, ideal para evaluaciones importantes</li>
                  <li>• <strong>10-15 minutos:</strong> Estándar recomendado para clases regulares</li>
                  <li>• <strong>20-30 minutos:</strong> Flexible, para actividades especiales o talleres</li>
                  <li>• <strong>Personalizable:</strong> Ajusta según el tipo de clase y contexto</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-black mb-2">📅 Tipos de Actividad:</h4>
                <ul className="text-sm text-black space-y-1">
                  <li>• <strong>Clase Regular:</strong> Clases normales de lunes a viernes</li>
                  <li>• <strong>Reforzamiento:</strong> Clases de apoyo académico</li>
                  <li>• <strong>Recuperación:</strong> Clases para estudiantes con dificultades</li>
                  <li>• <strong>Evaluación:</strong> Sesiones de exámenes y pruebas</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-black mb-2">👨‍🏫 Funciones del Docente:</h4>
                <ol className="text-sm text-black space-y-1">
                  <li><strong>1.</strong> Ver todos sus horarios asignados</li>
                  <li><strong>2.</strong> Ajustar tolerancias de asistencia por clase</li>
                  <li><strong>3.</strong> Cambiar entre vista lista y calendario</li>
                  <li><strong>4.</strong> Filtrar horarios por grado, sección o día</li>
                  <li><strong>5.</strong> Monitorear estadísticas de tolerancia</li>
                </ol>
              </div>
              
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-black mb-2">📊 Vistas Disponibles:</h4>
                <ul className="text-sm text-black space-y-1">
                  <li>• <strong>Vista Lista:</strong> Detalles completos de cada horario</li>
                  <li>• <strong>Vista Calendario:</strong> Organización visual por días</li>
                  <li>• <strong>Filtros:</strong> Búsqueda por materia, grado, sección o día</li>
                  <li>• <strong>Estadísticas:</strong> Resumen de horarios y tolerancias</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-black mb-2">💡 Consejos para Tolerancias:</h4>
              <ul className="text-sm text-black space-y-1">
                <li>• <strong>Consistencia:</strong> Mantén tolerancias similares para el mismo tipo de clase</li>
                <li>• <strong>Contexto:</strong> Considera factores como transporte público y distancia</li>
                <li>• <strong>Comunicación:</strong> Informa a los estudiantes sobre las tolerancias establecidas</li>
                <li>• <strong>Flexibilidad:</strong> Ajusta según situaciones especiales o emergencias</li>
                <li>• <strong>Evaluaciones:</strong> Reduce la tolerancia para exámenes importantes</li>
              </ul>
            </div>

            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-medium text-black mb-2">🎯 Impacto de las Tolerancias:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-black">
                <div>
                  <h5 className="font-medium mb-1">✅ Beneficios:</h5>
                  <ul className="space-y-1">
                    <li>• Reduce tardanzas injustas</li>
                    <li>• Mejora el ambiente de clase</li>
                    <li>• Considera factores externos</li>
                    <li>• Fomenta la responsabilidad</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium mb-1">⚠️ Consideraciones:</h5>
                  <ul className="space-y-1">
                    <li>• No debe fomentar impuntualidad</li>
                    <li>• Debe ser justa para todos</li>
                    <li>• Revisar periódicamente</li>
                    <li>• Documentar cambios importantes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
