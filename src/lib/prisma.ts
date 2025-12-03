import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Crear adaptador de PostgreSQL para Prisma 7
const adapter = new PrismaPg({ 
  connectionString: process.env.DATABASE_URL! 
})

// Singleton global de Prisma con configuración optimizada
export const prisma =
  globalForPrisma.prisma ?? 
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

// Guardar en global para desarrollo (evita múltiples instancias en hot reload)
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Función helper para operaciones con reconexión automática (legacy)
export async function withPrismaConnection<T>(operation: () => Promise<T>): Promise<T> {
  return await operation()
}
