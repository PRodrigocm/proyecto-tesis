import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Singleton global de Prisma con configuración optimizada
export const prisma =
  globalForPrisma.prisma ?? 
  new PrismaClient({
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
