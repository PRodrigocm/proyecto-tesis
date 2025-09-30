import { NextRequest, NextResponse } from 'next/server'

// Simular estado de la cámara (en producción esto podría estar en Redis o base de datos)
let cameraStatus = {
  isActive: false,
  lastFrameTime: 0,
  frameCount: 0,
  resolution: '640x480',
  fps: 10
}

export async function GET() {
  try {
    // Verificar si hay frames recientes (últimos 5 segundos)
    const now = Date.now()
    const isActive = (now - cameraStatus.lastFrameTime) < 5000
    
    return NextResponse.json({
      success: true,
      status: {
        ...cameraStatus,
        isActive,
        lastFrameAge: now - cameraStatus.lastFrameTime,
        serverTime: now
      }
    })
    
  } catch (error) {
    console.error('Error obteniendo estado:', error)
    return NextResponse.json(
      { error: 'Error obteniendo estado de la cámara' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Actualizar estado de la cámara
    if (body.action === 'start') {
      cameraStatus.isActive = true
      cameraStatus.lastFrameTime = Date.now()
      console.log('📹 Cámara IP iniciada')
    } else if (body.action === 'stop') {
      cameraStatus.isActive = false
      console.log('⏹️ Cámara IP detenida')
    } else if (body.action === 'frame') {
      cameraStatus.lastFrameTime = Date.now()
      cameraStatus.frameCount++
    }
    
    // Actualizar configuración si se proporciona
    if (body.resolution) cameraStatus.resolution = body.resolution
    if (body.fps) cameraStatus.fps = body.fps
    
    return NextResponse.json({
      success: true,
      status: cameraStatus
    })
    
  } catch (error) {
    console.error('Error actualizando estado:', error)
    return NextResponse.json(
      { error: 'Error actualizando estado' },
      { status: 500 }
    )
  }
}
