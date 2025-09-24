import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // 1. Modalidades
  console.log('📚 Creando modalidades...')
  const modalidades = await Promise.all([
    prisma.modalidad.upsert({
      where: { nombre: 'EBR - Educación Básica Regular' },
      update: {},
      create: { nombre: 'EBR - Educación Básica Regular' }
    }),
    prisma.modalidad.upsert({
      where: { nombre: 'EBA - Educación Básica Alternativa' },
      update: {},
      create: { nombre: 'EBA - Educación Básica Alternativa' }
    }),
    prisma.modalidad.upsert({
      where: { nombre: 'EBE - Educación Básica Especial' },
      update: {},
      create: { nombre: 'EBE - Educación Básica Especial' }
    }),
    prisma.modalidad.upsert({
      where: { nombre: 'ETP - Educación Técnico Productiva' },
      update: {},
      create: { nombre: 'ETP - Educación Técnico Productiva' }
    })
  ])

  // 2. Instituciones Educativas
  console.log('🏫 Creando instituciones educativas...')
  const ies = await Promise.all([
    prisma.ie.upsert({
      where: { codigoIe: 'IE001' },
      update: {},
      create: {
        nombre: 'I.E. San José de Nazaret',
        codigoIe: 'IE001',
        idModalidad: modalidades[0].idModalidad
      }
    }),
    prisma.ie.upsert({
      where: { codigoIe: 'IE002' },
      update: {},
      create: {
        nombre: 'I.E. María Auxiliadora',
        codigoIe: 'IE002',
        idModalidad: modalidades[0].idModalidad
      }
    }),
    prisma.ie.upsert({
      where: { codigoIe: 'IE003' },
      update: {},
      create: {
        nombre: 'I.E. José Carlos Mariátegui',
        codigoIe: 'IE003',
        idModalidad: modalidades[0].idModalidad
      }
    })
  ])

  // 3. Niveles
  console.log('📖 Creando niveles educativos...')
  const niveles: any[] = []
  for (const ie of ies) {
    const nivelesIe = await Promise.all([
      prisma.nivel.upsert({
        where: { uq_nivel_ie_nombre: { idIe: ie.idIe, nombre: 'Primaria' } },
        update: {},
        create: { idIe: ie.idIe, nombre: 'Primaria' }
      })
    ])
    niveles.push(...nivelesIe)
  }

  // 4. Grados
  console.log('📝 Creando grados...')
  const grados: any[] = []
  for (const nivel of niveles) {
    let gradosNivel: string[] = []
    
    if (nivel.nombre === 'Primaria') {
      gradosNivel = ['1°', '2°', '3°', '4°', '5°', '6°']
    }

    for (const nombreGrado of gradosNivel) {
      const grado = await prisma.grado.upsert({
        where: { uq_grado_nivel_nombre: { idNivel: nivel.idNivel, nombre: nombreGrado } },
        update: {},
        create: { idNivel: nivel.idNivel, nombre: nombreGrado }
      })
      grados.push(grado)
    }
  }

  // 5. Secciones
  console.log('📋 Creando secciones...')
  const secciones = await Promise.all([
    prisma.seccion.upsert({
      where: { nombre: 'A' },
      update: {},
      create: { nombre: 'A' }
    }),
    prisma.seccion.upsert({
      where: { nombre: 'B' },
      update: {},
      create: { nombre: 'B' }
    }),
    prisma.seccion.upsert({
      where: { nombre: 'C' },
      update: {},
      create: { nombre: 'C' }
    }),
    prisma.seccion.upsert({
      where: { nombre: 'D' },
      update: {},
      create: { nombre: 'D' }
    }),
    prisma.seccion.upsert({
      where: { nombre: 'E' },
      update: {},
      create: { nombre: 'E' }
    })
  ])

  // 6. Grado-Secciones
  console.log('🔗 Creando grado-secciones...')
  const gradoSecciones: any[] = []
  for (const grado of grados) {
    // Para cada grado (1°-6°), crear todas las secciones (A-E)
    for (const seccion of secciones) {
      try {
        const gradoSeccion = await prisma.gradoSeccion.upsert({
          where: { uq_grado_seccion: { idGrado: grado.idGrado, idSeccion: seccion.idSeccion } },
          update: {},
          create: { idGrado: grado.idGrado, idSeccion: seccion.idSeccion }
        })
        gradoSecciones.push(gradoSeccion)
      } catch (error) {
        console.log(`⚠️  Error creando grado-sección ${grado.nombre}-${seccion.nombre}:`, error)
      }
    }
  }

  // 7. Roles
  console.log('👥 Creando roles...')

  // Eliminar rol ADMIN si existiera (ya no se usa)
  await prisma.usuarioRol.deleteMany({ where: { rol: { nombre: 'ADMIN' } } })
  await prisma.rol.deleteMany({ where: { nombre: 'ADMIN' } })

  const roles = await Promise.all([
    prisma.rol.upsert({
      where: { nombre: 'ADMINISTRATIVO' },
      update: {},
      create: { nombre: 'ADMINISTRATIVO' }
    }),
    prisma.rol.upsert({
      where: { nombre: 'DOCENTE' },
      update: {},
      create: { nombre: 'DOCENTE' }
    }),
    prisma.rol.upsert({
      where: { nombre: 'APODERADO' },
      update: {},
      create: { nombre: 'APODERADO' }
    }),
    prisma.rol.upsert({
      where: { nombre: 'ESTUDIANTE' },
      update: {},
      create: { nombre: 'ESTUDIANTE' }
    }),
    prisma.rol.upsert({
      where: { nombre: 'AUXILIAR' },
      update: {},
      create: { nombre: 'AUXILIAR' }
    })
  ])

  // 8. Estados de Asistencia
  console.log('✅ Creando estados de asistencia...')
  const estadosAsistencia = await Promise.all([
    prisma.estadoAsistencia.upsert({
      where: { nombreEstado: 'PRESENTE' },
      update: {},
      create: { nombreEstado: 'PRESENTE' }
    }),
    prisma.estadoAsistencia.upsert({
      where: { nombreEstado: 'AUSENTE' },
      update: {},
      create: { nombreEstado: 'AUSENTE' }
    }),
    prisma.estadoAsistencia.upsert({
      where: { nombreEstado: 'TARDANZA' },
      update: {},
      create: { nombreEstado: 'TARDANZA' }
    }),
    prisma.estadoAsistencia.upsert({
      where: { nombreEstado: 'JUSTIFICADO' },
      update: {},
      create: { nombreEstado: 'JUSTIFICADO' }
    }),
    prisma.estadoAsistencia.upsert({
      where: { nombreEstado: 'RETIRADO' },
      update: {},
      create: { nombreEstado: 'RETIRADO' }
    })
  ])

  // 9. Tipos de Retiro
  console.log('🚪 Creando tipos de retiro...')
  const tiposRetiro = await Promise.all([
    prisma.tipoRetiro.upsert({
      where: { nombre: 'MEDICO' },
      update: {},
      create: { nombre: 'MEDICO' }
    }),
    prisma.tipoRetiro.upsert({
      where: { nombre: 'FAMILIAR' },
      update: {},
      create: { nombre: 'FAMILIAR' }
    }),
    prisma.tipoRetiro.upsert({
      where: { nombre: 'PERSONAL' },
      update: {},
      create: { nombre: 'PERSONAL' }
    }),
    prisma.tipoRetiro.upsert({
      where: { nombre: 'EMERGENCIA' },
      update: {},
      create: { nombre: 'EMERGENCIA' }
    }),
    prisma.tipoRetiro.upsert({
      where: { nombre: 'DISCIPLINARIO' },
      update: {},
      create: { nombre: 'DISCIPLINARIO' }
    }),
    prisma.tipoRetiro.upsert({
      where: { nombre: 'OTROS' },
      update: {},
      create: { nombre: 'OTROS' }
    })
  ])

  // 10. Estados de Retiro
  console.log('📊 Creando estados de retiro...')
  const estadosRetiro = await Promise.all([
    prisma.estadoRetiro.upsert({
      where: { codigo: 'PENDIENTE' },
      update: {},
      create: { 
        codigo: 'PENDIENTE', 
        nombre: 'Pendiente de autorización', 
        orden: 1, 
        esFinal: false 
      }
    }),
    prisma.estadoRetiro.upsert({
      where: { codigo: 'CONTACTANDO' },
      update: {},
      create: { 
        codigo: 'CONTACTANDO', 
        nombre: 'Contactando apoderado', 
        orden: 2, 
        esFinal: false 
      }
    }),
    prisma.estadoRetiro.upsert({
      where: { codigo: 'AUTORIZADO' },
      update: {},
      create: { 
        codigo: 'AUTORIZADO', 
        nombre: 'Autorizado por apoderado', 
        orden: 3, 
        esFinal: false 
      }
    }),
    prisma.estadoRetiro.upsert({
      where: { codigo: 'EN_PROCESO' },
      update: {},
      create: { 
        codigo: 'EN_PROCESO', 
        nombre: 'En proceso de retiro', 
        orden: 4, 
        esFinal: false 
      }
    }),
    prisma.estadoRetiro.upsert({
      where: { codigo: 'COMPLETADO' },
      update: {},
      create: { 
        codigo: 'COMPLETADO', 
        nombre: 'Retiro completado', 
        orden: 5, 
        esFinal: true 
      }
    }),
    prisma.estadoRetiro.upsert({
      where: { codigo: 'RECHAZADO' },
      update: {},
      create: { 
        codigo: 'RECHAZADO', 
        nombre: 'Retiro rechazado', 
        orden: 6, 
        esFinal: true 
      }
    }),
    prisma.estadoRetiro.upsert({
      where: { codigo: 'CANCELADO' },
      update: {},
      create: { 
        codigo: 'CANCELADO', 
        nombre: 'Retiro cancelado', 
        orden: 7, 
        esFinal: true 
      }
    })
  ])

  // 11. Tipos de Asignación (para docentes)
  console.log('📚 Creando tipos de asignación...')
  const tiposAsignacion = await Promise.all([
    prisma.tipoAsignacion.upsert({
      where: { nombre: 'TUTOR' },
      update: {},
      create: { nombre: 'TUTOR' }
    }),
    prisma.tipoAsignacion.upsert({
      where: { nombre: 'AUXILIAR' },
      update: {},
      create: { nombre: 'AUXILIAR' }
    }),
    prisma.tipoAsignacion.upsert({
      where: { nombre: 'COORDINADOR' },
      update: {},
      create: { nombre: 'COORDINADOR' }
    }),
    prisma.tipoAsignacion.upsert({
      where: { nombre: 'DOCENTE_AREA' },
      update: {},
      create: { nombre: 'DOCENTE_AREA' }
    })
  ])

  // 12. Consecutivos para códigos automáticos
  console.log('🔢 Creando consecutivos...')
  for (const ie of ies) {
    await Promise.all([
      prisma.consecutivo.upsert({
        where: { tabla_idIe: { tabla: 'estudiante', idIe: ie.idIe } },
        update: {},
        create: { 
          tabla: 'estudiante', 
          idIe: ie.idIe, 
          ultimoNum: 0, 
          ancho: 4, 
          prefijoFijo: 'EST' 
        }
      }),
      prisma.consecutivo.upsert({
        where: { tabla_idIe: { tabla: 'apoderado', idIe: ie.idIe } },
        update: {},
        create: { 
          tabla: 'apoderado', 
          idIe: ie.idIe, 
          ultimoNum: 0, 
          ancho: 4, 
          prefijoFijo: 'APO' 
        }
      }),
      prisma.consecutivo.upsert({
        where: { tabla_idIe: { tabla: 'docente', idIe: ie.idIe } },
        update: {},
        create: { 
          tabla: 'docente', 
          idIe: ie.idIe, 
          ultimoNum: 0, 
          ancho: 3, 
          prefijoFijo: 'DOC' 
        }
      }),
      prisma.consecutivo.upsert({
        where: { tabla_idIe: { tabla: 'taller', idIe: ie.idIe } },
        update: {},
        create: { 
          tabla: 'taller', 
          idIe: ie.idIe, 
          ultimoNum: 0, 
          ancho: 3, 
          prefijoFijo: 'TAL' 
        }
      })
    ])
  }

  // Ya se crearon los consecutivos anteriormente, no duplicar

  // 13. Usuario Administrador
  console.log('👤 Creando usuario administrador...')
  const bcrypt = require('bcrypt')
  const passwordHash = await bcrypt.hash('admin123', 10)
  
  const adminUser = await prisma.usuario.upsert({
    where: { dni: '12345678' },
    update: {},
    create: {
      dni: '12345678',
      nombre: 'Administrador',
      apellido: 'Sistema',
      email: 'admin@sistema.com',
      telefono: '999999999',
      passwordHash: passwordHash,
      estado: 'ACTIVO'
    }
  })

  // Asignar rol ADMIN al usuario
  const adminRole = roles.find((rol: any) => rol.nombre === 'ADMINISTRATIVO')
  if (adminRole) {
    await prisma.usuarioRol.upsert({
      where: { 
        idUsuario_idRol: { 
          idUsuario: adminUser.idUsuario, 
          idRol: adminRole.idRol 
        } 
      },
      update: {},
      create: {
        idUsuario: adminUser.idUsuario,
        idRol: adminRole.idRol
      }
    })
  }

  console.log('✅ Seed completado exitosamente!')
  console.log('📊 Resumen:')
  console.log(`   - ${modalidades.length} modalidades`)
  console.log(`   - ${ies.length} instituciones educativas`)
  console.log(`   - ${niveles.length} niveles`)
  console.log(`   - ${grados.length} grados`)
  console.log(`   - ${secciones.length} secciones`)
  console.log(`   - ${gradoSecciones.length} grado-secciones`)
  console.log(`   - ${roles.length} roles`)
  console.log(`   - ${estadosAsistencia.length} estados de asistencia`)
  console.log(`   - ${tiposRetiro.length} tipos de retiro`)
  console.log(`   - ${estadosRetiro.length} estados de retiro`)
  console.log(`   - ${tiposAsignacion.length} tipos de asignación`)
  console.log(`   - 1 usuario administrador creado`)
  console.log('👤 Credenciales del admin:')
  console.log('   - Email: admin@sistema.com')
  console.log('   - Contraseña: admin123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error durante el seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
