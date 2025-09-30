import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Permitir requests desde devtunnels y localhost
  const allowedOrigins = [
    'http://localhost:3000',
    'https://localhost:3000',
    'http://26.133.236.4:3000',
    'https://26.133.236.4:3000',
    'https://drc9vhgq-3000.brs.devtunnels.ms',
    'http://drc9vhgq-3000.brs.devtunnels.ms'
  ]

  const origin = request.headers.get('origin')
  const host = request.headers.get('host')

  // Si es una request de API, agregar headers CORS
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next()
    
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-forwarded-host')
    
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
