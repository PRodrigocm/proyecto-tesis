const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function limpiarYEliminarSecundaria() {
  try {
    console.log('🔍 Iniciando limpieza y eliminación del nivel Secundaria...')
    
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
                docenteAulas: {
                  include: {
                    docente: {
                      include: {
                        usuario: true
                      }
                    }
                  }
                },
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

    // 2. Mostrar y limpiar asignaciones de docentes
    console.log('\n🧹 Limpiando asignaciones de docentes...')
    
    for (const grado of nivelSecundaria.grados) {
      for (const gradoSeccion of grado.gradoSecciones) {
        if (gradoSeccion.docenteAulas.length > 0) {
          console.log(`📍 Encontradas ${gradoSeccion.docenteAulas.length} asignaciones en ${grado.nombre}° sección ${gradoSeccion.idSeccion}:`)
          
          for (const docenteAula of gradoSeccion.docenteAulas) {
            const docente = docenteAula.docente
            console.log(`   - Docente: ${docente.usuario.nombre} ${docente.usuario.apellido} (ID: ${docente.idDocente})`)
            
            // Eliminar la asignación
            await prisma.docenteAula.delete({
              where: { idDocenteAula: docenteAula.idDocenteAula }
            })
            console.log(`   ✅ Asignación eliminada (ID: ${docenteAula.idDocenteAula})`)
          }
        }
      }
    }

    // 3. Verificar que no queden dependencias
    const verificacion = await prisma.nivel.findFirst({
      where: { idNivel: nivelSecundaria.idNivel },
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

    let totalDependencias = 0
    for (const grado of verificacion.grados) {
      for (const gradoSeccion of grado.gradoSecciones) {
        totalDependencias += gradoSeccion.estudiantes.length + 
                           gradoSeccion.docenteAulas.length + 
                           gradoSeccion.horariosClase.length + 
                           gradoSeccion.retiros.length
      }
    }

    if (totalDependencias > 0) {
      console.log(`\n⚠️  Aún existen ${totalDependencias} dependencias. No se puede eliminar el nivel.`)
      return
    }

    // 4. Eliminar grados y nivel
    console.log('\n🗑️  Eliminando grados y nivel...')

    await prisma.$transaction(async (tx) => {
      // Primero eliminar las relaciones GradoSeccion
      for (const grado of nivelSecundaria.grados) {
        console.log(`🗑️  Eliminando grado-secciones del grado ${grado.nombre}°`)
        
        await tx.gradoSeccion.deleteMany({
          where: { idGrado: grado.idGrado }
        })
      }

      // Luego eliminar los grados
      for (const grado of nivelSecundaria.grados) {
        console.log(`🗑️  Eliminando grado ${grado.nombre}° (ID: ${grado.idGrado})`)
        
        await tx.grado.delete({
          where: { idGrado: grado.idGrado }
        })
      }

      // Finalmente eliminar el nivel
      console.log(`🗑️  Eliminando nivel ${nivelSecundaria.nombre} (ID: ${nivelSecundaria.idNivel})`)
      await tx.nivel.delete({
        where: { idNivel: nivelSecundaria.idNivel }
      })
    })

    console.log('\n✅ Nivel Secundaria eliminado exitosamente!')
    console.log('📋 Resumen de eliminación:')
    console.log(`   - Nivel eliminado: ${nivelSecundaria.nombre}`)
    console.log(`   - Grados eliminados: ${nivelSecundaria.grados.length}`)
    console.log(`   - Grado-secciones eliminadas: ${nivelSecundaria.grados.reduce((total, g) => total + g.gradoSecciones.length, 0)}`)

  } catch (error) {
    console.error('❌ Error durante la eliminación:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  limpiarYEliminarSecundaria()
}

module.exports = { limpiarYEliminarSecundaria }
