const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function eliminarSecundaria() {
  try {
    console.log('🔍 Iniciando eliminación del nivel Secundaria...')
    
    // 1. Buscar el nivel Secundaria
    const nivelSecundaria = await prisma.nivel.findFirst({
      where: {
        nombre: {
          in: ['Secundaria', 'SECUNDARIA', 'secundaria']
        }
      },
      include: {
        grados: {
          include: {
            gradoSecciones: {
              include: {
                estudiantes: true,
                docenteAulas: true,
                horariosClase: true,
                retiros: true
              }
            }
          }
        }
      }
    })

    if (!nivelSecundaria) {
      console.log('❌ No se encontró el nivel Secundaria en la base de datos')
      return
    }

    console.log(`📋 Nivel encontrado: ${nivelSecundaria.nombre} (ID: ${nivelSecundaria.idNivel})`)
    console.log(`📚 Grados asociados: ${nivelSecundaria.grados.length}`)

    // 2. Verificar dependencias
    let totalEstudiantes = 0
    let totalDocentes = 0
    let totalHorarios = 0
    let totalRetiros = 0

    for (const grado of nivelSecundaria.grados) {
      console.log(`   - Grado ${grado.nombre}° (ID: ${grado.idGrado})`)
      
      for (const gradoSeccion of grado.gradoSecciones) {
        totalEstudiantes += gradoSeccion.estudiantes.length
        totalDocentes += gradoSeccion.docenteAulas.length
        totalHorarios += gradoSeccion.horariosClase.length
        totalRetiros += gradoSeccion.retiros.length
        
        console.log(`     - Sección ${gradoSeccion.idSeccion}: ${gradoSeccion.estudiantes.length} estudiantes, ${gradoSeccion.docenteAulas.length} docentes, ${gradoSeccion.horariosClase.length} horarios`)
      }
    }

    console.log(`\n📊 Resumen de dependencias:`)
    console.log(`   - Estudiantes: ${totalEstudiantes}`)
    console.log(`   - Asignaciones de docentes: ${totalDocentes}`)
    console.log(`   - Horarios de clase: ${totalHorarios}`)
    console.log(`   - Retiros: ${totalRetiros}`)

    if (totalEstudiantes > 0 || totalDocentes > 0 || totalHorarios > 0 || totalRetiros > 0) {
      console.log('\n⚠️  ADVERTENCIA: Existen datos relacionados con el nivel Secundaria.')
      console.log('   Para eliminar el nivel, primero debes:')
      if (totalEstudiantes > 0) console.log(`   - Reasignar o eliminar ${totalEstudiantes} estudiantes`)
      if (totalDocentes > 0) console.log(`   - Reasignar o eliminar ${totalDocentes} asignaciones de docentes`)
      if (totalHorarios > 0) console.log(`   - Eliminar ${totalHorarios} horarios de clase`)
      if (totalRetiros > 0) console.log(`   - Gestionar ${totalRetiros} retiros`)
      
      console.log('\n❌ Eliminación cancelada por seguridad.')
      return
    }

    // 3. Si no hay dependencias, proceder con la eliminación
    console.log('\n✅ No se encontraron dependencias. Procediendo con la eliminación...')

    await prisma.$transaction(async (tx) => {
      // Eliminar grados del nivel secundaria
      for (const grado of nivelSecundaria.grados) {
        console.log(`🗑️  Eliminando grado ${grado.nombre}° (ID: ${grado.idGrado})`)
        
        await tx.grado.delete({
          where: { idGrado: grado.idGrado }
        })
      }

      // Eliminar el nivel secundaria
      console.log(`🗑️  Eliminando nivel ${nivelSecundaria.nombre} (ID: ${nivelSecundaria.idNivel})`)
      await tx.nivel.delete({
        where: { idNivel: nivelSecundaria.idNivel }
      })
    })

    console.log('\n✅ Nivel Secundaria y sus grados eliminados exitosamente!')

  } catch (error) {
    console.error('❌ Error durante la eliminación:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  eliminarSecundaria()
}

module.exports = { eliminarSecundaria }
