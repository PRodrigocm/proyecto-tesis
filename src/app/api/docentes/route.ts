import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get user's IE from query params or headers
    const url = new URL(request.url)
    const ieId = url.searchParams.get('ieId')
    
    const whereClause: any = {}
    
    // Filtrar por institución si se proporciona
    if (ieId) {
      whereClause.usuario = {
        idIe: parseInt(ieId)
      }
    }

    const docentes = await prisma.docente.findMany({
      where: whereClause,
      include: {
        usuario: {
          include: {
            ie: true
          }
        },
        docenteAulas: {
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
            tipoAsignacion: true
          }
        }
      },
      orderBy: {
        usuario: {
          nombre: 'asc'
        }
      }
    })

    const transformedDocentes = docentes.map(docente => {
      // Obtener la primera asignación de aula (puede tener múltiples)
      const primeraAsignacion = docente.docenteAulas[0]
      
      return {
        id: docente.idDocente.toString(),
        nombre: docente.usuario.nombre,
        apellido: docente.usuario.apellido,
        email: docente.usuario.email || '',
        telefono: docente.usuario.telefono || '',
        dni: docente.usuario.dni,
        especialidad: docente.especialidad || '',
        institucionEducativa: docente.usuario.ie?.nombre || 'Sin institución',
        grado: primeraAsignacion?.gradoSeccion?.grado?.nombre || '',
        seccion: primeraAsignacion?.gradoSeccion?.seccion?.nombre || '',
        fechaRegistro: docente.usuario.createdAt.toISOString(),
        estado: docente.usuario.estado as 'ACTIVO' | 'INACTIVO',
        materias: docente.docenteAulas.map(asignacion => ({
          id: asignacion.idDocenteAula.toString(),
          nombre: `${asignacion.gradoSeccion.grado.nombre}° ${asignacion.gradoSeccion.seccion.nombre} - ${asignacion.tipoAsignacion.nombre}`
        }))
      }
    })

    return NextResponse.json({
      data: transformedDocentes,
      total: transformedDocentes.length
    })

  } catch (error) {
    console.error('Error fetching docentes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Body recibido en API:', body)
    
    const { 
      dni, nombre, apellido, email, telefono, 
      especialidad, grado, seccion, tipoAsignacion, password, esDocenteTaller 
    } = body

    console.log('Campos extraídos:', { dni, nombre, apellido, email, especialidad, password, esDocenteTaller })

    // Validar campos requeridos
    const camposRequeridos = { dni, nombre, apellido, email, especialidad, password }
    const camposFaltantes = Object.entries(camposRequeridos)
      .filter(([key, value]) => !value || value.trim() === '')
      .map(([key]) => key)
    
    if (camposFaltantes.length > 0) {
      console.log('Error: Faltan campos requeridos:', camposFaltantes)
      return NextResponse.json(
        { error: 'Faltan campos requeridos', camposFaltantes, campos: camposRequeridos },
        { status: 400 }
      )
    }

    // Obtener información del usuario desde localStorage (en el frontend se envía)
    const userStr = body.userInfo
    if (!userStr) {
      console.log('Error: No se encontró userInfo')
      return NextResponse.json(
        { error: 'Información de usuario requerida' },
        { status: 400 }
      )
    }

    const user = JSON.parse(userStr)
    const ieId = user.idIe || user.institucionId || 1
    console.log('Usuario extraído:', user)
    console.log('IE ID:', ieId)

    // Verificar DNI único
    console.log('Verificando DNI único:', dni)
    const existingUserByDni = await prisma.usuario.findFirst({
      where: { dni }
    })

    if (existingUserByDni) {
      console.log('Error: DNI ya existe:', existingUserByDni)
      return NextResponse.json(
        { error: 'Ya existe un usuario con este DNI' },
        { status: 400 }
      )
    }

    // Verificar email único
    console.log('Verificando email único:', email)
    const existingUserByEmail = await prisma.usuario.findFirst({
      where: { email }
    })

    if (existingUserByEmail) {
      console.log('Error: Email ya existe:', existingUserByEmail)
      return NextResponse.json(
        { error: 'Ya existe un usuario con este email' },
        { status: 400 }
      )
    }

    // Crear usuario
    console.log('Creando usuario con datos:', {
      dni, nombre, apellido, email, telefono, passwordHash: '***', idIe: ieId, estado: 'ACTIVO'
    })
    
    const newUser = await prisma.usuario.create({
      data: {
        dni,
        nombre,
        apellido,
        email,
        telefono,
        passwordHash: password, // En producción debería estar hasheada
        idIe: ieId,
        estado: 'ACTIVO'
      }
    })
    
    console.log('Usuario creado exitosamente:', newUser.idUsuario)

    // Crear docente
    const newDocente = await prisma.docente.create({
      data: {
        idUsuario: newUser.idUsuario,
        especialidad
      }
    })

    // Asignar rol de docente
    const docenteRole = await prisma.rol.findFirst({
      where: { nombre: 'DOCENTE' }
    })

    if (docenteRole) {
      await prisma.usuarioRol.create({
        data: {
          idUsuario: newUser.idUsuario,
          idRol: docenteRole.idRol
        }
      })
    }

    // Crear asignación de aula solo si NO es docente de taller y se proporcionan todos los datos
    if (!esDocenteTaller && grado && seccion && tipoAsignacion) {
      console.log('Creando asignación de aula para docente regular')
      const gradoSeccion = await prisma.gradoSeccion.findFirst({
        where: {
          idGrado: parseInt(grado),
          idSeccion: parseInt(seccion)
        }
      })

      if (gradoSeccion) {
        await prisma.docenteAula.create({
          data: {
            idDocente: newDocente.idDocente,
            idGradoSeccion: gradoSeccion.idGradoSeccion,
            idTipoAsignacion: parseInt(tipoAsignacion)
          }
        })
        console.log('Asignación de aula creada exitosamente')
      } else {
        console.log('No se encontró el grado-sección especificado')
      }
    } else if (esDocenteTaller) {
      console.log('Docente de taller creado sin asignación de aula específica')
    } else {
      console.log('Docente creado sin asignación de aula (campos opcionales no completados)')
    }

    return NextResponse.json({ 
      message: `Docente ${esDocenteTaller ? 'de taller ' : ''}creado exitosamente`,
      id: newDocente.idDocente,
      tipo: esDocenteTaller ? 'taller' : 'regular'
    })

  } catch (error) {
    console.error('Error creating docente:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const docenteId = url.searchParams.get('id')
    const body = await request.json()
    const { nombre, apellido, dni, email, telefono, especialidad, gradoId, seccionId, tipoAsignacionId } = body

    if (!docenteId) {
      return NextResponse.json(
        { error: 'Docente ID is required' },
        { status: 400 }
      )
    }

    const docente = await prisma.docente.findUnique({
      where: { idDocente: parseInt(docenteId) },
      include: { usuario: true }
    })

    if (!docente) {
      return NextResponse.json(
        { error: 'Docente not found' },
        { status: 404 }
      )
    }

    // Verificar DNI único (excluyendo el usuario actual)
    if (dni !== docente.usuario.dni) {
      const existingUser = await prisma.usuario.findFirst({
        where: {
          dni: dni,
          idUsuario: { not: docente.usuario.idUsuario }
        }
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Ya existe un usuario con este DNI' },
          { status: 400 }
        )
      }
    }

    // Verificar email único (excluyendo el usuario actual)
    if (email !== docente.usuario.email) {
      const existingUser = await prisma.usuario.findFirst({
        where: {
          email: email,
          idUsuario: { not: docente.usuario.idUsuario }
        }
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Ya existe un usuario con este email' },
          { status: 400 }
        )
      }
    }

    // Actualizar usuario
    await prisma.usuario.update({
      where: { idUsuario: docente.usuario.idUsuario },
      data: {
        nombre,
        apellido,
        dni,
        email,
        telefono
      }
    })

    // Actualizar docente
    await prisma.docente.update({
      where: { idDocente: parseInt(docenteId) },
      data: {
        especialidad
      }
    })

    // Manejar asignación de aula si se proporcionan grado, sección y tipo
    if (gradoId && seccionId && tipoAsignacionId) {
      // Buscar el GradoSeccion correspondiente
      const gradoSeccion = await prisma.gradoSeccion.findFirst({
        where: {
          idGrado: gradoId,
          idSeccion: seccionId
        }
      })

      if (gradoSeccion) {
        // Eliminar asignaciones anteriores del docente
        await prisma.docenteAula.deleteMany({
          where: { idDocente: parseInt(docenteId) }
        })

        // Crear nueva asignación con el tipo especificado
        await prisma.docenteAula.create({
          data: {
            idDocente: parseInt(docenteId),
            idGradoSeccion: gradoSeccion.idGradoSeccion,
            idTipoAsignacion: tipoAsignacionId
          }
        })
      }
    }

    return NextResponse.json({ message: 'Docente actualizado exitosamente' })

  } catch (error) {
    console.error('Error updating docente:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const docenteId = url.searchParams.get('id')
    const body = await request.json()
    const { estado } = body

    if (!docenteId) {
      return NextResponse.json(
        { error: 'Docente ID is required' },
        { status: 400 }
      )
    }

    const docente = await prisma.docente.findUnique({
      where: { idDocente: parseInt(docenteId) },
      include: { usuario: true }
    })

    if (!docente) {
      return NextResponse.json(
        { error: 'Docente not found' },
        { status: 404 }
      )
    }

    await prisma.usuario.update({
      where: { idUsuario: docente.usuario.idUsuario },
      data: { estado }
    })

    return NextResponse.json({ message: 'Estado actualizado exitosamente' })

  } catch (error) {
    console.error('Error updating docente:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
