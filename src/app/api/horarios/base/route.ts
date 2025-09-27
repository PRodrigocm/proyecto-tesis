import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET - Obtener horarios base por grado-sección
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
    const ieId = searchParams.get('ieId')
    const gradoSeccionId = searchParams.get('gradoSeccionId')

    if (!ieId) {
      return NextResponse.json({ error: 'IE ID requerido' }, { status: 400 })
    }

    // Construir filtros
    const where: any = {
      gradoSeccion: {
        grado: {
          nivel: {
            idIe: parseInt(ieId)
          }
        }
      },
      activo: true
    }

    if (gradoSeccionId) {
      where.idGradoSeccion = parseInt(gradoSeccionId)
    }

    const horariosBase = await prisma.horarioClase.findMany({
      where,
      include: {
        gradoSeccion: {
          include: {
            grado: {
              include: {
                nivel: true
              }
            },
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
        { diaSemana: 'asc' },
        { horaInicio: 'asc' }
      ]
    })

    const diasSemana = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

    const horariosTransformados = horariosBase.map(horario => ({
      id: horario.idHorarioClase.toString(),
      idGradoSeccion: horario.idGradoSeccion,
      grado: horario.gradoSeccion.grado.nombre,
      seccion: horario.gradoSeccion.seccion.nombre,
      diaSemana: diasSemana[horario.diaSemana],
      diaNumero: horario.diaSemana,
      horaInicio: horario.horaInicio.toISOString().slice(11, 16), // HH:MM
      horaFin: horario.horaFin.toISOString().slice(11, 16), // HH:MM
      aula: horario.aula || '',
      docente: horario.docente ? 
        `${horario.docente.usuario.nombre} ${horario.docente.usuario.apellido}` : 
        'Sin asignar',
      tipoActividad: horario.tipoActividad,
      toleranciaMin: horario.toleranciaMin,
      activo: horario.activo,
      createdAt: horario.createdAt.toISOString()
    }))

    return NextResponse.json({
      success: true,
      data: horariosTransformados,
      total: horariosTransformados.length
    })

  } catch (error) {
    console.error('Error fetching horarios base:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear horario base para un grado-sección
export async function POST(request: NextRequest) {
  console.log('🚀 === INICIANDO POST /api/horarios/base ===')
  
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      console.error('❌ Token no proporcionado')
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      console.error('❌ Token inválido')
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    console.log('✅ Usuario autenticado:', { userId: user.userId, email: user.email })

    const body = await request.json()
    console.log('📋 Body recibido:', body)
    
    const { 
      idGradoSeccion, 
      horaInicio = '08:00', 
      horaFin = '13:30',
      aula,
      idDocente,
      toleranciaMin = 10
    } = body

    console.log('📊 Datos procesados:', {
      idGradoSeccion,
      horaInicio,
      horaFin,
      aula: aula || 'Sin especificar',
      idDocente: idDocente || 'Sin asignar',
      toleranciaMin
    })

    if (!idGradoSeccion) {
      console.error('❌ Grado y sección no proporcionados')
      return NextResponse.json({ 
        error: 'Grado y sección requeridos' 
      }, { status: 400 })
    }

    console.log('🔍 Verificando que el grado-sección existe...')
    
    // Verificar que el grado-sección existe
    const gradoSeccion = await prisma.gradoSeccion.findUnique({
      where: { idGradoSeccion: parseInt(idGradoSeccion) },
      include: {
        grado: {
          include: {
            nivel: true
          }
        },
        seccion: true
      }
    })

    if (!gradoSeccion) {
      console.error('❌ Grado-sección no encontrado:', idGradoSeccion)
      return NextResponse.json({ 
        error: 'Grado-sección no encontrado' 
      }, { status: 404 })
    }

    console.log('✅ Grado-sección encontrado:', {
      id: gradoSeccion.idGradoSeccion,
      grado: gradoSeccion.grado.nombre,
      seccion: gradoSeccion.seccion.nombre,
      nivel: gradoSeccion.grado.nivel.nombre,
      ie: gradoSeccion.grado.nivel.idIe
    })

    console.log('📅 Iniciando creación de horarios L-V (días 1-5)...')
    
    // Crear horarios para L-V (días 1-5)
    const horariosCreados = []
    const diasSemana = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
    
    for (let dia = 1; dia <= 5; dia++) {
      console.log(`🔍 Verificando ${diasSemana[dia]} (día ${dia})...`)
      
      // Verificar si ya existe horario para este día
      const existeHorario = await prisma.horarioClase.findFirst({
        where: {
          idGradoSeccion: parseInt(idGradoSeccion),
          diaSemana: dia,
          activo: true
        }
      })

      if (existeHorario) {
        console.log(`⚠️ Ya existe horario para ${diasSemana[dia]}, saltando...`)
        continue
      }

      console.log(`➕ Creando horario para ${diasSemana[dia]}...`)
      
      const nuevoHorario = await prisma.horarioClase.create({
        data: {
          idGradoSeccion: parseInt(idGradoSeccion),
          diaSemana: dia,
          horaInicio: new Date(`1970-01-01T${horaInicio}:00.000Z`),
          horaFin: new Date(`1970-01-01T${horaFin}:00.000Z`),
          aula: aula || null,
          idDocente: idDocente ? parseInt(idDocente) : null,
          toleranciaMin: parseInt(toleranciaMin),
          tipoActividad: 'CLASE_REGULAR',
          activo: true
        },
        include: {
          gradoSeccion: {
            include: {
              grado: true,
              seccion: true
            }
          }
        }
      })
      
      console.log(`✅ Horario creado para ${diasSemana[dia]}:`, {
        id: nuevoHorario.idHorarioClase,
        dia: diasSemana[dia],
        hora: `${horaInicio} - ${horaFin}`,
        aula: nuevoHorario.aula || 'Sin especificar'
      })
      
      horariosCreados.push(nuevoHorario)
    }

    console.log('📊 Resumen de creación:', {
      totalHorariosCreados: horariosCreados.length,
      gradoSeccion: `${gradoSeccion.grado.nombre}° ${gradoSeccion.seccion.nombre}`,
      horario: `${horaInicio} - ${horaFin}`,
      aula: aula || 'Sin especificar'
    })

    return NextResponse.json({
      success: true,
      message: `Horario base creado para ${gradoSeccion.grado.nombre}° ${gradoSeccion.seccion.nombre}`,
      data: {
        gradoSeccion: `${gradoSeccion.grado.nombre}° ${gradoSeccion.seccion.nombre}`,
        horario: `${horaInicio} - ${horaFin}`,
        dias: 'Lunes a Viernes',
        horariosCreados: horariosCreados.length
      }
    })

  } catch (error) {
    console.error('Error creating horario base:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
