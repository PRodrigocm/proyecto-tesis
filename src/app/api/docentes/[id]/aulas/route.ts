import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 Obteniendo aulas del docente...')
    
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

    // Primero buscar el docente por ID de usuario
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

    // Obtener las aulas asignadas al docente a través de DocenteAula
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

    console.log('📚 Registros DocenteAula encontrados:', docenteAulas.length)
    console.log('📋 Detalles de DocenteAula:', docenteAulas)

    // Transformar los datos para la respuesta
    const aulas = await Promise.all(docenteAulas.map(async (docenteAula, index) => {
      const { gradoSeccion, tipoAsignacion } = docenteAula
      const aulaName = `Aula ${gradoSeccion.grado.nombre}° ${gradoSeccion.seccion.nombre}`
      
      // Contar estudiantes activos del grado-sección
      const cantidadEstudiantes = await prisma.estudiante.count({
        where: {
          idGradoSeccion: docenteAula.idGradoSeccion,
          usuario: {
            estado: 'ACTIVO'
          }
        }
      })

      // Obtener horarios reales del grado-sección
      const horarios = await prisma.horarioClase.findMany({
        where: {
          idGradoSeccion: docenteAula.idGradoSeccion,
          activo: true
        },
        orderBy: {
          diaSemana: 'asc'
        }
      })

      // Formatear horarios
      let horarioTexto = 'Horario por definir'
      if (horarios.length > 0) {
        const diasNombres = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
        const horariosFormateados = horarios.slice(0, 3).map(h => {
          const dia = diasNombres[h.diaSemana]
          const inicio = h.horaInicio.toTimeString().slice(0, 5)
          const fin = h.horaFin.toTimeString().slice(0, 5)
          return `${dia} ${inicio}-${fin}`
        })
        horarioTexto = horariosFormateados.join(' | ')
        if (horarios.length > 3) {
          horarioTexto += ` (+${horarios.length - 3} más)`
        }
      }
      
      console.log(`🏫 Procesando aula ${index + 1}:`, {
        docenteAulaId: docenteAula.idDocenteAula,
        grado: gradoSeccion.grado.nombre,
        seccion: gradoSeccion.seccion.nombre,
        tipoAsignacion: tipoAsignacion.nombre,
        estudiantesActivos: cantidadEstudiantes,
        horariosEncontrados: horarios.length
      })
      
      return {
        id: docenteAula.idDocenteAula,
        idGradoSeccion: docenteAula.idGradoSeccion,
        materia: tipoAsignacion.nombre, // Tutor, Profesor de materia, etc.
        grado: `${gradoSeccion.grado.nombre}`,
        seccion: gradoSeccion.seccion.nombre,
        estudiantes: cantidadEstudiantes, // Número real de estudiantes activos
        horario: horarioTexto,
        aula: aulaName,
        estado: 'activa'
      }
    }))

    // Si no hay aulas asignadas, devolver mensaje claro
    if (aulas.length === 0) {
      console.log('⚠️ No hay registros en DocenteAula para docente ID:', docenteId)
      console.log('💡 Verificar que existan registros en la tabla DocenteAula')
      return NextResponse.json({
        success: true,
        data: [],
        message: `No hay aulas asignadas al docente ${docente.usuario.nombre} ${docente.usuario.apellido}`,
        debug: {
          usuarioId: usuarioId,
          docenteId: docenteId,
          nombreDocente: `${docente.usuario.nombre} ${docente.usuario.apellido}`
        }
      })
    }

    console.log('✅ Aulas del docente obtenidas exitosamente')
    return NextResponse.json({
      success: true,
      data: aulas
    })

  } catch (error) {
    console.error('❌ Error al obtener aulas del docente:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
