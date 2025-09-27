import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      nombre,
      descripcion,
      idGradoSeccion,
      fechaInicio,
      fechaFin,
      aplicarTodasAulas,
      horarios
    } = body

    if (!nombre || !idGradoSeccion || !fechaInicio || !fechaFin || !horarios || horarios.length === 0) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    console.log('Creando horarios anuales para:', {
      nombre,
      idGradoSeccion,
      aplicarTodasAulas,
      totalHorarios: horarios.length
    })

    // Crear todos los horarios en una transacción
    const horariosCreados = await prisma.$transaction(async (tx) => {
      const resultados = []

      // Obtener el grado-sección con su docente asignado
      const gradoSeccion = await (tx as any).gradoSeccion.findUnique({
        where: { idGradoSeccion: parseInt(idGradoSeccion) },
        include: { 
          grado: { 
            include: { 
              nivel: { 
                include: { ie: true } 
              } 
            } 
          },
          seccion: true, // Incluir información de la sección
          // Obtener docente a través de DocenteAula
          docenteAulas: {
            include: {
              docente: true
            }
          }
        }
      })

      if (!gradoSeccion) {
        throw new Error('Grado-sección no encontrado')
      }

      // Obtener el docente principal del grado-sección
      const docentePrincipal = gradoSeccion.docenteAulas?.[0]?.docente || null

      if (aplicarTodasAulas) {
        // Generar nombre del aula basado en el grado y sección
        const nombreAula = `Aula ${gradoSeccion.grado.nombre}° ${gradoSeccion.seccion.nombre}`

        // Crear horarios usando el nombre del aula del grado-sección
        for (const horario of horarios) {
          const nuevoHorario = await (tx as any).horarioClase.create({
            data: {
              idGradoSeccion: parseInt(idGradoSeccion),
              idDocente: docentePrincipal?.idDocente || null, // Docente del grado-sección
              materia: null, // En primaria no se usa materia específica
              diaSemana: parseInt(horario.diaSemana),
              horaInicio: new Date(`1970-01-01T${horario.horaInicio}:00`),
              horaFin: new Date(`1970-01-01T${horario.horaFin}:00`),
              aula: nombreAula, // Ej: "Aula 3° A"
              toleranciaMin: horario.toleranciaMin || 10,
              sesiones: horario.sesiones || 1,
              tipoActividad: horario.tipoActividad || 'CLASE_REGULAR',
              activo: horario.activo !== false
            }
          })
          resultados.push(nuevoHorario)
        }
      } else {
        // Crear horarios individuales usando el docente del grado-sección
        for (const horario of horarios) {
          const nuevoHorario = await (tx as any).horarioClase.create({
            data: {
              idGradoSeccion: parseInt(idGradoSeccion),
              idDocente: docentePrincipal?.idDocente || null, // Docente del grado-sección
              materia: null, // En primaria no se usa materia específica
              diaSemana: parseInt(horario.diaSemana),
              horaInicio: new Date(`1970-01-01T${horario.horaInicio}:00`),
              horaFin: new Date(`1970-01-01T${horario.horaFin}:00`),
              aula: horario.aula || null,
              toleranciaMin: horario.toleranciaMin || 10,
              sesiones: horario.sesiones || 1,
              tipoActividad: horario.tipoActividad || 'CLASE_REGULAR',
              activo: horario.activo !== false
            }
          })
          resultados.push(nuevoHorario)
        }
      }

      return resultados
    })

    console.log(`Horarios anuales creados exitosamente: ${horariosCreados.length} horarios`)

    return NextResponse.json({
      message: 'Horarios anuales creados exitosamente',
      data: {
        nombre,
        descripcion,
        totalHorarios: horariosCreados.length,
        fechaInicio,
        fechaFin,
        horarios: horariosCreados.map(h => ({
          id: h.idHorarioClase,
          diaSemana: h.diaSemana,
          horaInicio: h.horaInicio.toTimeString().slice(0, 5),
          horaFin: h.horaFin.toTimeString().slice(0, 5),
          materia: h.materia,
          aula: h.aula,
          tipoActividad: h.tipoActividad
        }))
      }
    })

  } catch (error) {
    console.error('Error creating horarios anuales:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const idGradoSeccion = url.searchParams.get('idGradoSeccion')

    if (!idGradoSeccion) {
      return NextResponse.json(
        { error: 'idGradoSeccion es requerido' },
        { status: 400 }
      )
    }

    const horarios = await (prisma as any).horarioClase.findMany({
      where: {
        idGradoSeccion: parseInt(idGradoSeccion),
        activo: true
      },
      include: {
        gradoSeccion: {
          include: {
            grado: true,
            seccion: true
          }
        },
        docente: {
          select: {
            idDocente: true,
            usuario: {
              select: {
                nombre: true,
                apellido: true
              }
            }
          }
        }
      },
      orderBy: [
        { diaSemana: 'asc' },
        { horaInicio: 'asc' }
      ]
    })

    const horariosTransformados = horarios.map((horario: any) => ({
      id: horario.idHorarioClase,
      diaSemana: horario.diaSemana,
      diaNombre: getDiaNombre(horario.diaSemana),
      horaInicio: horario.horaInicio.toTimeString().slice(0, 5),
      horaFin: horario.horaFin.toTimeString().slice(0, 5),
      materia: horario.materia,
      aula: horario.aula || '',
      tipoActividad: horario.tipoActividad,
      tipoActividadLabel: getTipoActividadLabel(horario.tipoActividad),
      toleranciaMin: horario.toleranciaMin,
      sesiones: horario.sesiones,
      docente: horario.docente ? {
        id: horario.docente.idDocente,
        nombre: `${horario.docente.usuario?.nombre || ''} ${horario.docente.usuario?.apellido || ''}`.trim()
      } : null,
      grado: horario.gradoSeccion.grado.nombre,
      seccion: horario.gradoSeccion.seccion.nombre,
      activo: horario.activo,
      createdAt: horario.createdAt.toISOString(),
      updatedAt: horario.updatedAt?.toISOString() || null
    }))

    return NextResponse.json({
      data: horariosTransformados,
      total: horariosTransformados.length
    })

  } catch (error) {
    console.error('Error fetching horarios anuales:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

function getDiaNombre(diaSemana: number): string {
  const dias = {
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado',
    7: 'Domingo'
  }
  return dias[diaSemana as keyof typeof dias] || 'Desconocido'
}

function getTipoActividadLabel(tipo: string): string {
  const tipos = {
    'CLASE_REGULAR': 'Clase Regular',
    'REFORZAMIENTO': 'Reforzamiento',
    'RECUPERACION': 'Recuperación',
    'EVALUACION': 'Evaluación',
    'TALLER_EXTRA': 'Taller Extra'
  }
  return tipos[tipo as keyof typeof tipos] || tipo
}
