import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET - Consultar si hay clases en una fecha específica
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get('fecha') // YYYY-MM-DD
    const ieId = searchParams.get('ieId')
    const gradoSeccionId = searchParams.get('gradoSeccionId')

    if (!fecha || !ieId) {
      return NextResponse.json({ 
        error: 'Fecha e IE ID requeridos' 
      }, { status: 400 })
    }

    const fechaConsulta = new Date(fecha)
    const diaSemana = fechaConsulta.getDay() // 0=Domingo, 1=Lunes, ..., 6=Sábado

    // 1. Verificar si es día de semana (L-V = 1-5)
    if (diaSemana < 1 || diaSemana > 5) {
      return NextResponse.json({
        success: true,
        hayClases: false,
        motivo: 'Fin de semana',
        fecha: fecha,
        diaSemana: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][diaSemana]
      })
    }

    // 2. Verificar excepciones globales (toda la IE)
    const excepcionGlobal = await prisma.excepcionHorario.findFirst({
      where: {
        idIe: parseInt(ieId),
        fecha: fechaConsulta,
        tipoHorario: { in: ['CLASE', 'AMBOS'] },
        activo: true,
        // Excepción global = sin horario específico
        idHorarioClase: null
      }
    })

    if (excepcionGlobal) {
      return NextResponse.json({
        success: true,
        hayClases: false,
        motivo: excepcionGlobal.motivo || 'Excepción programada',
        tipoExcepcion: excepcionGlobal.tipoExcepcion,
        fecha: fecha,
        diaSemana: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][diaSemana],
        excepcion: {
          id: excepcionGlobal.idExcepcion,
          tipo: excepcionGlobal.tipoExcepcion,
          motivo: excepcionGlobal.motivo,
          descripcion: excepcionGlobal.descripcion
        }
      })
    }

    // 3. Si se especifica grado-sección, verificar excepciones específicas
    if (gradoSeccionId) {
      const excepcionEspecifica = await prisma.excepcionHorario.findFirst({
        where: {
          fecha: fechaConsulta,
          horarioClase: {
            idGradoSeccion: parseInt(gradoSeccionId)
          },
          activo: true
        },
        include: {
          horarioClase: {
            include: {
              gradoSeccion: {
                include: {
                  grado: true,
                  seccion: true
                }
              }
            }
          }
        }
      })

      if (excepcionEspecifica) {
        return NextResponse.json({
          success: true,
          hayClases: false,
          motivo: excepcionEspecifica.motivo || 'Excepción específica del grado',
          tipoExcepcion: excepcionEspecifica.tipoExcepcion,
          fecha: fecha,
          diaSemana: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][diaSemana],
          gradoSeccion: `${excepcionEspecifica.horarioClase?.gradoSeccion.grado.nombre}° ${excepcionEspecifica.horarioClase?.gradoSeccion.seccion.nombre}`,
          excepcion: {
            id: excepcionEspecifica.idExcepcion,
            tipo: excepcionEspecifica.tipoExcepcion,
            motivo: excepcionEspecifica.motivo,
            descripcion: excepcionEspecifica.descripcion
          }
        })
      }
    }

    // 4. Obtener horarios base activos para la fecha
    const whereCondition: any = {
      diaSemana: diaSemana,
      activo: true,
      gradoSeccion: {
        grado: {
          nivel: {
            idIe: parseInt(ieId)
          }
        }
      }
    }

    if (gradoSeccionId) {
      whereCondition.idGradoSeccion = parseInt(gradoSeccionId)
    }

    const horariosBase = await prisma.horarioClase.findMany({
      where: whereCondition,
      include: {
        gradoSeccion: {
          include: {
            grado: true,
            seccion: true
          }
        },
        docente: {
          include: {
            usuario: true
          }
        }
      },
      orderBy: [
        { gradoSeccion: { grado: { nombre: 'asc' } } },
        { gradoSeccion: { seccion: { nombre: 'asc' } } },
        { horaInicio: 'asc' }
      ]
    })

    // 5. Si hay horarios base, hay clases
    if (horariosBase.length > 0) {
      const horariosTransformados = horariosBase.map(horario => ({
        id: horario.idHorarioClase,
        gradoSeccion: `${horario.gradoSeccion.grado.nombre}° ${horario.gradoSeccion.seccion.nombre}`,
        horaInicio: horario.horaInicio.toISOString().slice(11, 16),
        horaFin: horario.horaFin.toISOString().slice(11, 16),
        aula: horario.aula,
        docente: horario.docente ? 
          `${horario.docente.usuario.nombre} ${horario.docente.usuario.apellido}` : 
          'Sin asignar',
        tipoActividad: horario.tipoActividad
      }))

      return NextResponse.json({
        success: true,
        hayClases: true,
        motivo: 'Día regular de clases',
        fecha: fecha,
        diaSemana: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][diaSemana],
        horarios: horariosTransformados,
        totalGradosSecciones: horariosBase.length
      })
    }

    // 6. No hay horarios configurados
    return NextResponse.json({
      success: true,
      hayClases: false,
      motivo: 'No hay horarios configurados para esta fecha',
      fecha: fecha,
      diaSemana: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][diaSemana]
    })

  } catch (error) {
    console.error('Error consultando horarios:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
