import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Obtener el último frame desde la API de frames
    const baseUrl = request.nextUrl.origin
    const frameResponse = await fetch(`${baseUrl}/api/camara-ip/frame`, {
      method: 'GET',
      cache: 'no-store'
    })
    
    if (!frameResponse.ok) {
      // Si no hay frame, devolver imagen de placeholder
      return createPlaceholderImage()
    }
    
    // Devolver el frame con headers apropiados para streaming
    const frameBuffer = await frameResponse.arrayBuffer()
    
    return new NextResponse(frameBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        // Headers adicionales para streaming
        'Connection': 'keep-alive',
        'X-Frame-Timestamp': Date.now().toString(),
      },
    })
    
  } catch (error) {
    console.error('Error en stream:', error)
    return createPlaceholderImage()
  }
}

// Crear imagen de placeholder cuando no hay stream
function createPlaceholderImage() {
  // SVG simple como placeholder
  const svgContent = `
    <svg width="640" height="480" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#1f2937"/>
      <text x="50%" y="40%" text-anchor="middle" fill="#9ca3af" font-family="Arial, sans-serif" font-size="24">
        📱 Cámara IP Desconectada
      </text>
      <text x="50%" y="60%" text-anchor="middle" fill="#6b7280" font-family="Arial, sans-serif" font-size="16">
        Inicia la cámara desde tu teléfono
      </text>
    </svg>
  `
  
  return new NextResponse(svgContent, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

// Manejar preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
