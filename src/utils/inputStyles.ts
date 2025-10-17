// Estilos estandarizados para inputs con texto negro

export const inputStyles = {
  // Input básico con texto negro
  base: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black",
  
  // Select con texto negro
  select: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black bg-white",
  
  // Textarea con texto negro
  textarea: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black resize-vertical",
  
  // Input pequeño
  small: "px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black",
  
  // Input con error
  error: "w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-black bg-red-50",
  
  // Input deshabilitado
  disabled: "w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-black cursor-not-allowed"
}

export const labelStyles = {
  base: "block text-sm font-medium text-gray-700 mb-1",
  required: "block text-sm font-medium text-gray-700 mb-1 after:content-['*'] after:text-red-500 after:ml-1"
}

// Función helper para combinar estilos
export const combineInputStyles = (baseStyle: string, additionalClasses?: string): string => {
  return additionalClasses ? `${baseStyle} ${additionalClasses}` : baseStyle
}
