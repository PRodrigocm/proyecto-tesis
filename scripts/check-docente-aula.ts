import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDocenteAula() {
  try {
    console.log('🔍 Verificando datos en tabla DocenteAula...')
    
    // Verificar registros existentes
    const docenteAulas = await prisma.docenteAula.findMany({
      include: {
        docente: {
          include: {
            usuario: true
          }
        },
        gradoSeccion: {
          include: {
            grado: true,
            seccion: true
          }
        },
        tipoAsignacion: true
      }
    })
    
    console.log('📊 Total registros en DocenteAula:', docenteAulas.length)
    
    if (docenteAulas.length === 0) {
      console.log('⚠️ No hay registros en DocenteAula')
      console.log('💡 Creando registros de prueba...')
      
      // Buscar docentes disponibles
      const docentes = await prisma.docente.findMany({
        include: {
          usuario: true
        },
        take: 3
      })
      
      // Buscar grados-secciones disponibles
      const gradosSecciones = await prisma.gradoSeccion.findMany({
        include: {
          grado: true,
          seccion: true
        },
        take: 3
      })
      
      // Buscar tipos de asignación
      const tiposAsignacion = await prisma.tipoAsignacion.findMany()
      let tipoTutor = tiposAsignacion.find(t => t.nombre.toLowerCase().includes('tutor'))
      
      if (!tipoTutor) {
        // Crear tipo de asignación si no existe
        tipoTutor = await prisma.tipoAsignacion.create({
          data: {
            nombre: 'Tutor'
          }
        })
        console.log('✅ Tipo de asignación "Tutor" creado')
      }
      
      console.log(`👨‍🏫 Docentes encontrados: ${docentes.length}`)
      console.log(`🏫 Grados-Secciones encontrados: ${gradosSecciones.length}`)
      
      // Crear asignaciones de prueba
      for (let i = 0; i < Math.min(docentes.length, gradosSecciones.length); i++) {
        const docente = docentes[i]
        const gradoSeccion = gradosSecciones[i]
        
        try {
          const docenteAula = await prisma.docenteAula.create({
            data: {
              idDocente: docente.idDocente,
              idGradoSeccion: gradoSeccion.idGradoSeccion,
              idTipoAsignacion: tipoTutor.idTipoAsignacion
            }
          })
          
          console.log(`✅ Asignación creada: ${docente.usuario.nombre} ${docente.usuario.apellido} → ${gradoSeccion.grado.nombre}° ${gradoSeccion.seccion.nombre}`)
        } catch (error) {
          console.log(`⚠️ Error creando asignación para ${docente.usuario.nombre}:`, error)
        }
      }
    } else {
      console.log('📋 Registros existentes en DocenteAula:')
      docenteAulas.forEach((da, index) => {
        console.log(`${index + 1}. ${da.docente.usuario.nombre} ${da.docente.usuario.apellido} → ${da.gradoSeccion.grado.nombre}° ${da.gradoSeccion.seccion.nombre} (${da.tipoAsignacion.nombre})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDocenteAula()
