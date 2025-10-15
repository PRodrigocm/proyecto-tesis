import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  console.log('🚀 API dashboard/stats iniciada')
  
  try {
    // Verificar autenticación
    console.log('🔐 Verificando token...')
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Header de autorización faltante')
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // Remover "Bearer "
    const decoded = verifyToken(token)
    
    if (!decoded) {
      console.log('❌ Token inválido')
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    const ieId = decoded.idIe || 1 // Fallback a IE 1 si no está definido
    console.log('✅ Token válido, ieId:', ieId)

    // Verificar conexión a Prisma
    console.log('🔌 Verificando conexión a base de datos...')
    await prisma.$connect()
    console.log('✅ Conexión a BD exitosa')

    // Obtener estadísticas reales de la base de datos
    console.log('📊 Iniciando consultas a la base de datos...')
    
    let totalUsuarios = 0
    let totalEstudiantes = 0
    let totalDocentes = 0
    let totalApoderados = 0
    let totalTalleres = 0
    let asistenciasHoy = 0

    // 1. Total de usuarios de la IE
    try {
      console.log('🔍 Consultando usuarios de IE:', ieId)
      totalUsuarios = await prisma.usuario.count({
        where: { 
          idIe: ieId,
          estado: 'ACTIVO'
        }
      })
      console.log('✅ Total usuarios activos de IE:', totalUsuarios)
    } catch (error) {
      console.error('❌ Error contando usuarios:', error)
    }

    // 2. Total de estudiantes de la IE
    try {
      console.log('🔍 Consultando estudiantes...')
      totalEstudiantes = await prisma.estudiante.count({
        where: {
          usuario: {
            idIe: ieId,
            estado: 'ACTIVO'
          }
        }
      })
      console.log('✅ Total estudiantes activos:', totalEstudiantes)
    } catch (error) {
      console.error('❌ Error contando estudiantes:', error)
    }

    // 3. Total de docentes de la IE
    try {
      console.log('🔍 Consultando docentes...')
      totalDocentes = await prisma.docente.count({
        where: {
          usuario: {
            idIe: ieId,
            estado: 'ACTIVO'
          }
        }
      })
      console.log('✅ Total docentes activos:', totalDocentes)
    } catch (error) {
      console.error('❌ Error contando docentes:', error)
    }

    // 4. Total de apoderados de la IE
    try {
      console.log('🔍 Consultando apoderados...')
      totalApoderados = await prisma.apoderado.count({
        where: {
          usuario: {
            idIe: ieId,
            estado: 'ACTIVO'
          }
        }
      })
      console.log('✅ Total apoderados activos:', totalApoderados)
    } catch (error) {
      console.error('❌ Error contando apoderados:', error)
    }

    // 5. Total de talleres de la IE
    try {
      console.log('🔍 Consultando talleres...')
      totalTalleres = await prisma.taller.count({
        where: {
          idIe: ieId,
          activo: true
        }
      })
      console.log('✅ Total talleres activos:', totalTalleres)
    } catch (error) {
      console.error('❌ Error contando talleres:', error)
    }

    // 6. Asistencias de hoy
    try {
      console.log('🔍 Consultando asistencias de hoy...')
      const hoy = new Date()
      const inicioDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
      const finDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59)
      
      asistenciasHoy = await prisma.asistencia.count({
        where: {
          idIe: ieId,
          fecha: {
            gte: inicioDelDia,
            lte: finDelDia
          }
        }
      })
      console.log('✅ Total asistencias de hoy:', asistenciasHoy)
    } catch (error) {
      console.error('❌ Error contando asistencias de hoy:', error)
    }

    // Estadísticas adicionales para el dashboard
    let retirosHoy = 0
    let justificacionesPendientes = 0
    let asistenciaPromedio = 0
    
    // 7. Retiros de hoy
    try {
      console.log('🔍 Consultando retiros de hoy...')
      const hoy = new Date()
      const inicioDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
      const finDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59)
      
      retirosHoy = await prisma.retiro.count({
        where: {
          idIe: ieId,
          fecha: {
            gte: inicioDelDia,
            lte: finDelDia
          }
        }
      })
      console.log('✅ Total retiros de hoy:', retirosHoy)
    } catch (error) {
      console.error('❌ Error contando retiros de hoy:', error)
    }

    // 8. Justificaciones pendientes
    try {
      console.log('🔍 Consultando justificaciones pendientes...')
      justificacionesPendientes = await prisma.justificacion.count({
        where: {
          estudiante: {
            usuario: {
              idIe: ieId
            }
          }
          // TODO: Agregar filtro por estado cuando esté disponible
        }
      })
      console.log('✅ Total justificaciones:', justificacionesPendientes)
    } catch (error) {
      console.error('❌ Error contando justificaciones:', error)
    }

    // 9. Calcular asistencia promedio (últimos 7 días)
    try {
      console.log('🔍 Calculando asistencia promedio...')
      const hace7Dias = new Date()
      hace7Dias.setDate(hace7Dias.getDate() - 7)
      
      const asistenciasRecientes = await prisma.asistencia.findMany({
        where: {
          idIe: ieId,
          fecha: {
            gte: hace7Dias
          }
        },
        include: {
          estadoAsistencia: true
        }
      })
      
      const totalAsistencias = asistenciasRecientes.length
      const asistenciasPresentes = asistenciasRecientes.filter(a => 
        a.estadoAsistencia?.codigo === 'PRESENTE'
      ).length
      
      asistenciaPromedio = totalAsistencias > 0 
        ? Math.round((asistenciasPresentes / totalAsistencias) * 100 * 10) / 10
        : 0
      
      console.log('✅ Asistencia promedio (7 días):', asistenciaPromedio + '%')
    } catch (error) {
      console.error('❌ Error calculando asistencia promedio:', error)
    }

    const result = {
      totalUsuarios,
      totalEstudiantes,
      totalDocentes,
      totalApoderados,
      totalTalleres,
      asistenciasHoy,
      retirosHoy,
      justificacionesPendientes,
      asistenciaPromedio
    }

    console.log('📊 Estadísticas finales:', result)

    return NextResponse.json({
      data: result
    })

  } catch (error) {
    console.error('💥 Error general obteniendo estadísticas del dashboard:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}
