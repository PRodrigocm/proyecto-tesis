import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ claseId: string }> }
) {
  try {
    console.log('🔍 Obteniendo asistencias de la clase...')
    
    // Verificar autenticación
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const userInfo = verifyToken(token)
    if (!userInfo) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { claseId } = await params
    
    // Obtener fecha de los query parameters
    const url = new URL(request.url)
    const fecha = url.searchParams.get('fecha')
    
    if (!fecha) {
      return NextResponse.json({ error: 'Fecha requerida' }, { status: 400 })
    }

    console.log('🏫 Clase recibida:', claseId)
    console.log('📅 Fecha:', fecha)

    // Verificar si claseId es un número o texto
    const docenteAulaId = parseInt(claseId)
    
    if (isNaN(docenteAulaId)) {
      console.log('❌ claseId no es un número válido:', claseId)
      return NextResponse.json({ 
        error: 'ID de clase inválido',
        received: claseId,
        message: 'Se esperaba un ID numérico'
      }, { status: 400 })
    }

    console.log('🏫 ID de la clase (convertido):', docenteAulaId)

    // Obtener información de la clase
    const docenteAula = await prisma.docenteAula.findFirst({
      where: { idDocenteAula: docenteAulaId },
      include: {
        gradoSeccion: {
          include: {
            grado: true,
            seccion: true
          }
        }
      }
    })

    if (!docenteAula) {
      return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 })
    }

    // Obtener estudiantes del grado-sección con asistencias y retiros
    const fechaConsulta = new Date(fecha)
    
    const estudiantes = await prisma.estudiante.findMany({
      where: {
        idGradoSeccion: docenteAula.idGradoSeccion
      },
      include: {
        usuario: true,
        asistencias: {
          where: {
            fecha: fechaConsulta
          },
          include: {
            estadoAsistencia: true
          }
        },
        retiros: {
          where: {
            fecha: fechaConsulta
          },
          include: {
            estadoRetiro: true,
            tipoRetiro: true
          }
        }
      }
    })

    console.log('👥 Estudiantes encontrados:', estudiantes.length)

    // Transformar datos para la respuesta
    const asistencias = estudiantes.map(estudiante => {
      const asistenciaDelDia = estudiante.asistencias[0] // Primera asistencia del día
      const retiroDelDia = estudiante.retiros[0] // Primer retiro del día
      
      // Determinar estado visual basado en asistencia y retiro
      let estado = 'sin_registrar'
      let estadoVisual = null
      let observaciones = asistenciaDelDia?.observaciones || null
      
      if (retiroDelDia) {
        // Si hay retiro, determinar estado basado en la hora del retiro
        const horaRetiro = retiroDelDia.hora
        const horaRetiroHours = horaRetiro.getHours()
        const horaRetiroMinutes = horaRetiro.getMinutes()
        const totalMinutos = horaRetiroHours * 60 + horaRetiroMinutes
        
        if (totalMinutos < 510) { // Antes de 8:30 AM
          estado = 'retiro_temprano'
          estadoVisual = 'bg-red-100 text-red-800' // Rojo
        } else if (totalMinutos < 600) { // Entre 8:30 AM y 10:00 AM
          estado = 'retiro_parcial'
          estadoVisual = 'bg-gray-100 text-gray-800' // Gris
        } else { // Después de 10:00 AM
          estado = 'retiro_tardio'
          estadoVisual = 'bg-yellow-100 text-yellow-800' // Amarillo
        }
        
        observaciones = `Retiro: ${retiroDelDia.tipoRetiro?.nombre || 'Motivo no especificado'} (${horaRetiro.toTimeString().slice(0, 5)})`
      } else if (asistenciaDelDia?.estadoAsistencia) {
        // Si no hay retiro, usar estado de asistencia normal
        estado = asistenciaDelDia.estadoAsistencia.codigo.toLowerCase()
      }
      
      return {
        id: estudiante.idEstudiante,
        nombre: `${estudiante.usuario.nombre || 'Sin nombre'} ${estudiante.usuario.apellido || 'Sin apellido'}`,
        codigo: `EST${estudiante.idEstudiante.toString().padStart(3, '0')}`,
        dni: estudiante.usuario.dni || 'Sin DNI',
        estado: estado,
        estadoVisual: estadoVisual,
        horaLlegada: asistenciaDelDia?.horaEntrada ? 
          asistenciaDelDia.horaEntrada.toTimeString().slice(0, 5) : null,
        horaSalida: retiroDelDia?.hora ? 
          retiroDelDia.hora.toTimeString().slice(0, 5) : 
          (asistenciaDelDia?.horaSalida ? asistenciaDelDia.horaSalida.toTimeString().slice(0, 5) : null),
        observaciones: observaciones,
        tieneRetiro: !!retiroDelDia,
        retiro: retiroDelDia ? {
          id: retiroDelDia.idRetiro,
          motivo: retiroDelDia.tipoRetiro?.nombre || 'Sin motivo',
          hora: retiroDelDia.hora.toTimeString().slice(0, 5),
          estado: retiroDelDia.estadoRetiro?.nombre || 'Pendiente'
        } : null
      }
    })

    console.log('✅ Asistencias obtenidas exitosamente')
    return NextResponse.json({
      success: true,
      data: asistencias,
      clase: {
        id: docenteAulaId,
        nombre: `${docenteAula.gradoSeccion.grado.nombre}° ${docenteAula.gradoSeccion.seccion.nombre}`,
        fecha: fecha
      }
    })

  } catch (error) {
    console.error('❌ Error al obtener asistencias:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Función auxiliar para convertir estado de BD a texto
function getEstadoTexto(idEstadoAsistencia: number): string {
  // Mapear según los IDs de estados en tu BD
  // Ajustar según tu esquema de EstadoAsistencia
  switch (idEstadoAsistencia) {
    case 1: return 'presente'
    case 2: return 'tardanza'
    case 3: return 'inasistencia'
    case 4: return 'justificada'
    default: return 'sin_registrar'
  }
}
