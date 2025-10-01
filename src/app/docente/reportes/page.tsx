'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ReportesDocente from '@/components/docente/ReportesDocente'

export default function ReportesPage() {
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
          <span className="text-black">Cargando reportes...</span>
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
            <h1 className="text-2xl font-bold text-black">Reportes de Asistencia</h1>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold hover:bg-blue-600 transition-colors"
              title="Información sobre reportes"
            >
              i
            </button>
          </div>
          <p className="text-black">
            Genera reportes detallados de asistencias y retiros con exportación automática en múltiples formatos.
          </p>
        </div>

        {/* Componente principal */}
        <ReportesDocente />

        {/* Información adicional (colapsable) */}
        {showInfo && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6 animate-fadeIn">
            <h3 className="text-lg font-semibold text-black mb-4">ℹ️ Información sobre Reportes</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-black mb-2">📊 Tipos de Reportes:</h4>
                <ul className="text-sm text-black space-y-1">
                  <li>• <strong>Semanal:</strong> Datos de la semana actual (Lunes a Domingo)</li>
                  <li>• <strong>Mensual:</strong> Datos del mes completo seleccionado</li>
                  <li>• <strong>Personalizado:</strong> Rango de fechas específico</li>
                  <li>• <strong>Por grado/sección:</strong> Filtros específicos disponibles</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-black mb-2">📄 Formatos de Exportación:</h4>
                <ul className="text-sm text-black space-y-1">
                  <li>• <strong>PDF:</strong> Documento con formato APA, ideal para presentaciones</li>
                  <li>• <strong>Excel:</strong> Hoja de cálculo para análisis estadístico</li>
                  <li>• <strong>Word:</strong> Documento editable con formato académico</li>
                  <li>• <strong>Todos con normas APA:</strong> Referencias y formato académico</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-black mb-2">📈 Datos Incluidos en Reportes:</h4>
                <ul className="text-sm text-black space-y-1">
                  <li><strong>Asistencias:</strong> Presente, tardanzas, inasistencias, justificadas</li>
                  <li><strong>Retiros:</strong> Fecha, hora, tipo, apoderados involucrados</li>
                  <li><strong>Estadísticas:</strong> Porcentajes, promedios, comparativas</li>
                  <li><strong>Detalles:</strong> Información completa por estudiante</li>
                  <li><strong>Metadatos:</strong> Información institucional y del docente</li>
                </ul>
              </div>
              
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-black mb-2">⚙️ Exportación Automática:</h4>
                <ul className="text-sm text-black space-y-1">
                  <li><strong>Programación:</strong> Semanal o mensual automática</li>
                  <li><strong>Formato:</strong> Elige PDF, Excel o Word</li>
                  <li><strong>Notificaciones:</strong> Email cuando se genere</li>
                  <li><strong>Personalización:</strong> Incluir/excluir secciones</li>
                  <li><strong>Horario:</strong> Configura día y hora de generación</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-black mb-2">📋 Información de Base de Datos:</h4>
                <ul className="text-sm text-black space-y-1">
                  <li><strong>Estudiantes:</strong> Datos completos desde tabla usuarios</li>
                  <li><strong>Asistencias:</strong> Registros con estados y horarios</li>
                  <li><strong>Estados:</strong> PRESENTE, TARDANZA, INASISTENCIA, JUSTIFICADA</li>
                  <li><strong>Retiros:</strong> Tipos, estados, apoderados, observaciones</li>
                  <li><strong>Histórico:</strong> Cambios de estado con fechas y responsables</li>
                </ul>
              </div>
              
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-medium text-black mb-2">🎯 Normas APA Implementadas:</h4>
                <ul className="text-sm text-black space-y-1">
                  <li><strong>Formato:</strong> Títulos, subtítulos y estructura estándar</li>
                  <li><strong>Referencias:</strong> Citas del sistema y fuentes de datos</li>
                  <li><strong>Metadatos:</strong> Autor, fecha, institución</li>
                  <li><strong>Metodología:</strong> Descripción de recolección de datos</li>
                  <li><strong>Conclusiones:</strong> Análisis e interpretación de resultados</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-black mb-2">⚠️ Consideraciones Importantes:</h4>
              <ul className="text-sm text-black space-y-1">
                <li>• <strong>Privacidad:</strong> Los reportes contienen datos sensibles de estudiantes</li>
                <li>• <strong>Seguridad:</strong> Solo docentes autorizados pueden generar reportes</li>
                <li>• <strong>Exactitud:</strong> Los datos provienen directamente de la base de datos</li>
                <li>• <strong>Actualización:</strong> Los reportes reflejan el estado actual al momento de generación</li>
                <li>• <strong>Respaldo:</strong> Guarda copias de reportes importantes para auditorías</li>
              </ul>
            </div>

            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-black mb-2">💡 Consejos de Uso:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-black">
                <div>
                  <h5 className="font-medium mb-1">Para Reportes Efectivos:</h5>
                  <ul className="space-y-1">
                    <li>• Genera reportes semanales para seguimiento continuo</li>
                    <li>• Usa reportes mensuales para evaluaciones periódicas</li>
                    <li>• Filtra por grado/sección para análisis específicos</li>
                    <li>• Exporta en PDF para presentaciones oficiales</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium mb-1">Para Exportación Automática:</h5>
                  <ul className="space-y-1">
                    <li>• Configura horarios fuera del horario escolar</li>
                    <li>• Usa email institucional para notificaciones</li>
                    <li>• Incluye resumen ejecutivo para revisión rápida</li>
                    <li>• Programa reportes mensuales el primer día del mes</li>
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
