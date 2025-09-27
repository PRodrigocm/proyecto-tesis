import jwt from 'jsonwebtoken'

export interface JWTPayload {
  userId: number
  email: string
  rol: string
  idIe?: number
}

/**
 * Verifica y decodifica un token JWT
 * @param token - Token JWT a verificar
 * @returns Payload decodificado o null si es inválido
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET no está configurado')
      return null
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    console.error('Error verificando token:', error)
    return null
  }
}

/**
 * Genera un token JWT
 * @param payload - Datos a incluir en el token
 * @param expiresIn - Tiempo de expiración (default: '24h')
 * @returns Token JWT generado
 */
export function generateToken(payload: JWTPayload, expiresIn: string = '24h'): string {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET no está configurado')
  }

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn } as jwt.SignOptions)
}

/**
 * Extrae el token del header Authorization
 * @param authHeader - Header de autorización
 * @returns Token extraído o null
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null
  
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null
  
  return parts[1]
}

/**
 * Middleware helper para verificar token en Next.js API routes
 * @param request - NextRequest object
 * @returns Usuario decodificado o null
 */
export function verifyTokenFromRequest(request: Request): JWTPayload | null {
  const authHeader = request.headers.get('authorization')
  const token = extractTokenFromHeader(authHeader)
  
  if (!token) return null
  
  return verifyToken(token)
}
