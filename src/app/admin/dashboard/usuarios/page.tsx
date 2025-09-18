'use client'

import { useState } from 'react'
import Link from 'next/link'
import CreateUserModal from '@/components/admin/CreateUserModal'

export default function UsuariosPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const userTypes = [
    {
      name: 'Apoderados',
      description: 'Gestiona los apoderados registrados en el sistema',
      href: '/admin/dashboard/usuarios/apoderados',
      icon: '👨‍👩‍👧‍👦',
      color: 'bg-blue-500',
      stats: {
        total: 0,
        active: 0
      }
    },
    {
      name: 'Docentes',
      description: 'Administra los docentes y profesores',
      href: '/admin/dashboard/usuarios/docentes',
      icon: '👩‍🏫',
      color: 'bg-green-500',
      stats: {
        total: 0,
        active: 0
      }
    },
    {
      name: 'Administrativos',
      description: 'Gestiona el personal administrativo',
      href: '/admin/dashboard/usuarios/administrativos',
      icon: '👔',
      color: 'bg-purple-500',
      stats: {
        total: 0,
        active: 0
      }
    }
  ]

  return (
    <div className="space-y-6">

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-semibold">👥</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Usuarios</dt>
                  <dd className="text-lg font-medium text-gray-900">0</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {userTypes.map((type) => (
          <div key={type.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 ${type.color} rounded-full flex items-center justify-center`}>
                    <span className="text-white text-sm">{type.icon}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{type.name}</dt>
                    <dd className="text-lg font-medium text-gray-900">{type.stats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* User Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userTypes.map((type) => (
          <Link
            key={type.name}
            href={type.href}
            className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div>
              <span className={`rounded-lg inline-flex p-3 ${type.color} text-white ring-4 ring-white`}>
                <span className="text-2xl">{type.icon}</span>
              </span>
            </div>
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                <span className="absolute inset-0" aria-hidden="true" />
                {type.name}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {type.description}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex space-x-4 text-sm text-gray-500">
                <span>Total: {type.stats.total}</span>
                <span>Activos: {type.stats.active}</span>
              </div>
              <span
                className="text-indigo-600 group-hover:text-indigo-500 transition-colors"
                aria-hidden="true"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Acciones Rápidas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nuevo Usuario
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar Datos
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Importar CSV
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Ver Reportes
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Actividad Reciente
          </h3>
          <div className="flow-root">
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Sin actividad reciente</h3>
              <p className="mt-1 text-sm text-gray-500">
                La actividad de usuarios aparecerá aquí cuando haya datos disponibles.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onUserCreated={() => {
          // Optionally refresh user data here
          console.log('Usuario creado exitosamente')
        }}
      />
    </div>
  )
}
