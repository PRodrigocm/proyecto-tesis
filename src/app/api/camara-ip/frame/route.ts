import { NextRequest, NextResponse } from 'next/server'

// Almacenar el último frame en memoria
let lastFrame: Buffer | null = null
let lastFrameTime: number = 0

export async function POST(request: NextRequest) {
  try {
    // Verificar si es FormData o ArrayBuffer
    const contentType = request.headers.get('content-type')
    let buffer: Buffer
    
    if (contentType?.includes('multipart/form-data')) {
      // Es FormData
      const formData = await request.formData()
      const frameFile = formData.get('frame') as File
      
      if (!frameFile) {
        throw new Error('No se encontró el archivo frame')
      }
      
      const arrayBuffer = await frameFile.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    } else {
      // Es ArrayBuffer directo
      const arrayBuffer = await request.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    }
    
    // Almacenar el frame y timestamp
    lastFrame = buffer
    lastFrameTime = Date.now()
    
    console.log(`📸 Frame recibido: ${buffer.length} bytes`)
    
    return NextResponse.json({ 
      success: true, 
      size: buffer.length,
      timestamp: lastFrameTime
    })
    
  } catch (error) {
    console.error('Error procesando frame:', error)
    return NextResponse.json(
      { error: 'Error procesando frame' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    if (!lastFrame) {
      return NextResponse.json(
        { error: 'No hay frames disponibles' },
        { status: 404 }
      )
    }
    
    // Verificar que el frame no sea muy antiguo (más de 5 segundos)
    const frameAge = Date.now() - lastFrameTime
    if (frameAge > 5000) {
      return NextResponse.json(
        { error: 'Frame demasiado antiguo' },
        { status: 410 }
      )
    }
    
    // Devolver el último frame como imagen
    return new NextResponse(lastFrame, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
    
  } catch (error) {
    console.error('Error sirviendo frame:', error)
    return NextResponse.json(
      { error: 'Error sirviendo frame' },
      { status: 500 }
    )
  }
}

// Manejar preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
