import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seedSimple() {
  try {
    console.log('🚀 Iniciando población básica de la base de datos...')

    // 1. Crear roles
    console.log('📋 Creando roles...')
    const roles = ['ADMINISTRATIVO', 'DOCENTE', 'AUXILIAR', 'APODERADO']
    
    for (const nombreRol of roles) {
      await prisma.rol.upsert({
        where: { nombre: nombreRol },
        update: {},
        create: { nombre: nombreRol }
      })
    }
    console.log('✅ Roles creados')

    // 2. Crear modalidad
    console.log('📚 Creando modalidad...')
    const modalidad = await prisma.modalidad.upsert({
      where: { nombre: 'Escolarizada' },
      update: {},
      create: { nombre: 'Escolarizada' }
    })

    // 3. Crear institución educativa (solo campos básicos)
    console.log('🏫 Creando institución educativa...')
    const ie = await prisma.ie.upsert({
      where: { codigoIe: 'IE001' },
      update: {},
      create: {
        codigoIe: 'IE001',
        nombre: 'Institución Educativa San Martín',
        idModalidad: modalidad.idModalidad
      }
    })
    console.log('✅ Institución educativa creada')

    // 4. Crear niveles
    console.log('📚 Creando niveles...')
    let nivelPrimaria = await prisma.nivel.findFirst({
      where: {
        nombre: 'Primaria',
        idIe: ie.idIe
      }
    })

    if (!nivelPrimaria) {
      nivelPrimaria = await prisma.nivel.create({
        data: {
          nombre: 'Primaria',
          idIe: ie.idIe
        }
      })
    }

    let nivelSecundaria = await prisma.nivel.findFirst({
      where: {
        nombre: 'Secundaria',
        idIe: ie.idIe
      }
    })

    if (!nivelSecundaria) {
      nivelSecundaria = await prisma.nivel.create({
        data: {
          nombre: 'Secundaria',
          idIe: ie.idIe
        }
      })
    }

    // 5. Crear algunos grados
    console.log('🎓 Creando grados...')
    const grados = []
    
    // Solo crear 3 grados de primaria y 2 de secundaria para simplificar
    for (let i = 1; i <= 3; i++) {
      let grado = await prisma.grado.findFirst({
        where: {
          nombre: i.toString(),
          idNivel: nivelPrimaria.idNivel
        }
      })
      
      if (!grado) {
        grado = await prisma.grado.create({
          data: {
            nombre: i.toString(),
            idNivel: nivelPrimaria.idNivel
          }
        })
      }
      grados.push(grado)
    }

    for (let i = 1; i <= 2; i++) {
      let grado = await prisma.grado.findFirst({
        where: {
          nombre: i.toString(),
          idNivel: nivelSecundaria.idNivel
        }
      })
      
      if (!grado) {
        grado = await prisma.grado.create({
          data: {
            nombre: i.toString(),
            idNivel: nivelSecundaria.idNivel
          }
        })
      }
      grados.push(grado)
    }

    // 6. Crear secciones
    console.log('📝 Creando secciones...')
    const secciones = []
    const nombresSecciones = ['A', 'B']
    
    for (const nombreSeccion of nombresSecciones) {
      let seccion = await prisma.seccion.findFirst({
        where: { nombre: nombreSeccion }
      })
      
      if (!seccion) {
        seccion = await prisma.seccion.create({
          data: { nombre: nombreSeccion }
        })
      }
      secciones.push(seccion)
    }

    // 7. Crear grado-secciones
    console.log('🔗 Creando grado-secciones...')
    const gradoSecciones = []
    
    for (const grado of grados) {
      for (const seccion of secciones) {
        let gradoSeccion = await prisma.gradoSeccion.findFirst({
          where: {
            idGrado: grado.idGrado,
            idSeccion: seccion.idSeccion
          }
        })
        
        if (!gradoSeccion) {
          gradoSeccion = await prisma.gradoSeccion.create({
            data: {
              idGrado: grado.idGrado,
              idSeccion: seccion.idSeccion
            }
          })
        }
        gradoSecciones.push(gradoSeccion)
      }
    }

    // 8. Crear tipos de asignación
    console.log('👨‍🏫 Creando tipos de asignación...')
    const tiposAsignacion = ['Tutor de Aula', 'Profesor de Materia']

    for (const nombreTipo of tiposAsignacion) {
      const existeTipo = await prisma.tipoAsignacion.findFirst({
        where: { nombre: nombreTipo }
      })
      
      if (!existeTipo) {
        await prisma.tipoAsignacion.create({
          data: { nombre: nombreTipo }
        })
      }
    }

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

    // 10. Crear un docente
    console.log('👨‍🏫 Creando docente...')
    const docenteUser = await prisma.usuario.upsert({
      where: { dni: '87654321' },
      update: {},
      create: {
        nombre: 'María',
        apellido: 'García',
        dni: '87654321',
        email: 'maria.garcia@iesanmartin.edu.pe',
        telefono: '987654322',
        passwordHash: await bcrypt.hash('docente123', 10),
        estado: 'ACTIVO',
        idIe: ie.idIe
      }
    })

    await prisma.docente.upsert({
      where: { idUsuario: docenteUser.idUsuario },
      update: {},
      create: {
        idUsuario: docenteUser.idUsuario,
        especialidad: 'Matemáticas'
      }
    })

    const rolDocente = await prisma.rol.findFirst({ where: { nombre: 'DOCENTE' } })
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

    // 11. Crear un apoderado
    console.log('👨‍👩‍👧‍👦 Creando apoderado...')
    const apoderadoUser = await prisma.usuario.upsert({
      where: { dni: '22334455' },
      update: {},
      create: {
        nombre: 'Juan',
        apellido: 'Pérez',
        dni: '22334455',
        email: 'juan.perez@gmail.com',
        telefono: '987654325',
        passwordHash: await bcrypt.hash('apoderado123', 10),
        estado: 'ACTIVO',
        idIe: ie.idIe
      }
    })

    await prisma.apoderado.upsert({
      where: { idUsuario: apoderadoUser.idUsuario },
      update: {},
      create: {
        idUsuario: apoderadoUser.idUsuario,
        ocupacion: 'Ingeniero'
      }
    })

    const rolApoderado = await prisma.rol.findFirst({ where: { nombre: 'APODERADO' } })
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

    console.log('\n📊 RESUMEN:')
    console.log(`   🏫 Institución: ${ie.nombre}`)
    console.log(`   👤 Usuarios: ${await prisma.usuario.count()}`)
    console.log(`   📋 Roles: ${await prisma.rol.count()}`)
    console.log(`   🎓 Grados: ${await prisma.grado.count()}`)
    console.log(`   📝 Secciones: ${await prisma.seccion.count()}`)

    console.log('\n🎉 ¡Base de datos poblada exitosamente!')
    console.log('\n🔑 CREDENCIALES DE ACCESO:')
    console.log('   👤 Administrativo: admin@iesanmartin.edu.pe / admin123')
    console.log('   👨‍🏫 Docente: maria.garcia@iesanmartin.edu.pe / docente123')
    console.log('   👨‍👩‍👧‍👦 Apoderado: juan.perez@gmail.com / apoderado123')
    console.log('   🛠️ Auxiliar: carmen.flores@iesanmartin.edu.pe / auxiliar123')

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedSimple()
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })
