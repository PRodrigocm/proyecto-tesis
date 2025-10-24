import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    console.log('📚 Obteniendo estudiantes para control de asistencia...')

    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    } catch (jwtError) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const userId = decoded.userId
    const userInfo = await prisma.usuario.findUnique({
      where: { idUsuario: userId },
      include: { ie: true }
    })

    if (!userInfo || !['AUXILIAR', 'ADMINISTRATIVO'].includes(decoded.rol)) {
      return NextResponse.json({ error: 'Sin permisos de auxiliar' }, { status: 403 })
    }

    const ieId = userInfo.idIe
    if (!ieId) {
      return NextResponse.json({ error: 'Usuario sin IE asignada' }, { status: 400 })
    }

    // Obtener fecha actual
    const hoy = new Date()
    const fechaHoy = hoy.toISOString().split('T')[0]
    const fechaBusqueda = new Date(fechaHoy)

    console.log('📅 Obteniendo estudiantes para fecha:', fechaHoy)

    // Obtener todos los estudiantes activos de la IE
    const estudiantes = await prisma.estudiante.findMany({
      where: {
        usuario: {
          idIe: ieId,
          estado: 'ACTIVO'
        }
      },
      select: {
        idEstudiante: true,
        idGradoSeccion: true,
        codigo: true,
        qr: true,
        usuario: true,
        gradoSeccion: {
          include: {
            grado: {
              include: {
                nivel: true
              }
            },
            seccion: true
          }
        }
      },
      orderBy: [
        { gradoSeccion: { grado: { nombre: 'asc' } } },
        { gradoSeccion: { seccion: { nombre: 'asc' } } },
        { usuario: { apellido: 'asc' } },
        { usuario: { nombre: 'asc' } }
      ]
    })

    // Ahora buscar asistencias y retiros por separado para cada estudiante
    const estudiantesConEstado = await Promise.all(
      estudiantes.map(async (estudiante) => {
        // Buscar asistencia del día
        const asistencia = await prisma.asistencia.findFirst({
          where: {
            idEstudiante: estudiante.idEstudiante,
            fecha: fechaBusqueda
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        // Buscar retiro del día
        const retiro = await prisma.retiro.findFirst({
          where: {
            idEstudiante: estudiante.idEstudiante,
            fecha: fechaBusqueda
          }
        })

        // Buscar horario de clases del día actual
        let horarioClase = null
        if (estudiante.idGradoSeccion) {
          const diaSemana = fechaBusqueda.getDay() === 0 ? 7 : fechaBusqueda.getDay() // Domingo = 7
          horarioClase = await prisma.horarioClase.findFirst({
            where: {
              idGradoSeccion: estudiante.idGradoSeccion,
              diaSemana: diaSemana,
              activo: true
            },
            orderBy: {
              horaInicio: 'asc'
            }
          })
        }

        let estado: 'PRESENTE' | 'AUSENTE' | 'RETIRADO' = 'AUSENTE'
        let horaEntrada: string | undefined
        let horaSalida: string | undefined

        // Determinar estado
        if (retiro) {
          estado = 'RETIRADO'
          // Usar el campo correcto para la hora de retiro
          horaSalida = retiro.hora ? new Date(retiro.hora).toTimeString().slice(0, 5) : undefined
          // Si hay asistencia, también mostrar hora de entrada
          if (asistencia && asistencia.horaEntrada) {
            horaEntrada = asistencia.horaEntrada.toTimeString().slice(0, 5)
          }
        } else if (asistencia) {
          estado = 'PRESENTE'
          if (asistencia.horaEntrada) {
            horaEntrada = asistencia.horaEntrada.toTimeString().slice(0, 5)
          }
          if (asistencia.horaSalida) {
            horaSalida = asistencia.horaSalida.toTimeString().slice(0, 5)
          }
        }

        return {
          id: estudiante.idEstudiante.toString(),
          nombre: estudiante.usuario.nombre || '',
          apellido: estudiante.usuario.apellido || '',
          dni: estudiante.usuario.dni,
          grado: estudiante.gradoSeccion?.grado?.nombre || '',
          seccion: estudiante.gradoSeccion?.seccion?.nombre || '',
          nivel: estudiante.gradoSeccion?.grado?.nivel?.nombre || '',
          codigo: estudiante.codigo || estudiante.qr || estudiante.usuario.dni, // Usar código real
          codigoQR: estudiante.qr || estudiante.codigo || estudiante.usuario.dni, // Para compatibilidad
          estado,
          horaEntrada,
          horaSalida,
          horarioClase: horarioClase ? {
            horaInicio: horarioClase.horaInicio.toTimeString().slice(0, 5),
            horaFin: horarioClase.horaFin.toTimeString().slice(0, 5),
            materia: horarioClase.materia || 'Clases generales'
          } : null
        }
      })
    )

    console.log(`✅ ${estudiantesConEstado.length} estudiantes obtenidos`)
    console.log('🕐 Ejemplo de estudiante con horarios:', estudiantesConEstado.find(e => e.horaEntrada || e.horaSalida))

    return NextResponse.json({
      success: true,
      estudiantes: estudiantesConEstado,
      fecha: fechaHoy,
      total: estudiantesConEstado.length
    })

  } catch (error) {
    console.error('❌ Error al obtener estudiantes:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
