const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function hashAllPasswords() {
  try {
    console.log('🔐 Iniciando proceso de hasheo de contraseñas...\n')

    // Obtener todos los usuarios
    const usuarios = await prisma.usuario.findMany({
      select: {
        idUsuario: true,
        dni: true,
        nombre: true,
        apellido: true,
        email: true,
        passwordHash: true
      }
    })

    console.log(`📊 Total de usuarios encontrados: ${usuarios.length}\n`)

    let hasheados = 0
    let yaHasheados = 0
    let errores = 0

    for (const usuario of usuarios) {
      try {
        // Verificar si la contraseña ya está hasheada
        // Los hashes de bcrypt siempre empiezan con $2a$, $2b$ o $2y$
        const isAlreadyHashed = usuario.passwordHash?.startsWith('$2a$') || 
                                usuario.passwordHash?.startsWith('$2b$') || 
                                usuario.passwordHash?.startsWith('$2y$')

        if (isAlreadyHashed) {
          console.log(`✅ ${usuario.nombre} ${usuario.apellido} (${usuario.email}) - Ya hasheada`)
          yaHasheados++
          continue
        }

        // Si la contraseña está en texto plano, hashearla
        if (usuario.passwordHash) {
          console.log(`🔄 Hasheando contraseña de: ${usuario.nombre} ${usuario.apellido} (${usuario.email})`)
          console.log(`   Contraseña original: ${usuario.passwordHash}`)
          
          const hashedPassword = await bcrypt.hash(usuario.passwordHash, 10)
          
          await prisma.usuario.update({
            where: { idUsuario: usuario.idUsuario },
            data: { passwordHash: hashedPassword }
          })
          
          console.log(`   ✅ Contraseña hasheada: ${hashedPassword.substring(0, 20)}...`)
          hasheados++
        } else {
          console.log(`⚠️  ${usuario.nombre} ${usuario.apellido} (${usuario.email}) - Sin contraseña`)
        }
      } catch (error) {
        console.error(`❌ Error hasheando contraseña de ${usuario.nombre} ${usuario.apellido}:`, error.message)
        errores++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 RESUMEN DEL PROCESO')
    console.log('='.repeat(60))
    console.log(`Total de usuarios:           ${usuarios.length}`)
    console.log(`Contraseñas hasheadas:       ${hasheados}`)
    console.log(`Ya estaban hasheadas:        ${yaHasheados}`)
    console.log(`Errores:                     ${errores}`)
    console.log('='.repeat(60))
    console.log('\n✅ Proceso completado exitosamente\n')

  } catch (error) {
    console.error('❌ Error en el proceso de hasheo:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar el script
hashAllPasswords()
  .then(() => {
    console.log('🎉 Script finalizado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })
