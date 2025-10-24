import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  isConnected: boolean
}

// Singleton global de Prisma optimizado
export const prisma =
  globalForPrisma.prisma ?? 
  new PrismaClient({
    log: ['error'], // Solo errores para reducir ruido
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })

// Estado de conexión global
let isConnected = globalForPrisma.isConnected ?? false

// Función optimizada para ejecutar operaciones
export async function withPrismaConnection<T>(operation: () => Promise<T>): Promise<T> {
  // Solo conectar si no está conectado
  if (!isConnected) {
    try {
      await prisma.$connect()
      isConnected = true
      globalForPrisma.isConnected = true
    } catch (error) {
      console.error('❌ Error de conexión Prisma:', error)
      throw error
    }
  }

  // Ejecutar operación directamente (sin reconexiones múltiples)
  try {
    return await operation()
  } catch (error) {
    // Solo reconectar en casos específicos
    if (error instanceof Error && 
        (error.message.includes('Engine is not yet connected') ||
         error.message.includes('Response from the Engine was empty'))) {
      
      console.log('🔄 Reconectando Prisma una vez...')
      isConnected = false
      globalForPrisma.isConnected = false
      
      await prisma.$disconnect()
      await new Promise(resolve => setTimeout(resolve, 1000))
      await prisma.$connect()
      
      isConnected = true
      globalForPrisma.isConnected = true
      
      // Un solo reintento
      return await operation()
    }
    
    throw error
  }
}

// Función para desconectar limpiamente
export async function disconnectPrisma() {
  if (isConnected) {
    await prisma.$disconnect()
    isConnected = false
    globalForPrisma.isConnected = false
  }
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
  globalForPrisma.isConnected = isConnected
}
