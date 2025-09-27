import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    console.log('=== TEST APODERADO PUT ===')
    const body = await request.json()
    console.log('Test PUT body:', body)
    
    return NextResponse.json({
      message: 'Test PUT funcionando correctamente',
      timestamp: new Date().toISOString(),
      receivedData: body
    })
  } catch (error) {
    console.error('Error en test PUT:', error)
    return NextResponse.json(
      { error: 'Error en test PUT' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test GET funcionando correctamente',
    timestamp: new Date().toISOString()
  })
}
