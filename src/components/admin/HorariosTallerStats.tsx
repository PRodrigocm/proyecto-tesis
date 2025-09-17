interface HorariosTallerStatsProps {
  stats: {
    total: number
    activos: number
    inactivos: number
    talleres: number
    docentes: number
    totalInscritos: number
    cupoTotal: number
  }
}

export default function HorariosTallerStats({ stats }: HorariosTallerStatsProps) {
  const ocupacionPorcentaje = stats.cupoTotal > 0 ? (stats.totalInscritos / stats.cupoTotal) * 100 : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 font-semibold">🎨</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Talleres</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.talleres}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-semibold">✓</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Activos</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.activos}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 font-semibold">👨‍🏫</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Docentes</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.docentes}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-semibold">👥</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Ocupación</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {ocupacionPorcentaje.toFixed(1)}%
                </dd>
                <dd className="text-xs text-gray-500">
                  {stats.totalInscritos}/{stats.cupoTotal}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
