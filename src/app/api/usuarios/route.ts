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
      nombres,
      apellidos,
      email,
      telefono,
      passwordHash,
      ieId,
      roleIds,
      especialidad,
      ocupacion,
      fechaNacimiento,
      estado,
      grado,
      seccion,
      apoderadoId,
      relacionApoderado
    } = body
    
    console.log('Campos extraídos:', {
      dni, nombres, apellidos, email, telefono, 
      passwordHash: passwordHash ? '[PRESENTE]' : '[AUSENTE]',
      ieId, roleIds, especialidad, ocupacion, fechaNacimiento, estado,
      grado, seccion, apoderadoId, relacionApoderado
    })

    // Validaciones básicas
    if (!nombres || !apellidos || !dni || !passwordHash || !ieId || !roleIds || roleIds.length === 0) {
      console.log('ERROR: Validación básica falló')
      return NextResponse.json(
        { error: 'Nombres, apellidos, DNI, contraseña, institución y roles son obligatorios' },
        { status: 400 }
      )
    }
    console.log('✓ Validaciones básicas pasaron')

    // Validaciones específicas por rol
    console.log('Buscando roles con IDs:', roleIds)
    const roleNames = await prisma.rol.findMany({
      where: { idRol: { in: roleIds.map((id: string) => parseInt(id)) } },
      select: { nombre: true }
    })
    console.log('Roles encontrados:', roleNames)
    
    const selectedRoleNames = roleNames.map(r => r.nombre)
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
      const existingUser = await prisma.usuario.findFirst({
        where: { email }
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'El email ya está registrado' },
          { status: 400 }
        )
      }
    }

    // Verificar si el DNI ya existe
    const existingDni = await prisma.usuario.findFirst({
      where: { dni }
    })

    if (existingDni) {
      return NextResponse.json(
        { error: 'El DNI ya está registrado' },
        { status: 400 }
      )
    }

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
    const roleAssignments = roleIds.map((roleId: string) => ({
      idUsuario: newUser.idUsuario,
      idRol: parseInt(roleId)
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
            qr: qrCode,
            idIe: ieId ? parseInt(ieId) : null,
            fechaNacimiento: fechaNacimiento && fechaNacimiento.trim() !== '' ? new Date(fechaNacimiento) : null,
            grado: grado ? parseInt(grado) : null,
            seccion: seccion || null
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
          await prisma.apoderado.create({
            data: {
              idUsuario: newUser.idUsuario,
              ocupacion: ocupacion || null
            }
          })
          console.log('✓ Apoderado creado')
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
    console.error('Stack trace:', error.stack)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
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
