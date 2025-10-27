import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    console.log('=== INICIO CREACIÓN DE USUARIO ===')
    console.log('Request method:', request.method)
    console.log('Request URL:', request.url)
    
    const body = await request.json()
    console.log('Body recibido:', JSON.stringify(body, null, 2))
    
    const {
      dni,
      nombre,
      nombres = nombre, // Fallback para compatibilidad
      apellido,
      apellidos = apellido, // Fallback para compatibilidad
      email,
      telefono,
      password,
      passwordHash = password, // Usar password si passwordHash no está presente
      ieId,
      rol, // Rol único como string
      roleIds = rol ? [rol] : [], // Convertir rol único a array
      especialidad,
      ocupacion,
      fechaNacimiento,
      estado,
      grado,
      seccion,
      apoderadoId,
      relacionApoderado,
      estudianteId,
      parentescoEstudiante
    } = body
    
    console.log('Campos extraídos:', {
      dni, nombres, apellidos, email, telefono, 
      passwordHash: passwordHash ? '[PRESENTE]' : '[AUSENTE]',
      ieId, roleIds, especialidad, ocupacion, fechaNacimiento, estado,
      grado, seccion, apoderadoId, relacionApoderado
    })

    // Validaciones básicas
    if (!nombres || !apellidos || !dni || !passwordHash || !ieId) {
      console.log('ERROR: Validación básica falló')
      return NextResponse.json(
        { error: 'Nombres, apellidos, DNI, contraseña e institución son obligatorios' },
        { status: 400 }
      )
    }

    // Validar que se proporcione al menos un rol
    if (!roleIds || roleIds.length === 0) {
      console.log('ERROR: No se proporcionó ningún rol')
      return NextResponse.json(
        { error: 'Debe especificar al menos un rol' },
        { status: 400 }
      )
    }
    console.log('✓ Validaciones básicas pasaron')

    // Obtener información de roles
    let selectedRoleNames: string[] = []
    
    if (typeof roleIds[0] === 'string' && isNaN(Number(roleIds[0]))) {
      // Si roleIds contiene nombres de roles directamente
      selectedRoleNames = roleIds
      console.log('Roles por nombre:', selectedRoleNames)
    } else {
      // Si roleIds contiene IDs numéricos
      console.log('Buscando roles con IDs:', roleIds)
      const roleNames = await prisma.rol.findMany({
        where: { idRol: { in: roleIds.map((id: string) => parseInt(id)) } },
        select: { nombre: true }
      })
      console.log('Roles encontrados:', roleNames)
      selectedRoleNames = roleNames.map(r => r.nombre)
    }
    
    console.log('Nombres de roles seleccionados:', selectedRoleNames)
    
    // Si tiene roles que requieren email/teléfono, validar que estén presentes
    const requiresEmailPhone = selectedRoleNames.some(role => 
      ['APODERADO', 'DOCENTE', 'ADMIN', 'ADMINISTRATIVO'].includes(role)
    )
    
    if (requiresEmailPhone && (!email || !telefono)) {
      return NextResponse.json(
        { error: 'Email y teléfono son obligatorios para los roles seleccionados' },
        { status: 400 }
      )
    }
    
    // Si es docente, validar especialidad
    if (selectedRoleNames.includes('DOCENTE') && !especialidad) {
      return NextResponse.json(
        { error: 'La especialidad es obligatoria para el rol de docente' },
        { status: 400 }
      )
    }

    // Verificar si el email ya existe (solo si se proporciona email)
    if (email) {
      console.log('Verificando email existente:', email)
      const existingUser = await prisma.usuario.findFirst({
        where: { email }
      })

      if (existingUser) {
        console.log('❌ Email ya existe:', email)
        return NextResponse.json(
          { error: `El email ${email} ya está registrado` },
          { status: 400 }
        )
      }
      console.log('✓ Email disponible')
    }

    // Verificar si el DNI ya existe
    console.log('Verificando DNI existente:', dni)
    const existingDni = await prisma.usuario.findFirst({
      where: { dni }
    })

    if (existingDni) {
      console.log('❌ DNI ya existe:', dni, 'Usuario:', existingDni.nombre, existingDni.apellido)
      return NextResponse.json(
        { error: `El DNI ${dni} ya está registrado por ${existingDni.nombre} ${existingDni.apellido}` },
        { status: 400 }
      )
    }
    console.log('✓ DNI disponible')

    // Hash de la contraseña
    console.log('Hasheando contraseña...')
    const hashedPassword = await bcrypt.hash(passwordHash, 10)
    console.log('✓ Contraseña hasheada')

    // Crear el usuario
    console.log('Creando usuario con datos:', {
      nombre: nombres,
      apellido: apellidos,
      dni,
      email: email || null,
      telefono: telefono || null,
      passwordHash: '[HASHEADO]',
      idIe: parseInt(ieId),
      estado: estado || 'ACTIVO'
    })
    
    const newUser = await prisma.usuario.create({
      data: {
        nombre: nombres,
        apellido: apellidos,
        dni,
        email: email || null,
        telefono: telefono || null,
        passwordHash: hashedPassword,
        idIe: parseInt(ieId),
        estado: estado || 'ACTIVO'
      }
    })
    console.log('✓ Usuario creado con ID:', newUser.idUsuario)

    // Asignar roles al usuario
    console.log('Asignando roles al usuario...')
    
    // Obtener IDs de roles por nombre si es necesario
    let roleIdsToAssign: number[] = []
    
    if (typeof roleIds[0] === 'string' && isNaN(Number(roleIds[0]))) {
      // Buscar IDs por nombres de roles
      const rolesFromDb = await prisma.rol.findMany({
        where: { nombre: { in: selectedRoleNames } },
        select: { idRol: true }
      })
      roleIdsToAssign = rolesFromDb.map(r => r.idRol)
    } else {
      // Ya son IDs numéricos
      roleIdsToAssign = roleIds.map((id: string) => parseInt(id))
    }
    
    const roleAssignments = roleIdsToAssign.map((roleId: number) => ({
      idUsuario: newUser.idUsuario,
      idRol: roleId
    }))
    console.log('Asignaciones de roles:', roleAssignments)

    await prisma.usuarioRol.createMany({
      data: roleAssignments
    })
    console.log('✓ Roles asignados')

    // Crear registros específicos según el rol
    console.log('Creando registros específicos por rol...')
    for (const roleName of selectedRoleNames) {
      console.log(`Procesando rol: ${roleName}`)
      switch (roleName) {
        case 'DOCENTE':
          console.log('Creando registro de docente...')
          await prisma.docente.create({
            data: {
              idUsuario: newUser.idUsuario,
              especialidad: especialidad || null
            }
          })
          console.log('✓ Docente creado')
          break
        case 'ESTUDIANTE':
          console.log('Creando registro de estudiante...')
          console.log('ieId para estudiante:', ieId)
          console.log('fechaNacimiento para estudiante:', fechaNacimiento)
          console.log('grado:', grado, 'seccion:', seccion)
          
          // Generar QR único para el estudiante
          const qrCode = `EST_${newUser.idUsuario}_${Date.now()}`
          
          const estudianteData = {
            idUsuario: newUser.idUsuario,
            codigoQR: qrCode,
            fechaNacimiento: fechaNacimiento && fechaNacimiento.trim() !== '' ? new Date(fechaNacimiento) : null
          }
          
          console.log('Datos del estudiante a crear:', estudianteData)
          
          const newEstudiante = await prisma.estudiante.create({
            data: estudianteData
          })
          console.log('✓ Estudiante creado con QR:', qrCode)
          
          // Crear relación con apoderado si se especificó
          if (apoderadoId && relacionApoderado) {
            console.log('Creando relación estudiante-apoderado...')
            await prisma.estudianteApoderado.create({
              data: {
                idEstudiante: newEstudiante.idEstudiante,
                idApoderado: parseInt(apoderadoId),
                relacion: relacionApoderado,
                esTitular: true,
                puedeRetirar: true
              }
            })
            console.log('✓ Relación estudiante-apoderado creada')
          }
          break
        case 'APODERADO':
          console.log('Creando registro de apoderado...')
          const newApoderado = await prisma.apoderado.create({
            data: {
              idUsuario: newUser.idUsuario,
              ocupacion: ocupacion || null,
              direccion: body.direccion || null
            }
          })
          console.log('✓ Apoderado creado')
          
          // Crear relación con estudiante si se especificó
          if (estudianteId && estudianteId.trim() !== '' && parentescoEstudiante) {
            console.log('Creando relación apoderado-estudiante...')
            try {
              await prisma.estudianteApoderado.create({
                data: {
                  idEstudiante: parseInt(estudianteId),
                  idApoderado: newApoderado.idApoderado,
                  relacion: parentescoEstudiante
                }
              })
              console.log('✓ Relación apoderado-estudiante creada')
            } catch (relationError) {
              console.log('⚠️ No se pudo crear la relación con el estudiante:', relationError)
              // No fallar la creación del apoderado por esto
            }
          } else {
            console.log('ℹ️ No se especificó estudiante o es opcional')
          }
          break
      }
    }

    // Obtener el usuario creado con sus roles
    console.log('Obteniendo usuario creado con roles...')
    const userWithRoles = await prisma.usuario.findUnique({
      where: { idUsuario: newUser.idUsuario },
      include: {
        roles: {
          include: {
            rol: true
          }
        },
        ie: true
      }
    })
    console.log('✓ Usuario obtenido:', userWithRoles?.idUsuario)
    console.log('=== USUARIO CREADO EXITOSAMENTE ===')

    return NextResponse.json({
      message: 'Usuario creado exitosamente',
      user: userWithRoles
    })

  } catch (error) {
    console.error('=== ERROR EN CREACIÓN DE USUARIO ===')
    console.error('Error creating user:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    const errorStack = error instanceof Error ? error.stack : 'No stack trace available'
    
    console.error('Stack trace:', errorStack)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user's IE from query params
    const url = new URL(request.url)
    const ieId = url.searchParams.get('ieId')
    
    if (!ieId) {
      return NextResponse.json(
        { error: 'Institution ID is required' },
        { status: 400 }
      )
    }

    const usuarios = await prisma.usuario.findMany({
      where: {
        idIe: parseInt(ieId)
      },
      include: {
        roles: {
          include: {
            rol: true
          }
        },
        ie: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const transformedUsers = usuarios.map(user => ({
      id: user.idUsuario,
      nombre: user.nombre,
      apellido: user.apellido,
      dni: user.dni,
      email: user.email,
      telefono: user.telefono,
      estado: user.estado,
      institucion: user.ie?.nombre || 'N/A',
      roles: user.roles.map(ur => ur.rol.nombre),
      fechaRegistro: user.createdAt
    }))

    return NextResponse.json(transformedUsers)

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
