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
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Verificar que sea docente o administrador
    if (!['DOCENTE', 'ADMINISTRATIVO'].includes(decoded.rol)) {
      return NextResponse.json({ error: 'No tienes permisos para acceder a esta información' }, { status: 403 })
    }

    console.log('🔍 Buscando horarios para docente:', decoded.idUsuario)

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
        aula: horario.aula || `${horario.gradoSeccion?.grado?.nombre}° ${horario.gradoSeccion?.seccion?.nombre}`,
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
    const docente = await prisma.docente.findFirst({
      where: {
        idUsuario: decoded.idUsuario
      }
    })

    if (!docente) {
      return NextResponse.json({ error: 'Docente no encontrado' }, { status: 404 })
    }

    const horariosClase = await prisma.horarioClase.findMany({
      where: {
        idDocente: docente.idDocente
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
      aula: horario.aula || `${horario.gradoSeccion?.grado?.nombre}° ${horario.gradoSeccion?.seccion?.nombre}`,
      tipoActividad: horario.tipoActividad,
      activo: horario.activo,
      docente: {
        id: horario.docente?.idDocente.toString() || '',
        nombre: horario.docente?.usuario.nombre || '',
        apellido: horario.docente?.usuario.apellido || '',
        especialidad: horario.docente?.especialidad || ''
      }
    }))

    // Si no hay horarios, devolver datos de ejemplo
    if (horariosTransformados.length === 0) {
      console.log('⚠️ No se encontraron horarios, devolviendo datos de ejemplo')
      return NextResponse.json({
        success: true,
        horarios: [
          {
            id: '1',
            grado: '3',
            seccion: 'A',
            diaSemana: 'LUNES',
            horaInicio: '08:00',
            horaFin: '09:30',
            materia: 'Matemáticas',
            toleranciaMin: 10,
            aula: 'Aula 201',
            tipoActividad: 'CLASE_REGULAR',
            activo: true,
            docente: {
              id: '1',
              nombre: 'Ana',
              apellido: 'Rodríguez',
              especialidad: 'Matemáticas'
            }
          },
          {
            id: '2',
            grado: '3',
            seccion: 'A',
            diaSemana: 'MARTES',
            horaInicio: '10:00',
            horaFin: '11:30',
            materia: 'Comunicación',
            toleranciaMin: 15,
            aula: 'Aula 201',
            tipoActividad: 'CLASE_REGULAR',
            activo: true,
            docente: {
              id: '1',
              nombre: 'Ana',
              apellido: 'Rodríguez',
              especialidad: 'Comunicación'
            }
          },
          {
            id: '3',
            grado: '4',
            seccion: 'B',
            diaSemana: 'MIERCOLES',
            horaInicio: '14:00',
            horaFin: '15:30',
            materia: 'Ciencia y Tecnología',
            toleranciaMin: 10,
            aula: 'Lab. Ciencias',
            tipoActividad: 'CLASE_REGULAR',
            activo: true,
            docente: {
              id: '1',
              nombre: 'Ana',
              apellido: 'Rodríguez',
              especialidad: 'Ciencias'
            }
          }
        ],
        total: 3
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

