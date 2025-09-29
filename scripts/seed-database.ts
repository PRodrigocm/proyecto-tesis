import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seedDatabase() {
  try {
    console.log('🚀 Iniciando población de la base de datos...')

    // 1. Crear roles si no existen
    console.log('📋 Creando roles...')
    const roles = ['ADMINISTRATIVO', 'DOCENTE', 'ESTUDIANTE', 'APODERADO', 'AUXILIAR']
    
    for (const nombreRol of roles) {
      await prisma.rol.upsert({
        where: { nombre: nombreRol },
        update: {},
        create: { nombre: nombreRol }
      })
    }
    console.log('✅ Roles creados')

    // 2. Crear modalidad primero
    console.log('📚 Creando modalidad educativa...')
    const modalidad = await prisma.modalidad.upsert({
      where: { nombre: 'Escolarizada' },
      update: {},
      create: { nombre: 'Escolarizada' }
    })

    // 3. Crear institución educativa
    console.log('🏫 Creando institución educativa...')
    const ie = await prisma.ie.upsert({
      where: { codigoIe: 'IE001' },
      update: {},
      create: {
        codigoIe: 'IE001',
        nombre: 'Institución Educativa San Martín',
        telefono: '01-234-5678',
        email: 'contacto@iesanmartin.edu.pe',
        idModalidad: modalidad.idModalidad
      }
    })
    console.log('✅ Institución educativa creada')

    // 4. Crear niveles
    console.log('📚 Creando niveles educativos...')
    const nivelPrimaria = await prisma.nivel.create({
      data: {
        nombre: 'Primaria',
        idIe: ie.idIe
      }
    })

    const nivelSecundaria = await prisma.nivel.create({
      data: {
        nombre: 'Secundaria',
        idIe: ie.idIe
      }
    })
    console.log('✅ Niveles educativos creados')

    // 5. Crear grados
    console.log('🎓 Creando grados...')
    const grados = []
    
    // Grados de primaria (1° a 6°)
    for (let i = 1; i <= 6; i++) {
      const grado = await prisma.grado.create({
        data: {
          nombre: i.toString(),
          idNivel: nivelPrimaria.idNivel
        }
      })
      grados.push(grado)
    }

    // Grados de secundaria (1° a 5°)
    for (let i = 1; i <= 5; i++) {
      const grado = await prisma.grado.create({
        data: {
          nombre: i.toString(),
          idNivel: nivelSecundaria.idNivel
        }
      })
      grados.push(grado)
    }
    console.log('✅ Grados creados')

    // 6. Crear secciones
    console.log('📝 Creando secciones...')
    const secciones = []
    const nombresSecciones = ['A', 'B', 'C']
    
    for (const nombreSeccion of nombresSecciones) {
      const seccion = await prisma.seccion.create({
        data: { nombre: nombreSeccion }
      })
      secciones.push(seccion)
    }
    console.log('✅ Secciones creadas')

    // 7. Crear grado-secciones
    console.log('🔗 Creando relaciones grado-sección...')
    const gradoSecciones = []
    
    for (const grado of grados) {
      for (const seccion of secciones) {
        const gradoSeccion = await prisma.gradoSeccion.create({
          data: {
            idGrado: grado.idGrado,
            idSeccion: seccion.idSeccion
          }
        })
        gradoSecciones.push(gradoSeccion)
      }
    }
    console.log('✅ Relaciones grado-sección creadas')

    // 8. Crear tipos de asignación
    console.log('👨‍🏫 Creando tipos de asignación...')
    const tiposAsignacion = [
      'Tutor de Aula',
      'Profesor de Materia',
      'Coordinador Académico',
      'Auxiliar de Educación'
    ]

    for (const nombreTipo of tiposAsignacion) {
      await prisma.tipoAsignacion.create({
        data: { nombre: nombreTipo }
      })
    }
    console.log('✅ Tipos de asignación creados')

    // 9. Crear usuario administrativo
    console.log('👤 Creando usuario administrativo...')
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const adminUser = await prisma.usuario.upsert({
      where: { dni: '12345678' },
      update: {},
      create: {
        nombre: 'Administrador',
        apellido: 'Sistema',
        dni: '12345678',
        email: 'admin@iesanmartin.edu.pe',
        telefono: '987654321',
        passwordHash: hashedPassword,
        estado: 'ACTIVO',
        idIe: ie.idIe
      }
    })

    // Asignar rol administrativo
    const rolAdministrativo = await prisma.rol.findFirst({ where: { nombre: 'ADMINISTRATIVO' } })
    if (rolAdministrativo) {
      await prisma.usuarioRol.upsert({
        where: { 
          idUsuario_idRol: { 
            idUsuario: adminUser.idUsuario, 
            idRol: rolAdministrativo.idRol 
          } 
        },
        update: {},
        create: {
          idUsuario: adminUser.idUsuario,
          idRol: rolAdministrativo.idRol
        }
      })
    }
    console.log('✅ Usuario administrativo creado')

    // 9. Crear algunos docentes
    console.log('👨‍🏫 Creando docentes...')
    const docentes = [
      {
        nombre: 'María',
        apellido: 'García',
        dni: '87654321',
        email: 'maria.garcia@iesanmartin.edu.pe',
        telefono: '987654322',
        especialidad: 'Matemáticas'
      },
      {
        nombre: 'Carlos',
        apellido: 'López',
        dni: '11223344',
        email: 'carlos.lopez@iesanmartin.edu.pe',
        telefono: '987654323',
        especialidad: 'Comunicación'
      },
      {
        nombre: 'Ana',
        apellido: 'Rodríguez',
        dni: '55667788',
        email: 'ana.rodriguez@iesanmartin.edu.pe',
        telefono: '987654324',
        especialidad: 'Ciencias'
      }
    ]

    const rolDocente = await prisma.rol.findFirst({ where: { nombre: 'DOCENTE' } })
    
    for (const docenteData of docentes) {
      const docenteUser = await prisma.usuario.upsert({
        where: { dni: docenteData.dni },
        update: {},
        create: {
          nombre: docenteData.nombre,
          apellido: docenteData.apellido,
          dni: docenteData.dni,
          email: docenteData.email,
          telefono: docenteData.telefono,
          passwordHash: await bcrypt.hash('docente123', 10),
          estado: 'ACTIVO',
          idIe: ie.idIe
        }
      })

      // Crear registro de docente
      await prisma.docente.upsert({
        where: { idUsuario: docenteUser.idUsuario },
        update: {},
        create: {
          idUsuario: docenteUser.idUsuario,
          especialidad: docenteData.especialidad
        }
      })

      // Asignar rol docente
      if (rolDocente) {
        await prisma.usuarioRol.upsert({
          where: { 
            idUsuario_idRol: { 
              idUsuario: docenteUser.idUsuario, 
              idRol: rolDocente.idRol 
            } 
          },
          update: {},
          create: {
            idUsuario: docenteUser.idUsuario,
            idRol: rolDocente.idRol
          }
        })
      }
    }
    console.log('✅ Docentes creados')

    // 10. Crear algunos apoderados
    console.log('👨‍👩‍👧‍👦 Creando apoderados...')
    const apoderados = [
      {
        nombre: 'Juan',
        apellido: 'Pérez',
        dni: '22334455',
        email: 'juan.perez@gmail.com',
        telefono: '987654325',
        ocupacion: 'Ingeniero'
      },
      {
        nombre: 'Rosa',
        apellido: 'Martínez',
        dni: '33445566',
        email: 'rosa.martinez@gmail.com',
        telefono: '987654326',
        ocupacion: 'Profesora'
      },
      {
        nombre: 'Pedro',
        apellido: 'Sánchez',
        dni: '44556677',
        email: 'pedro.sanchez@gmail.com',
        telefono: '987654327',
        ocupacion: 'Comerciante'
      }
    ]

    const rolApoderado = await prisma.rol.findFirst({ where: { nombre: 'APODERADO' } })
    
    for (const apoderadoData of apoderados) {
      const apoderadoUser = await prisma.usuario.upsert({
        where: { dni: apoderadoData.dni },
        update: {},
        create: {
          nombre: apoderadoData.nombre,
          apellido: apoderadoData.apellido,
          dni: apoderadoData.dni,
          email: apoderadoData.email,
          telefono: apoderadoData.telefono,
          passwordHash: await bcrypt.hash('apoderado123', 10),
          estado: 'ACTIVO',
          idIe: ie.idIe
        }
      })

      // Crear registro de apoderado
      await prisma.apoderado.upsert({
        where: { idUsuario: apoderadoUser.idUsuario },
        update: {},
        create: {
          idUsuario: apoderadoUser.idUsuario,
          ocupacion: apoderadoData.ocupacion
        }
      })

      // Asignar rol apoderado
      if (rolApoderado) {
        await prisma.usuarioRol.upsert({
          where: { 
            idUsuario_idRol: { 
              idUsuario: apoderadoUser.idUsuario, 
              idRol: rolApoderado.idRol 
            } 
          },
          update: {},
          create: {
            idUsuario: apoderadoUser.idUsuario,
            idRol: rolApoderado.idRol
          }
        })
      }
    }
    console.log('✅ Apoderados creados')

    // 11. Crear algunos estudiantes
    console.log('👦👧 Creando estudiantes...')
    const estudiantes = [
      {
        nombre: 'Luis',
        apellido: 'Pérez',
        dni: '99887766',
        fechaNacimiento: '2010-05-15',
        gradoSeccionIndex: 0 // 1° A Primaria
      },
      {
        nombre: 'María',
        apellido: 'Martínez',
        dni: '88776655',
        fechaNacimiento: '2009-08-22',
        gradoSeccionIndex: 3 // 2° A Primaria
      },
      {
        nombre: 'Carlos',
        apellido: 'Sánchez',
        dni: '77665544',
        fechaNacimiento: '2008-12-10',
        gradoSeccionIndex: 6 // 3° A Primaria
      }
    ]

    const rolEstudiante = await prisma.rol.findFirst({ where: { nombre: 'ESTUDIANTE' } })
    
    for (let i = 0; i < estudiantes.length; i++) {
      const estudianteData = estudiantes[i]
      
      const estudianteUser = await prisma.usuario.upsert({
        where: { dni: estudianteData.dni },
        update: {},
        create: {
          nombre: estudianteData.nombre,
          apellido: estudianteData.apellido,
          dni: estudianteData.dni,
          passwordHash: null, // Los estudiantes no necesitan contraseña
          estado: 'ACTIVO',
          idIe: ie.idIe
        }
      })

      // Generar código único
      const codigoEstudiante = `EST${String(estudianteUser.idUsuario).padStart(4, '0')}`

      // Crear registro de estudiante
      const estudiante = await prisma.estudiante.upsert({
        where: { idUsuario: estudianteUser.idUsuario },
        update: {},
        create: {
          idUsuario: estudianteUser.idUsuario,
          idIe: ie.idIe,
          idGradoSeccion: gradoSecciones[estudianteData.gradoSeccionIndex].idGradoSeccion,
          codigo: codigoEstudiante,
          fechaNacimiento: new Date(estudianteData.fechaNacimiento),
          qr: `EST-${estudianteUser.idUsuario}-${Date.now()}`
        }
      })

      // Asignar rol estudiante
      if (rolEstudiante) {
        await prisma.usuarioRol.upsert({
          where: { 
            idUsuario_idRol: { 
              idUsuario: estudianteUser.idUsuario, 
              idRol: rolEstudiante.idRol 
            } 
          },
          update: {},
          create: {
            idUsuario: estudianteUser.idUsuario,
            idRol: rolEstudiante.idRol
          }
        })
      }

      // Crear relación con apoderado (usar el apoderado correspondiente)
      const apoderadoUsuario = await prisma.usuario.findFirst({
        where: { dni: apoderados[i].dni }
      })
      
      if (apoderadoUsuario) {
        const apoderado = await prisma.apoderado.findFirst({
          where: { idUsuario: apoderadoUsuario.idUsuario }
        })
        
        if (apoderado) {
          await prisma.estudianteApoderado.upsert({
            where: {
              idEstudiante_idApoderado: {
                idEstudiante: estudiante.idEstudiante,
                idApoderado: apoderado.idApoderado
              }
            },
            update: {},
            create: {
              idEstudiante: estudiante.idEstudiante,
              idApoderado: apoderado.idApoderado,
              relacion: i === 0 ? 'PADRE' : i === 1 ? 'MADRE' : 'TUTOR',
              esTitular: true,
              puedeRetirar: true
            }
          })
        }
      }
    }
    console.log('✅ Estudiantes creados')

    // 12. Crear auxiliar
    console.log('🛠️ Creando auxiliar...')
    const auxiliarUser = await prisma.usuario.upsert({
      where: { dni: '66554433' },
      update: {},
      create: {
        nombre: 'Carmen',
        apellido: 'Flores',
        dni: '66554433',
        email: 'carmen.flores@iesanmartin.edu.pe',
        telefono: '987654328',
        passwordHash: await bcrypt.hash('auxiliar123', 10),
        estado: 'ACTIVO',
        idIe: ie.idIe
      }
    })

    const rolAuxiliar = await prisma.rol.findFirst({ where: { nombre: 'AUXILIAR' } })
    if (rolAuxiliar) {
      await prisma.usuarioRol.upsert({
        where: { 
          idUsuario_idRol: { 
            idUsuario: auxiliarUser.idUsuario, 
            idRol: rolAuxiliar.idRol 
          } 
        },
        update: {},
        create: {
          idUsuario: auxiliarUser.idUsuario,
          idRol: rolAuxiliar.idRol
        }
      })
    }
    console.log('✅ Auxiliar creado')

    // Resumen final
    console.log('\n📊 RESUMEN DE DATOS CREADOS:')
    console.log(`   🏫 Institución: ${ie.nombre}`)
    console.log(`   📚 Niveles: ${await prisma.nivel.count()}`)
    console.log(`   🎓 Grados: ${await prisma.grado.count()}`)
    console.log(`   📝 Secciones: ${await prisma.seccion.count()}`)
    console.log(`   🔗 Grado-Secciones: ${await prisma.gradoSeccion.count()}`)
    console.log(`   👤 Usuarios: ${await prisma.usuario.count()}`)
    console.log(`   👨‍🏫 Docentes: ${await prisma.docente.count()}`)
    console.log(`   👨‍👩‍👧‍👦 Apoderados: ${await prisma.apoderado.count()}`)
    console.log(`   👦👧 Estudiantes: ${await prisma.estudiante.count()}`)
    console.log(`   📋 Roles: ${await prisma.rol.count()}`)

    console.log('\n🎉 ¡Base de datos poblada exitosamente!')
    console.log('\n🔑 CREDENCIALES DE ACCESO:')
    console.log('   👤 Administrativo: Email admin@iesanmartin.edu.pe, Password: admin123')
    console.log('   👨‍🏫 Docentes: Email correspondiente, Password: docente123')
    console.log('   👨‍👩‍👧‍👦 Apoderados: Email correspondiente, Password: apoderado123')
    console.log('   🛠️ Auxiliar: Email carmen.flores@iesanmartin.edu.pe, Password: auxiliar123')

  } catch (error) {
    console.error('❌ Error poblando la base de datos:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedDatabase()
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })
