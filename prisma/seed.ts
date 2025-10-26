import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // 1. ROLES
  console.log('👤 Creando Roles...')
  const roles = [
    'ADMINISTRATIVO',
    'DOCENTE',
    'APODERADO',
    'AUXILIAR',

  ]

  for (const nombreRol of roles) {
    await prisma.rol.upsert({
      where: { nombre: nombreRol },
      update: {},
      create: { nombre: nombreRol }
    })
  }
  console.log('✅ Roles creados')

  // 2. MODALIDAD
  console.log('📚 Creando Modalidades...')
  const modalidades = [
    'Educación Básica Regular',
    'Educación Básica Especial',
    'Educación Básica Alternativa'
  ]

  for (const nombreModalidad of modalidades) {
    await prisma.modalidad.upsert({
      where: { nombre: nombreModalidad },
      update: {},
      create: { nombre: nombreModalidad }
    })
  }
  console.log('✅ Modalidades creadas')

  // 3. INSTITUCIÓN EDUCATIVA
  console.log('🏫 Creando Institución Educativa...')
  const modalidadEBR = await prisma.modalidad.findFirst({
    where: { nombre: 'Educación Básica Regular' }
  })

  const ie = await prisma.ie.upsert({
    where: { codigoIe: 'IEPM001' },
    update: {},
    create: {
      nombre: 'I.E.P.M FRANCISCO BOLOGNESI',
      codigoIe: 'IEPM001',
      idModalidad: modalidadEBR!.idModalidad,
      direccion: 'Dirección de ejemplo',
      email: 'contacto@franciscobolognesi.edu.pe',
      telefono: '999999999'
    }
  })
  console.log('✅ Institución Educativa creada')

  // 4. NIVEL
  console.log('📖 Creando Nivel...')
  const nivel = await prisma.nivel.upsert({
    where: { 
      uq_nivel_ie_nombre: {
        idIe: ie.idIe,
        nombre: 'Primaria'
      }
    },
    update: {},
    create: {
      nombre: 'Primaria',
      idIe: ie.idIe
    }
  })
  console.log('✅ Nivel creado')

  // 5. GRADOS
  console.log('📝 Creando Grados...')
  const grados = ['1°', '2°', '3°', '4°', '5°', '6°']
  const gradosCreados = []

  for (const nombreGrado of grados) {
    const grado = await prisma.grado.upsert({
      where: {
        uq_grado_nivel_nombre: {
          idNivel: nivel.idNivel,
          nombre: nombreGrado
        }
      },
      update: {},
      create: {
        nombre: nombreGrado,
        idNivel: nivel.idNivel
      }
    })
    gradosCreados.push(grado)
  }
  console.log('✅ Grados creados')

  // 6. SECCIONES
  console.log('📋 Creando Secciones...')
  const secciones = ['A', 'B', 'C']
  const seccionesCreadas = []

  for (const nombreSeccion of secciones) {
    const seccion = await prisma.seccion.upsert({
      where: { nombre: nombreSeccion },
      update: {},
      create: { nombre: nombreSeccion }
    })
    seccionesCreadas.push(seccion)
  }
  console.log('✅ Secciones creadas')

  // 7. GRADO-SECCIÓN (1° a 6° con A, B, C)
  console.log('🔗 Creando relaciones Grado-Sección...')
  const gradosConSecciones = gradosCreados // Todos los grados (1° a 6°)

  for (const grado of gradosConSecciones) {
    for (const seccion of seccionesCreadas) {
      await prisma.gradoSeccion.upsert({
        where: {
          uq_grado_seccion: {
            idGrado: grado.idGrado,
            idSeccion: seccion.idSeccion
          }
        },
        update: {},
        create: {
          idGrado: grado.idGrado,
          idSeccion: seccion.idSeccion
        }
      })
    }
  }
  console.log('✅ Relaciones Grado-Sección creadas')

  // 8. TIPOS DE ASIGNACIÓN
  console.log('👥 Creando Tipos de Asignación...')
  const tiposAsignacion = [
    'Tutor de aula',
    'Docente temporal',
    'Asistente de docente'
  ]

  for (const nombreTipo of tiposAsignacion) {
    await prisma.tipoAsignacion.upsert({
      where: { nombre: nombreTipo },
      update: {},
      create: { nombre: nombreTipo }
    })
  }
  console.log('✅ Tipos de Asignación creados')

  // 9. ESTADOS DE RETIRO
  console.log('🚪 Creando Estados de Retiro...')
  const estadosRetiro = [
    { codigo: 'RETIRADO', nombre: 'Retirado' },
    { codigo: 'PENDIENTE', nombre: 'Pendiente' },
    { codigo: 'AUTORIZADO', nombre: 'Autorizado' },
    { codigo: 'RECHAZADO', nombre: 'Rechazado' }
  ]

  for (const estado of estadosRetiro) {
    await prisma.estadoRetiro.upsert({
      where: { codigo: estado.codigo },
      update: {},
      create: {
        codigo: estado.codigo,
        nombre: estado.nombre
      }
    })
  }
  console.log('✅ Estados de Retiro creados')

  // 10. TIPOS DE JUSTIFICACIÓN
  console.log('📄 Creando Tipos de Justificación...')
  const tiposJustificacion = [
    { codigo: 'APROBADO', nombre: 'Aprobado' },
    { codigo: 'RECHAZADO', nombre: 'Rechazado' },
    { codigo: 'PENDIENTE', nombre: 'Pendiente' }
  ]

  for (const tipo of tiposJustificacion) {
    await prisma.tipoJustificacion.upsert({
      where: { codigo: tipo.codigo },
      update: {},
      create: {
        codigo: tipo.codigo,
        nombre: tipo.nombre
      }
    })
  }
  console.log('✅ Tipos de Justificación creados')

  // 11. ESTADOS DE ASISTENCIA (Adicional - útil para el sistema)
  console.log('✅ Creando Estados de Asistencia...')
  const estadosAsistencia = [
    { codigo: 'PRESENTE', nombre: 'Presente', afecta: true, requiere: false },
    { codigo: 'TARDANZA', nombre: 'Tardanza', afecta: true, requiere: false },
    { codigo: 'AUSENTE', nombre: 'Ausente', afecta: false, requiere: true },
    { codigo: 'JUSTIFICADO', nombre: 'Justificado', afecta: true, requiere: false }
  ]

  for (const estado of estadosAsistencia) {
    await prisma.estadoAsistencia.upsert({
      where: { codigo: estado.codigo },
      update: {},
      create: {
        codigo: estado.codigo,
        nombreEstado: estado.nombre,
        afectaAsistencia: estado.afecta,
        requiereJustificacion: estado.requiere,
        activo: true
      }
    })
  }
  console.log('✅ Estados de Asistencia creados')

  // 12. USUARIO ADMINISTRATIVO
  console.log('👨‍💼 Creando Usuario Administrativo...')
  
  // Buscar el rol administrativo
  const rolAdministrativo = await prisma.rol.findFirst({
    where: { nombre: 'ADMINISTRATIVO' }
  })

  // Verificar si ya existe un usuario administrativo
  const adminExistente = await prisma.usuario.findUnique({
    where: { dni: '12345678' }
  })

  if (!adminExistente) {
    // Hashear contraseña
    const passwordHash = await bcrypt.hash('admin123', 10)

    // Crear usuario administrativo
    const usuarioAdmin = await prisma.usuario.create({
      data: {
        nombre: 'Administrador',
        apellido: 'Sistema',
        dni: '12345678',
        email: 'admin@franciscobolognesi.edu.pe',
        telefono: '999999999',
        passwordHash: passwordHash,
        estado: 'ACTIVO',
        idIe: ie.idIe
      }
    })

    // Asignar rol administrativo
    await prisma.usuarioRol.create({
      data: {
        idUsuario: usuarioAdmin.idUsuario,
        idRol: rolAdministrativo!.idRol
      }
    })

    console.log('✅ Usuario Administrativo creado')
    console.log('📧 Email: admin@franciscobolognesi.edu.pe')
    console.log('🔑 Contraseña: admin123')
    console.log('📝 DNI: 12345678')
  } else {
    console.log('ℹ️  Usuario Administrativo ya existe')
  }

  console.log('🎉 Seed completado exitosamente!')
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
