import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createDocenteUser() {
  try {
    console.log('🔍 Verificando docentes con aulas asignadas...')
    
    // Buscar docentes con aulas asignadas
    const docentesConAulas = await prisma.docente.findMany({
      include: {
        usuario: true,
        docenteAulas: {
          include: {
            gradoSeccion: {
              include: {
                grado: true,
                seccion: true
              }
            },
            tipoAsignacion: true
          }
        }
      },
      where: {
        docenteAulas: {
          some: {}
        }
      }
    })

    console.log('👨‍🏫 Docentes con aulas encontrados:', docentesConAulas.length)

    for (const docente of docentesConAulas) {
      console.log(`\n📋 Docente: ${docente.usuario.nombre} ${docente.usuario.apellido}`)
      console.log(`   📧 Email: ${docente.usuario.email}`)
      console.log(`   🆔 Usuario ID: ${docente.usuario.idUsuario}`)
      console.log(`   👨‍🏫 Docente ID: ${docente.idDocente}`)
      console.log(`   🏫 Aulas asignadas: ${docente.docenteAulas.length}`)
      
      docente.docenteAulas.forEach((da, index) => {
        console.log(`     ${index + 1}. ${da.gradoSeccion.grado.nombre}° ${da.gradoSeccion.seccion.nombre} - ${da.tipoAsignacion.nombre}`)
      })

      // Verificar si tiene rol DOCENTE
      const usuarioRol = await prisma.usuarioRol.findFirst({
        where: {
          idUsuario: docente.usuario.idUsuario,
          rol: {
            nombre: 'DOCENTE'
          }
        },
        include: {
          rol: true
        }
      })

      console.log(`   🎭 Tiene rol DOCENTE: ${usuarioRol ? '✅ Sí' : '❌ No'}`)
    }

    // Crear usuario de prueba para Ana Rodríguez si no tiene credenciales
    const anaDocente = docentesConAulas.find(d => 
      d.usuario.nombre?.toLowerCase().includes('ana') && 
      d.usuario.apellido?.toLowerCase().includes('rodríguez')
    )

    if (anaDocente && !anaDocente.usuario.email) {
      console.log('\n🔧 Creando credenciales para Ana Rodríguez...')
      
      const passwordHash = await bcrypt.hash('123456', 10)
      
      await prisma.usuario.update({
        where: { idUsuario: anaDocente.usuario.idUsuario },
        data: {
          email: 'ana.rodriguez@colegio.com',
          passwordHash: passwordHash
        }
      })

      console.log('✅ Credenciales creadas:')
      console.log('   📧 Email: ana.rodriguez@colegio.com')
      console.log('   🔑 Password: 123456')
    }

    console.log('\n💡 Para probar las aulas:')
    console.log('1. Haz login con uno de los docentes mostrados arriba')
    console.log('2. Ve a /docente/clases')
    console.log('3. Deberías ver las aulas asignadas')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createDocenteUser()
