import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { formatTo12Hour } from '@/utils/timeFormat'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// GET /api/docentes/horarios - Obtener horarios del docente con tolerancias
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, JWT_SECRET)
      console.log('🔑 Token decodificado:', decoded)
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Verificar que sea docente o administrador
    if (!['DOCENTE', 'ADMINISTRATIVO'].includes(decoded.rol)) {
      return NextResponse.json({ error: 'No tienes permisos para acceder a esta información' }, { status: 403 })
    }

    // Obtener userId de diferentes posibles campos
    const userId = decoded.idUsuario || decoded.userId || decoded.id
    console.log('🔍 Buscando horarios para docente con userId:', userId)

    // Si es administrador, mostrar todos los horarios
    if (decoded.rol === 'ADMINISTRATIVO') {
      const horariosClase = await prisma.horarioClase.findMany({
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
          { diaSemana: 'asc' },
          { horaInicio: 'asc' }
        ]
      })

      const horariosTransformados = horariosClase.map(horario => ({
        id: horario.idHorarioClase.toString(),
        grado: horario.gradoSeccion?.grado?.nombre || '',
        seccion: horario.gradoSeccion?.seccion?.nombre || '',
        diaSemana: getDiaNombre(horario.diaSemana),
        horaInicio: formatTime(horario.horaInicio),
        horaFin: formatTime(horario.horaFin),
        materia: horario.materia || 'Clase Regular',
        toleranciaMin: horario.toleranciaMin,
        aula: horario.aula || `Aula ${horario.gradoSeccion?.grado?.nombre}° ${horario.gradoSeccion?.seccion?.nombre}`,
        tipoActividad: horario.tipoActividad,
        activo: horario.activo,
        docente: horario.docente ? {
          id: horario.docente.idDocente.toString(),
          nombre: horario.docente.usuario.nombre,
          apellido: horario.docente.usuario.apellido,
          especialidad: horario.docente.especialidad || ''
        } : null
      }))

      return NextResponse.json({
        success: true,
        horarios: horariosTransformados,
        total: horariosTransformados.length
      })
    }

    // Para docentes, buscar sus horarios específicos
    if (!userId) {
      console.error('❌ No se pudo obtener userId del token')
      return NextResponse.json({ error: 'Token inválido: falta userId' }, { status: 401 })
    }

    const docente = await prisma.docente.findFirst({
      where: {
        idUsuario: userId
      }
    })

    if (!docente) {
      console.error('❌ No se encontró docente con idUsuario:', userId)
      return NextResponse.json({ error: 'Docente no encontrado' }, { status: 404 })
    }

    console.log('✅ Docente encontrado:', docente.idDocente)

    // Obtener los grados-secciones asignados al docente
    const docenteAulas = await prisma.docenteAula.findMany({
      where: { idDocente: docente.idDocente },
      select: { idGradoSeccion: true }
    })
    
    const gradoSeccionIds = docenteAulas.map(da => da.idGradoSeccion)
    console.log('📋 Grados-Secciones asignados:', gradoSeccionIds)

    // Buscar horarios donde:
    // 1. El docente está asignado directamente (idDocente)
    // 2. O el horario es de un grado-sección asignado al docente
    const horariosClase = await prisma.horarioClase.findMany({
      where: {
        OR: [
          { idDocente: docente.idDocente },
          { idGradoSeccion: { in: gradoSeccionIds } }
        ]
      },
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
        { diaSemana: 'asc' },
        { horaInicio: 'asc' }
      ]
    })

    console.log(`📚 Docente tiene ${horariosClase.length} horarios de clase`)

    const horariosTransformados = horariosClase.map(horario => ({
      id: horario.idHorarioClase.toString(),
      grado: horario.gradoSeccion?.grado?.nombre || '',
      seccion: horario.gradoSeccion?.seccion?.nombre || '',
      diaSemana: getDiaNombre(horario.diaSemana),
      horaInicio: formatTime(horario.horaInicio),
      horaFin: formatTime(horario.horaFin),
      materia: horario.materia || 'Clase Regular',
      toleranciaMin: horario.toleranciaMin,
      aula: horario.aula || `Aula ${horario.gradoSeccion?.grado?.nombre}° ${horario.gradoSeccion?.seccion?.nombre}`,
      tipoActividad: horario.tipoActividad,
      activo: horario.activo,
      docente: {
        id: horario.docente?.idDocente.toString() || '',
        nombre: horario.docente?.usuario.nombre || '',
        apellido: horario.docente?.usuario.apellido || '',
        especialidad: horario.docente?.especialidad || ''
      }
    }))

    // Si no hay horarios, devolver array vacío
    if (horariosTransformados.length === 0) {
      console.log('⚠️ No se encontraron horarios para este docente')
      return NextResponse.json({
        success: true,
        horarios: [],
        total: 0,
        message: 'No hay horarios asignados a este docente'
      })
    }

    return NextResponse.json({
      success: true,
      horarios: horariosTransformados,
      total: horariosTransformados.length
    })

  } catch (error) {
    console.error('❌ Error obteniendo horarios del docente:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

// Función auxiliar para convertir número de día a nombre
function getDiaNombre(diaSemana: number): string {
  const dias = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO']
  return dias[diaSemana] || 'DESCONOCIDO'
}

// Función auxiliar para formatear tiempo en formato 12 horas sin problemas de zona horaria
function formatTime(date: Date): string {
  // Usar UTC para evitar problemas de zona horaria
  const hours = date.getUTCHours().toString().padStart(2, '0')
  const minutes = date.getUTCMinutes().toString().padStart(2, '0')
  const timeString = `${hours}:${minutes}`
  return formatTo12Hour(timeString)
}

