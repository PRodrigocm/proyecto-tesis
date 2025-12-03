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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-200 rounded-full animate-spin border-t-purple-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <CogIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Cargando tolerancia...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Control de Tolerancia
          </h1>
          <p className="mt-1 text-gray-500">
            Ajustar tiempos de tolerancia por aula
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
            <ClockIcon className="w-4 h-4 mr-1.5" />
            {aulas.length} aulas configuradas
          </span>
        </div>
      </div>
      {/* Tolerancia Global */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <GlobeAltIcon className="h-5 w-5" />
            Tolerancia Global
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="bg-purple-50 rounded-xl p-4">
              <label className="block text-sm font-medium text-purple-700 mb-1">
                Tolerancia Actual Promedio
              </label>
              <div className="text-3xl font-bold text-purple-600">
                {toleranciaGlobal} <span className="text-lg font-normal">min</span>
              </div>
              <p className="text-xs text-purple-500 mt-1">
                Promedio de todas las aulas
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nueva Tolerancia Global
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={nuevaToleranciaGlobal}
                  onChange={(e) => setNuevaToleranciaGlobal(parseInt(e.target.value) || 0)}
                  className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-black text-lg font-semibold"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">minutos</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Rango permitido: 0-60 minutos
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={aplicarToleranciaGlobal}
                disabled={updating}
                className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <GlobeAltIcon className="h-5 w-5 mr-2" />
                Aplicar a Todas
              </button>
              
              <button
                onClick={aplicarToleranciaSeleccionadas}
                disabled={updating || selectedAulas.length === 0}
                className="w-full inline-flex justify-center items-center px-4 py-3 border-2 border-purple-200 text-sm font-medium rounded-xl text-purple-700 bg-purple-50 hover:bg-purple-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Aplicar a Seleccionadas ({selectedAulas.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Información */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
        <div className="flex gap-3">
          <div className="p-2 bg-blue-100 rounded-lg h-fit">
            <ExclamationTriangleIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-900">Información sobre Tolerancia</h4>
            <div className="mt-2 text-sm text-blue-700 space-y-1">
              <p>- Dentro de tolerancia = <span className="font-semibold text-green-700">PRESENTE</span></p>
              <p>- Después de tolerancia = <span className="font-semibold text-yellow-700">TARDANZA</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Aulas */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <AcademicCapIcon className="h-5 w-5" />
            Tolerancia por Aula
          </h3>
        </div>
        
        {/* Vista móvil - Tarjetas */}
        <div className="block md:hidden p-4 space-y-3">
          {aulas.map((aula) => (
            <div 
              key={aula.id} 
              className={`bg-gray-50 rounded-xl p-4 border-2 transition-colors ${
                selectedAulas.includes(aula.id) ? 'border-purple-400 bg-purple-50' : 'border-transparent'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedAulas.includes(aula.id)}
                    onChange={() => handleAulaSelection(aula.id)}
                    className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{aula.grado}° {aula.seccion}</p>
                    <p className="text-xs text-gray-500">{aula.nivel}</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-purple-100 text-purple-700">
                  {aula.toleranciaActual} min
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <span className="flex items-center gap-1">
                  <ClockIcon className="h-4 w-4" />
                  {aula.horarioInicio} - {aula.horarioFin}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={toleranciasIndividuales[aula.id] || aula.toleranciaActual}
                  onChange={(e) => handleToleranciaIndividualChange(aula.id, parseInt(e.target.value) || 0)}
                  className="flex-1 px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-black"
                />
                <button
                  onClick={() => aplicarToleranciaIndividual(aula.id)}
                  disabled={updating || toleranciasIndividuales[aula.id] === aula.toleranciaActual}
                  className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  Aplicar
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Vista desktop - Tabla */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">
                  <input
                    type="checkbox"
                    checked={selectedAulas.length === aulas.length && aulas.length > 0}
                    onChange={(e) => setSelectedAulas(e.target.checked ? aulas.map(a => a.id) : [])}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aula</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actual</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nueva</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {aulas.map((aula) => (
                <tr key={aula.id} className={`hover:bg-gray-50 ${selectedAulas.includes(aula.id) ? 'bg-purple-50' : ''}`}>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedAulas.includes(aula.id)}
                      onChange={() => handleAulaSelection(aula.id)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">{aula.grado}° {aula.seccion}</div>
                    <div className="text-xs text-gray-500">{aula.nivel}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <ClockIcon className="h-4 w-4 text-gray-400" />
                      {aula.horarioInicio} - {aula.horarioFin}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-sm font-bold bg-purple-100 text-purple-700">
                      {aula.toleranciaActual} min
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={toleranciasIndividuales[aula.id] || aula.toleranciaActual}
                      onChange={(e) => handleToleranciaIndividualChange(aula.id, parseInt(e.target.value) || 0)}
                      className="w-20 px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-black"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => aplicarToleranciaIndividual(aula.id)}
                      disabled={updating || toleranciasIndividuales[aula.id] === aula.toleranciaActual}
                      className="px-4 py-2 text-xs font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
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
  )
}
