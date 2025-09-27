import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupTestUsers() {
  console.log('🧹 Iniciando limpieza de usuarios de prueba...')
  
  try {
    const ieId = 1 // Institución Educativa ID

    // Patrones de DNI de usuarios de prueba
    const testDniPatterns = [
      '1000000%', // Administrativos
      '2000000%', // Docentes  
      '3000000%', // Apoderados
      '4000000%', // Auxiliares
      '5000000%'  // Estudiantes
    ]

    console.log('🔍 Buscando usuarios de prueba...')

    // Encontrar todos los usuarios de prueba
    const testUsers = await prisma.usuario.findMany({
      where: {
        AND: [
          { idIe: ieId },
          {
            OR: testDniPatterns.map(pattern => ({
              dni: { startsWith: pattern.replace('%', '') }
            }))
          }
        ]
      },
      include: {
        roles: true,
        estudiante: true,
        apoderado: true,
        docente: true
      }
    })

    console.log(`📋 Encontrados ${testUsers.length} usuarios de prueba`)

    if (testUsers.length === 0) {
      console.log('✅ No hay usuarios de prueba para eliminar')
      return
    }

    // Mostrar usuarios que serán eliminados
    console.log('\n👥 Usuarios que serán eliminados:')
    testUsers.forEach(user => {
      const roles = user.roles.map(ur => ur.idRol).join(', ')
      console.log(`   - ${user.nombre} ${user.apellido} (DNI: ${user.dni}) - Roles: ${roles}`)
    })

    console.log('\n🗑️  Eliminando datos relacionados...')

    // 1. Eliminar relaciones estudiante-apoderado
    console.log('   📚 Eliminando relaciones estudiante-apoderado...')
    const estudiantesIds = testUsers
      .filter(u => u.estudiante)
      .map(u => u.estudiante!.idEstudiante)

    if (estudiantesIds.length > 0) {
      await prisma.estudianteApoderado.deleteMany({
        where: {
          idEstudiante: { in: estudiantesIds }
        }
      })
    }

    // 2. Eliminar asistencias de estudiantes de prueba
    console.log('   📅 Eliminando asistencias...')
    if (estudiantesIds.length > 0) {
      await prisma.asistencia.deleteMany({
        where: {
          idEstudiante: { in: estudiantesIds }
        }
      })
    }

    // 3. Eliminar inscripciones a talleres
    console.log('   🎨 Eliminando inscripciones a talleres...')
    if (estudiantesIds.length > 0) {
      await prisma.inscripcionTaller.deleteMany({
        where: {
          idEstudiante: { in: estudiantesIds }
        }
      })
    }

    // 4. Eliminar retiros y autorizaciones
    console.log('   🚪 Eliminando retiros y autorizaciones...')
    if (estudiantesIds.length > 0) {
      // Eliminar autorizaciones de retiro
      await prisma.autorizacionRetiro.deleteMany({
        where: {
          idEstudiante: { in: estudiantesIds }
        }
      })

      // Eliminar retiros
      await prisma.retiro.deleteMany({
        where: {
          idEstudiante: { in: estudiantesIds }
        }
      })
    }

    // 5. Eliminar asignaciones de docentes
    console.log('   🏫 Eliminando asignaciones de docentes...')
    const docentesIds = testUsers
      .filter(u => u.docente)
      .map(u => u.docente!.idDocente)

    if (docentesIds.length > 0) {
      await prisma.docenteAula.deleteMany({
        where: {
          idDocente: { in: docentesIds }
        }
      })
    }

    // 6. Eliminar perfiles específicos
    console.log('   👤 Eliminando perfiles específicos...')
    
    // Eliminar estudiantes
    if (estudiantesIds.length > 0) {
      await prisma.estudiante.deleteMany({
        where: {
          idEstudiante: { in: estudiantesIds }
        }
      })
    }

    // Eliminar apoderados
    const apoderadosIds = testUsers
      .filter(u => u.apoderado)
      .map(u => u.apoderado!.idApoderado)

    if (apoderadosIds.length > 0) {
      await prisma.apoderado.deleteMany({
        where: {
          idApoderado: { in: apoderadosIds }
        }
      })
    }

    // Eliminar docentes
    if (docentesIds.length > 0) {
      await prisma.docente.deleteMany({
        where: {
          idDocente: { in: docentesIds }
        }
      })
    }

    // 7. Eliminar roles de usuarios
    console.log('   🎭 Eliminando roles de usuarios...')
    const userIds = testUsers.map(u => u.idUsuario)
    
    await prisma.usuarioRol.deleteMany({
      where: {
        idUsuario: { in: userIds }
      }
    })

    // 8. Eliminar usuarios base
    console.log('   👤 Eliminando usuarios base...')
    const deletedUsers = await prisma.usuario.deleteMany({
      where: {
        idUsuario: { in: userIds }
      }
    })

    console.log('\n✅ LIMPIEZA COMPLETADA EXITOSAMENTE!')
    console.log(`🗑️  Usuarios eliminados: ${deletedUsers.count}`)
    console.log('📊 Resumen por tipo:')
    
    const adminCount = testUsers.filter(u => u.dni.startsWith('1000000')).length
    const docenteCount = testUsers.filter(u => u.dni.startsWith('2000000')).length
    const apoderadoCount = testUsers.filter(u => u.dni.startsWith('3000000')).length
    const auxiliarCount = testUsers.filter(u => u.dni.startsWith('4000000')).length
    const estudianteCount = testUsers.filter(u => u.dni.startsWith('5000000')).length

    console.log(`   👨‍💼 Administrativos: ${adminCount}`)
    console.log(`   👨‍🏫 Docentes: ${docenteCount}`)
    console.log(`   👨‍👩‍👧‍👦 Apoderados: ${apoderadoCount}`)
    console.log(`   🔧 Auxiliares: ${auxiliarCount}`)
    console.log(`   🎓 Estudiantes: ${estudianteCount}`)

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Función para confirmar la eliminación
async function confirmCleanup() {
  const readline = require('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise<boolean>((resolve) => {
    rl.question('⚠️  ¿Estás seguro de que quieres eliminar TODOS los usuarios de prueba? (y/N): ', (answer: string) => {
      rl.close()
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
    })
  })
}

// Ejecutar limpieza si se llama directamente
if (require.main === module) {
  confirmCleanup()
    .then(async (confirmed) => {
      if (confirmed) {
        await cleanupTestUsers()
      } else {
        console.log('❌ Operación cancelada por el usuario')
      }
    })
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
}

export default cleanupTestUsers
