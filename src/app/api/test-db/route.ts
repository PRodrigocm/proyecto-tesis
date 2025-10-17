import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Probar conexión a la base de datos
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Probando conexión a la base de datos...')
    
    // Test 1: Verificar conexión básica
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Conexión básica exitosa:', result)
    
    // Test 2: Verificar tabla CalendarioEscolar
    const calendarioCount = await prisma.calendarioEscolar.count()
    console.log('📅 Registros en CalendarioEscolar:', calendarioCount)
    
    // Test 3: Verificar tabla ExcepcionHorario
    const excepcionesCount = await prisma.excepcionHorario.count()
    console.log('⚠️ Registros en ExcepcionHorario:', excepcionesCount)
    
    // Test 4: Verificar tabla IE
    const ieCount = await prisma.ie.count()
    console.log('🏫 Registros en IE:', ieCount)
    
    return NextResponse.json({
      success: true,
      message: 'Conexión a la base de datos exitosa',
      data: {
        basicConnection: true,
        calendarioEscolarRecords: calendarioCount,
        excepcionHorarioRecords: excepcionesCount,
        ieRecords: ieCount,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Error en la conexión a la base de datos:', error)
    return NextResponse.json(
      { 
        error: 'Error de conexión a la base de datos',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
