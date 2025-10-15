import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/talleres - Iniciando consulta de talleres')
    
    // Obtener ieId del token de usuario
    const authHeader = request.headers.get('authorization')
    let ieId = 1 // Default
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
        ieId = decoded.ieId || 1
        console.log('✅ Token decodificado, ieId:', ieId)
      } catch (error) {
        console.log('⚠️ Error decoding token, using default ieId:', ieId)
      }
    } else {
      console.log('⚠️ No auth header, using default ieId:', ieId)
    }

    const talleres = await prisma.taller.findMany({
      where: {
        idIe: ieId
      },
      include: {
        inscripciones: {
          where: {
            estado: 'activa'
          }
        },
        ie: {
          select: {
            idIe: true,
            nombre: true
          }
        }
      },
      orderBy: [
        { nombre: 'asc' }
      ]
    })

    console.log(`📊 Talleres encontrados: ${talleres.length}`)

    const transformedData = talleres.map(taller => ({
      id: taller.idTaller.toString(),
      codigo: taller.codigo || '',
      nombre: taller.nombre,
      descripcion: taller.descripcion || '',
      instructor: taller.instructor || '',
      capacidadMaxima: taller.capacidadMaxima || 0,
      activo: taller.activo,
      inscripciones: taller.inscripciones.length,
      fechaCreacion: taller.createdAt?.toISOString() || '',
      fechaActualizacion: taller.updatedAt?.toISOString() || null
    }))

    console.log(`✅ Enviando ${transformedData.length} talleres al frontend`)

    return NextResponse.json({
      data: transformedData,
      total: transformedData.length
    })

  } catch (error) {
    console.error('Error fetching talleres:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📝 POST /api/talleres - Creando nuevo taller')
    
    // Obtener ieId del token de usuario
    const authHeader = request.headers.get('authorization')
    let ieId = 1 // Default
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
        ieId = decoded.ieId || 1
        console.log('✅ Token decodificado, ieId:', ieId)
      } catch (error) {
        console.log('⚠️ Error decoding token, using default ieId:', ieId)
      }
    }

    const body = await request.json()
    const {
      nombre,
      descripcion,
      docentesIds,
      estudiantesIds,
      capacidadMaxima,
      horarios
    } = body

    console.log('📋 Datos del taller a crear:', { nombre, descripcion, docentesIds, estudiantesIds, capacidadMaxima, horarios, ieId })

    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre del taller es requerido' },
        { status: 400 }
      )
    }

    // Verificar si ya existe un taller con el mismo nombre en esta IE
    const tallerExistente = await prisma.taller.findFirst({
      where: {
        nombre: nombre,
        idIe: ieId
      }
    })

    if (tallerExistente) {
      return NextResponse.json(
        { error: 'Ya existe un taller con este nombre en la institución' },
        { status: 400 }
      )
    }

    // Generar código único para el taller
    const codigoTaller = `TALL${Date.now().toString().slice(-6)}`

    // Usar transacción para crear taller, horarios, docentes y estudiantes
    const resultado = await prisma.$transaction(async (tx) => {
      // Crear el taller
      const nuevoTaller = await tx.taller.create({
        data: {
          codigo: codigoTaller,
          nombre: nombre,
          descripcion: descripcion || null,
          instructor: null, // Ya no usamos este campo
          capacidadMaxima: capacidadMaxima || 20,
          idIe: ieId,
          activo: true
        }
      })

      console.log('✅ Taller creado exitosamente:', nuevoTaller.idTaller)

      // Crear horarios si se proporcionaron
      let horariosCreados = []
      if (horarios && Array.isArray(horarios) && horarios.length > 0) {
        console.log(`📅 Creando ${horarios.length} horarios para el taller`)
        
        for (const horario of horarios) {
          const { diaSemana, horaInicio, horaFin, lugar } = horario
          
          // Validar datos del horario
          if (!diaSemana || !horaInicio || !horaFin) {
            throw new Error('Datos de horario incompletos')
          }
          
          if (diaSemana < 1 || diaSemana > 7) {
            throw new Error('Día de la semana debe estar entre 1 (Lunes) y 7 (Domingo)')
          }
          
          const horarioCreado = await tx.horarioTaller.create({
            data: {
              idTaller: nuevoTaller.idTaller,
              diaSemana: diaSemana,
              horaInicio: new Date(`1970-01-01T${horaInicio}:00.000Z`),
              horaFin: new Date(`1970-01-01T${horaFin}:00.000Z`),
              toleranciaMin: 10,
              lugar: lugar || null,
              activo: true
            }
          })
          
          horariosCreados.push({
            id: horarioCreado.idHorarioTaller,
            diaSemana: horarioCreado.diaSemana,
            horaInicio: horario.horaInicio,
            horaFin: horario.horaFin,
            lugar: horarioCreado.lugar
          })
        }
        
        console.log(`✅ ${horariosCreados.length} horarios creados exitosamente`)
      }

      // Asignar docentes al taller
      let docentesAsignados = []
      if (docentesIds && Array.isArray(docentesIds) && docentesIds.length > 0) {
        console.log(`👨‍🏫 Asignando ${docentesIds.length} docentes al taller`)
        
        for (const docenteId of docentesIds) {
          // Verificar que el docente existe
          const docente = await tx.docente.findUnique({
            where: { idDocente: parseInt(docenteId) },
            include: { usuario: true }
          })
          
          if (docente) {
            // Crear relación taller-docente (necesitaríamos una tabla de relación)
            // Por ahora, guardamos la información para el response
            docentesAsignados.push({
              id: docente.idDocente,
              nombre: docente.usuario.nombre,
              apellido: docente.usuario.apellido,
              especialidad: docente.especialidad
            })
            console.log(`✅ Docente ${docente.usuario.nombre} ${docente.usuario.apellido} asignado`)
          }
        }
      }

      // Inscribir estudiantes al taller
      let estudiantesInscritos = []
      if (estudiantesIds && Array.isArray(estudiantesIds) && estudiantesIds.length > 0) {
        console.log(`👨‍🎓 Inscribiendo ${estudiantesIds.length} estudiantes al taller`)
        
        for (const estudianteId of estudiantesIds) {
          // Verificar que el estudiante existe
          const estudiante = await tx.estudiante.findUnique({
            where: { idEstudiante: parseInt(estudianteId) },
            include: { 
              usuario: true,
              gradoSeccion: {
                include: {
                  grado: true,
                  seccion: true
                }
              }
            }
          })
          
          if (estudiante) {
            // Crear inscripción
            const inscripcion = await tx.inscripcionTaller.create({
              data: {
                idEstudiante: estudiante.idEstudiante,
                idTaller: nuevoTaller.idTaller,
                fechaInscripcion: new Date(),
                estado: 'activa',
                anio: new Date().getFullYear()
              }
            })
            
            estudiantesInscritos.push({
              id: estudiante.idEstudiante,
              nombre: estudiante.usuario.nombre,
              apellido: estudiante.usuario.apellido,
              grado: estudiante.gradoSeccion?.grado?.nombre || '',
              seccion: estudiante.gradoSeccion?.seccion?.nombre || '',
              dni: estudiante.usuario.dni
            })
            console.log(`✅ Estudiante ${estudiante.usuario.nombre} ${estudiante.usuario.apellido} inscrito`)
          }
        }
      }

      return { 
        taller: nuevoTaller, 
        horarios: horariosCreados,
        docentes: docentesAsignados,
        estudiantes: estudiantesInscritos
      }
    })

    const mensaje = [
      'Taller creado exitosamente',
      resultado.horarios.length > 0 ? `${resultado.horarios.length} horarios` : null,
      resultado.docentes.length > 0 ? `${resultado.docentes.length} docentes` : null,
      resultado.estudiantes.length > 0 ? `${resultado.estudiantes.length} estudiantes` : null
    ].filter(Boolean).join(' con ')

    return NextResponse.json({
      success: true,
      message: mensaje,
      data: {
        id: resultado.taller.idTaller.toString(),
        codigo: resultado.taller.codigo,
        nombre: resultado.taller.nombre,
        horarios: resultado.horarios,
        docentes: resultado.docentes,
        estudiantes: resultado.estudiantes
      }
    })

  } catch (error) {
    console.error('❌ Error creating taller:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
