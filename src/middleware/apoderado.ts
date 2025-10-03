import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export function verifyApoderadoAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    if (decoded.rol !== 'APODERADO') {
      return NextResponse.json(
        { error: 'Acceso no autorizado. Se requiere rol de apoderado.' },
        { status: 403 }
      )
    }

    return {
      success: true,
      userId: decoded.userId,
      userEmail: decoded.email,
      userRole: decoded.rol
    }
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Error de autenticación' },
      { status: 500 }
    )
  }
}

export function withApoderadoAuth(handler: (request: NextRequest, auth: any) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const authResult = verifyApoderadoAuth(request)
    
    if (authResult instanceof NextResponse) {
      return authResult // Error response
    }
    
    return handler(request, authResult)
  }
}
