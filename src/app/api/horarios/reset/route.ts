import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

interface JWTPayload {
  userId: number
  email: string
  rol: string
  ieId?: number
}

function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as JWTPayload
    return decoded
  } catch (error) {
    console.error('Error verifying token:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const body = await request.json()
    const { idGradoSeccion, horaInicio, horaFin } = body

    if (!idGradoSeccion || !horaInicio || !horaFin) {
      return NextResponse.json({ 
        error: 'idGradoSeccion, horaInicio y horaFin son requeridos' 
      }, { status: 400 })
    }

    console.log('🔄 === RESETEANDO HORARIOS ===')
    console.log('📋 Datos:', { idGradoSeccion, horaInicio, horaFin })

    // Verificar que el grado-sección existe
    const gradoSeccion = await prisma.gradoSeccion.findUnique({
      where: { idGradoSeccion: parseInt(idGradoSeccion) },
      include: {
        grado: { include: { nivel: true } },
        seccion: true,
        docenteAulas: {
          include: {
            docente: {
              include: {
                usuario: true
              }
            }
          }
        }
      }
    })

    if (!gradoSeccion) {
      return NextResponse.json({ 
        error: 'Grado-sección no encontrado' 
      }, { status: 404 })
    }

    // Verificar permisos
    const ieId = user.ieId || 1
    if (gradoSeccion.grado.nivel.idIe !== ieId) {
      return NextResponse.json({ 
        error: 'No tienes permisos para editar este grado-sección' 
      }, { status: 403 })
    }

    // Usar transacción para resetear horarios
    const result = await prisma.$transaction(async (tx) => {
      // 1. Eliminar todos los horarios existentes para este grado-sección
      const horariosEliminados = await tx.horarioClase.deleteMany({
        where: { idGradoSeccion: parseInt(idGradoSeccion) }
      })

      console.log(`🗑️ Eliminados ${horariosEliminados.count} horarios existentes`)

      // 2. Crear horarios nuevos con las horas correctas (Lunes a Viernes)
      const horariosCreados = []
      const docente = gradoSeccion.docenteAulas[0]?.docente || null

      for (let dia = 1; dia <= 5; dia++) { // Lunes a Viernes
        const horaInicioDateTime = new Date(`1970-01-01T${horaInicio}:00.000Z`)
        const horaFinDateTime = new Date(`1970-01-01T${horaFin}:00.000Z`)

        console.log(`📅 Creando horario para día ${dia}: ${horaInicio} - ${horaFin}`)
        console.log(`⏰ DateTime creados: ${horaInicioDateTime.toISOString()} - ${horaFinDateTime.toISOString()}`)

        const nuevoHorario = await tx.horarioClase.create({
          data: {
            idGradoSeccion: parseInt(idGradoSeccion),
            idDocente: docente?.idDocente || null,
            diaSemana: dia,
            horaInicio: horaInicioDateTime,
            horaFin: horaFinDateTime,
            aula: `Aula ${gradoSeccion.grado.nombre}° ${gradoSeccion.seccion.nombre}`,
            tipoActividad: 'CLASE_REGULAR',
            activo: true
          }
        })

        console.log(`✅ Horario creado: ID ${nuevoHorario.idHorarioClase}, Día ${dia}`)
        horariosCreados.push(nuevoHorario)
      }

      return {
        eliminados: horariosEliminados.count,
        creados: horariosCreados.length,
        horarios: horariosCreados
      }
    })

    console.log('✅ Reset completado:', result)

    return NextResponse.json({
      success: true,
      message: `Horarios reseteados exitosamente para ${gradoSeccion.grado.nombre}° ${gradoSeccion.seccion.nombre}`,
      data: {
        gradoSeccion: `${gradoSeccion.grado.nombre}° ${gradoSeccion.seccion.nombre}`,
        horariosEliminados: result.eliminados,
        horariosCreados: result.creados,
        horario: `${horaInicio} - ${horaFin}`,
        docente: gradoSeccion.docenteAulas[0]?.docente ? 
          `${gradoSeccion.docenteAulas[0].docente.usuario.nombre} ${gradoSeccion.docenteAulas[0].docente.usuario.apellido}` : 
          'Sin asignar'
      }
    })

  } catch (error) {
    console.error('Error resetting horarios:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
