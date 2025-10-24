import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 Obteniendo clases para asistencia...')
    
    // Verificar autenticación
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const userInfo = verifyToken(token)
    if (!userInfo) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { id } = await params
    const usuarioId = parseInt(id)

    console.log('👤 ID del usuario recibido:', usuarioId)

    // Buscar el docente por ID de usuario
    const docente = await prisma.docente.findFirst({
      where: { 
        idUsuario: usuarioId
      },
      include: {
        usuario: true
      }
    })

    if (!docente) {
      console.log('❌ No se encontró docente para usuario ID:', usuarioId)
      return NextResponse.json({ error: 'Docente no encontrado para este usuario' }, { status: 404 })
    }

    const docenteId = docente.idDocente
    console.log('👨‍🏫 ID del docente encontrado:', docenteId)

    // Obtener las aulas asignadas al docente
    const docenteAulas = await prisma.docenteAula.findMany({
      where: { idDocente: docenteId },
      include: {
        gradoSeccion: {
          include: {
            grado: true,
            seccion: true
          }
        },
        tipoAsignacion: true
      }
    })

    console.log('📚 Aulas encontradas para asistencia:', docenteAulas.length)

    // Transformar los datos para la respuesta con horarios
    const clases = await Promise.all(docenteAulas.map(async (docenteAula) => {
      const { gradoSeccion, tipoAsignacion } = docenteAula
      
      // Obtener el horario del grado-sección
      let horario = '08:00-13:30' // Horario por defecto
      
      try {
        const horarioClase = await prisma.horarioClase.findFirst({
          where: {
            idGradoSeccion: gradoSeccion.idGradoSeccion,
            activo: true
          },
          orderBy: {
            diaSemana: 'asc'
          }
        })
        
        if (horarioClase) {
          const horaInicio = horarioClase.horaInicio.toTimeString().slice(0, 5)
          const horaFin = horarioClase.horaFin.toTimeString().slice(0, 5)
          horario = `${horaInicio}-${horaFin}`
        }
      } catch (error) {
        console.error('Error obteniendo horario:', error)
      }
      
      return {
        id: docenteAula.idDocenteAula,
        nombre: `${tipoAsignacion.nombre} - ${gradoSeccion.grado.nombre}° ${gradoSeccion.seccion.nombre}`,
        grado: gradoSeccion.grado.nombre,
        seccion: gradoSeccion.seccion.nombre,
        tipoAsignacion: tipoAsignacion.nombre,
        horario: horario
      }
    }))

    console.log('✅ Clases para asistencia obtenidas exitosamente')
    return NextResponse.json({
      success: true,
      data: clases
    })

  } catch (error) {
    console.error('❌ Error al obtener clases para asistencia:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
