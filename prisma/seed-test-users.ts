import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedTestUsers() {
  console.log('🌱 Iniciando seed de usuarios de prueba...')
  
  try {
    const ieId = 1 // Institución Educativa ID

    // 1. Crear o verificar roles
    console.log('📋 Creando roles...')
    const roles = await Promise.all([
      prisma.rol.upsert({
        where: { nombre: 'ADMINISTRATIVO' },
        update: {},
        create: { nombre: 'ADMINISTRATIVO' }
      }),
      prisma.rol.upsert({
        where: { nombre: 'DOCENTE' },
        update: {},
        create: { nombre: 'DOCENTE' }
      }),
      prisma.rol.upsert({
        where: { nombre: 'APODERADO' },
        update: {},
        create: { nombre: 'APODERADO' }
      }),
      prisma.rol.upsert({
        where: { nombre: 'ESTUDIANTE' },
        update: {},
        create: { nombre: 'ESTUDIANTE' }
      }),
      prisma.rol.upsert({
        where: { nombre: 'AUXILIAR' },
        update: {},
        create: { nombre: 'AUXILIAR' }
      })
    ])

    console.log('✅ Roles creados:', roles.map(r => r.nombre))

    // 2. Crear usuarios ADMINISTRATIVOS
    console.log('👨‍💼 Creando usuarios administrativos...')
    const adminUsers = []
    for (let i = 1; i <= 2; i++) {
      const user = await prisma.usuario.create({
        data: {
          nombre: `Admin${i}`,
          apellido: `Apellido${i}`,
          dni: `1000000${i}`,
          email: `admin${i}@test.com`,
          telefono: `90000000${i}`,
          passwordHash: 'admin123', // En producción usar hash
          estado: 'ACTIVO',
          idIe: ieId
        }
      })

      await prisma.usuarioRol.create({
        data: {
          idUsuario: user.idUsuario,
          idRol: roles.find(r => r.nombre === 'ADMINISTRATIVO')!.idRol
        }
      })

      adminUsers.push(user)
    }

    // 3. Crear usuarios DOCENTES
    console.log('👨‍🏫 Creando usuarios docentes...')
    const docenteUsers = []
    for (let i = 1; i <= 3; i++) {
      const user = await prisma.usuario.create({
        data: {
          nombre: `Docente${i}`,
          apellido: `Profesor${i}`,
          dni: `2000000${i}`,
          email: `docente${i}@test.com`,
          telefono: `91000000${i}`,
          passwordHash: 'docente123',
          estado: 'ACTIVO',
          idIe: ieId
        }
      })

      await prisma.usuarioRol.create({
        data: {
          idUsuario: user.idUsuario,
          idRol: roles.find(r => r.nombre === 'DOCENTE')!.idRol
        }
      })

      // Crear perfil de docente
      await prisma.docente.create({
        data: {
          idUsuario: user.idUsuario,
          codigo: `DOC${String(i).padStart(3, '0')}`,
          especialidad: i === 1 ? 'Matemáticas' : i === 2 ? 'Comunicación' : 'Ciencias'
        }
      })

      docenteUsers.push(user)
    }

    // 4. Crear usuarios APODERADOS
    console.log('👨‍👩‍👧‍👦 Creando usuarios apoderados...')
    const apoderadoUsers = []
    for (let i = 1; i <= 4; i++) {
      const user = await prisma.usuario.create({
        data: {
          nombre: `Apoderado${i}`,
          apellido: `Familia${i}`,
          dni: `3000000${i}`,
          email: `apoderado${i}@test.com`,
          telefono: `92000000${i}`,
          passwordHash: 'apoderado123',
          estado: 'ACTIVO',
          idIe: ieId
        }
      })

      await prisma.usuarioRol.create({
        data: {
          idUsuario: user.idUsuario,
          idRol: roles.find(r => r.nombre === 'APODERADO')!.idRol
        }
      })

      // Crear perfil de apoderado
      await prisma.apoderado.create({
        data: {
          idUsuario: user.idUsuario,
          codigo: `APO${String(i).padStart(3, '0')}`,
          ocupacion: i % 2 === 0 ? 'Ingeniero' : 'Contador',
          direccion: `Av. Test ${i}00, Lima`
        }
      })

      apoderadoUsers.push(user)
    }

    // 5. Crear usuarios AUXILIARES
    console.log('🔧 Creando usuarios auxiliares...')
    const auxiliarUsers = []
    for (let i = 1; i <= 2; i++) {
      const user = await prisma.usuario.create({
        data: {
          nombre: `Auxiliar${i}`,
          apellido: `Apoyo${i}`,
          dni: `4000000${i}`,
          email: `auxiliar${i}@test.com`,
          telefono: `93000000${i}`,
          passwordHash: 'auxiliar123',
          estado: 'ACTIVO',
          idIe: ieId
        }
      })

      await prisma.usuarioRol.create({
        data: {
          idUsuario: user.idUsuario,
          idRol: roles.find(r => r.nombre === 'AUXILIAR')!.idRol
        }
      })

      auxiliarUsers.push(user)
    }

    // 6. Obtener grados y secciones existentes para estudiantes
    console.log('📚 Obteniendo grados y secciones...')
    const gradosSecciones = await prisma.gradoSeccion.findMany({
      where: {
        grado: {
          nivel: {
            idIe: ieId
          }
        }
      },
      include: {
        grado: true,
        seccion: true
      }
    })

    // 7. Crear usuarios ESTUDIANTES
    console.log('🎓 Creando usuarios estudiantes...')
    const estudianteUsers = []
    for (let i = 1; i <= 5; i++) {
      const user = await prisma.usuario.create({
        data: {
          nombre: `Estudiante${i}`,
          apellido: `Alumno${i}`,
          dni: `5000000${i}`,
          passwordHash: 'estudiante123',
          estado: 'ACTIVO',
          idIe: ieId
        }
      })

      await prisma.usuarioRol.create({
        data: {
          idUsuario: user.idUsuario,
          idRol: roles.find(r => r.nombre === 'ESTUDIANTE')!.idRol
        }
      })

      // Crear perfil de estudiante
      const gradoSeccion = gradosSecciones[i % gradosSecciones.length] || gradosSecciones[0]
      
      const estudiante = await prisma.estudiante.create({
        data: {
          idUsuario: user.idUsuario,
          idIe: ieId,
          idGradoSeccion: gradoSeccion?.idGradoSeccion,
          codigo: `EST${String(i).padStart(3, '0')}`,
          fechaNacimiento: new Date(`200${5 + i}-0${(i % 12) + 1}-15`),
          qr: `QR-EST-${user.idUsuario}-${Date.now()}`
        }
      })

      // Asignar apoderados a estudiantes (relación N:N)
      if (apoderadoUsers.length > 0) {
        const apoderadoIndex = (i - 1) % apoderadoUsers.length
        const apoderado = await prisma.apoderado.findFirst({
          where: { idUsuario: apoderadoUsers[apoderadoIndex].idUsuario }
        })

        if (apoderado) {
          await prisma.estudianteApoderado.create({
            data: {
              idEstudiante: estudiante.idEstudiante,
              idApoderado: apoderado.idApoderado,
              relacion: 'PADRE/MADRE'
            }
          })
        }
      }

      estudianteUsers.push(user)
    }

    console.log('\n✅ SEED COMPLETADO EXITOSAMENTE!')
    console.log('📊 Resumen de usuarios creados:')
    console.log(`   👨‍💼 Administrativos: ${adminUsers.length}`)
    console.log(`   👨‍🏫 Docentes: ${docenteUsers.length}`)
    console.log(`   👨‍👩‍👧‍👦 Apoderados: ${apoderadoUsers.length}`)
    console.log(`   🎓 Estudiantes: ${estudianteUsers.length}`)
    console.log(`   🔧 Auxiliares: ${auxiliarUsers.length}`)
    console.log(`   📍 Todos en IE ID: ${ieId}`)

    console.log('\n🔑 Credenciales de prueba:')
    console.log('   Admin: DNI 10000001, Password: admin123')
    console.log('   Docente: DNI 20000001, Password: docente123')
    console.log('   Apoderado: DNI 30000001, Password: apoderado123')
    console.log('   Estudiante: DNI 50000001, Password: estudiante123')
    console.log('   Auxiliar: DNI 40000001, Password: auxiliar123')

  } catch (error) {
    console.error('❌ Error durante el seed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar seed si se llama directamente
if (require.main === module) {
  seedTestUsers()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
}

export default seedTestUsers
