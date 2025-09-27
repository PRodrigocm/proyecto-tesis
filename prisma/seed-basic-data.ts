import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedBasicData() {
  console.log('🌱 Seeding basic data for horarios testing...')

  try {
    // 1. Crear modalidad si no existe
    const modalidad = await prisma.modalidad.upsert({
      where: { nombre: 'EBR' },
      update: {},
      create: {
        nombre: 'EBR'
      }
    })
    console.log('✅ Modalidad creada/encontrada:', modalidad.nombre)

    // 2. Crear IE si no existe
    const ie = await prisma.ie.upsert({
      where: { codigoIe: 'IE001' },
      update: {},
      create: {
        nombre: 'Institución Educativa de Prueba',
        codigoIe: 'IE001',
        idModalidad: modalidad.idModalidad
      }
    })
    console.log('✅ IE creada/encontrada:', ie.nombre)

    // 3. Crear nivel si no existe
    const nivel = await prisma.nivel.upsert({
      where: { 
        uq_nivel_ie_nombre: {
          idIe: ie.idIe,
          nombre: 'Primaria'
        }
      },
      update: {},
      create: {
        idIe: ie.idIe,
        nombre: 'Primaria'
      }
    })
    console.log('✅ Nivel creado/encontrado:', nivel.nombre)

    // 4. Crear grados si no existen
    const grados = []
    for (let i = 1; i <= 6; i++) {
      const grado = await prisma.grado.upsert({
        where: {
          uq_grado_nivel_nombre: {
            idNivel: nivel.idNivel,
            nombre: i.toString()
          }
        },
        update: {},
        create: {
          idNivel: nivel.idNivel,
          nombre: i.toString()
        }
      })
      grados.push(grado)
    }
    console.log('✅ Grados creados/encontrados:', grados.map(g => g.nombre))

    // 5. Crear secciones si no existen
    const secciones = []
    for (const letra of ['A', 'B', 'C']) {
      const seccion = await prisma.seccion.upsert({
        where: { nombre: letra },
        update: {},
        create: {
          nombre: letra
        }
      })
      secciones.push(seccion)
    }
    console.log('✅ Secciones creadas/encontradas:', secciones.map(s => s.nombre))

    // 6. Crear grado-secciones si no existen
    const gradoSecciones = []
    for (const grado of grados) {
      for (const seccion of secciones) {
        const gradoSeccion = await prisma.gradoSeccion.upsert({
          where: {
            uq_grado_seccion: {
              idGrado: grado.idGrado,
              idSeccion: seccion.idSeccion
            }
          },
          update: {},
          create: {
            idGrado: grado.idGrado,
            idSeccion: seccion.idSeccion
          }
        })
        gradoSecciones.push(gradoSeccion)
      }
    }
    console.log('✅ Grado-Secciones creadas/encontradas:', gradoSecciones.length)

    // 7. Crear usuario admin de prueba si no existe
    const adminUser = await prisma.usuario.upsert({
      where: { email: 'admin@test.com' },
      update: {},
      create: {
        nombre: 'Admin',
        apellido: 'Test',
        dni: '12345678',
        email: 'admin@test.com',
        password: '$2b$10$hash_placeholder', // En producción usar bcrypt real
        telefono: '999999999',
        idIe: ie.idIe,
        estado: 'ACTIVO'
      }
    })
    console.log('✅ Usuario admin creado/encontrado:', adminUser.email)

    console.log('\n🎉 Seed completado exitosamente!')
    console.log('📊 Resumen:')
    console.log(`- IE: ${ie.nombre}`)
    console.log(`- Niveles: 1`)
    console.log(`- Grados: ${grados.length}`)
    console.log(`- Secciones: ${secciones.length}`)
    console.log(`- Grado-Secciones: ${gradoSecciones.length}`)
    console.log(`- Usuario admin: ${adminUser.email}`)

  } catch (error) {
    console.error('❌ Error en seed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedBasicData()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
