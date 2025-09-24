'use client'

import CreateSalonForm from './CreateSalonForm'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function CreateSalonModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null

  return (
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-auto">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-full overflow-y-auto">
          <div className="flex justify-between items-center px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-800">Crear Nuevo Salón</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-6">
            <CreateSalonForm />
          </div>
        </div>
      </div>
    </>
  )
}
