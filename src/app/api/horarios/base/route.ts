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
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET no está configurado')
      return null
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    console.error('Error verificando token:', error)
    return null
  }
}

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
    console.log('🔑 Token recibido:', token ? 'SÍ' : 'NO')
    
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
    console.log('🎯 Datos para crear:', {
      idGradoSeccion: parseInt(idGradoSeccion),
      horaInicio,
      horaFin,
      aula: aula || null,
      toleranciaMin: parseInt(toleranciaMin)
    })

    // DEBUG: Verificar conexión a BD
    console.log('🔍 Verificando conexión a BD...')
    const testConnection = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Conexión a BD OK:', testConnection)
    
    // Crear horarios para L-V (días 1-5)
    const horariosCreados = []
    const diasSemana = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
    
    for (let dia = 1; dia <= 5; dia++) {
      console.log(`🔍 Verificando ${diasSemana[dia]} (día ${dia})...`)
      
      // Verificar si ya existe horario para este día
      console.log(`🔍 Buscando horario existente para grado-sección ${idGradoSeccion}, día ${dia}...`)
      
      const existeHorario = await prisma.horarioClase.findFirst({
        where: {
          idGradoSeccion: parseInt(idGradoSeccion),
          diaSemana: dia,
          activo: true
        }
      })

      console.log(`📊 Resultado búsqueda para ${diasSemana[dia]}:`, existeHorario ? 'EXISTE' : 'NO EXISTE')

      if (existeHorario) {
        console.log(`⚠️ Ya existe horario para ${diasSemana[dia]}:`, {
          id: existeHorario.idHorarioClase,
          hora: `${existeHorario.horaInicio} - ${existeHorario.horaFin}`,
          aula: existeHorario.aula,
          idGradoSeccion: existeHorario.idGradoSeccion,
          diaSemana: existeHorario.diaSemana
        })
        console.log('⚠️ Saltando creación...')
        continue
      }

      console.log(`➕ Creando horario para ${diasSemana[dia]}...`)
      
      const dataToCreate = {
        idGradoSeccion: parseInt(idGradoSeccion),
        diaSemana: dia,
        horaInicio: new Date(`1970-01-01T${horaInicio}:00.000Z`),
        horaFin: new Date(`1970-01-01T${horaFin}:00.000Z`),
        aula: aula || null,
        idDocente: idDocente ? parseInt(idDocente) : null,
        toleranciaMin: parseInt(toleranciaMin),
        tipoActividad: 'CLASE_REGULAR' as any,
        activo: true
      }
      
      console.log(`📋 Datos a insertar para ${diasSemana[dia]}:`, dataToCreate)
      
      try {
        console.log(`🚀 Ejecutando prisma.horarioClase.create para ${diasSemana[dia]}...`)
        
        const nuevoHorario = await prisma.horarioClase.create({
          data: dataToCreate,
          include: {
            gradoSeccion: {
              include: {
                grado: true,
                seccion: true
              }
            }
          }
        })
        
        console.log(`🎉 Horario creado exitosamente en BD para ${diasSemana[dia]}:`, {
          id: nuevoHorario.idHorarioClase,
          idGradoSeccion: nuevoHorario.idGradoSeccion,
          diaSemana: nuevoHorario.diaSemana,
          horaInicio: nuevoHorario.horaInicio,
          horaFin: nuevoHorario.horaFin,
          aula: nuevoHorario.aula
        })
        
        console.log(`✅ Horario creado exitosamente para ${diasSemana[dia]}:`, {
          id: nuevoHorario.idHorarioClase,
          dia: diasSemana[dia],
          hora: `${horaInicio} - ${horaFin}`,
          aula: nuevoHorario.aula || 'Sin especificar'
        })
        
        horariosCreados.push(nuevoHorario)
      } catch (error) {
        console.error(`❌ Error creando horario para ${diasSemana[dia]}:`, error)
        throw error
      }
    }

    console.log('📊 Resumen de creación:', {
      totalHorariosCreados: horariosCreados.length,
      gradoSeccion: `${gradoSeccion.grado.nombre}° ${gradoSeccion.seccion.nombre}`,
      horario: `${horaInicio} - ${horaFin}`,
      aula: aula || 'Sin especificar'
    })

    if (horariosCreados.length === 0) {
      console.log('⚠️ No se crearon nuevos horarios - todos ya existían')
    }

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
