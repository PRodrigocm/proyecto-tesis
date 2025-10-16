'use client'

import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
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
  codigo?: string
  estado?: 'PRESENTE' | 'AUSENTE' | 'RETIRADO' | 'TARDANZA'
}

interface CameraDevice {
  id: string
  label: string
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
  setEstudiantesEscaneados: (estudiantes: Estudiante[] | ((prev: Estudiante[]) => Estudiante[])) => void
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
  const [ultimoEscaneo, setUltimoEscaneo] = useState<string>('')
  const [estudianteEscaneado, setEstudianteEscaneado] = useState<Estudiante | null>(null)
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState<boolean>(false)
  const [camaras, setCamaras] = useState<CameraDevice[]>([])
  const [camaraSeleccionada, setCamaraSeleccionada] = useState<string>('')
  const [scannerActive, setScannerActive] = useState<boolean>(false)
  const [modoEscaneo, setModoEscaneo] = useState<'camara' | 'manual'>('camara')
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [permisosCamara, setPermisosCamara] = useState<'granted' | 'denied' | 'pending'>('pending')
  const [error, setError] = useState<string>('')
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])

  // Cargar estudiantes para mostrar información
  useEffect(() => {
    if (isOpen) {
      // Solo cargar estudiantes si la lista está vacía
      if (estudiantes.length === 0) {
        loadEstudiantes()
      }
      detectarCamaras()
    }
  }, [isOpen])

  const loadEstudiantes = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auxiliar/asistencia/estudiantes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setEstudiantes(data.estudiantes || [])
      }
    } catch (error) {
      console.error('Error loading estudiantes:', error)
    }
  }

  // Detectar cámaras disponibles
  const detectarCamaras = async () => {
    try {
      setError('')
      setPermisosCamara('pending')
      
      const devices = await Html5Qrcode.getCameras()
      if (devices && devices.length) {
        const camarasFormateadas = devices.map((device, index) => ({
          id: device.id,
          label: device.label || `Cámara ${index + 1}`
        }))
        setCamaras(camarasFormateadas)
        setCamaraSeleccionada(camarasFormateadas[0].id)
        setPermisosCamara('granted')
      } else {
        setError('No se encontraron cámaras disponibles')
        setPermisosCamara('denied')
      }
    } catch (error) {
      console.error('Error detecting cameras:', error)
      setError('Error al acceder a las cámaras. Verifica los permisos.')
      setPermisosCamara('denied')
    }
  }

  // Procesar código QR mejorado
  const procesarCodigoQR = async (codigo: string) => {
    console.log('🔍 Procesando código:', codigo)
    setUltimoEscaneo(codigo)
    
    // El QR contiene el DNI del estudiante
    const estudiante = estudiantes.find(est => est.dni === codigo)
    
    if (estudiante) {
      // Mostrar nombre del estudiante
      setEstudianteEscaneado({ ...estudiante, accion: accionSeleccionada, hora: new Date().toLocaleTimeString() })
      
      // Procesar después de mostrar nombre
      setTimeout(async () => {
        try {
          const token = localStorage.getItem('token')
          const response = await fetch('/api/auxiliar/asistencia/qr-scan', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
              qrCode: codigo,
              accion: accionSeleccionada
            })
          })

          if (response.ok) {
            const data = await response.json()
            
            // Mostrar confirmación exitosa
            setMostrarConfirmacion(true)
            
            // Actualizar el estado del estudiante en la lista principal
            setEstudiantes((prevEstudiantes: Estudiante[]) => 
              prevEstudiantes.map(est => 
                est.dni === codigo 
                  ? { 
                      ...est, 
                      estado: accionSeleccionada === 'entrada' ? 'PRESENTE' : 'RETIRADO' as 'PRESENTE' | 'AUSENTE' | 'RETIRADO' | 'TARDANZA',
                      hora: new Date().toLocaleTimeString()
                    }
                  : est
              )
            )
            
            // Agregar a lista de escaneados
            const nuevoEscaneado: Estudiante = {
              id: data.estudiante.id,
              nombre: data.estudiante.nombre,
              apellido: data.estudiante.apellido,
              dni: data.estudiante.dni,
              grado: data.estudiante.grado,
              seccion: data.estudiante.seccion,
              accion: accionSeleccionada,
              hora: new Date().toLocaleTimeString()
            }
            setEstudiantesEscaneados((prev: Estudiante[]) => [nuevoEscaneado, ...prev])
            
            // Ocultar confirmación después de 4 segundos
            setTimeout(() => {
              setMostrarConfirmacion(false)
              setTimeout(() => {
                setEstudianteEscaneado(null)
              }, 1000)
            }, 4000)
            
          } else {
            const error = await response.json()
            alert(`❌ Error: ${error.error}`)
            setEstudianteEscaneado(null)
          }
        } catch (error) {
          console.error('Error scanning QR:', error)
          alert('❌ Error al procesar código QR')
          setEstudianteEscaneado(null)
        }
      }, 800)
      
    } else {
      setTimeout(() => {
        alert('❌ Código no válido o estudiante no encontrado')
      }, 500)
    }
  }

  // Iniciar scanner
  const iniciarEscaner = async () => {
    if (!camaraSeleccionada) return
    
    try {
      const scanner = new Html5Qrcode('qr-reader-auxiliar')
      scannerRef.current = scanner

      const config = {
        fps: 15,
        qrbox: function(viewfinderWidth: number, viewfinderHeight: number) {
          const minEdgePercentage = 0.8
          const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight)
          const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage)
          return {
            width: qrboxSize,
            height: qrboxSize
          }
        },
        aspectRatio: 16/9,
        videoConstraints: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'environment'
        }
      }

      await scanner.start(
        camaraSeleccionada,
        config,
        (decodedText) => {
          console.log('✅ QR escaneado:', decodedText)
          procesarCodigoQR(decodedText)
        },
        (errorMessage) => {
          // Error silencioso durante escaneo
        }
      )
      
      setScannerActive(true)
      setError('')
    } catch (error) {
      console.error('Error starting scanner:', error)
      setError('Error al iniciar el escáner')
    }
  }

  // Detener scanner
  const detenerEscaner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
        scannerRef.current = null
        setScannerActive(false)
      } catch (error) {
        console.error('Error stopping scanner:', error)
      }
    }
  }

  // Limpiar al cerrar
  const handleClose = () => {
    detenerEscaner()
    setUltimoEscaneo('')
    setEstudianteEscaneado(null)
    setMostrarConfirmacion(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-none max-h-none overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-black">Scanner QR - Control de Asistencia</h2>
            <p className="text-sm text-black font-medium">
              Modo: {accionSeleccionada === 'entrada' ? 'Registro de Entrada' : 'Registro de Salida'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6 h-full flex flex-col">
          {/* Selector de Modo */}
          <div className="mb-6">
            <div className="flex space-x-4">
              <button
                onClick={() => setModoEscaneo('camara')}
                className={`px-4 py-2 rounded-md font-medium ${
                  modoEscaneo === 'camara'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                📷 Escanear QR
              </button>
              <button
                onClick={() => setModoEscaneo('manual')}
                className={`px-4 py-2 rounded-md font-medium ${
                  modoEscaneo === 'manual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                ⌨️ Código Manual
              </button>
            </div>
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
          </div>

          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-6 flex-1 min-h-0">
            {/* Panel de escaneo - Ocupa 2/3 del espacio en desktop, toda la pantalla en móvil */}
            <div className="lg:col-span-2 flex-1 min-h-0">
              {modoEscaneo === 'camara' ? (
                <div>
                  <h3 className="text-lg font-medium mb-4">Escanear Código QR</h3>
                  
                  {/* Selector de cámara */}
                  {camaras.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-black mb-2">
                        Seleccionar Cámara:
                      </label>
                      <select
                        value={camaraSeleccionada}
                        onChange={(e) => setCamaraSeleccionada(e.target.value)}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                      >
                        {camaras.map((camara) => (
                          <option key={camara.id} value={camara.id}>
                            {camara.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Área de escaneo - Pantalla completa */}
                  <div className="relative">
                    {/* Overlay con información del estudiante - Confirmación exitosa */}
                    {mostrarConfirmacion && estudianteEscaneado && (
                      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-xl shadow-2xl p-6 border-3 border-green-500 min-w-[300px] animate-bounce">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-green-800 text-xl">{estudianteEscaneado.nombre} {estudianteEscaneado.apellido}</p>
                            <p className="text-green-600 text-base font-medium mt-1">
                              {accionSeleccionada === 'entrada' ? '✅ Entrada Registrada' : '🚪 Salida Registrada'}
                            </p>
                            <p className="text-green-500 text-sm">
                              Registrado a las {estudianteEscaneado.hora}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 text-center">
                          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            🎉 ¡{accionSeleccionada === 'entrada' ? 'Entrada' : 'Salida'} registrada exitosamente!
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Información del último estudiante escaneado */}
                    {ultimoEscaneo && estudianteEscaneado && !mostrarConfirmacion && (
                      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-40 bg-blue-600 text-white rounded-xl shadow-lg p-4 min-w-[250px]">
                        <div className="text-center">
                          <p className="font-bold text-lg">{estudianteEscaneado.nombre} {estudianteEscaneado.apellido}</p>
                          <p className="text-sm opacity-90 mt-1">Código: {ultimoEscaneo}</p>
                          <div className="mt-2 flex justify-center">
                            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div 
                      id="qr-reader-auxiliar" 
                      className="w-full border-2 border-dashed border-gray-300 rounded-lg overflow-hidden"
                      style={{ 
                        minHeight: '300px', 
                        height: 'min(75vh, 600px)', 
                        maxHeight: '600px'
                      }}
                    />
                    
                    {!scannerActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <button
                          onClick={iniciarEscaner}
                          disabled={!camaraSeleccionada || permisosCamara !== 'granted'}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          📷 Iniciar Cámara
                        </button>
                      </div>
                    )}

                    {permisosCamara === 'pending' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-gray-600">Detectando cámaras...</p>
                        </div>
                      </div>
                    )}

                    {permisosCamara === 'denied' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-50">
                        <div className="text-center p-4">
                          <div className="text-red-500 mb-2">
                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                          </div>
                          <p className="text-red-700 font-medium mb-2">Permisos de cámara denegados</p>
                          <p className="text-red-600 text-sm mb-3">Se necesitan permisos para usar la cámara</p>
                          <button
                            onClick={detectarCamaras}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                          >
                            🔄 Reintentar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-medium mb-4">Código Manual</h3>
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
              )}
            </div>

            {/* Lista de estudiantes - Siempre visible */}
            <div className="lg:col-span-1 flex flex-col min-h-0 lg:min-h-[400px]">
              <h3 className="text-lg font-medium mb-4">
                Registrados Hoy ({estudiantesEscaneados.length})
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-4 flex-1 overflow-y-auto min-h-0">
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

          {/* Footer */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
            <button
              onClick={() => setEstudiantesEscaneados([])}
              className="px-4 py-2 border border-gray-300 text-black font-medium rounded-md hover:bg-gray-50"
            >
              Limpiar Lista
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
