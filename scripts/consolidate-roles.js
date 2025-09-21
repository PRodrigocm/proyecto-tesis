const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://admin:1234567@localhost:5432/postgres?schema=proyecto-1"
    }
  }
})

async function consolidateRoles() {
  console.log('🔄 Consolidating admin and administrativo roles...')

  try {
    await prisma.$transaction(async (tx) => {
      // 1. First, check if user ID=4 exists and delete it
      console.log('🗑️  Checking for user ID=4...')
      const userToDelete = await tx.usuario.findUnique({
        where: { idUsuario: 4 }
      })
      
      if (userToDelete) {
        console.log('🗑️  Deleting user ID=4...')
        // Delete related records first
        await tx.usuarioRol.deleteMany({
          where: { idUsuario: 4 }
        })
        await tx.usuario.delete({
          where: { idUsuario: 4 }
        })
        console.log('✅ User ID=4 deleted')
      } else {
        console.log('ℹ️  User ID=4 does not exist')
      }

      // 2. Find ADMIN and ADMINISTRATIVO roles
      const adminRole = await tx.rol.findUnique({
        where: { nombre: 'ADMIN' }
      })
      
      const administrativoRole = await tx.rol.findUnique({
        where: { nombre: 'ADMINISTRATIVO' }
      })

      if (!adminRole || !administrativoRole) {
        throw new Error('ADMIN or ADMINISTRATIVO role not found')
      }

      // 3. Move all users with ADMINISTRATIVO role to ADMIN role
      console.log('🔄 Moving ADMINISTRATIVO users to ADMIN role...')
      await tx.usuarioRol.updateMany({
        where: { idRol: administrativoRole.idRol },
        data: { idRol: adminRole.idRol }
      })

      // 4. Delete the ADMINISTRATIVO role
      console.log('🗑️  Deleting ADMINISTRATIVO role...')
      await tx.rol.delete({
        where: { idRol: administrativoRole.idRol }
      })

      // 5. Rename ADMIN role to ADMINISTRATIVO
      console.log('📝 Renaming ADMIN role to ADMINISTRATIVO...')
      await tx.rol.update({
        where: { idRol: adminRole.idRol },
        data: { nombre: 'ADMINISTRATIVO' }
      })

      console.log('✅ Role consolidation completed successfully!')
    })

    // 6. Verify the final state
    console.log('🔍 Verifying final roles...')
    const finalRoles = await prisma.rol.findMany({
      orderBy: { nombre: 'asc' }
    })
    
    console.log('📊 Final roles:')
    finalRoles.forEach(role => {
      console.log(`   - ${role.nombre} (ID: ${role.idRol})`)
    })

    if (finalRoles.length === 4) {
      console.log('✅ Successfully consolidated to 4 roles!')
    } else {
      console.log(`⚠️  Warning: Expected 4 roles, but found ${finalRoles.length}`)
    }

  } catch (error) {
    console.error('❌ Error consolidating roles:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

consolidateRoles()
  .then(() => {
    console.log('🎉 Role consolidation completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Failed to consolidate roles:', error)
    process.exit(1)
  })
