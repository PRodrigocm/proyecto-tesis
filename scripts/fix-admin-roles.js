const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://admin:1234567@localhost:5432/postgres?schema=proyecto-1"
    }
  }
})

async function fixAdminRoles() {
  try {
    console.log('🔧 Fixing administrator roles...')

    // Find the ADMINISTRATIVO role
    const adminRole = await prisma.rol.findUnique({
      where: { nombre: 'ADMINISTRATIVO' }
    })

    if (!adminRole) {
      throw new Error('ADMINISTRATIVO role not found')
    }

    // Find user ID 1 (Rodrigo Chavez) who has no roles
    const userWithoutRole = await prisma.usuario.findUnique({
      where: { idUsuario: 1 },
      include: {
        roles: true
      }
    })

    if (userWithoutRole && userWithoutRole.roles.length === 0) {
      console.log(`🔧 Assigning ADMINISTRATIVO role to user: ${userWithoutRole.nombre} ${userWithoutRole.apellido}`)
      
      await prisma.usuarioRol.create({
        data: {
          idUsuario: userWithoutRole.idUsuario,
          idRol: adminRole.idRol
        }
      })
      
      console.log('✅ Role assigned successfully')
    }

    // Also ensure the main admin user (ID 2) has proper institution assignment
    const mainAdmin = await prisma.usuario.findUnique({
      where: { idUsuario: 2 },
      include: {
        roles: {
          include: {
            rol: true
          }
        },
        ie: true
      }
    })

    if (mainAdmin) {
      console.log(`📋 Main admin: ${mainAdmin.nombre} ${mainAdmin.apellido}`)
      console.log(`   - Email: ${mainAdmin.email}`)
      console.log(`   - Institution: ${mainAdmin.ie?.nombre || 'Not assigned'}`)
      console.log(`   - Roles: ${mainAdmin.roles.map(r => r.rol.nombre).join(', ')}`)

      // If no institution assigned, assign the first one
      if (!mainAdmin.idIe) {
        const firstIe = await prisma.ie.findFirst()
        if (firstIe) {
          await prisma.usuario.update({
            where: { idUsuario: mainAdmin.idUsuario },
            data: { idIe: firstIe.idIe }
          })
          console.log(`✅ Assigned institution: ${firstIe.nombre}`)
        }
      }
    }

    // Verify final state
    console.log('\n🔍 Final verification...')
    const allUsers = await prisma.usuario.findMany({
      include: {
        roles: {
          include: {
            rol: true
          }
        },
        ie: true
      }
    })

    console.log('👥 All users with roles:')
    allUsers.forEach(user => {
      const userRoles = user.roles.map(ur => ur.rol.nombre).join(', ')
      console.log(`   - ID: ${user.idUsuario}, Email: ${user.email}, Name: ${user.nombre} ${user.apellido}`)
      console.log(`     Roles: ${userRoles || 'NO ROLES'}`)
      console.log(`     Institution: ${user.ie?.nombre || 'NO INSTITUTION'}`)
    })

  } catch (error) {
    console.error('❌ Error fixing admin roles:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixAdminRoles()
  .then(() => {
    console.log('🎉 Admin roles fixed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Failed to fix admin roles:', error)
    process.exit(1)
  })
