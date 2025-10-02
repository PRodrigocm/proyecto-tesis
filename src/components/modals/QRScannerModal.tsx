'use client'

import { useState } from 'react'
import {
  XMarkIcon,
  QrCodeIcon,
  CameraIcon,
  UserGroupIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline'

interface Estudiante {
  id: string
  nombre: string
  apellido: string
  dni: string
  grado: string
  seccion: string
  accion: string
  hora: string
}

interface QRScannerModalProps {
  isOpen: boolean
  onClose: () => void
  accionSeleccionada: 'entrada' | 'salida'
  setAccionSeleccionada: (accion: 'entrada' | 'salida') => void
  qrCode: string
  setQrCode: (code: string) => void
  handleQRScan: () => void
  estudiantesEscaneados: Estudiante[]
  setEstudiantesEscaneados: (estudiantes: Estudiante[]) => void
}

export default function QRScannerModal({
  isOpen,
  onClose,
  accionSeleccionada,
  setAccionSeleccionada,
  qrCode,
  setQrCode,
  handleQRScan,
  estudiantesEscaneados,
  setEstudiantesEscaneados
}: QRScannerModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-gray-600 bg-opacity-50">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                <CameraIcon className="h-5 w-5 inline mr-2" />
                Escáner QR con Cámara
              </h3>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Selector de Acción */}
            <div className="mb-6">
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => setAccionSeleccionada('entrada')}
                  className={`inline-flex items-center px-6 py-3 border text-sm font-medium rounded-md transition-colors ${
                    accionSeleccionada === 'entrada'
                      ? 'border-transparent text-white bg-green-600 hover:bg-green-700'
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                  Registrar Entrada
                </button>
                <button
                  onClick={() => setAccionSeleccionada('salida')}
                  className={`inline-flex items-center px-6 py-3 border text-sm font-medium rounded-md transition-colors ${
                    accionSeleccionada === 'salida'
                      ? 'border-transparent text-white bg-blue-600 hover:bg-blue-700'
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2" />
                  Registrar Salida
                </button>
              </div>
              <p className="text-center text-sm text-gray-500 mt-2">
                Selecciona la acción que deseas realizar al escanear el código QR
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Área del Escáner QR */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Escáner QR</h4>
                
                {/* Área de la Cámara */}
                <div className="bg-gray-100 rounded-lg p-4 mb-4">
                  <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg h-64 flex items-center justify-center">
                    <div className="text-center">
                      <QrCodeIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">
                        Cámara QR se mostraría aquí
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        (Requiere implementación de librería QR)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Input Manual para Pruebas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código QR Manual
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={qrCode}
                      onChange={(e) => setQrCode(e.target.value)}
                      placeholder="Ingresar código QR del estudiante"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                      onKeyPress={(e) => e.key === 'Enter' && handleQRScan()}
                    />
                    <button
                      onClick={handleQRScan}
                      disabled={!qrCode.trim()}
                      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                        accionSeleccionada === 'entrada' 
                          ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                          : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                      }`}
                    >
                      <QrCodeIcon className="h-4 w-4 mr-2" />
                      {accionSeleccionada === 'entrada' ? 'Entrada' : 'Salida'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Lista de Estudiantes Registrados */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  Estudiantes Registrados Hoy ({estudiantesEscaneados.length})
                </h4>
                
                <div className="bg-gray-50 rounded-lg p-4 h-80 overflow-y-auto">
                  {estudiantesEscaneados.length > 0 ? (
                    <div className="space-y-3">
                      {estudiantesEscaneados.map((estudiante, index) => (
                        <div key={index} className="bg-white rounded-lg p-3 shadow-sm border">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">
                                {estudiante.nombre} {estudiante.apellido}
                              </p>
                              <p className="text-sm text-gray-500">DNI: {estudiante.dni}</p>
                              <p className="text-xs text-gray-400">
                                {estudiante.grado} - {estudiante.seccion}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                estudiante.accion === 'entrada' 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {estudiante.accion === 'entrada' ? 'Entrada' : 'Salida'}
                              </span>
                              <p className="text-xs text-gray-500 mt-1">
                                {estudiante.hora}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <UserGroupIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-sm text-gray-500">
                        No hay estudiantes registrados aún
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Los estudiantes aparecerán aquí al escanear sus códigos QR
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cerrar
            </button>
            <button
              onClick={() => setEstudiantesEscaneados([])}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
            >
              Limpiar Lista
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
