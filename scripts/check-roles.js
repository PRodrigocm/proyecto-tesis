const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://admin:1234567@localhost:5432/postgres?schema=proyecto-1"
    }
  }
})

async function checkRoles() {
  try {
    console.log('🔍 Checking current roles...')
    const roles = await prisma.rol.findMany({
      orderBy: { nombre: 'asc' }
    })
    
    console.log('📊 Current roles:')
    roles.forEach(role => {
      console.log(`   - ${role.nombre} (ID: ${role.idRol})`)
    })

    console.log('\n🔍 Checking users...')
    const users = await prisma.usuario.findMany({
      include: {
        roles: {
          include: {
            rol: true
          }
        }
      }
    })
    
    console.log('👥 Current users:')
    users.forEach(user => {
      const userRoles = user.roles.map(ur => ur.rol.nombre).join(', ')
      console.log(`   - ID: ${user.idUsuario}, DNI: ${user.dni}, Name: ${user.nombre} ${user.apellido}, Roles: ${userRoles}`)
    })

  } catch (error) {
    console.error('❌ Error checking roles:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkRoles()
