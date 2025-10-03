'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  CogIcon,
  ClockIcon,
  AcademicCapIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface AulaTolerancia {
  id: string
  grado: string
  seccion: string
  nivel: string
  toleranciaActual: number
  horarioInicio: string
  horarioFin: string
  totalEstudiantes: number
  docenteAsignado?: string
}

export default function ControlTolerancia() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [aulas, setAulas] = useState<AulaTolerancia[]>([])
  const [toleranciaGlobal, setToleranciaGlobal] = useState(10)
  const [nuevaToleranciaGlobal, setNuevaToleranciaGlobal] = useState(10)
  const [toleranciasIndividuales, setToleranciasIndividuales] = useState<{[key: string]: number}>({})
  const [updating, setUpdating] = useState(false)
  const [selectedAulas, setSelectedAulas] = useState<string[]>([])

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token')
      const userString = localStorage.getItem('user')
      
      if (!token || !userString) {
        router.push('/login')
        return
      }

      const user = JSON.parse(userString)
      if (!['AUXILIAR', 'ADMINISTRATIVO'].includes(user.rol)) {
        router.push('/login')
        return
      }

      loadAulasTolerancia()
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const loadAulasTolerancia = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auxiliar/tolerancia/aulas', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAulas(data.aulas)
        setToleranciaGlobal(data.toleranciaPromedio || 10)
        setNuevaToleranciaGlobal(data.toleranciaPromedio || 10)
        
        // Inicializar tolerancias individuales
        const tolerancias: {[key: string]: number} = {}
        data.aulas.forEach((aula: AulaTolerancia) => {
          tolerancias[aula.id] = aula.toleranciaActual
        })
        setToleranciasIndividuales(tolerancias)
      }
    } catch (error) {
      console.error('Error loading aulas tolerancia:', error)
    }
  }

  const handleToleranciaIndividualChange = (aulaId: string, tolerancia: number) => {
    setToleranciasIndividuales(prev => ({
      ...prev,
      [aulaId]: tolerancia
    }))
  }

  const handleAulaSelection = (aulaId: string) => {
    setSelectedAulas(prev => 
      prev.includes(aulaId) 
        ? prev.filter(id => id !== aulaId)
        : [...prev, aulaId]
    )
  }

  const aplicarToleranciaGlobal = async () => {
    if (!confirm(`¿Aplicar tolerancia de ${nuevaToleranciaGlobal} minutos a todas las aulas?`)) {
      return
    }

    setUpdating(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auxiliar/tolerancia/global', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          toleranciaMinutos: nuevaToleranciaGlobal 
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`✅ Tolerancia global actualizada: ${data.aulasActualizadas} aulas modificadas`)
        loadAulasTolerancia()
      } else {
        const error = await response.json()
        alert(`❌ Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating global tolerancia:', error)
      alert('❌ Error al actualizar tolerancia global')
    } finally {
      setUpdating(false)
    }
  }

  const aplicarToleranciaSeleccionadas = async () => {
    if (selectedAulas.length === 0) {
      alert('Seleccione al menos un aula')
      return
    }

    const toleranciaParaSeleccionadas = nuevaToleranciaGlobal

    if (!confirm(`¿Aplicar tolerancia de ${toleranciaParaSeleccionadas} minutos a ${selectedAulas.length} aulas seleccionadas?`)) {
      return
    }

    setUpdating(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auxiliar/tolerancia/seleccionadas', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          aulaIds: selectedAulas,
          toleranciaMinutos: toleranciaParaSeleccionadas
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`✅ Tolerancia actualizada en ${data.aulasActualizadas} aulas seleccionadas`)
        setSelectedAulas([])
        loadAulasTolerancia()
      } else {
        const error = await response.json()
        alert(`❌ Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating selected tolerancia:', error)
      alert('❌ Error al actualizar tolerancia de aulas seleccionadas')
    } finally {
      setUpdating(false)
    }
  }

  const aplicarToleranciaIndividual = async (aulaId: string) => {
    const tolerancia = toleranciasIndividuales[aulaId]
    const aula = aulas.find(a => a.id === aulaId)
    
    if (!aula || tolerancia === aula.toleranciaActual) {
      return
    }

    if (!confirm(`¿Actualizar tolerancia del aula ${aula.grado}° ${aula.seccion} a ${tolerancia} minutos?`)) {
      return
    }

    setUpdating(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auxiliar/tolerancia/individual', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          aulaId,
          toleranciaMinutos: tolerancia
        })
      })

      if (response.ok) {
        alert(`✅ Tolerancia actualizada para ${aula.grado}° ${aula.seccion}`)
        loadAulasTolerancia()
      } else {
        const error = await response.json()
        alert(`❌ Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating individual tolerancia:', error)
      alert('❌ Error al actualizar tolerancia individual')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-black">Cargando control de tolerancia...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Control de Tolerancia
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Ajustar tiempos de tolerancia por aula
        </p>
      </div>
        {/* Tolerancia Global */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              <GlobeAltIcon className="h-5 w-5 inline mr-2" />
              Tolerancia Global
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tolerancia Actual Promedio
                </label>
                <div className="text-2xl font-bold text-blue-600">
                  {toleranciaGlobal} minutos
                </div>
                <p className="text-xs text-gray-500">
                  Promedio de todas las aulas
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva Tolerancia Global
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={nuevaToleranciaGlobal}
                  onChange={(e) => setNuevaToleranciaGlobal(parseInt(e.target.value) || 0)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minutos de tolerancia (0-60)
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={aplicarToleranciaGlobal}
                  disabled={updating}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <GlobeAltIcon className="h-4 w-4 mr-2" />
                  Aplicar a Todas
                </button>
                
                <button
                  onClick={aplicarToleranciaSeleccionadas}
                  disabled={updating || selectedAulas.length === 0}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Aplicar a Seleccionadas ({selectedAulas.length})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Información */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">Información sobre Tolerancia</h4>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>La tolerancia determina cuántos minutos después del horario de inicio se considera tardanza</li>
                  <li>Estudiantes que lleguen dentro de la tolerancia se marcan como PRESENTE</li>
                  <li>Estudiantes que lleguen después de la tolerancia se marcan como TARDANZA</li>
                  <li>Puede aplicar tolerancia global a todas las aulas o individual por aula</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Aulas */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              <AcademicCapIcon className="h-5 w-5 inline mr-2" />
              Tolerancia por Aula ({aulas.length} aulas)
            </h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedAulas.length === aulas.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAulas(aulas.map(a => a.id))
                          } else {
                            setSelectedAulas([])
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aula
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Horario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estudiantes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tolerancia Actual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nueva Tolerancia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {aulas.map((aula) => (
                    <tr key={aula.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedAulas.includes(aula.id)}
                          onChange={() => handleAulaSelection(aula.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {aula.grado}° {aula.seccion}
                          </div>
                          <div className="text-sm text-gray-500">
                            {aula.nivel}
                          </div>
                          {aula.docenteAsignado && (
                            <div className="text-xs text-gray-400">
                              {aula.docenteAsignado}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {aula.horarioInicio} - {aula.horarioFin}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {aula.totalEstudiantes} estudiantes
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {aula.toleranciaActual} min
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          max="60"
                          value={toleranciasIndividuales[aula.id] || aula.toleranciaActual}
                          onChange={(e) => handleToleranciaIndividualChange(aula.id, parseInt(e.target.value) || 0)}
                          className="block w-20 px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => aplicarToleranciaIndividual(aula.id)}
                          disabled={updating || toleranciasIndividuales[aula.id] === aula.toleranciaActual}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CogIcon className="h-3 w-3 mr-1" />
                          Aplicar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
    </div>
  )
}
